/**
 * Smoke flows through Petal against a real Frappe bench: sign in, create a
 * document, edit and save it, attach a binary file and read the same bytes
 * back, filter a list, and open the print preview.
 *
 * Uses the core "Note" doctype, so any Frappe site works. Records it creates
 * are deleted afterwards. Skipped unless PETAL_E2E_URL is set (see
 * playwright.config.ts).
 */
import { expect, test, type Page } from "@playwright/test"

const URL = process.env.PETAL_E2E_URL
const USER = process.env.PETAL_E2E_USER ?? "Administrator"
const PASSWORD = process.env.PETAL_E2E_PASSWORD ?? ""

test.skip(!URL, "Set PETAL_E2E_URL (and PETAL_E2E_USER / PETAL_E2E_PASSWORD) to run the smoke tests")
test.describe.configure({ mode: "serial" })

const run = Date.now().toString(36)
const TITLE = `Petal smoke ${run}`
const EDITED = `${TITLE} edited`
// Every byte value, so any text decoding or re-encoding on the way shows up.
const BYTES = Buffer.from(Array.from({ length: 512 }, (_, i) => i % 256))
const FILE_NAME = `petal-smoke-${run}.bin`

let page: Page
let docUrl = ""

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  // Best-effort cleanup through the proxy, as the app itself would call it.
  const name = docUrl ? decodeURIComponent(docUrl.split("/").pop() ?? "") : ""
  if (name) {
    const csrf = await page.request.get("/api/v1/auth/csrf").then((r) => r.json()).catch(() => ({}))
    await page.request.post("/api/v1/exec", {
      headers: { "X-Method": "frappe.client.delete", "X-CSRF-Token": String(csrf.message ?? "") },
      data: { doctype: "Note", name },
    }).catch(() => {})
  }
  await page.close()
})

test("signs in", async () => {
  await page.goto("/login")
  await page.getByLabel("Email or Username").fill(USER)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).not.toHaveURL(/\/login/)
})

test("creates a document", async () => {
  await page.goto("/form/Note/new")
  await page.locator("#field-input-title").fill(TITLE)
  await page.getByTitle(/^Save/).click()
  await expect(page).not.toHaveURL(/\/form\/Note\/new/)
  await expect(page.getByText("Note created")).toBeVisible()
  docUrl = new globalThis.URL(page.url()).pathname
})

test("edits and saves it", async () => {
  await page.getByTitle(/^Edit/).click()
  await page.locator("#field-input-title").fill(EDITED)
  await page.getByTitle(/^Save/).click()
  await expect(page.getByText("Document saved")).toBeVisible()

  await page.reload()
  await expect(page.getByText(EDITED).first()).toBeVisible()
})

test("attaches a binary file and serves back the same bytes", async () => {
  await page.locator('input[type="file"][aria-label="Attach file"]').setInputFiles({
    name: FILE_NAME,
    mimeType: "application/octet-stream",
    buffer: BYTES,
  })
  const link = page.getByRole("region", { name: "Attachments" }).getByRole("link", { name: FILE_NAME })
  await expect(link).toBeVisible()

  const href = await link.getAttribute("href")
  expect(href).toBeTruthy()
  const res = await page.request.get(href!)
  expect(res.status()).toBe(200)
  expect(Buffer.from(await res.body()).equals(BYTES)).toBe(true)
})

test("filters a list", async () => {
  await page.goto("/list/Note")
  await page.getByRole("button", { name: /^Filters/ }).click()
  await page.getByRole("button", { name: /Add filter/ }).click()
  await page.getByPlaceholder("Field…").last().click()
  await page.getByPlaceholder("Field…").last().fill("Title")
  await page.getByRole("button", { name: "Title", exact: true }).click()
  await page.getByPlaceholder("Value…").last().fill(EDITED)
  await page.getByRole("button", { name: "Apply" }).click()

  // Only the matching note is left (titles are unique per run).
  const rows = page.locator("table tbody tr")
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText(EDITED)
  await expect(page.getByText("1 record", { exact: true })).toBeVisible()
})

test("opens the print preview", async () => {
  await page.goto(docUrl)
  await page.getByTitle("Print").click()
  const preview = page.frameLocator('iframe[title="Print Preview"]')
  await expect(preview.locator("body")).toContainText(EDITED)
  await expect(page.getByRole("button", { name: "Print" })).toBeEnabled()
  await expect(page.getByRole("link", { name: "PDF" })).toHaveAttribute("href", /\/api\/v1\/print\/pdf\?/)
})
