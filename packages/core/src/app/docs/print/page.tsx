"use client"

export default function PrintDocsPage() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; color: #000; }
          h1 { font-size: 20pt; }
          h2 { font-size: 14pt; page-break-after: avoid; }
          h3 { font-size: 11pt; page-break-after: avoid; }
          pre, code { font-size: 9pt; }
          pre { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
          .page-break { page-break-before: always; }
        }
        @page {
          margin: 2cm 2.5cm;
        }
      `}</style>

      {/* Download button — hidden when printing */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 3v13M5 14l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="19" width="18" height="2" rx="1" />
          </svg>
          Download PDF
        </button>
        <a
          href="/docs"
          className="flex items-center gap-2 px-5 py-3 bg-white border border-border text-sm font-semibold rounded-xl shadow-lg hover:bg-accent transition-colors"
        >
          ← Back to Docs
        </a>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-12 font-sans text-foreground leading-relaxed">

        {/* Cover */}
        <div className="mb-16 border-b border-border pb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl">
              P
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground leading-none">Petal</h1>
              <p className="text-lg text-muted-foreground font-medium">Modern Frontend for Frappe / ERPNext</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Version 1.0.0 · Technical Reference · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="mt-4 text-base text-foreground/80 max-w-xl">
            Petal is an extensible Next.js shell for Frappe / ERPNext. It provides a modern UI with plugin-style custom apps,
            built-in auth, theming, dynamic routing, and a direct Frappe API client — all wired through a simple hook-based configuration system.
          </p>
        </div>

        {/* Table of Contents */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-4 text-foreground border-b border-border pb-2">Table of Contents</h2>
          <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
            {[
              "Architecture Overview",
              "Repository Structure",
              "PetalConfig — App Registration",
              "PetalHooks API",
              "Hook Types Reference",
              "App Registry",
              "useFrappe() Client",
              "Icon Registry",
              "Auth System",
              "Theme System",
              "Routing",
              "CLI — petal create",
              "Building a Custom App",
              "Environment Variables",
            ].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>

        {/* 1. Architecture */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">1. Architecture Overview</h2>
          <p className="text-sm text-foreground/80 mb-4">
            Petal consists of three packages published in a pnpm monorepo:
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { pkg: "@petal/sdk", desc: "TypeScript type definitions only. No runtime code. Consumed by custom apps and core." },
              { pkg: "@petal/core", desc: "The Next.js host application. Renders the shell, loads apps, proxies Frappe API." },
              { pkg: "@petal/cli", desc: "CLI tool (petal create) that scaffolds new custom app packages." },
            ].map(({ pkg, desc }) => (
              <div key={pkg} className="border border-border rounded-lg p-4">
                <p className="font-mono text-xs font-bold text-primary mb-1">{pkg}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            At runtime, <code className="bg-muted px-1 rounded text-xs">@petal/core</code> boots by reading{" "}
            <code className="bg-muted px-1 rounded text-xs">petal.config.ts</code>, loading each registered app,
            collecting all hooks, and merging them into the global store (Zustand). Every page then reads from
            that store to render sidebar items, resolve custom routes, apply overrides, etc.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`petal.config.ts
  └─ AppRegistry.loadFromConfig()
       ├─ local app (_hooks)  →  hooks.on_boot()  →  registered
       └─ remote app (url)    →  dynamic import   →  registered
            ↓
       getMergedHooks()  →  Zustand store (usePetalStore)
            ↓
       Sidebar / Navbar / Routes / Form & List overrides`}</pre>
        </section>

        {/* 2. Repository Structure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">2. Repository Structure</h2>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`packages/
