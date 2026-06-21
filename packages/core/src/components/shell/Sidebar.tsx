"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import { iconRegistry } from "@/lib/icons/icon-registry"
import { SidebarNav } from "@petal/ui"
import type { ReactNode } from "react"

/** Petal-wired Sidebar: injects store state, Next.js Link, and icon registry. */
export function Sidebar() {
  const { sidebarItems, sidebarOpen, toggleSidebar } = usePetalStore()
  const pathname = usePathname()

  function renderLink(href: string, children: ReactNode) {
    return <Link href={href} className="flex flex-1 min-w-0 items-center gap-3">{children}</Link>
  }

  return (
    <SidebarNav
      items={sidebarItems}
      isOpen={sidebarOpen}
      activeHref={pathname}
      renderLink={renderLink}
      resolveIcon={(name) => iconRegistry.resolve(name)}
      onClose={toggleSidebar}
    />
  )
}
