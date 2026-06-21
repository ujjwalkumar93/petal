"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useFrappe } from "@/hooks/useFrappe"
import { useRouter } from "next/navigation"

export function LinkInput({
  linkedDoctype, fieldname, value, onChange, placeholder, disabled, inputStyle,
}: {
  linkedDoctype: string
  fieldname: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  inputStyle?: Record<string, string>
}) {
  const frappe  = useFrappe()
  const router  = useRouter()
  const [query, setQuery]         = useState(value)
  const [open, setOpen]           = useState(false)
  const [cursor, setCursor]       = useState(0)
  const [results, setResults]     = useState<{ value: string; description?: string }[]>([])
  const [dropPos, setDropPos]     = useState<{ top: number; left: number; width: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const listRef  = useRef<HTMLUListElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function h(e: MouseEvent) {
      const target = e.target as Node
      const outsideWrap = wrapRef.current && !wrapRef.current.contains(target)
      const outsideList = listRef.current && !listRef.current.contains(target)
      if (outsideWrap && outsideList) { setOpen(false); setQuery(value) }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [value])

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [cursor])

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

  function search(txt: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        if (txt.trim()) {
          const r = await frappe.callMethod<unknown>(
            "frappe.desk.search.search_link",
            { txt, doctype: linkedDoctype, ignore_user_permissions: 0, reference_doctype: "" }
          )
          const list = Array.isArray(r) ? r : ((r as Record<string, unknown>)?.results ?? []) as { value: string; description?: string }[]
          setResults(list)
        } else {
          const docs = await frappe.getList({ doctype: linkedDoctype, fields: ["name"], limit: 10 })
          setResults(docs.map((d) => ({ value: String(d.name) })))
        }
        setCursor(0)
      } catch { setResults([]) }
    }, txt.trim() ? 250 : 0)
  }

  function pick(s: { value: string }) {
    onChange(s.value); setQuery(s.value); setOpen(false); setResults([])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) { setOpen(true); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === "Enter")     { e.preventDefault(); if (results[cursor]) pick(results[cursor]) }
    if (e.key === "Escape")    { setOpen(false); setQuery(value) }
  }

  return (
    <div ref={wrapRef} className={`relative ${disabled ? "opacity-50" : ""}`}>
      <div className="relative">
        <input
          id={`link-field-${fieldname}`}
          value={query}
          disabled={disabled}
          placeholder={placeholder ?? `Search ${linkedDoctype}…`}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); search(e.target.value) }}
          onFocus={() => { if (!disabled) { setOpen(true); search(query) } }}
          onKeyDown={onKeyDown}
          style={inputStyle as React.CSSProperties}
          className="w-full h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:cursor-not-allowed transition-colors"
        />
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
        </svg>
      </div>
      {open && dropPos !== null && typeof document !== "undefined" && createPortal(
        <ul ref={listRef} style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }} className="max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-xl py-1" onMouseDown={(e) => e.preventDefault()}>
          {results.map((s, i) => (
            <li
              key={s.value}
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              onMouseEnter={() => setCursor(i)}
              className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-sm transition-colors ${i === cursor ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"}`}
            >
              <span className="font-medium">{s.value}</span>
              {s.description && <span className="text-xs text-muted-foreground truncate max-w-[140px]">{s.description}</span>}
            </li>
          ))}
          <li
            onMouseDown={(e) => {
              e.preventDefault()
              setOpen(false)
              const returnTo = encodeURIComponent(window.location.pathname)
              router.push(`/form/${encodeURIComponent(linkedDoctype)}/new?returnTo=${returnTo}&returnField=${fieldname}`)
            }}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-primary hover:bg-primary/5 transition-colors border-t border-border/50 mt-1"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span className="font-medium">Create new {linkedDoctype}</span>
          </li>
        </ul>,
        document.body
      )}
    </div>
  )
}