├── sdk/
│   └── src/
│       ├── index.ts              # Re-exports all types
│       └── types/
│           ├── hooks.ts          # PetalHooks, SidebarItem, RouteDefinition, AuthConfig …
│           ├── app.ts            # PetalConfig
│           └── frappe.ts         # FrappeDocument, FrappeUser, FrappeListOptions …
│
├── core/
│   ├── petal.config.ts           # Register your apps here
│   └── src/
│       ├── app/                  # Next.js App Router pages
│       │   ├── layout.tsx
│       │   ├── page.tsx          # Dashboard
│       │   ├── login/page.tsx
│       │   ├── desk/page.tsx
│       │   ├── workspace/[name]/page.tsx
│       │   ├── list/[doctype]/page.tsx
│       │   ├── form/[doctype]/[name]/page.tsx
│       │   ├── browse/page.tsx
│       │   ├── settings/page.tsx
│       │   ├── docs/page.tsx
│       │   ├── docs/print/page.tsx   ← this file
│       │   └── [...slug]/page.tsx    # Custom app routes
│       ├── apps/
│       │   └── frappe-workspace-provider/hooks.ts
│       ├── components/
│       │   ├── shell/Sidebar.tsx
│       │   ├── shell/Navbar.tsx
│       │   └── theme/ThemePickerModal.tsx
│       ├── hooks/useFrappe.ts
│       ├── lib/
│       │   ├── auth/auth-service.ts
│       │   ├── frappe/client.ts
│       │   ├── icons/icon-registry.ts
│       │   ├── registry/app-registry.ts
│       │   └── theme/theme-manager.ts
│       └── store/petal-store.ts
│
└── cli/
    └── src/commands/create.ts`}</pre>
        </section>

        {/* 3. PetalConfig */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">3. PetalConfig — App Registration</h2>
          <p className="text-sm text-foreground/80 mb-3">
            Edit <code className="bg-muted px-1 rounded text-xs">packages/core/petal.config.ts</code> to register apps.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`import type { PetalConfig } from "@petal/sdk"
import myAppHooks from "./src/apps/my-app/hooks"

const config: PetalConfig = {
  backend: process.env.NEXT_PUBLIC_FRAPPE_URL ?? "http://localhost:8000",

  apps: [
    // --- Local app (imported directly) ---
    {
      name: "my-app",
      version: "1.0.0",
      url: "my-app",     // not used when _hooks is present
      _hooks: myAppHooks,
    },

    // --- Remote app (loaded at runtime via dynamic import) ---
    {
      name: "remote-app",
      version: "1.0.0",
      url: "https://cdn.example.com/remote-app/petal.hooks.js",
    },
  ],

  theme: {
    primaryColor: "#16a34a",
  },
}

export default config`}</pre>
          <div className="mt-4 space-y-2">
            {[
              ["backend", "Frappe base URL. Used server-side; the proxy hides it from the browser."],
              ["apps[].name", "Unique app identifier. Used for logging and registry lookup."],
              ["apps[].url", "Remote ESM URL. Used when _hooks is absent. Must export default PetalHooks."],
              ["apps[]._hooks", "Direct hooks import for local apps. Skips the dynamic import step."],
              ["theme", "Optional global theme override applied before app-level themes."],
            ].map(([key, desc]) => (
              <div key={key as string} className="grid grid-cols-3 gap-3 text-xs">
                <code className="bg-muted px-2 py-1 rounded font-mono">{key}</code>
                <span className="col-span-2 text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PetalHooks API */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">4. PetalHooks API</h2>
          <p className="text-sm text-foreground/80 mb-4">
            Each app exports a default <code className="bg-muted px-1 rounded text-xs">PetalHooks</code> object. All fields are optional.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`import type { PetalHooks } from "@petal/sdk"

