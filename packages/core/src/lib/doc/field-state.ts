// One place that decides whether a form field is visible, read-only and
// mandatory, used by both rendering (SectionBlock) and save validation
// (missingRequired), so the two can't disagree. Semantics follow Desk:
// frappe/public/js/frappe/form/layout.js (evaluate_depends_on_value,
// refresh_dependency) and form/save.js (is_docfield_mandatory).

export interface FieldStateInput {
  fieldname: string
  reqd?: 0 | 1
  read_only?: 0 | 1
  depends_on?: string
  mandatory_depends_on?: string
  read_only_depends_on?: string
  /** Petal extension: hide while the expression is true. */
  hidden_depends_on?: string
}

/** App-level overrides from the `field_behaviors` hook. */
export interface FieldStateBehavior {
  hidden?: boolean
  read_only?: boolean
}

export interface FieldState {
  visible: boolean
  readOnly: boolean
  mandatory: boolean
}

type Doc = Record<string, unknown>

const warned = new Set<string>()

/**
 * Evaluate a depends_on-style expression against `doc`.
 * - "eval:<js>" runs with `doc` and `parent` in scope (parent defaults to doc,
 *   as for a main form in Desk)
 * - a bare fieldname means "that field has a value"; an empty table has none
 * - no expression means no condition: true
 * Returns null when the expression throws, so each caller picks a safe fallback.
 */
export function evalDependsOn(expression: string | undefined, doc: Doc, parent: Doc = doc): boolean | null {
  if (!expression) return true
  if (!expression.startsWith("eval:")) {
    const value = doc[expression]
    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  }
  try {
    return Boolean(new Function("doc", "parent", `return (${expression.slice(5)})`)(doc, parent))
  } catch (e) {
    if (!warned.has(expression)) {
      warned.add(expression)
      console.warn(`[Petal] invalid depends_on expression ${JSON.stringify(expression)}:`, e)
    }
    return null
  }
}

/**
 * Current state of one field. A broken expression never hides a field, never
 * locks it, and leaves mandatory to the static `reqd` (Desk would throw).
 * Statically hidden fields are dropped earlier, by parseLayout.
 */
export function fieldState(field: FieldStateInput, doc: Doc, behavior: FieldStateBehavior = {}, parent: Doc = doc): FieldState {
  const visible =
    !behavior.hidden &&
    !(field.hidden_depends_on && evalDependsOn(field.hidden_depends_on, doc, parent) === true) &&
    evalDependsOn(field.depends_on, doc, parent) !== false

  const readOnly =
    Boolean(behavior.read_only) ||
    field.read_only === 1 ||
    (Boolean(field.read_only_depends_on) && evalDependsOn(field.read_only_depends_on, doc, parent) === true)

  // When set, mandatory_depends_on alone decides (it overrides reqd in Desk).
  const conditional = field.mandatory_depends_on ? evalDependsOn(field.mandatory_depends_on, doc, parent) : null
  const mandatory = conditional ?? field.reqd === 1

  return { visible, readOnly, mandatory }
}
