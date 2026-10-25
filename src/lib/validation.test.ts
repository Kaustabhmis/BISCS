import { describe, expect, it } from 'vitest'
import { encodeForm, validateField, validateForm } from './validation'
import type { FormField } from '../types/content'

const email: FormField = { name: 'email', label: 'Work email', type: 'email', required: true }
const phone: FormField = { name: 'phone', label: 'Phone', type: 'tel' }
const consent: FormField = { name: 'consent', label: 'Consent', type: 'checkbox', required: true }
const select: FormField = { name: 'service', label: 'Service', type: 'select', options: ['A', 'B'] }

describe('validateField', () => {
  it('requires required fields', () => {
    expect(validateField(email, '  ')).toMatch(/enter your work email/i)
  })
  it('validates email format', () => {
    expect(validateField(email, 'nope@')).toMatch(/valid email/)
    expect(validateField(email, 'a@b.co')).toBe('')
  })
  it('allows empty optional fields but validates when filled', () => {
    expect(validateField(phone, '')).toBe('')
    expect(validateField(phone, 'abc')).toMatch(/valid phone/)
    expect(validateField(phone, '+91 98765 43210')).toBe('')
  })
  it('requires checkbox consent', () => {
    expect(validateField(consent, false)).not.toBe('')
    expect(validateField(consent, true)).toBe('')
  })
  it('rejects unknown select options', () => {
    expect(validateField(select, 'C')).not.toBe('')
    expect(validateField(select, 'A')).toBe('')
  })
  it('enforces max length', () => {
    expect(validateField({ ...phone, type: 'text', maxLength: 3 }, 'abcd')).toMatch(/under 3/)
  })
})

describe('validateForm', () => {
  it('returns only failing fields', () => {
    const errors = validateForm([email, phone, consent], { email: 'a@b.co', phone: '', consent: false })
    expect(Object.keys(errors)).toEqual(['consent'])
  })
})

describe('encodeForm', () => {
  it('url-encodes values and booleans', () => {
    expect(encodeForm({ 'form-name': 'contact', name: ' Ada ', consent: true })).toBe(
      'form-name=contact&name=Ada&consent=yes',
    )
  })
})
