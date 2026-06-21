"use client"
import { useState, useEffect, useRef } from "react"
import { cn } from "../lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "Alert"
  | "Warning"
  | "Error"
  | "Success"
  | "Mention"
  | "Energy Point"
  | "Assignment"
  | "Share"
  | "Login"

export interface PetalNotification {
  name: string
  subject: string
  message?: string
  type: NotificationType
  documentType?: string
  documentName?: string
  fromUser?: string
  fromUserFullName?: string
  creation: string
  read: boolean
}

export interface NotificationCenterProps {
  notifications: PetalNotification[]
  unreadCount: number
  loading?: boolean
  hasMore?: boolean
  onOpen?: () => void
  onMarkRead: (name: string) => Promise<void> | void
  onMarkAllRead: () => Promise<void> | void
  onLoadMore?: () => void
  onNavigate?: (href: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

const TYPE_DOT: Record<NotificationType, string> = {
  "Alert":        "bg-amber-500",
  "Warning":      "bg-orange-500",
  "Error":        "bg-red-500",
  "Success":      "bg-green-500",
  "Mention":      "bg-blue-500",
  "Energy Point": "bg-purple-500",
  "Assignment":   "bg-indigo-500",
  "Share":        "bg-teal-500",
  "Login":        "bg-slate-400",
}

const TYPE_AVATAR_BG: Record<NotificationType, string> = {
  "Alert":        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  "Warning":      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  "Error":        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  "Success":      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "Mention":      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "Energy Point": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  "Assignment":   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  "Share":        "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  "Login":        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

const TYPE_GLYPH: Record<NotificationType, string> = {
  "Alert":        "!",
  "Warning":      "⚠",
  "Error":        "✕",
  "Success":      "✓",
  "Mention":      "@",
  "Energy Point": "★",
  "Assignment":   "→",
  "Share":        "↗",
  "Login":        "⌄",
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

interface NotificationItemProps {
  notification: PetalNotification
  onMarkRead: (name: string) => void
  onNavigate?: (href: string) => void
}

function NotificationItem({ notification: n, onMarkRead, onNavigate }: NotificationItemProps) {
  const avatarCls = TYPE_AVATAR_BG[n.type] ?? TYPE_AVATAR_BG["Alert"]
  const dotCls = TYPE_DOT[n.type] ?? TYPE_DOT["Alert"]
  const hasDocLink = !!(n.documentType && n.documentName)

  function handleClick() {
    if (!n.read) onMarkRead(n.name)
    if (hasDocLink && onNavigate) {
      const slug = n.documentType!.toLowerCase().replace(/ /g, "-")
      onNavigate(`/${slug}/${n.documentName}`)
    }
  }

  const displayName = n.fromUserFullName ?? n.fromUser

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
        !n.read && "bg-primary/[0.04]",
      )}
    >
      {/* Unread indicator stripe */}
      {!n.read && (
        <span className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-full", dotCls)} />
      )}

      {/* Type avatar */}
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          avatarCls,
        )}
      >
        {TYPE_GLYPH[n.type]}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm leading-snug",
            n.read ? "font-medium text-foreground/80" : "font-semibold text-foreground",
          )}
        >
          {n.subject}
        </p>

        {n.message && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {stripHtml(n.message)}
          </p>
        )}

        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {displayName && (
            <>
              <span className="truncate max-w-[100px]">{displayName}</span>
              <span>·</span>
            </>
          )}
          <span>{timeAgo(n.creation)}</span>
          {hasDocLink && (
            <>
              <span>·</span>
              <span className="truncate max-w-[80px] text-primary/70">
                {n.documentType} #{n.documentName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", dotCls)} />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// NotificationCenter
// ---------------------------------------------------------------------------

export function NotificationCenter({
  notifications,
  unreadCount,
  loading = false,
  hasMore = false,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  onNavigate,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false)

  // Stable ref to avoid stale closure in the open effect
  const onOpenRef = useRef(onOpen)
  useEffect(() => { onOpenRef.current = onOpen }, [onOpen])

  useEffect(() => {
    if (open) onOpenRef.current?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const cappedCount = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-accent text-foreground transition-colors"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon />
        {cappedCount && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {cappedCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => void onMarkAllRead()}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  title="Mark all as read"
                >
                  {/* double-check icon */}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12.5l5 5L18 5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5l5 5 10.5-12" />
                  </svg>
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <>
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                </>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <BellIcon className="mb-3 h-9 w-9 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">You're all caught up!</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {notifications.map((n) => (
                    <li key={n.name}>
                      <NotificationItem
                        notification={n}
                        onMarkRead={(name) => void onMarkRead(name)}
                        {...(onNavigate !== undefined && { onNavigate })}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {/* Load more */}
              {hasMore && !loading && onLoadMore && (
                <button
                  onClick={onLoadMore}
                  className="w-full py-3 text-center text-xs text-primary transition-colors hover:text-primary/80"
                >
                  Load more
                </button>
              )}

              {loading && notifications.length > 0 && (
                <div className="py-3 text-center text-xs text-muted-foreground">Loading…</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
