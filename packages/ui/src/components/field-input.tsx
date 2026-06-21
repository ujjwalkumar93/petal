"use client"

import { DatePicker } from "./date-picker"
import { DateTimePicker } from "./datetime-picker"
import { LinkField, type LinkFieldOption } from "./link-field"
import { CheckField } from "./check-field"
import { SelectField } from "./select-field"
import { RatingField } from "./rating-field"
import { ColorField } from "./color-field"
import { AttachField } from "./attach-field"
import { cn } from "../lib/utils"

const BASE_INPUT =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"

const BASE_TEXTAREA =
  "w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"

export interface FieldInputProps {
  /** Frappe fieldtype string */
  fieldtype: string
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean

  // ---- Link field ----
  /** Linked doctype name (required when fieldtype === "Link") */
  linkedDoctype?: string
  /** Search callback for Link fields. Must return matching options. */
  onLinkSearch?: (query: string) => Promise<LinkFieldOption[]>
  /** Called when "Create new" is clicked in the Link dropdown. Omit to hide the option. */
  onLinkCreateNew?: () => void

  // ---- Select field ----
  /**
   * Options for Select fields.
   * Accepts Frappe's newline-separated string ("Draft\nOpen\nClosed") or a string array.
   */
  options?: string | string[]

  // ---- Common ----
  placeholder?: string
  id?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Universal input dispatcher that renders the correct widget for any Frappe fieldtype.
 *
 * Supported fieldtypes: Data, Link, Select, Check, Date, Datetime, Time, Int, Float,
 * Currency, Percent, Password, Color, Rating, Attach, Attach Image,
 * Small Text, Text, Long Text, Text Editor (falls back to <input type="text">).
 *
 * @example
 * <FieldInput
 *   fieldtype={field.fieldtype}
 *   value={doc[field.fieldname]}
 *   onChange={(v) => setField(field.fieldname, v)}
 *   options={field.options}
 *   linkedDoctype={field.options}
 *   onLinkSearch={(q) => frappe.searchLink(field.options, q)}
 * />
 */
export function FieldInput({
  fieldtype,
  value,
  onChange,
  disabled = false,
  linkedDoctype,
  onLinkSearch,
  onLinkCreateNew,
  options,
  placeholder,
  id,
  className,
  style,
}: FieldInputProps) {
  const str = value == null ? "" : String(value)

  // Helpers — only spread a prop if it has a defined value (exactOptionalPropertyTypes)
  const withId        = id        !== undefined ? { id }        : {}
  const withClass     = className !== undefined ? { className } : {}
  const withStyle     = style     !== undefined ? { style }     : {}
  const withPH        = placeholder !== undefined ? { placeholder } : {}

  switch (fieldtype) {
    case "Link":
      return (
        <LinkField
          value={str}
          onChange={onChange}
          onSearch={onLinkSearch ?? (() => Promise.resolve([]))}
          disabled={disabled}
          {...(onLinkCreateNew !== undefined && { onCreateNew: onLinkCreateNew })}
          {...(linkedDoctype   !== undefined && { createLabel: linkedDoctype })}
          {...withId}
          {...withPH}
          {...withClass}
          {...withStyle}
        />
      )

    case "Select":
      return (
        <SelectField
          value={str}
          onChange={onChange}
          options={options ?? ""}
          disabled={disabled}
          {...withId}
          {...withPH}
          {...withClass}
          {...withStyle}
        />
      )

    case "Check":
      return (
        <CheckField
          value={value as number | boolean}
          onChange={onChange as (v: 0 | 1) => void}
          disabled={disabled}
          {...withId}
          {...withClass}
        />
      )

    case "Date":
      return (
        <DatePicker
          value={str}
          onChange={onChange}
          disabled={disabled}
          {...withId}
          {...withPH}
          {...withClass}
        />
      )

    case "Datetime":
      return (
        <DateTimePicker
          value={str}
          onChange={onChange}
          disabled={disabled}
          {...withId}
          {...withClass}
          {...withStyle}
        />
      )

    case "Time":
      return (
        <input
          type="time"
          value={str}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withStyle}
          className={cn(BASE_INPUT, className)}
        />
      )

    case "Int":
      return (
        <input
          type="number"
          step="1"
          value={str}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          {...withId}
          {...withStyle}
          className={cn(
            BASE_INPUT,
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
          )}
        />
      )

    case "Float":
    case "Currency":
    case "Percent":
      return (
        <input
          type="number"
          step="any"
          value={str}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          {...withId}
          {...withStyle}
          className={cn(
            BASE_INPUT,
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
          )}
        />
      )

    case "Password":
      return (
        <input
          type="password"
          value={str}
          disabled={disabled}
          placeholder={placeholder ?? "••••••••"}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withStyle}
          className={cn(BASE_INPUT, className)}
        />
      )

    case "Color":
      return (
        <ColorField
          value={str}
          onChange={onChange}
          disabled={disabled}
          {...withId}
          {...withClass}
        />
      )

    case "Rating":
      return (
        <RatingField
          value={Number(value) || 0}
          onChange={onChange as (v: number) => void}
          disabled={disabled}
          {...withClass}
        />
      )

    case "Attach":
    case "Attach Image":
      return (
        <AttachField
          value={str}
          onChange={onChange}
          disabled={disabled}
          {...withId}
          {...withPH}
          {...withClass}
        />
      )

    case "Small Text":
      return (
        <textarea
          value={str}
          rows={2}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withPH}
          {...withStyle}
          className={cn(BASE_TEXTAREA, className)}
        />
      )

    case "Text":
    case "Long Text":
    case "Text Editor":
      return (
        <textarea
          value={str}
          rows={4}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withPH}
          {...withStyle}
          className={cn(BASE_TEXTAREA, className)}
        />
      )

    case "Code":
      return (
        <textarea
          value={str}
          rows={8}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withPH}
          {...withStyle}
          className={cn(BASE_TEXTAREA, "font-mono text-xs", className)}
        />
      )

    default:
      return (
        <input
          type="text"
          value={str}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...withId}
          {...withPH}
          {...withStyle}
          className={cn(BASE_INPUT, className)}
        />
      )
  }
}
