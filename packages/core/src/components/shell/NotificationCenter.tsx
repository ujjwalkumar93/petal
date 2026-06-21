"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useFrappe } from "@/hooks/useFrappe"
import { NotificationCenter as NotificationCenterUI } from "@petal/ui"
import type { PetalNotification, NotificationType } from "@petal/ui"

// ---------------------------------------------------------------------------
// Frappe Notification Log shape (extends FrappeDocument required fields)
// ---------------------------------------------------------------------------

interface FrappeNotifDoc {
  // FrappeDocument required fields
  name: string
  doctype: string
  owner: string
  creation: string
  modified: string
  docstatus: 0 | 1 | 2
  // Notification Log fields
  subject: string
  type: string
  read: number | boolean
  [key: string]: unknown
}

const NOTIF_FIELDS = [
  "name",
  "subject",
  "type",
  "document_type",
  "document_name",
  "from_user",
  "from_user.full_name as from_user_full_name",
  "creation",
  "read",
] as const

const PAGE_SIZE = 20
const POLL_MS = 60_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KNOWN_TYPES = new Set<string>([
  "Alert", "Warning", "Error", "Success", "Mention",
  "Energy Point", "Assignment", "Share", "Login",
])

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined
}

function toNotification(raw: FrappeNotifDoc): PetalNotification {
  const type: NotificationType = KNOWN_TYPES.has(raw.type)
    ? (raw.type as NotificationType)
    : "Alert"

  const message          = str(raw.message)
  const documentType     = str(raw.document_type)
  const documentName     = str(raw.document_name)
  const fromUser         = str(raw.from_user)
  const fromUserFullName = str(raw.from_user_full_name)

  return {
    name: raw.name,
    subject: raw.subject,
    type,
    creation: raw.creation,
    read: raw.read === 1 || raw.read === true,
    ...(message          ? { message }          : {}),
    ...(documentType     ? { documentType }     : {}),
    ...(documentName     ? { documentName }     : {}),
    ...(fromUser         ? { fromUser }         : {}),
    ...(fromUserFullName ? { fromUserFullName } : {}),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationCenter() {
  const frappe = useFrappe()
  const [notifications, setNotifications] = useState<PetalNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const pageRef = useRef(0)

  // Fetch a page of notifications and optionally refresh the unread count
  const fetchPage = useCallback(
    async (reset: boolean) => {
      setLoading(true)
      try {
        const start = reset ? 0 : pageRef.current * PAGE_SIZE

        const [raw, countResult] = await Promise.all([
          frappe.getList<FrappeNotifDoc>({
            doctype: "Notification Log",
            fields: [...NOTIF_FIELDS],
            filters: [],
            order_by: "creation desc",
            limit: PAGE_SIZE + 1,
            limit_start: start,
          }),
          reset
            ? frappe.callMethod<number>("frappe.client.get_count", {
                doctype: "Notification Log",
                filters: JSON.stringify([["Notification Log", "read", "=", 0]]),
              })
            : Promise.resolve(null),
        ])

        const items = raw.slice(0, PAGE_SIZE).map(toNotification)
        setHasMore(raw.length > PAGE_SIZE)

        if (reset) {
          setNotifications(items)
          pageRef.current = 1
        } else {
          setNotifications((prev) => [...prev, ...items])
          pageRef.current++
        }

        if (countResult !== null) {
          setUnreadCount(countResult)
        }
      } catch (err) {
        console.error("[Petal] Failed to fetch notifications:", err)
      } finally {
        setLoading(false)
      }
    },
    [frappe],
  )

  // Initial fetch + background polling
  useEffect(() => {
    void fetchPage(true)
    const id = setInterval(() => void fetchPage(true), POLL_MS)
    return () => clearInterval(id)
  }, [fetchPage])

  async function handleMarkRead(name: string) {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.name === name ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))

    try {
      await frappe.callMethod("frappe.client.set_value", {
        doctype: "Notification Log",
        name,
        fieldname: "read",
        value: 1,
      })
    } catch (err) {
      console.error("[Petal] Failed to mark notification read:", err)
      // Revert on failure
      setNotifications((prev) => prev.map((n) => (n.name === name ? { ...n, read: false } : n)))
      setUnreadCount((c) => c + 1)
    }
  }

  async function handleMarkAllRead() {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      await frappe.callMethod(
        "frappe.desk.doctype.notification_log.notification_log.mark_all_as_read",
      )
    } catch (err) {
      console.error("[Petal] Failed to mark all notifications read:", err)
      void fetchPage(true)
    }
  }

  return (
    <NotificationCenterUI
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      hasMore={hasMore}
      onOpen={() => void fetchPage(true)}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onLoadMore={() => void fetchPage(false)}
    />
  )
}
