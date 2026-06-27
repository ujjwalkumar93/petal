"use client"

import { useRef } from "react"
import { FrappeClient } from "@/lib/frappe/client"

let frappeClientInstance: FrappeClient | null = null

export function getFrappeClient(backend?: string): FrappeClient {
  if (!frappeClientInstance) {
    // browser → proxy (same-origin cookies); server → direct Frappe call
    const baseUrl = backend
      ?? (typeof window !== "undefined"
        ? "/api/v1"
        : (process.env.FRAPPE_BACKEND_URL ?? "http://localhost:8000"))
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
