import { type NextRequest, NextResponse } from "next/server"
import { getRuntimeConfig } from "@/lib/config/runtime-config"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  const { apps } = getRuntimeConfig()
  return NextResponse.json({ apps })
}
