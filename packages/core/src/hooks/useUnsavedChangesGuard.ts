"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { confirmLeave, isInAppNavigation, registerLeaveGuard } from "@/lib/nav/leave-guard"

/**
 * Warns before unsaved changes are lost:
 *  - reload, tab close, typing a new URL → the browser's own "Leave site?" prompt
 *  - clicking any in-app link (sidebar, breadcrumbs, link fields…) → confirm dialog
 *  - the browser Back/Forward buttons → confirm dialog; cancelling puts the
 *    page's history entry back (the forward history is lost, as browsers allow
 *    no other way to undo a traversal)
 *  - programmatic navigation through useGuardedRouter() or confirmLeave()
 */
export function useUnsavedChangesGuard(hasChanges: boolean): void {
  const ref = useRef(hasChanges)
  // Synced after commit, before the browser can dispatch the next click.
  useLayoutEffect(() => { ref.current = hasChanges }, [hasChanges])

  useEffect(() => registerLeaveGuard(() => ref.current), [])

  useEffect(() => {
    if (!hasChanges) return

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      // Legacy browsers only show the prompt when returnValue is set.
      e.returnValue = ""
    }

    // Capture phase on document runs before React's listener on the app root,
    // so cancelling here also stops next/link's client-side navigation.
    function onClick(e: MouseEvent) {
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!anchor || !isInAppNavigation(e, anchor, window.location)) return
      if (confirmLeave()) return
      e.preventDefault()
      e.stopPropagation()
    }

    // By the time popstate fires the URL has already changed. A capture
    // listener on window runs before the App Router's own (non-capture) one, so
    // stopping it here keeps the router on this page; the page's entry is then
    // pushed back so the address bar matches. The state includes Next's __NA
    // marker, so its patched pushState passes it through without re-routing.
    const here = { state: window.history.state as unknown, url: window.location.href }
    function onPopState(e: PopStateEvent) {
      const to = new URL(window.location.href)
      const from = new URL(here.url)
      if (to.pathname === from.pathname && to.search === from.search) return // hash only
      if (confirmLeave()) return
      e.stopImmediatePropagation()
      window.history.pushState(here.state, "", here.url)
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("popstate", onPopState, true)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("popstate", onPopState, true)
      document.removeEventListener("click", onClick, true)
    }
  }, [hasChanges])
}
