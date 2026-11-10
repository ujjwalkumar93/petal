import { describe, expect, it, vi } from "vitest"
import { evalDependsOn, fieldState } from "./field-state"

describe("evalDependsOn (Desk's evaluate_depends_on_value)", () => {
  it("treats a bare fieldname as 'has a value'; empty tables count as no value", () => {
    expect(evalDependsOn("customer", { customer: "C-1" })).toBe(true)
    expect(evalDependsOn("customer", { customer: "" })).toBe(false)
    expect(evalDependsOn("items", { items: [] })).toBe(false)
    expect(evalDependsOn("items", { items: [{}] })).toBe(true)
  })

  it("evaluates eval: expressions with doc and parent", () => {
    expect(evalDependsOn("eval:doc.qty > 5", { qty: 6 })).toBe(true)
    expect(evalDependsOn("eval:parent.is_return", { qty: 1 }, { is_return: 1 })).toBe(true)
    expect(evalDependsOn("eval:doc.is_return", { is_return: 1 })).toBe(true) // parent defaults to doc
  })

  it("does not run a bare fieldname as code", () => {
    expect(evalDependsOn('x"]||(globalThis.pwned=1)||doc["', {})).toBe(false)
    expect((globalThis as Record<string, unknown>).pwned).toBeUndefined()
  })

  it("returns null for an expression that throws, and an empty expression means 'no condition'", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(evalDependsOn("eval:doc.a.b.c", {})).toBeNull()
    expect(evalDependsOn(undefined, {})).toBe(true)
    expect(evalDependsOn("", {})).toBe(true)
  })
})

describe("fieldState", () => {
  const doc = { is_company: 1, gstin: "", qty: 0 }

  it("hides on depends_on / hidden_depends_on / app behaviour", () => {
    expect(fieldState({ fieldname: "gstin", depends_on: "is_company" }, doc).visible).toBe(true)
    expect(fieldState({ fieldname: "gstin", depends_on: "eval:!doc.is_company" }, doc).visible).toBe(false)
    expect(fieldState({ fieldname: "gstin", hidden_depends_on: "is_company" }, doc).visible).toBe(false)
    expect(fieldState({ fieldname: "gstin" }, doc, { hidden: true }).visible).toBe(false)
  })

  it("makes a field read-only from read_only, read_only_depends_on or behaviour", () => {
    expect(fieldState({ fieldname: "a", read_only: 1 }, doc).readOnly).toBe(true)
    expect(fieldState({ fieldname: "a", read_only_depends_on: "is_company" }, doc).readOnly).toBe(true)
    expect(fieldState({ fieldname: "a" }, doc, { read_only: true }).readOnly).toBe(true)
    expect(fieldState({ fieldname: "a" }, doc).readOnly).toBe(false)
  })

  it("mandatory_depends_on decides mandatory when set, overriding reqd (as Desk does)", () => {
    expect(fieldState({ fieldname: "gstin", mandatory_depends_on: "is_company" }, doc).mandatory).toBe(true)
    expect(fieldState({ fieldname: "gstin", reqd: 1, mandatory_depends_on: "eval:!doc.is_company" }, doc).mandatory).toBe(false)
    expect(fieldState({ fieldname: "gstin", reqd: 1 }, doc).mandatory).toBe(true)
  })

  it("falls back safely when an expression is broken: visible, static read_only, static reqd", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const s = fieldState({
      fieldname: "x", reqd: 0, depends_on: "eval:doc.a.b", read_only_depends_on: "eval:doc.a.b", mandatory_depends_on: "eval:doc.a.b",
    }, doc)
    expect(s).toEqual({ visible: true, readOnly: false, mandatory: false })
  })
})
