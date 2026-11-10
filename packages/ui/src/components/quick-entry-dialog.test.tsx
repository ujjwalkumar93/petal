import { describe, it, expect, vi } from "vitest"
import { act, render, screen, fireEvent } from "@testing-library/react"
import { QuickEntryDialog, type QuickEntryMeta } from "./quick-entry-dialog"

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

const meta = (fieldname: string, label: string): QuickEntryMeta => ({
  fields: [{ fieldname, fieldtype: "Data", label, reqd: 1 }],
})

const base = {
  onSaved: vi.fn(),
  onEditFull: vi.fn(),
  onSave: vi.fn(async () => "X-1"),
  onFetchLinkOptions: vi.fn(async () => []),
}

describe("QuickEntryDialog", () => {
  it("ignores the meta of a doctype the dialog has moved away from", async () => {
    const slow = deferred<QuickEntryMeta>()
    const { rerender } = render(
      <QuickEntryDialog {...base} doctype="Customer" open onClose={vi.fn()} onFetchMeta={() => slow.promise} />,
    )
    rerender(
      <QuickEntryDialog {...base} doctype="Supplier" open onClose={vi.fn()} onFetchMeta={async () => meta("supplier_name", "Supplier Name")} />,
    )
    expect(await screen.findByText("Supplier Name")).toBeTruthy()

    // The Customer request answers late: it must not replace Supplier's fields.
    await act(async () => { slow.resolve(meta("customer_name", "Customer Name")) })
    expect(screen.queryByText("Customer Name")).toBeNull()
    expect(screen.getByText("Supplier Name")).toBeTruthy()
  })

  it("does not refetch meta when the parent passes a new onFetchMeta", async () => {
    const fetchMeta = vi.fn(async () => meta("customer_name", "Customer Name"))
    const { rerender } = render(<QuickEntryDialog {...base} doctype="Customer" open onClose={vi.fn()} onFetchMeta={fetchMeta} />)
    await screen.findByText("Customer Name")
    rerender(<QuickEntryDialog {...base} doctype="Customer" open onClose={vi.fn()} onFetchMeta={() => fetchMeta()} />)
    expect(fetchMeta).toHaveBeenCalledTimes(1)
  })

  it("Escape calls the current onClose, not the one from when it opened", async () => {
    const first = vi.fn()
    const latest = vi.fn()
    const fetchMeta = async () => meta("customer_name", "Customer Name")
    const { rerender } = render(<QuickEntryDialog {...base} doctype="Customer" open onClose={first} onFetchMeta={fetchMeta} />)
    await screen.findByText("Customer Name")
    rerender(<QuickEntryDialog {...base} doctype="Customer" open onClose={latest} onFetchMeta={fetchMeta} />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(latest).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })
})
