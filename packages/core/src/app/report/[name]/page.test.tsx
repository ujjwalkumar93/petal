import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

let reportName = "Sales Register"
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ name: encodeURIComponent(reportName) }),
  useSearchParams: () => new URLSearchParams(),
}))

let reportDoc: Record<string, unknown> | null
let script: { filters?: unknown[]; script?: string } | Error
let run: ReturnType<typeof vi.fn>
const client = {
  getDoc: vi.fn(async () => { if (!reportDoc) throw new Error("404"); return reportDoc }),
  callMethod: vi.fn(async (method: string, args: Record<string, unknown>) => {
    if (method === "frappe.desk.query_report.get_script") { if (script instanceof Error) throw script; return script }
    if (method === "frappe.desk.query_report.run") return run(args)
    return null
  }),
}
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client, getFrappeClient: () => client }))

const { usePetalStore } = await import("@/store/petal-store")
const { default: ReportPage } = await import("./page")

const COLUMNS = [
  { fieldname: "customer", label: "Customer", fieldtype: "Link", options: "Customer" },
  "Grand Total:Currency:120",
  "Paid:Check",
  "Qty:Int",
]

beforeEach(() => {
  vi.clearAllMocks()
  reportName = "Sales Register"
  usePetalStore.setState({ hooks: {} as never, hooksReady: true })
  reportDoc = { name: "Sales Register", report_type: "Query Report", ref_doctype: "Sales Invoice", module: "Accounts", filters_json: "[]" }
  script = {}
  run = vi.fn(() => ({
    columns: COLUMNS,
    result: [["ACME", 1234.5, 1, 3], ["Globex", 10, 0, 7]],
    total_row: ["Total", 1244.5, null, 10],
  }))
})
afterEach(cleanup)

describe("Report page", () => {
  it("runs a report without required filters at once and shows typed cells and the total", async () => {
    render(<ReportPage />)

    expect(await screen.findByText("ACME")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: "Sales Register" })).toBeTruthy()
    expect(screen.getByText("Sales Invoice")).toBeTruthy()
    // "Label:Fieldtype:Width" column strings
    expect(screen.getByText("Grand Total")).toBeTruthy()
    expect(screen.getByText((1234.5).toLocaleString(undefined, { minimumFractionDigits: 2 }))).toBeTruthy()
    expect(screen.getByText("Yes")).toBeTruthy()
    expect(screen.getByText("No")).toBeTruthy()
    expect(screen.getByText("Total")).toBeTruthy()
    expect(run).toHaveBeenCalledWith({ report_name: "Sales Register", filters: {}, ignore_prepared_report: 1 })
  })

  it("filters rows with the search box", async () => {
    render(<ReportPage />)
    await screen.findByText("ACME")
    fireEvent.change(screen.getByPlaceholderText("Search results…"), { target: { value: "glob" } })
    expect(screen.queryByText("ACME")).toBeNull()
    expect(screen.getByText("Globex")).toBeTruthy()
  })

  it("accepts rows as objects keyed by fieldname", async () => {
    run = vi.fn(() => ({ columns: [{ fieldname: "customer", label: "Customer", fieldtype: "Data" }, { fieldname: "qty", label: "Qty", fieldtype: "Int" }], result: [{ qty: 4, customer: "Initech" }] }))
    render(<ReportPage />)
    expect(await screen.findByText("Initech")).toBeTruthy()
    expect(screen.getByText("4")).toBeTruthy()
  })

  it("waits for required filters, then sends empty ones as null", async () => {
    reportDoc = { ...reportDoc, filters_json: JSON.stringify([
      { fieldname: "company", label: "Company", fieldtype: "Link", options: "Company", reqd: 1 },
      { fieldname: "status", label: "Status", fieldtype: "Select", options: "Paid\nUnpaid" },
      { fieldname: "from_date", label: "From", fieldtype: "Date", default: "2026-01-01" },
    ]) }
    render(<ReportPage />)

    const company = await screen.findByPlaceholderText("Company")
    expect(run).not.toHaveBeenCalled()

    // Filling the last required filter runs the report.
    await act(async () => { fireEvent.change(company, { target: { value: "ACME" } }) })

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1))
    expect(run).toHaveBeenCalledWith({
      report_name: "Sales Register",
      filters: { company: "ACME", status: null, from_date: "2026-01-01" },
      ignore_prepared_report: 1,
    })
  })

  it("reads a script report's filters from its JS source, skipping function-valued properties", async () => {
    reportDoc = { ...reportDoc, report_type: "Script Report", filters_json: undefined }
    script = { script: `
      frappe.query_reports["Sales Register"] = {
        filters: [
          { fieldname: "company", label: __("Company"), fieldtype: "Link", options: "Company", default: frappe.defaults.get_user_default("Company"), get_query: function() { return { filters: { is_group: 0 } } }, reqd: 1 },
          { fieldname: 'group_by', label: __('Group By'), fieldtype: 'Select', options: [{ value: "Customer", label: "Customer" }, { value: "Item", label: "Item" }], default: 'Customer', },
          { fieldname: "show_zero", label: "Show Zero", fieldtype: "Check", on_change: function(report) { report.refresh() } },
        ],
        formatter(value, row, column, data, default_formatter) { return default_formatter(value, row, column, data) },
      };` }
    render(<ReportPage />)

    expect(await screen.findByPlaceholderText("Company")).toBeTruthy()
    const groupBy = screen.getByRole("combobox") as HTMLSelectElement
    expect(groupBy.value).toBe("Customer")
    expect([...groupBy.options].map((o) => o.value)).toEqual(["", "Customer", "Item"])
    expect(screen.getByRole("checkbox")).toBeTruthy()
    expect(run).not.toHaveBeenCalled() // company is required and has no static default
  })

  it("uses filters the server already parsed", async () => {
    reportDoc = { ...reportDoc, report_type: "Script Report" }
    script = { filters: [{ fieldname: "item", label: "Item", fieldtype: "Data" }] }
    render(<ReportPage />)
    expect(await screen.findByPlaceholderText("Item")).toBeTruthy()
    await waitFor(() => expect(run).toHaveBeenCalledWith(expect.objectContaining({ filters: { item: null } })))
  })

  it("shows the server's error when the report fails", async () => {
    run = vi.fn(() => { throw new Error("Report timed out") })
    render(<ReportPage />)
    expect(await screen.findByText("Report timed out")).toBeTruthy()
  })

  it("says so when the report can't be found", async () => {
    reportDoc = null
    render(<ReportPage />)
    expect(await screen.findByText("Could not load report metadata.")).toBeTruthy()
  })
})
