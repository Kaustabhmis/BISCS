import { tabsToContent } from '../../scripts/sheet/convert.mjs'
import { defaultContent, replaceSiteContent, site, type ContentFiles } from '../config/site'

/**
 * Live content from the Google Sheet.
 *
 * The pages ship with a copy of the content (pre-rendered, good for SEO and
 * instant first paint). In the browser we then fetch the current sheet from
 * the Apps Script web app and swap it in. The result is cached in the
 * browser for a minute so navigating and repeat visits stay fast and the
 * sheet isn't asked too often.
 *
 * The sheet URL comes from `window.KUNNECT_SHEET_URL`, set in /site-config.js
 * or with Netlify's snippet injection (see google-sheets/README.md).
 */

const CACHE_KEY = 'kds-live-content-v1'
const REFRESH_MS = 60_000

let version = 0
const listeners = new Set<() => void>()

export function subscribeContent(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const contentVersion = () => version

/** The Apps Script web-app URL, if one is configured (must be a script.google.com URL). */
export function sheetUrl(): string {
  const raw = (window as { KUNNECT_SHEET_URL?: unknown }).KUNNECT_SHEET_URL
  if (typeof raw !== 'string' || !raw.trim()) return ''
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'https:' && u.hostname === 'script.google.com' && /\/exec$/.test(u.pathname) ? `${u.origin}${u.pathname}` : ''
  } catch {
    return ''
  }
}

/** Google Drive images: use Drive's image endpoint, which works as an <img> for files shared "anyone with the link". */
function driveImages<T>(value: T): T {
  if (typeof value === 'string') {
    const m = value.match(/^https:\/\/drive\.google\.com\/uc\?export=download&id=([\w-]+)$/)
    return (m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : value) as T
  }
  if (Array.isArray(value)) return value.map(driveImages) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, driveImages(v)])) as T
  return value
}

const THEME_VARS: Record<string, keyof typeof site.colors> = {
  '--brand-ink': 'ink',
  '--brand-ink-raised': 'inkRaised',
  '--brand-paper': 'paper',
  '--brand-paper-deep': 'paperDeep',
  '--brand-ash': 'ash',
  '--brand-stone': 'stone',
  '--brand-accent': 'accent',
  '--brand-accent-ink': 'accentInk',
  '--brand-signal': 'signal',
  '--brand-gold-light': 'goldLight',
  '--brand-gold-deep': 'goldDeep',
}

function apply(tabs: Record<string, string[][]>): void {
  const { content } = tabsToContent(tabs, defaultContent)
  replaceSiteContent(driveImages(content) as ContentFiles)
  const root = document.documentElement
  for (const [cssVar, key] of Object.entries(THEME_VARS)) if (site.colors[key]) root.style.setProperty(cssVar, site.colors[key])
  version++
  listeners.forEach((fn) => fn())
}

interface Cached {
  revision: string
  tabs: Record<string, string[][]>
  at: number
}

function readCache(): Cached | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null
    return c && typeof c.tabs === 'object' ? c : null
  } catch {
    return null
  }
}

function writeCache(c: Cached): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c))
  } catch {
    /* storage full or blocked — the site still works */
  }
}

let started = false

/** Loads live content once per page load. Safe to call repeatedly. */
export async function loadLiveContent(): Promise<void> {
  const url = sheetUrl()
  if (!url || started) return
  started = true

  const cached = readCache()
  if (cached) apply(cached.tabs)
  if (cached && Date.now() - cached.at < REFRESH_MS) return

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const data = (await res.json()) as { revision?: unknown; tabs?: unknown }
    if (!data || typeof data.tabs !== 'object' || data.tabs === null) return
    const revision = String(data.revision ?? '')
    const tabs = data.tabs as Record<string, string[][]>
    if (!cached || cached.revision !== revision) apply(tabs)
    writeCache({ revision, tabs, at: Date.now() })
  } catch (err) {
    console.warn('Live content could not be loaded; showing the built-in content.', err)
  }
}
