import { type NextRequest, NextResponse } from "next/server"
import { getRuntimeConfig } from "@/lib/config/runtime-config"

const FRAPPE_URL = (
  process.env.FRAPPE_INTERNAL_URL ??
  process.env.FRAPPE_URL ??
  process.env.NEXT_PUBLIC_FRAPPE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "")

const FRAPPE_SITE_HOST =
  process.env.NEXT_PUBLIC_FRAPPE_SITE ??
  new URL(FRAPPE_URL).hostname

function getBackend(_req: NextRequest): { frappeUrl: string; frappeSiteHost: string } {
  return { frappeUrl: FRAPPE_URL, frappeSiteHost: FRAPPE_SITE_HOST }
}

const DROP_REQUEST_HEADERS = new Set([
  "host", "content-length", "connection", "transfer-encoding",
])
const DROP_RESPONSE_HEADERS = new Set([
  "connection", "transfer-encoding", "keep-alive",
])

/**
 * Translates neutral Petal API paths → internal Frappe paths.
 * Nothing Frappe-specific ever appears in the browser's network tab.
 *
 * Neutral path scheme:
 *   auth/login           → api/method/login
 *   auth/logout          → api/method/logout
 *   auth/me              → api/method/frappe.auth.get_logged_user
 *   workspace/sidebar    → api/method/frappe.desk.desktop.get_workspace_sidebar_items
 *   doc/:doctype[/:name] → api/resource/:doctype[/:name]
 *   records/count        → api/method/frappe.client.get_count
 *   records/value        → api/method/frappe.client.get_value
 *   records/list         → api/method/frappe.client.get_list
 *   records/meta         → api/method/frappe.client.get_meta
 *   search/link          → api/method/frappe.desk.search.search_link
 *   reports/run          → api/method/frappe.desk.query_report.run
 *   upload               → api/method/upload_file
 *   exec/:method         → api/method/:method  (catch-all for callMethod())
 *   files/:rest          → files/:rest  (pass-through)
 */
const EXACT_MAP: Record<string, string> = {
  "auth/login": "api/method/login",
  "auth/logout": "api/method/logout",
  "auth/me": "api/method/frappe.auth.get_logged_user",
  "auth/csrf": "api/method/accounting.accounting.api.accounting.get_csrf_token",
  "auth/userinfo": "api/resource/User",
  "workspace/sidebar": "api/method/frappe.desk.desktop.get_workspace_sidebar_items",
  "workspace/page": "api/method/frappe.desk.desktop.get_desktop_page",
  "records/count": "api/method/frappe.client.get_count",
  "records/value": "api/method/frappe.client.get_value",
  "records/list": "api/method/frappe.client.get_list",
  "records/meta": "api/method/frappe.client.get_meta",
  "search/link": "api/method/frappe.desk.search.search_link",
  "reports/run": "api/method/frappe.desk.query_report.run",
  "upload": "api/method/upload_file",
}

async function buildResponse(frappeRes: Response): Promise<NextResponse> {
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
  rawCookies.forEach((cookie) => {
    resHeaders.append(
      "Set-Cookie",
      cookie
        .replace(/;\s*domain=[^;]*/gi, "")
        .replace(/;\s*samesite=[^;]*/gi, "")
        .replace(/;\s*httponly/gi, ""),
    )
  })

  const resBody = await frappeRes.arrayBuffer()
  return new NextResponse(resBody, { status: frappeRes.status, headers: resHeaders })
}

function getEffectivePathMap(_req: NextRequest): Record<string, string> {
  const overrides = getRuntimeConfig().pathMap ?? {}
  return { ...EXACT_MAP, ...overrides }
}

function translatePath(neutralPath: string, pathMap: Record<string, string>): string {
  if (pathMap[neutralPath]) return pathMap[neutralPath]!

  if (neutralPath.startsWith("doc/"))
    return "api/resource/" + neutralPath.slice("doc/".length)

  if (neutralPath.startsWith("files/")) return neutralPath

  return neutralPath
}

