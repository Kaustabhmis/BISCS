import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { cleanModel, modelToTabs, modelToWrite, tabsToModel } from './model.mjs'
import { contentToTabs, tabsToContent } from '../scripts/sheet/convert.mjs'
import { contentFiles } from '../scripts/sheet/schema.mjs'

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
    expect(modelToTabs(model).Testimonials[1][0]).toBe('No')
    expect(modelToWrite(model).lists.Testimonials[0].show).toBe('No')
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
