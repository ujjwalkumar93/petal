# Security

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub: **Security → Report a vulnerability** on this repository (private vulnerability reporting). Don't open a public issue for a security problem.

Include what you found, how to reproduce it, and which Petal version or commit you tested. You'll get an answer within a week. Fixes are released before the details are made public.

## Trust model

Petal is a browser front end for Frappe. Frappe stays the security boundary: it authenticates users, checks permissions on every request, and owns the data. Petal never sees passwords after login, keeps no data of its own on the server, and can't grant a user anything Frappe wouldn't.

Inside the browser, three kinds of code run with the signed-in user's full authority. Treat each of them as trusted code.

### 1. Petal apps are trusted code

An app listed in `petal.config.ts`, `petal.apps.json`, `PETAL_APPS` or a tenant in `PETAL_TENANTS` is an ES module that Petal imports into its own page, on its own origin. It can do anything the user can do in Frappe: read and change any document they can access, call any whitelisted method, and read the page.

So installing an app is like installing a Frappe app: only install apps you trust, from origins you control.

What Petal does to limit the damage:

- **`integrity`**: set `"integrity": "sha384-…"` on an app and the browser refuses to run its bundle unless it matches that hash. A compromised CDN can't swap the code. Generate the value with:

  ```sh
  openssl dgst -sha384 -binary petal.hooks.js | openssl base64 -A | sed 's/^/sha384-/'
  ```

  The hash is pinned through the page's import map, so it needs a browser that supports import-map integrity (current Chrome, Edge, Safari and Firefox). Older browsers load the app without the check. It applies to the app's production `url`, not its `devUrl`. An app with a malformed `integrity` value isn't loaded at all.
- **`petalVersion`**: a semver range (e.g. `">=0.4 <1"`). An app whose range excludes the running Petal is listed as failed on `/apps` and never imported.
- **CSP**: scripts may only come from Petal's origin and the origins of configured apps (`script-src`), with a per-request nonce for inline scripts.
- **Timeouts**: an app's `on_init` and `on_boot` hooks fail after 10 seconds instead of holding up the shell.

### 2. Frappe metadata runs as JavaScript, as it does in Desk

To behave like Desk, Petal evaluates JavaScript that lives in Frappe's database and metadata:

- `depends_on`, `mandatory_depends_on` and `read_only_depends_on` expressions (`eval:…`),
- DocType JS and Client Scripts (`__js`, `__custom_js`), when the Frappe-compatible runtime is on,
- Dashboard Chart Source scripts, and `frappe.render_template` templates.

This is Desk's own model: **anyone who can write a Client Script, a DocType or a Dashboard Chart Source can run JavaScript for every user who opens it.** In Frappe that permission belongs to System Managers and developers. Keep it that way. Petal adds no restriction Desk doesn't have, and none that Desk users would rely on.

This is why Petal's CSP includes `'unsafe-eval'`. It's needed for this metadata and nothing else. The print preview, which renders user-authored print formats, runs with `script-src 'none'`.

### 3. HTML from Frappe is sanitized

Messages (`frappe.msgprint`), form intros and headlines can contain HTML from the server. Petal renders it through DOMPurify with these rules:

- no scripts, event handlers, `<style>`, forms or MathML;
- links and images only with `http(s)`, `mailto`, `tel`, relative or fragment URLs, plus raster `data:` images;
- `target="_blank"` links get `rel="noopener noreferrer"`.

## Deploying safely

### The backend stays private

The browser only ever talks to Petal. Requests to Frappe go through Petal's `/api/v1` proxy, and the Frappe address (`FRAPPE_BACKEND_URL`) stays on the server. It isn't sent to the browser or built into client bundles. Frappe doesn't need to be reachable from the internet; keep it on a private network.

### Reverse proxies: `PETAL_TRUST_PROXY`

`X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto` can be set by anyone. Petal ignores them unless you tell it a reverse proxy in front of it sets them:

| `PETAL_TRUST_PROXY` | Meaning |
|---|---|
| unset / `0` (default) | Petal is reached directly. Forwarded headers are ignored and none are passed to Frappe. Tenants are picked by `Host`. Frappe sees Petal's own address as the client. |
| `1` (or `true`) | One reverse proxy (nginx, Caddy, a load balancer) sits in front. The client address is the last `X-Forwarded-For` entry, and `X-Forwarded-Host` picks the tenant. |
| `N` | `N` proxies in a chain. The client address is the `N`th `X-Forwarded-For` entry from the right. |

In production, run Petal behind a reverse proxy that **overwrites or appends to** `X-Forwarded-For`, set `PETAL_TRUST_PROXY=1`, and make sure Petal's port can't be reached except through that proxy. Frappe then rate-limits logins and logs requests by the real client address.

### Limits on the API proxy

| Variable | Default | Effect |
|---|---|---|
| `PETAL_MAX_BODY_MB` | `50` | Larger request bodies (uploads) get `413` before reaching Frappe. Keep it at or above Frappe's `max_file_size`. |
| `PETAL_UPSTREAM_TIMEOUT_MS` | `120000` | How long to wait for Frappe's response headers before answering `504`. Downloads already under way aren't cut off. |

The proxy streams request and response bodies, and cancels the request to Frappe when the browser disconnects.

### Response headers

Pages are served with a nonce-based CSP, `X-Frame-Options: DENY` (the print preview is frameable only by Petal itself), `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. Responses from the API proxy carry `nosniff`.
