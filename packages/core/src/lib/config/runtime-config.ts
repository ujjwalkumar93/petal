import { existsSync, readFileSync } from "fs"
import { join } from "path"
import type { PetalConfig } from "@petal/sdk"

export function getRuntimeConfig(): PetalConfig {
  let apps: PetalConfig["apps"] = []

  // Priority 1: petal.apps.json — file-based, no Next.js rebuild needed.
  // Managed by `petal app add/remove/update`. Ignored by git.
  const appsJsonPath = join(process.cwd(), "petal.apps.json")
  if (existsSync(appsJsonPath)) {
    try {
      apps = JSON.parse(readFileSync(appsJsonPath, "utf-8"))
    } catch {
      console.error("[Petal] Invalid petal.apps.json — expected a JSON array. Falling back to env.")
    }
  }
  // Priority 2: PETAL_APPS env var — set externally (Docker / CI) when no file is on disk.
  // In local dev this is also set by withPetal() at build time, but the file takes precedence.
  else if (process.env.PETAL_APPS) {
    try {
      apps = JSON.parse(process.env.PETAL_APPS)
    } catch {
      console.error("[Petal] Invalid PETAL_APPS — expected a JSON array")
    }
  }

  let theme: PetalConfig["theme"] = {}
  if (process.env.PETAL_THEME) {
    try {
      theme = JSON.parse(process.env.PETAL_THEME)
    } catch {
      console.error("[Petal] Invalid PETAL_THEME — expected a JSON object")
    }
  }

  let pathMap: PetalConfig["pathMap"] = undefined
  if (process.env.PETAL_PATH_MAP) {
    try {
      pathMap = JSON.parse(process.env.PETAL_PATH_MAP)
    } catch {
      console.error("[Petal] Invalid PETAL_PATH_MAP — expected a JSON object")
    }
  }

  return {
    backend:
      process.env.FRAPPE_INTERNAL_URL ??
      process.env.FRAPPE_URL ??
      process.env.NEXT_PUBLIC_FRAPPE_URL ??
      "http://localhost:8000",
    apps,
    theme: theme ?? {},
    ...(pathMap ? { pathMap } : {}),
  } as PetalConfig
}
