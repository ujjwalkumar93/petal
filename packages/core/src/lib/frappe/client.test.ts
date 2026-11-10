import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { FrappeClient } from "./client"

type Call = { url: string; init: RequestInit }
let calls: Call[]
let responses: Array<() => Response>

function json(body: unknown, status = 200) {
  return () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

beforeEach(() => {
  calls = []
  responses = []
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const next = responses.shift()
    if (!next) throw new Error(`unexpected fetch ${url}`)
    return next()
  }))
})
afterEach(() => vi.unstubAllGlobals())

const body = (i = 0) => JSON.parse(String(calls[i]!.init.body)) as Record<string, unknown>
const header = (i: number, h: string) => (calls[i]!.init.headers as Record<string, string>)[h]

describe("FrappeClient requests", () => {
  it("unwraps data/message and strips a trailing slash from the base URL", async () => {
    const c = new FrappeClient("/api/v1/")
    responses.push(json({ data: { name: "U1" } }), json({ message: 42 }))
    expect(await c.getDoc("User", "U1")).toEqual({ name: "U1" })
    expect(await c.callMethod("frappe.client.get_count", { doctype: "User" })).toBe(42)
    expect(calls[0]!.url).toBe("/api/v1/doc/User/U1")
    expect(calls[1]!.url).toBe("/api/v1/exec")
    expect(header(1, "X-Method")).toBe("frappe.client.get_count")
  })

  it("caches GETs for 30s and de-duplicates concurrent identical requests", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { a: 1 } }))
    const [a, b] = await Promise.all([c.getDoc("X", "1"), c.getDoc("X", "1")])
    expect(a).toEqual(b)
    await c.getDoc("X", "1")
    expect(calls).toHaveLength(1)
  })

  it("invalidates cached entries by pattern and after writes", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { v: 1 } }), json({ data: { name: "1" } }), json({ data: { v: 2 } }))
    await c.getDoc("X", "1")
    await c.saveDoc({ doctype: "X", name: "1" })
    expect(await c.getDoc("X", "1")).toEqual({ v: 2 })
    expect(calls).toHaveLength(3)
  })

  it("never caches POSTs", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: 1 }), json({ message: 2 }))
    await c.callMethod("m.x")
    expect(await c.callMethod("m.x")).toBe(2)
  })

  it("encodes list params", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: [] }))
    await c.getList({ doctype: "ToDo", fields: ["name", "status"], filters: [["status", "=", "Open"]] as never, limit: 5, order_by: "modified desc" })
    const u = new URL(calls[0]!.url, "http://x")
    expect(u.pathname).toBe("/api/v1/doc/ToDo")
    expect(JSON.parse(u.searchParams.get("fields")!)).toEqual(["name", "status"])
    expect(u.searchParams.get("limit")).toBe("5")
    expect(u.searchParams.get("order_by")).toBe("modified desc")
    expect(u.searchParams.has("or_filters")).toBe(false)
  })

  it("uses POST for new docs and PUT for existing ones", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { name: "N1" } }), json({ data: { name: "N1" } }))
    await c.saveDoc({ doctype: "Note", title: "a" })
    await c.saveDoc({ doctype: "Note", name: "N1", title: "b" })
    expect([calls[0]!.init.method, calls[0]!.url]).toEqual(["POST", "/api/v1/doc/Note"])
    expect([calls[1]!.init.method, calls[1]!.url]).toEqual(["PUT", "/api/v1/doc/Note/N1"])
  })
})

describe("FrappeClient errors", () => {
  it("extracts the user-facing message from _server_messages", async () => {
    const c = new FrappeClient("/api/v1")
    const inner = JSON.stringify({ message: "<details><summary>Name is required</summary>trace</details>" })
    responses.push(json({ _server_messages: JSON.stringify([inner]) }, 417))
    await expect(c.callMethod("x.y")).rejects.toThrow("Name is required")
  })

  it("falls back to the exception text, then the status line", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ exception: "frappe.exceptions.PermissionError: Not allowed" }, 403))
    await expect(c.callMethod("x.y")).rejects.toThrow("Not allowed")
    responses.push(() => new Response("oops", { status: 500, statusText: "Server Error" }))
    await expect(c.callMethod("x.y")).rejects.toThrow("500 Server Error (/exec)")
  })
})

