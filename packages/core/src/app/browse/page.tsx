"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useFrappe } from "@/hooks/useFrappe"

interface DocTypeMeta {
  name: string
  module: string
}

export default function BrowsePage() {
  const frappe = useFrappe()
  const [doctypes, setDoctypes] = useState<DocTypeMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    frappe
      .getList({
        doctype: "DocType",
        fields: ["name", "module"],
        filters: [["istable", "=", "0", null], ["issingle", "=", "0", null]],
        limit: 500,
      })
      .then((data) => setDoctypes(data as unknown as DocTypeMeta[]))
      .catch(() => setDoctypes([]))
      .finally(() => setLoading(false))
  }, [frappe])

  const grouped = useMemo(() => {
    const filtered = search
      ? doctypes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.module.toLowerCase().includes(search.toLowerCase()))
      : doctypes
    const map = new Map<string, string[]>()
    for (const d of filtered) {
      const existing = map.get(d.module)
      if (existing) existing.push(d.name)
      else map.set(d.module, [d.name])
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [doctypes, search])

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary mb-2">Browse</h1>
        <p className="text-muted-foreground">View and manage all document types</p>
      </section>

      <input
        type="text"
        placeholder="Search doctypes or modules..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctypes found.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([module, names]) => (
            <div key={module}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2 mb-3">
                {module}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {names.map((name) => (
                  <Link
                    key={name}
                    href={`/list/${encodeURIComponent(name)}`}
                    className="flex items-center gap-2 p-3 bg-white border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all group"
                  >
                    <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
