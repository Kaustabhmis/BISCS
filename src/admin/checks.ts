import { isSafeUrl } from '../../scripts/sheet/convert.mjs'
import { norm } from '../../cms/model.mjs'
import { previewUrl, type Model } from './api'
import { listTab, settingRows, type Column, type Section, type SettingRow } from './sections'

export interface FieldSpec {
  label: string
  type: string
  help?: string
  required?: boolean
  options?: string[]
  /** Use a multi-line box for plain text. */
  long?: boolean
}

export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export const hints: Record<string, string> = {
  lines: 'One item per line.',
  paragraphs: 'Leave an empty line between paragraphs.',
  steps: 'One step per line, written “Title: description”.',
  links: 'One link per line, written “Label | https://…”.',
}

/** Problem with a value, shown under the field (the server checks everything again on save). */
export function fieldProblem(spec: FieldSpec, value: string): string | null {
  const v = value.trim()
  if (!v) return spec.required ? 'Required.' : null
  if (spec.type === 'url' && !isSafeUrl(v)) return 'Use a link like /contact, https://…, mailto:… or tel:…'
  if (spec.type === 'color' && !HEX.test(v)) return 'Use a hex colour like #F2B33D.'
  if ((spec.type === 'int' || spec.type === 'number') && !/^\d+$/.test(v)) return 'Use a whole number.'
  if (spec.type === 'image' && !previewUrl(v.startsWith('http://') ? v.replace('http://', 'https://') : v)) return 'Upload an image or paste a Google Drive / https link.'
  return null
}

const LONG_KEYS = /(intro|statement|subheadline|text|blurb|description|address|mission|vision|message|scene_description|notes)$/

export function settingSpec(row: SettingRow): FieldSpec {
  return { label: row.label, type: row.type, help: row.help || undefined, long: row.type === 'text' && LONG_KEYS.test(row.key) }
}

export function columnSpec(col: Column): FieldSpec {
  const c = col as Column & { options?: string[]; required?: boolean; width?: number; help?: string }
  return { label: c.header, type: c.type, help: c.help, required: c.required, options: c.options, long: c.type === 'text' && (c.width ?? 0) >= 45 }
}

/** Number of fields with problems in a section (for the save button and sidebar). */
export function sectionProblems(section: Section, model: Model): number {
  let n = 0
  for (const block of section.blocks) {
    if (block.kind === 'settings') {
      for (const row of settingRows(block)) if (fieldProblem(settingSpec(row), model.settings[block.tab]?.[row.key] ?? '')) n++
    } else {
      const tab = listTab(block.tab)
      for (const item of model.lists[block.tab] ?? []) {
        if (!item.show) continue
        for (const col of tab.columns) if (fieldProblem(columnSpec(col), item.cells[norm(col.header)] ?? '')) n++
      }
    }
  }
  return n
}

