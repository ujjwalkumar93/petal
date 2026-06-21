"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

// ---------------------------------------------------------------------------
// ActionButton — Button with built-in loading state
// ---------------------------------------------------------------------------

export interface ActionButtonProps extends ButtonProps {
  /** Shows a spinner and disables the button when true */
  loading?: boolean
  /** Text shown next to the spinner. Defaults to the normal children. */
  loadingText?: React.ReactNode
}

/**
 * A Button extended with a `loading` prop that shows a spinner and prevents
 * double-submission. Useful for form submit and async action triggers.
 *
 * @example
 * <ActionButton loading={isSaving} onClick={handleSave}>Save</ActionButton>
 */
const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ loading, loadingText, disabled, children, className, ...props }, ref) => (
    <Button
      ref={ref}
      disabled={loading || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  ),
)
ActionButton.displayName = "ActionButton"

export { Button, buttonVariants, ActionButton }
