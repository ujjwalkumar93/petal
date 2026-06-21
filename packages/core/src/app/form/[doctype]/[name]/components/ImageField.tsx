"use client"
import { getFrappeClient } from "@/hooks/useFrappe"
import { ImageField as ImageFieldUI } from "@petal/ui"

export function ImageField({ value, onChange, disabled = false }: {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  return (
    <ImageFieldUI
      value={value}
      onChange={onChange}
      disabled={disabled}
      onUpload={(file) => getFrappeClient().uploadFile(file)}
    />
  )
}
