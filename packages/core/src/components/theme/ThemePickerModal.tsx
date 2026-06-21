"use client"

import { usePetalStore } from "@/store/petal-store"
import { applyTheme, THEMES } from "@/lib/theme/theme-manager"
import type { ThemeName } from "@/lib/theme/theme-manager"
import { AppearanceModal } from "@petal/ui"
import type { ThemeMode } from "@petal/ui"

interface ThemePickerModalProps {
  onClose: () => void
}

/** Petal-wired AppearanceModal: injects store state + applyTheme. */
export function ThemePickerModal({ onClose }: ThemePickerModalProps) {
  const { themeMode, themeName, setThemeMode, setThemeName } = usePetalStore()

  function handleModeChange(mode: ThemeMode) {
    setThemeMode(mode)
    applyTheme(mode, themeName as ThemeName)
  }

  function handleThemeChange(name: string) {
    setThemeName(name as ThemeName)
    applyTheme(themeMode, name as ThemeName)
  }

  return (
    <AppearanceModal
      themes={THEMES}
      themeMode={themeMode}
      themeName={themeName}
      onModeChange={handleModeChange}
      onThemeChange={handleThemeChange}
      onClose={onClose}
    />
  )
}
