import type { Metadata } from "next"
import { PetalProvider } from "./petal-provider"
import { ReactGlobals } from "./react-globals"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { THEME_SCRIPT } from "@/lib/theme/theme-manager"
import "./globals.css"

// Import map: resolves bare 'react' and 'react/jsx-runtime' specifiers in
// cross-origin custom app chunks to the Petal shims served from /esm/.
// The shims re-export from window.__petal_react (set by <ReactGlobals />),
// so all custom app hooks share the same React instance as the host.
const IMPORT_MAP = JSON.stringify({
  imports: {
    "react": "/esm/react.js",
    "react/jsx-runtime": "/esm/react-jsx-runtime.js",
    "react-dom": "/esm/react-dom.js",
  },
})

export const metadata: Metadata = {
  title: "Petal",
  description: "Modern frontend for Frappe",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must come before any module script — resolves bare React specifiers in custom app chunks */}
        <script type="importmap" dangerouslySetInnerHTML={{ __html: IMPORT_MAP }} />
        {/* Injected before paint to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
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
