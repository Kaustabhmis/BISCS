import { site } from './site.ts'
import { staticRoutes } from './navigation.ts'
import { services } from '../data/services.ts'

/** Every page that is pre-rendered to static HTML at build time. */
export function prerenderRoutes(): string[] {
  const serviceRoutes = services
    .filter((s) => !(site.launch.hidePlaceholderContent && s.placeholder))
    .map((s) => `/services/${s.slug}`)
  return [...staticRoutes, ...serviceRoutes]
}

/** Pages listed in sitemap.xml. Legal pages are noindex until their content exists. */
export function sitemapRoutes(): string[] {
  const pendingLegal = (['privacy', 'terms'] as const).filter((k) => site.legal[k].body.length === 0).map((k) => `/${k}`)
  return prerenderRoutes().filter((r) => !pendingLegal.includes(r))
}
