"use client"

import { cn } from "../lib/utils"

export interface AttachFieldProps {
  /** File path or URL string */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  className?: string
}

/**
 * Text input for file paths / URLs with an "Open" link when a value is present.
 * Matches Frappe's Attach and Attach Image field behaviour.
 *
 * @example
 * <AttachField value={doc.attachment} onChange={(v) => setField("attachment", v)} />
 */
export function AttachField({
  value,
  onChange,
  disabled,
  placeholder = "File path or URL…",
  id,
  className,
}: AttachFieldProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 flex-1 rounded-lg border border-border bg-background px-3",
          "text-sm text-foreground placeholder:text-muted-foreground/60",
          "transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />

      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-9 shrink-0 items-center rounded-lg border border-border px-3",
            "text-xs font-medium text-primary transition-colors hover:bg-accent",
          )}
        >
          Open
        </a>
      )}
    </div>
  )
}
