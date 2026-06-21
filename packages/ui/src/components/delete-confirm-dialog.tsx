"use client"

export interface DeleteConfirmDialogProps {
  open: boolean
  doctype: string
  /** Single name or count label shown in the message */
  target: string
  deleting?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Override the dialog title. Defaults to "Delete {doctype}?" */
  title?: string
  /** Override the body message. Defaults to permanent-deletion copy. */
  description?: string
  /** Override the confirm button label. Defaults to "Delete". */
  confirmLabel?: string
  /** Override the confirm button colour classes. Defaults to red. */
  confirmClassName?: string
  /** Override the icon area colour. Defaults to red. */
  iconVariant?: "danger" | "warning"
}

export function DeleteConfirmDialog({
  open,
  doctype,
  target,
  deleting = false,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  confirmClassName,
  iconVariant = "danger",
}: DeleteConfirmDialogProps) {
  if (!open) return null

  const isDanger  = iconVariant === "danger"
  const iconBg    = isDanger ? "bg-red-50 dark:bg-red-900/20"    : "bg-amber-50 dark:bg-amber-900/20"
  const iconColor = isDanger ? "text-red-500"                     : "text-amber-500"
  const btnClass  = confirmClassName ?? (
    isDanger
      ? "h-8 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2"
      : "h-8 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 transition-colors flex items-center gap-2"
  )

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
            {isDanger ? (
              <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            ) : (
              <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">
              {title ?? `Delete ${doctype}?`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description ?? (
                <>
                  <span className="font-medium text-foreground/80">{target}</span>{" "}
                  will be permanently deleted and cannot be recovered.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className={btnClass}
          >
            {deleting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
