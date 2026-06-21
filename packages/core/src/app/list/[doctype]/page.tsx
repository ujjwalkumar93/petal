"use client"
import { Suspense, lazy, useMemo, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import { useFrappe } from "@/hooks/useFrappe"
import { DocList, QuickEntryDialog } from "@petal/ui"
import type { DocListMeta, DocListFetchParams, DocListFilter, QuickEntryMeta, LinkFieldOption } from "@petal/ui"
import Link from "next/link"

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function ListPage() {
  const params       = useParams()
  const doctype      = decodeURIComponent(params.doctype as string)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const frappe       = useFrappe()
  const { hooks, settings } = usePetalStore()
  const currency = (settings.currency as string | undefined) ?? "USD"

  const viewParam = searchParams.get("view") === "grid" ? "grid" : "list"

  const [meta, setMeta]               = useState<DocListMeta | null>(null)
  const [metaErr, setMetaErr]         = useState(false)
  const [listKey, setListKey]         = useState(0)
  const [showQuickEntry, setShowQuickEntry] = useState(false)

  useEffect(() => {
    frappe.callMethod<{ docs: DocListMeta[] }>("frappe.desk.form.load.getdoctype", { doctype })
      .then((res) => {
        const m = res?.docs?.[0]
        if (!m) return
        if ((m as DocListMeta & { issingle?: number }).issingle === 1) {
          router.replace(`/form/${encodeURIComponent(doctype)}/${encodeURIComponent(doctype)}`)
          return
        }
        setMeta(m)
      })
      .catch(() => setMetaErr(true))
  }, [frappe, doctype, router])

  const override = hooks.list_overrides?.[doctype]
  const OverrideComponent = useMemo(() => (override ? lazy(override) : null), [override])

  async function fetchData(params: DocListFetchParams) {
    const [rows, total] = await Promise.all([
      frappe.getList({
        doctype,
        fields: params.fields,
        filters: params.filters,
        or_filters: params.or_filters,
        order_by: params.order_by,
        limit: params.limit,
        limit_start: params.limit_start,
      }),
      frappe.callMethod<number>("frappe.client.get_count", {
        doctype,
        filters: params.filters,
      }),
    ])
    return {
      rows: rows as Record<string, unknown>[],
      total: typeof total === "number" ? total : 0,
    }
  }

  async function handleDelete(names: string[]) {
    await frappe.callMethod("frappe.desk.reportview.delete_items", {
      items: JSON.stringify(names),
      doctype,
    })
  }

  async function handleCancel(names: string[]) {
    await Promise.all(
      names.map((name) =>
        frappe.callMethod("frappe.client.cancel", { doctype, name }),
      ),
    )
  }

  async function fetchLinkOptions(linkedDoctype: string, search: string): Promise<string[]> {
    const rows = await frappe.getList({
      doctype: linkedDoctype,
      fields: ["name"],
      filters: search ? [[linkedDoctype, "name", "like", `%${search}%`] as unknown as DocListFilter] : [],
      or_filters: [],
      order_by: "name asc",
      limit: 20,
      limit_start: 0,
    })
    return (rows as Array<{ name: string }>).map((r) => r.name)
  }

  // ── Quick Entry callbacks ──────────────────────────────────────────────────

  async function fetchQuickMeta(): Promise<QuickEntryMeta> {
    const res = await frappe.callMethod<{ docs: QuickEntryMeta[] }>(
      "frappe.desk.form.load.getdoctype",
      { doctype },
    )
    return res?.docs?.[0] ?? { fields: [] }
  }

  async function handleQuickSave(values: Record<string, unknown>): Promise<string> {
    const saved = await frappe.saveDoc(
      { doctype, ...values } as Parameters<typeof frappe.saveDoc>[0],
    )
    return String((saved as Record<string, unknown>).name ?? "")
  }

  function handleQuickSaved(_name: string) {
    setShowQuickEntry(false)
    setListKey((k) => k + 1) // force DocList refetch
  }

  function handleEditFull(values: Record<string, unknown>) {
    try {
      sessionStorage.setItem(`petal_quick_entry_${doctype}`, JSON.stringify(values))
    } catch {}
    router.push(`/form/${encodeURIComponent(doctype)}/new`)
  }

  async function fetchQuickLinkOptions(
    linkedDoctype: string,
    search: string,
  ): Promise<LinkFieldOption[]> {
    const names = await fetchLinkOptions(linkedDoctype, search)
    return names.map((name) => ({ value: name }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (metaErr) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-foreground">{doctype}</span>
        </div>
        <p className="text-muted-foreground text-sm">Could not load doctype metadata.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-semibold text-foreground">{doctype}</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{doctype}</h1>
        {override && (
          <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
            Custom View
          </span>
        )}
      </div>

      {OverrideComponent ? (
        <Suspense fallback={
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-8">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading custom view...
          </div>
        }>
          <OverrideComponent filters={{}} />
        </Suspense>
      ) : meta ? (
        <DocList
          key={listKey}
          doctype={doctype}
          meta={meta}
          onFetchData={fetchData}
          onFetchLinkOptions={fetchLinkOptions}
          onRowClick={(name) => router.push(`/form/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`)}
          onNewClick={() => {
            if (meta.quick_entry === 1) {
              setShowQuickEntry(true)
            } else {
              router.push(`/form/${encodeURIComponent(doctype)}/new`)
            }
          }}
          onDelete={handleDelete}
          {...(meta.is_submittable === 1 ? { onCancel: handleCancel } : {})}
          defaultView={viewParam}
          onViewChange={(v) => {
            const p = new URLSearchParams(searchParams.toString())
            p.set("view", v)
            router.replace(`?${p.toString()}`, { scroll: false })
          }}
          {...(meta.is_tree === 1 ? { onTreeClick: () => router.push(`/tree/${encodeURIComponent(doctype)}`) } : {})}
          currency={currency}
        />
      ) : (
        /* Meta loading skeleton */
        <div className="space-y-3">
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-4">
              {[100, 160, 120, 140].map((w, i) => (
                <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-border/50 px-4 py-3.5 flex gap-4">
                <div className="h-3 bg-muted/60 rounded animate-pulse w-24" />
                <div className="h-3 bg-muted/40 rounded animate-pulse w-36" />
              </div>
            ))}
          </div>
        </div>
      )}

      {meta?.quick_entry === 1 && (
        <QuickEntryDialog
          doctype={doctype}
          open={showQuickEntry}
          onClose={() => setShowQuickEntry(false)}
          onSaved={handleQuickSaved}
          onEditFull={handleEditFull}
          onFetchMeta={fetchQuickMeta}
          onSave={handleQuickSave}
          onFetchLinkOptions={fetchQuickLinkOptions}
        />
      )}
    </div>
  )
}
