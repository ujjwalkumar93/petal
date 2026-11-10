import { FrappeAPI } from "@/lib/frappe/api-config"

/**
 * Neutral path for a DocType's records or one document: /doc/<doctype>[/<name>].
 * Both parts are encoded, so names with "#", "?", "%" or "/" (common in invoice
 * series such as "INV/2024-25/001") address the right document. Always build
 * resource paths with this.
 */
export function resourcePath(doctype: string, name?: string): string {
  const base = `${FrappeAPI.ENDPOINTS.RESOURCE.BASE}/${encodeURIComponent(doctype)}`
  return name === undefined ? base : `${base}/${encodeURIComponent(name)}`
}
