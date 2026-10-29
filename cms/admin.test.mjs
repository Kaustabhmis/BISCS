import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { cleanModel, modelToTabs, modelToWrite, tabsToModel } from './model.mjs'
import { contentToTabs, tabsToContent } from '../scripts/sheet/convert.mjs'
import { contentFiles } from '../scripts/sheet/schema.mjs'
import { authenticate, createSession, hashPassword, sessionUser, verifyPassword } from './server/auth.mts'
import { checkMutation } from './server/http.mts'

const snapshot = Object.fromEntries(
  contentFiles.map((f) => [f, JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content', `${f}.json`), 'utf8'))]),
)

describe('admin model ⇄ sheet', () => {
  it('round-trips the website content through the admin model', () => {
    const model = tabsToModel(contentToTabs(snapshot))
    const { content, warnings } = tabsToContent(modelToTabs(model), snapshot)
    expect(warnings).toEqual([])
    expect(content).toEqual(snapshot)
  })

  it('keeps hidden rows and their values', () => {
    const model = tabsToModel(contentToTabs(snapshot))
    model.lists.Testimonials[0].show = false
    const tabs = modelToTabs(model)
    expect(tabs.Testimonials[1][0]).toBe('No')
    expect(modelToWrite(model).lists.Testimonials[0].show).toBe('No')
    expect(tabsToContent(tabs, snapshot).content.testimonials.items).toHaveLength(snapshot.testimonials.items.length - 1)
  })

  it('ignores unknown tabs and keys and limits sizes', () => {
    const model = tabsToModel(contentToTabs(snapshot))
    model.settings.Evil = { x: 'y' }
    model.settings.Company['made.up'] = 'nope'
    model.lists.Testimonials[0].cells.quote = 'x'.repeat(20_000)
    const { model: clean, errors } = cleanModel(model)
    expect(clean.settings.Evil).toBeUndefined()
    expect(clean.settings.Company['made.up']).toBeUndefined()
    expect(clean.lists.Testimonials[0].cells.quote).toHaveLength(10_000)
    expect(errors.length).toBe(1)
  })
})

describe('admin login & sessions', () => {
  beforeEach(() => {
    process.env.ADMIN_USERNAME = 'Owner@Kunnect'
    process.env.ADMIN_PASSWORD = 'correct horse battery staple'
    process.env.SESSION_SECRET = 'x'.repeat(40)
  })

  const withCookie = (token) => new Request('https://kunnectds.in/api/admin/me', { headers: { cookie: `kds_admin=${token}` } })

  it('hashes and verifies passwords', async () => {
    const { salt, hash } = await hashPassword('a long password')
    expect(await verifyPassword('a long password', salt, hash)).toBe(true)
    expect(await verifyPassword('wrong password', salt, hash)).toBe(false)
  })

  it('logs in the owner and accepts their session', async () => {
    expect(await authenticate('owner@kunnect', 'wrong')).toBeNull()
    const user = await authenticate('OWNER@kunnect', 'correct horse battery staple')
    expect(user).toMatchObject({ username: 'owner@kunnect', owner: true })
    const me = await sessionUser(withCookie(createSession(user)))
    expect(me?.username).toBe('owner@kunnect')
  })

  it('rejects tampered, expired or outdated sessions', async () => {
    const user = await authenticate('owner@kunnect', 'correct horse battery staple')
    const token = createSession(user)
    const [payload, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ u: 'owner@kunnect', v: user.version, exp: Date.now() + 1e9 })).toString('base64url')
    expect(await sessionUser(withCookie(`${forged}.${sig}`))).toBeNull()
    expect(await sessionUser(withCookie(`${payload}.${sig.slice(0, -2)}xx`))).toBeNull()
    // Changing the owner password signs everyone out.
    process.env.ADMIN_PASSWORD = 'a brand new password'
    expect(await sessionUser(withCookie(token))).toBeNull()
  })

  it('refuses to work without a strong session secret', async () => {
    process.env.SESSION_SECRET = 'short'
    expect(await authenticate('owner@kunnect', 'correct horse battery staple')).not.toBeNull()
    expect(await sessionUser(withCookie('a.b'))).toBeNull()
  })

  it('blocks cross-site and header-less writes', () => {
    const url = 'https://kunnectds.in/api/admin/content'
    expect(checkMutation(new Request(url, { method: 'PUT' }))?.status).toBe(403)
    expect(checkMutation(new Request(url, { method: 'PUT', headers: { 'x-kds-admin': '1', origin: 'https://evil.example' } }))?.status).toBe(403)
    expect(checkMutation(new Request(url, { method: 'PUT', headers: { 'x-kds-admin': '1', origin: 'https://kunnectds.in' } }))).toBeNull()
    expect(checkMutation(new Request(url))).toBeNull()
  })
})
