"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useFrappe } from "@/hooks/useFrappe"
import { appRegistry } from "@/lib/registry/app-registry"
import { InstalledApps, PageHeader } from "@petal/ui"
import type { BackendApp, FrontendApp } from "@petal/ui"
import packageJson from "../../../package.json"

interface FrappeModuleDef {
  name: string
  doctype: string
  owner: string
  creation: string
  modified: string
  docstatus: 0 | 1 | 2
  app_name: string
  [key: string]: unknown
}

// frappe.utils.change_log.get_installed_apps_info response shape
interface AppInfoDoc {
  app_name: string
  app_title?: string
  deployed_version?: string
  [key: string]: unknown
}

export default function AppsPage() {
  const frappe = useFrappe()
  const [backendApps, setBackendApps] = useState<BackendApp[]>([])
  const [frontendApps, setFrontendApps] = useState<FrontendApp[]>([])
  const [backendLoading, setBackendLoading] = useState(true)

  // Frontend apps: Petal itself is always shown first, followed by any apps
  // registered in petal.config.ts (populated by PetalProvider during boot).
  useEffect(() => {
    const registered = appRegistry.getAll()
    const failed = appRegistry.getFailedApps()

    const allNames = new Set([
      ...registered.map((a) => a.meta.name),
      ...Array.from(failed.keys()),
    ])

    const registeredApps: FrontendApp[] = Array.from(allNames).map((name) => {
      const reg = registered.find((a) => a.meta.name === name)
      const err = failed.get(name)

      return {
        name,
        url: reg?.meta.url ?? "",
        version: reg?.meta.version ?? "0.0.0",
        loaded: !!reg && !err,
        ...(reg?.meta.devUrl !== undefined ? { devUrl: reg.meta.devUrl } : {}),
        ...(err !== undefined           ? { error: err }                : {}),
      }
    })

    const petalEntry: FrontendApp = {
      name: "petal",
      url: window.location.origin,
      version: packageJson.version,
      loaded: true,
    }

    setFrontendApps([petalEntry, ...registeredApps])
  }, [])

  // Backend apps: Module Def is the site-specific source of truth — it lives in
  // the site's database and only contains modules from apps installed on THIS
  // site (not just available on the bench). We then cross-reference with
  // get_installed_apps_info for human-readable titles and version strings.
  useEffect(() => {
    async function fetchBackend() {
      setBackendLoading(true)
      try {
        const [modulesResult, appInfoResult] = await Promise.allSettled([
          frappe.getList<FrappeModuleDef>({
            doctype: "Module Def",
            fields: ["app_name"],
            filters: [],
            limit: 1000,
          }),
          frappe.callMethod<AppInfoDoc[]>("frappe.utils.change_log.get_installed_apps_info"),
        ])

        const moduleCounts: Record<string, number> = {}
        if (modulesResult.status === "fulfilled") {
          for (const mod of modulesResult.value) {
            const key = typeof mod.app_name === "string" ? mod.app_name : ""
            if (key) moduleCounts[key] = (moduleCounts[key] ?? 0) + 1
          }
        }

        // Build metadata map — only trust metadata for apps confirmed by Module Def
        const siteAppNames = new Set(Object.keys(moduleCounts))
        const metaMap = new Map<string, { title?: string; version?: string }>()

        if (appInfoResult.status === "fulfilled" && Array.isArray(appInfoResult.value)) {
          for (const info of appInfoResult.value) {
            if (!siteAppNames.has(info.app_name)) continue
            metaMap.set(info.app_name, {
              ...(typeof info.app_title === "string"       ? { title:   info.app_title }       : {}),
              ...(typeof info.deployed_version === "string" ? { version: info.deployed_version } : {}),
            })
          }
        }

        setBackendApps(
          Array.from(siteAppNames).map((name) => {
            const meta = metaMap.get(name)
            return {
              name,
              moduleCount: moduleCounts[name] ?? 0,
              ...(meta?.title   !== undefined ? { title:   meta.title   } : {}),
              ...(meta?.version !== undefined ? { version: meta.version } : {}),
            }
          })
        )
      } catch (err) {
        console.error("[Petal] Failed to fetch backend apps:", err)
        setBackendApps([])
      } finally {
        setBackendLoading(false)
      }
    }

    void fetchBackend()
  }, [frappe])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Installed Apps"
        description="Python apps running on the Frappe backend and React apps registered on the Petal frontend."
        breadcrumbs={[{ label: "Home", href: "/" }]}
        renderLink={(item, children) => (
          <Link href={item.href ?? "/"}>{children}</Link>
        )}
      />

      <InstalledApps
        backendApps={backendApps}
        frontendApps={frontendApps}
        backendLoading={backendLoading}
      />
    </div>
  )
}
