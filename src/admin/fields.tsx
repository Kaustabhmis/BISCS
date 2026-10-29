import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { api, previewUrl } from './api'
import { fieldProblem, HEX, hints, type FieldSpec } from './checks'

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[0.95rem] text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 disabled:bg-zinc-50'

export function Field({ spec, value, onChange, disabled }: { spec: FieldSpec; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const id = useId()
  const problem = fieldProblem(spec, value)
  const [touched, setTouched] = useState(false)
  const showProblem = problem && (touched || (value !== '' && problem !== 'Required.'))
  const help = [spec.help, hints[spec.type]].filter(Boolean).join(' ')
  const describedBy = [help && `${id}-help`, showProblem && `${id}-err`].filter(Boolean).join(' ') || undefined
  const common = { id, disabled, 'aria-invalid': showProblem ? true : undefined, 'aria-describedby': describedBy, onBlur: () => setTouched(true) }

  let control: React.ReactNode
  // Any field with fixed options (e.g. Rating 1–5) is a dropdown.
  switch (spec.options && spec.type !== 'bool' ? 'choice' : spec.type) {
    case 'bool': {
      const on = /^(yes|true|1|y)$/i.test(value.trim())
      control = (
        <button
          {...common}
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(on ? 'No' : 'Yes')}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${on ? 'bg-amber-500' : 'bg-zinc-300'}`}
        >
          <span className={`inline-block size-5 rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
          <span className="sr-only">{spec.label}</span>
        </button>
      )
      break
    }
    case 'choice':
      control = (
        <select {...common} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {spec.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {value && !spec.options?.some((o) => o.toLowerCase() === value.toLowerCase()) && <option value={value}>{value}</option>}
        </select>
      )
      break
    case 'color':
      control = (
        <div className="flex items-center gap-3">
          <input type="color" aria-label={`${spec.label} picker`} disabled={disabled} value={HEX.test(value) && value.length === 7 ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" />
          <input {...common} className={`${inputClass} max-w-40 font-mono`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#F2B33D" />
        </div>
      )
      break
    case 'image':
      control = <ImageField common={common} value={value} onChange={onChange} disabled={disabled} label={spec.label} />
      break
    case 'lines':
    case 'paragraphs':
    case 'steps':
    case 'links':
      control = <textarea {...common} className={`${inputClass} min-h-28`} rows={spec.type === 'paragraphs' ? 7 : 4} value={value} onChange={(e) => onChange(e.target.value)} />
      break
    default:
      control = spec.long ? (
        <textarea {...common} className={`${inputClass} min-h-24`} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} className={inputClass} inputMode={spec.type === 'int' ? 'numeric' : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      )
  }

  return (
    <div className={spec.type === 'bool' ? 'flex items-start justify-between gap-6' : ''}>
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-zinc-800">
          {spec.label}
          {spec.required && <span className="text-red-600"> *</span>}
        </label>
        {help && (
          <p id={`${id}-help`} className="mt-0.5 text-[0.8rem] text-zinc-500">
            {help}
          </p>
        )}
      </div>
      <div className={spec.type === 'bool' ? '' : 'mt-1.5'}>{control}</div>
      {showProblem && (
        <p id={`${id}-err`} className="mt-1 text-[0.8rem] font-medium text-red-600">
          {problem}
        </p>
      )}
    </div>
  )
}

function ImageField({
  common,
  value,
  onChange,
  disabled,
  label,
}: {
  common: Record<string, unknown>
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  label: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const preview = previewUrl(value.trim())

  const upload = async (file: File) => {
    setError('')
    if (file.size > 4 * 1024 * 1024) return setError('Images must be 4 MB or smaller.')
    setBusy(true)
    try {
      const { url } = await api.upload(file)
      onChange(url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
        {preview ? <img src={preview} alt={`${label} preview`} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" /> : <ImagePlus className="size-6 text-zinc-400" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={disabled || busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button type="button" disabled={disabled || busy} onClick={() => onChange('')} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
              <X className="size-4" aria-hidden="true" /> Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <input {...common} className={`${inputClass} text-sm`} placeholder="…or paste a Google Drive / https image link" value={value} onChange={(e) => onChange(e.target.value)} />
        {error && <p className="text-[0.8rem] font-medium text-red-600">{error}</p>}
      </div>
    </div>
  )
}
