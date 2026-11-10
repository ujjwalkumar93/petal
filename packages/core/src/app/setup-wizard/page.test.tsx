import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

type Handler = (e: unknown) => void
let realtime: { handlers: Map<string, Handler>; on: (ev: string, fn: Handler) => () => void } | null
vi.mock("@/hooks/useRealtime", () => ({ getRealtimeClient: async () => realtime }))

let installed: Array<{ app_name: string; has_setup_wizard?: number; is_setup_complete?: number }>
let complete: ReturnType<typeof vi.fn>
const REGIONAL = {
  country_info: {
    India: { currency: "INR", timezones: ["Asia/Kolkata"] },
    Germany: { currency: "EUR", timezones: ["Europe/Berlin"] },
  },
  all_timezones: ["Asia/Kolkata", "Europe/Berlin", "UTC"],
}
const client = {
  invalidate: vi.fn(),
  getDoc: vi.fn(async () => ({ installed_applications: installed })),
  callMethod: vi.fn(async (method: string, args?: Record<string, unknown>) => {
    if (method.endsWith("load_languages")) return { default_language: "English", languages: ["English", "Deutsch"] }
    if (method.endsWith("get_country_timezone_info")) return REGIONAL
    if (method.endsWith("load_country")) return "India"
    if (method.endsWith("get_charts_for_country")) return args?.country === "Germany" ? ["SKR04"] : ["Standard", "India - Chart"]
    if (method.endsWith("setup_complete")) return complete(args)
    return null
  }),
}
vi.mock("@/hooks/useFrappe", () => ({ getFrappeClient: () => client, useFrappe: () => client }))

const { usePetalStore } = await import("@/store/petal-store")
const { default: SetupWizardPage } = await import("./page")

const admin = { name: "Administrator", email: "admin@example.com", full_name: "Administrator", first_name: "Admin", username: "administrator", user_type: "System User", roles: ["Administrator"] }
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement & HTMLSelectElement
const next = () => act(async () => { fireEvent.click(screen.getByRole("button", { name: /^(Next|Complete Setup)$/ })) })

let assignTimer: (() => void) | null
beforeEach(() => {
  vi.clearAllMocks()
  realtime = null
  assignTimer = null
  installed = [
    { app_name: "frappe", has_setup_wizard: 1, is_setup_complete: 0 },
    { app_name: "erpnext", has_setup_wizard: 1, is_setup_complete: 0 },
  ]
  complete = vi.fn(() => ({ status: "ok" }))
  sessionStorage.clear()
  usePetalStore.setState({ user: admin, hooks: {} as never, hooksReady: true, setupState: "pending" } as never)
  // The success path reloads into the desk after 1.2s; capture it instead of navigating jsdom.
  const realSetTimeout = globalThis.setTimeout
  vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void, ms?: number) => {
    if (ms === 1200) { assignTimer = fn; return 0 as never }
    return realSetTimeout(fn, ms)
  }) as typeof setTimeout)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

async function fillRegionAndUser() {
  await screen.findByRole("heading", { name: "Welcome" })
  await next()
  await screen.findByRole("heading", { name: "Let's set up your account" })
  fireEvent.change(field(/^Full Name/), { target: { value: "Jane Admin" } })
  fireEvent.change(field(/^Email Address/), { target: { value: "jane@example.com" } })
  fireEvent.change(field(/^Password/), { target: { value: "s3cret!" } })
  await next()
  await screen.findByRole("heading", { name: "Set up your organization" })
}

