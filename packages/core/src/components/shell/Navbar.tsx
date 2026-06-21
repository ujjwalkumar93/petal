"use client"
import { Suspense, lazy, useMemo, useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import { authService } from "@/lib/auth/auth-service"
import { ThemePickerModal } from "@/components/theme/ThemePickerModal"
import { MenuIcon, ProfileIcon, GearIcon, HelpIcon, AppearanceIcon, LogoutIcon, AppsIcon, DocsIcon } from "@/lib/icons/builtin-icons"
import { GlobalSearch } from "@/components/shell/GlobalSearch"
import { NotificationCenter } from "@/components/shell/NotificationCenter"
import type { NavbarItem } from "@petal/sdk"

function SafeLazyComponent({ item }: { item: NavbarItem }) {
  const Component = useMemo(
    () =>
      lazy(async () => {
        if (typeof item.component !== "function") {
          console.error("[Petal] Navbar item has invalid component loader:", item)
          return { default: () => null }
        }
        try {
          const module = await item.component()
          if (!module?.default) {
            console.error("[Petal] Navbar component has no default export:", item)
            return { default: () => null }
          }
          return module
        } catch (error) {
          console.error("[Petal] Failed to load navbar component:", error)
          return { default: () => null }
        }
      }),
    [item.component]
  )

  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  )
}

export function Navbar() {
  const { hooks, user, setUser, setAuthStatus, toggleSidebar } = usePetalStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu])

  async function handleLogout() {
    setLoggingOut(true)
    const result = await authService.logout()
    if (result.success) {
      setUser(null)
      setAuthStatus("unauthenticated")
      router.replace(result.redirectTo)
    } else {
      console.warn("[Petal] Logout blocked:", result.message)
      setLoggingOut(false)
    }
  }

  const leftItems = (hooks.navbar_items ?? []).filter((i) => i.position !== "right")
  const rightItems = (hooks.navbar_items ?? []).filter((i) => i.position === "right")

  return (
    <header className="h-16 border-b bg-background border-border flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-accent text-foreground transition-colors"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <MenuIcon />
        </button>

        <GlobalSearch />
      </div>

      {/* Center Items */}
      <div className="flex items-center gap-3">
        {leftItems.map((item, i) => (
          <SafeLazyComponent key={i} item={item} />
        ))}
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Right Items */}
        <div className="flex items-center gap-3">
          {rightItems.map((item, i) => (
            <SafeLazyComponent key={i} item={item} />
          ))}
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            {user?.user_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/v1${user.user_image}`}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{user?.full_name?.split(" ")[0] || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? user?.user_type ?? ""}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-background border border-border rounded-xl shadow-xl py-2 z-[200]">
              <a href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors">
                <ProfileIcon /> View Profile
              </a>
              <a href="/settings" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors">
                <GearIcon /> Settings
              </a>
              <a href="/apps" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors">
                <AppsIcon /> Installed Apps
              </a>
              <a href="/petal-docs" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors">
                <DocsIcon /> Petal Documentation
              </a>
              <a href="/help" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors">
                <HelpIcon /> Help & Support
              </a>
              <hr className="my-2 border-border" />
              <button
                onClick={() => { setShowThemePicker(true); setShowUserMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors"
              >
                <AppearanceIcon /> Appearance
              </button>
              <hr className="my-2 border-border" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-red-500 disabled:opacity-50 transition-colors"
              >
                {loggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <><LogoutIcon /> Logout</>
                )}
              </button>
            </div>
          )}
          {showThemePicker && <ThemePickerModal onClose={() => setShowThemePicker(false)} />}
        </div>
      </div>
    </header>
  )
}
