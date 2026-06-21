const DS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: "Draft",     cls: "bg-muted text-muted-foreground border-border/60" },
  1: { label: "Submitted", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  2: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
}

export interface DocStatusBadgeProps {
  /** 0 = Draft, 1 = Submitted, 2 = Cancelled */
  docstatus: number
}

export function DocStatusBadge({ docstatus }: DocStatusBadgeProps) {
  const s = DS_MAP[docstatus] ?? DS_MAP[0]!
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}