async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<NextResponse> {
  const { frappeUrl, frappeSiteHost } = getBackend(req)
  const neutralPath = params.path.join("/")
  const search = req.nextUrl.search

  const reqHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    if (!DROP_REQUEST_HEADERS.has(key.toLowerCase())) {
      reqHeaders[key] = value
    }
  })
  reqHeaders["host"] = frappeSiteHost

  // Translate neutral CSRF header → what Frappe expects server-side
  if (reqHeaders["x-csrf-token"]) {
    reqHeaders["x-frappe-csrf-token"] = reqHeaders["x-csrf-token"]
    delete reqHeaders["x-csrf-token"]
  }

  const isReadOnly = req.method === "GET" || req.method === "HEAD"
  const bodyText: string | null = isReadOnly ? null : await req.text()

  // /printview — proxy Frappe's full print page, rewriting asset paths so
  // they resolve through this same proxy instead of the hidden Frappe origin.
  if (neutralPath === "printview") {
    const target = `${frappeUrl}/printview${search}`
    try {
      const frappeRes = await fetch(target, {
        headers: reqHeaders,
        redirect: "manual",
        cache: "no-store",
      })
      let html = await frappeRes.text()
      html = html
        .replace(/(href|src)="\/assets\//g, '$1="/api/v1/assets/')
        .replace(/(href|src)="\/files\//g, '$1="/api/v1/files/')
        .replace(/url\(\/assets\//g, 'url(/api/v1/assets/')
        // Hide Frappe's built-in toolbar — we render our own
        .replace('</body>', '<style>.print-toolbar,[data-html2canvas-ignore]{display:none!important}</style></body>')
      return new NextResponse(html, {
        status: frappeRes.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    } catch (err) {
      console.error("[Petal Proxy] printview failed →", String(err))
      return NextResponse.json({ error: "Request failed" }, { status: 502 })
    }
  }

  if (neutralPath.startsWith("assets/")) {
    const target = `${frappeUrl}/${neutralPath}${search}`
    try {
      const frappeRes = await fetch(target, { headers: reqHeaders, redirect: "manual", cache: "no-store" })
      return buildResponse(frappeRes)
    } catch {
      return new NextResponse(null, { status: 502 })
    }
  }

  // /exec — method name is in X-Method header, never in the URL
  if (neutralPath === "exec") {
    const method = req.headers.get("x-method")
    if (!method) return NextResponse.json({ error: "Missing X-Method header" }, { status: 400 })
    delete reqHeaders["x-method"]
    const target = `${frappeUrl}/api/method/${method}${search}`
    try {
      const frappeRes = await fetch(target, {
        method: "POST",
        headers: reqHeaders,
        redirect: "manual",
        cache: "no-store",
        body: bodyText ?? null,
      })
      return buildResponse(frappeRes)
    } catch (err) {
      console.error("[Petal Proxy] exec failed →", { method, cause: String(err) })
      return NextResponse.json({ error: "Request failed" }, { status: 502 })
    }
  }

  const frappe_path = translatePath(neutralPath, getEffectivePathMap(req))
  const target = `${frappeUrl}/${frappe_path}${search}`

  try {
    const fetchInit: RequestInit = {
      method: req.method,
      headers: reqHeaders,
      redirect: "manual",
      cache: "no-store",
    }
    if (!isReadOnly) fetchInit.body = bodyText

    const frappeRes = await fetch(target, fetchInit)
    return buildResponse(frappeRes)

  } catch (err) {
    const cause = err instanceof Error
      ? ((err as Error & { cause?: unknown }).cause ?? err.message)
      : String(err)
    console.error("[Petal Proxy] fetch failed →", { target, host: frappeSiteHost, cause })
    return NextResponse.json(
      { error: "Request failed", cause: String(cause) },
      { status: 502 },
    )
  }
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) { return proxy(req, ctx) }
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) { return proxy(req, ctx) }
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) { return proxy(req, ctx) }
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) { return proxy(req, ctx) }
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) { return proxy(req, ctx) }
