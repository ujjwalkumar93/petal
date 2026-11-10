/**
 * GenericForm without the Frappe-compatible runtime: Petal's own form engine
 * (load, defaults, validation, save, submit, cancel, amend, duplicate, delete)
 * against a fake Frappe client.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }
let search = new URLSearchParams()
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => search,
  usePathname: () => "/form/ToDo/new",
}))
vi.mock("@/hooks/useRealtime", () => ({ useRealtimeDoc: () => {}, useRealtimeList: () => {}, getRealtimeClient: async () => null }))

type Meta = { name: string; fields: Record<string, unknown>[]; is_submittable?: 0 | 1; issingle?: 0 | 1 }
const TODO: Meta = {
  name: "ToDo",
  is_submittable: 1,
  fields: [
    { fieldname: "description", fieldtype: "Data", label: "Description", reqd: 1 },
    { fieldname: "status", fieldtype: "Select", label: "Status", options: "Open\nClosed", default: "Open" },
    { fieldname: "notes", fieldtype: "Small Text", label: "Notes", depends_on: "eval:doc.status=='Closed'" },
  ].map((f, i) => ({ ...f, idx: i + 1, parent: "ToDo" })),
}

const client = {
  callMethod: vi.fn(),
  getDoc: vi.fn(),
  getList: vi.fn(async () => []),
  saveDoc: vi.fn(),
  invalidate: vi.fn(),
  uploadFile: vi.fn(),
  getWorkflowTransitions: vi.fn(async () => []),
  getCount: vi.fn(async () => 0),
}
vi.mock("@/hooks/useFrappe", () => ({ useFrappe: () => client, getFrappeClient: () => client }))

const { usePetalStore } = await import("@/store/petal-store")
const { prefillKey } = await import("@/lib/doc/doc-utils")
const { GenericForm } = await import("./GenericForm")

function serve(meta: Meta, doc: Record<string, unknown> | null) {
  client.callMethod.mockImplementation(async (method: string, args: Record<string, unknown>) => {
    if (method === "frappe.desk.form.load.getdoctype") return { docs: [meta] }
    if (method === "frappe.client.submit") return { ...(args.doc as object), docstatus: 1 }
    return {}
  })
  client.getDoc.mockImplementation(async () => { if (!doc) throw new Error("404"); return doc })
}

const saved = (over: Record<string, unknown> = {}) => ({
  doctype: "ToDo", name: "TD-0001", description: "Buy milk", status: "Open", docstatus: 0,
  modified: "2026-11-10 10:00:00", owner: "jane@example.com", creation: "2026-11-10 09:00:00", ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
  search = new URLSearchParams()
  sessionStorage.clear()
  usePetalStore.setState({
    hooks: {} as never,
    hooksReady: true,
    user: { name: "jane@example.com", email: "jane@example.com", full_name: "Jane", first_name: "Jane", username: "jane", user_type: "System User", roles: ["System Manager"] },
    authStatus: "authenticated",
    settings: {},
  })
})
afterEach(cleanup)

const input = (fieldname: string) => document.getElementById(`field-input-${fieldname}`) as HTMLInputElement | null

describe("GenericForm — new document", () => {
  it("fills defaults, refuses to save without required fields, then creates the doc and moves to its URL", async () => {
    serve(TODO, null)
    client.saveDoc.mockResolvedValue(saved())
    render(<GenericForm doctype="ToDo" name="new" />)

    await screen.findByText("Description")
    expect(client.getDoc).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTitle(/^Save/))
    expect(await screen.findByText("1 required field is missing")).toBeTruthy()
    expect(client.saveDoc).not.toHaveBeenCalled()

    fireEvent.change(input("description")!, { target: { value: "Buy milk" } })
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)) })

    await waitFor(() => expect(client.saveDoc).toHaveBeenCalledTimes(1))
    expect(client.saveDoc.mock.calls[0]![0]).toMatchObject({ doctype: "ToDo", description: "Buy milk", status: "Open" })
    expect(client.saveDoc.mock.calls[0]![0]).not.toHaveProperty("name")
    expect(router.replace).toHaveBeenCalledWith("/form/ToDo/TD-0001")
    expect(await screen.findByText("ToDo created")).toBeTruthy()
  })

  it("returns to the form that asked for a quick create, with the new name", async () => {
    search = new URLSearchParams({ returnTo: "/form/Project/P-1", returnField: "todo" })
    serve(TODO, null)
    client.saveDoc.mockResolvedValue(saved())
    render(<GenericForm doctype="ToDo" name="new" />)
    await screen.findByText("Description")
    fireEvent.change(input("description")!, { target: { value: "Buy milk" } })
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)) })
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/form/Project/P-1?focusField=todo&focusValue=TD-0001"))
  })

  it("ignores an off-site returnTo", async () => {
    search = new URLSearchParams({ returnTo: "https://evil.example/", returnField: "todo" })
    serve(TODO, null)
    client.saveDoc.mockResolvedValue(saved())
    render(<GenericForm doctype="ToDo" name="new" />)
    await screen.findByText("Description")
    fireEvent.change(input("description")!, { target: { value: "x" } })
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)) })
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/form/ToDo/TD-0001"))
  })

  it("merges values handed over by Quick Entry's 'Edit full form'", async () => {
    serve(TODO, null)
    sessionStorage.setItem(prefillKey("ToDo"), JSON.stringify({ description: "From quick entry" }))
    render(<GenericForm doctype="ToDo" name="new" />)
    await waitFor(() => expect(input("description")?.value).toBe("From quick entry"))
  })

  it("shows a save error from the server", async () => {
    serve(TODO, null)
    client.saveDoc.mockRejectedValue(new Error("Duplicate entry"))
    render(<GenericForm doctype="ToDo" name="new" />)
    await screen.findByText("Description")
    fireEvent.change(input("description")!, { target: { value: "x" } })
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)) })
    expect(await screen.findByText("Duplicate entry")).toBeTruthy()
    expect(router.replace).not.toHaveBeenCalled()
  })
})

describe("GenericForm — saved document", () => {
  it("shows the doc read-only, edits and saves it with its name", async () => {
    serve(TODO, saved())
    client.saveDoc.mockImplementation(async (d: Record<string, unknown>) => saved(d))
    render(<GenericForm doctype="ToDo" name="TD-0001" />)

    expect(await screen.findByText("Buy milk")).toBeTruthy()
    expect(input("description")).toBeNull()
    expect(client.getDoc).toHaveBeenCalledWith("ToDo", "TD-0001")

    fireEvent.click(screen.getByTitle(/^Edit/))
    fireEvent.change(input("description")!, { target: { value: "Buy oat milk" } })
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)) })

    await waitFor(() => expect(client.saveDoc).toHaveBeenCalledWith(expect.objectContaining({ doctype: "ToDo", name: "TD-0001", description: "Buy oat milk" })))
    expect(await screen.findByText("Document saved")).toBeTruthy()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("discards edits", async () => {
    serve(TODO, saved())
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    fireEvent.click(screen.getByTitle(/^Edit/))
    fireEvent.click(screen.getByTitle(/^Discard/))
    expect(input("description")).toBeNull()
  })

  it("shows a field only while its depends_on holds", async () => {
    serve(TODO, saved({ status: "Closed", notes: "done" }))
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    expect(await screen.findByText("Notes")).toBeTruthy()
    cleanup()
    serve(TODO, saved({ status: "Open", notes: "hidden" }))
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    expect(screen.queryByText("Notes")).toBeNull()
  })

  it("submits a draft of a submittable doctype", async () => {
    serve(TODO, saved())
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Submit" })) })
    expect(client.callMethod).toHaveBeenCalledWith("frappe.client.submit", { doc: expect.objectContaining({ doctype: "ToDo", name: "TD-0001" }) })
    expect(await screen.findByText("Document submitted")).toBeTruthy()
    expect(client.invalidate).toHaveBeenCalledWith("ToDo")
    // Submitted: no more Edit, Cancel instead
    expect(screen.queryByTitle(/^Edit/)).toBeNull()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy()
  })

  it("cancels a submitted doc", async () => {
    serve(TODO, saved({ docstatus: 1 }))
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Cancel" })) })
    expect(client.callMethod).toHaveBeenCalledWith("frappe.client.cancel", { doctype: "ToDo", name: "TD-0001" })
    expect(await screen.findByText("Document cancelled")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Amend" })).toBeTruthy()
  })

  it("reports a failed submit", async () => {
    serve(TODO, saved())
    client.callMethod.mockImplementation(async (method: string) => {
      if (method === "frappe.desk.form.load.getdoctype") return { docs: [TODO] }
      if (method === "frappe.client.submit") throw new Error("Not permitted")
      return {}
    })
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Submit" })) })
    expect(await screen.findByText("Not permitted")).toBeTruthy()
  })

  it("amends a cancelled doc into a new draft linked by amended_from", async () => {
    serve(TODO, saved({ docstatus: 2 }))
    render(<GenericForm doctype="ToDo" name="TD-0001" />)
    await screen.findByText("Buy milk")
    fireEvent.click(screen.getByRole("button", { name: "Amend" }))
    expect(router.push).toHaveBeenCalledWith("/form/ToDo/new")
    const prefill = JSON.parse(sessionStorage.getItem(prefillKey("ToDo")) ?? "{}")
    expect(prefill).toMatchObject({ amended_from: "TD-0001", description: "Buy milk" })
    expect(prefill).not.toHaveProperty("name")
  })

  it("says so when the document can't be loaded", async () => {
    serve(TODO, null)
    render(<GenericForm doctype="ToDo" name="MISSING" />)
    expect(await screen.findByText("Could not load this document.")).toBeTruthy()
  })
})
