import { describe, expect, it, vi } from "vitest"
import { usePetalStore } from "./petal-store"

const u = (name: string) => ({ name, email: name, full_name: name, first_name: name, username: name, user_type: "System User", roles: [] })

describe("petal store setup state", () => {
  it("re-checks setup after logout or a different login, but not for a refresh of the same user", () => {
    const s = usePetalStore.getState()
    s.setUser(u("clerk@x.co"))
    s.setSetupState("complete")
    s.setUser(u("clerk@x.co"))
    expect(usePetalStore.getState().setupState).toBe("complete")
    s.setUser(null)
    expect(usePetalStore.getState().setupState).toBe("unknown")
    s.setSetupState("complete")
    s.setUser(u("Administrator"))
    expect(usePetalStore.getState().setupState).toBe("unknown")
  })
})

describe("petal-store on the server", () => {
  it("never persists into a runtime-global sessionStorage (Node ≥25 has a process-wide one)", async () => {
    // Simulate Node 26's global Web Storage in this window-less (node) environment.
    const writes: string[] = []
    const fake = {
      getItem: () => null,
      setItem: (k: string) => { writes.push(k) },
      removeItem: () => {},
    }
    vi.stubGlobal("sessionStorage", fake)
    vi.stubGlobal("localStorage", fake)
    vi.resetModules()
    try {
      expect(typeof window).toBe("undefined")
      const { usePetalStore } = await import("./petal-store")
      usePetalStore.getState().setUser({ name: "alice@example.com", email: "alice@example.com", full_name: "Alice", first_name: "Alice", username: "alice", user_type: "System User", roles: [] })
      expect(writes).toEqual([])
    } finally {
      vi.unstubAllGlobals()
      vi.resetModules()
    }
  })
})
