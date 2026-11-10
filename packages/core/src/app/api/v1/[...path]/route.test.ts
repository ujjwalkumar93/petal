import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { DELETE, GET, PATCH, POST, PUT } from "./route"

const BACKEND = "http://backend.internal:8000"

type FetchCall = { url: string; init: RequestInit }
let calls: FetchCall[]
let upstream: () => Response | Promise<Response>

beforeEach(() => {
  vi.stubEnv("FRAPPE_BACKEND_URL", BACKEND)
  vi.stubEnv("PETAL_TENANTS", "")
  calls = []
  upstream = () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return upstream()
  }))
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function ctx(path: string) {
  return { params: Promise.resolve({ path: path.split("/") }) }
}

async function bodyBytes(body: RequestInit["body"]): Promise<Uint8Array> {
  return new Uint8Array(await new Response(body as BodyInit).arrayBuffer())
}

describe("API proxy — request bodies", () => {
  it("forwards binary uploads byte-for-byte", async () => {
    // Every byte value, including sequences that are invalid UTF-8.
    const payload = new Uint8Array(4096)
    for (let i = 0; i < payload.length; i++) payload[i] = (i * 37 + 11) % 256
    const req = new NextRequest("http://petal.test/api/v1/upload", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=x" },
      body: payload,
    })

    await POST(req, ctx("upload"))

    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe(`${BACKEND}/api/method/upload_file`)
    expect(await bodyBytes(calls[0]!.init.body)).toEqual(payload)
  })

  it("forwards binary bodies on /exec unchanged", async () => {
    const payload = new Uint8Array([0xff, 0xfe, 0x00, 0xc3, 0x28, 0x80])
    const req = new NextRequest("http://petal.test/api/v1/exec", {
      method: "POST",
      headers: { "x-method": "frappe.client.get_list" },
      body: payload,
    })

    await POST(req, ctx("exec"))

    expect(await bodyBytes(calls[0]!.init.body)).toEqual(payload)
  })
})

describe("API proxy — response headers", () => {
  it("drops content-encoding and content-length after fetch has decoded the body", async () => {
    const json = '{"message":"hello"}'
    upstream = () => new Response(json, {
      status: 200,
      headers: { "content-type": "application/json", "content-encoding": "gzip", "content-length": "44" },
    })

    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/me"), ctx("auth/me"))

    expect(res.headers.get("content-encoding")).toBeNull()
    expect(res.headers.get("content-length")).not.toBe("44")
    expect(await res.text()).toBe(json)
  })

  it("does the same for /assets pass-through", async () => {
    upstream = () => new Response("body{}", { headers: { "content-type": "text/css", "content-encoding": "br" } })

    const res = await GET(new NextRequest("http://petal.test/api/v1/assets/x.css"), ctx("assets/x.css"))

    expect(res.headers.get("content-encoding")).toBeNull()
    expect(await res.text()).toBe("body{}")
  })
})

describe("API proxy — /exec method names", () => {
  it.each(["../../private/secret", "frappe.client/../../x", "a?b=1", "a#b", "a b", "%2e%2e"])(
    "rejects %j without calling the backend",
    async (method) => {
      const req = new NextRequest("http://petal.test/api/v1/exec", { method: "POST", headers: { "x-method": method }, body: "{}" })

      const res = await POST(req, ctx("exec"))

      expect(res.status).toBe(400)
      expect(calls).toHaveLength(0)
    },
  )

  it("accepts dotted Python method paths", async () => {
    const req = new NextRequest("http://petal.test/api/v1/exec", {
      method: "POST",
      headers: { "x-method": "erpnext.accounts.doctype.sales_invoice.sales_invoice.make_delivery_note" },
      body: "{}",
    })

    const res = await POST(req, ctx("exec"))

    expect(res.status).toBe(200)
    expect(calls[0]!.url).toBe(`${BACKEND}/api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_delivery_note`)
  })
})

describe("API proxy — upstream failures", () => {
  it("returns 502 without leaking the backend address or error cause", async () => {
    upstream = () => { throw Object.assign(new TypeError("fetch failed"), { cause: new Error("connect ECONNREFUSED 10.0.0.5:8000") }) }

    const res = await GET(new NextRequest("http://petal.test/api/v1/doc/User"), ctx("doc/User"))
    const text = await res.text()

    expect(res.status).toBe(502)
    expect(text).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|backend\.internal/)
  })
})