describe("CSRF", () => {
  it("fetches the token once and sends it on writes only", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "tok123" }))
    await Promise.all([c.initCSRF(), c.initCSRF()])
    expect(calls.filter((x) => x.url.endsWith("/auth/csrf"))).toHaveLength(1)
    responses.push(json({ data: {} }), json({ message: null }))
    await c.getDoc("X", "1")
    await c.callMethod("a.b")
    expect(header(1, "X-CSRF-Token")).toBeUndefined()
    expect(header(2, "X-CSRF-Token")).toBe("tok123")
  })

  it("survives a failed CSRF fetch", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ error: "no" }, 401))
    await expect(c.initCSRF()).resolves.toBeUndefined()
  })
})

describe("new API helpers", () => {
  it("setValue sends a fieldname dict and invalidates the doctype", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { v: 1 } }), json({ message: {} }), json({ data: { v: 2 } }))
    await c.getDoc("Task", "T1")
    await c.setValue("Task", "T1", { status: "Closed" })
    expect(body(1)).toEqual({ doctype: "Task", name: "T1", fieldname: { status: "Closed" } })
    expect(header(1, "X-Method")).toBe("frappe.client.set_value")
    expect(await c.getDoc("Task", "T1")).toEqual({ v: 2 })
  })

  it("getDocInfo reads the top-level docinfo key", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ docinfo: { comments: [{ name: "C1" }] } }))
    expect(await c.getDocInfo("Task", "T1")).toEqual({ comments: [{ name: "C1" }] })
  })

  it("bulkAction JSON-encodes names and data and returns failures", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: ["T2"] }), json({ message: null }))
    expect(await c.bulkAction("Task", ["T1", "T2"], "update", { status: "Open" })).toEqual(["T2"])
    expect(body(0)).toEqual({ doctype: "Task", docnames: '["T1","T2"]', action: "update", data: '{"status":"Open"}' })
    expect(await c.bulkAction("Task", ["T1"], "submit")).toEqual([])
  })

  it("insertMany, workflow and assignment calls hit the right methods", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: ["A"] }), json({ message: [{ action: "Approve", next_state: "Approved" }] }), json({ message: { name: "D" } }), json({ message: null }), json({ message: null }))
    await c.insertMany([{ doctype: "Task", subject: "x" }])
    expect(await c.getWorkflowTransitions({ doctype: "Leave", name: "L1" })).toHaveLength(1)
    await c.applyWorkflow({ doctype: "Leave", name: "L1" }, "Approve")
    await c.assign("Task", "T1", ["a@x.com"])
    await c.unassign("Task", "T1", "a@x.com")
    expect(calls.map((x, i) => header(i, "X-Method"))).toEqual([
      "frappe.client.insert_many",
      "frappe.model.workflow.get_transitions",
      "frappe.model.workflow.apply_workflow",
      "frappe.desk.form.assign_to.add",
      "frappe.desk.form.assign_to.remove",
    ])
    expect(body(2)).toEqual({ doc: '{"doctype":"Leave","name":"L1"}', action: "Approve" })
    expect(body(3).assign_to).toBe('["a@x.com"]')
  })
})

describe("auth", () => {
  it("rejects Guest sessions", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "Guest" }))
    await expect(c.getLoggedInUser()).rejects.toThrow("Not authenticated")
  })

  it("maps the User doc and its roles", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "a@x.com" }), json({ data: { name: "a@x.com", email: "a@x.com", full_name: "A", roles: [{ role: "System Manager" }] } }))
    expect(await c.getLoggedInUser()).toMatchObject({ name: "a@x.com", roles: ["System Manager"] })
  })
})

