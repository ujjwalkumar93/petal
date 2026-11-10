import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("fs", () => ({ default: { existsSync: () => true, mkdirSync: vi.fn(), writeFileSync: vi.fn() } }))
const { withPetal } = await import("./plugin")

afterEach(() => vi.unstubAllEnvs())

describe("withPetal", () => {
  it("never inlines the backend address into client bundles (#12)", () => {
    vi.stubEnv("FRAPPE_BACKEND_URL", "http://frappe.internal:8000")
    const config = withPetal({ apps: [] })({ env: { MY_FLAG: "1" } })
    expect(config.env).toEqual({ MY_FLAG: "1" })
    expect(JSON.stringify(config)).not.toContain("frappe.internal")
  })
})