describe("API proxy — path segments (#19)", () => {
  // Next splits the URL on "/" and then decodes each segment, so a name sent as
  // INV%2F1 arrives here as the single segment "INV/1".
  function decodedCtx(...segments: string[]) {
    return { params: Promise.resolve({ path: segments }) }
  }

  it("re-encodes decoded segments so '#', '?', '%' and '/' reach Frappe intact", async () => {
    const req = new NextRequest("http://petal.test/api/v1/doc/Sales%20Invoice/INV%231%3Fa%2520%2F2", { method: "GET" })

    await GET(req, decodedCtx("doc", "Sales Invoice", "INV#1?a%20/2"))

    expect(calls[0]!.url).toBe(`${BACKEND}/api/resource/Sales%20Invoice/INV%231%3Fa%2520%2F2`)
  })

  it("keeps the query string and the mapped neutral paths unchanged", async () => {
    const req = new NextRequest("http://petal.test/api/v1/doc/Item?fields=%5B%22name%22%5D", { method: "GET" })
    await GET(req, decodedCtx("doc", "Item"))
    await GET(new NextRequest("http://petal.test/api/v1/records/count"), decodedCtx("records", "count"))

    expect(calls[0]!.url).toBe(`${BACKEND}/api/resource/Item?fields=%5B%22name%22%5D`)
    expect(calls[1]!.url).toBe(`${BACKEND}/api/method/frappe.client.get_count`)
  })

  it("re-encodes file names on the /files pass-through", async () => {
    await GET(new NextRequest("http://petal.test/api/v1/files/a%20b%23c.pdf"), decodedCtx("files", "a b#c.pdf"))
    expect(calls[0]!.url).toBe(`${BACKEND}/files/a%20b%23c.pdf`)
  })
})

describe("API proxy — cookies and status codes", () => {
  it("strips the Domain of every Set-Cookie and keeps the other attributes", async () => {
    const headers = new Headers()
    headers.append("set-cookie", "sid=abc; Domain=backend.internal; Path=/; HttpOnly; SameSite=Lax")
    headers.append("set-cookie", "user_id=jane; domain=.backend.internal; Path=/")
    upstream = () => new Response("{}", { status: 200, headers })

    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/me"), ctx("auth/me"))

    expect(res.headers.getSetCookie()).toEqual([
      "sid=abc; Path=/; HttpOnly; SameSite=Lax",
      "user_id=jane; Path=/",
    ])
  })

  it("answers a 304 revalidation without a body", async () => {
    upstream = () => new Response(null, { status: 304, headers: { etag: '"v1"' } })
    const res = await GET(new NextRequest("http://petal.test/api/v1/files/logo.png"), ctx("files/logo.png"))
    expect(res.status).toBe(304)
    expect(res.headers.get("etag")).toBe('"v1"')
    expect(await res.text()).toBe("")
  })

  it("passes upstream error statuses and bodies through", async () => {
    upstream = () => new Response('{"exc_type":"PermissionError"}', { status: 403, headers: { "content-type": "application/json" } })
    const res = await GET(new NextRequest("http://petal.test/api/v1/doc/ToDo"), ctx("doc/ToDo"))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ exc_type: "PermissionError" })
  })
})

describe("API proxy — request headers", () => {
  it("sends Frappe's CSRF header name and the backend's site host, and drops hop-by-hop headers", async () => {
    await POST(new NextRequest("http://petal.test/api/v1/doc/ToDo", {
      method: "POST",
      body: "{}",
      headers: { "x-csrf-token": "tok", connection: "keep-alive", cookie: "sid=abc" },
    }), ctx("doc/ToDo"))

    const sent = calls[0]!.init.headers as Record<string, string>
    expect(sent["x-frappe-csrf-token"]).toBe("tok")
    expect(sent["x-csrf-token"]).toBeUndefined()
    expect(sent.connection).toBeUndefined()
    expect(sent.host).toBe("backend.internal")
    expect(sent.cookie).toBe("sid=abc")
  })

  it.each([
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ] as const)("forwards %s with its method", async (method, handler) => {
    await handler(new NextRequest("http://petal.test/api/v1/doc/ToDo/T-1", { method, body: method === "DELETE" ? null : "{}" }), ctx("doc/ToDo/T-1"))
    expect(calls[0]!.init.method).toBe(method)
    expect(calls[0]!.url).toBe(`${BACKEND}/api/resource/ToDo/T-1`)
  })

  it("sends GET without a body", async () => {
    await GET(new NextRequest("http://petal.test/api/v1/doc/ToDo?limit=5"), ctx("doc/ToDo"))
    expect(calls[0]!.init.body).toBeUndefined()
    expect(calls[0]!.url).toBe(`${BACKEND}/api/resource/ToDo?limit=5`)
  })
})

