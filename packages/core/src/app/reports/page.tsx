"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useFrappe } from "@/hooks/useFrappe"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType = "Query Report" | "Script Report" | "Report Builder" | string
type ViewMode = "grid" | "list"

interface ReportMeta {
  name: string
  report_type: ReportType
  ref_doctype: string
  module: string
  is_standard: "Yes" | "No"
  disabled: 0 | 1
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  "Query Report":   "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  "Script Report":  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Report Builder": "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
}

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"
}

function typeShort(type: string) {
  if (type === "Query Report")   return "QR"
  if (type === "Script Report")  return "SR"
  if (type === "Report Builder") return "RB"
  return type[0] ?? "R"
}

// ---------------------------------------------------------------------------
// View toggle icons
// ---------------------------------------------------------------------------

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const frappe = useFrappe()
  const [reports,    setReports]    = useState<ReportMeta[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const [view,       setView]       = useState<ViewMode>("grid")

  useEffect(() => {
    const fields = ["name", "report_type", "ref_doctype", "module", "is_standard", "disabled"]
    frappe
      .callMethod<{ values: unknown[][]; keys: string[] } | ReportMeta[]>(
        "frappe.desk.reportview.get",
        {
          doctype: "Report",
          fields: JSON.stringify(fields),
          filters: JSON.stringify([["Report", "disabled", "=", 0]]),
          order_by: "module asc, name asc",
          start: 0,
          page_length: 500,
          view: "List",
          with_comment_count: 0,
        },
      )
      .then((data) => {
        if (data && !Array.isArray(data) && "values" in data && "keys" in data) {
          const { keys, values } = data as { values: unknown[][]; keys: string[] }
          setReports(values.map((row) =>
            Object.fromEntries(keys.map((k, i) => [k, row[i]])) as unknown as ReportMeta,
          ))
        } else {
          setReports(Array.isArray(data) ? (data as ReportMeta[]) : [])
        }
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [frappe])

  const reportTypes = useMemo(() => {
    const types = Array.from(new Set(reports.map((r) => r.report_type))).sort()
    return ["All", ...types]
  }, [reports])

  const grouped = useMemo(() => {
    const filtered = reports.filter((r) => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ref_doctype?.toLowerCase().includes(search.toLowerCase()) ||
        r.module?.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "All" || r.report_type === typeFilter
      return matchesSearch && matchesType
    })
    const map = new Map<string, ReportMeta[]>()
    for (const r of filtered) {
      const module = r.module || "Other"
      const existing = map.get(module)
      if (existing) existing.push(r)
      else map.set(module, [r])
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [reports, search, typeFilter])

  const totalVisible = grouped.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-primary mb-2">Reports</h1>
        <p className="text-muted-foreground">Browse and run all available reports</p>
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search reports, doctypes, modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full max-w-xs"
        />

        <div className="flex gap-2 flex-wrap">
          {reportTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`h-8 px-3 text-xs font-medium rounded-full border transition-all ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {totalVisible} report{totalVisible !== 1 ? "s" : ""}
            </span>
          )}

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`h-8 w-8 flex items-center justify-center transition-colors ${
                view === "grid" ? "bg-primary/10" : "hover:bg-accent"
              }`}
              title="Grid view"
            >
              <GridIcon active={view === "grid"} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`h-8 w-8 flex items-center justify-center border-l border-border transition-colors ${
                view === "list" ? "bg-primary/10" : "hover:bg-accent"
              }`}
              title="List view"
            >
              <ListIcon active={view === "list"} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-lg font-semibold text-foreground mb-1">No reports found</h2>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([module, items]) => (
            <div key={module}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2 mb-3 flex items-center gap-2">
                {module}
                <span className="text-xs font-normal normal-case">{items.length}</span>
              </h2>

              {view === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {items.map((report) => (
                    <Link
                      key={report.name}
                      href={`/report/${encodeURIComponent(report.name)}`}
                      className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg
                                 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all group"
                    >
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${typeColor(report.report_type)}`}>
                        {typeShort(report.report_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                          {report.name}
                        </p>
                        {report.ref_doctype && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {report.ref_doctype}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  {items.map((report, i) => (
                    <Link
                      key={report.name}
                      href={`/report/${encodeURIComponent(report.name)}`}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors group ${
                        i !== 0 ? "border-t border-border/50" : ""
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${typeColor(report.report_type)}`}>
                        {typeShort(report.report_type)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {report.name}
                      </span>
                      {report.ref_doctype && (
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          {report.ref_doctype}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeColor(report.report_type)}`}>
                        {report.report_type}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
