import { type NextRequest, NextResponse } from "next/server"
import { getRuntimeConfig } from "@/lib/config/runtime-config"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  const { apps, theme } = getRuntimeConfig()
  console.log("[Petal] GET /api/config/route — apps:", apps, "theme:", theme)
  return NextResponse.json({ apps, theme })
}
