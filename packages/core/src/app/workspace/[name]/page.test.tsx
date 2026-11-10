import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => ({ name: "Accounting" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/workspace/Accounting",
}))
// The real chart draws SVG with frappe-charts; the page's job is the data it hands over.
vi.mock("@petal/ui/frappe-chart", () => ({
  FrappeChart: ({ data }: { data: { labels: string[]; datasets: { name: string; values: number[] }[] } }) => (
    <div data-testid="chart">{data.labels.join(",")}|{data.datasets.map((d) => d.values.join("+")).join(";")}</div>
  ),
}))

type Docs = Record<string, Record<string, Record<string, unknown>>>
let docs: Docs
let page: Record<string, unknown> | null
let calls: Record<string, (args: Record<string, unknown>) => unknown>

const client = {
  getDoc: vi.fn(async (doctype: string, name: string) => {
    const d = docs[doctype]?.[name]
    if (!d) throw new Error(`404 ${doctype}/${name}`)
    return d
  }),
  callMethod: vi.fn(async (method: string, args: Record<string, unknown>) => {
    if (method === "frappe.desk.desktop.get_desktop_page") {
      if (!page) throw new Error("403")
      return page
    }
    const h = calls[method]
    return h ? h(args) : null
  }),
  getList: vi.fn(async (_args: { doctype: string }) => [] as unknown[]),
  invalidate: vi.fn(),
}
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client, getFrappeClient: () => client }))

const { usePetalStore } = await import("@/store/petal-store")
const { default: WorkspacePage } = await import("./page")

const empty = { shortcuts: { items: [] }, cards: { items: [] }, charts: { items: [] }, number_cards: { items: [] } }
const chartItem = (chart_name: string) => ({ chart_name, label: null, width: "Full", name: `row-${chart_name}` })

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  usePetalStore.setState({ settings: {} })
  vi.spyOn(console, "error").mockImplementation(() => {})
  docs = { Workspace: { Accounting: { name: "Accounting", title: "Accounting", module: "Accounts", doctype: "Workspace" } } }
  page = empty
  calls = {}
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe("Workspace page — layout", () => {
  it("shows shortcuts and link cards with Petal routes, ordered as the workspace content says", async () => {
    docs.Workspace!.Accounting!.content = JSON.stringify([{ type: "card" }, { type: "shortcut" }])
    page = {
      ...empty,
      shortcuts: { items: [
        { name: "s1", label: "Sales Invoice", type: "DocType", link_to: "Sales Invoice", url: null, color: "Blue", format: null },
        { name: "s2", label: "Profit and Loss", type: "Report", link_to: "Profit and Loss Statement", url: null, color: null, format: null },
        { name: "s3", label: "Docs", type: "URL", link_to: null, url: "https://docs.example.com", color: null, format: null },
      ] },
      cards: { items: [
        { name: "c1", type: "Card Break", label: "Masters", link_type: null, link_to: null, hidden: 0, is_query_report: 0, description: null, links: [
          { name: "l1", type: "Link", label: "Customer", link_type: "DocType", link_to: "Customer", hidden: 0, is_query_report: 0, description: null },
          { name: "l2", type: "Link", label: "Secret", link_type: "DocType", link_to: "Secret", hidden: 1, is_query_report: 0, description: null },
          { name: "l3", type: "Link", label: "General Ledger", link_type: "Report", link_to: "General Ledger", hidden: 0, is_query_report: 1, description: null },
        ] },
      ] },
    }
    render(<WorkspacePage />)

    expect(await screen.findByRole("heading", { level: 1, name: "Accounting" })).toBeTruthy()
    expect(screen.getByText("Accounts")).toBeTruthy()
    expect(screen.getByRole("link", { name: /Sales Invoice/ }).getAttribute("href")).toBe("/list/Sales%20Invoice")
    expect(screen.getByRole("link", { name: /Profit and Loss/ }).getAttribute("href")).toBe("/report/Profit%20and%20Loss%20Statement")
    expect(screen.getByRole("link", { name: /Docs/ }).getAttribute("href")).toBe("https://docs.example.com")
    expect(screen.getByRole("link", { name: /Customer/ }).getAttribute("href")).toBe("/list/Customer")
    expect(screen.getByRole("link", { name: /General Ledger/ }).getAttribute("href")).toBe("/report/General%20Ledger")
    expect(screen.queryByText("Secret")).toBeNull()

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(["Reports & Masters", "Quick Access"])
  })

  it("says when a workspace has nothing in it", async () => {
    render(<WorkspacePage />)
    expect(await screen.findByText("No content found in this workspace.")).toBeTruthy()
  })

  it("says when the workspace can't be loaded", async () => {
    page = null
    render(<WorkspacePage />)
    expect(await screen.findByText("Workspace unavailable")).toBeTruthy()
    expect(screen.getByText("Could not load this workspace.")).toBeTruthy()
  })
})

