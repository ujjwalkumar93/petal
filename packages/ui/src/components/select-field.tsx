"use client"

import { cn } from "../lib/utils"

export interface SelectFieldProps {
  value: string
  onChange: (value: string) => void
  /**
   * Accepts either:
   * - a Frappe-style newline-separated string: `"Draft\nSubmitted\nCancelled"`
   * - or a plain string array: `["Draft", "Submitted", "Cancelled"]`
   */
  options: string | string[]
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Styled native <select> for Frappe Select fields.
 * Accepts the raw Frappe `options` string (newline-separated) or an array.
 *
 * @example
 * <SelectField value={doc.status} onChange={(v) => setField("status", v)} options={field.options} />
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  id,
  className,
  style,
}: SelectFieldProps) {
  const opts =
    typeof options === "string"
      ? options.split("\n").filter(Boolean)
      : options

  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-8",
          "text-sm text-foreground",
          "transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <option value="">{placeholder}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* Chevron icon */}
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
