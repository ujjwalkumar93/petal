// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearSidebarCache, fetchFrappeSidebarItems } from "./frappe-sidebar"

let fetchMock: ReturnType<typeof vi.fn>
const pages = (list: Record<string, unknown>[]) => new Response(JSON.stringify({ message: { pages: list } }), { status: 200 })

beforeEach(() => {
  sessionStorage.clear()
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
  vi.spyOn(console, "warn").mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe("fetchFrappeSidebarItems", () => {
  it("nests child workspaces, hides hidden ones and maps icons", async () => {
    fetchMock.mockResolvedValue(pages([
      { name: "Accounting", label: "Accounting", icon: "accounting" },
      { name: "Payables", label: null, icon: "unknown-icon", parent_page: "Accounting" },
      { name: "Receivables", label: "Receivables", icon: "🧾", parent_page: "Accounting" },
      { name: "Stock & Co", icon: "not-a-registry-icon" },
      { name: "Secret", icon: "hr", is_hidden: 1 },
      { name: "Hidden Child", parent_page: "Accounting", is_hidden: 1 },
    ]))

    const items = await fetchFrappeSidebarItems()

    expect(fetchMock.mock.calls[0]![0]).toMatch(/^\/api\/v1\//)
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ credentials: "include" })
    expect(items).toEqual([
      {
        label: "Accounting", path: "/workspace/Accounting", icon: "accounting",
        children: [
          { label: "Payables", path: "/workspace/Payables", icon: "📝" },
          { label: "Receivables", path: "/workspace/Receivables", icon: "🧾" },
        ],
      },
      { label: "Stock & Co", path: "/workspace/Stock%20%26%20Co", icon: "grid" },
    ])
  })

  it("caches for the session and forgets on clearSidebarCache()", async () => {
    fetchMock.mockImplementation(async () => pages([{ name: "Home" }]))
    await fetchFrappeSidebarItems()
    await fetchFrappeSidebarItems()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    clearSidebarCache()
    await fetchFrappeSidebarItems()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("refetches once the cache is five minutes old", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    fetchMock.mockImplementation(async () => pages([{ name: "Home" }]))
    await fetchFrappeSidebarItems()
    vi.setSystemTime(Date.now() + 5 * 60 * 1000 + 1)
    await fetchFrappeSidebarItems()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    ["the backend errors", () => new Response("", { status: 500, statusText: "Server Error" })],
    ["the network is down", () => { throw new TypeError("fetch failed") }],
    ["there are no workspaces", () => pages([])],
  ])("falls back to a minimal Setup menu when %s, without caching it", async (_why, answer) => {
    fetchMock.mockImplementation(async () => answer())
    const items = await fetchFrappeSidebarItems()
    expect(items.map((i) => i.label)).toEqual(["Setup"])
    expect(sessionStorage.getItem("petal:sidebar")).toBeNull()
  })

  it("ignores a corrupt cache entry", async () => {
    sessionStorage.setItem("petal:sidebar", "{not json")
    fetchMock.mockResolvedValue(pages([{ name: "Home" }]))
    expect((await fetchFrappeSidebarItems()).map((i) => i.label)).toEqual(["Home"])
  })
})
