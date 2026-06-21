"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useFrappe } from "@/hooks/useFrappe"
import { TreeView } from "@petal/ui"
import type { TreeNode } from "@petal/ui"

// ---------------------------------------------------------------------------
// Frappe treeview API response shape
// ---------------------------------------------------------------------------

type FrappeTreeChild = {
  value: string          // = name
  title?: string         // = display label
  expandable?: 0 | 1
  root_type?: string
  account_type?: string
  account_currency?: string
  balance?: number
  is_group?: 0 | 1
  name?: string
  [key: string]: unknown
}

function toTreeNode(raw: FrappeTreeChild): TreeNode {
  const node: TreeNode = {
    name:     raw.value ?? raw.name ?? "",
    label:    raw.title ?? raw.value ?? raw.name ?? "",
    is_group: Boolean(raw.expandable ?? raw.is_group),
  }
  if (raw.root_type        != null) node.root_type        = raw.root_type
  if (raw.account_type     != null) node.account_type     = raw.account_type
  if (raw.account_currency != null) node.account_currency = raw.account_currency
  if (raw.balance          != null) node.balance          = raw.balance
  return node
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TreePage() {
  const params        = useParams()
  const doctype       = decodeURIComponent(params.doctype as string)
  const router        = useRouter()
  const searchParams  = useSearchParams()

  const frappe = useFrappe()

  // Optional: company filter (common for Account, Cost Center, etc.)
  const company = searchParams.get("company") ?? undefined

  const [rootNodes, setRootNodes] = useState<TreeNode[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Fetch root nodes on mount
  useEffect(() => {
    setLoading(true)
    setError(null)

    frappe.callMethod<FrappeTreeChild[]>("frappe.desk.treeview.get_children", {
      doctype,
      ...(company ? { company } : {}),
    })
      .then((res) => {
        const nodes = (Array.isArray(res) ? res : [])
        setRootNodes(nodes.map(toTreeNode))
      })
      .catch(() => setError(`Could not load ${doctype} tree.`))
      .finally(() => setLoading(false))
  }, [frappe, doctype, company])

  // Fetch children of a group node when expanded
  const fetchChildren = useCallback(async (parentName: string): Promise<TreeNode[]> => {
    const res = await frappe.callMethod<FrappeTreeChild[]>("frappe.desk.treeview.get_children", {
      doctype,
      parent: parentName,
      ...(company ? { company } : {}),
    })
    return (Array.isArray(res) ? res : []).map(toTreeNode)
  }, [frappe, doctype, company])

  function handleNodeClick(node: TreeNode) {
    router.push(`/form/${encodeURIComponent(doctype)}/${encodeURIComponent(node.name)}`)
  }

  function handleNewClick(parentName: string) {
    const url = new URL(`/form/${encodeURIComponent(doctype)}/new`, window.location.origin)
    // Pre-fill the parent field based on common Frappe tree doctype naming
    const parentField = guessParentField(doctype)
    if (parentField) url.searchParams.set(parentField, parentName)
    router.push(url.pathname + url.search)
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          Home
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-semibold text-foreground">{doctype}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{doctype}</h1>
        <div className="flex items-center gap-2">
          {/* Switch to flat list */}
          <Link
            href={`/list/${encodeURIComponent(doctype)}${company ? `?company=${encodeURIComponent(company)}` : ""}`}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List View
          </Link>

          <button
            onClick={() => handleNewClick("")}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-background border border-border rounded-xl px-3 py-2">
        {error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <TreeView
            rootNodes={loading ? [] : rootNodes}
            onFetchChildren={fetchChildren}
            onNodeClick={handleNodeClick}
            onNewClick={handleNewClick}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Guess the parent field name from the doctype (Frappe convention)
// ---------------------------------------------------------------------------

function guessParentField(doctype: string): string | null {
  const known: Record<string, string> = {
    "Account":        "parent_account",
    "Cost Center":    "parent_cost_center",
    "Item Group":     "parent_item_group",
    "Customer Group": "parent_customer_group",
    "Supplier Group": "parent_supplier_group",
    "Territory":      "parent_territory",
    "Sales Person":   "parent_sales_person",
    "Department":     "parent_department",
    "Task":           "parent_task",
  }
  if (known[doctype]) return known[doctype]
  // Frappe convention: parent_{snake_case_doctype}
  return `parent_${doctype.toLowerCase().replace(/\s+/g, "_")}`
}
