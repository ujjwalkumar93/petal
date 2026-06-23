export type ThemeMode = "light" | "dark" | "system"
export type ThemeName = "default" | "ocean" | "rose" | "slate"

export interface ThemeDefinition {
  name: ThemeName
  label: string
  /** Swatch colors shown in the picker: [primary, background] */
  tier: "free" | "paid"
  preview: [string, string]
}


export const THEMES: ThemeDefinition[] = [
  { name: "default", label: "Green",  tier: "free" ,preview: ["#16a34a", "#ffffff"] },
  { name: "ocean",   label: "Ocean",  tier: "free" ,preview: ["#3b82f6", "#eff6ff"] },
  { name: "rose",    label: "Rose",   tier: "free" ,preview: ["#f43f5e", "#fff1f2"] },
  { name: "slate",   label: "Slate",  tier: "free" ,preview: ["#475569", "#f8fafc"] },
]

const STORAGE_KEY_MODE  = "petal-theme-mode"
const STORAGE_KEY_NAME  = "petal-theme-name"

export function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode) ?? "system"
}

export function readStoredName(): ThemeName {
  if (typeof window === "undefined") return "default"
  return (localStorage.getItem(STORAGE_KEY_NAME) as ThemeName) ?? "default"
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark")   return true
  if (mode === "light")  return false
  return systemPrefersDark()
}

export function applyTheme(mode: ThemeMode, name: ThemeName): void {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.classList.toggle("dark", resolveIsDark(mode))

  THEMES.forEach((t) => root.classList.remove(`theme-${t.name}`))
  if (name !== "default") root.classList.add(`theme-${name}`)

  localStorage.setItem(STORAGE_KEY_MODE, mode)
  localStorage.setItem(STORAGE_KEY_NAME, name)
}

/** Inline script string — injected into <head> to prevent flash on load */
export const THEME_SCRIPT = `(function(){
  var mode = localStorage.getItem("${STORAGE_KEY_MODE}") || "system";
  var name = localStorage.getItem("${STORAGE_KEY_NAME}") || "default";
  var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
  if (name !== "default") document.documentElement.classList.add("theme-" + name);
})();`
