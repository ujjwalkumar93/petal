import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

let answer: () => unknown
const client = { callMethod: vi.fn(async () => answer()) }
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client }))

const { default: ReportsPage } = await import("./page")

const KEYS = ["name", "report_type", "ref_doctype", "module", "is_standard", "disabled"]
const ROWS = [
  ["General Ledger", "Script Report", "GL Entry", "Accounts", "Yes", 0],
  ["Sales Register", "Query Report", "Sales Invoice", "Accounts", "Yes", 0],
  ["Stock Ledger", "Script Report", "Stock Ledger Entry", "Stock", "Yes", 0],
  ["My Leads", "Report Builder", "Lead", "CRM", "No", 0],
]
const links = () => screen.getAllByRole("link").map((a) => a.textContent?.trim() ?? "")
const reportLinks = (name: string) => screen.queryAllByRole("link").filter((a) => a.getAttribute("href") === `/report/${encodeURIComponent(name)}`)

beforeEach(() => {
  vi.clearAllMocks()
  answer = () => ({ keys: KEYS, values: ROWS })
})
afterEach(cleanup)

describe("Reports page", () => {
  it("lists enabled reports from reportview's keys/values shape, linking each one", async () => {
    render(<ReportsPage />)
    await screen.findByText("General Ledger")
    expect(client.callMethod).toHaveBeenCalledWith("frappe.desk.reportview.get", expect.objectContaining({
      doctype: "Report", filters: JSON.stringify([["Report", "disabled", "=", 0]]),
    }))
    for (const [name] of ROWS) expect(reportLinks(String(name)).length).toBeGreaterThan(0)
    expect(screen.getByText("Accounts")).toBeTruthy()
    expect(screen.getByText("Stock")).toBeTruthy()
  })

  it("searches by name, doctype or module", async () => {
    render(<ReportsPage />)
    await screen.findByText("General Ledger")
    const search = screen.getByPlaceholderText("Search reports, doctypes, modules...")

    fireEvent.change(search, { target: { value: "sales invoice" } })
    expect(reportLinks("Sales Register").length).toBeGreaterThan(0)
    expect(reportLinks("General Ledger")).toHaveLength(0)

    fireEvent.change(search, { target: { value: "stock" } })
    expect(reportLinks("Stock Ledger").length).toBeGreaterThan(0)
    expect(reportLinks("My Leads")).toHaveLength(0)

    fireEvent.change(search, { target: { value: "nothing like this" } })
    expect(screen.getByText("No reports found")).toBeTruthy()
  })

  it("filters by report type and switches to the list view", async () => {
    render(<ReportsPage />)
    await screen.findByText("General Ledger")
    fireEvent.click(screen.getByRole("button", { name: /^Script Report/ }))
    expect(reportLinks("General Ledger").length).toBeGreaterThan(0)
    expect(reportLinks("Sales Register")).toHaveLength(0)

    const before = links().length
    fireEvent.click(screen.getByRole("button", { name: /^All/ }))
    fireEvent.click(screen.getByTitle("List view"))
    expect(links().length).toBeGreaterThan(before)
    expect(reportLinks("Sales Register").length).toBeGreaterThan(0)
  })

  it("accepts a plain array of reports, and shows none when the call fails", async () => {
    answer = () => [{ name: "Trial Balance", report_type: "Script Report", ref_doctype: "GL Entry", module: "Accounts", is_standard: "Yes", disabled: 0 }]
    render(<ReportsPage />)
    expect(await screen.findByText("Trial Balance")).toBeTruthy()
    cleanup()

    answer = () => { throw new Error("403") }
    render(<ReportsPage />)
    expect(await screen.findByText("No reports found")).toBeTruthy()
  })
})
