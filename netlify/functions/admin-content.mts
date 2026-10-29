import type { Config, Context } from '@netlify/functions'
import { requireUser } from '../../cms/server/auth.mts'
import { checkMutation, fail, json, readJson, readOnlyResponse, withErrors, writesAllowed } from '../../cms/server/http.mts'
import { sheetCall } from '../../cms/server/sheet.mts'
import { cleanModel, modelToTabs, modelToWrite, tabsToModel } from '../../cms/model.mjs'
import { tabsToContent } from '../../scripts/sheet/convert.mjs'
import { env } from '../../cms/server/env.mts'
import about from '../../src/content/about.json' with { type: 'json' }
import brands from '../../src/content/brands.json' with { type: 'json' }
import company from '../../src/content/company.json' with { type: 'json' }
import home from '../../src/content/home.json' with { type: 'json' }
import pages from '../../src/content/pages.json' with { type: 'json' }
import seo from '../../src/content/seo.json' with { type: 'json' }
import services from '../../src/content/services.json' with { type: 'json' }
import team from '../../src/content/team.json' with { type: 'json' }
import testimonials from '../../src/content/testimonials.json' with { type: 'json' }
import theme from '../../src/content/theme.json' with { type: 'json' }

const snapshot: Record<string, unknown> = { about, brands, company, home, pages, seo, services, team, testimonials, theme }

/** Checks content exactly the way the website build will read it. */
function problems(tabs: Record<string, string[][]>): string[] {
  return tabsToContent(tabs, snapshot).warnings.filter((w: string) => !/not found|is missing/.test(w))
}

/** Asks Netlify to rebuild the site. Returns false when no build hook is configured. */
async function publish(by: string): Promise<boolean> {
  const hook = env('NETLIFY_BUILD_HOOK')
  if (!/^https:\/\/api\.netlify\.com\/build_hooks\/[\w-]+$/.test(hook)) return false
  const res = await fetch(`${hook}?trigger_title=${encodeURIComponent(`Admin panel: content updated by ${by}`)}`, { method: 'POST' })
  return res.ok
}

/**
 * GET  /api/admin/content                         → sheet content as editable forms
 * PUT  /api/admin/content  { revision, settings, lists } → validate, save to the sheet, publish
 * POST /api/admin/publish                         → rebuild the site without changes
 */
export default withErrors(async (req: Request, context: Context) => {
  const user = await requireUser(req)
  if (user instanceof Response) return user
  const blocked = checkMutation(req)
  if (blocked) return blocked
  const path = new URL(req.url).pathname

  if (path === '/api/admin/content' && req.method === 'GET') {
    const data = await sheetCall<{ revision: string; tabs: Record<string, string[][]> }>('read')
    const model = tabsToModel(data.tabs)
    return json({ revision: data.revision, ...model, warnings: problems(modelToTabs(model)) })
  }

  if (!writesAllowed(context)) return readOnlyResponse()

  if (path === '/api/admin/content' && req.method === 'PUT') {
    let body: { revision?: string; settings?: unknown; lists?: unknown }
    try {
      body = await readJson(req, 3_000_000)
    } catch {
      return fail(400, 'Invalid request.')
    }
    const { model, errors } = cleanModel(body)
    const found = [...errors, ...problems(modelToTabs(model))]
    if (found.length) return fail(422, 'Some fields need attention before saving.', { errors: found })
    const saved = await sheetCall<{ revision: string }>('write', { revision: String(body.revision ?? ''), ...modelToWrite(model) })
    const publishing = await publish(user.username)
    return json({ revision: saved.revision, publishing, savedAt: new Date().toISOString() })
  }

  if (path === '/api/admin/publish' && req.method === 'POST') {
    const publishing = await publish(user.username)
    return publishing ? json({ publishing }) : fail(503, 'Publishing is not set up yet: NETLIFY_BUILD_HOOK is missing in Netlify.')
  }

  return fail(404, 'Not found.')
})

export const config: Config = { path: ['/api/admin/content', '/api/admin/publish'] }
