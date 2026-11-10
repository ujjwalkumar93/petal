import fs from "fs"
import path from "path"
import type { PetalConfig } from "@petal/sdk"
import type { NextConfig } from "next"

export function withPetal(petalConfig: PetalConfig) {
  const dir = path.join(process.cwd(), ".petal")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Write only the static config from petal.config.ts.
  // petal.apps.json (CLI-managed) is read at request time by runtime-config.ts — no restart needed.
  fs.writeFileSync(
    path.join(dir, "config.json"),
    JSON.stringify({
      apps: petalConfig.apps ?? [],
      ...(petalConfig.pathMap ? { pathMap: petalConfig.pathMap } : {}),
    }),
  )

  // Nothing about the backend goes into `env`: anything there is inlined into
  // client bundles at build time. The browser only ever talks to /api/v1; the
  // Frappe address stays on the server (FRAPPE_BACKEND_URL, read at runtime).
  return (nextConfig: NextConfig = {}): NextConfig => ({ ...nextConfig })
}
