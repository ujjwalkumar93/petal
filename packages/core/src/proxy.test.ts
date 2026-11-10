import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "./proxy"

function csp(res: Response): Map<string, string> {
  const header = res.headers.get("content-security-policy") ?? ""
  return new Map(header.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
    const i = d.indexOf(" ")
    return i < 0 ? [d, ""] : [d.slice(0, i), d.slice(i + 1)]
  }))
}

/** The nonce Next forwards to the page via the rewritten request headers. */
function forwardedNonce(res: Response): string | null {
  return res.headers.get("x-middleware-request-x-nonce")
}

beforeEach(() => {
  vi.stubEnv("PETAL_TENANTS", "")
  vi.stubEnv("PETAL_APPS", "")
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("proxy.ts security headers", () => {
  it("sets a strict CSP whose script nonce matches the one handed to the page", () => {
    const res = proxy(new NextRequest("http://petal.test/list/Item"))
    const d = csp(res)
    const nonce = forwardedNonce(res)

    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{20,}$/)
    expect(d.get("script-src")).toContain(`'nonce-${nonce}'`)
    expect(d.get("script-src")).not.toContain("'unsafe-inline'")
    expect(d.get("object-src")).toBe("'none'")
    expect(d.get("frame-ancestors")).toBe("'none'")
    expect(d.get("base-uri")).toBe("'self'")
    expect(res.headers.get("x-frame-options")).toBe("DENY")
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it("uses a fresh nonce for every request", () => {
    const a = forwardedNonce(proxy(new NextRequest("http://petal.test/")))
    const b = forwardedNonce(proxy(new NextRequest("http://petal.test/")))
    expect(a).not.toBe(b)
  })

  it("trusts script origins of apps registered through PETAL_APPS at runtime", () => {
    vi.stubEnv("PETAL_APPS", JSON.stringify([{ name: "billing", version: "1", url: "https://cdn.example.com/billing/petal.hooks.js" }]))
    const d = csp(proxy(new NextRequest("http://petal.test/")))
    expect(d.get("script-src")).toContain("https://cdn.example.com")
  })

  it("lets only the print preview be framed, by this origin, with no scripts", () => {
    const res = proxy(new NextRequest("http://petal.test/api/v1/printview?doctype=Item&name=I-1"))
    const d = csp(res)
    expect(d.get("script-src")).toBe("'none'")
    expect(d.get("frame-ancestors")).toBe("'self'")
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN")
  })
})

describe("proxy.ts multi-tenancy", () => {
  const tenants = JSON.stringify({
    "acme.example.com": { frappeUrl: "http://acme-backend:8000", apps: [] },
  })

  it("serves a known tenant", () => {
    vi.stubEnv("PETAL_TENANTS", tenants)
    const res = proxy(new NextRequest("http://acme.example.com/", { headers: { host: "acme.example.com" } }))
    expect(res.status).toBe(200)
  })

  it("answers 404 for a hostname that isn't a tenant", async () => {
    vi.stubEnv("PETAL_TENANTS", tenants)
    const res = proxy(new NextRequest("http://other.example.com/", { headers: { host: "other.example.com" } }))
    expect(res.status).toBe(404)
    expect(await res.text()).toBe("Unknown tenant")
  })
})
