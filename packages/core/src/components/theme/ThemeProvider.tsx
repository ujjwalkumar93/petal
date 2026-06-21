"use client"
import { useEffect } from "react"
import { usePetalStore } from "@/store/petal-store"
import { applyTheme, systemPrefersDark } from "@/lib/theme/theme-manager"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, themeName, setThemeMode } = usePetalStore()

  // Apply theme whenever mode or name changes
  useEffect(() => {
    applyTheme(themeMode, themeName)
  }, [themeMode, themeName])

  // Watch OS preference changes when mode is "system"
  useEffect(() => {
    if (themeMode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system", themeName)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [themeMode, themeName])

  // Sync initial system preference into store on mount
  useEffect(() => {
    if (themeMode === "system") {
      // re-trigger apply so the resolved value is consistent
      applyTheme("system", themeName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
