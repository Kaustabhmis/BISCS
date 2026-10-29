/**
 * Admin panel client. Talks directly to the Google Sheet's Apps Script web app
 * (the same /exec URL the website uses). Logins and saving are handled there;
 * see google-sheets/Code.gs.
 */
import { cleanModel, modelToTabs, modelToWrite, tabsToModel } from '../../cms/model.mjs'
import { tabsToContent } from '../../scripts/sheet/convert.mjs'
import { defaultContent } from '../config/site'
import { sheetUrl } from '../lib/liveContent'

export interface AdminUser {
  username: string
  name: string
  owner: boolean
}

export interface ListItem {
  show: boolean
  cells: Record<string, string>
}

export interface Model {
  settings: Record<string, Record<string, string>>
  lists: Record<string, ListItem[]>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

const TOKEN_KEY = 'kds-admin-token'

const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}
const setToken = (t: string) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode — the login lasts until the page is closed */
  }
}

const SETUP_PROBLEM =
  'The admin panel is not connected to the Google Sheet yet. Add the Apps Script /exec URL to site-config.js (or Netlify snippet injection) and upload the site again.'

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const url = sheetUrl()
  if (!url) throw new ApiError(SETUP_PROBLEM, 503)
  let res: Response
  try {
    // text/plain keeps this a "simple" request that Apps Script accepts from the browser.
    res = await fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, action, token: getToken() }) })
  } catch {
    throw new ApiError('Could not reach the Google Sheet. Check your internet connection and try again.', 0)
  }
  let data: Record<string, unknown>
  try {
    data = await res.json()
  } catch {
    throw new ApiError('The Google Sheet did not answer correctly. Check that the Apps Script is deployed as a web app with access “Anyone”.', 502)
  }
  if (data.error === 'session') {
    setToken('')
    throw new ApiError('Your session ended. Please log in again.', 401)
  }
  if (data.error === 'conflict') throw new ApiError('The sheet was changed by someone else after you opened the editor.', 409, data)
  if (typeof data.error === 'string') throw new ApiError(data.error, 400, data)
  return data as T
}

/** Problems found by the same checks the website uses when reading the sheet. */
function contentProblems(model: Model): string[] {
  const { errors } = cleanModel(model)
  const { warnings } = tabsToContent(modelToTabs(model), defaultContent)
  return [...errors, ...warnings.filter((w: string) => !/not found|is missing/.test(w))]
}

/** Detects the real image type from the first bytes (SVG is not accepted). */
function sniffImage(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (ascii(0, 4) === 'GIF8') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'image/avif'
  return null
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export const api = {
  me: async (): Promise<{ user: AdminUser | null; setupProblem: string | null; readOnly: boolean }> => {
    if (!sheetUrl()) return { user: null, setupProblem: SETUP_PROBLEM, readOnly: false }
    if (!getToken()) return { user: null, setupProblem: null, readOnly: false }
    try {
      const { user } = await call<{ user: AdminUser }>('me')
      return { user, setupProblem: null, readOnly: false }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return { user: null, setupProblem: null, readOnly: false }
      throw e
    }
  },
  login: async (username: string, password: string) => {
    const res = await call<{ token: string; user: AdminUser }>('login', { username, password })
    setToken(res.token)
    return res
  },
  logout: async () => setToken(''),
  content: async () => {
    const data = await call<{ revision: string; tabs: Record<string, string[][]> }>('read')
    const model = tabsToModel(data.tabs) as Model
    return { revision: String(data.revision), ...model, warnings: contentProblems(model) }
  },
  save: async (revision: string, model: Model) => {
    const problems = contentProblems(model)
    if (problems.length) throw new ApiError('Some fields need attention before saving.', 422, { errors: problems })
    const { model: clean } = cleanModel(model)
    const res = await call<{ revision: string }>('write', { revision, ...modelToWrite(clean) })
    return { revision: String(res.revision), savedAt: new Date().toISOString() }
  },
  upload: async (file: File) => {
    if (file.size > 4.5 * 1024 * 1024) throw new ApiError('Images must be 4.5 MB or smaller.', 413)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const mimeType = sniffImage(bytes)
    if (!mimeType) throw new ApiError('Please upload a PNG, JPG, WebP, GIF or AVIF image.', 415)
    return call<{ url: string }>('upload', { name: file.name, mimeType, data: toBase64(bytes) })
  },
  users: () => call<{ users: (AdminUser & { createdAt: string; createdBy: string })[] }>('users'),
  addUser: (username: string, name: string, password: string) => call('addUser', { username, name, password }),
  removeUser: (username: string) => call('removeUser', { username }),
  changePassword: async (current: string, password: string) => {
    const res = await call<{ signedOut: boolean }>('changePassword', { current, password })
    setToken('')
    return res
  },
}

/** Preview URL for an image value (Google Drive links become thumbnails). */
export function previewUrl(value: string): string {
  const m = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{10,})/)
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600`
  return /^(\/(?!\/)|https:\/\/)/.test(value) ? value : ''
}
