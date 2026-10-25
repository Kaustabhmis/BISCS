import { site } from '../config/site'
import type { Placeholderable } from '../types/content'

/** Removes placeholder items once `site.launch.hidePlaceholderContent` is enabled. */
export function visible<T extends Placeholderable>(items: readonly T[]): T[] {
  return site.launch.hidePlaceholderContent ? items.filter((i) => !i.placeholder) : [...items]
}

/** True when a single placeholder item should still be shown. */
export function isShown(item: Placeholderable): boolean {
  return !(site.launch.hidePlaceholderContent && item.placeholder)
}

/** Canonical site origin, without a trailing slash. */
export function siteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined
  return (fromEnv || site.seo.siteUrl).replace(/\/$/, '')
}

export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
}

/** Splits `text` around `emphasis` so the emphasised phrase can be styled separately. */
export function splitEmphasis(text: string, emphasis: string): [string, string, string] {
  const i = emphasis ? text.indexOf(emphasis) : -1
  if (i < 0) return [text, '', '']
  return [text.slice(0, i), emphasis, text.slice(i + emphasis.length)]
}
