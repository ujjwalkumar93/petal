"use client"
import { useState, useEffect, useRef } from "react"
import { useFrappe } from "@/hooks/useFrappe"

export function PrintModal({ doctype, name, onClose }: {
  doctype: string
  name: string
  onClose: () => void
}) {
  const frappe = useFrappe()
  const [formats, setFormats]         = useState<string[]>(["Standard"])
  const [selected, setSelected]       = useState("Standard")
  const [loadingFmts, setLoadingFmts] = useState(true)
  const [loadingPage, setLoadingPage] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    frappe.getList({
      doctype: "Print Format",
      fields: ["name"],
      filters: [["Print Format", "doc_type", "=", doctype], ["Print Format", "disabled", "=", 0]],
      limit: 50,
    })
      .then((docs) => {
        const custom = docs.map((d) => String(d.name))
        setFormats(["Standard", ...custom])
      })
      .catch(() => {})
      .finally(() => setLoadingFmts(false))
  }, [doctype, frappe])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onClose])

  function handlePrint() {
    const win = iframeRef.current?.contentWindow
    if (win) { win.focus(); win.print() }
  }

  const iframeSrc = `/api/v1/printview?doctype=${encodeURIComponent(doctype)}&name=${encodeURIComponent(name)}&format=${encodeURIComponent(selected)}&no_letterhead=0`

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-background">
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-background shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659"/>
          </svg>
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          <span className="text-muted-foreground/30">·</span>
          {loadingFmts ? (
            <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => { setSelected(e.target.value); setLoadingPage(true) }}
                className="h-8 pl-3 pr-7 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            disabled={loadingPage}
            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659"/>
            </svg>
            Print
          </button>
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-muted/40 p-6 flex items-start justify-center relative">
        {loadingPage && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Loading preview…</span>
            </div>
          </div>
        )}
        <div className="w-full max-w-4xl h-full">
          <iframe
            ref={iframeRef}
            key={iframeSrc}
            src={iframeSrc}
            onLoad={() => setLoadingPage(false)}
            className={`w-full h-full bg-white shadow-2xl rounded-lg border border-border/60 transition-opacity duration-300 ${loadingPage ? "opacity-0" : "opacity-100"}`}
            title="Print Preview"
          />
        </div>
      </div>
    </div>
  )
}
