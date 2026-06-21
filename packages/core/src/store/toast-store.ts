import { create } from "zustand"

export type ToastVariant = "error" | "warning" | "success" | "info"

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  detail?: string
}

interface ToastState {
  items: ToastItem[]
  push: (item: Omit<ToastItem, "id">) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (item) =>
    set((s) => ({
      // Cap at 5 visible toasts; drop the oldest
      items: [...s.items.slice(-4), { ...item, id: crypto.randomUUID() }],
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

function push(variant: ToastVariant, title: string, detail?: string) {
  useToastStore.getState().push({ variant, title, ...(detail !== undefined ? { detail } : {}) })
}

export const toast = {
  error:   (title: string, detail?: string) => push("error",   title, detail),
  warning: (title: string, detail?: string) => push("warning", title, detail),
  success: (title: string, detail?: string) => push("success", title, detail),
  info:    (title: string, detail?: string) => push("info",    title, detail),
}

// ---------------------------------------------------------------------------
// Convert any thrown value into a short, readable { title, detail? } pair
// ---------------------------------------------------------------------------

export function humanizeError(err: unknown): { title: string; detail?: string } {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err)
  const msg = raw ?? ""

  if (/ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module/i.test(msg)) {
    return { title: "App update available — please refresh the page." }
  }
  if (/Failed to fetch|NetworkError|net::ERR_|Load failed|ECONNREFUSED/i.test(msg)) {
    return { title: "Network error — check your connection and try again.", detail: msg }
  }
  if (/Hydration|hydration|did not match|Expected server HTML|Text content does not match/i.test(msg)) {
    return { title: "Page render mismatch — try refreshing." }
  }
  if (/401|Unauthorized|Session expired/i.test(msg)) {
    return { title: "Session expired — please log in again." }
  }
  if (/403|Forbidden|PermissionError|Not permitted|not allowed/i.test(msg)) {
    return { title: "You don't have permission to do this.", detail: msg }
  }
  if (/404|Not Found|doesn't exist|does not exist/i.test(msg)) {
    return { title: "Resource not found.", detail: msg }
  }
  if (/maximum update depth/i.test(msg)) {
    return { title: "Infinite re-render loop detected — please report this." }
  }

  // Short, specific messages (e.g. from FrappeClient error parsing) show as-is
  if (msg.length > 0 && msg.length <= 200 && !msg.includes("at ") && !/^\s*Error/.test(msg)) {
    return { title: msg }
  }

  return {
    title: "Something went wrong — please try again.",
    ...(msg.length > 0 ? { detail: msg } : {}),
  }
}