describe("waitFor gate", () => {
  it("holds requests until the gate settles, then applies config set in the meantime", async () => {
    const c = new FrappeClient("/api/v1")
    let release!: () => void
    const ready = new Promise<void>((r) => { release = r })
    c.waitFor(ready)
    responses.push(json({ message: 1 }))
    const pending = c.callMethod("a.b")
    await Promise.resolve()
    expect(calls).toHaveLength(0)
    c.applyConfig({ beforeRequest: async (o) => ({ ...o, headers: { ...(o.headers as Record<string, string>), "X-App": "billing" } }) })
    release()
    await pending
    expect(calls).toHaveLength(1)
    expect(header(0, "X-App")).toBe("billing")
  })

  it("releases requests even when the gate rejects", async () => {
    const c = new FrappeClient("/api/v1")
    c.waitFor(Promise.reject(new Error("apps failed")))
    responses.push(json({ message: 2 }))
    await expect(c.callMethod("a.b")).resolves.toBe(2)
  })
})

describe("FrappeClient session handling", () => {
  it("reports 401/403 to auth-failure listeners, but not a failed login", async () => {
    const c = new FrappeClient("/api/v1")
    const seen: number[] = []
    c.onAuthFailure((s) => seen.push(s))
    responses.push(json({ exc_type: "PermissionError" }, 403), json({ message: "Invalid login" }, 401), json({}, 500))

    await expect(c.getDoc("Item", "I-1")).rejects.toThrow()
    await expect(c.login("a@b.c", "wrong")).rejects.toThrow()
    await expect(c.getDoc("Item", "I-2")).rejects.toThrow()

    expect(seen).toEqual([403])
  })

  it("stops notifying after unsubscribe", async () => {
    const c = new FrappeClient("/api/v1")
    const listener = vi.fn()
    c.onAuthFailure(listener)()
    responses.push(json({}, 403))

    await expect(c.getDoc("Item", "I-1")).rejects.toThrow()
    expect(listener).not.toHaveBeenCalled()
  })

  it("getSessionUser bypasses the response cache", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "Administrator" }), json({ message: "Guest" }))

    expect(await c.getSessionUser()).toBe("Administrator")
    expect(await c.getSessionUser()).toBe("Guest")
    expect(calls[0]!.init.cache).toBe("no-store")
  })

  it("resetSession drops cached responses so the next user refetches", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { name: "I-1", owner: "alice" } }), json({ data: { name: "I-1", owner: "bob-view" } }))

    await c.getDoc("Item", "I-1")
    await c.getDoc("Item", "I-1") // served from cache
    expect(calls).toHaveLength(1)

    c.resetSession()
    expect(await c.getDoc("Item", "I-1")).toMatchObject({ owner: "bob-view" })
    expect(calls).toHaveLength(2)
  })

  it("logout clears the cache", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { name: "I-1" } }), json({ message: "ok" }), json({ data: { name: "I-1" } }))

    await c.getDoc("Item", "I-1")
    await c.logout()
    await c.getDoc("Item", "I-1")
    expect(calls.map((x) => x.url)).toEqual(["/api/v1/doc/Item/I-1", "/api/v1/auth/logout", "/api/v1/doc/Item/I-1"])
  })
})

describe("FrappeClient path encoding (#19)", () => {
  // Real-world names: Indian invoice series, user emails, names with slashes.
  const NAME = "INV#1?a=b%20/2024"
  const ENCODED = "INV%231%3Fa%3Db%2520%2F2024"

  it("encodes doctype and name in getDoc, saveDoc, deleteDoc and getList", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: {} }), json({ data: {} }), json({ data: {} }), json({}), json({ data: [] }))

    await c.getDoc("Sales Invoice", NAME)
    await c.saveDoc({ doctype: "Sales Invoice", name: NAME })
    await c.saveDoc({ doctype: "Sales Invoice" })
    await c.deleteDoc("Sales Invoice", NAME)
    await c.getList({ doctype: "Sales Invoice" })

    expect(calls.map((x) => x.url.split("?")[0])).toEqual([
      `/api/v1/doc/Sales%20Invoice/${ENCODED}`,
      `/api/v1/doc/Sales%20Invoice/${ENCODED}`,
      "/api/v1/doc/Sales%20Invoice",
      `/api/v1/doc/Sales%20Invoice/${ENCODED}`,
      "/api/v1/doc/Sales%20Invoice",
    ])
  })


  it("invalidate(doctype) still clears entries whose keys are encoded", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ data: { v: 1 } }), json({ data: { v: 2 } }))
    await c.getDoc("Sales Invoice", "INV/1")
    c.invalidate("Sales Invoice")
    expect(await c.getDoc("Sales Invoice", "INV/1")).toEqual({ v: 2 })
  })
})

