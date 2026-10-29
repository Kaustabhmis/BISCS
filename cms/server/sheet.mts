import { env } from './env.mts'

/** Error returned by the Google Sheet API (Apps Script). */
export class SheetError extends Error {
  constructor(
    message: string,
    readonly code: string = message,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

/** The Apps Script web-app URL and key, both taken from CONTENT_SHEET_URL (…/exec?key=…). */
export function sheetConfig(): { url: string; key: string } | null {
  const raw = env('CONTENT_SHEET_URL')
  if (!raw) return null
  try {
    const u = new URL(raw)
    const key = u.searchParams.get('key') ?? ''
    u.search = ''
    return key ? { url: u.toString(), key } : null
  } catch {
    return null
  }
}

/** Calls the sheet's Apps Script API. */
export async function sheetCall<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const cfg = sheetConfig()
  if (!cfg) throw new SheetError('The Google Sheet is not connected yet: CONTENT_SHEET_URL is missing in Netlify.', 'not_configured')
  let res: Response
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      // text/plain keeps Apps Script happy (no preflight-style handling).
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, key: cfg.key, action }),
      redirect: 'follow',
      signal: AbortSignal.timeout(28_000),
    })
  } catch {
    throw new SheetError('Could not reach the Google Sheet. Please try again.', 'unreachable')
  }
  const text = await res.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text)
  } catch {
    throw new SheetError('The Google Sheet did not answer correctly. Check the Apps Script deployment (access: Anyone).', 'bad_response')
  }
  if (typeof data.error === 'string') {
    const messages: Record<string, string> = {
      unauthorised: 'The Google Sheet refused access: the key in CONTENT_SHEET_URL must match SECRET_KEY in the Apps Script.',
      conflict: 'The sheet was changed by someone else after you opened the editor.',
      busy: 'The sheet is busy saving another change. Please try again in a moment.',
    }
    throw new SheetError(messages[data.error] ?? `Google Sheet error: ${data.error}`, data.error, data)
  }
  return data as T
}
