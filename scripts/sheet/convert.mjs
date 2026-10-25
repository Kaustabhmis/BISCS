/**
 * Pure conversion between Google Sheet tabs and the website's content files.
 *
 *   tabsToContent(tabs, snapshot) → { content, warnings, images }
 *   contentToTabs(content)        → { [tabName]: string[][] }   (used to build the template)
 *
 * `tabs` is what the Apps Script web app returns: { "Tab name": [[cell, …], …] }
 * with display values (exactly what you see in the sheet).
 */
import { contentFiles, listTabs, settingsTabs } from './schema.mjs'

// ── helpers ─────────────────────────────────────────────────────────────────

const clone = (v) => JSON.parse(JSON.stringify(v))

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function setPath(obj, path, value) {
  const keys = path.split('.')
  let o = obj
  for (const k of keys.slice(0, -1)) {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = {}
    o = o[k]
  }
  o[keys.at(-1)] = value
}

function deletePath(obj, path) {
  const keys = path.split('.')
  const parent = getPath(obj, keys.slice(0, -1).join('.')) ?? (keys.length === 1 ? obj : undefined)
  if (parent && typeof parent === 'object') delete parent[keys.at(-1)]
}

const norm = (h) =>
  String(h ?? '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase()

const isYes = (v) => /^(yes|y|true|1|✓|✔|x)$/i.test(String(v ?? '').trim())
const isNo = (v) => /^(no|n|false|0)$/i.test(String(v ?? '').trim())

const lines = (v) =>
  String(v ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

const paragraphs = (v) =>
  String(v ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** Turns Google Drive share links into direct download links. */
export function directImageUrl(url) {
  const s = String(url ?? '').trim()
  const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/)
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : s
}

/**
 * Parses one cell. Returns { ok, value } — `value` undefined means "empty".
 * Never throws; problems are reported through `warn`.
 */
function parseCell(raw, type, opts, warn) {
  const s = String(raw ?? '').trim()
  switch (type) {
    case 'lines':
      return lines(s)
    case 'paragraphs':
      return paragraphs(s)
    case 'bool':
      return isYes(s)
    case 'int':
    case 'number': {
      if (!s) return undefined
      const n = type === 'int' ? Number.parseInt(s, 10) : Number.parseFloat(s)
      if (Number.isNaN(n)) {
        warn(`“${s}” is not a number`)
        return undefined
      }
      return n
    }
    case 'color': {
      if (!s) return undefined
      if (!HEX.test(s)) {
        warn(`“${s}” is not a hex colour like #F2B33D`)
        return undefined
      }
      return s.toUpperCase()
    }
    case 'image':
      return s ? directImageUrl(s) : undefined
    case 'steps':
      return lines(s).map((l) => {
        const i = l.indexOf(':')
        return i > 0 ? { title: l.slice(0, i).trim(), text: l.slice(i + 1).trim() } : { title: l, text: '' }
      })
    case 'links':
      return lines(s)
        .map((l) => {
          const [a, b] = l.split('|').map((x) => x.trim())
          if (b) return { label: a, href: b }
          try {
            return { label: new URL(a).hostname.replace(/^www\./, ''), href: a }
          } catch {
            warn(`link “${l}” should look like: Label | https://…`)
            return null
          }
        })
        .filter(Boolean)
    case 'choice': {
      if (!s) return undefined
      const match = opts.options.find((o) => o.toLowerCase() === s.toLowerCase())
      if (!match) {
        warn(`“${s}” is not one of: ${opts.options.join(', ')}`)
        return undefined
      }
      return opts.keepCase ? match : match.toLowerCase()
    }
    default:
      return s || undefined
  }
}

/** Formats a value for a sheet cell (inverse of parseCell). */
function formatCell(value, type, opts = {}) {
  if (value == null) return ''
  switch (type) {
    case 'lines':
      return value.join('\n')
    case 'paragraphs':
      return value.join('\n\n')
    case 'bool':
      return value ? 'Yes' : 'No'
    case 'steps':
      return value.map((s) => (s.text ? `${s.title}: ${s.text}` : s.title)).join('\n')
    case 'links':
      return value.map((l) => `${l.label} | ${l.href}`).join('\n')
    case 'choice':
      return opts.options?.find((o) => o.toLowerCase() === String(value).toLowerCase()) ?? String(value)
    default:
      return String(value)
  }
}

/** Finds the header row (first cell "Key" or "Show") and returns { header, rows }. */
function readTable(grid, firstHeader) {
  const idx = (grid ?? []).findIndex((r) => norm(r?.[0]) === firstHeader)
  if (idx < 0) return null
  return { header: grid[idx].map(norm), rows: grid.slice(idx + 1) }
}

// ── sheet → content ─────────────────────────────────────────────────────────

/**
 * @param {Record<string, string[][]>} tabs   sheet contents
 * @param {Record<string, any>} snapshot      current src/content/*.json, used for anything missing
 */
export function tabsToContent(tabs, snapshot) {
  const content = Object.fromEntries(contentFiles.map((f) => [f, clone(snapshot[f] ?? {})]))
  const warnings = []
  const images = new Set()
  const tabNames = Object.fromEntries(Object.keys(tabs ?? {}).map((n) => [norm(n), n]))
  const findTab = (name) => tabs[tabNames[norm(name)]]

  // Settings tabs: Key | Setting | Value | Help
  for (const def of settingsTabs) {
    const table = readTable(findTab(def.tab), 'key')
    if (!table) {
      warnings.push(`Tab “${def.tab}” not found — kept the current values.`)
      continue
    }
    const valueCol = table.header.indexOf('value')
    const values = new Map(table.rows.filter((r) => r?.[0]).map((r) => [String(r[0]).trim(), r[valueCol] ?? '']))
    for (const row of def.rows) {
      if (!values.has(row.key)) {
        warnings.push(`${def.tab}: setting “${row.key}” is missing — kept the current value.`)
        continue
      }
      const v = parseCell(values.get(row.key), row.type, row, (m) => warnings.push(`${def.tab} → ${row.label}: ${m} — kept the current value.`))
      if (v === undefined) {
        // Empty optional numbers/images are removed; invalid colours keep the current value.
        if (row.type === 'int' || row.type === 'number') deletePath(content[row.file], row.path)
        else if (row.type === 'image' || row.type === 'text') setPath(content[row.file], row.path, '')
        continue
      }
      if (row.type === 'image') images.add(v)
      setPath(content[row.file], row.path, v)
    }
  }

  // List tabs: Show | columns…
  for (const def of listTabs) {
    const table = readTable(findTab(def.tab), 'show')
    if (!table) {
      warnings.push(`Tab “${def.tab}” not found — kept the current list.`)
      continue
    }
    const items = []
    table.rows.forEach((r, i) => {
      if (!r || r.every((c) => !String(c ?? '').trim())) return
      if (isNo(r[0])) return
      const rowNo = i + 1
      const item = {}
      let skip = false
      for (const c of def.columns) {
        const ci = table.header.indexOf(norm(c.header))
        const raw = ci >= 0 ? r[ci] : ''
        const v = parseCell(raw, c.type, c, (m) => warnings.push(`${def.tab} row ${rowNo} → ${c.header}: ${m}`))
        const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0) || (c.type === 'bool' && !v && !c.always)
        if (empty) {
          if (c.required) {
            warnings.push(`${def.tab} row ${rowNo}: “${c.header}” is required — row skipped.`)
            skip = true
          }
          if (c.default !== undefined) setPath(item, c.field, c.default)
          continue
        }
        if (c.type === 'image') images.add(v)
        setPath(item, c.field, v)
      }
      if (!skip) items.push(item)
    })

    // Derived fields
    if (def.tab === 'Testimonials') {
      for (const t of items) {
        if (t.portrait) t.portrait.alt = t.name
        if (t.logo) t.logo.alt = t.company || t.name
      }
    }
    if (def.tab === 'Team') for (const m of items) if (m.portrait) m.portrait.alt = m.name
    if (def.tab === 'Services') {
      if (items.length === 0) {
        warnings.push('Services: no visible services — kept the current list.')
        continue
      }
      const seen = new Set()
      for (const s of items) {
        if (s.image && !s.image.alt) s.image.alt = s.title
        const slug = s.slug || ''
        if (slug && seen.has(slug)) warnings.push(`Services: slug “${slug}” is used twice — make each one unique.`)
        seen.add(slug)
      }
      content.services.categories = [...new Set(items.map((s) => s.category))]
    }
    setPath(content[def.file], def.path, items)
  }

  return { content, warnings, images: [...images] }
}

// ── content → sheet (template) ──────────────────────────────────────────────

export function contentToTabs(content) {
  const tabs = {}
  for (const def of settingsTabs) {
    tabs[def.tab] = [
      ['Key', 'Setting', 'Value', 'Help'],
      ...def.rows.map((r) => [r.key, r.label, formatCell(getPath(content[r.file], r.path), r.type, r), r.help]),
    ]
  }
  for (const def of listTabs) {
    const items = getPath(content[def.file], def.path) ?? []
    tabs[def.tab] = [
      ['Show', ...def.columns.map((c) => c.header)],
      ...items.map((item) => ['Yes', ...def.columns.map((c) => formatCell(getPath(item, c.field), c.type, c))]),
    ]
  }
  return tabs
}