describe("Workspace page — charts", () => {
  it("draws a doctype chart with its saved filters, and re-queries with the filters set in the dialog", async () => {
    docs["Dashboard Chart"] = { "Open Invoices": {
      name: "Open Invoices", chart_type: "Count", document_type: "Sales Invoice",
      time_interval: "Weekly", timespan: "Last Month",
      filters_json: JSON.stringify([["Sales Invoice", "status", "=", "Unpaid", false]]),
    } }
    docs.DocType = { "Sales Invoice": { name: "Sales Invoice", fields: [{ fieldname: "status", fieldtype: "Select", label: "Status", options: "Paid\nUnpaid" }] } }
    const get = vi.fn((_a: Record<string, unknown>) => ({ labels: ["W1", "W2"], datasets: [{ name: "Count", values: [3, 4] }] }))
    calls["frappe.desk.doctype.dashboard_chart.dashboard_chart.get"] = get
    page = { ...empty, charts: { items: [chartItem("Open Invoices")] } }

    render(<WorkspacePage />)
    expect((await screen.findByTestId("chart")).textContent).toBe("W1,W2|3+4")
    expect(get).toHaveBeenCalledWith({
      chart_name: "Open Invoices", refresh: 1, time_interval: "Weekly", timespan: "Last Month",
      filters: [["Sales Invoice", "status", "=", "Unpaid", false]],
    })

    fireEvent.click(screen.getByTitle("Set Filters"))
    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(within(dialog).getByText("Status")).toBeTruthy())
    fireEvent.change(within(dialog).getByRole("combobox"), { target: { value: "Paid" } })
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Apply" })) })

    await waitFor(() => expect(get).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: [["Sales Invoice", "status", "=", "Paid", false]],
    })))
    expect(client.invalidate).toHaveBeenCalledWith("exec:")
    expect(JSON.parse(sessionStorage.getItem("petal:chart-filters:Open Invoices")!)).toMatchObject({ activeFilters: { status: "Paid" } })
  })

  it("restores filters saved in this session", async () => {
    docs["Dashboard Chart"] = { Sales: { name: "Sales", chart_type: "Sum", document_type: "Sales Invoice" } }
    sessionStorage.setItem("petal:chart-filters:Sales", JSON.stringify({ activeFilters: { company: "ACME" }, timeInterval: "Daily", timespan: "Last Week" }))
    const get = vi.fn(() => ({ labels: ["d"], datasets: [{ name: "x", values: [1] }] }))
    calls["frappe.desk.doctype.dashboard_chart.dashboard_chart.get"] = get
    page = { ...empty, charts: { items: [chartItem("Sales")] } }

    render(<WorkspacePage />)
    await screen.findByTestId("chart")
    expect(get).toHaveBeenCalledWith(expect.objectContaining({
      time_interval: "Daily", timespan: "Last Week", filters: [["Sales Invoice", "company", "=", "ACME", false]],
    }))
  })

  it("runs a report chart with the default fiscal year and company filled in", async () => {
    docs["Dashboard Chart"] = { "P&L": {
      name: "P&L", chart_type: "Report", report_name: "Profit and Loss Statement",
      filters_json: JSON.stringify({ filter_based_on: "Fiscal Year", periodicity: "Yearly" }),
    } }
    docs.Report = { "Profit and Loss Statement": { name: "Profit and Loss Statement", filters: [{ fieldname: "company", label: "Company", fieldtype: "Link", options: "Company" }] } }
    client.getList.mockImplementation(async ({ doctype }: { doctype: string }) =>
      doctype === "Fiscal Year" ? [{ name: "2026-2027" }] : doctype === "GL Entry" ? [{ company: "ACME" }] : [])
    const run = vi.fn(() => ({ chart: { data: { labels: ["2026"], datasets: [{ name: "Income", values: [10] }] }, type: "bar" } }))
    calls["frappe.desk.query_report.run"] = run
    page = { ...empty, charts: { items: [chartItem("P&L")] } }

    render(<WorkspacePage />)
    expect((await screen.findByTestId("chart")).textContent).toBe("2026|10")
    expect(run).toHaveBeenCalledWith({
      report_name: "Profit and Loss Statement",
      filters: { filter_based_on: "Fiscal Year", periodicity: "Yearly", from_fiscal_year: "2026-2027", to_fiscal_year: "2026-2027", company: "ACME" },
      ignore_prepared_report: true,
    })
  })

  it("uses the configured default company instead of guessing", async () => {
    usePetalStore.setState({ settings: { defaultCompany: "Beta Ltd", defaultFiscalYear: "2025" } })
    docs["Dashboard Chart"] = { R: { name: "R", chart_type: "Report", report_name: "Rep", filters_json: JSON.stringify({ filter_based_on: "Fiscal Year" }) } }
    const run = vi.fn((_a: Record<string, unknown>) => ({ chart: { labels: ["a"], datasets: [{ name: "n", values: [1] }] } }))
    calls["frappe.desk.query_report.run"] = run
    page = { ...empty, charts: { items: [chartItem("R")] } }

    render(<WorkspacePage />)
    await screen.findByTestId("chart")
    expect(run.mock.calls[0]![0]).toMatchObject({ filters: { company: "Beta Ltd", from_fiscal_year: "2025", to_fiscal_year: "2025" } })
    expect(client.getList).not.toHaveBeenCalled()
  })

  it("explains a report that returns no chart", async () => {
    docs["Dashboard Chart"] = { R: { name: "R", chart_type: "Report", report_name: "Rep", filters_json: JSON.stringify({ company: "A" }) } }
    calls["frappe.desk.query_report.run"] = () => ({ result: [] })
    page = { ...empty, charts: { items: [chartItem("R")] } }
    render(<WorkspacePage />)
    expect(await screen.findByText("No chart data in report")).toBeTruthy()
  })

  it("explains a custom chart without a source", async () => {
    docs["Dashboard Chart"] = { C: { name: "C", chart_type: "Custom" } }
    page = { ...empty, charts: { items: [chartItem("C")] } }
    render(<WorkspacePage />)
    expect(await screen.findByText("Custom chart has no Dashboard Chart Source set")).toBeTruthy()
  })

  it("shows a chart that can't be loaded as an error, not a crash", async () => {
    page = { ...empty, charts: { items: [chartItem("Missing")] } }
    render(<WorkspacePage />)
    expect(await screen.findByText("404 Dashboard Chart/Missing")).toBeTruthy()
  })
})
