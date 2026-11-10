import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, renderHook } from "@testing-library/react"

const push = vi.fn()
const replace = vi.fn()
const back = vi.fn()
const forward = vi.fn()
const refresh = vi.fn()
const prefetch = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace, back, forward, refresh, prefetch }) }))

import { useGuardedRouter } from "./useGuardedRouter"
import { registerLeaveGuard } from "@/lib/nav/leave-guard"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe("useGuardedRouter", () => {
  it("navigates without asking when nothing is unsaved", () => {
    const confirm = vi.spyOn(window, "confirm")
    const { result } = renderHook(() => useGuardedRouter())

    result.current.push("/list/Item")

    expect(confirm).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith("/list/Item", undefined)
  })

  it("asks before push/replace/back/forward when a page has unsaved changes", () => {
    const unregister = registerLeaveGuard(() => true)
    vi.spyOn(window, "confirm").mockReturnValue(false)
    const { result } = renderHook(() => useGuardedRouter())

    result.current.push("/a")
    result.current.replace("/b")
    result.current.back()
    result.current.forward()

    expect(window.confirm).toHaveBeenCalledTimes(4)
    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(back).not.toHaveBeenCalled()
    expect(forward).not.toHaveBeenCalled()
    unregister()
  })

  it("navigates once the user agrees to discard, and never guards refresh/prefetch", () => {
    const unregister = registerLeaveGuard(() => true)
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const { result } = renderHook(() => useGuardedRouter())

    result.current.push("/a", { scroll: false })
    result.current.refresh()
    result.current.prefetch("/c")

    expect(push).toHaveBeenCalledWith("/a", { scroll: false })
    expect(window.confirm).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
    expect(prefetch).toHaveBeenCalledOnce()
    unregister()
  })
})
