import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { site } from '../../config/site'
import { cn } from '../../lib/cn'
import { submitNetlifyForm } from '../../lib/forms'
import { validateField, validateForm, type FormErrors, type FormValues } from '../../lib/validation'
import type { FormConfig, FormField } from '../../types/content'
import { ButtonArrow } from '../ui/Button'
import { buttonClass } from '../ui/buttonStyles'

type Status = 'idle' | 'submitting' | 'success' | 'error'

function initialValues(fields: readonly FormField[], prefill: FormValues = {}): FormValues {
  const values: FormValues = {}
  for (const f of fields) values[f.name] = f.type === 'checkbox' ? false : ''
  for (const [k, v] of Object.entries(prefill)) {
    const field = fields.find((f) => f.name === k)
    // Only accept prefills that are valid for the field (e.g. a known select option).
    if (field && (field.type !== 'select' || field.options?.includes(String(v)))) values[k] = v
  }
  return values
}

/**
 * Form backed by Netlify Forms, rendered from a `FormConfig` in site.ts.
 * - Client-side validation with inline, accessible errors.
 * - Honeypot field for spam (plus Netlify's built-in spam filtering).
 * - Success is only shown after Netlify confirms receipt.
 * - Repeat submissions are blocked while a request is in flight.
 */
export function NetlifyForm({ config, prefill }: { config: FormConfig; prefill?: FormValues }) {
  const { contact } = site
  const contactForm = config
  const fields = config.fields
  const [values, setValues] = useState<FormValues>(() => initialValues(fields, prefill))
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [honeypot, setHoneypot] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const uid = useId()

  useEffect(() => () => abortRef.current?.abort(), [])

  const update = (field: FormField, value: string | boolean) => {
    setValues((v) => ({ ...v, [field.name]: value }))
    if (touched[field.name] || errors[field.name]) {
      setErrors((e) => {
        const msg = validateField(field, value)
        const next = { ...e }
        if (msg) next[field.name] = msg
        else delete next[field.name]
        return next
      })
    }
  }

  const blur = (field: FormField) => {
    setTouched((t) => ({ ...t, [field.name]: true }))
    const msg = validateField(field, values[field.name])
    setErrors((e) => {
      const next = { ...e }
      if (msg) next[field.name] = msg
      else delete next[field.name]
      return next
    })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    const found = validateForm(fields, values)
    setErrors(found)
    setTouched(Object.fromEntries(fields.map((f) => [f.name, true])))
    const firstInvalid = fields.find((f) => found[f.name])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid.name}"]`)?.focus()
      return
    }

    setStatus('submitting')
    abortRef.current = new AbortController()
    try {
      await submitNetlifyForm(contactForm.endpoint, contactForm.name, { ...values, 'bot-field': honeypot }, abortRef.current.signal)
      setStatus('success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStatus('error')
    }
  }

  useEffect(() => {
    if (status === 'success' || status === 'error') statusRef.current?.focus()
  }, [status])

  if (status === 'success') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-3xl bg-ink p-8 text-paper outline-none md:p-12">
        <CircleCheck aria-hidden="true" className="size-10 text-accent" strokeWidth={1.5} />
        <h2 className="t-h3 mt-6">{contactForm.successTitle}</h2>
        <p className="mt-4 max-w-md text-paper/70">{contactForm.successText}</p>
        <button
          type="button"
          className={buttonClass('ghost', 'mt-8')}
          onClick={() => {
            setValues(initialValues(fields))
            setErrors({})
            setTouched({})
            setStatus('idle')
          }}
        >
          Send another message
        </button>
      </div>
    )
  }

  const submitting = status === 'submitting'
  const errorCount = Object.keys(errors).length

  return (
    <form
      ref={formRef}
      name={contactForm.name}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      noValidate
      aria-busy={submitting}
      aria-describedby={`${uid}-required`}
      className="relative"
    >
      <input type="hidden" name="form-name" value={contactForm.name} />
      {/* Honeypot: hidden from people, tempting to bots. */}
      <p className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Leave this field empty
          <input name="bot-field" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </p>

      <p id={`${uid}-required`} className="t-label mb-8 text-stone">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">with an asterisk</span> are required
      </p>

      {status === 'error' && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="mb-8 flex gap-3 rounded-2xl border border-accent-ink/40 bg-accent/10 p-5 text-ink outline-none">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" />
          <p>
            {contactForm.errorText}
            {contact.email && (
              <>
                {' '}
                You can also email us at{' '}
                <a className="font-medium underline underline-offset-4" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
                .
              </>
            )}
          </p>
        </div>
      )}

      {errorCount > 0 && status !== 'error' && Object.values(touched).some(Boolean) && (
        <p className="sr-only" role="alert">
          {errorCount === 1 ? 'There is 1 error in the form.' : `There are ${errorCount} errors in the form.`}
        </p>
      )}

      <fieldset disabled={submitting} className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        <legend className="sr-only">{config.legend}</legend>
        {fields.map((field) => {
          const id = `${uid}-${field.name}`
          const err = touched[field.name] ? errors[field.name] : undefined
          const describedBy = [err && `${id}-error`, field.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
          const common = {
            id,
            name: field.name,
            required: field.required,
            'aria-invalid': err ? true : undefined,
            'aria-describedby': describedBy,
          }

          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="sm:col-span-2">
                <label htmlFor={id} className="flex cursor-pointer items-start gap-4">
                  <input
                    {...common}
                    type="checkbox"
                    checked={values[field.name] === true}
                    onChange={(e) => update(field, e.target.checked)}
                    onBlur={() => blur(field)}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--brand-accent-ink)]"
                  />
                  <span className="text-sm text-stone">
                    {field.label}
                    {field.name === 'consent' && (
                      <>
                        {' '}
                        <Link to="/privacy" className="underline underline-offset-4 hover:text-ink">
                          Read the privacy policy
                        </Link>
                      </>
                    )}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </span>
                </label>
                {err && (
                  <p id={`${id}-error`} className="mt-2 text-sm text-accent-ink">
                    {err}
                  </p>
                )}
              </div>
            )
          }

          return (
            <div key={field.name} className={cn(!field.half && 'sm:col-span-2')}>
              <label htmlFor={id} className="t-label block text-stone">
                {field.label}
                {field.required ? <span aria-hidden="true"> *</span> : <span className="normal-case tracking-normal"> (optional)</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  {...common}
                  rows={5}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  value={values[field.name] as string}
                  onChange={(e) => update(field, e.target.value)}
                  onBlur={() => blur(field)}
                  className="field mt-1 resize-y"
                />
              ) : field.type === 'select' ? (
                <select
                  {...common}
                  value={values[field.name] as string}
                  onChange={(e) => update(field, e.target.value)}
                  onBlur={() => blur(field)}
                  className="field mt-1 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235D5F66%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_0.25rem_center] bg-no-repeat pr-8"
                >
                  <option value="">Select…</option>
                  {field.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  inputMode={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : undefined}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  value={values[field.name] as string}
                  onChange={(e) => update(field, e.target.value)}
                  onBlur={() => blur(field)}
                  className="field mt-1"
                />
              )}
              {field.hint && (
                <p id={`${id}-hint`} className="mt-2 text-sm text-stone">
                  {field.hint}
                </p>
              )}
              {err && (
                <p id={`${id}-error`} className="mt-2 text-sm text-accent-ink">
                  {err}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <button type="submit" disabled={submitting} className={buttonClass('dark')}>
          {submitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
              <span>Sending…</span>
            </>
          ) : (
            <>
              <span>{contactForm.submitLabel}</span>
              <ButtonArrow />
            </>
          )}
        </button>
        <p aria-live="polite" className="sr-only">
          {submitting ? 'Sending your enquiry' : ''}
        </p>
      </div>
    </form>
  )
}
