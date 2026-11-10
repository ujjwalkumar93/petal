import type { Metadata } from "next"
import { headers } from "next/headers"
import { PetalProvider } from "./petal-provider"
import { ReactGlobals } from "./react-globals"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { THEME_SCRIPT } from "@/lib/theme/theme-manager"
import { getRequestConfig } from "@/lib/config/runtime-config"
import { appImportMap } from "@/lib/registry/app-compat"
import { USE_DEV_URLS } from "@/lib/registry/dev-urls"
import "frappe-charts/dist/frappe-charts.min.css"
import "frappe-datatable/dist/frappe-datatable.min.css"
import "./globals.css"


export const metadata: Metadata = {
  title: "Petal",
  description: "Modern frontend for Frappe",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by proxy.ts on every request — required for these inline scripts
  // to pass the Content-Security-Policy script-src directive.
  const requestHeaders = await headers()
  const nonce = requestHeaders.get("x-nonce") ?? undefined
  // Import map: resolves bare 'react' / 'react/jsx-runtime' specifiers in
  // cross-origin app chunks to the Petal shims served from /esm/ (they
  // re-export window.__petal_react, set by <ReactGlobals />, so apps share the
  // host's React), and pins app bundles to their `integrity` hashes.
  const importMap = JSON.stringify(appImportMap(getRequestConfig(requestHeaders)?.apps ?? [], USE_DEV_URLS))

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must come before any module script — resolves bare React specifiers in custom app chunks */}
        <script type="importmap" nonce={nonce} dangerouslySetInnerHTML={{ __html: importMap }} />
        {/* Injected before paint to prevent theme flash */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* Exposes window.__petal_react before any custom app chunk is imported */}
        <ReactGlobals />
        <ThemeProvider>
          <PetalProvider>{children}</PetalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
