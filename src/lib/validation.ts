import type { FormField } from '../types/content'

export type FormValues = Record<string, string | boolean>
export type FormErrors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\d\s.-]{6,}$/

/** Validates a single field. Returns an error message, or '' when valid. */
export function validateField(field: FormField, value: string | boolean | undefined): string {
  if (field.type === 'checkbox') {
    return field.required && value !== true ? 'Please confirm to continue.' : ''
  }
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return field.required ? `Please enter your ${field.label.toLowerCase()}.` : ''
  if (field.maxLength && text.length > field.maxLength) {
    return `Please keep this under ${field.maxLength} characters.`
  }
  if (field.type === 'email' && !EMAIL_RE.test(text)) return 'Please enter a valid email address.'
  if (field.type === 'tel' && !PHONE_RE.test(text)) return 'Please enter a valid phone number.'
  if (field.type === 'select' && field.options && !field.options.includes(text)) {
    return 'Please choose one of the options.'
  }
  return ''
}

/** Validates every field. Returns only fields that have errors. */
export function validateForm(fields: readonly FormField[], values: FormValues): FormErrors {
  const errors: FormErrors = {}
  for (const field of fields) {
    const message = validateField(field, values[field.name])
    if (message) errors[field.name] = message
  }
  return errors
}

/** URL-encodes values the way Netlify Forms expects. Booleans become "yes" / "". */
export function encodeForm(values: FormValues): string {
  return new URLSearchParams(
    Object.entries(values).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'yes' : '') : v.trim()]),
  ).toString()
}
