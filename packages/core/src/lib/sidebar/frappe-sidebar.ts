import type { SidebarItem } from "@petal/sdk"
import { FRAPPE_API_ENDPOINTS, buildFrappeUrl } from "@/lib/frappe/api-config"

const CACHE_KEY = "petal:sidebar"
const CACHE_TTL_MS = 5 * 60 * 1000

// Shown when Frappe is completely unreachable
const FALLBACK_ITEMS: SidebarItem[] = [
  {
    label: "Setup",
    path: "/list/User",
    icon: "settings",
    children: [
      { label: "Users", path: "/list/User", icon: "users" },
      { label: "Roles", path: "/list/Role", icon: "settings" },
    ],
  },
]

const FRAPPE_REGISTRY_ICONS = new Set([
  "getting-started", "accounting", "buying", "sell", "selling", "stock", "assets",
  "organization", "quality", "project", "support", "users", "website", "crm",
  "tool", "setting", "settings", "integration", "file", "arrow-left", "arrow-right",
  "hr", "human-resource", "payroll", "dashboard", "reports", "analytics",
  "manufacturing", "logistics", "workflow", "invoice", "security",
])

function resolveIcon(icon: string | null | undefined, fallback = "grid"): string {
  if (!icon) return fallback
  if (FRAPPE_REGISTRY_ICONS.has(icon)) return icon
  if (icon.length <= 2 || /\p{Emoji}/u.test(icon)) return icon
  return fallback
}

function readCache(): SidebarItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { items, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return items as SidebarItem[]
  } catch {
    return null
  }
}

function writeCache(items: SidebarItem[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ items, expiresAt: Date.now() + CACHE_TTL_MS }))
  } catch {
    // sessionStorage unavailable (SSR, private mode, quota) — ignore
  }
}

/**
 * Fetch workspace sidebar items from Frappe.
 * Returns cached items if available, falls back to a minimal static list on error.
 */
export async function fetchFrappeSidebarItems(): Promise<SidebarItem[]> {
  const cached = readCache()
  if (cached) return cached

  try {
    const base = typeof window !== "undefined" ? "/api/v1" : (process.env.NEXT_PUBLIC_FRAPPE_URL ?? "http://localhost:8000")
    const url = buildFrappeUrl(base, FRAPPE_API_ENDPOINTS.WORKSPACE.GET_SIDEBAR_ITEMS)

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
    })

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

    const data = await response.json()
    const pages: any[] = data.message?.pages ?? []

    if (pages.length === 0) return FALLBACK_ITEMS

    const visible = pages.filter((p: any) => !p.is_hidden)

    const childrenMap = new Map<string, SidebarItem[]>()
    for (const page of visible) {
      if (!page.parent_page) continue
      const child: SidebarItem = {
        label: page.label || page.name,
        path: `/workspace/${encodeURIComponent(page.name)}`,
        icon: resolveIcon(page.icon, "📝"),
      }
      const bucket = childrenMap.get(page.parent_page)
      if (bucket) bucket.push(child)
      else childrenMap.set(page.parent_page, [child])
    }

    const items: SidebarItem[] = visible
      .filter((p: any) => !p.parent_page)
      .map((p: any) => {
        const children = childrenMap.get(p.name)
        const item: SidebarItem = {
          label: p.label || p.name,
          path: `/workspace/${encodeURIComponent(p.name)}`,
          icon: resolveIcon(p.icon),
        }
        if (children) item.children = children
        return item
      })

    writeCache(items)
    return items
  } catch (err) {
    console.warn("[Petal] Could not load Frappe workspace sidebar, using fallback.", err)
    return FALLBACK_ITEMS
  }
}
