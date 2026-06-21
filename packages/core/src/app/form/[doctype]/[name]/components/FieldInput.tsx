"use client"
import { DatePicker, DateTimePicker } from "@petal/ui"
import { LinkInput } from "./LinkInput"
import { ImageField } from "./ImageField"
import type { MetaField } from "./types"

export const BASE_INPUT = "w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"
export const BASE_TEXTAREA = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-y transition-colors disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"

export function FieldInput({ field, value, onChange, disabled = false, inputStyle }: {
  field: MetaField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
  inputStyle?: Record<string, string>
}) {
  const str = value == null ? "" : String(value)

  switch (field.fieldtype) {
    case "Link":
      return (
        <LinkInput
          linkedDoctype={field.options ?? ""}
          fieldname={field.fieldname}
          value={str}
          onChange={(v) => onChange(v)}
          placeholder={`Search ${field.options ?? field.label}…`}
          disabled={disabled}
          {...(inputStyle && { inputStyle })}
        />
      )

    case "Select": {
      const opts = (field.options ?? "").split("\n").filter(Boolean)
      return (
        <div className="relative">
          <select
            value={str}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={inputStyle as React.CSSProperties}
            className={`${BASE_INPUT} appearance-none pr-8 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <option value="">Select…</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      )
    }

    case "Check": {
      const on = Number(value) === 1
      return (
        <div className="flex items-center h-9">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => !disabled && onChange(on ? 0 : 1)}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${on ? "bg-primary" : "bg-muted-foreground/15 ring-1 ring-inset ring-border"}`}
          >
            <span className={`h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
      )
    }

    case "Date":
      return <DatePicker value={str} onChange={(v) => onChange(v)} disabled={disabled} />

    case "Datetime":
      return (
        <DateTimePicker
          value={str}
          onChange={(v) => onChange(v)}
          disabled={disabled}
          {...(inputStyle && { style: inputStyle as React.CSSProperties })}
        />
      )

    case "Time":
      return <input type="time" value={str} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_INPUT} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />

    case "Int":
      return (
        <input type="number" step="1" value={str}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
          disabled={disabled}
          style={inputStyle as React.CSSProperties}
          className={`${BASE_INPUT} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />
      )

    case "Float":
    case "Currency":
    case "Percent":
      return (
        <input type="number" step="any" value={str}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          disabled={disabled}
          style={inputStyle as React.CSSProperties}
          className={`${BASE_INPUT} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />
      )

    case "Password":
      return <input type="password" value={str} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_INPUT} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} placeholder="••••••••" />

    case "Color":
      return (
        <div className="flex items-center gap-2 h-9">
          <input type="color" value={str || "#000000"} onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 rounded-lg border border-border cursor-pointer p-1 bg-background" />
          <input type="text" value={str} onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            placeholder="#000000" />
        </div>
      )

    case "Rating": {
      const n = Number(value) || 0
      return (
        <div className={`flex items-center gap-1 h-9 ${disabled ? "opacity-60" : ""}`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => !disabled && onChange(s)} disabled={disabled}
              className={`w-7 h-7 transition-all ${disabled ? "cursor-not-allowed" : "hover:scale-110"} ${s <= n ? "text-yellow-400" : "text-muted-foreground/25 hover:text-yellow-300"}`}>
              <svg fill={s <= n ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
              </svg>
            </button>
          ))}
          {n > 0 && (
            <button onClick={() => onChange(0)} className="ml-1 text-xs text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </div>
      )
    }

    case "Image":
      return (
        <ImageField
          value={str}
          onChange={(url) => onChange(url)}
          disabled={disabled}
        />
      )

    case "Attach":
    case "Attach Image":
      return (
        <div className="flex items-center gap-2">
          <input type="text" value={str} onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={inputStyle as React.CSSProperties}
            className={`${BASE_INPUT} flex-1 disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} placeholder="File path or URL…" />
          {str && (
            <a href={str} target="_blank" rel="noopener noreferrer"
              className="h-9 px-3 flex items-center shrink-0 rounded-lg border border-border text-xs text-primary hover:bg-accent transition-colors">
              Open
            </a>
          )}
        </div>
      )

    case "Small Text":
      return <textarea value={str} rows={2} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_TEXTAREA} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />

    case "Text":
    case "Long Text":
    case "Text Editor":
      return <textarea value={str} rows={4} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_TEXTAREA} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />

    case "Code":
      return <textarea value={str} rows={8} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_TEXTAREA} font-mono text-xs disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />

    default:
      return <input type="text" value={str} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle as React.CSSProperties} className={`${BASE_INPUT} disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed`} />
  }
}
