/** Small client for the admin API (Netlify Functions under /api/admin). */

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

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'x-kds-admin': '1', ...(body instanceof FormData ? {} : body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection.', 0)
  }
  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON response */
  }
  if (!res.ok) {
    const message = res.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : String(data.error ?? `Request failed (${res.status}).`)
    throw new ApiError(message, res.status, data)
  }
  return data as T
}

export const api = {
  me: () => request<{ user: AdminUser | null; setupProblem: string | null; readOnly: boolean }>('GET', '/api/admin/me'),
  login: (username: string, password: string) => request<{ user: AdminUser }>('POST', '/api/admin/login', { username, password }),
  logout: () => request('POST', '/api/admin/logout'),
  content: () => request<Model & { revision: string; warnings: string[] }>('GET', '/api/admin/content'),
  save: (revision: string, model: Model) => request<{ revision: string; publishing: boolean; savedAt: string }>('PUT', '/api/admin/content', { revision, ...model }),
  publish: () => request<{ publishing: boolean }>('POST', '/api/admin/publish'),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string }>('POST', '/api/admin/upload', form)
  },
  users: () => request<{ users: (AdminUser & { createdAt: string; createdBy: string })[] }>('GET', '/api/admin/users'),
  addUser: (username: string, name: string, password: string) => request('POST', '/api/admin/users', { username, name, password }),
  removeUser: (username: string) => request('DELETE', `/api/admin/users/${encodeURIComponent(username)}`),
  changePassword: (current: string, password: string) => request<{ signedOut: boolean }>('POST', '/api/admin/password', { current, password }),
}

/** Preview URL for an image value (Google Drive links become thumbnails). */
export function previewUrl(value: string): string {
  const m = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/)
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600`
  return /^(\/(?!\/)|https:\/\/)/.test(value) ? value : ''
}
