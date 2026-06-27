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

  const backendUrl = process.env.FRAPPE_BACKEND_URL ?? "http://localhost:8000"

  return (nextConfig: NextConfig = {}): NextConfig => ({
    ...nextConfig,
    env: {
      ...nextConfig.env,
      ...(process.env.FRAPPE_BACKEND_URL ? {} : { FRAPPE_BACKEND_URL: backendUrl }),
      // NEXT_PUBLIC_ alias lets client components read this — users never set it directly
      NEXT_PUBLIC_FRAPPE_BACKEND_URL: backendUrl,
    },
  })
}
