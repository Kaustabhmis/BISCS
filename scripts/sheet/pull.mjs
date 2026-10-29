/**
 * Pulls the website content from the Google Sheet before each build.
 *
 *   CONTENT_SHEET_URL   the Apps Script web-app URL (see google-sheets/README.md)
 *   CONTENT_SHEET_FILE  (testing) a local JSON file with the same shape
 *
 * Without either variable the build uses the content already in src/content
 * (the last snapshot), so local builds work offline.
 *
 * If the sheet is configured but can't be read, the build FAILS on purpose:
 * Netlify then keeps the current live site instead of publishing old content.
 * Problems in individual rows only skip that row and are listed as warnings.
 */
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tabsToContent } from './convert.mjs'
import { contentFiles } from './schema.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'src/content')
const uploadDir = path.join(root, 'public/uploads/sheet')
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif', 'image/avif': 'avif' }

async function loadTabs() {
  const file = process.env.CONTENT_SHEET_FILE
  if (file) return JSON.parse(await fs.readFile(path.resolve(file), 'utf8'))
  const url = process.env.CONTENT_SHEET_URL
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Google Sheet returned HTTP ${res.status}`)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Google Sheet did not return JSON. Check the web app is deployed with access “Anyone” and the URL (including ?key=) is correct.')
  }
}

/** Downloads an image into public/uploads/sheet and returns its site path. */
async function downloadImage(url) {
  const name = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16)
  const existing = (await fs.readdir(uploadDir).catch(() => [])).find((f) => f.startsWith(name + '.'))
  if (existing) return `/uploads/sheet/${existing}`
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const type = (res.headers.get('content-type') || '').split(';')[0].trim()
  const ext = EXT[type]
  if (!ext) throw new Error(`not an image (${type || 'unknown type'}) — for Google Drive, share the file as “Anyone with the link”`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('image is larger than 8 MB')
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, `${name}.${ext}`), buf)
  return `/uploads/sheet/${name}.${ext}`
}

function replaceStrings(value, map) {
  if (typeof value === 'string') return map.has(value) ? map.get(value) : value
  if (Array.isArray(value)) return value.map((v) => replaceStrings(v, map))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceStrings(v, map)]))
  return value
}

async function main() {
  if (!process.env.CONTENT_SHEET_URL && !process.env.CONTENT_SHEET_FILE) {
    console.log('ℹ No CONTENT_SHEET_URL set — building with the content in src/content.')
    return
  }
  console.log('↓ Reading website content from Google Sheets…')
  const data = await loadTabs()
  if (data?.error === 'unauthorised') throw new Error('The sheet refused access — the ?key= in CONTENT_SHEET_URL must match SECRET_KEY in the Apps Script.')
  const tabs = data?.tabs
  if (!tabs || typeof tabs !== 'object' || Object.keys(tabs).length === 0) throw new Error('The sheet returned no tabs.')

  const snapshot = {}
  for (const f of contentFiles) snapshot[f] = JSON.parse(await fs.readFile(path.join(contentDir, `${f}.json`), 'utf8'))

  const { content, warnings, images } = tabsToContent(tabs, snapshot)

  // Download remote images so they are served from the website itself.
  const map = new Map()
  for (const url of images) {
    if (!/^https?:\/\//i.test(url)) continue
    try {
      map.set(url, await downloadImage(url))
    } catch (err) {
      warnings.push(`Image ${url}: ${err.message} — image left out.`)
      map.set(url, '')
    }
  }

  for (const f of contentFiles) {
    await fs.writeFile(path.join(contentDir, `${f}.json`), JSON.stringify(replaceStrings(content[f], map), null, 2) + '\n')
  }
  console.log(`✓ Content updated from Google Sheets (${Object.keys(tabs).length} tabs, ${map.size} images).`)
  if (warnings.length) {
    console.warn(`⚠ ${warnings.length} warning(s) — fix these in the sheet:`)
    for (const w of warnings) console.warn('  - ' + w)
  }
}

main().catch((err) => {
  console.error(`✗ Could not load content from Google Sheets: ${err.message}`)
  console.error('  The build has stopped so the live website stays as it is.')
  process.exit(1)
})
