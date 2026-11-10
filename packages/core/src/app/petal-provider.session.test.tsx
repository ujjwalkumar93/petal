/* eslint-disable @typescript-eslint/no-explicit-any */
/** Session expiry: a stored user is re-verified, and 401/403s only log out when the backend says Guest. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, waitFor } from "@testing-library/react"

let pathname = "/form/Item/ITEM-1"
const replace = vi.fn((p: string) => { pathname = p })
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace, push: replace }) }))
vi.mock("@/lib/sidebar/frappe-sidebar", () => ({ fetchFrappeSidebarItems: async () => [], clearSidebarCache: vi.fn() }))
vi.mock("@/components/shell/Sidebar", () => ({ Sidebar: () => null }))
vi.mock("@/components/shell/Navbar", () => ({ Navbar: () => null }))

let authListener: ((status: number) => void) | null = null
const client: any = {
  waitFor: vi.fn(), applyConfig: vi.fn(), initCSRF: async () => {}, invalidate: () => {},
  onAuthFailure: (fn: (status: number) => void) => { authListener = fn; return () => { authListener = null } },
  getSessionUser: vi.fn(),
  resetSession: vi.fn(),
  getLoggedInUser: vi.fn(),
  getDoc: vi.fn(async (dt: string) => dt === "Installed Applications"
    ? { installed_applications: [{ app_name: "frappe", has_setup_wizard: 1, is_setup_complete: 1 }] }
    : {}),
  getList: async () => [],
}
vi.mock("@/hooks/useFrappe", () => ({ getFrappeClient: () => client }))

const ADMIN = { name: "Administrator", email: "admin@example.com", full_name: "Administrator", first_name: "Administrator", username: "administrator", user_type: "System User", roles: ["System Manager"] }

async function renderShell() {
  const { PetalProvider } = await import("./petal-provider")
  const { usePetalStore } = await import("@/store/petal-store")
  render(<PetalProvider><p>DESK</p></PetalProvider>)
  return usePetalStore
}

beforeEach(async () => {
  ;(globalThis as any).fetch = vi.fn(async () => ({ json: async () => ({ apps: [] }) }))
  ;(globalThis as any).EventSource = class { addEventListener() {} close() {} }
  pathname = "/form/Item/ITEM-1"
  replace.mockClear()
  client.resetSession.mockClear()
  client.getSessionUser.mockReset()
  const { usePetalStore } = await import("@/store/petal-store")
  // What sessionStorage restores for a returning tab
  usePetalStore.setState({ user: ADMIN, authStatus: "loading", setupState: "complete" })
})

afterEach(() => cleanup())

describe("session expiry", () => {
  it("re-verifies a stored user and signs out when the backend says Guest", async () => {
    client.getSessionUser.mockResolvedValue("Guest")
    const store = await renderShell()

    await waitFor(() => expect(store.getState().authStatus).toBe("unauthenticated"))
    expect(store.getState().user).toBeNull()
    expect(client.resetSession).toHaveBeenCalled()
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fform%2FItem%2FITEM-1"))
  })

  it("keeps a stored user whose session is still valid", async () => {
    client.getSessionUser.mockResolvedValue("Administrator")
    const store = await renderShell()

    await waitFor(() => expect(client.getSessionUser).toHaveBeenCalled())
    expect(store.getState().authStatus).toBe("authenticated")
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining("/login"))
  })

  it("treats a 403 as 'not permitted' while the session is valid", async () => {
    client.getSessionUser.mockResolvedValue("Administrator")
    const store = await renderShell()
    await waitFor(() => expect(store.getState().authStatus).toBe("authenticated"))

    authListener!(403)
    await waitFor(() => expect(client.getSessionUser).toHaveBeenCalledTimes(2))
    expect(store.getState().authStatus).toBe("authenticated")
  })

  it("signs out on a 401/403 once the backend reports the session is gone", async () => {
    client.getSessionUser.mockResolvedValueOnce("Administrator").mockResolvedValue("Guest")
    const store = await renderShell()
    await waitFor(() => expect(client.getSessionUser).toHaveBeenCalledTimes(1))
    expect(store.getState().authStatus).toBe("authenticated")

    authListener!(401)
    await waitFor(() => expect(store.getState().authStatus).toBe("unauthenticated"))
    expect(client.resetSession).toHaveBeenCalled()
  })

  it("does not sign out when the session check itself fails (backend offline)", async () => {
    client.getSessionUser.mockRejectedValue(new Error("network"))
    const store = await renderShell()

    await waitFor(() => expect(client.getSessionUser).toHaveBeenCalled())
    expect(store.getState().authStatus).toBe("authenticated")
  })
})
