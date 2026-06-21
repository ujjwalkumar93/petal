"use client"
import { useEffect, useRef, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { appRegistry } from "@/lib/registry/app-registry"
import { registerBuiltinIcons } from "@/lib/icons/builtin-icons"
import { getFrappeClient } from "@/hooks/useFrappe"
import { usePetalStore } from "@/store/petal-store"
import { toast, humanizeError } from "@/store/toast-store"
import type { FrappeDocument } from "@petal/sdk"
import { fetchFrappeSidebarItems } from "@/lib/sidebar/frappe-sidebar"
import { Sidebar } from "@/components/shell/Sidebar"
import { Navbar } from "@/components/shell/Navbar"
import { Toaster } from "@/components/shell/Toaster"
import { ErrorBoundary } from "@/components/shell/ErrorBoundary"

export function PetalProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }))
  const { setUser, setAuthStatus, setHooks, setSidebarItems, setAppTheme, setSettings } = usePetalStore()
  const { authStatus, user } = usePetalStore()
  const pathname = usePathname()
  const router = useRouter()
  const bootDoneRef = useRef(false)


  useEffect(() => {
    async function init() {
      registerBuiltinIcons()

      const config = await fetch("/api/config").then((r) => r.json())

      await appRegistry.loadFromConfig(config)


      const mergedTheme = appRegistry.getMergedTheme()
      const mergedFrappeConfig = appRegistry.getMergedFrappeClientConfig()
      const mergedSettings = appRegistry.getMergedSettings()

      const client = getFrappeClient()
      client.applyConfig(mergedFrappeConfig)

      setAppTheme(mergedTheme)
      setSettings(mergedSettings)

      try {
        if (user) {
          setAuthStatus("authenticated")
          void client.initCSRF()
        } else {
          const freshUser = await client.getLoggedInUser()
          setUser(freshUser)
          void client.initCSRF()
          setAuthStatus("authenticated")
        }
      } catch {
        setAuthStatus("unauthenticated")
      }
    }
    init().catch(console.error)
  }, [setUser, setAuthStatus, setHooks, setAppTheme, setSettings])

  useEffect(() => {
    if (authStatus !== "authenticated") return
    if (bootDoneRef.current) return
    bootDoneRef.current = true

    async function boot() {
      try {
        await appRegistry.runBootHooks()
      } catch (e) {
        console.error("[Petal] Boot hook failed:", e)
      }
      const mergedHooks = appRegistry.getMergedHooks()
      setHooks(mergedHooks)
      const frappeItems = await fetchFrappeSidebarItems()

      const overrides = mergedHooks.sidebar_item_overrides ?? {}
      type SI = import("@petal/sdk").SidebarItem
      function applyOverrides(items: SI[]): SI[] {
        return items.map((item) => {
          const ov = overrides[item.label] ?? overrides[item.path]
          const patched: SI = ov ? { ...item, ...ov } : item
          if (patched.children?.length) return { ...patched, children: applyOverrides(patched.children) }
          return patched
        })
      }

      const combined = applyOverrides([
        ...frappeItems,
        ...(mergedHooks.sidebar_items ?? []),
      ]).filter((item) => !item.hidden)

      setSidebarItems(combined)

      try {
        const client = getFrappeClient()
        const [sysSettings, globalDefaults, fiscalYears] = await Promise.all([
          client.getDoc<FrappeDocument & { currency?: string }>("System Settings", "System Settings"),
          client.getDoc<FrappeDocument & { default_company?: string }>("Global Defaults", "Global Defaults").catch(() => null),
          client.getList<FrappeDocument & { name: string }>({
            doctype: "Fiscal Year",
            fields: ["name"],
            order_by: "year_start_date desc",
            limit: 1,
          }).catch(() => [] as (FrappeDocument & { name: string })[]),
        ])
        const current = usePetalStore.getState().settings
        const merged: Record<string, unknown> = { ...current }
        if (sysSettings.currency) merged.currency = sysSettings.currency
        if (globalDefaults?.default_company) merged.defaultCompany = globalDefaults.default_company
        // if ((fiscalYears as (FrappeDocument & { name: string })[]).length > 0) {
        //   merged.defaultFiscalYear = (fiscalYears as (FrappeDocument & { name: string })[])[0].name
        // }
        const years = fiscalYears as (FrappeDocument & { name: string })[]

        if (years.length > 0 && years[0]) {
          merged.defaultFiscalYear = years[0].name
        }
        setSettings(merged)
      } catch {
        // Leave whatever defaults were set from app config
      }
    }
    boot().catch(console.error)
  }, [authStatus, setHooks, setSidebarItems])

  useEffect(() => {
    if (authStatus === "unauthenticated" && pathname !== "/login" && pathname !== "/petal-docs") {
      router.replace("/login")
    }
  }, [authStatus, pathname, router])

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    const es = new EventSource("/api/__petal_hmr")
    es.addEventListener("reload", () => {
      console.info("[Petal] App bundle changed — reloading modules…")
      window.location.reload()
    })
    return () => es.close()
  }, [])

  useEffect(() => {
    function onUnhandledRejection(e: PromiseRejectionEvent) {
      // Prevent Next.js / React dev overlay from also showing this error
      e.preventDefault()
      const { title, detail } = humanizeError(e.reason)
      toast.error(title, detail)
    }

    function onError(e: ErrorEvent) {
      // Skip opaque cross-origin script errors (no useful info available)
      if (!e.message || e.message === "Script error.") return
      e.preventDefault()
      const { title, detail } = humanizeError(e.error ?? e.message)
      toast.error(title, detail)
    }

    // Use capture phase so our handler runs before React/Next.js dev overlay handlers
    window.addEventListener("unhandledrejection", onUnhandledRejection, true)
    window.addEventListener("error", onError, true)
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true)
      window.removeEventListener("error", onError, true)
    }
  }, [])

  if (pathname === "/login" || pathname === "/docs/print" || pathname === "/petal-docs") {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    )
  }

  if (authStatus === "loading") {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              P
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Starting Petal...
            </div>
          </div>
        </div>
      </QueryClientProvider>
    )
  }

  const failedApps = appRegistry.getFailedApps()

  return (
    <QueryClientProvider client={queryClient}>
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {failedApps.size > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-800/50 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    Failed to load {failedApps.size} app{failedApps.size > 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-0.5 text-red-700 dark:text-red-400">
                    {Array.from(failedApps.entries()).map(([name, err]) => (
                      <li key={name}>
                        <span className="font-mono font-medium">{name}</span>
                        <span className="text-red-500 dark:text-red-500 mx-1">—</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          <ErrorBoundary resetKey={pathname}>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      {/* Toaster sits outside ErrorBoundary so it always renders even when a page crashes */}
      <Toaster />
    </div>
    </QueryClientProvider>
  )
}
