import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "./route"

afterEach(() => vi.unstubAllEnvs())

describe("/api/config", () => {
  it("flags apps this Petal can't run, so they're reported instead of imported (#16)", async () => {
    vi.stubEnv("PETAL_TENANTS", "")
    vi.stubEnv("PETAL_APPS", JSON.stringify([
      { name: "ok", version: "1", url: "https://cdn.x.com/ok.js" },
      { name: "future", version: "1", url: "https://cdn.x.com/future.js", petalVersion: ">=999" },
    ]))
    const res = await GET(new NextRequest("http://petal.test/api/config"))
    const { apps } = await res.json() as { apps: Array<{ name: string; _configError?: string }> }
    expect(apps.find((a) => a.name === "ok")?._configError).toBeUndefined()
    expect(apps.find((a) => a.name === "future")?._configError).toMatch(/^future needs Petal >=999; this is Petal /)
  })
})
