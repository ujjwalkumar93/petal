import fs from "fs"
import path from "path"
import type { PetalConfig } from "@petal/sdk"

type StoredConfig = {
  apps: NonNullable<PetalConfig["apps"]>
  pathMap?: PetalConfig["pathMap"]
}

let _cached: StoredConfig | null = null

function loadStoredConfig(): StoredConfig {
  if (_cached) return _cached
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".petal/config.json"), "utf8")
    _cached = JSON.parse(raw) as StoredConfig
    return _cached
  } catch {
    console.error("[Petal] .petal/config.json not found — did you call withPetal() in next.config.js?")
    return { apps: [] }
  }
}

export function getRuntimeConfig(): PetalConfig {
  const { apps, pathMap } = loadStoredConfig()
  return {
    apps,
    ...(pathMap ? { pathMap } : {}),
  }
}
