import type { PetalConfig } from "@petal/sdk"
import type { NextConfig } from "next"

export function withPetal(petalConfig: PetalConfig) {
  return (nextConfig: NextConfig = {}): NextConfig => ({
    ...nextConfig,
    env: {
      ...nextConfig.env,
      PETAL_APPS: JSON.stringify(petalConfig.apps ?? []),
      FRAPPE_URL: petalConfig.backend ?? "http://localhost:8000",
      ...(petalConfig.theme
        ? { PETAL_THEME: JSON.stringify(petalConfig.theme) }
        : {}),
      ...(petalConfig.pathMap
        ? { PETAL_PATH_MAP: JSON.stringify(petalConfig.pathMap) }
        : {}),
    },
  })
}
