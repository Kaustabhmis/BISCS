import type { Config, Context } from '@netlify/functions'
import { authenticate, configProblem, createSession, sessionCookie } from '../../cms/server/auth.mts'
import { checkMutation, fail, json, readJson, withErrors } from '../../cms/server/http.mts'

/** POST /api/admin/login  { username, password } → sets the session cookie. */
export default withErrors(async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed.')
  const blocked = checkMutation(req)
  if (blocked) return blocked
  const problem = configProblem()
  if (problem) return fail(503, problem)

  let body: { username?: unknown; password?: unknown }
  try {
    body = await readJson(req, 10_000)
  } catch {
    return fail(400, 'Invalid request.')
  }
  const user = await authenticate(body.username, body.password)
  if (!user) return fail(401, 'Wrong username or password.')
  return json({ user: { username: user.username, name: user.name, owner: user.owner } }, 200, { 'set-cookie': sessionCookie(createSession(user)) })
})

export const config: Config = {
  path: '/api/admin/login',
  // Slows down password guessing: at most 8 attempts per minute per visitor.
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowSize: 60, windowLimit: 8 },
}
