import type { Config, Context } from '@netlify/functions'
import { requireUser } from '../../cms/server/auth.mts'
import { checkMutation, fail, json, readOnlyResponse, withErrors, writesAllowed } from '../../cms/server/http.mts'
import { sheetCall } from '../../cms/server/sheet.mts'

const MAX_BYTES = 4 * 1024 * 1024
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' }

/** Detects the real image type from the first bytes (never trusts the file name). SVG is not accepted. */
function sniff(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (ascii(0, 4) === 'GIF8') return 'gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'avif'
  return null
}

/**
 * POST /api/admin/upload (multipart field "file") → stores the image in the
 * sheet owner's Google Drive (folder "Kunnect website images", shared as
 * "anyone with the link") and returns its link for use in the content.
 */
export default withErrors(async (req: Request, context: Context) => {
  const user = await requireUser(req)
  if (user instanceof Response) return user
  if (req.method !== 'POST') return fail(405, 'Method not allowed.')
  const blocked = checkMutation(req)
  if (blocked) return blocked
  if (!writesAllowed(context)) return readOnlyResponse()

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES + 64_000) return fail(413, 'Images must be 4 MB or smaller.')
  let file: File | null
  try {
    file = (await req.formData()).get('file') as File | null
  } catch {
    return fail(400, 'Invalid upload.')
  }
  if (!file || typeof file === 'string') return fail(400, 'No file received.')
  if (file.size > MAX_BYTES) return fail(413, 'Images must be 4 MB or smaller.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const ext = sniff(bytes)
  if (!ext) return fail(415, 'Please upload a PNG, JPG, WebP, GIF or AVIF image.')

  const base = String(file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w .()-]/g, '').slice(0, 80) || 'image'
  const result = await sheetCall<{ id: string; url: string }>('upload', {
    name: `${base}.${ext}`,
    mimeType: MIME[ext],
    data: Buffer.from(bytes).toString('base64'),
  })
  return json({ url: result.url, id: result.id }, 201)
})

export const config: Config = { path: '/api/admin/upload' }
