// Unsaved-changes protection shared by every way of leaving a page.
//
// Pages with editable state register a guard (see useUnsavedChangesGuard).
// Links are covered automatically by the hook; code that navigates
// programmatically on a user's behalf (global search, logout, Desk links)
// asks confirmLeave() first.

export const LEAVE_MESSAGE = "You have unsaved changes. Leave this page and discard them?"

const guards = new Set<() => boolean>()

/** Register a predicate that returns true while there are unsaved changes. Returns an unregister function. */
export function registerLeaveGuard(hasChanges: () => boolean): () => void {
  guards.add(hasChanges)
  return () => { guards.delete(hasChanges) }
}

export function hasUnsavedChanges(): boolean {
  for (const hasChanges of guards) if (hasChanges()) return true
  return false
}

/** True when it is fine to navigate away: nothing unsaved, or the user agreed to discard it. */
export function confirmLeave(message: string = LEAVE_MESSAGE): boolean {
  if (!hasUnsavedChanges()) return true
  return typeof window === "undefined" ? true : window.confirm(message)
}

/**
 * Whether a click on this anchor would make the app navigate to another page
 * in the same tab (what the guard must intercept). Modified clicks, new tabs,
 * downloads and in-page hash links leave the current page intact.
 */
export function isInAppNavigation(event: MouseEvent, anchor: HTMLAnchorElement, current: Location): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const target = anchor.getAttribute("target")
  if (target && target !== "_self") return false
  if (anchor.hasAttribute("download")) return false
  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("#")) return false
  let url: URL
  try { url = new URL(anchor.href, current.href) } catch { return false }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false
  // Same page, different hash only: no navigation.
  return !(url.origin === current.origin && url.pathname === current.pathname && url.search === current.search)
}
