import type { PetalHooks } from "./hooks"

export interface PetalAppMeta {
  name: string
  version: string
  /** Production URL of the app's compiled ESM bundle */
  url: string
  /** Dev server URL — used instead of url when NODE_ENV=development. Requests are cache-busted automatically. */
  devUrl?: string
  /**
   * Tailwind CSS prefix for this app's compiled stylesheet.
   * Must match the `prefix` set in the app's tailwind.config.ts.
   * Prevents utility class collisions between apps that share the DOM.
   *
   * @example
   * // tailwind.config.ts in the custom app:
   * export default { prefix: "myapp-", content: [...] }
   *
   * // petal.config.ts in the host:
   * apps: [{ name: "myapp", tailwindPrefix: "myapp-", url: "..." }]
   */
  tailwindPrefix?: string
  _hooks?: PetalHooks
}

export interface PetalConfig {
  /** Frappe backend URL. Server-side only in Docker deployments — set via FRAPPE_URL env var. */
  backend?: string
  apps: PetalAppMeta[]
  theme?: Partial<PetalTheme>
  /**
   * Override or extend the proxy's neutral-path → backend-path translation table.
   * Keys are the neutral paths used in the browser (e.g. "auth/csrf").
   * Values are the backend paths to proxy to (e.g. "api/method/myapp.api.get_csrf").
   * Entries here are merged with Petal's built-in map; your entries take priority.
   *
   * @example
   * pathMap: {
   *   "auth/csrf": "api/method/myapp.auth.get_csrf_token",
   *   "notifications/list": "api/method/myapp.notifications.get_list",
   * }
   */
  pathMap?: Record<string, string>
}

export interface PetalTheme {
  primaryColor: string
  borderRadius: string
  fontFamily: string
}
