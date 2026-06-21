"use client"
import { useState } from "react"
import { usePetalStore } from "@/store/petal-store"
import { applyTheme, THEMES } from "@/lib/theme/theme-manager"
import type { ThemeMode, ThemeName } from "@/lib/theme/theme-manager"

const MODE_CYCLE: ThemeMode[] = ["system", "light", "dark"]

const MODE_ICONS: Record<ThemeMode, string> = {
  system: "💻",
  light: "☀️",
  dark: "🌙",
}

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
}

export function ThemeToggle() {
  const { themeMode, themeName, setThemeMode, setThemeName } = usePetalStore()
  const [open, setOpen] = useState(false)

  function cycleMode() {
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(themeMode) + 1) % MODE_CYCLE.length] ?? "system"
    setThemeMode(next)
    applyTheme(next, themeName)
  }

  function pickTheme(name: ThemeName) {
    setThemeName(name)
    applyTheme(themeMode, name)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Mode toggle */}
        <button
          onClick={cycleMode}
          title={`Theme: ${MODE_LABELS[themeMode]}`}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
        >
          {MODE_ICONS[themeMode]}
        </button>

        {/* Palette picker trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          title="Change color theme"
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5" cy="6.5" r="1.5" fill="currentColor" />
            <circle cx="11" cy="6.5" r="1.5" fill="currentColor" />
            <circle cx="8" cy="11" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Palette dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card border border-border rounded-xl shadow-lg p-2 z-50 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
              Color Theme
            </p>
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => t.tier === "free" ? pickTheme(t.name) : undefined}
                disabled={t.tier === "paid"}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  themeName === t.name
                    ? "bg-primary/10 text-primary font-semibold"
                    : t.tier === "paid"
                    ? "opacity-40 cursor-not-allowed text-foreground"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                {/* Swatch */}
                <span className="flex gap-0.5 shrink-0">
                  <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: t.preview[0] }} />
                  <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: t.preview[1] }} />
                </span>
                <span className="flex-1 text-left">{t.label}</span>
                {t.tier === "paid" && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
                {themeName === t.name && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
