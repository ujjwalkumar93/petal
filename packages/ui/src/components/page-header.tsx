import { cn } from "../lib/utils"
import type { ReactNode, HTMLAttributes } from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  /** Slot for action buttons rendered at the top-right */
  actions?: ReactNode
  /** Slot for a badge rendered next to the title */
  badge?: ReactNode
  description?: string
  /**
   * Custom link renderer — inject your framework's <Link> component.
   * Falls back to a plain <a> tag.
   *
   * @example
   * renderLink={(item, children) => <NextLink href={item.href!}>{children}</NextLink>}
   */
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  badge,
  description,
  renderLink,
  className,
  ...props
}: PageHeaderProps) {
  function buildLink(item: BreadcrumbItem) {
    const inner = (
      <span className="text-muted-foreground hover:text-foreground transition-colors">
        {item.label}
      </span>
    )
    if (renderLink) return renderLink(item, item.label)
    return item.href ? <a href={item.href}>{inner}</a> : inner
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-muted-foreground/40" aria-hidden="true">
                  /
                </span>
              )}
              {buildLink(item)}
            </span>
          ))}
          <span className="text-muted-foreground/40" aria-hidden="true">/</span>
          <span className="font-semibold text-foreground" aria-current="page">
            {title}
          </span>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-2xl font-bold text-foreground">{title}</h1>
          {badge}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
