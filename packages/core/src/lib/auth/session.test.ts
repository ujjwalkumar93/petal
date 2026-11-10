import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/useFrappe", () => ({ getFrappeClient: () => ({ resetSession: vi.fn() }) }))
vi.mock("@/lib/sidebar/frappe-sidebar", () => ({ clearSidebarCache: vi.fn() }))

import { loginPathFor, loginRedirectTarget } from "./session"

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
