import { existsSync } from "fs"
import { join, resolve } from "path"

function isPetalCoreDir(dir: string): boolean {
  return existsSync(join(dir, "next.config.js")) || existsSync(join(dir, "next.config.ts"))
}

/**
 * Walk up from `from` looking for a petal core directory (has next.config.js).
 * Returns the directory path, or null if not found within 10 levels.
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
 * Find the directory for a custom app by name.
 * Searches workspace siblings, monorepo paths, and core/apps.
 */
export function findAppDirectory(appName: string, coreDir: string): string | null {
  const candidates = [
    resolve(coreDir, "..", "..", "..", appName),
    resolve(coreDir, "..", "..", appName),
    resolve(coreDir, "..", appName),
    resolve(coreDir, "apps", appName),
  ]

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) {
      return candidate
    }
  }

  return null
}
