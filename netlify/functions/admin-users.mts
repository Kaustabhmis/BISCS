import type { Config, Context } from '@netlify/functions'
import { getUsers, hashPassword, passwordProblem, requireUser, saveUsers, verifyPassword } from '../../cms/server/auth.mts'
import { env } from '../../cms/server/env.mts'
import { checkMutation, fail, json, readJson, readOnlyResponse, writesAllowed, withErrors } from '../../cms/server/http.mts'

/**
 * GET    /api/admin/users             → admin users
 * POST   /api/admin/users             { username, name, password } → add a user
 * DELETE /api/admin/users/:username   → remove a user
 * POST   /api/admin/password          { current, password } → change your own password
 *
 * Users are stored (with hashed passwords) in the private "_Admin Users" tab
 * of the Google Sheet. The owner account comes from the ADMIN_USERNAME / ADMIN_PASSWORD
 * environment variables in Netlify; it can't be removed here and works as a
 * recovery login.
 */
const USERNAME = /^[a-z0-9._-]{3,32}$/
const MAX_USERS = 20

export default withErrors(async (req: Request, context: Context) => {
  const me = await requireUser(req)
  if (me instanceof Response) return me
  const blocked = checkMutation(req)
  if (blocked) return blocked
  const path = new URL(req.url).pathname
  const owner = env('ADMIN_USERNAME').toLowerCase()

  if (path === '/api/admin/users' && req.method === 'GET') {
    const users = await getUsers()
    return json({
      users: [
        { username: owner, name: 'Owner', owner: true, createdAt: '', createdBy: '' },
        ...users.map((u) => ({ username: u.username, name: u.name, owner: false, createdAt: u.createdAt, createdBy: u.createdBy })),
      ],
    })
  }

  if (!writesAllowed(context)) return readOnlyResponse()

  let body: Record<string, unknown> = {}
  if (req.method === 'POST') {
    try {
      body = await readJson(req, 10_000)
    } catch {
      return fail(400, 'Invalid request.')
    }
  }

  if (path === '/api/admin/users' && req.method === 'POST') {
    const username = String(body.username ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim().slice(0, 80)
    if (!USERNAME.test(username)) return fail(422, 'Usernames are 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.')
    if (!name) return fail(422, 'Please enter the person’s name.')
    const problem = passwordProblem(body.password)
    if (problem) return fail(422, `Password: ${problem}`)
    const users = await getUsers(true)
    if (username === owner || users.some((u) => u.username === username)) return fail(409, 'That username is already taken.')
    if (users.length >= MAX_USERS) return fail(422, `You can have up to ${MAX_USERS} users.`)
    const { salt, hash } = await hashPassword(String(body.password))
    users.push({ username, name, salt, hash, version: 1, createdAt: new Date().toISOString(), createdBy: me.username })
    await saveUsers(users)
    return json({ ok: true }, 201)
  }

  const del = path.match(/^\/api\/admin\/users\/([^/]+)$/)
  if (del && req.method === 'DELETE') {
    const username = decodeURIComponent(del[1]).toLowerCase()
    if (username === owner) return fail(422, 'The owner account is managed in Netlify and can’t be removed here.')
    if (username === me.username) return fail(422, 'You can’t remove your own account while logged in.')
    const users = await getUsers(true)
    if (!users.some((u) => u.username === username)) return fail(404, 'User not found.')
    await saveUsers(users.filter((u) => u.username !== username))
    return json({ ok: true })
  }

  if (path === '/api/admin/password' && req.method === 'POST') {
    if (me.owner) return fail(422, 'The owner password is set in Netlify → Environment variables (ADMIN_PASSWORD).')
    const problem = passwordProblem(body.password)
    if (problem) return fail(422, `New password: ${problem}`)
    const users = await getUsers(true)
    const user = users.find((u) => u.username === me.username)
    if (!user || !(await verifyPassword(String(body.current ?? ''), user.salt, user.hash))) return fail(401, 'Your current password is not correct.')
    Object.assign(user, await hashPassword(String(body.password)), { version: user.version + 1 })
    await saveUsers(users)
    // The version change signs out every session, including this one.
    return json({ ok: true, signedOut: true })
  }

  return fail(404, 'Not found.')
})

export const config: Config = { path: ['/api/admin/users', '/api/admin/users/:username', '/api/admin/password'] }
