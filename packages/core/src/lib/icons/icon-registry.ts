import type { ReactNode } from "react"

export type IconRenderer = () => ReactNode

// Resolves SidebarItem.icon strings — register custom icons by name in on_init.
class IconRegistry {
  private map = new Map<string, IconRenderer>()

  register(name: string, renderer: IconRenderer): void {
    this.map.set(name, renderer)
  }

  registerAll(icons: Record<string, IconRenderer>): void {
    for (const [name, renderer] of Object.entries(icons)) {
      this.map.set(name, renderer)
    }
  }

  /** Returns null if not found. */
  resolve(name: string): IconRenderer | null {
    return this.map.get(name) ?? null
  }

  has(name: string): boolean {
    return this.map.has(name)
  }

  list(): string[] {
    return [...this.map.keys()]
  }
}

export const iconRegistry = new IconRegistry()
