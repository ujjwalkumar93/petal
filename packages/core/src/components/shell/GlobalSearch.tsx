"use client"

import { useRouter } from "next/navigation"
import { useFrappe } from "@/hooks/useFrappe"
import { GlobalSearch as GlobalSearchUI } from "@petal/ui"
import type { GlobalSearchNavItem } from "@petal/ui"

const NAV_ITEMS: GlobalSearchNavItem[] = [
  { id: "nav-home",      label: "Home",      sublabel: "Dashboard",    href: "/" },
  { id: "nav-browse",    label: "Browse",    sublabel: "All DocTypes", href: "/browse" },
  { id: "nav-reports",   label: "Reports",   sublabel: "All Reports",  href: "/reports" },
  { id: "nav-settings",  label: "Settings",  sublabel: "App Settings", href: "/settings" },
  { id: "nav-developer", label: "Developer", sublabel: "Tools",        href: "/developer" },
]

/** Petal-wired GlobalSearch: injects frappe client + Next.js router. */
export function GlobalSearch() {
  const frappe = useFrappe()
  const router = useRouter()

  async function fetchDoctypes() {
    const res = await frappe.callMethod<{ values: unknown[][]; keys: string[] }>(
      "frappe.desk.reportview.get",
      {
        doctype: "DocType",
        fields: JSON.stringify(["name", "module"]),
        filters: JSON.stringify([["DocType", "istable", "=", 0], ["DocType", "issingle", "=", 0]]),
        order_by: "name asc",
        start: 0,
        page_length: 1000,
        view: "List",
        with_comment_count: 0,
      },
    )
    if (!res || !("values" in res) || !("keys" in res)) return []
    return res.values.map((row) =>
      Object.fromEntries(res.keys.map((k, i) => [k, row[i]])) as { name: string; module: string },
    )
  }

  async function fetchReports() {
    const res = await frappe.callMethod<{ values: unknown[][]; keys: string[] }>(
      "frappe.desk.reportview.get",
      {
        doctype: "Report",
        fields: JSON.stringify(["name", "ref_doctype"]),
        filters: JSON.stringify([["Report", "disabled", "=", 0]]),
        order_by: "name asc",
        start: 0,
        page_length: 1000,
        view: "List",
        with_comment_count: 0,
      },
    )
    if (!res || !("values" in res) || !("keys" in res)) return []
    return res.values.map((row) =>
      Object.fromEntries(res.keys.map((k, i) => [k, row[i]])) as { name: string; ref_doctype: string },
    )
  }

  async function globalSearch(text: string) {
    try {
      const res = await frappe.callMethod<{ doctype: string; name: string; content?: string }[]>(
        "frappe.utils.global_search.search",
        { text, doctype: "", ignore_permissions: false },
      )
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  }

  return (
    <GlobalSearchUI
      navItems={NAV_ITEMS}
      onFetchDoctypes={fetchDoctypes}
      onFetchReports={fetchReports}
      onGlobalSearch={globalSearch}
      onNavigate={(href) => router.push(href)}
    />
  )
}
