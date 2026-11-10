// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { FrappeClient } from "./client"

afterEach(() => { vi.unstubAllGlobals(); document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT" })

describe("FrappeClient in the browser", () => {
  it("shows only the <summary> of Frappe's <details> error messages", async () => {
    const msg = JSON.stringify([JSON.stringify({ message: "<details><summary>Not allowed</summary><pre>Traceback…</pre></details>" })])
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ _server_messages: msg }), { status: 417 })))
    await expect(new FrappeClient("/api/v1").getDoc("X", "1")).rejects.toThrow(/^Not allowed$/)
  })

  it("falls back to the csrf_token cookie when the token endpoint gave none", async () => {
    document.cookie = `csrf_token=${encodeURIComponent("a=b/c")}`
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await new FrappeClient("/api/v1").saveDoc({ doctype: "ToDo", description: "x" })
    const init = (fetchMock.mock.calls as unknown as [string, RequestInit][])[0]![1]
    expect((init.headers as Record<string, string>)["X-CSRF-Token"]).toBe("a=b/c")
  })
})
