import { Suspense, lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from "react"

type Loader<P> = () => Promise<{ default: ComponentType<P> }>

// One lazy component per loader function for the lifetime of the page. Calling
// lazy() during render (even inside useMemo) creates a new component type
// whenever the loader's owner object is rebuilt — e.g. when app hooks are
// re-merged — which remounts the app's UI and throws its state away.
const cache = new WeakMap<object, object>()

/** Stable `React.lazy` wrapper for a custom app's component loader. */
export function lazyComponent<P>(loader: Loader<P>): LazyExoticComponent<ComponentType<P>> {
  let component = cache.get(loader) as LazyExoticComponent<ComponentType<P>> | undefined
  if (!component) {
    component = lazy(loader)
    cache.set(loader, component)
  }
  return component
}

/**
 * Like lazyComponent, but a loader that throws or has no default export
 * renders nothing (and logs) instead of crashing the surrounding shell.
 */
export function safeLazyComponent<P>(loader: unknown, label: string): LazyExoticComponent<ComponentType<P>> {
  const key = (typeof loader === "function" ? loader : safeLazyComponent) as object
  let component = safeCache.get(key) as LazyExoticComponent<ComponentType<P>> | undefined
  if (!component) {
    component = lazy(async () => {
      const empty = { default: (() => null) as ComponentType<P> }
      if (typeof loader !== "function") {
        console.error(`[Petal] ${label} has an invalid component loader`)
        return empty
      }
      try {
        const mod = (await (loader as Loader<P>)()) as { default?: ComponentType<P> } | undefined
        if (!mod?.default) {
          console.error(`[Petal] ${label} component has no default export`)
          return empty
        }
        return { default: mod.default }
      } catch (error) {
        console.error(`[Petal] Failed to load ${label} component:`, error)
        return empty
      }
    })
    safeCache.set(key, component)
  }
  return component
}

const safeCache = new WeakMap<object, object>()

/**
 * Renders a component supplied by a custom app (route, form/list override,
 * slot, navbar item, login page) from its loader, inside its own Suspense.
 * All app components go through here so their identity is guaranteed stable.
 */
export function AppComponent<P extends object>({ loader, props, fallback = null, safeLabel }: {
  loader: Loader<P> | unknown
  props?: P
  fallback?: ReactNode
  /** Render nothing (and log) instead of throwing when the loader is invalid or fails. */
  safeLabel?: string
}) {
  const Component = safeLabel
    ? safeLazyComponent<P>(loader, safeLabel)
    : lazyComponent(loader as Loader<P>)
  return (
    <Suspense fallback={fallback}>
      {/* eslint-disable-next-line react-hooks/static-components -- `Component` comes from a WeakMap keyed by the loader, so the same loader always yields the same component type; it is never recreated between renders. */}
      <Component {...(props ?? ({} as P))} />
    </Suspense>
  )
}
