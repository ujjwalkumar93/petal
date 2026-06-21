import { cn } from "../lib/utils"
import type { HTMLAttributes } from "react"

export interface KbdProps extends HTMLAttributes<HTMLElement> {}

/**
 * Renders a single keyboard key styled as a <kbd> element.
 *
 * @example <Kbd>Ctrl</Kbd>
 */
export const Kbd = ({ className, children, ...props }: KbdProps) => (
  <kbd
    className={cn(
      "inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5",
      "font-mono text-[11px] font-medium leading-none text-muted-foreground",
      "shadow-[inset_0_-1px_0_0_rgba(0,0,0,.15)]",
      className,
    )}
    {...props}
  >
    {children}
  </kbd>
)
Kbd.displayName = "Kbd"

export interface KeyComboProps extends HTMLAttributes<HTMLSpanElement> {
  /** Keys to render, e.g. ["Ctrl", "S"] */
  keys: string[]
}

/**
 * Renders a sequence of keyboard keys separated by +.
 *
 * @example <KeyCombo keys={["Ctrl", "S"]} />
 */
export const KeyCombo = ({ keys, className, ...props }: KeyComboProps) => (
  <span className={cn("inline-flex items-center gap-0.5", className)} {...props}>
    {keys.map((key, i) => (
      <span key={i} className="inline-flex items-center gap-0.5">
        {i > 0 && (
          <span className="mx-0.5 select-none text-[10px] text-muted-foreground/40" aria-hidden="true">
            +
          </span>
        )}
        <Kbd>{key}</Kbd>
      </span>
    ))}
  </span>
)
KeyCombo.displayName = "KeyCombo"
