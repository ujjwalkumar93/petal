# Environment Configuration Guide

This document explains all environment variables used in the Petal project.

## Getting Started

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update values in `.env.local` according to your setup

3. **Never commit `.env.local` to git** - it contains sensitive data

## Environment Variables

### Backend Configuration

- **`NEXT_PUBLIC_FRAPPE_URL`** (Required)
  - URL of your Frappe/ERPNext backend
  - Default: `http://localhost:8000`
  - Example: `http://localhost:8000` (local) or `https://erp.example.com` (production)

- **`NEXT_PUBLIC_FRAPPE_SITE`** (Optional)
  - Frappe site name (for multi-site setups)
  - Default: `clickoneerp.com`

### Frontend Configuration

- **`NEXT_PUBLIC_FRONTEND_URL`** (Required)
  - URL of this Petal frontend
  - Default: `http://localhost:3000`
  - Example: `http://localhost:3000` (local) or `https://app.example.com` (production)

- **`NEXT_PUBLIC_APP_NAME`** (Optional)
  - Display name of your application
  - Default: `Petal Enterprise`

- **`NEXT_PUBLIC_APP_VERSION`** (Optional)
  - Current version of the application
  - Default: `1.0.0`

### API Configuration

- **`NEXT_PUBLIC_API_TIMEOUT`** (Optional)
  - API request timeout in milliseconds
  - Default: `30000` (30 seconds)

- **`NEXT_PUBLIC_ENABLE_CORS`** (Optional)
  - Enable CORS requests
  - Default: `true`

### Authentication

- **`NEXT_PUBLIC_SESSION_TIMEOUT`** (Optional)
  - Session timeout in seconds
  - Default: `3600` (1 hour)

### Feature Flags

- **`NEXT_PUBLIC_ENABLE_DEBUGGING`** (Optional)
  - Enable debug logging and console messages
  - Default: `true` (development), `false` (production)

- **`NEXT_PUBLIC_ENABLE_ANALYTICS`** (Optional)
  - Enable analytics tracking
  - Default: `false`

## CORS Configuration in Frappe

Make sure your Frappe backend allows CORS from the Petal frontend:

### Update `common_site_config.json`:

```json
{
  "allow_cors": "http://localhost:3000",
  "cors_allow_credentials": true
}
```

Then restart Frappe:
```bash
bench restart
```

## Example Configurations

### Local Development
```env
NEXT_PUBLIC_FRAPPE_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_FRAPPE_SITE=clickoneerp.com
NEXT_PUBLIC_ENABLE_DEBUGGING=true
```

### Production
```env
NEXT_PUBLIC_FRAPPE_URL=https://erp.example.com
NEXT_PUBLIC_FRONTEND_URL=https://app.example.com
NEXT_PUBLIC_FRAPPE_SITE=example.com
NEXT_PUBLIC_ENABLE_DEBUGGING=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Security Notes

- ⚠️ **Never commit `.env.local` to git**
- Use `.env.example` as a template
- All keys starting with `NEXT_PUBLIC_` are exposed to the browser (so don't put secrets there)
- For sensitive data that shouldn't be exposed, create server-side environment variables without the `NEXT_PUBLIC_` prefix
- In production, use your hosting platform's secure environment variable management (e.g., AWS Secrets Manager, GitHub Secrets)

## Troubleshooting

### "Cannot reach Frappe backend"
- Verify `NEXT_PUBLIC_FRAPPE_URL` is correct
- Check if Frappe is running
- Verify CORS is enabled in `common_site_config.json`

### "CORS error"
- Update `allow_cors` in Frappe's `common_site_config.json`
- Set it to your frontend URL: `"allow_cors": "http://localhost:3000"`
- Restart Frappe: `bench restart`

### Variables not updating
- Clear Next.js cache: `rm -rf .next`
- Restart dev server: `npm run dev`
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
