"use client"
import { useMemo } from "react"
import { AppComponent } from "@/lib/registry/lazy-component"
import { useParams } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import Link from "next/link"
import { PageLoader } from "@/components/shell/PageLoader"

export default function CustomAppRoutePage() {
  const params = useParams()
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug]
  const path = "/" + slugParts.join("/")

  const { hooks, hooksReady } = usePetalStore()

  const matchedRoute = useMemo(
    () => hooks.routes?.find((r) => r.path === path),
    [hooks.routes, path]
  )

  if (!matchedRoute && !hooksReady) {
    return <PageLoader label="Loading apps…" />
  }

  if (!matchedRoute) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <h2 className="text-xl font-bold text-foreground">No route registered for <code className="font-mono text-primary text-lg">{path}</code></h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add a matching entry to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">hooks.routes</code> in your custom app, or check the path spelling.
        </p>
        <Link
          href="/"
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const layout = matchedRoute.layout ?? "default"
  const route = <AppComponent loader={matchedRoute.component} fallback={<PageLoader />} />

  // blank/fullscreen routes escape the shell layout
  return layout === "blank" || layout === "fullscreen" ? (
    <div className={layout === "fullscreen" ? "fixed inset-0 z-50 bg-background" : ""}>{route}</div>
  ) : route
}
