import { type NextRequest, NextResponse } from "next/server"

/**
 * Development-only endpoint for app bundle HMR.
 *
 * GET  — opens a Server-Sent Events stream; the browser listens for "reload" events.
 * POST — triggered by `petal dev` after each Vite rebuild; fans out to all SSE listeners.
 *
 * Only active when NODE_ENV=development. Returns 404 in production.
 */

if (process.env.NODE_ENV !== "development") {
  // Stub out in production — tree-shaken away at build time
}

// In-process fan-out: each listening tab registers a controller here.
// Works for a single Next.js dev server process (not multi-instance prod).
const listeners = new Set<ReadableStreamDefaultController<Uint8Array>>()

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 })
  }

  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
      listeners.add(ctrl)
      // Heartbeat every 25 s to keep the connection alive through proxies
      const hb = setInterval(() => {
        try { ctrl.enqueue(encoder.encode(": heartbeat\n\n")) } catch { clearInterval(hb) }
      }, 25_000)
      req.signal.addEventListener("abort", () => {
        clearInterval(hb)
        listeners.delete(ctrl)
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":      "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 })
  }

  const encoder = new TextEncoder()
  const msg = encoder.encode("event: reload\ndata: {}\n\n")
  for (const ctrl of listeners) {
    try { ctrl.enqueue(msg) } catch { listeners.delete(ctrl) }
  }
  return NextResponse.json({ fanned: listeners.size })
}
