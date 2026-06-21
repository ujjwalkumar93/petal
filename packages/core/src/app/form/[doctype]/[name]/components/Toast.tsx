"use client"
import { useState, useEffect } from "react"

export type Toast = { id: number; type: "success" | "error"; message: string }

export function playChime(type: "success" | "error") {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.connect(ctx.destination)
    master.gain.setValueAtTime(0.18, ctx.currentTime)

    if (type === "success") {
      ;[523.25, 659.25, 783.99].forEach((freq, i) => {
        const t0 = ctx.currentTime + i * 0.12
        const osc = ctx.createOscillator()
        osc.type = "sine"
        osc.frequency.value = freq
        osc.connect(master)
        osc.start(t0)
        osc.stop(t0 + 0.18)
      })
      master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3 * 0.12 + 0.35)
    } else {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(380, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.22)
      osc.connect(master)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.28)
      master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
    }
  } catch {}
}

const DISMISS_MS = 4500

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false)
  const isSuccess = toast.type === "success"

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 350)
    }, DISMISS_MS)
    return () => { clearTimeout(show); clearTimeout(hide) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 350)
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-[340px] rounded-xl border bg-background shadow-2xl p-4 transition-all duration-300 ease-out ${
        isSuccess
          ? "border-green-200 dark:border-green-800"
          : "border-red-200 dark:border-red-800"
      } ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isSuccess ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
      }`}>
        {isSuccess ? (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l6.354 12.748zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-foreground leading-snug">
          {isSuccess ? "Success" : "Error"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 mt-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

export function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-[900] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
