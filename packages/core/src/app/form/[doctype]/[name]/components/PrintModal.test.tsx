import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

let formats: { name: string }[]
let letterheads: { name: string; is_default?: number }[]
const client = {
  getList: vi.fn(async ({ doctype }: { doctype: string }) => (doctype === "Print Format" ? formats : letterheads)),
}
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client }))

const { PrintModal } = await import("./PrintModal")

const preview = () => screen.getByTitle("Print Preview") as HTMLIFrameElement
const query = (src: string) => Object.fromEntries(new URL(src, "http://petal.test").searchParams)

beforeEach(() => {
  vi.clearAllMocks()
  formats = [{ name: "Standard" }, { name: "GST Invoice" }]
  letterheads = [{ name: "Head Office" }, { name: "Branch", is_default: 1 }]
})
afterEach(cleanup)

describe("PrintModal", () => {
  it("previews the doctype's default format with the default letter head, through the proxy", async () => {
    render(<PrintModal doctype="Sales Invoice" name="SINV/0001" defaultFormat="GST Invoice" onClose={vi.fn()} />)

    const format = await screen.findByLabelText("Print format") as HTMLSelectElement
    expect([...format.options].map((o) => o.value)).toEqual(["Standard", "GST Invoice"])
    expect(format.value).toBe("GST Invoice")
    expect((screen.getByLabelText("Letter head") as HTMLSelectElement).value).toBe("Branch")

    const src = preview().getAttribute("src")!
    expect(src.startsWith("/api/v1/printview?")).toBe(true)
    expect(query(src)).toEqual({ doctype: "Sales Invoice", name: "SINV/0001", format: "GST Invoice", no_letterhead: "0", letterhead: "Branch" })
    expect(query(screen.getByRole("link", { name: "PDF" }).getAttribute("href")!)).toMatchObject({ format: "GST Invoice", letterhead: "Branch" })
    expect(client.getList).toHaveBeenCalledWith(expect.objectContaining({
      doctype: "Print Format",
      filters: [["Print Format", "doc_type", "=", "Sales Invoice"], ["Print Format", "disabled", "=", 0]],
    }))
  })

  it("falls back to Standard when the default format is disabled or gone", async () => {
    formats = []
    render(<PrintModal doctype="ToDo" name="T1" defaultFormat="Old Format" onClose={vi.fn()} />)
    expect(((await screen.findByLabelText("Print format")) as HTMLSelectElement).value).toBe("Standard")
    expect(query(preview().getAttribute("src")!).format).toBe("Standard")
  })

  it("reloads the preview for another format or no letter head", async () => {
    render(<PrintModal doctype="ToDo" name="T1" onClose={vi.fn()} />)
    fireEvent.change(await screen.findByLabelText("Print format"), { target: { value: "GST Invoice" } })
    fireEvent.change(screen.getByLabelText("Letter head"), { target: { value: "" } })
    const q = query(preview().getAttribute("src")!)
    expect(q).toMatchObject({ format: "GST Invoice", no_letterhead: "1" })
    expect(q).not.toHaveProperty("letterhead")
  })

  it("hides the letter head picker when there are none, and still previews if the lookups fail", async () => {
    client.getList.mockRejectedValue(new Error("403"))
    render(<PrintModal doctype="ToDo" name="T1" onClose={vi.fn()} />)
    await screen.findByLabelText("Print format")
    expect(screen.queryByLabelText("Letter head")).toBeNull()
    expect(query(preview().getAttribute("src")!)).toMatchObject({ format: "Standard", no_letterhead: "1" })
  })

  it("prints the loaded preview, and closes with the button or Escape", async () => {
    const onClose = vi.fn()
    render(<PrintModal doctype="ToDo" name="T1" onClose={onClose} />)
    await screen.findByLabelText("Print format")
    const print = screen.getByRole("button", { name: "Print" }) as HTMLButtonElement
    expect(print.disabled).toBe(true)

    fireEvent.load(preview())
    expect(print.disabled).toBe(false)
    const win = preview().contentWindow!
    vi.spyOn(win, "focus").mockImplementation(() => {})
    const printSpy = vi.spyOn(win, "print").mockImplementation(() => {})
    fireEvent.click(print)
    expect(printSpy).toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