describe("FrappeClient — cached method calls", () => {
  it("caches callMethod only when asked, keyed by method and args", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "a" }), json({ message: "b" }), json({ message: "c" }))
    const [x, y] = await Promise.all([
      c.callMethod("m.one", { k: 1 }, { cache: true }),
      c.callMethod("m.one", { k: 1 }, { cache: true }),
    ])
    expect([x, y]).toEqual(["a", "a"])
    expect(await c.callMethod("m.one", { k: 1 }, { cache: true })).toBe("a")
    expect(await c.callMethod("m.one", { k: 2 }, { cache: true })).toBe("b")
    expect(await c.callMethod("m.one", { k: 1 })).toBe("c")
    expect(calls).toHaveLength(3)

    c.invalidate("exec:")
    responses.push(json({ message: "d" }))
    expect(await c.callMethod("m.one", { k: 1 }, { cache: true })).toBe("d")
  })

  it("comment, assignment and attachment helpers call Frappe's methods", async () => {
    const c = new FrappeClient("/api/v1")
    for (let i = 0; i < 5; i++) responses.push(json({ message: null }))
    await c.addComment("ToDo", "T1", "<p>hi</p>", { email: "j@x.co", fullName: "Jane" })
    await c.deleteComment("C-1")
    await c.assign("ToDo", "T1", ["a@x.co", "b@x.co"])
    await c.unassign("ToDo", "T1", "a@x.co")
    await c.removeAttachment("ToDo", "T1", "F-1")
    expect(calls.map((_, i) => header(i, "X-Method"))).toEqual([
      "frappe.desk.form.utils.add_comment",
      "frappe.client.delete",
      "frappe.desk.form.assign_to.add",
      "frappe.desk.form.assign_to.remove",
      "frappe.desk.form.utils.remove_attach",
    ])
    expect(body(0)).toEqual({ reference_doctype: "ToDo", reference_name: "T1", content: "<p>hi</p>", comment_email: "j@x.co", comment_by: "Jane" })
    expect(body(2)).toEqual({ doctype: "ToDo", name: "T1", assign_to: '["a@x.co","b@x.co"]' })
    expect(body(4)).toEqual({ fid: "F-1", dt: "ToDo", dn: "T1" })
  })
})

describe("FrappeClient — request hooks from apps", () => {
  it("lets beforeRequest rewrite the request and afterRequest the response", async () => {
    const c = new FrappeClient("/api/v1")
    c.applyConfig({
      beforeRequest: async (o) => ({ ...o, path: o.path.replace("/doc/", "/doc-v2/"), headers: { ...(o.headers as object), "X-App": "1" } }),
      afterRequest: async (j) => ({ data: { ...(j as { data: object }).data, touched: true } }),
    })
    responses.push(json({ data: { name: "U1" } }))
    expect(await c.getDoc("User", "U1")).toEqual({ name: "U1", touched: true })
    expect(calls[0]!.url).toBe("/api/v1/doc-v2/User/U1")
    expect(header(0, "X-App")).toBe("1")
  })
})

