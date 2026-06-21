"use client"

import { cn } from "../lib/utils"

export interface CheckFieldProps {
  /** Frappe stores 0/1; also accepts boolean for convenience */
  value: number | boolean
  onChange: (value: 0 | 1) => void
  disabled?: boolean
  /** Optional visible label rendered alongside the toggle */
  label?: string
  id?: string
  className?: string
}

/**
 * Toggle switch for Frappe Check fields (0 / 1).
 *
 * @example
 * <CheckField value={doc.is_active} onChange={(v) => setField("is_active", v)} />
 */
export function CheckField({
  value,
  onChange,
  disabled,
  label,
  id,
  className,
}: CheckFieldProps) {
  const checked = Boolean(value)

  return (
    <div className={cn("flex h-9 items-center gap-2", className)}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(checked ? 0 : 1)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
          checked
            ? "bg-primary"
            : "bg-muted-foreground/15 ring-1 ring-inset ring-border",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer select-none text-sm text-foreground",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {label}
        </label>
      )}
    </div>
  )
}
