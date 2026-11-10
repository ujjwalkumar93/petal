import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }
let doctypeParam = "Task"
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => ({ doctype: encodeURIComponent(doctypeParam) }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => `/list/${doctypeParam}`,
}))
vi.mock("@/hooks/useRealtime", () => ({ useRealtimeDoc: () => {}, useRealtimeList: () => {}, getRealtimeClient: async () => null }))

type Meta = Record<string, unknown>
const TASK: Meta = {
  name: "Task",
  fields: [
    { fieldname: "subject", fieldtype: "Data", label: "Subject", in_list_view: 1, in_standard_filter: 1 },
    { fieldname: "status", fieldtype: "Select", label: "Status", options: "Open\nClosed", in_list_view: 1 },
  ],
}
const ROWS = [
  { name: "T-1", subject: "Write tests", status: "Open", modified: "2026-11-10 10:00:00", docstatus: 0 },
  { name: "T/2#b", subject: "Ship it", status: "Closed", modified: "2026-11-10 11:00:00", docstatus: 0 },
]

let meta: Meta | null = TASK
const client = {
  callMethod: vi.fn(async (method: string) => {
    if (method === "frappe.desk.form.load.getdoctype") {
      if (!meta) throw new Error("403")
      return { docs: [meta] }
    }
    if (method === "frappe.client.get_count") return ROWS.length
    return {}
  }),
  getList: vi.fn(async () => ROWS),
  saveDoc: vi.fn(async (d: Record<string, unknown>) => ({ ...d, name: "T-3" })),
  invalidate: vi.fn(),
  bulkAction: vi.fn(async () => []),
}
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client, getFrappeClient: () => client }))

const { usePetalStore } = await import("@/store/petal-store")
const { default: ListPage } = await import("./page")

beforeEach(() => {
  vi.clearAllMocks()
  doctypeParam = "Task"
  meta = TASK
  usePetalStore.setState({ hooks: {} as never, hooksReady: true, settings: {} })
})
afterEach(cleanup)

describe("List page", () => {
  it("lists rows with their total, skipping the GET cache", async () => {
    render(<ListPage />)
    expect((await screen.findAllByText("Write tests"))[0]).toBeTruthy()
    expect(screen.getAllByText("Ship it").length).toBeGreaterThan(0)

    expect(client.invalidate).toHaveBeenCalledWith("/doc/Task?")
    expect(client.getList).toHaveBeenCalledWith(expect.objectContaining({ doctype: "Task", filters: [] }))
    expect(client.callMethod).toHaveBeenCalledWith("frappe.client.get_count", { doctype: "Task", filters: [] })
  })

  it("passes a standard filter to both the list and the count", async () => {
    render(<ListPage />)
    await screen.findAllByText("Write tests")
    fireEvent.change(screen.getByPlaceholderText("Subject…"), { target: { value: "Ship" } })

    await waitFor(() => {
      const last = client.getList.mock.calls.at(-1)![0] as { filters: unknown[] }
      expect(last.filters).toHaveLength(1)
      expect(JSON.stringify(last.filters)).toContain("Ship")
    })
    const counted = client.callMethod.mock.calls.filter(([m]) => m === "frappe.client.get_count").at(-1)!
    expect(JSON.stringify(counted[1])).toContain("Ship")
  })

  it("opens a row's form, encoding its name", async () => {
    render(<ListPage />)
    fireEvent.click((await screen.findAllByText("Ship it"))[0])
    expect(router.push).toHaveBeenCalledWith("/form/Task/T%2F2%23b")
  })

  it("opens the full form for New when the doctype has no quick entry", async () => {
    render(<ListPage />)
    await screen.findAllByText("Write tests")
    fireEvent.click(screen.getByRole("button", { name: /^Create Task/ }))
    expect(router.push).toHaveBeenCalledWith("/form/Task/new")
  })

  it("creates through Quick Entry when the doctype allows it", async () => {
    meta = { ...TASK, quick_entry: 1, fields: [{ fieldname: "subject", fieldtype: "Data", label: "Subject", reqd: 1, in_list_view: 1 }] }
    render(<ListPage />)
    await screen.findAllByText("Write tests")
    fireEvent.click(screen.getByRole("button", { name: /^Create Task/ }))

    const dialog = await screen.findByRole("dialog")
    const subject = await waitFor(() => {
      const el = dialog.querySelector("input")
      expect(el).not.toBeNull()
      return el!
    })
    fireEvent.change(subject, { target: { value: "From quick entry" } })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Save/ })) })

    expect(client.saveDoc).toHaveBeenCalledWith({ doctype: "Task", subject: "From quick entry" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("sends single doctypes to their only form", async () => {
    meta = { ...TASK, name: "System Settings", issingle: 1 }
    doctypeParam = "System Settings"
    render(<ListPage />)
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/form/System%20Settings/System%20Settings"))
    expect(client.getList).not.toHaveBeenCalled()
  })

  it("says so when the doctype's metadata can't be loaded", async () => {
    meta = null
    render(<ListPage />)
    expect(await screen.findByText("Could not load doctype metadata.")).toBeTruthy()
  })
})
