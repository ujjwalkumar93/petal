"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"

export interface LinkFieldOption {
  value: string
  description?: string
}

export interface LinkFieldProps {
  value: string
  onChange: (value: string) => void
  /**
   * Async function that returns matching options for the given query string.
   * Called on focus (empty query → recent/default results) and on keystroke with debounce.
   *
   * @example
   * onSearch={async (q) => frappe.callMethod("frappe.desk.search.search_link", { txt: q, doctype: "Customer" })}
   */
  onSearch: (query: string) => Promise<LinkFieldOption[]>
  /**
   * Called when the user clicks "Create new". Omit to hide the option.
   *
   * @example
   * onCreateNew={() => router.push("/form/Customer/new")}
   */
  onCreateNew?: () => void
  /** Label shown in "Create new <label>" – e.g. the linked doctype name */
  createLabel?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Autocomplete input for Frappe Link fields.
 * Fully decoupled from Frappe/Next.js — search and navigation are injected as callbacks.
 *
 * @example
 * <LinkField
 *   value={doc.customer}
 *   onChange={(v) => setField("customer", v)}
 *   onSearch={(q) => frappe.searchLink("Customer", q)}
 *   onCreateNew={() => router.push("/form/Customer/new")}
 *   createLabel="Customer"
 * />
 */
export function LinkField({
  value,
  onChange,
  onSearch,
  onCreateNew,
  createLabel,
  placeholder = "Search…",
  disabled,
  id,
  className,
  style,
}: LinkFieldProps) {
  const [query, setQuery]           = useState(value)
  const [open, setOpen]             = useState(false)
  const [cursor, setCursor]         = useState(0)
  const [results, setResults]       = useState<LinkFieldOption[]>([])
  const [loading, setLoading]       = useState(false)
  const [dropPos, setDropPos]       = useState<{ top: number; left: number; width: number } | null>(null)

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLUListElement>(null)
  const searchRef = useRef(onSearch)

  // Keep latest onSearch ref to avoid stale closures in setTimeout
  useEffect(() => { searchRef.current = onSearch })

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const outsideWrap = wrapRef.current && !wrapRef.current.contains(target)
      const outsideList = listRef.current && !listRef.current.contains(target)
      if (outsideWrap && outsideList) {
        setOpen(false)
        setQuery(value) // revert uncommitted query
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [value])

  // Scroll highlighted option into view
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  // Track input position for the portal dropdown
  useEffect(() => {
    if (!open) { setDropPos(null); return }
    function update() {
      if (!wrapRef.current) return
      const r = wrapRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [open])

  const search = useCallback((txt: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const delay = txt.trim() ? 250 : 0
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const list = await searchRef.current(txt)
        setResults(list)
        setCursor(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, delay)
  }, [])

  function pick(option: LinkFieldOption) {
    onChange(option.value)
    setQuery(option.value)
    setOpen(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) { setOpen(true); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === "Enter")     { e.preventDefault(); if (results[cursor]) pick(results[cursor]) }
    if (e.key === "Escape")    { setOpen(false); setQuery(value) }
  }

  return (
    <div ref={wrapRef} className={cn("relative", disabled && "opacity-50", className)}>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? "link-field-listbox" : undefined}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          style={style}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); search(e.target.value) }}
          onFocus={() => { if (!disabled) { setOpen(true); search(query) } }}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-9 w-full rounded-lg border border-border bg-background pl-3 pr-8",
            "text-sm text-foreground placeholder:text-muted-foreground/60",
            "transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
            "disabled:cursor-not-allowed",
          )}
        />
        {/* Link icon */}
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>

      {open && dropPos !== null && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          id="link-field-listbox"
          role="listbox"
          data-link-portal=""
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, pointerEvents: "auto" }}
          className="max-h-52 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Loading…</li>
          )}

          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
          )}

          {results.map((option, i) => (
            <li
              key={option.value}
              role="option"
              aria-selected={i === cursor}
              onMouseDown={(e) => { e.preventDefault(); pick(option) }}
              onMouseEnter={() => setCursor(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors",
                i === cursor ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
              )}
            >
              <span className="font-medium">{option.value}</span>
              {option.description && (
                <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </li>
          ))}

          {onCreateNew && (
            <li
              role="option"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); onCreateNew() }}
              className="mt-1 flex cursor-pointer items-center gap-2 border-t border-border/50 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create new {createLabel ?? "record"}
            </li>
          )}
        </ul>,
        document.body
      )}
    </div>
  )
}
