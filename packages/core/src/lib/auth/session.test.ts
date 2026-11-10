import { describe, expect, it, vi } from "vitest"

const client = { resetSession: vi.fn() }
const clearSidebarCache = vi.fn()
vi.mock("@/hooks/useFrappe", () => ({ getFrappeClient: () => client }))
vi.mock("@/lib/sidebar/frappe-sidebar", () => ({ clearSidebarCache: () => clearSidebarCache() }))

import { QueryClient } from "@tanstack/react-query"
import { loginPathFor, loginRedirectTarget, resetSession } from "./session"
import { usePetalStore } from "@/store/petal-store"

describe("resetSession", () => {
  it("forgets every per-user cache layer", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["doc", "Salary Slip", "SAL-1"], { net_pay: 1000 })
    usePetalStore.setState({
      user: { name: "a@example.com", email: "a@example.com", full_name: "A", first_name: "A", username: "a", user_type: "System User", roles: ["HR Manager"] },
      authStatus: "authenticated",
      setupState: "complete",
      sidebarItems: [{ label: "Payroll", path: "/workspace/Payroll" }],
      themeName: "petal" as never,
    })

    resetSession(queryClient)

    expect(client.resetSession).toHaveBeenCalledOnce()     // GET cache + CSRF token
    expect(clearSidebarCache).toHaveBeenCalledOnce()       // petal:sidebar in sessionStorage
    expect(queryClient.getQueryData(["doc", "Salary Slip", "SAL-1"])).toBeUndefined()
    const s = usePetalStore.getState()
    expect(s.user).toBeNull()
    expect(s.sidebarItems).toEqual([])                     // previous user's workspaces
    expect(s.setupState).toBe("unknown")
    expect(s.themeName).toBe("petal")                      // per-browser preference survives
  })
})

describe("loginPathFor", () => {
  it("sends the user back to the interrupted page via ?redirect=", () => {
    expect(loginPathFor("/form/Sales Invoice/INV-1?x=1")).toBe("/login?redirect=%2Fform%2FSales%20Invoice%2FINV-1%3Fx%3D1")
  })

  it("adds nothing for the home page or the login page itself", () => {
    expect(loginPathFor("/")).toBe("/login")
    expect(loginPathFor("")).toBe("/login")
    expect(loginPathFor("/login?redirect=%2Fx")).toBe("/login")
  })
})

describe("loginRedirectTarget", () => {
  it("round-trips a path made by loginPathFor", () => {
    const url = new URL(loginPathFor("/list/Item?status=Open"), "http://petal.test")
    expect(loginRedirectTarget(url.search)).toBe("/list/Item?status=Open")
  })

  it("ignores anything that is not a same-origin path", () => {
    expect(loginRedirectTarget("?redirect=https%3A%2F%2Fevil.example")).toBeNull()
    expect(loginRedirectTarget("?redirect=%2F%2Fevil.example")).toBeNull()
    expect(loginRedirectTarget("")).toBeNull()
  })
})
