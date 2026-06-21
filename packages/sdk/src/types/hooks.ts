import type { ComponentType, ReactNode } from "react"
import type { FrappeUser } from "./frappe"

export interface SidebarItem {
  label: string
  path: string
  /**
   * Icon for this sidebar item. Three forms are accepted:
   *
   * 1. **Registry name** (string) — resolved via `iconRegistry.resolve(name)`.
   *    Built-in names: "home", "accounting", "buying", "selling", "stock",
   *    "assets", "hr", "payroll", "crm", "project", "support", "quality",
   *    "website", "users", "settings", "integration", "file", "tool", "dashboard".
   *    Custom apps can register their own: `iconRegistry.register("my-icon", () => <svg…/>)`.
   *
   * 2. **Inline SVG string** — a raw `<svg …>…</svg>` string rendered via dangerouslySetInnerHTML.
   *
   * 3. **Render function** — `() => ReactNode`. Called directly; return any JSX.
   */
  icon?: string | (() => ReactNode)
  badge?: () => ReactNode
  children?: SidebarItem[]
  /** When true the item is excluded from the rendered sidebar. */
  hidden?: boolean
}

export interface NavbarItem {
  component: () => Promise<{ default: ComponentType }>
  position?: "left" | "right"
}

export interface RouteDefinition {
  path: string
  component: () => Promise<{ default: ComponentType }>
  layout?: "default" | "blank" | "fullscreen"
}

export interface PetalThemeOverride {
  primaryColor?: string
  secondaryColor?: string
  borderRadius?: string
  fontFamily?: string
  [key: string]: unknown
}

export interface FrappeClientConfig {
  beforeRequest?: (options: RequestInit & { path: string }) => Promise<RequestInit & { path: string }>
  afterRequest?: (response: unknown) => Promise<unknown>
}

export interface WorkspaceConfig {
  doctype?: string
  fields?: string[]
  filters?: Array<[string, string, string, unknown]>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthConfig {
  /** Run before login attempt. Return false to cancel login. */
  before_login?: (credentials: LoginCredentials) => Promise<void | false>
  /** Run after successful login with the resolved user. */
  after_login?: (user: FrappeUser) => Promise<void>
  /** Run before logout. Return false to cancel logout. */
  before_logout?: () => Promise<void | false>
  /** Run after successful logout. */
  after_logout?: () => Promise<void>
  /** Redirect path after login. Default: "/" */
  redirectAfterLogin?: string
  /** Redirect path after logout. Default: "/login" */
  redirectAfterLogout?: string
  /** Override the login page path. Default: "/login" */
  loginPage?: string
  /** Fully replace the login UI with a custom component. */
  loginComponent?: () => Promise<{ default: ComponentType }>
}

export interface PetalHooksOverrides {
  theme?: PetalThemeOverride
  frappeClient?: FrappeClientConfig
  workspace?: WorkspaceConfig
  auth?: AuthConfig
  settings?: Record<string, unknown>
}

export interface FieldBehavior {
  read_only?: boolean
  hidden?: boolean
  /** Inline CSS applied to the field label element. */
  label_style?: Record<string, string>
  /** Inline CSS applied to the primary input element. */
  input_style?: Record<string, string>
}

/**
 * A slot is a lazy-loaded component injected into a specific position in a built-in form.
 * Unlike form_overrides (which fully replaces the form), slots augment without rewriting.
 *
 * @example
 * form_slots: {
 *   "Sales Invoice": {
 *     after: () => import("./components/InvoiceTotalsPanel"),
 *     toolbar: () => import("./components/InvoiceApproveButton"),
 *   }
 * }
 */
export interface FormSlotComponents {
  /** Rendered above the form fields. */
  before?: () => Promise<{ default: ComponentType<{ docname: string }> }>
  /** Rendered below the form fields. */
  after?: () => Promise<{ default: ComponentType<{ docname: string }> }>
  /** Rendered in the form's action toolbar, next to Save/Discard. */
  toolbar?: () => Promise<{ default: ComponentType<{ docname: string }> }>
}

export interface PetalHooks {
  sidebar_items?: SidebarItem[]
  /**
   * Override any property (icon, label, hidden, badge) for a sidebar item matched by label or path.
   * Applies after all apps' items are merged, including items fetched from Frappe.
   *
   * Key: label (e.g. "My Institution") OR exact path (e.g. "/workspace/My%20Institution").
   * Label match takes priority over path match.
   *
   * @example
   * sidebar_item_overrides: {
   *   "My Institution": { icon: INSTITUTION_ICON },
   *   "Buying": { hidden: true },
   * }
   */
  sidebar_item_overrides?: Record<string, Partial<Omit<SidebarItem, "path" | "children">>>
  /**
   * Control the display order of top-level sidebar items.
   * Each entry is a label or path. Items not listed appear after the ordered ones
   * in their original relative order.
   * Entries from multiple apps are merged (de-duplicated, first occurrence wins).
   *
   * @example
   * sidebar_order: ["My Institution", "Master Data", "Accounting"]
   */
  sidebar_order?: string[]
  navbar_items?: NavbarItem[]
  routes?: RouteDefinition[]
  form_overrides?: Record<string, () => Promise<{ default: ComponentType<{ docname: string }> }>>
  /**
   * Inject components into named positions inside a built-in form without replacing it entirely.
   * Multiple apps can contribute slots for the same doctype — they are rendered in registration order.
   * Key: doctype name. Value: slot positions and their lazy-loaded components.
   */
  form_slots?: Record<string, FormSlotComponents>
  /**
   * Dynamic field-level behavior per doctype. Pure JS — no React import needed.
   * Called on every value change with the current document values.
   * Returns a map of fieldname → behavior overrides.
   *
   * @example
   * form_field_behaviors: {
   *   "Announcement": (doc) => {
   *     if (doc.for_all === 1) return { roles: { read_only: true } }
   *     return {}
   *   }
   * }
   */
  form_field_behaviors?: Record<string, (doc: Record<string, unknown>) => Record<string, FieldBehavior>>
  list_overrides?: Record<string, () => Promise<{ default: ComponentType<{ filters?: Record<string, unknown> }> }>>
  overrides?: PetalHooksOverrides
  /**
   * Runs once immediately after the app module loads, before authentication.
   * Use for synchronous setup that doesn't need a session: registering icons,
   * theme overrides, route definitions.
   */
  on_init?: () => void | Promise<void>
  /**
   * Runs once after the user is authenticated.
   * Use for anything that requires a valid session: fetching user data,
   * loading workspace sidebar items, setting up user-specific state.
   */
  on_boot?: () => void | Promise<void>
  on_app_error?: (error: Error) => Promise<void>
}
