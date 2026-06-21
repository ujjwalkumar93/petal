"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResultKind = "doctype" | "report" | "document" | "nav" | "calc" | "new"

interface Result {
  id: string
  kind: ResultKind
  label: string
  sublabel?: string
  href?: string
  action?: () => void
}

export interface GlobalSearchDoctype {
  name: string
  module: string
}

export interface GlobalSearchReport {
  name: string
  ref_doctype: string
}

export interface GlobalSearchDocument {
  doctype: string
  name: string
  content?: string
}

export interface GlobalSearchNavItem {
  id: string
  label: string
  sublabel?: string
  href: string
}

export interface GlobalSearchProps {
  /** Fetch the full doctype index once on open. */
  onFetchDoctypes: () => Promise<GlobalSearchDoctype[]>
  /** Fetch the full report index once on open. */
  onFetchReports: () => Promise<GlobalSearchReport[]>
  /** Full-text search across all documents. Called with 300 ms debounce. */
  onGlobalSearch: (text: string) => Promise<GlobalSearchDocument[]>
  /** Navigate to a URL. Inject `router.push` from your framework. */
  onNavigate: (href: string) => void
  /**
   * Static navigation items always shown when the palette is empty.
   * Defaults to an empty array — pass your app's nav shortcuts here.
   */
  navItems?: GlobalSearchNavItem[]
}

// ---------------------------------------------------------------------------
// Safe math calculator
// ---------------------------------------------------------------------------

const MATH_RE = /^[\d\s+\-*/().%^]+$/

