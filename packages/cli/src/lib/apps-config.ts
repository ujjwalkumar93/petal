import { existsSync, readFileSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import type { PetalAppMeta } from "@petal/sdk"

export const APPS_FILENAME = "petal.apps.json"

function isPetalCoreDir(dir: string): boolean {
  return existsSync(join(dir, "next.config.js")) || existsSync(join(dir, "next.config.ts"))
}

/**
 * Walk up from `from` looking for a petal core directory (has next.config.js).
 * Returns the directory path, or null if not found within 5 levels.
 */
export function findPetalCoreDir(from: string = process.cwd()): string | null {
  let dir = resolve(from)
  for (let i = 0; i < 10; i++) {
    if (isPetalCoreDir(dir)) return dir

    for (const candidate of [
      join(dir, "packages", "core"),
      join(dir, "petal", "packages", "core"),
    ]) {
      if (isPetalCoreDir(candidate)) return candidate
    }

    const parent = resolve(dir, "..")
    if (parent === dir) break
    dir = parent
  }
  return null
}

/**
 * Find the directory for a registered custom app by name.
 * Searches workspace siblings, monorepo paths, and core/apps.
 */
export function findAppDirectory(appName: string, coreDir: string): string | null {
  const candidates = [
    // Workspace sibling (e.g. ../billing-fe when core is petal/packages/core)
    resolve(coreDir, "..", "..", "..", appName),
    // Petal monorepo sibling (e.g. petal/billing-fe)
    resolve(coreDir, "..", "..", appName),
    // packages/ sibling (e.g. petal/packages/billing-fe)
    resolve(coreDir, "..", appName),
    // apps/ subdirectory inside core
    resolve(coreDir, "apps", appName),
  ]

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) {
      return candidate
    }
  }

  return null
}

/** Returns the path to petal.apps.json, resolving the petal core dir automatically. */
export function getAppsFilePath(coreDir?: string): string {
  const dir = coreDir ?? findPetalCoreDir() ?? process.cwd()
  return join(dir, APPS_FILENAME)
}

export function readApps(filePath: string): PetalAppMeta[] {
  if (!existsSync(filePath)) return []
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PetalAppMeta[]
  } catch {
    return []
  }
}

export function writeApps(filePath: string, apps: PetalAppMeta[]): void {
  writeFileSync(filePath, JSON.stringify(apps, null, 2) + "\n", "utf-8")
}

/** Assert the current (or given) directory is a petal core dir. Exits with error if not. */
export function requirePetalCoreDir(coreDir?: string): string {
  const dir = coreDir ?? findPetalCoreDir()
  if (!dir) {
    const pc = require("picocolors") as typeof import("picocolors")
    console.error(pc.red("\n  ✗ Not inside a Petal core directory (no next.config.js found)."))
    console.error(pc.dim("  Run this command from your petal/packages/core directory.\n"))
    process.exit(1)
  }
  return dir
}
