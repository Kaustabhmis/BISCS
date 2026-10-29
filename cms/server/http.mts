import type { Context } from '@netlify/functions'
import { SheetError } from './sheet.mts'

const BASE_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, 'content-type': 'application/json; charset=utf-8', ...headers } })
}

export function fail(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status)
}

/**
 * Cross-site request protection for state-changing requests: the session
 * cookie is SameSite=Strict, and the admin panel must also send a custom
 * header (which other sites cannot add without a CORS preflight we never
 * allow) and, when present, a same-origin Origin header.
 */
export function checkMutation(req: Request): Response | null {
  if (req.method === 'GET' || req.method === 'HEAD') return null
  if (req.headers.get('x-kds-admin') !== '1') return fail(403, 'Missing admin request header.')
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return fail(403, 'Cross-site request blocked.')
  return null
}

/**
 * The content store is shared by every deploy (production, previews, branch
 * deploys). Only the production site and local development may change it,
 * so testing a preview can never overwrite the live content.
 */
export function writesAllowed(context: Context): boolean {
  const c = context?.deploy?.context
  return !c || c === 'production' || c === 'dev'
}

export function readOnlyResponse(): Response {
  return fail(403, 'This is a preview deploy. Make changes on the live site’s admin panel.')
}

export async function readJson<T>(req: Request, maxBytes = 1_000_000): Promise<T> {
  const text = await req.text()
  if (text.length > maxBytes) throw new Error('Request is too large.')
  return JSON.parse(text) as T
}

/** Wraps a handler so Google Sheet problems and unexpected errors become clear JSON messages. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof SheetError) {
        const status = err.code === 'conflict' ? 409 : err.code === 'not_configured' ? 503 : 502
        return fail(status, err.message, { code: err.code })
      }
      console.error(err)
      return fail(500, 'Something went wrong. Please try again.')
    }
  }
}
