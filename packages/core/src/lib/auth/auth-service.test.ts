import { describe, it, expect, vi, beforeEach } from "vitest"

const apps: Array<{ hooks: { overrides?: { auth?: Record<string, unknown> } } }> = []
const client = {
  login: vi.fn(),
  logout: vi.fn(),
  getLoggedInUser: vi.fn(),
}
vi.mock("@/lib/registry/app-registry", () => ({ appRegistry: { getAll: () => apps } }))
vi.mock("@/hooks/useFrappe", () => ({ getFrappeClient: () => client }))

const { authService } = await import("./auth-service")

const user = { name: "jane@example.com", full_name: "Jane" }
const creds = { email: "jane@example.com", password: "pw" }
const withAuth = (...auths: Record<string, unknown>[]) => {
  apps.length = 0
  apps.push({ hooks: {} }, ...auths.map((auth) => ({ hooks: { overrides: { auth } } })))
}

beforeEach(() => {
  apps.length = 0
  vi.clearAllMocks()
  client.login.mockResolvedValue(undefined)
  client.logout.mockResolvedValue(undefined)
  client.getLoggedInUser.mockResolvedValue(user)
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

describe("authService routes", () => {
  it("uses Petal's defaults when no app overrides auth", () => {
    expect(authService.getLoginPage()).toBe("/login")
    expect(authService.getRedirectAfterLogin()).toBe("/")
    expect(authService.getRedirectAfterLogout()).toBe("/login")
    expect(authService.getLoginComponent()).toBeNull()
  })

  it("takes the first app that sets each value", () => {
    const Login = () => null
    withAuth({ redirectAfterLogin: "/app/home" }, { loginPage: "/sso", redirectAfterLogin: "/ignored", redirectAfterLogout: "/bye", loginComponent: Login })
    expect(authService.getLoginPage()).toBe("/sso")
    expect(authService.getRedirectAfterLogin()).toBe("/app/home")
    expect(authService.getRedirectAfterLogout()).toBe("/bye")
    expect(authService.getLoginComponent()).toBe(Login)
  })
})

describe("authService.login", () => {
  it("logs in, fetches the user and runs after_login hooks in order", async () => {
    const order: string[] = []
    withAuth(
      { before_login: vi.fn(async () => { order.push("before") }), after_login: vi.fn(async () => { order.push("after1") }) },
      { after_login: vi.fn(() => { order.push("after2") }), redirectAfterLogin: "/desk" },
    )
    client.login.mockImplementation(async () => { order.push("login") })

    const r = await authService.login(creds)

    expect(r).toEqual({ success: true, user, redirectTo: "/desk" })
    expect(client.login).toHaveBeenCalledWith("jane@example.com", "pw")
    expect(order).toEqual(["before", "login", "after1", "after2"])
    expect(apps[1]!.hooks.overrides!.auth!.after_login).toHaveBeenCalledWith(user)
  })

  it("is cancelled when a before_login hook returns false, without calling Frappe", async () => {
    withAuth({ before_login: async () => false })
    expect(await authService.login(creds)).toEqual({ success: false, reason: "cancelled", message: "Login cancelled by app hook." })
    expect(client.login).not.toHaveBeenCalled()
  })

  it("reports a before_login hook that throws", async () => {
    withAuth({ before_login: async () => { throw new Error("blocked") } })
    expect(await authService.login(creds)).toEqual({ success: false, reason: "error", message: "Error: blocked" })
    expect(client.login).not.toHaveBeenCalled()
  })

  it("reports bad credentials without leaking the server's error", async () => {
    client.login.mockRejectedValue(new Error("Traceback ... secret"))
    expect(await authService.login(creds)).toEqual({ success: false, reason: "error", message: "Invalid email or password." })
    expect(client.getLoggedInUser).not.toHaveBeenCalled()
  })

  it("reports a session it could not read after logging in", async () => {
    const after = vi.fn()
    withAuth({ after_login: after })
    client.getLoggedInUser.mockRejectedValue(new Error("500"))
    expect(await authService.login(creds)).toMatchObject({ success: false, message: "Login succeeded but could not fetch user." })
    expect(after).not.toHaveBeenCalled()
  })

  it("still succeeds when an after_login hook throws", async () => {
    const second = vi.fn()
    withAuth({ after_login: () => { throw new Error("boom") } }, { after_login: second })
    expect(await authService.login(creds)).toMatchObject({ success: true })
    expect(second).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })
})

describe("authService.logout", () => {
  it("logs out and runs after_logout hooks", async () => {
    const after = vi.fn()
    withAuth({ before_logout: () => true, after_logout: after, redirectAfterLogout: "/goodbye" })
    expect(await authService.logout()).toEqual({ success: true, redirectTo: "/goodbye" })
    expect(client.logout).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it("is cancelled when a before_logout hook returns false", async () => {
    withAuth({ before_logout: () => false })
    expect(await authService.logout()).toMatchObject({ success: false, reason: "cancelled" })
    expect(client.logout).not.toHaveBeenCalled()
  })

  it("reports a before_logout hook that throws", async () => {
    withAuth({ before_logout: () => { throw new Error("nope") } })
    expect(await authService.logout()).toEqual({ success: false, reason: "error", message: "Error: nope" })
  })

  it("reports a failed logout request and skips after_logout", async () => {
    const after = vi.fn()
    withAuth({ after_logout: after })
    client.logout.mockRejectedValue(new Error("network"))
    expect(await authService.logout()).toEqual({ success: false, reason: "error", message: "Logout request failed." })
    expect(after).not.toHaveBeenCalled()
  })

  it("still succeeds when an after_logout hook throws", async () => {
    withAuth({ after_logout: () => { throw new Error("boom") } })
    expect(await authService.logout()).toEqual({ success: true, redirectTo: "/login" })
  })
})
