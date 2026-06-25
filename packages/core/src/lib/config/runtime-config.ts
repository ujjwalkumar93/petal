import type { PetalConfig } from "@petal/sdk"

export function getRuntimeConfig(): PetalConfig {
  let apps: PetalConfig["apps"] = []

  // Apps come from petal.config.ts → withPetal() bakes them into PETAL_APPS at startup.
  // For Docker/CI: set PETAL_APPS env var directly in your deployment config.
  if (process.env.PETAL_APPS) {
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
