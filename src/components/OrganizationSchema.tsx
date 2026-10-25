import { site } from '../config/site'
import { siteUrl } from '../lib/content'
import type { Service } from '../types/content'

/** Renders a JSON-LD block. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

function organization(): Record<string, unknown> {
  const url = siteUrl()
  const sameAs = site.socials.map((s) => s.href).filter(Boolean)
  const org: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name: site.brand.name,
    alternateName: site.brand.shortName,
    url: `${url}/`,
    logo: `${url}${site.brand.mark}`,
    slogan: site.brand.tagline,
    description: site.seo.pages.home.description,
  }
  if (site.contact.email) org.email = site.contact.email
  if (site.contact.phone) {
    org.telephone = site.contact.phone
    org.contactPoint = { '@type': 'ContactPoint', telephone: site.contact.phone, contactType: 'customer service' }
  }
  if (sameAs.length) org.sameAs = sameAs
  return org
}

/**
 * Organization + WebSite structured data for the home page. Only fields with
 * real values are included. Toggle with `site.seo.structuredData`.
 */
export function OrganizationSchema() {
  if (!site.seo.structuredData) return null
  const url = siteUrl()
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          organization(),
          { '@type': 'WebSite', '@id': `${url}/#website`, url: `${url}/`, name: site.brand.name, publisher: { '@id': `${url}/#organization` } },
        ],
      }}
    />
  )
}

/** Service + breadcrumb structured data for a service detail page. */
export function ServiceSchema({ service }: { service: Service }) {
  if (!site.seo.structuredData) return null
  const url = siteUrl()
  const pageUrl = `${url}/services/${service.slug}`
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            '@id': `${pageUrl}#service`,
            name: service.title,
            serviceType: service.title,
            category: service.category,
            description: service.intro,
            url: pageUrl,
            provider: organization(),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${url}/` },
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${url}/services` },
              { '@type': 'ListItem', position: 3, name: service.title, item: pageUrl },
            ],
          },
        ],
      }}
    />
  )
}
