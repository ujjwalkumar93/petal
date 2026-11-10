import { type NextRequest, NextResponse } from "next/server"
import { getRequestConfig } from "@/lib/config/runtime-config"
import { withConfigErrors } from "@/lib/registry/app-compat"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cfg = getRequestConfig(request.headers)
  if (!cfg) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 })
  // `site` is the Frappe site name — the realtime client joins its socket.io namespace.
  // Apps this Petal can't run carry _configError; the registry reports them
  // on /apps instead of importing them.
  return NextResponse.json({ apps: withConfigErrors(cfg.apps ?? []), site: cfg.site })
}
