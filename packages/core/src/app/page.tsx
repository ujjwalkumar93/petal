"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import { fetchFrappeSidebarItems } from "@/lib/sidebar/frappe-sidebar"

export default function IndexPage() {
  const router = useRouter()
  const authStatus = usePetalStore((s) => s.authStatus)

  useEffect(() => {
    if (authStatus !== "authenticated") return
    fetchFrappeSidebarItems().then((items) => {
      const first = items.find((item) => item.path !== "/")
      router.replace(first?.path ?? "/petal-docs")
    })
  }, [authStatus, router])

  return null
}
