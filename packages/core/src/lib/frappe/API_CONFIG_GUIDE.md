# Frappe API Configuration System

The centralized API configuration system makes it easy to manage Frappe API endpoints, support multiple versions, and maintain scalability.

## File Structure

```
src/lib/frappe/
├── api-config.ts      ← Centralized API endpoints
└── client.ts          ← FrappeClient using api-config
```

## Key Benefits

✅ **Single Source of Truth** - All API endpoints in one file
✅ **Version Management** - Easy to support multiple Frappe versions
✅ **Maintainability** - Change endpoint once, updates everywhere
✅ **Consistency** - Everyone uses the same endpoints
✅ **Type Safety** - Full TypeScript support

## File: `api-config.ts`

### Structure

```typescript
export const FRAPPE_API_VERSIONS = {
  V14: "14.0.0",
  V15: "15.0.0",
  V16: "16.0.0",
} as const

export const FRAPPE_API_ENDPOINTS = {
  // Grouped by function
  AUTH: { ... },
  WORKSPACE: { ... },
  RESOURCE: { ... },
  METHOD: { ... },
  FILE: { ... },
  // ... more
} as const
```

### Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `AUTH` | Authentication | `GET_LOGGED_IN_USER`, `LOGOUT` |
| `WORKSPACE` | Navigation | `GET_SIDEBAR_ITEMS` |
| `RESOURCE` | CRUD operations | `/api/resource/{doctype}` |
| `METHOD` | Server methods | `get_count`, `get_value` |
| `REPORT` | Reports & queries | `query_report.run` |
| `FILE` | File operations | `upload_file`, `download` |
| `USER` | User data | Lists, roles, permissions |
| `DOCTYPE` | Type information | Lists, metadata |
| `SEARCH` | Search operations | Global search, doctypes |

## Usage Examples

### Example 1: Using in FrappeClient

```typescript
import { FrappeAPI } from "@/lib/frappe/api-config"

class FrappeClient {
  async getLoggedInUser(): Promise<FrappeUser> {
    // Use centralized endpoint
    return this.request<FrappeUser>(
      FrappeAPI.ENDPOINTS.AUTH.GET_LOGGED_IN_USER
    )
  }

  async callMethod<T>(method: string, args?: Record<string, unknown>): Promise<T> {
    const path = `${FrappeAPI.ENDPOINTS.METHOD.BASE}/${method}`
    return this.request<T>(path, { method: "POST", body: JSON.stringify(args) })
  }
}
```

### Example 2: Using in Custom Code

```typescript
import { FrappeAPI } from "@/lib/frappe/api-config"

async function getUsers() {
  const url = FrappeAPI.buildUrl(
    "http://localhost:8000",
    FrappeAPI.ENDPOINTS.USER.GET_LIST
  )

  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })

  return response.json()
}
```

### Example 3: Building Dynamic URLs

```typescript
import { FrappeAPI } from "@/lib/frappe/api-config"

const baseUrl = "http://localhost:8000"

// Build resource URL with parameters
const userListUrl = FrappeAPI.buildResourceUrl(baseUrl, "User", undefined, {
  fields: JSON.stringify(["name", "email"]),
  filters: JSON.stringify([["enabled", "=", 1]]),
})

// Build method URL
const methodUrl = FrappeAPI.buildMethodUrl(baseUrl, "frappe.client.get_count", {
  doctype: "User",
})
```

## Supporting Multiple Frappe Versions

### Adding a New Version

1. Add version to `FRAPPE_API_VERSIONS`:

```typescript
export const FRAPPE_API_VERSIONS = {
  V14: "14.0.0",
  V15: "15.0.0",
  V16: "16.0.0",
  V17: "17.0.0",  // ← New version
} as const
```

2. If endpoints differ, add version-specific config:

