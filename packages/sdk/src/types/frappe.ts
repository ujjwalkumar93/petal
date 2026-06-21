export interface FrappeUser {
  name: string
  email: string
  full_name: string
  first_name: string
  username: string
  user_image?: string
  user_type: string
  roles: string[]
  time_zone?: string
  desk_theme?: string
}

export interface FrappeDocument {
  name: string
  doctype: string
  owner: string
  creation: string
  modified: string
  docstatus: 0 | 1 | 2
  [key: string]: unknown
}

export interface FrappeListParams {
  doctype: string
  fields?: string[]
  filters?: Array<[string, string, string, unknown]>
  or_filters?: Array<[string, string, string, unknown]>
  order_by?: string
  limit?: number
  limit_start?: number
}
