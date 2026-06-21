"use client"

import * as React from "react"
import { useState, useCallback, useRef } from "react"
import { cn } from "../lib/utils"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type TreeNode = {
  name: string
  label?: string
  is_group: boolean
  parent_name?: string
  balance?: number
  account_currency?: string
  account_type?: string
  root_type?: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | string
  [key: string]: unknown
}

export type TreeViewProps = {
  /** Top-level nodes rendered when the tree first mounts */
  rootNodes: TreeNode[]
  /** Called when a group node is first expanded; return its direct children */
  onFetchChildren: (parentName: string) => Promise<TreeNode[]>
  /** Called when a leaf node (is_group=false) is clicked */
  onNodeClick?: (node: TreeNode) => void
  /** Called when the "+ Add Child" button is clicked on a node */
  onNewClick?: (parentName: string, parentLabel: string) => void
  /** Override the right-side cell for any node */
  renderMeta?: (node: TreeNode) => React.ReactNode
  /** Fallback currency symbol when node doesn't carry account_currency */
  currency?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

type NodeState = {
  expanded: boolean
  loading: boolean
  children: TreeNode[] | null // null → not yet fetched
  error: string | null
}

// ---------------------------------------------------------------------------
// Colour map for root_type
// ---------------------------------------------------------------------------

const ROOT_COLOR: Record<string, { text: string; bg: string; ring: string }> = {
  Asset:     { text: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40",    ring: "ring-blue-200 dark:ring-blue-800" },
  Liability: { text: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/40",      ring: "ring-red-200 dark:ring-red-800" },
  Equity:    { text: "text-violet-600 dark:text-violet-400",bg: "bg-violet-50 dark:bg-violet-950/40",ring: "ring-violet-200 dark:ring-violet-800" },
  Income:    { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Expense:   { text: "text-orange-600 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-950/40", ring: "ring-orange-200 dark:ring-orange-800" },
}

const fallbackColor: { text: string; bg: string; ring: string } = { text: "text-muted-foreground", bg: "bg-muted/30", ring: "ring-border" }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtBalance(amount: number, currency = "₹"): string {
  const abs = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency} ${abs}`
}

// ---------------------------------------------------------------------------
// Skeleton row (used while loading root nodes)
// ---------------------------------------------------------------------------

function SkeletonRow({ width }: { width: number }) {
  return (
    <div className="flex items-center gap-3 h-12 px-3">
      <div className="w-4 h-4 rounded bg-muted animate-pulse" />
      <div className="h-3 rounded bg-muted animate-pulse" style={{ width }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// TreeNodeRow — renders one node + its recursive subtree
// ---------------------------------------------------------------------------

const INDENT_PX = 20 // pixels per depth level

function TreeNodeRow({
  node,
  depth,
  isLast,
  getState,
  onToggle,
  onNodeClick,
  onNewClick,
  renderMeta,
  currency,
}: {
  node: TreeNode
  depth: number
  isLast: boolean
  getState: (name: string) => NodeState
  onToggle: (node: TreeNode) => void | Promise<void>
  onNodeClick: ((node: TreeNode) => void) | undefined
  onNewClick: ((parentName: string, parentLabel: string) => void) | undefined
  renderMeta: ((node: TreeNode) => React.ReactNode) | undefined
  currency: string | undefined
}) {
  const [hovered, setHovered] = useState(false)
  const state = getState(node.name)
  const label = String(node.label ?? node.name)
  const rt = node.root_type as string | undefined
  const color: { text: string; bg: string; ring: string } = (rt ? ROOT_COLOR[rt] : undefined) ?? fallbackColor
  const isRoot = depth === 0

  function handleClick() {
    if (node.is_group) onToggle(node)
    else onNodeClick?.(node)
  }

  return (
    <div>
      {/* Row */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={node.is_group ? state.expanded : undefined}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick() } }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ paddingLeft: depth * INDENT_PX }}
        className={cn(
          "group flex items-center gap-1 h-10 pr-2 rounded-lg cursor-pointer select-none transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "hover:bg-accent/70",
          isRoot && state.expanded && "bg-muted/30",
          !node.is_group && "hover:bg-primary/5",
        )}
      >
        {/* Chevron / spinner / leaf dot */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {state.loading ? (
            <svg className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : node.is_group ? (
            <svg
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-150",
                state.expanded ? "rotate-90 text-foreground/60" : "text-muted-foreground/50",
              )}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
          )}
        </div>

        {/* Folder / leaf icon */}
        <div
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-md shrink-0",
            node.is_group
              ? isRoot
                ? cn(color.bg, "ring-1", color.ring)
                : "bg-muted/50"
              : "bg-transparent",
          )}
        >
          {node.is_group ? (
            <svg
              className={cn("w-4 h-4", isRoot ? color.text : "text-muted-foreground/70")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
            >
              {state.expanded
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              }
            </svg>
          ) : (
            <svg className="w-4 h-4 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Label + account_type */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2 ml-1">
          <span className={cn(
            "text-sm truncate leading-none",
            node.is_group
              ? isRoot ? cn("font-bold", color.text) : "font-semibold text-foreground"
              : "font-normal text-foreground/80 group-hover:text-primary transition-colors",
          )}>
            {label}
          </span>
          {node.account_type && !isRoot && (
            <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden sm:inline">
              {node.account_type as string}
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Balance / custom meta */}
          {renderMeta
            ? renderMeta(node)
            : node.balance != null && (
              <span className={cn(
                "text-xs font-mono tabular-nums",
                (node.balance as number) < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground/60",
              )}>
                {fmtBalance(node.balance as number, (node.account_currency as string) ?? currency)}
              </span>
            )
          }

          {/* Add Child — visible on hover */}
          {onNewClick && hovered && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNewClick(node.name, label) }}
              className={cn(
                "h-6 px-2 flex items-center gap-1 rounded-md border border-border/70",
                "bg-background text-[10px] font-medium text-muted-foreground",
                "hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors",
              )}
              title={`Add child under "${label}"`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Child
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div
          className="ml-6 text-xs text-red-500 py-1"
          style={{ paddingLeft: depth * INDENT_PX + 32 }}
        >
          {state.error}
        </div>
      )}

      {/* Children subtree */}
      {node.is_group && state.expanded && state.children != null && (
        <div
          className="relative"
          style={{ marginLeft: depth * INDENT_PX + 12 }}
        >
          {/* Vertical guide line */}
          <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border/50" />

          <div className="pl-4">
            {state.children.length === 0 ? (
              <div className="py-2 text-xs text-muted-foreground/40 italic pl-2">
                No child accounts
              </div>
            ) : (
              state.children.map((child, i) => (
                <TreeNodeRow
                  key={child.name}
                  node={child}
                  depth={0}
                  isLast={i === state.children!.length - 1}
                  getState={getState}
                  onToggle={onToggle}
                  onNodeClick={onNodeClick}
                  onNewClick={onNewClick}
                  renderMeta={renderMeta}
                  currency={currency}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DocTreeView — the public component
// ---------------------------------------------------------------------------

export function TreeView({
  rootNodes,
  onFetchChildren,
  onNodeClick,
  onNewClick,
  renderMeta,
  currency,
  className,
}: TreeViewProps) {
  // All node states keyed by node.name
  const [states, setStates] = useState<Map<string, NodeState>>(new Map())

  // Keep fetchRef stable so callbacks don't cause stale closures
  const fetchRef = useRef(onFetchChildren)
  React.useEffect(() => { fetchRef.current = onFetchChildren })

  const getState = useCallback(
    (name: string): NodeState =>
      states.get(name) ?? { expanded: false, loading: false, children: null, error: null },
    [states],
  )

  function patchState(name: string, patch: Partial<NodeState>) {
    setStates((prev) => {
      const next = new Map(prev)
      const cur = next.get(name) ?? { expanded: false, loading: false, children: null, error: null }
      next.set(name, { ...cur, ...patch })
      return next
    })
  }

  const handleToggle = useCallback(async (node: TreeNode) => {
    const cur = states.get(node.name) ?? { expanded: false, loading: false, children: null, error: null }

    // Already has children — just toggle
    if (cur.children !== null) {
      patchState(node.name, { expanded: !cur.expanded })
      return
    }

    // First expand: fetch children
    patchState(node.name, { expanded: true, loading: true, error: null })
    try {
      const children = await fetchRef.current(node.name)
      patchState(node.name, { loading: false, children })
    } catch {
      patchState(node.name, { loading: false, expanded: false, error: `Failed to load children for "${node.label ?? node.name}"` })
    }
  }, [states])

  return (
    <div className={cn("space-y-0.5", className)}>
      {rootNodes.length === 0 ? (
        <div className="space-y-0.5">
          {[180, 220, 160, 200, 170].map((w, i) => <SkeletonRow key={i} width={w} />)}
        </div>
      ) : (
        rootNodes.map((node, i) => (
          <TreeNodeRow
            key={node.name}
            node={node}
            depth={0}
            isLast={i === rootNodes.length - 1}
            getState={getState}
            onToggle={handleToggle}
            onNodeClick={onNodeClick}
            onNewClick={onNewClick}
            renderMeta={renderMeta}
            currency={currency}
          />
        ))
      )}
    </div>
  )
}
