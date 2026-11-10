import { describe, expect, it } from "vitest"
import { resourcePath } from "./resource-path"

describe("resourcePath", () => {
  it.each([
    ["INV#001", "INV%23001"],
    ["Q?2", "Q%3F2"],
    ["100%", "100%25"],
    ["INV/2024-25/001", "INV%2F2024-25%2F001"],
    ["a@b.com", "a%40b.com"],
  ])("encodes %s as one path segment", (name, encoded) => {
    expect(resourcePath("Sales Invoice", name)).toBe(`/doc/Sales%20Invoice/${encoded}`)
    expect(decodeURIComponent(encoded)).toBe(name)
  })

  it("builds the collection path without a name", () => {
    expect(resourcePath("Sales Invoice")).toBe("/doc/Sales%20Invoice")
  })
})
