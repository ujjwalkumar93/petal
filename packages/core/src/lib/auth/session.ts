import type { QueryClient } from "@tanstack/react-query"
import { getFrappeClient } from "@/hooks/useFrappe"
import { clearSidebarCache } from "@/lib/sidebar/frappe-sidebar"
import { usePetalStore } from "@/store/petal-store"
import { safeInternalPath } from "@/lib/nav/safe-path"

/**
 * Forget everything the previous user's session left in this tab: FrappeClient's
 * response cache and CSRF token, React Query's cache, the cached workspace
 * sidebar (petal:sidebar) and the store's per-user state (user, sidebar items,
 * setup check). Used on logout and when the session expires, so the next person
 * to sign in on this tab never sees the last one's data.
 */
export function resetSession(queryClient?: QueryClient): void {
  getFrappeClient().resetSession()
  queryClient?.clear()
  clearSidebarCache()
  usePetalStore.getState().resetUserState()
}

/** Login URL that returns the user to `currentPath` afterwards (read back with loginRedirectTarget). */
export function loginPathFor(currentPath: string): string {
  if (!currentPath || currentPath === "/" || currentPath.startsWith("/login")) return "/login"
  return `/login?redirect=${encodeURIComponent(currentPath)}`
}

/** Where the login page should go after signing in: the `redirect` param, if it is a same-origin path. */
export function loginRedirectTarget(search: string): string | null {
  return safeInternalPath(new URLSearchParams(search).get("redirect"))
}
