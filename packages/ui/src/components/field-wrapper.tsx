import { cn } from "../lib/utils"
import type { ReactNode } from "react"

export interface FieldWrapperProps {
  label: string
  /** Shows a red required dot before the label */
  required?: boolean
  /** Helper text shown below the input */
  description?: string
  /** Validation error message — shown in red below description */
  error?: string
  /** Expands to full grid width; auto-set for textarea/code field types */
  fullWidth?: boolean
  /** Inline style applied to the <label> element */
  labelStyle?: React.CSSProperties
  className?: string
  /** The field input or read-only display */
  children: ReactNode
  /** Associates the label with an input via htmlFor */
  htmlFor?: string
}

/**
 * Standard label + input layout wrapper used in Frappe form views.
 * Renders a small-caps label, the field content, and optional description/error text.
 *
 * @example
 * <FieldWrapper label="Customer" required htmlFor="customer-input">
 *   <LinkField id="customer-input" ... />
 * </FieldWrapper>
 */
export function FieldWrapper({
  label,
  required,
  description,
  error,
  fullWidth,
  labelStyle,
  className,
  children,
  htmlFor,
}: FieldWrapperProps) {
  return (
    <div className={cn("group min-w-0", fullWidth && "col-span-full", className)}>
      {/* Label row */}
      <div className="mb-1.5 flex items-center gap-1">
        {required && (
          <span
            className="mt-px h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"
            aria-hidden="true"
          />
        )}
        <label
          htmlFor={htmlFor}
          style={labelStyle}
          className="text-[11px] font-semibold uppercase leading-none tracking-wide text-muted-foreground"
        >
          {label}
        </label>
      </div>

      {/* Field content */}
      <div className="space-y-1">
        {children}

        {description && !error && (
          <p className="text-[11px] leading-snug text-muted-foreground/60">{description}</p>
        )}

        {error && (
          <p role="alert" className="text-[11px] leading-snug text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
