import { type NextRequest, NextResponse } from "next/server"
import { getRuntimeConfig } from "@/lib/config/runtime-config"
import { backendFor, clientIp, trustedProxyHops } from "@/lib/config/tenants"
import {
  BOOT_PATH, CSRF_PATH, EXACT_MAP, extractBootJson, extractCsrfToken, rewritePrintHtml, stripCookieDomain, translatePath,
} from "@/lib/frappe/proxy-paths"

/** Single-tenant backend, or the tenant's when PETAL_TENANTS is set (null = unknown host). */
function getBackend(req: NextRequest): { frappeUrl: string; frappeSiteHost: string; pathMap?: Record<string, string> } | null {
  const b = backendFor(req.headers, process.env)
  if (!b) return null
  return { frappeUrl: b.frappeUrl, frappeSiteHost: b.siteHost, ...(b.pathMap ? { pathMap: b.pathMap } : {}) }
}

const DROP_REQUEST_HEADERS = new Set([
  "host", "content-length",
  // Hop-by-hop: they describe the browser→Petal connection, not Petal→Frappe.
  // fetch() rejects a request carrying Expect (curl sends it on large uploads).
  "connection", "transfer-encoding", "keep-alive", "expect", "upgrade", "te", "trailer", "proxy-connection",
  // Set below from what a trusted proxy reported, never passed through: a
  // client could otherwise pick the IP Frappe rate-limits and logs.
  "x-forwarded-for", "x-forwarded-host", "x-forwarded-port", "x-forwarded-proto", "forwarded", "x-real-ip",
])
// fetch() transparently decodes gzip/br/deflate bodies but keeps the upstream
// Content-Encoding and Content-Length headers. Forwarding them would make the
// browser try to decode an already-decoded body (ERR_CONTENT_DECODING_FAILED)
// whenever the backend — e.g. nginx in a bench production setup — compresses.
const DROP_RESPONSE_HEADERS = new Set([
  "connection", "transfer-encoding", "keep-alive", "content-encoding", "content-length",
])

/** Whitelisted Python method path, e.g. "frappe.client.get_list". Anything else could escape /api/method/. */
const METHOD_NAME = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/

/** Client-facing 502: details stay in server logs, never in the response (they reveal internal hosts). */
function badGateway(): NextResponse {
  return NextResponse.json({ error: "The backend could not be reached" }, { status: 502 })
}

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])

const MB = 1024 * 1024
/** Largest request body passed to Frappe (PETAL_MAX_BODY_MB, default 50). */
function maxBodyBytes(): number {
  const mb = Number(process.env.PETAL_MAX_BODY_MB)
  return (Number.isFinite(mb) && mb > 0 ? mb : 50) * MB
}
/** How long to wait for Frappe's response headers (PETAL_UPSTREAM_TIMEOUT_MS, default 120 s, as bench's nginx). */
function upstreamTimeoutMs(): number {
  const ms = Number(process.env.PETAL_UPSTREAM_TIMEOUT_MS)
  return Number.isFinite(ms) && ms > 0 ? ms : 120_000
}

class UpstreamTimeout extends Error {}
class BodyTooLarge extends Error {}

function tooLarge(): NextResponse {
  return NextResponse.json({ error: `Request body is larger than ${Math.round(maxBodyBytes() / MB)} MB` }, { status: 413 })
}
function gatewayTimeout(): NextResponse {
  return NextResponse.json({ error: "The backend did not respond in time" }, { status: 504 })
}

/** Passes the body through, failing the upload once it grows past the limit. */
function limitBody(body: ReadableStream<Uint8Array>, max: number): ReadableStream<Uint8Array> {
  let seen = 0
  return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength
      if (seen > max) controller.error(new BodyTooLarge())
      else controller.enqueue(chunk)
    },
  }))
}

/**
 * fetch() to Frappe that gives up when the response headers take longer than
 * the upstream timeout, and is cancelled when the browser disconnects. The
 * timeout covers only the wait for headers: a large download to a slow client
 * may stream for longer.
 */
