import { afterEach } from "vitest"

// Node ≥25 defines its own localStorage/sessionStorage globals (localStorage is
// undefined without --localstorage-file). They shadow jsdom's Web Storage in
// the jsdom environment, so point the globals back at jsdom's implementations.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom
if (dom) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
  }
}

// Unmount React trees rendered by @testing-library between tests (jsdom only).
afterEach(async () => {
  if (typeof document === "undefined") return
  const { cleanup } = await import("@testing-library/react")
  cleanup()
})
