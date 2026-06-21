"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "../lib/utils"
import { Skeleton } from "./skeleton"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NumberCardDoc {
  name: string
  label: string
  type: "Document Type" | "Report" | "Custom"
  document_type?: string
  parent_document_type?: string
  function: "Count" | "Sum" | "Average" | "Minimum" | "Maximum"
  aggregate_function_based_on?: string
  filters_json?: string
  currency?: string
  show_full_number?: 0 | 1
  show_percentage_stats?: 0 | 1
  stats_time_interval?: "Daily" | "Weekly" | "Monthly" | "Yearly"
  color?: string
  background_color?: string
}

export interface NumberCardFrappe {
  getDoc: <T = Record<string, unknown>>(doctype: string, name: string) => Promise<T>
  callMethod: <T = unknown>(method: string, args?: Record<string, unknown>, options?: { cache?: boolean }) => Promise<T>
}

export interface NumberCardProps {
  cardName: string
  frappe: NumberCardFrappe
  /** Extra filters merged on top of the card's own filters_json */
  filters?: unknown[]
  className?: string
  /** Called when the user clicks the edit button */
  onEdit?: () => void
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function currencySymbol(currency: string): string {
  try {
    return (0)
      .toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .replace(/[\d,.\s]/g, "")
      .trim()
  } catch {
    return currency + " "
  }
}

function abbreviate(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B"
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toLocaleString()
}

function formatValue(value: number, fieldtype: string, currency: string, showFull: boolean): string {
  if (fieldtype === "Currency") {
    if (showFull) {
      return value.toLocaleString(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
    return currencySymbol(currency) + abbreviate(value)
  }
  if (fieldtype === "Percent") {
    return value.toFixed(2) + "%"
  }
  if (fieldtype === "Float") {
    return showFull
      ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : abbreviate(value)
  }
  // Count / Int / default → integer
  return showFull ? Math.round(value).toLocaleString() : abbreviate(Math.round(value))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NumberCard({ cardName, frappe, filters, className, onEdit }: NumberCardProps) {
  const [doc, setDoc]             = useState<NumberCardDoc | null>(null)
  const [value, setValue]         = useState<number | null>(null)
  const [pctChange, setPctChange] = useState<number | null | undefined>(undefined)
  const [fieldtype, setFieldtype] = useState("Int")
  const [currency, setCurrency]   = useState("USD")
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // Track whether we've loaded at least once so refreshes don't show the full skeleton
  const loadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)
      if (!loadedOnce.current) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const cardDoc = await frappe.getDoc<NumberCardDoc>("Number Card", cardName)
        if (cancelled) return
        setDoc(cardDoc)

        // Merge the card's stored filters with any runtime filters up-front
        const baseFilters = cardDoc.filters_json ? (JSON.parse(cardDoc.filters_json) as unknown[]) : []
        const mergedFilters = filters ? [...baseFilters, ...filters] : baseFilters

        const needsFieldtype =
          cardDoc.function !== "Count" &&
          cardDoc.aggregate_function_based_on &&
          cardDoc.document_type

        // Resolve fieldtype + fetch result in parallel (they don't depend on each other)
        const [ft, result] = await Promise.all([
          needsFieldtype
            ? frappe
                .getDoc<{ fields?: Array<{ fieldname: string; fieldtype: string }> }>(
                  "DocType",
                  cardDoc.document_type!,
                )
                .then((dtDoc) => {
                  const field = dtDoc.fields?.find(
                    (f) => f.fieldname === cardDoc.aggregate_function_based_on,
                  )
                  return field?.fieldtype ?? "Int"
                })
                .catch(() => "Int")
            : Promise.resolve("Int"),
          frappe.callMethod<number>(
            "frappe.desk.doctype.number_card.number_card.get_result",
            { doc: cardDoc, filters: mergedFilters },
            { cache: true },
          ),
        ])
        if (cancelled) return

        setFieldtype(ft)

        // Resolve currency: card doc > system default > "USD"
        if (ft === "Currency") {
          if (cardDoc.currency) {
            setCurrency(cardDoc.currency)
          } else {
            try {
              const res = await frappe.callMethod<{ currency?: string }>(
                "frappe.client.get_value",
                { doctype: "System Settings", filters: {}, fieldname: "currency" },
                { cache: true },
              )
              if (!cancelled && res?.currency) setCurrency(res.currency)
            } catch {
              // non-fatal — keep "USD"
            }
          }
        }

        if (cancelled) return
        setValue(result)

        // Fetch % change vs previous period
        if (cardDoc.show_percentage_stats) {
          try {
            const pct = await frappe.callMethod<number | null>(
              "frappe.desk.doctype.number_card.number_card.get_percentage_difference",
              { doc: cardDoc, filters: mergedFilters, result },
              { cache: true },
            )
            if (!cancelled) setPctChange(pct ?? null)
          } catch {
            if (!cancelled) setPctChange(null)
          }
        } else {
          if (!cancelled) setPctChange(null)
        }

        loadedOnce.current = true
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [cardName, frappe, filters, refreshKey])

  // ---- Loading skeleton (first load only) ----
  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5 flex flex-col gap-3", className)}>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  // ---- Error state ----
  if (error || !doc) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5 flex items-center justify-center min-h-[90px] group", className)}>
        <p className="text-xs text-destructive flex-1">{error ?? "No data"}</p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton title="Refresh" onClick={() => setRefreshKey((k) => k + 1)} spinning={refreshing}>
            <RefreshIcon />
          </ActionButton>
        </div>
      </div>
    )
  }

  const showFull = doc.show_full_number === 1
  const formatted = value !== null
    ? formatValue(value, fieldtype, currency, showFull)
    : "—"

  const pctUp   = typeof pctChange === "number" && pctChange > 0
  const pctDown = typeof pctChange === "number" && pctChange < 0
  const pctFlat = typeof pctChange === "number" && pctChange === 0

  return (
    <div
      className={cn("rounded-xl border border-border bg-card p-5 flex flex-col gap-1.5 group", className)}
      style={{
        ...(doc.background_color ? { backgroundColor: doc.background_color } : {}),
        ...(doc.color ? { color: doc.color } : {}),
      }}
    >
      {/* Label + hover actions */}
      <div className="flex items-center gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate flex-1">
          {doc.label}
        </p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <ActionButton title="Refresh" onClick={() => setRefreshKey((k) => k + 1)} spinning={refreshing}>
            <RefreshIcon />
          </ActionButton>
          {onEdit && (
            <ActionButton title="Edit" onClick={onEdit}>
              <EditIcon />
            </ActionButton>
          )}
        </div>
      </div>

      {/* Value */}
      <p className="text-3xl font-bold tabular-nums leading-none tracking-tight">
        {formatted}
      </p>

      {/* % change badge */}
      {typeof pctChange === "number" && (
        <p
          className={cn(
            "text-xs font-medium flex items-center gap-0.5 mt-0.5",
            pctUp   && "text-green-600 dark:text-green-400",
            pctDown && "text-red-500 dark:text-red-400",
            pctFlat && "text-muted-foreground",
          )}
        >
          {pctUp && (
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          )}
          {pctDown && (
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {Math.abs(pctChange).toFixed(1)}% vs last {doc.stats_time_interval?.toLowerCase() ?? "period"}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function ActionButton({
  title,
  onClick,
  spinning,
  children,
}: {
  title: string
  onClick: () => void
  spinning?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
        spinning && "animate-spin text-muted-foreground/50 pointer-events-none",
      )}
    >
      {children}
    </button>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