describe("API proxy — print view", () => {
  it("rewrites asset and file URLs to go through the proxy", async () => {
    upstream = () => new Response('<link href="/assets/print.css"><img src="/files/logo.png"></body>', { status: 200 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/printview?doctype=ToDo&name=T-1"), ctx("printview"))

    expect(calls[0]!.url).toBe(`${BACKEND}/printview?doctype=ToDo&name=T-1`)
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8")
    const html = await res.text()
    expect(html).toContain('href="/api/v1/assets/print.css"')
    expect(html).toContain('src="/api/v1/files/logo.png"')
  })

  it("answers 502 when the backend is down", async () => {
    upstream = () => { throw new TypeError("fetch failed") }
    const res = await GET(new NextRequest("http://petal.test/api/v1/printview"), ctx("printview"))
    expect(res.status).toBe(502)
  })
})

describe("API proxy — CSRF token and boot", () => {
  it("reads the CSRF token from the desk page with only the session cookie", async () => {
    upstream = () => new Response('<script>frappe.csrf_token = "abc123";</script>', { status: 200 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/csrf", { headers: { cookie: "sid=s1", "x-other": "1" } }), ctx("auth/csrf"))

    expect(calls[0]!.url).toBe(`${BACKEND}/app`)
    expect(calls[0]!.init.headers).toEqual({ cookie: "sid=s1", host: "backend.internal", accept: "text/html" })
    expect(await res.json()).toEqual({ message: "abc123" })
  })

  it("answers 401 when the desk page has no token (guest)", async () => {
    upstream = () => new Response("<html>login</html>", { status: 200 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/csrf"), ctx("auth/csrf"))
    expect(res.status).toBe(401)
  })

  it("answers 401 when the desk page redirects (not logged in)", async () => {
    upstream = () => new Response(null, { status: 302, headers: { location: "/login" } })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/csrf"), ctx("auth/csrf"))
    expect(res.status).toBe(401)
  })

  it("returns the desk boot object as JSON", async () => {
    upstream = () => new Response('<script>frappe.boot = {"user":{"name":"jane"},"s":"a}b"};</script>', { status: 200 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/boot"), ctx("auth/boot"))
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(await res.json()).toEqual({ message: { user: { name: "jane" }, s: "a}b" } })
  })

  it("answers 401 for a guest's boot", async () => {
    upstream = () => new Response("<html></html>", { status: 200 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/boot"), ctx("auth/boot"))
    expect(res.status).toBe(401)
  })

  it.each(["auth/csrf", "auth/boot"])("answers 502 when %s cannot reach the backend", async (path) => {
    upstream = () => { throw new TypeError("fetch failed") }
    const res = await GET(new NextRequest(`http://petal.test/api/v1/${path}`), ctx(path))
    expect(res.status).toBe(502)
  })
})

describe("API proxy — session probe", () => {
  it("reports a guest as the Guest user, keeping cookies Frappe set", async () => {
    upstream = () => new Response('{"exc_type":"PermissionError"}', {
      status: 403,
      headers: { "set-cookie": "sid=Guest; Domain=backend.internal; Path=/" },
    })
    const res = await GET(new NextRequest("http://petal.test/api/v1/auth/me"), ctx("auth/me"))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: "Guest" })
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(res.headers.getSetCookie()).toEqual(["sid=Guest; Path=/"])
  })

  it("keeps a 403 from any other endpoint", async () => {
    upstream = () => new Response("{}", { status: 403 })
    const res = await GET(new NextRequest("http://petal.test/api/v1/doc/User"), ctx("doc/User"))
    expect(res.status).toBe(403)
  })
})

describe("API proxy — more upstream failures", () => {
  it.each([
    ["assets/frappe/dist/app.js", GET],
    ["exec", POST],
  ] as const)("answers 502 for %s", async (path, handler) => {
    upstream = () => { throw new TypeError("fetch failed") }
    const res = await handler(new NextRequest(`http://petal.test/api/v1/${path}`, {
      method: handler === POST ? "POST" : "GET",
      headers: { "x-method": "frappe.client.get" },
      ...(handler === POST ? { body: "{}" } : {}),
    }), ctx(path))
    expect(res.status).toBe(502)
    expect(JSON.stringify(await res.json())).not.toContain("backend.internal")
  })
})

describe("API proxy — tenants", () => {
  it("answers 404 for a host that isn't a configured tenant, without calling a backend", async () => {
    vi.stubEnv("PETAL_TENANTS", JSON.stringify({ "acme.example.com": { backend: BACKEND } }))
    const res = await GET(new NextRequest("http://other.example.com/api/v1/auth/me", { headers: { host: "other.example.com" } }), ctx("auth/me"))
    expect(res.status).toBe(404)
    expect(calls).toHaveLength(0)
  })
})
