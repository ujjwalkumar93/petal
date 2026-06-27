"use client"

import { usePetalStore } from "@/store/petal-store"
import { ThemePickerModal } from "@/components/theme/ThemePickerModal"
import { useState } from "react"

export default function SettingsPage() {
  const { hooks, appTheme, themeMode, themeName } = usePetalStore()
  const [showThemePicker, setShowThemePicker] = useState(false)

  const sidebarCount = hooks.sidebar_items?.length ?? 0
  const routeCount = hooks.routes?.length ?? 0
  const navbarCount = hooks.navbar_items?.length ?? 0
  const formOverrideCount = Object.keys(hooks.form_overrides ?? {}).length
  const listOverrideCount = Object.keys(hooks.list_overrides ?? {}).length

  return (
    <div className="space-y-6 max-w-2xl">
      <section>
        <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your Petal instance</p>
      </section>

      {/* Connection */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connection</h2>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Backend URL</label>
          <p className="mt-1 text-sm font-mono bg-muted px-3 py-2 rounded-md">
            {process.env.NEXT_PUBLIC_FRAPPE_BACKEND_URL || "http://localhost:8000"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Frontend URL</label>
          <p className="mt-1 text-sm font-mono bg-muted px-3 py-2 rounded-md">
            {process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground capitalize">
              {themeName} · {themeMode} mode · primary {appTheme.primaryColor}
            </p>
          </div>
          <button
            onClick={() => setShowThemePicker(true)}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
          >
            Change Theme
          </button>
        </div>
        {showThemePicker && <ThemePickerModal onClose={() => setShowThemePicker(false)} />}
      </div>

      {/* Loaded hooks */}
      <div className="bg-white border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Loaded Hooks</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Sidebar Items", value: sidebarCount },
            { label: "Custom Routes", value: routeCount },
            { label: "Navbar Items", value: navbarCount },
            { label: "Form Overrides", value: formOverrideCount },
            { label: "List Overrides", value: listOverrideCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-md">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {routeCount > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Registered Routes</p>
            <ul className="space-y-1">
              {hooks.routes?.map((r) => (
                <li key={r.path} className="text-xs font-mono text-foreground/70 bg-muted/30 px-3 py-1.5 rounded">
                  {r.path}
                </li>
              ))}
            </ul>
          </div>
        )}

        {formOverrideCount > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Form Overrides</p>
            <ul className="space-y-1">
              {Object.keys(hooks.form_overrides ?? {}).map((k) => (
                <li key={k} className="text-xs font-mono text-foreground/70 bg-muted/30 px-3 py-1.5 rounded">{k}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