describe("Setup wizard", () => {
  it("prefills the region from the server's guess and follows the country", async () => {
    render(<SetupWizardPage />)
    await screen.findByRole("heading", { name: "Welcome" })
    expect(screen.getByText("Step 1 of 3")).toBeTruthy()
    expect(field(/^Your Country/).value).toBe("India")
    expect(field(/^Currency/).value).toBe("INR")
    expect(field(/^Time Zone/).value).toBe("Asia/Kolkata")

    fireEvent.change(field(/^Your Country/), { target: { value: "Germany" } })
    expect(field(/^Currency/).value).toBe("EUR")
    expect(field(/^Time Zone/).value).toBe("Europe/Berlin")
  })

  it("validates each slide before moving on, and Back keeps the answers", async () => {
    render(<SetupWizardPage />)
    await screen.findByRole("heading", { name: "Welcome" })
    await next()
    await next()
    expect(screen.getByRole("alert").textContent).toMatch(/Full Name/)

    fireEvent.change(field(/^Full Name/), { target: { value: "Jane" } })
    fireEvent.change(field(/^Email Address/), { target: { value: "not-an-email" } })
    fireEvent.change(field(/^Password/), { target: { value: "secret" } })
    await next()
    expect(screen.getByRole("alert").textContent).toBe("Enter a valid email address.")

    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("heading", { name: "Welcome" })).toBeTruthy()
    await next()
    expect(field(/^Full Name/).value).toBe("Jane")
  })

  it("derives the company abbreviation and the chart of accounts, then completes setup", async () => {
    render(<SetupWizardPage />)
    await fillRegionAndUser()

    fireEvent.change(field(/^Company Name/), { target: { value: "Acme Widgets" } })
    expect(field(/^Company Abbreviation/).value).toBe("AW")
    await waitFor(() => expect(field(/^Chart of Accounts/).value).toBe("Standard"))
    await next()

    expect(complete).toHaveBeenCalledTimes(1)
    const { args } = complete.mock.calls[0]![0] as { args: Record<string, unknown> }
    expect(args).toMatchObject({
      language: "English", country: "India", timezone: "Asia/Kolkata", currency: "INR",
      full_name: "Jane Admin", email: "jane@example.com", password: "s3cret!",
      company_name: "Acme Widgets", company_abbr: "AW", chart_of_accounts: "Standard",
      enable_telemetry: 0, setup_demo: 0,
    })
    expect(await screen.findByText("Setup complete")).toBeTruthy()
    expect(assignTimer).toBeTypeOf("function")
  })

  it("follows a background setup job over realtime and shows its failure", async () => {
    const handlers = new Map<string, Handler>()
    realtime = { handlers, on: (ev, fn) => { handlers.set(ev, fn); return () => handlers.delete(ev) } }
    complete = vi.fn(() => ({ status: "registered" }))
    render(<SetupWizardPage />)
    await fillRegionAndUser()
    fireEvent.change(field(/^Company Name/), { target: { value: "Acme" } })
    await next()

    expect(await screen.findByText("Setting up your system")).toBeTruthy()
    act(() => handlers.get("setup_task")!({ progress: [1, 4], stage_status: "Creating accounts" }))
    expect(screen.getByText("Creating accounts…")).toBeTruthy()
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50")

    act(() => handlers.get("setup_task")!({ status: "fail", fail_msg: "Could not create Company" }))
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByRole("alert").textContent).toBe("Could not create Company")
    expect(screen.getByRole("heading", { name: "Set up your organization" })).toBeTruthy()
    expect(handlers.size).toBe(0)
  })

  it("shows the server's error when setup_complete fails", async () => {
    installed = [{ app_name: "frappe", has_setup_wizard: 1, is_setup_complete: 0 }]
    complete = vi.fn(() => { throw new Error("Invalid timezone") })
    render(<SetupWizardPage />)
    await screen.findByRole("heading", { name: "Welcome" })
    await next()
    fireEvent.change(field(/^Full Name/), { target: { value: "Jane" } })
    fireEvent.change(field(/^Email Address/), { target: { value: "jane@example.com" } })
    fireEvent.change(field(/^Password/), { target: { value: "secret" } })
    await next()
    expect((await screen.findByRole("alert")).textContent).toBe("Invalid timezone")
  })

  it("has nothing to ask when every app is set up", async () => {
    installed = [{ app_name: "frappe", has_setup_wizard: 1, is_setup_complete: 1 }]
    render(<SetupWizardPage />)
    expect(await screen.findByText("Nothing to set up")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Go to desk" }))
    expect(usePetalStore.getState().setupState).toBe("complete")
  })

  it("explains when the wizard can't load", async () => {
    client.callMethod.mockImplementationOnce(async () => null) // languages
    client.callMethod.mockImplementationOnce(async () => { throw new Error("Server down") }) // regional
    render(<SetupWizardPage />)
    expect(await screen.findByText("Couldn't load the setup wizard")).toBeTruthy()
    expect(screen.getByText("Server down")).toBeTruthy()
  })
})
