import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contentToTabs, directImageUrl, isSafeUrl, tabsToContent } from './convert.mjs'
import { contentFiles } from './schema.mjs'

const snapshot = Object.fromEntries(
  contentFiles.map((f) => [f, JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content', `${f}.json`), 'utf8'))]),
)

const tabsFor = () => contentToTabs(snapshot)

describe('sheet ⇄ content', () => {
  it('round-trips the current content without changes', () => {
    const { content, warnings } = tabsToContent(tabsFor(), snapshot)
    expect(warnings).toEqual([])
    expect(content).toEqual(snapshot)
  })

  it('hides rows with Show = No and skips rows missing required fields', () => {
    const tabs = tabsFor()
    tabs.Testimonials[1][0] = 'No'
    tabs.Testimonials.push(['Yes', '', 'Missing quote'])
    const { content, warnings } = tabsToContent(tabs, snapshot)
    expect(content.testimonials.items).toHaveLength(snapshot.testimonials.items.length - 1)
    expect(warnings.some((w) => w.includes('“Quote” is required'))).toBe(true)
  })

  it('keeps the current colour when a colour is invalid', () => {
    const tabs = tabsFor()
    const row = tabs.Colours.find((r) => r[0] === 'colour.gold')
    row[2] = 'gold'
    const { content, warnings } = tabsToContent(tabs, snapshot)
    expect(content.theme.accent).toBe(snapshot.theme.accent)
    expect(warnings[0]).toMatch(/not a hex colour/)
  })

  it('parses steps, links, choices, ratings and Drive images', () => {
    const tabs = tabsFor()
    const testimonials = [['Show', 'Quote', 'Name', 'Role', 'Company', 'Rating (1-5)', 'Project', 'Photo', 'Company logo', 'Placeholder']]
    testimonials.push(['Yes', 'Great work.', 'Asha', 'Owner', 'Rao Textiles', '5', '', 'https://drive.google.com/file/d/abcDEF1234567890/view?usp=sharing', '', 'No'])
    tabs.Testimonials = testimonials
    tabs.Team = [['Show', 'Name', 'Role', 'Bio', 'Photo', 'Links', 'Placeholder'], ['Yes', 'Ravi', 'Lead', '', '', 'LinkedIn | https://linkedin.com/in/ravi\nhttps://ravi.dev', '']]
    tabs.Clients = [['Show', 'Name', 'Logo', 'Type', 'Website', 'Placeholder'], ['Yes', 'Acme', '', 'partner', '', '']]
    const svc = tabs.Services
    const stepsCol = svc[0].indexOf('Steps')
    svc[1][stepsCol] = 'Plan: agree goals\nLaunch'
    const { content, images } = tabsToContent(tabs, snapshot)
    const t = content.testimonials.items[0]
    expect(t).toMatchObject({ quote: 'Great work.', rating: 5, portrait: { alt: 'Asha' } })
    expect(t.placeholder).toBeUndefined()
    expect(images).toContain('https://drive.google.com/uc?export=download&id=abcDEF1234567890')
    expect(content.team.items[0].links).toEqual([
      { label: 'LinkedIn', href: 'https://linkedin.com/in/ravi' },
      { label: 'ravi.dev', href: 'https://ravi.dev' },
    ])
    expect(content.brands.items[0].relationship).toBe('partner')
    expect(content.services.items[0].process).toEqual([
      { title: 'Plan', text: 'agree goals' },
      { title: 'Launch', text: '' },
    ])
  })

  it('derives service categories from the order services appear in', () => {
    const tabs = tabsFor()
    const catCol = tabs.Services[0].indexOf('Category')
    tabs.Services[1][catCol] = 'Software Solutions'
    const { content } = tabsToContent(tabs, snapshot)
    expect(content.services.categories[0]).toBe('Software Solutions')
  })

  it('keeps the current list when a tab is missing', () => {
    const tabs = tabsFor()
    delete tabs.Team
    const { content, warnings } = tabsToContent(tabs, snapshot)
    expect(content.team).toEqual(snapshot.team)
    expect(warnings).toContain('Tab “Team” not found — kept the current list.')
  })

  it('converts Google Drive share links', () => {
    expect(directImageUrl('https://drive.google.com/open?id=XYZ1234567890')).toBe('https://drive.google.com/uc?export=download&id=XYZ1234567890')
    expect(directImageUrl('/logo.webp')).toBe('/logo.webp')
  })
})

describe('link safety', () => {
  it('accepts normal links and rejects script links', () => {
    for (const ok of ['/contact', '/contact?service=seo', '#top', 'https://kunnectds.in', 'mailto:hi@kunnectds.in', 'tel:+917980871878']) expect(isSafeUrl(ok)).toBe(true)
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', '//evil.com', 'https://a b', 'vbscript:x', '']) expect(isSafeUrl(bad)).toBe(false)
  })

  it('drops unsafe links from the sheet with a warning', () => {
    const tabs = contentToTabs(snapshot)
    const row = tabs.Home.find((r) => r[0] === 'hero.button1_link')
    row[2] = 'javascript:alert(1)'
    tabs.Team = [['Show', 'Name', 'Role', 'Bio', 'Photo', 'Links', 'Placeholder'], ['Yes', 'Ravi', 'Lead', '', '', 'Bad | javascript:alert(1)\njavascript:alert(2)', '']]
    const { content, warnings } = tabsToContent(tabs, snapshot)
    expect(content.home.hero.primaryCta.href).toBe('')
    expect(content.team.items[0].links).toBeUndefined()
    expect(warnings.filter((w) => /not (a )?valid/.test(w)).length).toBeGreaterThanOrEqual(2)
  })
})
