"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { confirmLeave } from "@/lib/nav/leave-guard"

/**
 * useRouter() whose push/replace/back/forward first ask to discard unsaved
 * changes (see useUnsavedChangesGuard). Use it for navigation the user starts
 * from a page that may hold edits: shell actions, link-field "create new",
 * scripts' frappe.set_route. refresh() and prefetch() never leave the page.
 */
export function useGuardedRouter(): ReturnType<typeof useRouter> {
  const router = useRouter()
  return useMemo(() => ({
    ...router,
    push: (href, options) => { if (confirmLeave()) router.push(href, options) },
    replace: (href, options) => { if (confirmLeave()) router.replace(href, options) },
    back: () => { if (confirmLeave()) router.back() },
    forward: () => { if (confirmLeave()) router.forward() },
  }), [router])
}
