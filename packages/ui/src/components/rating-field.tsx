"use client"

import { cn } from "../lib/utils"

const STAR_PATH =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"

export interface RatingFieldProps {
  value: number
  onChange: (value: number) => void
  /** Maximum number of stars (default: 5) */
  max?: number
  disabled?: boolean
  className?: string
}

/**
 * Star rating field. Stores a numeric value from 0 to `max`.
 *
 * @example
 * <RatingField value={doc.rating} onChange={(v) => setField("rating", v)} />
 */
export function RatingField({
  value,
  onChange,
  max = 5,
  disabled,
  className,
}: RatingFieldProps) {
  const filled = Math.round(value) || 0

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn("flex h-9 items-center gap-1", disabled && "opacity-60", className)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === filled}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          className={cn(
            "h-7 w-7 rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-110",
            star <= filled
              ? "text-yellow-400"
              : "text-muted-foreground/25 hover:text-yellow-300",
          )}
        >
          <svg
            fill={star <= filled ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
          </svg>
        </button>
      ))}

      {filled > 0 && !disabled && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