describe("FrappeClient — error messages", () => {
  it("uses the <summary> of an HTML server message when a DOM is available, else strips tags", async () => {
    const c = new FrappeClient("/api/v1")
    const msg = JSON.stringify([JSON.stringify({ message: "<details><summary>Not allowed</summary>Traceback…</details>" })])
    responses.push(json({ _server_messages: msg }, 417))
    // No DOM in this environment: tags are stripped.
    await expect(c.getDoc("X", "1")).rejects.toThrow("Not allowed Traceback…")
  })

  it("keeps a plain-text message as is", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ _server_messages: JSON.stringify([{ message: "Plain & simple" }]) }, 417))
    await expect(c.getDoc("X", "1")).rejects.toThrow("Plain & simple")
  })
})

describe("FrappeClient — raw calls and boot", () => {
  it("rawCall returns Frappe's whole response and status without throwing", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "tok" }), json({ exc: "ValidationError", _server_messages: "[]" }, 417))
    const r = await c.rawCall("erpnext.do_thing", { a: 1 })
    expect(r).toEqual({ status: 417, data: { exc: "ValidationError", _server_messages: "[]" } })
    expect(calls[1]!.url).toBe("/api/v1/exec")
    expect(header(1, "X-Method")).toBe("erpnext.do_thing")
    expect(header(1, "X-CSRF-Token")).toBe("tok")
    expect(body(1)).toEqual({ a: 1 })
  })

  it("rawCall runs afterRequest only on success and tolerates a non-JSON body", async () => {
    const c = new FrappeClient("/api/v1")
    const after = vi.fn(async (j: unknown) => ({ ...(j as object), seen: true }))
    c.applyConfig({ afterRequest: after })
    responses.push(json({ message: "tok" }), json({ message: 1 }), () => new Response("<html>502</html>", { status: 502 }))
    expect(await c.rawCall("m", {})).toEqual({ status: 200, data: { message: 1, seen: true } })
    expect(await c.rawCall("m", {})).toEqual({ status: 502, data: null })
    expect(after).toHaveBeenCalledTimes(1)
  })

  it("getBoot returns the boot object and explains failures", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(
      json({ message: { user: { name: "jane" } } }),
      json({ error: "x" }, 401),
      json({ error: "x" }, 500),
      json({ message: "not an object" }),
    )
    expect(await c.getBoot()).toEqual({ user: { name: "jane" } })
    expect(calls[0]!.init.cache).toBe("no-store")
    await expect(c.getBoot()).rejects.toThrow("Not logged in")
    await expect(c.getBoot()).rejects.toThrow("Could not load the session (500)")
    await expect(c.getBoot()).rejects.toThrow("Could not load the session")
  })
})

describe("FrappeClient — uploads", () => {
  const file = () => new File([new Uint8Array([0, 255, 1])], "a.bin", { type: "application/octet-stream" })

  it("posts multipart form data with the CSRF token and returns the file URL", async () => {
    const c = new FrappeClient("/api/v1")
    responses.push(json({ message: "tok" }))
    await c.initCSRF()
    responses.push(json({ message: { file_url: "/private/files/a.bin" } }))

    const url = await c.uploadFile(file(), { doctype: "ToDo", docname: "T1", fieldname: "attachment", is_private: 1 })

    expect(url).toBe("/private/files/a.bin")
    const { url: target, init } = calls[1]!
    expect(target).toBe("/api/v1/upload")
    expect(header(1, "X-CSRF-Token")).toBe("tok")
    expect(header(1, "Content-Type")).toBeUndefined()
    const form = init.body as FormData
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== "file"))).toEqual({ is_private: "1", doctype: "ToDo", docname: "T1", fieldname: "attachment" })
    expect(new Uint8Array(await (form.get("file") as File).arrayBuffer())).toEqual(new Uint8Array([0, 255, 1]))
  })

  it("reports a failed upload, and one without a URL", async () => {
    const c = new FrappeClient("/api/v1")
    const onFail = vi.fn()
    c.onAuthFailure(onFail)
    responses.push(() => new Response("", { status: 403, statusText: "Forbidden" }), json({ message: {} }))
    await expect(c.uploadFile(file())).rejects.toThrow("Upload failed: 403 Forbidden")
    expect(onFail).toHaveBeenCalled()
    await expect(c.uploadFile(file())).rejects.toThrow("no file URL")
  })
})
