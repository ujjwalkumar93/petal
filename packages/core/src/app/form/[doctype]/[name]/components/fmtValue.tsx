export function fmtValue(val: unknown, fieldtype: string, currency = "USD"): React.ReactNode {
  if (val == null || val === "")
    return <span className="text-muted-foreground/40 text-xs italic">—</span>

  switch (fieldtype) {
    case "Check": {
      const checked = Number(val) === 1
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${checked ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
          <span className={`w-4 h-4 rounded flex items-center justify-center ${checked ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
            {checked ? (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
              </svg>
            )}
          </span>
          {checked ? "Yes" : "No"}
        </span>
      )
    }
    case "Date":
      return typeof val === "string"
        ? new Date(val).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
        : String(val)
    case "Datetime":
      return typeof val === "string"
        ? new Date(val).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : String(val)
    case "Currency": {
      const n = parseFloat(String(val))
      return isNaN(n) ? String(val) : n.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    case "Float": {
      const n = parseFloat(String(val))
      return isNaN(n) ? String(val) : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    case "Int":
    case "Percent": {
      const n = parseFloat(String(val))
      return isNaN(n) ? String(val) : n.toLocaleString()
    }
    case "Color":
      return (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border border-border/60 shrink-0" style={{ backgroundColor: String(val) }} />
          <span className="text-xs font-mono text-muted-foreground">{String(val)}</span>
        </span>
      )
    case "Password":
      return <span className="text-muted-foreground tracking-widest text-xs">••••••••</span>
    case "Rating": {
      const n = Number(val) || 0
      return (
        <span className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <svg key={s} className={`w-4 h-4 ${s <= n ? "text-yellow-400" : "text-muted-foreground/20"}`}
              fill={s <= n ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
            </svg>
          ))}
        </span>
      )
    }
    case "Image":
      return typeof val === "string" && val
        ? <img src={val} alt="" className="max-h-32 max-w-[180px] rounded-lg border border-border object-contain bg-muted/20" />
        : <span className="text-muted-foreground/40 text-xs italic">—</span>

    case "Code": {
      const raw = String(val)
      let parsed: unknown
      try { parsed = JSON.parse(raw) } catch { parsed = null }
      const isList = Array.isArray(parsed) && parsed.length > 0 && parsed.every((r) => r !== null && typeof r === "object" && !Array.isArray(r))
      const isSingle = !Array.isArray(parsed) && parsed !== null && typeof parsed === "object"
      if (isList || isSingle) {
        const rows = isList ? parsed as Record<string, unknown>[] : [parsed as Record<string, unknown>]
        const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
        return (
          <div className="overflow-x-auto w-full rounded-lg border border-border/40">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/40">
                  {keys.map((k) => (
                    <th key={k} className="px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    {keys.map((k) => (
                      <td key={k} className="px-3 py-2 text-foreground/80 whitespace-nowrap">
                        {row[k] == null ? <span className="text-muted-foreground/40 italic">—</span> : String(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return (
        <pre className="text-xs font-mono bg-muted/40 rounded-lg p-3 whitespace-pre-wrap break-all overflow-auto max-h-64 border border-border/40 w-full">
          {raw}
        </pre>
      )
    }
    case "Small Text":
    case "Text":
    case "Long Text":
    case "Text Editor":
      return <span className="whitespace-pre-wrap text-sm leading-relaxed">{String(val)}</span>
    default:
      return <span className="text-sm">{String(val)}</span>
  }
}
