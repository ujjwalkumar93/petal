import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard"
import { confirmLeave, hasUnsavedChanges } from "@/lib/nav/leave-guard"

function Page({ dirty, onNavigate }: { dirty: boolean; onNavigate: () => void }) {
  useUnsavedChangesGuard(dirty)
  return (
    <div>
      {/* stands in for next/link: a React onClick that navigates client-side. Raw <a> on purpose:
          the guard must intercept native anchors, which is what next/link renders. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/list/Item" onClick={(e) => { e.preventDefault(); onNavigate() }}>Items</a>
      <a href="/list/Item" target="_blank">New tab</a>
      <a href="#details">Jump</a>
    </div>
  )
}

function click(el: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init })
  el.dispatchEvent(event)
  return event
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("useUnsavedChangesGuard", () => {
  it("lets links through when nothing is dirty", () => {
    const confirm = vi.spyOn(window, "confirm")
    const onNavigate = vi.fn()
    const { getByText } = render(<Page dirty={false} onNavigate={onNavigate} />)

    click(getByText("Items"))

    expect(confirm).not.toHaveBeenCalled()
    expect(onNavigate).toHaveBeenCalledOnce()
  })

  it("blocks an in-app link when the user cancels", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false)
    const onNavigate = vi.fn()
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />)

    const event = click(getByText("Items"))

    expect(event.defaultPrevented).toBe(true)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it("navigates when the user confirms", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const onNavigate = vi.fn()
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />)

    click(getByText("Items"))

    expect(onNavigate).toHaveBeenCalledOnce()
  })

  it("ignores new-tab links, modified clicks and hash links", () => {
    const confirm = vi.spyOn(window, "confirm")
    const onNavigate = vi.fn()
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />)

    click(getByText("New tab"))
    click(getByText("Items"), { metaKey: true })
    click(getByText("Jump"))

    expect(confirm).not.toHaveBeenCalled()
  })

  it("asks the browser to confirm reload/close while dirty, and stops once clean", () => {
    const { rerender } = render(<Page dirty onNavigate={() => {}} />)
    const dirtyUnload = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(dirtyUnload)
    expect(dirtyUnload.defaultPrevented).toBe(true)

    rerender(<Page dirty={false} onNavigate={() => {}} />)
    const cleanUnload = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(cleanUnload)
    expect(cleanUnload.defaultPrevented).toBe(false)
  })

  it("feeds confirmLeave() for programmatic navigation and unregisters on unmount", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false)
    const { unmount } = render(<Page dirty onNavigate={() => {}} />)
    expect(hasUnsavedChanges()).toBe(true)
    expect(confirmLeave()).toBe(false)

    unmount()
    expect(hasUnsavedChanges()).toBe(false)
    expect(confirmLeave()).toBe(true)
  })

  describe("browser Back/Forward", () => {
    // Stands in for the App Router's own popstate listener (non-capture, on window).
    let routerSawPop: ReturnType<typeof vi.fn>
    const onRouterPop = () => routerSawPop()

    beforeEach(() => {
      routerSawPop = vi.fn()
      window.history.replaceState({ __NA: true, page: "list" }, "", "/list/Item")
      window.history.pushState({ __NA: true, page: "form" }, "", "/form/Item/ITEM-1")
      window.addEventListener("popstate", onRouterPop)
    })
    afterEach(() => window.removeEventListener("popstate", onRouterPop))

    // jsdom traverses history in a later task; the guard may stop every other
    // popstate listener, so wait for the traversal rather than for an event.
    async function back(): Promise<void> {
      window.history.back()
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    it("keeps the user on the form when they cancel", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false)
      render(<Page dirty onNavigate={() => {}} />)

      await back()

      expect(window.confirm).toHaveBeenCalledOnce()
      expect(routerSawPop).not.toHaveBeenCalled()
      expect(window.location.pathname).toBe("/form/Item/ITEM-1")
      expect(window.history.state).toMatchObject({ page: "form" })
    })

    it("lets the router handle Back when the user confirms", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true)
      render(<Page dirty onNavigate={() => {}} />)

      await back()

      expect(routerSawPop).toHaveBeenCalledOnce()
      expect(window.location.pathname).toBe("/list/Item")
    })

    it("does not ask when nothing is dirty", async () => {
      const confirm = vi.spyOn(window, "confirm")
      render(<Page dirty={false} onNavigate={() => {}} />)

      await back()

      expect(confirm).not.toHaveBeenCalled()
      expect(routerSawPop).toHaveBeenCalledOnce()
    })
  })
})
