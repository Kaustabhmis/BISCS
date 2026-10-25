import type { IconName, Service } from '../types/content.ts'
import servicesJson from '../content/services.json' with { type: 'json' }

/**
 * SERVICES — edited in the Google Sheet (Services tab), copied into
 * src/content/services.json at build time.
 *
 * Add, remove or reorder entries freely: the services page, the detail pages
 * (`/services/:slug`), the footer, the contact form options and the sitemap
 * all update automatically. Entries in the same `category` are grouped.
 */

type RawService = Partial<Service> & { slug: string; title: string }

/** Service groups, in display order. */
export const serviceCategories: string[] = servicesJson.categories ?? []

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Fill in defaults so an entry saved with empty lists can never break the build.
export const services: Service[] = (servicesJson.items as RawService[]).map((s) => {
  const slug = slugify(s.slug || s.title)
  return {
    placeholder: s.placeholder,
    slug,
    title: s.title,
    shortTitle: s.shortTitle || s.title,
    category: s.category || serviceCategories[0] || 'Services',
    icon: (s.icon || 'sparkles') as IconName,
    intro: s.intro ?? '',
    description: s.description ?? [],
    benefits: s.benefits ?? [],
    deliverables: s.deliverables ?? [],
    process: s.process ?? [],
    image: s.image?.src ? s.image : undefined,
    caseStudy: s.caseStudy?.title ? s.caseStudy : undefined,
    cta: s.cta?.label ? s.cta : { label: 'Discuss this service', href: `/contact?service=${slug}` },
  }
})