function evalMath(expr: string): string | null {
  const clean = expr.trim()
  if (!MATH_RE.test(clean)) return null
  try {
    const result = Function(`"use strict"; return (${clean.replace(/\^/g, "**")})`)()
    if (typeof result !== "number" || !isFinite(result)) return null
    return String(parseFloat(result.toPrecision(12)))
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function Icon({ kind }: { kind: ResultKind }) {
  const cls = "w-4 h-4"
  if (kind === "doctype") return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
    </svg>
  )
  if (kind === "report") return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
  if (kind === "document") return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
  if (kind === "calc") return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
  if (kind === "new") return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

const KIND_COLOR: Record<ResultKind, string> = {
  doctype:  "bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400",
  report:   "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  document: "bg-amber-100  text-amber-600  dark:bg-amber-900/30  dark:text-amber-400",
  nav:      "bg-muted       text-muted-foreground",
  calc:     "bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-400",
  new:      "bg-primary/10 text-primary",
}

const KIND_LABEL: Record<ResultKind, string> = {
  doctype:  "DocType",
  report:   "Report",
  document: "Document",
  nav:      "Go to",
  calc:     "Result",
  new:      "Create",
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

interface PaletteProps {
  navItems: GlobalSearchNavItem[]
  onFetchDoctypes: () => Promise<GlobalSearchDoctype[]>
  onFetchReports: () => Promise<GlobalSearchReport[]>
  onGlobalSearch: (text: string) => Promise<GlobalSearchDocument[]>
  onNavigate: (href: string) => void
  onClose: () => void
}

function Palette({
  navItems,
  onFetchDoctypes,
  onFetchReports,
  onGlobalSearch,
  onNavigate,
  onClose,
}: PaletteProps) {
  const inputRef      = useRef<HTMLInputElement>(null)
  const listRef       = useRef<HTMLDivElement>(null)
  const keyboardNavRef = useRef(false)

  const [query,      setQuery]      = useState("")
  const [cursor,     setCursor]     = useState(0)
  const [docResults, setDocResults] = useState<GlobalSearchDocument[]>([])
  const [searching,  setSearching]  = useState(false)
  const [doctypes,   setDoctypes]   = useState<GlobalSearchDoctype[]>([])
  const [reports,    setReports]    = useState<GlobalSearchReport[]>([])

  // Keep latest callbacks in refs to avoid stale closures in async handlers
  const fetchDoctypesRef   = useRef(onFetchDoctypes)
  const fetchReportsRef    = useRef(onFetchReports)
  const globalSearchRef    = useRef(onGlobalSearch)
  useEffect(() => { fetchDoctypesRef.current   = onFetchDoctypes   }, [onFetchDoctypes])
  useEffect(() => { fetchReportsRef.current    = onFetchReports    }, [onFetchReports])
  useEffect(() => { globalSearchRef.current    = onGlobalSearch    }, [onGlobalSearch])

  useEffect(() => {
    inputRef.current?.focus()
    Promise.all([
      fetchDoctypesRef.current().catch(() => [] as GlobalSearchDoctype[]),
      fetchReportsRef.current().catch(()  => [] as GlobalSearchReport[]),
    ]).then(([dts, rpts]) => {
      setDoctypes(dts)
      setReports(rpts)
    })
  }, [])

  // Debounced global search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (query.trim().length < 2) { setDocResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await globalSearchRef.current(query.trim())
        setDocResults(Array.isArray(res) ? res.slice(0, 6) : [])
      } catch {
        setDocResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    const all: Result[] = []

    if (q) {
      const calcResult = evalMath(q)
      if (calcResult !== null) {
        all.push({ id: "calc", kind: "calc", label: calcResult, sublabel: query.trim() })
      }
    }

    const navMatches = q
      ? navItems.filter((n) =>
          n.label.toLowerCase().includes(q) || (n.sublabel ?? "").toLowerCase().includes(q),
        )
      : navItems
    navMatches.forEach((n) =>
      all.push({
        id: n.id, kind: "nav", label: n.label, href: n.href,
        ...(n.sublabel !== undefined && { sublabel: n.sublabel }),
      }),
    )

    if (q) {
      const dtMatches = doctypes.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6)

      dtMatches.slice(0, 2).forEach((d) =>
        all.push({
          id: `new-${d.name}`,
          kind: "new",
          label: `New ${d.name}`,
          sublabel: d.module,
          href: `/form/${encodeURIComponent(d.name)}/new`,
        }),
      )
      dtMatches.forEach((d) =>
        all.push({
          id: `dt-${d.name}`,
          kind: "doctype",
          label: d.name,
          sublabel: d.module,
          href: `/list/${encodeURIComponent(d.name)}`,
        }),
      )

      reports
        .filter((r) => r.name.toLowerCase().includes(q))
        .slice(0, 6)
        .forEach((r) =>
          all.push({
            id: `rpt-${r.name}`,
            kind: "report",
            label: r.name,
            sublabel: r.ref_doctype,
            href: `/report/${encodeURIComponent(r.name)}`,
          }),
        )

      docResults.forEach((d) =>
        all.push({
          id: `doc-${d.doctype}-${d.name}`,
          kind: "document",
          label: d.name,
          sublabel: d.doctype,
          href: `/form/${encodeURIComponent(d.doctype)}/${encodeURIComponent(d.name)}`,
        }),
      )
    }

    return all
  }, [query, doctypes, reports, docResults, navItems])

  // Keep cursor in bounds when results shrink (e.g. user clears part of query)
  const clampedCursor = Math.min(cursor, Math.max(results.length - 1, 0))

  // Reset cursor only when the query changes, not on every async result update.
  // Resetting on `results` causes the highlight to jump every time docResults arrive.
  useEffect(() => setCursor(0), [query])

  // Only scroll the list when keyboard navigation moved the cursor, not on mouse hover.
  useEffect(() => {
    if (!keyboardNavRef.current) return
    keyboardNavRef.current = false
    const el = listRef.current?.children[clampedCursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [clampedCursor])

  const navigate = useCallback((r: Result) => {
    onClose()
    // Schedule navigation after the modal unmounts to avoid React batching
    // the setOpen(false) and router.push together in a way that drops the push.
    setTimeout(() => {
      if (r.action) r.action()
      else if (r.href) onNavigate(r.href)
    }, 0)
  }, [onNavigate, onClose])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); keyboardNavRef.current = true; setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); keyboardNavRef.current = true; setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === "Enter")     { e.preventDefault(); const r = results[clampedCursor]; if (r) navigate(r) }
    if (e.key === "Escape")    { onClose() }
  }

  const sections = useMemo(() => {
    const order: ResultKind[] = ["calc", "nav", "new", "doctype", "report", "document"]
    const map = new Map<ResultKind, Result[]>()
    for (const r of results) {
      const list = map.get(r.kind) ?? []
      list.push(r)
      map.set(r.kind, list)
    }
    return order.flatMap((kind) => {
      const items = map.get(kind)
      if (!items?.length) return []
      return [{ kind, items }]
    })
  }, [results])

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center px-4 pt-[10vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <svg className="h-5 w-5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M16 16l4 4" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search doctypes, reports, documents…"
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searching && (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          <kbd className="hidden h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {results.length === 0 && query.trim().length >= 2 && !searching && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </p>
          )}
          {results.length === 0 && query.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type to search doctypes, reports, or documents…
            </p>
          )}

          {sections.map(({ kind, items }) => {
            const first = items[0]
            const flatIdx = first !== undefined ? results.indexOf(first) : 0
            return (
              <div key={kind}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {KIND_LABEL[kind]}
                </p>
                {items.map((r, i) => {
                  const globalIdx = flatIdx + i
                  const isActive  = clampedCursor === globalIdx
                  return (
                    <button
                      key={r.id}
                      onMouseEnter={() => setCursor(globalIdx)}
                      onMouseDown={(e) => { e.preventDefault(); navigate(r) }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-accent"
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${KIND_COLOR[r.kind]}`}>
                        <Icon kind={r.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                          {r.kind === "calc" ? (
                            <>
                              <span className="font-bold">{r.label}</span>
                              <span className="ml-2 text-xs font-normal text-muted-foreground">= {r.sublabel}</span>
                            </>
                          ) : r.label}
                        </span>
                        {r.sublabel && r.kind !== "calc" && (
                          <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                        )}
                      </span>
                      {r.href && (
                        <svg
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${isActive ? "opacity-60" : "opacity-0"}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">↵</kbd>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GlobalSearch — exported trigger + palette
// ---------------------------------------------------------------------------

/**
 * Command-palette–style search triggered by Cmd+K / Ctrl+K.
 * Renders a search button (desktop) + icon button (mobile); opens a full-screen palette on click or shortcut.
 *
 * All data fetching and navigation are injected as callbacks so the component
 * works with any Frappe client or router implementation.
 *
 * @example
 * <GlobalSearch
 *   navItems={NAV_ITEMS}
 *   onFetchDoctypes={() => frappe.fetchDoctypeIndex()}
 *   onFetchReports={() => frappe.fetchReportIndex()}
 *   onGlobalSearch={(q) => frappe.globalSearch(q)}
 *   onNavigate={(href) => router.push(href)}
 * />
 */
export function GlobalSearch({
  onFetchDoctypes,
  onFetchReports,
  onGlobalSearch,
  onNavigate,
  navItems = [],
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      {/* Desktop trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-transparent bg-muted px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground md:flex"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M16 16l4 4" />
        </svg>
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-foreground transition-colors hover:bg-accent md:hidden"
        aria-label="Search"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M16 16l4 4" />
        </svg>
      </button>

      {open && (
        <Palette
          navItems={navItems}
          onFetchDoctypes={onFetchDoctypes}
          onFetchReports={onFetchReports}
          onGlobalSearch={onGlobalSearch}
          onNavigate={onNavigate}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
