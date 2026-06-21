"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"
import { FieldInput } from "./field-input"
import { FieldWrapper } from "./field-wrapper"
import type { LinkFieldOption } from "./link-field"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuickEntryField {
  fieldname: string
  fieldtype: string
  label: string
  reqd?: 0 | 1
  in_quick_entry?: 0 | 1
  /** Frappe v14+ alias for in_quick_entry */
  allow_in_quick_entry?: 0 | 1
  hidden?: 0 | 1
  read_only?: 0 | 1
  options?: string
  default?: string | number | null
  description?: string
}

export interface QuickEntryMeta {
  fields: QuickEntryField[]
}

export interface QuickEntryDialogProps {
  /** Frappe doctype name */
  doctype: string
  /** Whether the dialog is open */
  open: boolean
  /** Called when the dialog should close (cancel / backdrop click) */
  onClose: () => void
  /** Called after a successful save — receives the new document's name */
  onSaved: (name: string) => void
  /**
   * Called when user clicks "Edit Full Form".
   * Receives current field values so the caller can pre-fill the full form.
   */
  onEditFull: (values: Record<string, unknown>) => void
  /** Async function that fetches doctype metadata (fields list) */
  onFetchMeta: () => Promise<QuickEntryMeta>
  /**
   * Async function to persist the document.
   * Should call frappe.saveDoc({ doctype, ...values }) and return the saved name.
   */
  onSave: (values: Record<string, unknown>) => Promise<string>
  /** Async function to resolve link-field suggestions */
  onFetchLinkOptions: (linkedDoctype: string, search: string) => Promise<LinkFieldOption[]>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SKIP_FIELDTYPES = new Set([
  "Section Break",
  "Column Break",
  "HTML",
  "Table",
  "Button",
  "Fold",
  "Heading",
  "Tab Break",
  "HTML Editor",
  "Markdown Editor",
  "Attach",
  "Attach Image",
])

function getQuickEntryFields(meta: QuickEntryMeta): QuickEntryField[] {
  return meta.fields.filter(
    (f) =>
      (f.reqd === 1 || f.in_quick_entry === 1 || f.allow_in_quick_entry === 1) &&
      f.hidden !== 1 &&
      f.read_only !== 1 &&
      !SKIP_FIELDTYPES.has(f.fieldtype),
  )
}

function buildDefaults(fields: QuickEntryField[]): Record<string, unknown> {
  const defs: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.default != null && f.default !== "") {
      defs[f.fieldname] = f.default
    }
  }
  return defs
}

const FULLWIDTH_TYPES = new Set(["Small Text", "Text", "Long Text", "Text Editor"])

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickEntryDialog({
  doctype,
  open,
  onClose,
  onSaved,
  onEditFull,
  onFetchMeta,
  onSave,
  onFetchLinkOptions,
}: QuickEntryDialogProps) {
  const [metaLoading, setMetaLoading] = useState(false)
  const [fields, setFields] = useState<QuickEntryField[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set())

  // Reset and fetch meta each time the dialog opens
  useEffect(() => {
    if (!open) return
    setFields([])
    setValues({})
    setError(null)
    setMissingFields(new Set())
    setSaving(false)
    setMetaLoading(true)

    onFetchMeta()
      .then((meta) => {
        const qFields = getQuickEntryFields(meta)
        setFields(qFields)
        setValues(buildDefaults(qFields))
      })
      .catch(() => setError("Could not load form fields."))
      .finally(() => setMetaLoading(false))
  }, [open, doctype]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(fieldname: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldname]: value }))
    if (missingFields.has(fieldname) && value !== "" && value != null) {
      setMissingFields((prev) => {
        const next = new Set(prev)
        next.delete(fieldname)
        return next
      })
    }
  }

  async function handleSave() {
    const missing = fields
      .filter(
        (f) => f.reqd === 1 && (values[f.fieldname] === "" || values[f.fieldname] == null),
      )
      .map((f) => f.fieldname)

    if (missing.length > 0) {
      setMissingFields(new Set(missing))
      setError(
        `${missing.length} required field${missing.length > 1 ? "s are" : " is"} missing`,
      )
      return
    }

    setMissingFields(new Set())
    setSaving(true)
    setError(null)

    try {
      const name = await onSave(values)
      onSaved(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Please try again.")
      setSaving(false)
    }
  }

  function handleEditFull() {
    onEditFull(values)
    onClose()
  }

  // Keyboard shortcuts: Escape → close, Cmd/Ctrl+Enter → save
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        e.preventDefault()
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !saving) {
        e.preventDefault()
        void handleSave()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, saving, values, fields]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`New ${doctype}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">New {doctype}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the required details to create this record
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {metaLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-2.5 w-20 bg-muted rounded" />
                  <div className="h-9 w-full bg-muted/60 rounded-lg" />
                </div>
              ))}
            </div>
          ) : fields.length === 0 && !error ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No quick entry fields configured for <span className="font-medium text-foreground">{doctype}</span>.
              </p>
              <button
                onClick={handleEditFull}
                className="text-sm text-primary hover:underline"
              >
                Open full form instead →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              {fields.map((f) => (
                <FieldWrapper
                  key={f.fieldname}
                  label={f.label}
                  required={f.reqd === 1}
                  {...(f.description ? { description: f.description } : {})}
                  {...(missingFields.has(f.fieldname) ? { error: "This field is required" } : {})}
                  fullWidth={FULLWIDTH_TYPES.has(f.fieldtype)}
                  htmlFor={`qe-${f.fieldname}`}
                >
                  <FieldInput
                    id={`qe-${f.fieldname}`}
                    fieldtype={f.fieldtype}
                    value={values[f.fieldname] ?? ""}
                    onChange={(v) => handleChange(f.fieldname, v)}
                    {...(f.fieldtype === "Link" && f.options ? { linkedDoctype: f.options } : {})}
                    {...(f.options ? { options: f.options } : {})}
                    onLinkSearch={(q) =>
                      f.options
                        ? onFetchLinkOptions(f.options, q)
                        : Promise.resolve([])
                    }
                    disabled={saving}
                    className={cn(
                      missingFields.has(f.fieldname) &&
                        "border-red-400 focus:ring-red-400/30",
                    )}
                  />
                </FieldWrapper>
              ))}
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-5 pb-3 shrink-0">
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-lg px-3 py-2">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-muted/20 shrink-0">
          <button
            onClick={handleEditFull}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Edit Full Form →
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || metaLoading || (fields.length === 0 && !metaLoading)}
              className="h-9 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Save
              {!saving && (
                <kbd className="text-[10px] font-mono bg-white/20 px-1 py-0.5 rounded leading-none">
                  ⌘↵
                </kbd>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
