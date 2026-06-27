# Environment Configuration

Copy `.env.example` to `.env.local` and fill in your values.

```bash
cp .env.example .env.local
```

## Variables

### Required

**`FRAPPE_BACKEND_URL`**
URL of your Frappe instance as seen from the Next.js server. Used by the proxy — never sent to the browser.

```env
# local dev
FRAPPE_BACKEND_URL=http://localhost:8000

# Docker (internal network address)
FRAPPE_BACKEND_URL=http://frappe:8000
```

### Optional

**`NEXT_PUBLIC_FRONTEND_URL`**
Public URL of this Petal frontend. Used for CORS hints in the `/docs` page.

```env
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**`NEXT_PUBLIC_APP_NAME`** / **`NEXT_PUBLIC_APP_VERSION`**
Display name and version shown in the UI.

## CORS in Frappe

Add this to `sites/<site>/site_config.json`:

```json
{
  "allow_cors": "http://localhost:3000",
  "cors_allow_credentials": true
}
```

Then `bench restart`.

## Troubleshooting

**"Cannot reach Frappe backend"** — check `FRAPPE_BACKEND_URL` and that Frappe is running.

**"CORS error"** — verify `allow_cors` in `site_config.json` matches `NEXT_PUBLIC_FRONTEND_URL`.

**Variables not updating** — clear `.next/` and restart the dev server.
