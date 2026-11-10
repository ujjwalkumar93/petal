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
  /**
   * Subresource Integrity hash of the bundle at `url` ("sha384-…", as from
   * `openssl dgst -sha384 -binary petal.hooks.js | openssl base64 -A`).
   * Browsers refuse to run a bundle that doesn't match. Not applied to
   * `devUrl`. An app with a malformed value isn't loaded.
   */
  integrity?: string
  /**
   * Petal versions this app works with, as a semver range (e.g. ">=0.4 <1").
   * An app whose range excludes the running Petal is reported on /apps and
   * never loaded.
   */
  petalVersion?: string
  _hooks?: PetalHooks
  /** Set by the server when this app can't be loaded (bad range, malformed integrity). */
  _configError?: string
}

export interface PetalConfig {
  apps?: PetalAppMeta[]
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
