"use client"
import { Suspense, lazy, useMemo } from "react"
import { useParams } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import Link from "next/link"

export default function CustomAppRoutePage() {
  const params = useParams()
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug]
  const path = "/" + slugParts.join("/")

  const { hooks } = usePetalStore()

  const matchedRoute = useMemo(
    () => hooks.routes?.find((r) => r.path === path),
    [hooks.routes, path]
  )

  const RouteComponent = useMemo(
    () => (matchedRoute ? lazy(matchedRoute.component) : null),
    [matchedRoute]
  )

  if (!RouteComponent) {
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

  const layout = matchedRoute?.layout ?? "default"

  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      }
    >
      {layout === "blank" || layout === "fullscreen" ? (
        // Escape the shell layout for blank/fullscreen routes
        <div className={layout === "fullscreen" ? "fixed inset-0 z-50 bg-background" : ""}>
          <RouteComponent />
        </div>
      ) : (
        <RouteComponent />
      )}
    </Suspense>
  )
}
