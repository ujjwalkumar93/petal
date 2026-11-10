"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { confirmLeave, isInAppNavigation, registerLeaveGuard } from "@/lib/nav/leave-guard"

/**
 * Warns before unsaved changes are lost:
 *  - reload, tab close, typing a new URL → the browser's own "Leave site?" prompt
 *  - clicking any in-app link (sidebar, breadcrumbs, link fields…) → confirm dialog
 *  - programmatic navigation that calls confirmLeave() (global search, logout)
 *
 * Not covered: the browser Back button inside the app (the App Router owns
 * popstate and offers no way to cancel it).
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

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [hasChanges])
}
