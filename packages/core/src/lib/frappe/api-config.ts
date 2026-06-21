export const FRAPPE_API_VERSIONS = {
  V14: "14.0.0",
  V15: "15.0.0",
  V16: "16.0.0",
} as const

export type FrappeVersion = typeof FRAPPE_API_VERSIONS[keyof typeof FRAPPE_API_VERSIONS]

export const FRAPPE_API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    USERINFO: "/auth/userinfo",
    LOGOUT: "/auth/logout",
    GET_LOGGED_IN_USER: "/auth/me",
  },

  WORKSPACE: {
    GET_SIDEBAR_ITEMS: "/workspace/sidebar",
    GET_WORKSPACE:     "/doc/Workspace",
    GET_PAGE:          "/workspace/page",
  },

  RESOURCE: {
    BASE: "/doc",
  },

  METHOD: {
    BASE: "/records",
    GET_COUNT: "/records/count",
    GET_VALUE: "/records/value",
    GET_LIST:  "/records/list",
  },

  REPORT: {
    BASE:         "/reports/run",
    QUERY_REPORT: "/reports/run",
  },

  FILE: {
    UPLOAD: "/upload",
    GET:    "/files",
  },

  USER: {
    GET_LIST:        "/doc/User",
    GET_ROLES:       "/doc/Role",
    GET_PERMISSIONS: "/doc/Permission",
  },

  DOCTYPE: {
    GET_LIST: "/doc/DocType",
    GET_META: "/records/meta",
  },

  SEARCH: {
    GLOBAL:   "/search/link",
    DOCTYPES: "/records/list",
  },
} as const

export function buildFrappeUrl(baseUrl: string, endpoint: string): string {
  return `${baseUrl.replace(/\/$/, "")}${endpoint}`
}

export function buildResourceUrl(
  baseUrl: string,
  doctype: string,
  name?: string,
  params?: Record<string, string>
): string {
  const base = buildFrappeUrl(baseUrl, `${FRAPPE_API_ENDPOINTS.RESOURCE.BASE}/${doctype}`)
  const url = name ? `${base}/${name}` : base

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString()
    return `${url}?${query}`
  }

  return url
}

export function buildMethodUrl(baseUrl: string, method: string, params?: Record<string, string>): string {
  const url = buildFrappeUrl(baseUrl, `${FRAPPE_API_ENDPOINTS.METHOD.BASE}/${method}`)

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString()
    return `${url}?${query}`
  }

  return url
}

export const VERSION_SPECIFIC_ENDPOINTS: Record<FrappeVersion, typeof FRAPPE_API_ENDPOINTS> = {
  [FRAPPE_API_VERSIONS.V14]: FRAPPE_API_ENDPOINTS,
  [FRAPPE_API_VERSIONS.V15]: FRAPPE_API_ENDPOINTS,
  [FRAPPE_API_VERSIONS.V16]: FRAPPE_API_ENDPOINTS,
}

export function getEndpointsForVersion(version: FrappeVersion) {
  return VERSION_SPECIFIC_ENDPOINTS[version] || FRAPPE_API_ENDPOINTS
}

export const FrappeAPI = {
  VERSIONS: FRAPPE_API_VERSIONS,
  ENDPOINTS: FRAPPE_API_ENDPOINTS,
  buildUrl: buildFrappeUrl,
  buildResourceUrl,
  buildMethodUrl,
  getEndpointsForVersion,
} as const

export default FrappeAPI
