// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { sanitizeHtml } from "./FrappeHtml"

const hrefOf = (html: string) => {
  const div = document.createElement("div")
  div.innerHTML = sanitizeHtml(html)
  return div.querySelector("a")?.getAttribute("href") ?? null
}

describe("sanitizeHtml", () => {
  it("blocks javascript: URLs hidden with control characters, entities or case", () => {
    expect(hrefOf('<a href="java&#x09;script:alert(1)">x</a>')).toBeNull()
    expect(hrefOf('<a href="java\nscript:alert(1)">x</a>')).toBeNull()
    expect(hrefOf('<a href=" &#x01;JavaScript:alert(1)">x</a>')).toBeNull()
    expect(hrefOf('<a href="vbscript:x">x</a>')).toBeNull()
    expect(hrefOf('<a href="data:text/html,<script>alert(1)</script>">x</a>')).toBeNull()
  })

  it("keeps ordinary links, Desk routes and inline images", () => {
    expect(hrefOf('<a href="/app/sales-invoice/SINV-1">x</a>')).toBe("/app/sales-invoice/SINV-1")
    expect(hrefOf('<a href="https://erpnext.com">x</a>')).toBe("https://erpnext.com")
    expect(hrefOf('<a href="#section">x</a>')).toBe("#section")
    expect(hrefOf('<a href="mailto:a@b.co">x</a>')).toBe("mailto:a@b.co")
    expect(sanitizeHtml('<img src="data:image/png;base64,AAAA">')).toContain("data:image/png")
  })

  it("drops style elements and SVG animations", () => {
    const out = sanitizeHtml('<style>body{display:none}</style><svg><a><animate attributeName="href" values="javascript:alert(1)"/><text>x</text></a></svg><svg><set attributeName="onclick" to="alert(1)"/></svg>ok')
    expect(out).not.toMatch(/<style|<animate|<set/i)
    expect(out).toContain("ok")
  })

  it("removes event handlers and xlink:href javascript", () => {
    const out = sanitizeHtml('<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg><b onmouseover="alert(1)">b</b>')
    expect(out).not.toMatch(/javascript|onmouseover/i)
  })
})

/** Parse the sanitizer's output the way the page will, and report anything executable. */
function dangerous(html: string): string[] {
  const host = document.createElement("div")
  host.innerHTML = sanitizeHtml(html)
  const found: string[] = []
  for (const el of Array.from(host.querySelectorAll("*"))) {
    const tag = el.localName.toLowerCase()
    if (["script", "iframe", "object", "embed", "style", "noscript", "template", "form"].includes(tag)) found.push(`<${tag}>`)
    for (const a of Array.from(el.attributes)) {
      if (a.name.toLowerCase().startsWith("on")) found.push(`${tag}[${a.name}]`)
      if (/^\s*(javascript|vbscript|data:text)/i.test(a.value.replace(/[\u0000- ]/g, ""))) found.push(`${tag}[${a.name}=${a.value}]`)
    }
  }
  return found
}

describe("sanitizeHtml — mutation XSS (#18)", () => {
  it.each([
    // Namespace confusion: the payload is text inside <style> under MathML/SVG
    // but becomes markup once re-parsed as HTML.
    ["mathml/style", '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)></style></mglyph></table></mtext></math>'],
    ["svg/style", '<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">'],
    ["noscript", '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
    ["form/math", '<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>'],
    ["template", '<template><img src=x onerror=alert(1)></template><img src=y onerror=alert(2)>'],
    ["comment break", '<!--<img src="--><img src=x onerror=alert(1)//">'],
    ["svg foreignObject", '<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>'],
  ])("%s", (_name, payload) => {
    expect(dangerous(payload)).toEqual([])
  })

  it("keeps Frappe's ordinary msgprint markup", () => {
    const html = '<p>Row #2: <b>Item</b> <a href="/app/item/ITEM-1">ITEM-1</a> is <span class="indicator red">out of stock</span></p><table><tr><td>1</td></tr></table>'
    const out = sanitizeHtml(html)
    for (const s of ["<b>Item</b>", 'href="/app/item/ITEM-1"', 'class="indicator red"', "<td>1</td>"]) expect(out).toContain(s)
  })
})

describe("sanitizeHtml — Petal's policy on top of DOMPurify's defaults", () => {
  it("only allows raster data: images", () => {
    expect(sanitizeHtml('<img src="data:image/svg+xml;base64,PHN2Zz4=">')).not.toContain("data:")
    expect(sanitizeHtml('<img srcset="data:image/svg+xml;base64,PHN2Zz4= 1x">')).not.toContain("srcset")
    expect(sanitizeHtml('<img src="data:image/webp;base64,AAAA">')).toContain("data:image/webp")
  })

  it("drops MathML, stylesheets and forms, which DOMPurify allows by default", () => {
    const out = sanitizeHtml("<math><mi>x</mi></math><style>*{}</style><form><input></form><p>kept</p>")
    expect(out).not.toMatch(/<math|<style|<form/)
    expect(out).toContain("<p>kept</p>")
  })

  it("keeps link targets, adding noopener to new windows", () => {
    const div = document.createElement("div")
    div.innerHTML = sanitizeHtml('<a href="https://erpnext.com" target="_blank">x</a>')
    const a = div.querySelector("a")!
    expect(a.getAttribute("target")).toBe("_blank")
    expect(a.getAttribute("rel")).toBe("noopener noreferrer")
  })
})
