/**
 * The admin panel's view of the Google Sheet.
 *
 *   settings: { [tab]: { [key]: value } }            settings tabs (Key → Value)
 *   lists:    { [tab]: [{ show, cells: { [header]: value } }] }   list tabs, one entry per row
 *
 * Headers are normalised (lower case, without "(…)" hints), the same way the
 * website build reads them. Every value is the text shown in the sheet.
 */
import { listTabs, settingsTabs } from '../scripts/sheet/schema.mjs'

export const norm = (h) =>
  String(h ?? '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase()

const isNo = (v) => /^(no|n|false|0)$/i.test(String(v ?? '').trim())

function table(grid, first) {
  const i = (grid ?? []).findIndex((r) => norm(r?.[0]) === first)
  return i < 0 ? null : { header: grid[i].map(norm), rows: grid.slice(i + 1) }
}

const findTab = (tabs, name) => {
  const key = Object.keys(tabs ?? {}).find((k) => norm(k) === norm(name))
  return key ? tabs[key] : undefined
}

/** Sheet tabs (as returned by the Apps Script) → admin model. */
export function tabsToModel(tabs) {
  const settings = {}
  for (const def of settingsTabs) {
    const t = table(findTab(tabs, def.tab), 'key')
    const valueCol = t ? t.header.indexOf('value') : -1
    const values = new Map((t?.rows ?? []).filter((r) => r?.[0]).map((r) => [String(r[0]).trim(), String(r[valueCol] ?? '')]))
    settings[def.tab] = Object.fromEntries(def.rows.map((row) => [row.key, values.get(row.key) ?? '']))
  }
  const lists = {}
  for (const def of listTabs) {
    const t = table(findTab(tabs, def.tab), 'show')
    lists[def.tab] = (t?.rows ?? [])
      .filter((r) => r && r.some((c) => String(c ?? '').trim()))
      .map((r) => {
        const cells = {}
        t.header.forEach((h, i) => {
          if (h && h !== 'show') cells[h] = String(r[i] ?? '')
        })
        return { show: !isNo(r[0]), cells }
      })
  }
  return { settings, lists }
}

/**
 * Admin model → sheet tabs, in the shape the website build reads (used to validate before saving).
 * @returns {Record<string, string[][]>}
 */
export function modelToTabs(model) {
  /** @type {Record<string, string[][]>} */
  const tabs = {}
  for (const def of settingsTabs) {
    const values = model.settings?.[def.tab] ?? {}
    tabs[def.tab] = [['Key', 'Setting', 'Value'], ...def.rows.map((r) => [r.key, r.label, String(values[r.key] ?? '')])]
  }
  for (const def of listTabs) {
    const headers = def.columns.map((c) => c.header)
    tabs[def.tab] = [
      ['Show', ...headers],
      ...(model.lists?.[def.tab] ?? []).map((item) => [item.show === false ? 'No' : 'Yes', ...headers.map((h) => String(item.cells?.[norm(h)] ?? ''))]),
    ]
  }
  return tabs
}

/** Admin model → the payload the Apps Script `write` action expects. */
export function modelToWrite(model) {
  const settings = {}
  for (const def of settingsTabs) {
    settings[def.tab] = Object.fromEntries(def.rows.map((r) => [r.key, String(model.settings?.[def.tab]?.[r.key] ?? '')]))
  }
  const lists = {}
  for (const def of listTabs) {
    lists[def.tab] = (model.lists?.[def.tab] ?? []).map((item) => ({ show: item.show === false ? 'No' : 'Yes', ...item.cells }))
  }
  return { settings, lists }
}

const MAX_TEXT = 10_000
const MAX_ROWS = 200

/**
 * Keeps only tabs, keys and columns the website knows about (plus extra
 * columns already in the sheet), as plain text within size limits.
 * Returns { model, errors }.
 */
export function cleanModel(input) {
  const errors = []
  const text = (v, where) => {
    const s = v == null ? '' : String(v)
    if (s.length > MAX_TEXT) errors.push(`${where} is too long.`)
    return s.slice(0, MAX_TEXT)
  }
  const settings = {}
  for (const def of settingsTabs) {
    const src = input?.settings?.[def.tab] ?? {}
    settings[def.tab] = Object.fromEntries(def.rows.map((r) => [r.key, text(src[r.key], `${def.tab} → ${r.label}`)]))
  }
  const lists = {}
  for (const def of listTabs) {
    const src = Array.isArray(input?.lists?.[def.tab]) ? input.lists[def.tab] : []
    if (src.length > MAX_ROWS) errors.push(`${def.tab} has too many rows (maximum ${MAX_ROWS}).`)
    lists[def.tab] = src.slice(0, MAX_ROWS).map((item, i) => {
      const cells = {}
      const raw = item && typeof item.cells === 'object' && item.cells ? item.cells : {}
      for (const [k, v] of Object.entries(raw).slice(0, 40)) {
        const key = norm(k)
        if (key && key !== 'show' && key.length <= 60) cells[key] = text(v, `${def.tab} row ${i + 1}`)
      }
      return { show: item?.show !== false, cells }
    })
  }
  return { model: { settings, lists }, errors }
}
