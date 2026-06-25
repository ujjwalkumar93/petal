"use client"

import { useEffect } from "react"
import { cn } from "../lib/utils"
import { Kbd } from "./kbd"

// ---------------------------------------------------------------------------
// Types (self-contained — no dependency on @petal/core's theme-manager)
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system"

export interface ThemeDefinition {
  /** Unique machine name */
  name: string
  /** Human-readable label */
  label: string
  /** Preview swatch colors [primary, background] */
  preview: [string, string]
}

export interface AppearanceModalProps {
  themes: ThemeDefinition[]
  themeMode: ThemeMode
  /** Active theme name. Must match one of the `themes[].name` values. */
  themeName: string
  onModeChange: (mode: ThemeMode) => void
  onThemeChange: (name: string) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark:  "Dark",
  system: "System",
}

const MODE_ICONS: Record<ThemeMode, string> = {
  light:  "☀️",
  dark:   "🌙",
  system: "💻",
}

const MODE_SHORTCUTS: Record<ThemeMode, string> = {
  light:  "L",
  dark:   "D",
  system: "S",
}

const KEY_TO_MODE: Record<string, ThemeMode> = { l: "light", d: "dark", s: "system" }

// ---------------------------------------------------------------------------
// AppearanceModal
// ---------------------------------------------------------------------------

/**
 * Theme picker modal. Fully decoupled — pass your app's theme state and
 * change handlers as props.
 *
 * Keyboard shortcuts: L/D/S for mode, 1–N for palette entries, Esc to close.
 *
 * @example
 * <AppearanceModal
 *   themes={THEMES}
 *   themeMode={themeMode}
 *   themeName={themeName}
 *   onModeChange={(mode) => { setThemeMode(mode); applyTheme(mode, themeName) }}
 *   onThemeChange={(name) => { setThemeName(name); applyTheme(themeMode, name) }}
 *   onClose={() => setOpen(false)}
 * />
 */
export function AppearanceModal({
  themes,
  themeMode,
  themeName,
  onModeChange,
  onThemeChange,
  onClose,
}: AppearanceModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if (key === "escape") { onClose(); return }
      if (KEY_TO_MODE[key]) { onModeChange(KEY_TO_MODE[key]); return }
      const idx = parseInt(e.key) - 1
      if (!isNaN(idx) && idx >= 0 && idx < themes.length) {
        const theme = themes[idx]
        if (theme) onThemeChange(theme.name)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [themes, onModeChange, onThemeChange, onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Customize how the app looks</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Close (Esc)"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Mode section */}
          <div className="px-5 pb-3 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "system"] as ThemeMode[]).map((mode) => {
                const active = themeMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => onModeChange(mode)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40 hover:bg-accent",
                    )}
                  >
                    <span className="text-lg leading-none">{MODE_ICONS[mode]}</span>
                    <span className="text-xs font-medium">{MODE_LABELS[mode]}</span>
                    <span className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px]",
                      active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      {MODE_SHORTCUTS[mode]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Palette section */}
          <div className="px-5 pb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Palette</p>
            <div className="space-y-1.5">
              {themes.map((t, i) => {
                const active = themeName === t.name
                return (
                  <button
                    key={t.name}
                    onClick={() => onThemeChange(t.name)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40 hover:bg-accent",
                    )}
                  >
                    <span className="flex shrink-0 gap-0.5">
                      <span className="h-4 w-4 rounded-full border border-border/50" style={{ background: t.preview[0] }} />
                      <span className="h-4 w-4 rounded-full border border-border/50" style={{ background: t.preview[1] }} />
                    </span>
                    <span className="flex-1 text-left font-medium">{t.label}</span>
                    <span className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px]",
                      active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      {i + 1}
                    </span>
                    {active && <span className="text-sm text-primary">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer hints */}
          <div className="border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-center text-xs text-muted-foreground">
              <Kbd>L</Kbd> <Kbd>D</Kbd> <Kbd>S</Kbd> for mode ·{" "}
              <Kbd>1</Kbd>–<Kbd>{themes.length}</Kbd> for palette ·{" "}
              <Kbd>Esc</Kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
