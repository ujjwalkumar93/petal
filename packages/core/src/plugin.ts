import fs from "fs"
import path from "path"
import type { PetalConfig, PetalAppMeta } from "@petal/sdk"
import type { NextConfig } from "next"

export function withPetal(petalConfig: PetalConfig) {
  const dir = path.join(process.cwd(), ".petal")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // petal.apps.json (CLI-managed) takes priority over petal.config.ts apps
  const appsJsonPath = path.join(process.cwd(), "petal.apps.json")
  const apps: PetalAppMeta[] = fs.existsSync(appsJsonPath)
    ? (JSON.parse(fs.readFileSync(appsJsonPath, "utf8")) as PetalAppMeta[])
    : (petalConfig.apps ?? [])

  fs.writeFileSync(
    path.join(dir, "config.json"),
    JSON.stringify({
      apps,
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
