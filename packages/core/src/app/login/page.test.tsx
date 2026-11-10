import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/login", useSearchParams: () => new URLSearchParams() }))

const login = vi.fn()
let loginComponent: unknown = null
vi.mock("@/lib/auth/auth-service", () => ({
  authService: { login: (...a: unknown[]) => login(...a), getLoginComponent: () => loginComponent },
}))

const { usePetalStore } = await import("@/store/petal-store")
const { default: LoginPage } = await import("./page")

const user = { name: "jane@example.com", email: "jane@example.com", full_name: "Jane", first_name: "Jane", username: "jane", user_type: "System User", roles: [] }

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email or Username"), { target: { value: email } })
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } })
}
const submit = () => act(async () => { fireEvent.click(screen.getByRole("button", { name: "Sign in" })) })

beforeEach(() => {
  vi.clearAllMocks()
  loginComponent = null
  window.history.replaceState(null, "", "/login")
  usePetalStore.setState({ user: null, authStatus: "unauthenticated" })
})
afterEach(cleanup)

describe("Login page", () => {
  it("signs in and goes where the app hooks say", async () => {
    login.mockResolvedValue({ success: true, user, redirectTo: "/desk" })
    render(<LoginPage />)
    fill("jane@example.com", "secret")
    await submit()

    expect(login).toHaveBeenCalledWith({ email: "jane@example.com", password: "secret" })
    expect(usePetalStore.getState().user).toEqual(user)
    expect(usePetalStore.getState().authStatus).toBe("authenticated")
    expect(router.replace).toHaveBeenCalledWith("/desk")
  })

  it("returns to the page an expired session interrupted", async () => {
    window.history.replaceState(null, "", "/login?redirect=%2Fform%2FToDo%2FTD-1")
    login.mockResolvedValue({ success: true, user, redirectTo: "/" })
    render(<LoginPage />)
    fill("jane", "secret")
    await submit()
    expect(router.replace).toHaveBeenCalledWith("/form/ToDo/TD-1")
  })

  it("never redirects off-site", async () => {
    window.history.replaceState(null, "", "/login?redirect=%2F%2Fevil.example%2F")
    login.mockResolvedValue({ success: true, user, redirectTo: "/" })
    render(<LoginPage />)
    fill("jane", "secret")
    await submit()
    expect(router.replace).toHaveBeenCalledWith("/")
  })

  it("shows why sign-in failed and lets the user try again", async () => {
    login.mockResolvedValue({ success: false, reason: "error", message: "Invalid email or password." })
    render(<LoginPage />)
    fill("jane", "wrong")
    await submit()
    expect(screen.getByText("Invalid email or password.")).toBeTruthy()
    expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).disabled).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
    expect(usePetalStore.getState().authStatus).toBe("unauthenticated")
  })

  it("does nothing without both fields", async () => {
    render(<LoginPage />)
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!)
    expect(login).not.toHaveBeenCalled()
  })

  it("renders an app's own login screen when one is registered", async () => {
    loginComponent = () => Promise.resolve({ default: () => <p>Company SSO</p> })
    render(<LoginPage />)
    expect(await screen.findByText("Company SSO")).toBeTruthy()
  })
})
