import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Suspense, lazy } from "react"
import type { PetalHooks } from "@petal/sdk"
import { AppRegistry } from "./app-registry"
import { composeSlotLoaders, mergeFormSlots } from "./compose-slots"

const app = (name: string, hooks: PetalHooks) => ({ name, version: "1", url: `https://cdn.test/${name}.js`, _hooks: hooks })

describe("AppRegistry", () => {
  it("runs on_init at load and on_boot later, isolating failures", async () => {
    const r = new AppRegistry()
    const init = vi.fn()
    const boot = vi.fn()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    await r.loadFromConfig({
      apps: [
        app("ok", { on_init: init, on_boot: boot }),
        app("bad", { on_init: () => { throw new Error("init boom") } }),
        app("badboot", { on_boot: () => Promise.reject(new Error("boot boom")) }),
      ],
    })
    expect(init).toHaveBeenCalled()
    expect(r.getAll().map((a) => a.meta.name)).toEqual(["ok", "badboot"])
    expect(r.getFailedApps().get("bad")).toBe("init boom")
    await r.runBootHooks()
    expect(boot).toHaveBeenCalled()
  })

  it("merges sidebar items with overrides, hidden items and ordering across apps", async () => {
    const r = new AppRegistry()
    vi.spyOn(console, "info").mockImplementation(() => {})
    await r.loadFromConfig({
      apps: [
        app("a", {
          sidebar_items: [{ label: "Alpha", path: "/a" }, { label: "Beta", path: "/b" }],
          sidebar_order: ["Gamma"],
          sidebar_item_overrides: { Beta: { hidden: true } },
        }),
        app("b", {
          sidebar_items: [{ label: "Gamma", path: "/g", children: [{ label: "Child", path: "/g/c" }] }],
          sidebar_order: ["Gamma", "Alpha"],
          sidebar_item_overrides: { "/g/c": { icon: "star" } },
        }),
      ],
    })
    const merged = r.getMergedHooks()
    expect(merged.sidebar_items!.map((i) => i.label)).toEqual(["Gamma", "Alpha"])
    expect(merged.sidebar_items![0]!.children![0]!.icon).toBe("star")
    expect(merged.sidebar_order).toEqual(["Gamma", "Alpha"])
  })

  it("concatenates routes and lets later apps override settings and theme", async () => {
    const r = new AppRegistry()
    vi.spyOn(console, "info").mockImplementation(() => {})
    const comp = () => Promise.resolve({ default: () => null })
    await r.loadFromConfig({
      apps: [
        app("a", { routes: [{ path: "/a", component: comp }], overrides: { settings: { currency: "USD" }, theme: { primaryColor: "#000" } } }),
        app("b", { routes: [{ path: "/b", component: comp }], overrides: { settings: { currency: "INR" } } }),
      ],
    })
    expect(r.getMergedHooks().routes!.map((x) => x.path)).toEqual(["/a", "/b"])
    expect(r.getMergedSettings()).toEqual({ currency: "INR" })
    expect(r.getMergedTheme().borderRadius).toBe("0.5rem")
  })

  it("renders form slots from every app, not just the first", async () => {
    const r = new AppRegistry()
    vi.spyOn(console, "info").mockImplementation(() => {})
    await r.loadFromConfig({
      apps: [
        app("a", { form_slots: { Task: { after: async () => ({ default: () => <p>from A</p> }) } } }),
        app("b", { form_slots: { Task: { after: async () => ({ default: ({ docname }) => <p>from B {docname}</p> }) } } }),
      ],
    })
    const Slot = lazy(r.getMergedHooks().form_slots!.Task!.after!)
    render(<Suspense fallback={null}><Slot docname="T-1" /></Suspense>)
    expect(await screen.findByText("from A")).toBeTruthy()
    expect(screen.getByText("from B T-1")).toBeTruthy()
  })
})

describe("compose-slots", () => {
  it("returns a single loader untouched", () => {
    const l = async () => ({ default: () => null })
    expect(composeSlotLoaders([l])).toBe(l)
  })

  it("merges positions independently", () => {
    const l = async () => ({ default: () => null })
    const merged = mergeFormSlots([{ before: l }, { toolbar: l }])
    expect(Object.keys(merged).sort()).toEqual(["before", "toolbar"])
    expect(merged.before).toBe(l)
  })
})

describe("AppRegistry lifecycle limits (#16)", () => {
  it("gives up on an on_init that never settles, and reports the app", async () => {
    vi.useFakeTimers()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    const r = new AppRegistry()
    const loading = r.loadFromConfig({ apps: [app("stuck", { on_init: () => new Promise(() => {}) }), app("fine", {})] })
    await vi.advanceTimersByTimeAsync(10_000)
    await loading
    vi.useRealTimers()
    expect(r.getAll().map((a) => a.meta.name)).toEqual(["fine"])
    expect(r.getFailedApps().get("stuck")).toMatch(/on_init did not finish within 10s/)
  })

  it("doesn't let one hanging on_boot hold up the others", async () => {
    vi.useFakeTimers()
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    const r = new AppRegistry()
    const booted = vi.fn()
    await r.loadFromConfig({ apps: [app("slow", { on_boot: () => new Promise(() => {}) }), app("quick", { on_boot: booted })] })
    const boot = r.runBootHooks()
    await vi.advanceTimersByTimeAsync(10_000)
    await boot
    vi.useRealTimers()
    expect(booted).toHaveBeenCalled()
    expect(String(err.mock.calls.at(-1))).toMatch(/on_boot failed for "slow".*within 10s/)
  })

  it("never imports an app the server rejected", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const r = new AppRegistry()
    const init = vi.fn()
    await r.loadFromConfig({ apps: [{ ...app("old", { on_init: init }), _configError: "old needs Petal ^9; this is Petal 0.0.1" }] })
    expect(init).not.toHaveBeenCalled()
    expect(r.getFailedApps().get("old")).toBe("old needs Petal ^9; this is Petal 0.0.1")
  })
})

describe("AppRegistry precedence", () => {
  it("registers apps in config order however fast each one loads, so later apps win", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    const r = new AppRegistry()
    let finishFirst!: () => void
    await Promise.all([
      r.loadFromConfig({
        apps: [
          app("first", { on_init: () => new Promise<void>((res) => { finishFirst = res }), overrides: { settings: { currency: "USD" } } }),
          app("second", { overrides: { settings: { currency: "INR" } } }),
        ],
      }),
      Promise.resolve().then(() => finishFirst()), // "first" finishes after "second"
    ])
    expect(r.getAll().map((a) => a.meta.name)).toEqual(["first", "second"])
    expect(r.getMergedSettings()).toMatchObject({ currency: "INR" })
  })
})
