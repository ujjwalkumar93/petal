// Server-only: semver stays out of the client bundle.
import satisfies from "semver/functions/satisfies"
import validRange from "semver/ranges/valid"
import type { PetalAppMeta } from "@petal/sdk"
import pkg from "../../../package.json"

export const PETAL_VERSION: string = pkg.version

/** One or more space-separated "sha256-…", "sha384-…" or "sha512-…" base64 hashes. */
const INTEGRITY = /^\s*sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}(?:\s+sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2})*\s*$/

/** Why this app can't be loaded by this Petal, or null when it can. */
export function appConfigError(app: PetalAppMeta, petalVersion: string = PETAL_VERSION): string | null {
  if (app.petalVersion) {
    if (!validRange(app.petalVersion)) return `${app.name} has an invalid petalVersion range "${app.petalVersion}"`
    if (!satisfies(petalVersion, app.petalVersion, { includePrerelease: true })) {
      return `${app.name} needs Petal ${app.petalVersion}; this is Petal ${petalVersion}`
    }
  }
  // Browsers silently ignore malformed integrity metadata, which would load
  // the bundle unchecked; refuse the app instead.
  if (app.integrity !== undefined && !INTEGRITY.test(app.integrity)) {
    return `${app.name} has an invalid integrity value (expected sha256-, sha384- or sha512- followed by base64)`
  }
  return null
}

/** The apps of a request, each flagged with why it can't be loaded, if so. */
export function withConfigErrors(apps: PetalAppMeta[]): PetalAppMeta[] {
  return apps.map((app) => {
    const error = appConfigError(app)
    return error ? { ...app, _configError: error } : app
  })
}

export type ImportMap = { imports: Record<string, string>; integrity?: Record<string, string> }

/**
 * The page's import map: bare React specifiers in app chunks resolve to
 * Petal's shims (one React instance), and each app bundle loaded from its
 * production URL is pinned to its integrity hash, which the browser checks
 * when the registry import()s it.
 */
export function appImportMap(apps: PetalAppMeta[], useDevUrls: boolean): ImportMap {
  const integrity: Record<string, string> = {}
  for (const app of apps) {
    if (!app.integrity || appConfigError(app)) continue
    if (useDevUrls && app.devUrl) continue // the loader imports devUrl instead
    integrity[app.url] = app.integrity.trim()
  }
  return {
    imports: {
      "react": "/esm/react.js",
      "react/jsx-runtime": "/esm/react-jsx-runtime.js",
      "react-dom": "/esm/react-dom.js",
    },
    ...(Object.keys(integrity).length ? { integrity } : {}),
  }
}