```typescript
export const VERSION_SPECIFIC_ENDPOINTS: Record<FrappeVersion, typeof FRAPPE_API_ENDPOINTS> = {
  [FRAPPE_API_VERSIONS.V14]: FRAPPE_API_ENDPOINTS,
  [FRAPPE_API_VERSIONS.V15]: FRAPPE_API_ENDPOINTS,
  [FRAPPE_API_VERSIONS.V16]: {
    ...FRAPPE_API_ENDPOINTS,
    // Override any V16-specific endpoints
    AUTH: {
      ...FRAPPE_API_ENDPOINTS.AUTH,
      // V16 specific auth endpoint if different
    }
  },
  [FRAPPE_API_VERSIONS.V17]: FRAPPE_API_ENDPOINTS_V17,  // Completely new endpoints
}
```

3. Use version-specific endpoints:

```typescript
const endpoints = FrappeAPI.getEndpointsForVersion("16.0.0")
const url = endpoints.WORKSPACE.GET_SIDEBAR_ITEMS
```

## Maintaining Endpoints

### When to update `api-config.ts`

✅ **DO update** when:
- Frappe releases a new version with changed endpoints
- You add support for a new API feature
- An endpoint URL changes
- You want to add a new API category

❌ **DON'T change** when:
- You're just using endpoints in code (import instead)
- You're creating custom methods (add to `METHOD` category)
- You're filtering/querying data (use parameters, not endpoint changes)

### Best Practices

1. **Keep it grouped** - Organize by functional category
2. **Use clear names** - `GET_LOGGED_IN_USER` not `GLU`
3. **Add comments** - Document why an endpoint exists
4. **Never hardcode URLs** - Always use api-config
5. **Update in one place** - All code references will update automatically

## Migration Path

If you need to migrate old hardcoded endpoints to use api-config:

```typescript
// ❌ OLD - Hardcoded
const response = await fetch(
  `${backendUrl}/api/method/frappe.auth.get_logged_user`,
  { credentials: "include" }
)

// ✅ NEW - Using api-config
import { FrappeAPI } from "@/lib/frappe/api-config"

const endpoint = FrappeAPI.ENDPOINTS.AUTH.GET_LOGGED_IN_USER
const url = FrappeAPI.buildUrl(backendUrl, endpoint)
const response = await fetch(url, { credentials: "include" })
```

## Adding New Endpoints

When you find a new Frappe API endpoint you need:

1. Identify the endpoint and what it does
2. Add to the appropriate category in `FRAPPE_API_ENDPOINTS`
3. Use it in your code via `FrappeAPI.ENDPOINTS`

Example:

```typescript
// 1. Add to api-config.ts
CUSTOM_REPORTS: {
  GET_REPORT_DATA: "/api/method/frappe.desk.report.get_report_data",
  EXPORT_REPORT: "/api/method/frappe.desk.report.export",
}

// 2. Use in your code
import { FrappeAPI } from "@/lib/frappe/api-config"

const reportUrl = FrappeAPI.buildUrl(
  baseUrl,
  FrappeAPI.ENDPOINTS.CUSTOM_REPORTS.GET_REPORT_DATA
)
```

## Testing Configuration

When testing API endpoints:

```typescript
import { FrappeAPI } from "@/lib/frappe/api-config"

describe("Frappe API Configuration", () => {
  it("should have valid endpoint URLs", () => {
    const endpoint = FrappeAPI.ENDPOINTS.AUTH.GET_LOGGED_IN_USER
    expect(endpoint).toBe("/api/method/frappe.auth.get_logged_user")
  })

  it("should build URLs correctly", () => {
    const url = FrappeAPI.buildUrl("http://localhost:8000", "/api/resource/User")
    expect(url).toBe("http://localhost:8000/api/resource/User")
  })
})
```

## Summary

The centralized API configuration system ensures:

- 🎯 **Easy maintenance** - Change once, update everywhere
- 🔄 **Version compatibility** - Support multiple Frappe versions
- 📚 **Documentation** - Clear, organized endpoint reference
- 🛡️ **Type safety** - TypeScript prevents typos
- 📊 **Scalability** - Grows with your app without breaking code
