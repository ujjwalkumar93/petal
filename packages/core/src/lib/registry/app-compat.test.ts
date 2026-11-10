import { describe, expect, it } from "vitest"
import { appConfigError, appImportMap, PETAL_VERSION } from "./app-compat"

const app = (extra: Record<string, unknown> = {}) => ({ name: "hr", version: "1.0.0", url: "https://cdn.example.com/hr/petal.hooks.js", ...extra })
const SHA384 = "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"

describe("appConfigError (#16)", () => {
  it("accepts apps without petalVersion or integrity", () => {
    expect(appConfigError(app(), "0.4.2")).toBeNull()
  })

  it("checks petalVersion against the running Petal", () => {
    expect(appConfigError(app({ petalVersion: ">=0.4 <1" }), "0.4.2")).toBeNull()
    expect(appConfigError(app({ petalVersion: "^0.4.0" }), "0.4.2")).toBeNull()
    expect(appConfigError(app({ petalVersion: "^1.0.0" }), "0.4.2")).toBe('hr needs Petal ^1.0.0; this is Petal 0.4.2')
    expect(appConfigError(app({ petalVersion: "banana" }), "0.4.2")).toBe('hr has an invalid petalVersion range "banana"')
  })

  it("rejects a malformed integrity hash instead of loading the app unchecked", () => {
    expect(appConfigError(app({ integrity: SHA384 }), "0.4.2")).toBeNull()
    expect(appConfigError(app({ integrity: `sha256-${"A".repeat(43)}= ${SHA384}` }), "0.4.2")).toBeNull()
    expect(appConfigError(app({ integrity: "md5-abc" }), "0.4.2")).toMatch(/invalid integrity/)
    expect(appConfigError(app({ integrity: "sha384-not base64!" }), "0.4.2")).toMatch(/invalid integrity/)
  })

  it("knows Petal's own version", () => {
    expect(PETAL_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe("appImportMap (#16)", () => {
  it("resolves React for app chunks and pins each app's bundle hash", () => {
    const map = appImportMap([app({ integrity: SHA384 }), app({ name: "crm", url: "https://cdn.example.com/crm.js" })], false)
    expect(map.imports).toEqual({ react: "/esm/react.js", "react/jsx-runtime": "/esm/react-jsx-runtime.js", "react-dom": "/esm/react-dom.js" })
    expect(map.integrity).toEqual({ "https://cdn.example.com/hr/petal.hooks.js": SHA384 })
  })

  it("leaves out apps loaded from their dev server, and rejected apps", () => {
    expect(appImportMap([app({ integrity: SHA384, devUrl: "http://localhost:5174/hooks.js" })], true).integrity).toBeUndefined()
    expect(appImportMap([app({ integrity: SHA384, devUrl: "http://localhost:5174/hooks.js" })], false).integrity).toEqual({ "https://cdn.example.com/hr/petal.hooks.js": SHA384 })
    expect(appImportMap([app({ integrity: "md5-x" })], false).integrity).toBeUndefined()
  })
})
