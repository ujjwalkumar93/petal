import type { PetalAppMeta, PetalConfig, PetalHooks } from "@petal/sdk"
import { mergeFormSlots } from "./compose-slots"
import { USE_DEV_URLS as isDev } from "./dev-urls"

/** Longest an app's on_init / on_boot may take before it's treated as failed. */
const HOOK_TIMEOUT_MS = 10_000

/** Rejects if `work` hasn't settled in HOOK_TIMEOUT_MS, so one app can't hold up the shell. */
function withTimeout<T>(work: Promise<T> | T, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    Promise.resolve(work),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} did not finish within ${HOOK_TIMEOUT_MS / 1000}s`)), HOOK_TIMEOUT_MS)
    }),
  ]).finally(() => clearTimeout(timer))
}

interface RegisteredApp {
  meta: PetalAppMeta
  hooks: PetalHooks
}

export class AppRegistry {
  private apps: Map<string, RegisteredApp> = new Map()
  private failedApps: Map<string, string> = new Map() // name → error message

  async loadFromConfig(config: PetalConfig): Promise<void> {
    const apps = config.apps ?? []
    const results = await Promise.allSettled(
      apps.map((app) => this.loadApp(app))
    )
    // Loaded in parallel, registered in config order: later apps override
    // earlier ones (settings, theme, routes), whichever finished loading first.
    results.forEach((result, i) => {
      const app = apps[i]
      if (result.status === "fulfilled") {
        this.apps.set(result.value.meta.name, result.value)
        console.info(`[Petal] Loaded app: ${result.value.meta.name}`)
      } else {
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason)
        this.failedApps.set(app!.name, msg)
        console.error(`[Petal] Failed to load app "${app?.name}": ${msg}`)
      }
    })
  }

  private async loadApp(meta: PetalAppMeta): Promise<RegisteredApp> {
    // Rejected by the server (incompatible petalVersion, malformed integrity): never import it.
    if (meta._configError) throw new Error(meta._configError)
    let hooks: PetalHooks

    if (meta._hooks) {
      hooks = meta._hooks
    } else {
      const activeUrl = isDev && meta.devUrl ? meta.devUrl : meta.url
      // Cache-bust in dev so stale ESM modules are never served from browser cache
      const importUrl = isDev ? `${activeUrl}?t=${Date.now()}` : activeUrl
      const importWithTimeout = Promise.race([
        import(/* webpackIgnore: true */ importUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after 15s — is the dev server running? (${activeUrl})`)), 15_000)
        ),
      ])
      const appModule = await importWithTimeout
      hooks = appModule.default ?? appModule
    }

    if (hooks.on_init) await withTimeout(hooks.on_init(), "on_init")
    return { meta, hooks }
  }

  async runBootHooks(): Promise<void> {
    const results = await Promise.allSettled(
      this.getAll().map(({ hooks }) =>
        hooks.on_boot ? withTimeout(hooks.on_boot(), "on_boot") : Promise.resolve()
      )
    )
    results.forEach((result, i) => {
      const app = this.getAll()[i]
      if (result.status === "rejected") {
        console.error(`[Petal] on_boot failed for "${app?.meta.name}": ${result.reason}`)
      }
    })
  }

  getAll(): RegisteredApp[] {
    return Array.from(this.apps.values())
  }

  getFailedApps(): Map<string, string> {
    return this.failedApps
  }

  getMergedHooks(): PetalHooks {
    const all = this.getAll().map((a) => a.hooks)

    const itemOverrides: Record<string, Partial<import("@petal/sdk").SidebarItem>> = Object.assign(
      {},
      ...all.map((h) => h.sidebar_item_overrides ?? {})
    )

    const seenOrderKeys = new Set<string>()
    const mergedOrder: string[] = []
    for (const h of all) {
      for (const key of h.sidebar_order ?? []) {
        if (!seenOrderKeys.has(key)) {
          seenOrderKeys.add(key)
          mergedOrder.push(key)
        }
      }
    }

    const orderRank = new Map(mergedOrder.map((key, i) => [key, i]))
    const getRank = (item: import("@petal/sdk").SidebarItem) =>
      orderRank.get(item.label) ?? orderRank.get(item.path) ?? Infinity

    function applyOverrides(items: import("@petal/sdk").SidebarItem[]): import("@petal/sdk").SidebarItem[] {
      return items.map((item) => {
        const override = itemOverrides[item.label] ?? itemOverrides[item.path]
        const patched = override ? { ...item, ...override } : item
        if (patched.children?.length) {
          return { ...patched, children: applyOverrides(patched.children) }
        }
        return patched
      })
    }

    function filterHidden(items: import("@petal/sdk").SidebarItem[]): import("@petal/sdk").SidebarItem[] {
      return items.filter((item) => !item.hidden)
    }

    function applyOrder(items: import("@petal/sdk").SidebarItem[]): import("@petal/sdk").SidebarItem[] {
      if (mergedOrder.length === 0) return items
      return items
        .map((item, i) => ({ item, i, rank: getRank(item) }))
        .sort((a, b) => a.rank - b.rank || a.i - b.i)
        .map(({ item }) => item)
    }

    const rawSidebarItems = all.flatMap((h) => h.sidebar_items ?? [])
    const sidebarItems = applyOrder(filterHidden(applyOverrides(rawSidebarItems)))

    const mergedFormSlots: Record<string, import("@petal/sdk").FormSlotComponents[]> = {}
    for (const h of all) {
      for (const [doctype, slots] of Object.entries(h.form_slots ?? {})) {
        if (!mergedFormSlots[doctype]) mergedFormSlots[doctype] = []
        mergedFormSlots[doctype]!.push(slots)
      }
    }

    const merged: import("@petal/sdk").PetalHooks = {
      sidebar_items: sidebarItems,
      sidebar_item_overrides: itemOverrides,
      sidebar_order: mergedOrder,
      navbar_items: all.flatMap((h) => h.navbar_items ?? []),
      setup_wizard_slides: all.flatMap((h) => h.setup_wizard_slides ?? []),
      ...(all.some((h) => h.frappe_compat?.enabled)
        ? {
            frappe_compat: {
              enabled: true,
              bundles: [...new Set(all.flatMap((h) => h.frappe_compat?.bundles ?? []))],
              autoBundles: all.every((h) => h.frappe_compat?.autoBundles !== false),
              exclude: [...new Set(all.flatMap((h) => h.frappe_compat?.exclude ?? []))],
              desk_controls: [...new Set(all.flatMap((h) => h.frappe_compat?.desk_controls ?? []))],
              desk: {
                doctypes: [...new Set(all.flatMap((h) => h.frappe_compat?.desk?.doctypes ?? []))],
                pages: [...new Set(all.flatMap((h) => h.frappe_compat?.desk?.pages ?? []))],
                embed: all.some((h) => h.frappe_compat?.desk?.embed),
              },
            },
          }
        : {}),
      routes: all.flatMap((h) => h.routes ?? []),
      form_overrides: Object.assign({}, ...all.map((h) => h.form_overrides ?? {})),
      form_field_behaviors: Object.assign({}, ...all.map((h) => h.form_field_behaviors ?? {})),
      list_overrides: Object.assign({}, ...all.map((h) => h.list_overrides ?? {})),
      overrides: Object.assign({}, ...all.map((h) => h.overrides ?? {})),
    }

    if (Object.keys(mergedFormSlots).length > 0) {
      merged.form_slots = Object.fromEntries(
        Object.entries(mergedFormSlots).map(([dt, slots]) => [dt, mergeFormSlots(slots)])
      )
    }

    return merged
  }

  getMergedTheme() {
    const hooks = this.getMergedHooks()
    return {
      primaryColor: "#16a34a",
      borderRadius: "0.5rem",
      fontFamily: "system-ui",
      ...hooks.overrides?.theme,
    }
  }

  getMergedWorkspaceConfig() {
    const hooks = this.getMergedHooks()
    return {
      doctype: "Workspace",
      fields: ["name", "title", "icon"],
      ...hooks.overrides?.workspace,
    }
  }

  getMergedFrappeClientConfig() {
    const hooks = this.getMergedHooks()
    return hooks.overrides?.frappeClient ?? {}
  }

  getMergedAuthConfig() {
    const hooks = this.getMergedHooks()
    return hooks.overrides?.auth ?? {}
  }

  getMergedSettings() {
    const hooks = this.getMergedHooks()
    return hooks.overrides?.settings ?? {}
  }
}

export const appRegistry = new AppRegistry()
