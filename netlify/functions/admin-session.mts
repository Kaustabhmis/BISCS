import type { Config, Context } from '@netlify/functions'
import { clearCookie, configProblem, sessionUser } from '../../cms/server/auth.mts'
import { checkMutation, json, writesAllowed, withErrors } from '../../cms/server/http.mts'

/**
 * GET  /api/admin/me      → the signed-in user (or null) and setup status
 * POST /api/admin/logout  → clears the session cookie
 */
export default withErrors(async (req: Request, context: Context) => {
  const url = new URL(req.url)
  if (url.pathname.endsWith('/logout')) {
    const blocked = checkMutation(req)
    if (blocked) return blocked
    return json({ ok: true }, 200, { 'set-cookie': clearCookie() })
  }
  const user = await sessionUser(req)
  return json({
    user: user ? { username: user.username, name: user.name, owner: user.owner } : null,
    setupProblem: configProblem(),
    readOnly: !writesAllowed(context),
  })
})

export const config: Config = { path: ['/api/admin/me', '/api/admin/logout'] }
