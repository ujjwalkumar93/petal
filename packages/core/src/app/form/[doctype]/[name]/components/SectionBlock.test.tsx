import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))

import { SectionBlock } from "./SectionBlock"
import type { LayoutSection, MetaField } from "./types"

afterEach(() => cleanup())

const FIELDS: MetaField[] = [
  { fieldname: "is_company", fieldtype: "Check", label: "Is Company" },
  { fieldname: "gstin", fieldtype: "Data", label: "GSTIN", mandatory_depends_on: "is_company" },
  { fieldname: "pan", fieldtype: "Data", label: "PAN", depends_on: "eval:doc.is_company" },
  { fieldname: "notes", fieldtype: "Data", label: "Notes", read_only_depends_on: "is_company" },
]
const SECTION: LayoutSection = { label: "", collapsible: false, columns: [{ label: "", fields: FIELDS }] } as LayoutSection

function renderWith(values: Record<string, unknown>) {
  const { container } = render(
    <SectionBlock section={SECTION} values={values} isEditing onChange={() => {}} fieldBehaviors={{}} />,
  )
  const field = (name: string) => container.querySelector(`[data-fieldname="${name}"]`)
  const hasAsterisk = (name: string) => Boolean(field(name)?.querySelector(".rounded-full"))
  return { field, hasAsterisk }
}

describe("SectionBlock field state (#20)", () => {
  it("marks mandatory_depends_on fields required, shows depends_on fields, locks read_only_depends_on", () => {
    const on = renderWith({ is_company: 1 })
    expect(on.hasAsterisk("gstin")).toBe(true)
    expect(on.field("pan")).not.toBeNull()
    expect(on.field("notes")?.querySelector("input")?.disabled).toBe(true)
  })

  it("drops the asterisk and hides the field when the conditions are off", () => {
    const off = renderWith({ is_company: 0 })
    expect(off.hasAsterisk("gstin")).toBe(false)
    expect(off.field("pan")).toBeNull()
    expect(off.field("notes")?.querySelector("input")?.disabled).toBe(false)
  })
})
