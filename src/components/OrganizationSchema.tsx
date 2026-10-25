import { site } from '../config/site'
import { siteUrl } from '../lib/content'

/**
 * Organization structured data. Rendered only when `site.seo.structuredData`
 * is enabled, and only with fields that have real values.
 */
export function OrganizationSchema() {
  if (!site.seo.structuredData) return null
  const url = siteUrl()
  const sameAs = site.socials.map((s) => s.href).filter(Boolean)
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.brand.name,
    url: `${url}/`,
    logo: `${url}${site.brand.mark}`,
  }
  if (site.contact.email) data.email = site.contact.email
  if (site.contact.phone) data.telephone = site.contact.phone
  if (sameAs.length) data.sameAs = sameAs
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