async function upstreamFetch(req: NextRequest, url: string, init: RequestInit): Promise<Response> {
  const ctl = new AbortController()
  const onClientGone = () => ctl.abort(req.signal.reason)
  if (req.signal.aborted) onClientGone()
  else req.signal.addEventListener("abort", onClientGone, { once: true })
  const timer = setTimeout(() => ctl.abort(new UpstreamTimeout()), upstreamTimeoutMs())
  try {
    return await fetch(url, { ...init, signal: ctl.signal })
  } catch (err) {
    if (ctl.signal.reason instanceof UpstreamTimeout) throw ctl.signal.reason
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/** True when `err` (or what caused it) is one of ours. */
function isError(err: unknown, type: typeof UpstreamTimeout | typeof BodyTooLarge): boolean {
  for (let e: unknown = err, i = 0; e && i < 5; e = (e as { cause?: unknown }).cause, i++) {
    if (e instanceof type) return true
  }
  return false
}

/** 504/413 for our own limits, else a 502 that keeps details in the server log. */
function failure(err: unknown, log: () => void): NextResponse {
  if (isError(err, UpstreamTimeout)) return gatewayTimeout()
  if (isError(err, BodyTooLarge)) return tooLarge()
  log()
  return badGateway()
}

function buildResponse(frappeRes: Response): NextResponse {
  const resHeaders = new Headers()
  frappeRes.headers.forEach((value, key) => {
    if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      resHeaders.set(key, value)
    }
  })

  const rawCookies: string[] =
    typeof (frappeRes.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (frappeRes.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : (frappeRes.headers.get("set-cookie") ?? "").split(/,(?=[^ ])/).filter(Boolean)

  resHeaders.delete("set-cookie")
  resHeaders.set("X-Content-Type-Options", "nosniff")
  rawCookies.forEach((cookie) => {
    // Only strip Domain: Frappe's cookie is scoped to its own origin, but the
    // browser only ever talks to this proxy's origin, so a foreign Domain
    // attribute would cause the browser to silently drop the cookie.
    // HttpOnly/SameSite/Secure are preserved as Frappe set them.
    resHeaders.append("Set-Cookie", stripCookieDomain(cookie))
  })

  // 304 (browser revalidating a cached image/asset), 204 etc. must not carry a
  // body — the Response constructor throws on one, which turned every cache
  // revalidation of /files/* into a 500 and a broken <img>.
  if (NULL_BODY_STATUSES.has(frappeRes.status)) {
    return new NextResponse(null, { status: frappeRes.status, headers: resHeaders })
  }
  // Streamed: files and PDFs reach the browser as Frappe sends them.
  return new NextResponse(frappeRes.body, { status: frappeRes.status, headers: resHeaders })
}

/** Network errors from fetch() keep the useful part (ECONNREFUSED host:port) in `cause`. */
function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const cause = (err as Error & { cause?: unknown }).cause
  return cause ? `${err.message}: ${String(cause)}` : err.message
}

function getEffectivePathMap(req: NextRequest): Record<string, string> {
  const overrides = getRuntimeConfig().pathMap ?? {}
  return { ...EXACT_MAP, ...overrides, ...(getBackend(req)?.pathMap ?? {}) }
}

type RouteCtx = { params: Promise<{ path: string[] }> }

async function proxy(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const params = await ctx.params
  const backend = getBackend(req)
  if (!backend) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 })
  const { frappeUrl, frappeSiteHost } = backend
  // Next has already decoded each segment ("INV%2F1" → "INV/1"). Match routes
  // on the decoded form; send the re-encoded form upstream, or "#", "?", "%"
  // and "/" inside a document name would change which URL Frappe sees.
  const neutralPath = params.path.join("/")
  const encodedPath = params.path.map(encodeURIComponent).join("/")
  const search = req.nextUrl.search

  const reqHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    if (!DROP_REQUEST_HEADERS.has(key.toLowerCase())) {
      reqHeaders[key] = value
    }
  })
  reqHeaders["host"] = frappeSiteHost
  const hops = trustedProxyHops(process.env)
  const ip = clientIp(req.headers, hops)
  if (ip) reqHeaders["x-forwarded-for"] = ip
  const proto = hops > 0 ? req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() : undefined
  if (proto) reqHeaders["x-forwarded-proto"] = proto

  // Translate neutral CSRF header → what Frappe expects server-side
  if (reqHeaders["x-csrf-token"]) {
    reqHeaders["x-frappe-csrf-token"] = reqHeaders["x-csrf-token"]
    delete reqHeaders["x-csrf-token"]
  }

  const isReadOnly = req.method === "GET" || req.method === "HEAD"
  const max = maxBodyBytes()
  if (!isReadOnly && Number(req.headers.get("content-length") ?? 0) > max) return tooLarge()
  // Streamed as raw bytes (never req.text(): multipart uploads carry binary
  // data that a UTF-8 decode/re-encode round trip silently corrupts), with
  // the size limit enforced as it flows for bodies without Content-Length.
  const body = !isReadOnly && req.body ? limitBody(req.body, max) : null
  const withBody = (init: RequestInit): RequestInit =>
    body ? ({ ...init, body, duplex: "half" } as RequestInit) : init

  // /printview — proxy Frappe's full print page, rewriting asset paths so
  // they resolve through this same proxy instead of the hidden Frappe origin.
  if (neutralPath === "printview") {
    const target = `${frappeUrl}/printview${search}`
    try {
      const frappeRes = await upstreamFetch(req, target, {
        headers: reqHeaders,
        redirect: "manual",
        cache: "no-store",
      })
      const html = rewritePrintHtml(await frappeRes.text())
      return new NextResponse(html, {
        status: frappeRes.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    } catch (err) {
      return failure(err, () => console.error("[Petal Proxy] printview failed →", String(err)))
    }
  }

  if (neutralPath.startsWith("assets/")) {
    const target = `${frappeUrl}/${encodedPath}${search}`
    try {
      const frappeRes = await upstreamFetch(req, target, { headers: reqHeaders, redirect: "manual", cache: "no-store" })
      return buildResponse(frappeRes)
    } catch (err) {
      return failure(err, () => console.error("[Petal Proxy] asset fetch failed →", { target, cause: describeError(err) }))
    }
  }

  // auth/csrf — unless a pathMap entry names a method that returns the token,
  // scrape it from the desk boot page, which every Frappe version renders.
  if (neutralPath === CSRF_PATH && !getEffectivePathMap(req)[CSRF_PATH]) {
    try {
      const frappeRes = await upstreamFetch(req, `${frappeUrl}/app`, {
        headers: { cookie: reqHeaders["cookie"] ?? "", host: frappeSiteHost, accept: "text/html" },
        redirect: "manual",
        cache: "no-store",
      })
      const token = frappeRes.ok ? extractCsrfToken(await frappeRes.text()) : null
      return token
        ? NextResponse.json({ message: token })
        : NextResponse.json({ error: "No CSRF token — session is not logged in" }, { status: 401 })
    } catch (err) {
      return failure(err, () => console.error("[Petal Proxy] csrf fetch failed →", String(err)))
    }
  }

  // auth/boot — Desk's boot data, read from the desk page as Desk itself does
  // (frappe.sessions.get isn't whitelisted). For the Frappe-compatible runtime.
  if (neutralPath === BOOT_PATH) {
    try {
      const frappeRes = await upstreamFetch(req, `${frappeUrl}/app`, {
        headers: { cookie: reqHeaders["cookie"] ?? "", host: frappeSiteHost, accept: "text/html" },
        redirect: "manual",
        cache: "no-store",
      })
      const boot = frappeRes.ok ? extractBootJson(await frappeRes.text()) : null
      if (!boot) return NextResponse.json({ error: "No boot data — session is not logged in" }, { status: 401 })
      return new NextResponse(`{"message":${boot}}`, {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    } catch (err) {
      return failure(err, () => console.error("[Petal Proxy] boot fetch failed →", String(err)))
    }
  }

  // /exec — method name is in X-Method header, never in the URL
  if (neutralPath === "exec") {
    const method = req.headers.get("x-method")
    if (!method) return NextResponse.json({ error: "Missing X-Method header" }, { status: 400 })
    if (!METHOD_NAME.test(method)) return NextResponse.json({ error: "Invalid method name" }, { status: 400 })
    delete reqHeaders["x-method"]
    const target = `${frappeUrl}/api/method/${method}${search}`
    try {
      const frappeRes = await upstreamFetch(req, target, withBody({
        method: "POST",
        headers: reqHeaders,
        redirect: "manual",
        cache: "no-store",
      }))
      return buildResponse(frappeRes)
    } catch (err) {
      return failure(err, () => console.error("[Petal Proxy] exec failed →", { method, cause: describeError(err) }))
    }
  }

  const frappe_path = translatePath(encodedPath, getEffectivePathMap(req))
  const target = `${frappeUrl}/${frappe_path}${search}`

  try {
    const frappeRes = await upstreamFetch(req, target, withBody({
      method: req.method,
      headers: reqHeaders,
      redirect: "manual",
      cache: "no-store",
    }))
    // Frappe answers get_logged_user with 403 for guests. "Not logged in" is an
    // expected state for this session probe (login page, expired session), so
    // report it as the Guest user instead of a failed request in the console.
    if (neutralPath === "auth/me" && frappeRes.status === 403) {
      const upstream = buildResponse(frappeRes)
      const res = NextResponse.json({ message: "Guest" }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
      // keep any cookie Frappe set (e.g. clearing an expired sid)
      upstream.headers.getSetCookie().forEach((c) => res.headers.append("Set-Cookie", c))
      return res
    }
    return buildResponse(frappeRes)

  } catch (err) {
    return failure(err, () => console.error("[Petal Proxy] fetch failed →", { target, host: frappeSiteHost, cause: describeError(err) }))
  }
}

export async function GET(req: NextRequest, ctx: RouteCtx) { return proxy(req, ctx) }
export async function POST(req: NextRequest, ctx: RouteCtx) { return proxy(req, ctx) }
export async function PUT(req: NextRequest, ctx: RouteCtx) { return proxy(req, ctx) }
export async function DELETE(req: NextRequest, ctx: RouteCtx) { return proxy(req, ctx) }
export async function PATCH(req: NextRequest, ctx: RouteCtx) { return proxy(req, ctx) }
