import { site } from '../config/site'
import { siteUrl } from '../lib/content'
import type { PageSeo } from '../types/content'

/**
 * Per-page head tags. React 19 hoists <title>, <meta> and <link> into <head>.
 * Defaults for crawlers that do not run JavaScript are generated into
 * index.html from the same config.
 */
export function Seo({ title, description, noindex, path }: PageSeo & { path: string }) {
  const isHome = path === '/'
  const fullTitle = isHome ? title : `${title} — ${site.brand.name}`
  const url = `${siteUrl()}${path === '/' ? '/' : path}`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
    </>
  )
}
