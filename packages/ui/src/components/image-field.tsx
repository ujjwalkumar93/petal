"use client"

import { useRef, useState } from "react"

export interface ImageFieldProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  /**
   * Called with the selected File; must return the uploaded file URL.
   * Omit to render in read-only / URL-display mode only.
   */
  onUpload?: (file: File) => Promise<string>
}

export function ImageField({ value, onChange, disabled = false, onUpload }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setUploading(true)
    setError(null)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const canUpload = !disabled && Boolean(onUpload)

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative group inline-block">
          <img
            src={value}
            alt=""
            className="max-h-48 max-w-full rounded-lg border border-border object-contain bg-muted/20"
          />
          {canUpload && (
            <button
              type="button"
              title="Remove image"
              onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-background/90 border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:border-destructive transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {value ? "Change image" : "Upload image"}
              </>
            )}
          </button>
        </>
      )}

      {!value && !canUpload && (
        <span className="text-sm text-muted-foreground">—</span>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
