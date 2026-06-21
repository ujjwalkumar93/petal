"use client"

import { cn } from "../lib/utils"

export interface ColorFieldProps {
  /** Hex color string, e.g. "#ff0000" */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
}

/**
 * Color picker combining a native color swatch and a hex text input.
 *
 * @example
 * <ColorField value={doc.color} onChange={(v) => setField("color", v)} />
 */
export function ColorField({
  value,
  onChange,
  disabled,
  id,
  className,
}: ColorFieldProps) {
  return (
    <div className={cn("flex h-9 items-center gap-2", className)}>
      <input
        type="color"
        value={value || "#000000"}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Color picker"
        className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        aria-label="Hex color value"
        pattern="^#[0-9A-Fa-f]{6}$"
        className={cn(
          "h-9 flex-1 rounded-lg border border-border bg-background px-3",
          "font-mono text-sm text-foreground placeholder:text-muted-foreground/60",
          "transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
    </div>
  )
}
