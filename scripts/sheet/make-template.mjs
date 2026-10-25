/**
 * Builds google-sheets/Kunnect-Website-Content.xlsx — the Google Sheet
 * template, pre-filled with the current content in src/content.
 *
 *   npm run sheet:template
 *
 * Import it into Google Sheets (File → Import → Upload → Replace spreadsheet).
 */
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { contentToTabs } from './convert.mjs'
import { contentFiles, listTabs, settingsTabs } from './schema.mjs'

const root = process.cwd()
const out = path.join(root, 'google-sheets/Kunnect-Website-Content.xlsx')
const EXTRA_ROWS = 60 // empty, pre-formatted rows for new items

const GOLD = 'FFF2B33D'
const INK = 'FF07070B'
const IVORY = 'FFF4EFE6'
const GREY = 'FF6B6760'

const content = {}
for (const f of contentFiles) content[f] = JSON.parse(await fs.readFile(path.join(root, 'src/content', `${f}.json`), 'utf8'))
const tabs = contentToTabs(content)

const wb = new ExcelJS.Workbook()
wb.creator = 'Kunnect website'
wb.created = new Date()

// ── Start here ──────────────────────────────────────────────────────────────
const start = wb.addWorksheet('Start here', { properties: { tabColor: { argb: GOLD } } })
start.getColumn(1).width = 110
const intro = [
  ['Kunnect website content', 'title'],
  ['Everything on kunnectds.in is edited in this spreadsheet.', 'lead'],
  ['', ''],
  ['HOW TO UPDATE THE WEBSITE', 'h'],
  ['1. Edit the tabs below (only the Value column in settings tabs; any cell in list tabs).', ''],
  ['2. When you are done, click the menu  Website → Publish changes  (top of the screen).', ''],
  ['3. The website updates in about 2 minutes. If something is wrong, Netlify keeps the previous version online.', ''],
  ['', ''],
  ['TABS', 'h'],
  ['Company · Home · Pages · SEO · Colours — one row per setting. Do not change the Key column.', ''],
  [`${listTabs.map((t) => t.tab).join(' · ')} — one row per item, in the order shown on the site.`, ''],
  ['', ''],
  ['TIPS', 'h'],
  ['• Show = No hides a row without deleting it.', ''],
  ['• Placeholder = Yes marks temporary content. Company → “Hide placeholder content” = Yes removes all of it at launch.', ''],
  ['• New line inside a cell: Ctrl + Enter (Windows) or ⌘ + Enter (Mac).', ''],
  ['• Lists (benefits, budget options…): one item per line.  Paragraphs: leave an empty line between them.', ''],
  ['• Steps: one per line, written  Title: description.   Links: one per line, written  Label | https://…', ''],
  ['• Images: paste a Google Drive link (file shared as “Anyone with the link”) or any https image link.', ''],
  ['• Colours: hex codes like #F2B33D.', ''],
  ['• Only publish genuine testimonials, clients and verified numbers.', ''],
  ['', ''],
  ['Do not rename the tabs or the column headers — the website uses them to find your content.', 'warn'],
]
intro.forEach(([text, kind], i) => {
  const c = start.getCell(i + 1, 1)
  c.value = text
  c.alignment = { wrapText: true, vertical: 'middle' }
  if (kind === 'title') c.font = { bold: true, size: 20 }
  if (kind === 'lead') c.font = { size: 12, color: { argb: GREY } }
  if (kind === 'h') c.font = { bold: true, color: { argb: 'FF855300' } }
  if (kind === 'warn') c.font = { bold: true, color: { argb: 'FFB3261E' } }
})

const textCell = (cell) => {
  cell.numFmt = '@'
  cell.alignment = { wrapText: true, vertical: 'top' }
}

function styleHeader(row) {
  row.eachCell((c) => {
    c.font = { bold: true, color: { argb: INK } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }
    c.alignment = { vertical: 'middle', wrapText: true }
  })
  row.height = 22
}

function description(ws, text, cols) {
  ws.mergeCells(1, 1, 1, cols)
  const c = ws.getCell(1, 1)
  c.value = text
  c.font = { italic: true, color: { argb: GREY } }
  c.alignment = { wrapText: true, vertical: 'middle' }
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: IVORY } }
  ws.getRow(1).height = 30
}

const yesNo = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'], showErrorMessage: true, errorTitle: 'Yes or No', error: 'Please choose Yes or No.' }
const listOf = (options) => ({ type: 'list', allowBlank: true, formulae: [`"${options.join(',')}"`], showErrorMessage: true, error: `Choose one of: ${options.join(', ')}` })

// ── Settings tabs ───────────────────────────────────────────────────────────
for (const def of settingsTabs) {
  const ws = wb.addWorksheet(def.tab, { views: [{ state: 'frozen', ySplit: 2 }] })
  description(ws, def.description, 4)
  ws.columns = [{ width: 26 }, { width: 40 }, { width: 70 }, { width: 55 }]
  const rows = tabs[def.tab]
  rows.forEach((r, i) => {
    const row = ws.getRow(i + 2)
    r.forEach((v, j) => {
      const c = row.getCell(j + 1)
      c.value = v
      textCell(c)
    })
    if (i === 0) return styleHeader(row)
    const spec = def.rows[i - 1]
    row.getCell(1).font = { color: { argb: 'FF9A968E' }, size: 9 }
    row.getCell(2).font = { bold: true }
    row.getCell(4).font = { italic: true, color: { argb: GREY } }
    if (spec.type === 'bool') row.getCell(3).dataValidation = yesNo
  })
}

// ── List tabs ───────────────────────────────────────────────────────────────
for (const def of listTabs) {
  const ws = wb.addWorksheet(def.tab, { views: [{ state: 'frozen', ySplit: 2 }] })
  const cols = def.columns.length + 1
  description(ws, def.description, cols)
  ws.columns = [{ width: 9 }, ...def.columns.map((c) => ({ width: c.width ?? (c.type === 'bool' ? 13 : 24) }))]
  const rows = tabs[def.tab]
  const total = rows.length + EXTRA_ROWS
  for (let i = 0; i < total; i++) {
    const r = rows[i] ?? []
    const row = ws.getRow(i + 2)
    for (let j = 0; j < cols; j++) {
      const c = row.getCell(j + 1)
      c.value = r[j] ?? ''
      textCell(c)
      if (i === 0) continue
      const spec = j === 0 ? { type: 'bool' } : def.columns[j - 1]
      if (spec.type === 'bool') c.dataValidation = yesNo
      else if (spec.options) c.dataValidation = listOf(spec.options)
    }
    if (i === 0) {
      styleHeader(row)
      def.columns.forEach((c, j) => {
        if (c.help || c.required) row.getCell(j + 2).note = [c.required ? 'Required.' : '', c.help ?? ''].filter(Boolean).join(' ')
      })
    }
  }
}

await fs.mkdir(path.dirname(out), { recursive: true })
await wb.xlsx.writeFile(out)
console.log(`✓ Wrote ${path.relative(root, out)}`)
