"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@petal/ui"
import { useToastStore, type ToastItem, type ToastVariant } from "@/store/toast-store"

const AUTO_DISMISS_MS = 6000

// ---------------------------------------------------------------------------
// Per-variant styles
// ---------------------------------------------------------------------------

const VARIANT: Record<ToastVariant, { wrap: string; icon: string; Icon: React.ElementType }> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/80 dark:text-red-100",
    icon: "text-red-500 dark:text-red-400",
    Icon: AlertCircle,
  },
  warning: {
    wrap: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-700/60 dark:bg-yellow-950/80 dark:text-yellow-100",
    icon: "text-yellow-500 dark:text-yellow-400",
    Icon: AlertTriangle,
  },
  success: {
    wrap: "border-green-200 bg-green-50 text-green-900 dark:border-green-800/60 dark:bg-green-950/80 dark:text-green-100",
    icon: "text-green-500 dark:text-green-400",
    Icon: CheckCircle2,
  },
  info: {
    wrap: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700/60 dark:bg-blue-950/80 dark:text-blue-100",
    icon: "text-blue-500 dark:text-blue-400",
    Icon: Info,
  },
}

// ---------------------------------------------------------------------------
// Single toast card
// ---------------------------------------------------------------------------

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const [showDetail, setShowDetail] = useState(false)
  const v = VARIANT[item.variant]

  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [item.id, dismiss])

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-80 rounded-lg border shadow-lg p-3.5 flex gap-3 items-start text-sm",
        "animate-in slide-in-from-bottom-2 fade-in duration-200",
        v.wrap,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", v.icon)}>
        <v.Icon className="w-4 h-4" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-medium leading-snug">{item.title}</p>

        {item.detail && (
          <button
            onClick={() => setShowDetail((o) => !o)}
            className="mt-1 text-[11px] opacity-60 hover:opacity-100 underline underline-offset-2 transition-opacity"
          >
            {showDetail ? "Hide details" : "Show details"}
          </button>
        )}

        {showDetail && item.detail && (
          <pre className="mt-1.5 text-[10px] font-mono whitespace-pre-wrap break-all opacity-75 max-h-28 overflow-y-auto leading-relaxed">
            {item.detail}
          </pre>
        )}
      </div>

      <button
        onClick={() => dismiss(item.id)}
        title="Dismiss"
        className="shrink-0 mt-0.5 opacity-40 hover:opacity-80 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toaster — mount once at root, renders all active toasts
// ---------------------------------------------------------------------------

export function Toaster() {
  const items = useToastStore((s) => s.items)
  if (items.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
