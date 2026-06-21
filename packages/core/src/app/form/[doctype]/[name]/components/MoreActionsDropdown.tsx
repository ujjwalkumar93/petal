"use client"
import { useState, useEffect, useRef } from "react"

export function MoreActionsDropdown({
  onDuplicate,
  onCopyJSON,
  onDelete,
  canDelete,
  disabled,
}: {
  onDuplicate: () => void
  onCopyJSON: () => void
  onDelete: () => void
  canDelete: boolean
  disabled?: boolean
}) {
  const [open, setOpen]       = useState(false)
  const [copied, setCopied]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function handleCopy() {
    setOpen(false)
    onCopyJSON()
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="More actions"
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-background shadow-xl py-1 z-50">
          <button
            type="button"
            onClick={() => { setOpen(false); onDuplicate() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>
            </svg>
            Duplicate
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
            </svg>
            Copy to Clipboard
          </button>

          {canDelete && (
            <>
              <div className="my-1 border-t border-border/50" />
              <button
                type="button"
                onClick={() => { setOpen(false); onDelete() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
