"use client"

import { Component, type ReactNode } from "react"
import { toast, humanizeError } from "@/store/toast-store"

// ---------------------------------------------------------------------------
// Error boundary — catches render-phase errors in any child component.
// Shows a friendly toast; renders a minimal inline fallback so the rest of
// the shell (sidebar, navbar, toaster) remains usable.
// ---------------------------------------------------------------------------

interface Props {
  children: ReactNode
  /** Changing this key resets the boundary (pass current pathname). */
  resetKey?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    const { title, detail } = humanizeError(error)
    toast.error(title, detail)
  }

  componentDidUpdate(prev: Props) {
    // Reset when the route changes so the new page gets a fresh attempt
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            This page encountered an error.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-primary hover:underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
