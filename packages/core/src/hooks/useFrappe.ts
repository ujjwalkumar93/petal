"use client"

import { useRef } from "react"
import { FrappeClient } from "@/lib/frappe/client"

let frappeClientInstance: FrappeClient | null = null

export function getFrappeClient(backend?: string): FrappeClient {
  if (!frappeClientInstance) {
    // Client-side: route through the Next.js proxy so cookies are same-origin
    // and the CSRF token is readable by JavaScript.
    // Server-side: call Frappe directly.
    const baseUrl = backend
      ?? (typeof window !== "undefined"
        ? "/api/v1"
        : (process.env.NEXT_PUBLIC_FRAPPE_URL ?? "http://localhost:8000"))
    frappeClientInstance = new FrappeClient(baseUrl)
  }
  return frappeClientInstance
}

export function useFrappe() {
  const clientRef = useRef<FrappeClient | null>(null)

  if (!clientRef.current) {
    clientRef.current = getFrappeClient()
  }

  return clientRef.current
}
