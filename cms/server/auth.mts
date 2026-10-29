import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { env } from './env.mts'
import { fail } from './http.mts'
import { sheetCall } from './sheet.mts'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>

export const COOKIE = 'kds_admin'
const SESSION_HOURS = 8

export interface StoredUser {
  username: string
  name: string
  salt: string
  hash: string
  /** Increments on password change; invalidates existing sessions. */
  version: number
  createdAt: string
  createdBy: string
}

export interface SessionUser {
  username: string
  name: string
  owner: boolean
  version: string
}

// Users live in the private "_Admin Users" tab of the Google Sheet. They are
// cached briefly so each admin request doesn't wait for the sheet.
let cache: { users: StoredUser[]; at: number } | null = null
const CACHE_MS = 60_000

export async function getUsers(fresh = false): Promise<StoredUser[]> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.users
  const { users } = await sheetCall<{ users: Record<string, string>[] }>('getUsers')
  const list = (users ?? [])
    .filter((u) => u.username && u.hash && u.salt)
    .map((u) => ({ username: u.username, name: u.name, salt: u.salt, hash: u.hash, version: Number(u.version) || 1, createdAt: u.createdAt, createdBy: u.createdBy }))
  cache = { users: list, at: Date.now() }
  return list
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  await sheetCall('setUsers', { users })
  cache = { users, at: Date.now() }
}

// ── Passwords ───────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return { salt: salt.toString('base64'), hash: hash.toString('base64') }
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const expected = Buffer.from(hash, 'base64')
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length || 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const digest = (s: string) => createHash('sha256').update(s).digest()

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b))
}

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 10) return 'Use at least 10 characters.'
  if (password.length > 200) return 'Use at most 200 characters.'
  return null
}

// ── The owner account (from Netlify environment variables) ─────────────────

function owner(): { username: string; password: string } | null {
  const username = env('ADMIN_USERNAME').toLowerCase()
  const password = env('ADMIN_PASSWORD')
  return username && password ? { username, password } : null
}

const ownerVersion = (password: string) => createHash('sha256').update('owner:' + password).digest('hex').slice(0, 16)

/** Returns a problem with the server configuration, or null when ready. */
export function configProblem(): string | null {
  if (env('SESSION_SECRET').length < 32) return 'The admin panel is not set up yet: SESSION_SECRET (at least 32 characters) is missing in Netlify.'
  if (!owner()) return 'The admin panel is not set up yet: ADMIN_USERNAME and ADMIN_PASSWORD are missing in Netlify.'
  return null
}

export async function authenticate(usernameRaw: unknown, passwordRaw: unknown): Promise<SessionUser | null> {
  const username = String(usernameRaw ?? '').trim().toLowerCase()
  const password = String(passwordRaw ?? '')
  const o = owner()
  if (o && safeEqual(username, o.username)) {
    return safeEqual(password, o.password) ? { username: o.username, name: 'Owner', owner: true, version: ownerVersion(o.password) } : null
  }
  const user = (await getUsers(true)).find((u) => u.username === username)
  if (!user) {
    // Spend the same time as a real check so usernames can't be probed by timing.
    await verifyPassword(password, 'AAAAAAAAAAAAAAAAAAAAAA==', 'A'.repeat(88))
    return null
  }
  return (await verifyPassword(password, user.salt, user.hash)) ? { username: user.username, name: user.name, owner: false, version: String(user.version) } : null
}

// ── Sessions (signed, HttpOnly cookie) ──────────────────────────────────────

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')

function sign(data: string): string {
  return b64url(createHmac('sha256', env('SESSION_SECRET')).update(data).digest())
}

export function createSession(user: SessionUser): string {
  const payload = b64url(JSON.stringify({ u: user.username, v: user.version, exp: Date.now() + SESSION_HOURS * 3600_000 }))
  return `${payload}.${sign(payload)}`
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

function readCookie(req: Request): string | null {
  const header = req.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === COOKIE) return v.join('=')
  }
  return null
}

/** Returns the signed-in user, or null. */
export async function sessionUser(req: Request): Promise<SessionUser | null> {
  if (configProblem()) return null
  const token = readCookie(req)
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
  let data: { u: string; v: string; exp: number }
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }
  if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null
  const o = owner()
  if (o && data.u === o.username) {
    return data.v === ownerVersion(o.password) ? { username: o.username, name: 'Owner', owner: true, version: data.v } : null
  }
  const user = (await getUsers()).find((u) => u.username === data.u)
  return user && String(user.version) === data.v ? { username: user.username, name: user.name, owner: false, version: data.v } : null
}

/** For handlers: the signed-in user, or a 401 response. */
export async function requireUser(req: Request): Promise<SessionUser | Response> {
  const problem = configProblem()
  if (problem) return fail(503, problem)
  return (await sessionUser(req)) ?? fail(401, 'Please log in.')
}