const hooks: PetalHooks = {
  // Navigation
  sidebar_items: [ /* SidebarItem[] */ ],
  navbar_items:  [ /* NavbarItem[]  */ ],

  // Custom pages (rendered at [...slug]/page.tsx)
  routes: [ /* RouteDefinition[] */ ],

  // Replace built-in Frappe list/form views per doctype
  form_overrides: {
    "Sales Order": () => import("./pages/SalesOrderForm"),
  },
  list_overrides: {
    "Sales Order": () => import("./pages/SalesOrderList"),
  },

  // System-level overrides
  overrides: {
    theme:       { primaryColor: "#7c3aed" },
    frappeClient: { beforeRequest, afterRequest },
    workspace:   { doctype: "Workspace", fields: ["name", "title", "icon"] },
    auth:        { /* AuthConfig */ },
    settings:    { myKey: "myValue" },
  },

  // Lifecycle hooks
  on_boot:    async () => { /* runs once when the app is loaded */ },
  before_load: async () => {},
  after_load:  async () => {},
  on_app_error: async (error) => { console.error(error) },
}`}</pre>
        </section>

        {/* 5. Hook Types Reference */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">5. Hook Types Reference</h2>

          <h3 className="text-base font-bold mb-2 mt-6">SidebarItem</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface SidebarItem {
  label: string
  path:  string
  icon?: string | (() => ReactNode)
  // icon forms:
  //   "📊"               — emoji, rendered as-is
  //   "home"             — registry name, resolved via iconRegistry.resolve()
  //   () => <MyIcon />   — render function, called directly
  badge?:    () => ReactNode
  children?: SidebarItem[]   // nested items (collapsible)
}`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">RouteDefinition</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface RouteDefinition {
  path:      string    // e.g. "/my-app/dashboard"
  component: () => Promise<{ default: ComponentType }>
  layout?:   "default" | "blank" | "fullscreen"
  // "default"    — rendered inside the shell (sidebar + navbar)
  // "blank"      — rendered inside main, no extra wrapper
  // "fullscreen" — fixed full-screen overlay (z-50)
}`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">NavbarItem</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface NavbarItem {
  component: () => Promise<{ default: ComponentType }>
  position?: "left" | "right"   // defaults to "left"
}`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">AuthConfig</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface AuthConfig {
  before_login?:      (creds: LoginCredentials) => Promise<void | false>
  after_login?:       (user: FrappeUser)        => Promise<void>
  before_logout?:     ()                        => Promise<void | false>
  after_logout?:      ()                        => Promise<void>
  redirectAfterLogin?:  string   // default "/"
  redirectAfterLogout?: string   // default "/login"
  loginPage?:           string   // default "/login"
  loginComponent?: () => Promise<{ default: ComponentType }>
}
// Return false from before_login / before_logout to cancel the action.`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">PetalThemeOverride</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface PetalThemeOverride {
  primaryColor?:   string   // CSS color, e.g. "#16a34a"
  secondaryColor?: string
  borderRadius?:   string   // e.g. "0.5rem"
  fontFamily?:     string
  [key: string]:   unknown  // arbitrary CSS variable overrides
}`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">FrappeClientConfig</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`interface FrappeClientConfig {
  beforeRequest?: (options: RequestInit & { path: string })
    => Promise<RequestInit & { path: string }>
  afterRequest?:  (response: unknown) => Promise<unknown>
}
// Use beforeRequest to inject custom headers or modify the path.
// Use afterRequest to transform or log every response.`}</pre>
        </section>

        {/* 6. App Registry */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">6. App Registry</h2>
          <p className="text-sm text-foreground/80 mb-3">
            <code className="bg-muted px-1 rounded text-xs">appRegistry</code> (singleton in{" "}
            <code className="bg-muted px-1 rounded text-xs">src/lib/registry/app-registry.ts</code>) manages all loaded apps.
            It is consumed by <code className="bg-muted px-1 rounded text-xs">PetalProvider</code> on boot and the results are pushed into the Zustand store.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// Key methods:
appRegistry.loadFromConfig(config)  // boot — called once in PetalProvider
appRegistry.getMergedHooks()        // flatten all apps' hooks into one object
appRegistry.getMergedTheme()        // resolve final theme (config → overrides)
appRegistry.getMergedAuthConfig()   // resolve final auth config
appRegistry.getMergedFrappeClientConfig()
appRegistry.getMergedWorkspaceConfig()
appRegistry.getMergedSettings()`}</pre>
          <p className="text-sm text-foreground/80 mt-3">
            Merge order for arrays (sidebar_items, routes, navbar_items): <strong>apps are merged in declaration order</strong> in{" "}
            <code className="bg-muted px-1 rounded text-xs">petal.config.ts</code>.
            For objects (form_overrides, overrides), later apps win on key collision.
          </p>
        </section>

        {/* 7. useFrappe */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">7. useFrappe() Client</h2>
          <p className="text-sm text-foreground/80 mb-3">
            All Frappe API calls go through the Next.js proxy at{" "}
            <code className="bg-muted px-1 rounded text-xs">/api/frappe/[...path]</code>, which forwards to the Frappe backend.
            The raw <code className="bg-muted px-1 rounded text-xs">NEXT_PUBLIC_FRAPPE_URL</code> is never exposed to the browser.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`import { useFrappe } from "@/hooks/useFrappe"

// Inside any React component:
const frappe = useFrappe()

// --- Get a single document ---
const doc = await frappe.getDoc<MyType>("Sales Order", "SO-0001")

// --- Get a list ---
const rows = await frappe.getList({
  doctype: "Sales Order",
  fields: ["name", "customer", "grand_total", "status"],
  filters: [["status", "=", "Draft", null]],
  limit: 20,
  limit_start: 0,
  order_by: "creation desc",
})

// --- Call a whitelisted server method ---
const result = await frappe.callMethod<{ message: number }>(
  "frappe.client.get_count",
  { doctype: "User" }
)

// --- Save (insert or update) a document ---
const saved = await frappe.saveDoc({
  doctype: "Todo",
  description: "Remember to call client",
})

// --- Delete a document ---
await frappe.deleteDoc("Todo", "TODO-0001")

// --- Get the logged-in user ---
const user = await frappe.getLoggedInUser()
// returns FrappeUser { name, email, full_name, first_name, ... }`}</pre>
        </section>

        {/* 8. Icon Registry */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">8. Icon Registry</h2>
          <p className="text-sm text-foreground/80 mb-3">
            Named icons in <code className="bg-muted px-1 rounded text-xs">SidebarItem.icon</code> are resolved through the global
            singleton <code className="bg-muted px-1 rounded text-xs">iconRegistry</code>. Register custom icons in your app's
            <code className="bg-muted px-1 rounded text-xs"> on_boot</code> hook.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`import { iconRegistry } from "@/lib/icons/icon-registry"

// Register a single icon
iconRegistry.register("my-module", () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M12 2L2 7l10 5 10-5-10-5Z" />
  </svg>
))

// Register many at once
iconRegistry.registerAll({
  "home":     () => <HomeIcon />,
  "settings": () => <SettingsIcon />,
})

// Then use in sidebar_items:
sidebar_items: [
  { label: "Home", path: "/", icon: "home" },        // resolved via registry
  { label: "CRM",  path: "/crm", icon: "🤝" },       // emoji fallback
  { label: "Dash", path: "/d",  icon: () => <Chart /> }, // direct render fn
]`}</pre>
          <p className="text-sm text-foreground/80 mt-3">
            Resolution order in <code className="bg-muted px-1 rounded text-xs">Sidebar.tsx</code>:
            function icon → registry lookup → raw string (emoji).
          </p>
        </section>

        {/* 9. Auth */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">9. Auth System</h2>
          <p className="text-sm text-foreground/80 mb-3">
            Auth state is managed in the Zustand store. <code className="bg-muted px-1 rounded text-xs">PetalProvider</code>{" "}
            calls <code className="bg-muted px-1 rounded text-xs">frappe.getLoggedInUser()</code> on boot.
            If it throws, <code className="bg-muted px-1 rounded text-xs">authStatus</code> is set to{" "}
            <code className="bg-muted px-1 rounded text-xs">"unauthenticated"</code> and the user is redirected to
            <code className="bg-muted px-1 rounded text-xs"> /login</code>.
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// Auth state (usePetalStore)
authStatus: "loading" | "authenticated" | "unauthenticated"
user:       FrappeUser | null

// FrappeUser shape
interface FrappeUser {
  name:       string   // e.g. "administrator@example.com"
  email:      string
  full_name:  string
  first_name: string
}

// authService (src/lib/auth/auth-service.ts)
await authService.login({ email, password })
await authService.logout()
// Both methods respect before_login / before_logout hooks (return false = cancel).`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">Custom Login Page</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`overrides: {
  auth: {
    loginComponent: () => import("./pages/MyLogin"),
    redirectAfterLogin: "/dashboard",
    redirectAfterLogout: "/login",
  }
}`}</pre>
        </section>

        {/* 10. Theme */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">10. Theme System</h2>
          <p className="text-sm text-foreground/80 mb-3">
            Petal supports light/dark mode and named color themes. The current theme is stored in
            <code className="bg-muted px-1 rounded text-xs"> localStorage</code> and injected before first paint to prevent flicker.
            Users can change the theme from <strong>Navbar → user menu → Appearance</strong> or the Settings page.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            {[
              ["ThemeMode", '"light" | "dark"'],
              ["ThemeName", '"default" | "ocean" | "rose" | "violet" | …"'],
              ["primaryColor", "CSS hex or hsl value, sets --primary CSS variable"],
              ["borderRadius", "Sets --radius CSS variable for all rounded corners"],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-2">
                <code className="bg-muted px-2 py-1 rounded font-mono shrink-0">{k}</code>
                <span className="text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// Override theme from an app hook:
overrides: {
  theme: {
    primaryColor: "#7c3aed",   // violet
    borderRadius: "0.25rem",   // sharper corners
    fontFamily:   "Inter, system-ui",
  }
}`}</pre>
        </section>

        {/* 11. Routing */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">11. Routing</h2>
          <div className="space-y-2 text-sm mb-4">
            {[
              ["/", "Dashboard — stats, recent users, activity"],
              ["/login", "Login page (shell-free)"],
              ["/desk", "Simple desk view — logged-in user + user list"],
              ["/workspace/[name]", "Frappe Workspace page — renders blocks from Frappe"],
              ["/list/[doctype]", "Generic list view with search & pagination. Overridable."],
              ["/form/[doctype]/[name]", "Generic form view with field table + child tables. Overridable."],
              ["/browse", "Dynamic doctype browser, grouped by Frappe module"],
              ["/settings", "Petal settings — theme, connection info, loaded hooks"],
              ["/docs", "In-app documentation"],
              ["/docs/print", "This printable PDF reference (shell-free)"],
              ["/[...slug]", "Custom app routes registered via hooks.routes"],
            ].map(([path, desc]) => (
              <div key={path as string} className="grid grid-cols-5 gap-3 text-xs py-1.5 border-b border-border/50">
                <code className="col-span-2 font-mono text-primary">{path}</code>
                <span className="col-span-3 text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>

          <h3 className="text-base font-bold mb-2 mt-6">Registering a Custom Route</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// In your hooks.ts:
routes: [
  {
    path: "/my-app/orders",
    component: () => import("./pages/OrdersPage"),
    layout: "default",        // renders inside sidebar + navbar
  },
  {
    path: "/my-app/scanner",
    component: () => import("./pages/Scanner"),
    layout: "fullscreen",     // fixed full-screen, z-index 50
  },
]`}</pre>
        </section>

        {/* 12. CLI */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">12. CLI — petal create</h2>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`# Scaffold a new Petal custom app:
petal create [app-name]

# Prompts for:
#   App name    (default: my-petal-app)
#   Description (default: A Petal custom app)

# Generates:
my-app/
├── package.json        (peerDependencies: @petal/sdk, react)
├── tsconfig.json       (ESNext modules, JSX react-jsx)
├── .gitignore
├── petal.hooks.ts      ← entry point — export default hooks
└── src/
    ├── components/
    └── pages/
        └── Home.tsx`}</pre>
          <p className="text-sm text-foreground/80 mt-3">After scaffolding:</p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`cd my-app
pnpm install
pnpm dev          # tsc --watch

# Then register in petal.config.ts:
import myHooks from "./src/apps/my-app/petal.hooks"
apps: [{ name: "my-app", version: "1.0.0", url: "my-app", _hooks: myHooks }]`}</pre>
        </section>

        {/* 13. Building a Custom App */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">13. Building a Custom App</h2>
          <p className="text-sm text-foreground/80 mb-4">Full example with sidebar, a route, and a form override:</p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// src/apps/crm/hooks.ts
import type { PetalHooks } from "@petal/sdk"

const hooks: PetalHooks = {
  sidebar_items: [
    {
      label: "CRM",
      path: "/crm",
      icon: "🤝",
      children: [
        { label: "Leads",       path: "/crm/leads",    icon: "📋" },
        { label: "Customers",   path: "/crm/customers", icon: "👥" },
        { label: "Deals",       path: "/crm/deals",     icon: "💼" },
      ],
    },
  ],

  routes: [
    {
      path: "/crm/leads",
      component: () => import("./pages/Leads"),
    },
  ],

  form_overrides: {
    "Lead": () => import("./pages/LeadForm"),
  },

  overrides: {
    theme: { primaryColor: "#0ea5e9" },
    auth: {
      after_login: async (user) => {
        console.log("Welcome,", user.full_name)
      },
    },
  },

  on_boot: async () => {
    console.log("[CRM] booted")
  },
}

export default hooks`}</pre>

          <h3 className="text-base font-bold mb-2 mt-6">Using useFrappe in a custom page</h3>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`// src/apps/crm/pages/Leads.tsx
"use client"
import { useEffect, useState } from "react"
import { useFrappe } from "@/hooks/useFrappe"

export default function Leads() {
  const frappe = useFrappe()
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    frappe.getList({
      doctype: "Lead",
      fields: ["name", "lead_name", "email_id", "status"],
      limit: 50,
    }).then(setLeads)
  }, [frappe])

  return (
    <div>
      <h1>Leads</h1>
      {leads.map(l => <div key={l.name}>{l.lead_name}</div>)}
    </div>
  )
}`}</pre>
        </section>

        {/* 14. Environment Variables */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">14. Environment Variables</h2>
          <div className="space-y-2">
            {[
              ["NEXT_PUBLIC_FRAPPE_URL", "Required", "Frappe backend base URL. e.g. http://erp.example.com"],
              ["NEXT_PUBLIC_FRONTEND_URL", "Optional", "This frontend's URL (used in CORS hint on /docs). e.g. http://localhost:3000"],
            ].map(([key, req, desc]) => (
              <div key={key as string} className="text-xs border border-border rounded-lg p-3 grid grid-cols-5 gap-3 items-start">
                <code className="col-span-2 font-mono text-primary break-all">{key}</code>
                <span className={`font-semibold ${req === "Required" ? "text-red-600" : "text-muted-foreground"}`}>{req}</span>
                <span className="col-span-2 text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto mt-4">{`# packages/core/.env.local
NEXT_PUBLIC_FRAPPE_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000`}</pre>
          <p className="text-sm text-muted-foreground mt-3">
            Frappe CORS must allow the frontend origin with credentials:
          </p>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">{`# In your Frappe site config (site_config.json):
{
  "allow_cors": "http://localhost:3000",
  "cors_allow_credentials": true
}`}</pre>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Petal v1.0.0 — Technical Reference</p>
          <p>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </footer>
      </div>
    </>
  )
}
