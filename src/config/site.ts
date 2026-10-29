import type {
  Achievement,
  BrandColors,
  BrandTypography,
  Cta,
  Differentiator,
  FormConfig,
  Milestone,
  PageSeo,
  Placeholderable,
  SocialLink,
  Stat,
  TeamMember,
} from '../types/content.ts'
import { services, setServices } from '../data/services.ts'
import { setBrands } from '../data/brands.ts'
import { setTestimonials } from '../data/testimonials.ts'
import aboutJson from '../content/about.json' with { type: 'json' }
import brandsJson from '../content/brands.json' with { type: 'json' }
import servicesJson from '../content/services.json' with { type: 'json' }
import testimonialsJson from '../content/testimonials.json' with { type: 'json' }
import companyJson from '../content/company.json' with { type: 'json' }
import homeJson from '../content/home.json' with { type: 'json' }
import pagesJson from '../content/pages.json' with { type: 'json' }
import seoJson from '../content/seo.json' with { type: 'json' }
import teamJson from '../content/team.json' with { type: 'json' }
import themeJson from '../content/theme.json' with { type: 'json' }

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Editable content lives in the Google Sheet (see google-sheets/README.md).
 *  `src/content/*.json` holds a copy that ships with the website (used for the
 *  pre-rendered pages and whenever the sheet can't be reached). When the live
 *  sheet content arrives in the browser, `replaceSiteContent()` swaps it in.
 *
 *  This file assembles the content into one typed object and adds the
 *  technical settings editors don't need to touch (fonts, form fields).
 *
 *  Items marked `placeholder: true` are temporary and are removed when
 *  "Hide placeholder content" (launch.hidePlaceholderContent) is switched on.
 *
 *  This file must stay plain data (no React, no browser APIs): it is also read
 *  at build time by `scripts/vite-site-plugin.ts` and the pre-renderer.
 */

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

/** Font stacks. To change fonts, update these and the imports in `src/main.tsx`. */
const typography: BrandTypography = {
  display: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  serif: "'Instrument Serif', ui-serif, Georgia, serif",
  body: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
}

/** The content files the site is built from. */
export const defaultContent = {
  about: aboutJson,
  brands: brandsJson,
  company: companyJson,
  home: homeJson,
  pages: pagesJson,
  seo: seoJson,
  services: servicesJson,
  team: teamJson,
  testimonials: testimonialsJson,
  theme: themeJson,
}

export type ContentFiles = typeof defaultContent

function buildSite(c: ContentFiles) {
  // ── Identity ────────────────────────────────────────────────────────────────

  const brand = {
    name: c.company.brand.name,
    shortName: c.company.brand.shortName,
    wordmarkSuffix: str(c.company.brand.wordmarkSuffix),
    /** Logo (Google Sheet → Company). Leave empty to fall back to a typographic wordmark. */
    logo: c.company.brand.logo as { src: string; width?: number; height?: number },
    tagline: c.company.brand.tagline,
    /** Square brand mark (the circuit head), used for icons and structured data. */
    mark: '/logo-mark.png',
    favicon: '/favicon.png',
    appleTouchIcon: '/apple-touch-icon.png',
  }

  /** Brand colours (Google Sheet → Colours). */
  const colors: BrandColors = { ...c.theme }

  const launch = { hidePlaceholderContent: Boolean(c.company.launch.hidePlaceholderContent) }

  // ── Home ────────────────────────────────────────────────────────────────────

  const hero = {
    ...c.home.hero,
    primaryCta: c.home.hero.primaryCta as Cta,
    secondaryCta: c.home.hero.secondaryCta as Cta,
    featuredService: c.home.hero.featuredService as Cta & Placeholderable & { title: string; summary: string },
    channels: c.home.hero.channels as string[],
  }

  const intro = {
    ...c.home.intro,
    differentiators: c.home.intro.differentiators as Differentiator[],
    /** Only verified statistics are displayed. */
    stats: (c.home.intro.stats ?? []) as Stat[],
    cta: c.home.intro.cta as Cta,
  }

  const brandsSection = c.home.brandsSection
  const testimonialsSection = { ...c.home.testimonialsSection, shareCta: c.home.testimonialsSection.shareCta as Cta }
  const closingCta = { ...c.home.closingCta, primary: c.home.closingCta.primary as Cta, secondary: c.home.closingCta.secondary as Cta }

  // ── Pages ───────────────────────────────────────────────────────────────────

  const servicesPage = c.pages.servicesPage

  const about = {
    ...c.about,
    intro: c.about.intro as string[],
    values: c.about.values as Differentiator[],
    methodology: c.about.methodology as Differentiator[],
    team: (c.team.items ?? []) as TeamMember[],
    milestones: (c.about.milestones ?? []) as Milestone[],
    /** Only verified achievements are displayed. */
    achievements: (c.about.achievements ?? []) as Achievement[],
  }

  /** Contact details. Empty values are hidden — never invent contact details. */
  const contact = {
    email: str(c.company.contact.email),
    phone: str(c.company.contact.phone),
    /** WhatsApp number with country code, digits only. Empty hides the WhatsApp buttons. */
    whatsapp: str(c.company.contact.whatsapp).replace(/\D/g, ''),
    whatsappMessage: str(c.company.contact.whatsappMessage),
    address: str(c.company.contact.address),
    hours: str(c.company.contact.hours),
    mapUrl: str(c.company.contact.mapUrl),
  }

  /** Social links. Empty `href` values are hidden. */
  const socials = (c.company.socials ?? []) as SocialLink[]

  const contactPage = { ...c.pages.contactPage, nextSteps: c.pages.contactPage.nextSteps as Differentiator[] }

  /**
   * Form definitions. Field names here generate the hidden static forms Netlify
   * needs for detection, so they stay in code; labels and messages are editable.
   */
  const contactForm: FormConfig = {
    name: 'contact',
    endpoint: '/',
    legend: 'Project enquiry',
    submitLabel: c.pages.contactForm.submitLabel,
    successTitle: c.pages.contactForm.successTitle,
    successText: c.pages.contactForm.successText,
    errorText: c.pages.contactForm.errorText,
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, autoComplete: 'name', half: true, maxLength: 120 },
      { name: 'email', label: 'Work email', type: 'email', required: true, autoComplete: 'email', half: true, maxLength: 200 },
      { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', half: true, maxLength: 40 },
      { name: 'company', label: 'Company name', type: 'text', autoComplete: 'organization', half: true, maxLength: 160 },
      {
        name: 'service',
        label: 'Service of interest',
        type: 'select',
        half: true,
        options: [...services.map((s) => s.title), 'Not sure yet'],
      },
      {
        name: 'budget',
        label: 'Estimated budget',
        type: 'select',
        half: true,
        options: c.pages.contactForm.budgetOptions as string[],
      },
      {
        name: 'message',
        label: 'Project details',
        type: 'textarea',
        required: true,
        placeholder: 'What are you trying to achieve, and by when?',
        maxLength: 4000,
      },
      {
        name: 'consent',
        label: 'I agree that my details may be used to respond to this enquiry, as described in the privacy policy.',
        type: 'checkbox',
        required: true,
      },
    ],
  }

  /**
   * Customers submit feedback at /feedback. Submissions arrive in Netlify
   * (Forms → feedback) and are NOT published automatically: approve one by
   * adding it to the Testimonials tab of the Google Sheet.
   */
  const feedbackPage = c.pages.feedbackPage

  const feedbackForm: FormConfig = {
    name: 'feedback',
    endpoint: '/',
    legend: 'Customer feedback',
    submitLabel: c.pages.feedbackForm.submitLabel,
    successTitle: c.pages.feedbackForm.successTitle,
    successText: c.pages.feedbackForm.successText,
    errorText: c.pages.feedbackForm.errorText,
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, autoComplete: 'name', half: true, maxLength: 120 },
      { name: 'email', label: 'Email (not published)', type: 'email', required: true, autoComplete: 'email', half: true, maxLength: 200 },
      { name: 'role', label: 'Your role', type: 'text', autoComplete: 'organization-title', half: true, maxLength: 120, placeholder: 'e.g. Owner' },
      { name: 'company', label: 'Business name', type: 'text', autoComplete: 'organization', half: true, maxLength: 160 },
      {
        name: 'service',
        label: 'Service you used',
        type: 'select',
        half: true,
        options: [...services.map((s) => s.title), 'Other'],
      },
      {
        name: 'rating',
        label: 'Your rating',
        type: 'select',
        half: true,
        options: ['5 — Excellent', '4 — Very good', '3 — Good', '2 — Fair', '1 — Poor'],
      },
      {
        name: 'feedback',
        label: 'Your feedback',
        type: 'textarea',
        required: true,
        placeholder: 'What was it like working with us, and what changed for your business?',
        maxLength: 1500,
      },
      {
        name: 'publish',
        label: `I agree that my feedback, name, role and business name may be published on the ${c.company.brand.shortName} website.`,
        type: 'checkbox',
      },
    ],
  }

  // ── Footer & legal ──────────────────────────────────────────────────────────

  const footer = {
    blurb: c.company.footer.blurb,
    /** "Website by …" credit in the bottom bar. Empty text hides it. */
    credit: { label: str(c.company.footer.creditText), href: str(c.company.footer.creditUrl) },
    legalLinks: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ] satisfies Cta[],
  }

  /** Legal pages. While `body` is empty the page shows a clear notice and is not indexed. */
  const legal = {
    privacy: { title: c.pages.legal.privacy.title, body: (c.pages.legal.privacy.body ?? []) as string[] },
    terms: { title: c.pages.legal.terms.title, body: (c.pages.legal.terms.body ?? []) as string[] },
  }

  // ── SEO ─────────────────────────────────────────────────────────────────────

  const seo = {
    /** Canonical origin, no trailing slash. Override per environment with VITE_SITE_URL. */
    siteUrl: c.seo.siteUrl.replace(/\/$/, ''),
    locale: c.seo.locale,
    ogImage: c.seo.ogImage,
    twitterHandle: str(c.seo.twitterHandle),
    /** JSON-LD structured data. Only fields with real values are used. */
    structuredData: Boolean(c.seo.structuredData),
    pages: {
      home: c.seo.pages.home as PageSeo,
      services: c.seo.pages.services as PageSeo,
      about: c.seo.pages.about as PageSeo,
      contact: c.seo.pages.contact as PageSeo,
      feedback: c.seo.pages.feedback as PageSeo,
      notFound: { ...c.seo.pages.notFound, noindex: true } as PageSeo,
    },
  }

  return {
    brand,
    colors,
    typography,
    launch,
    hero,
    intro,
    brandsSection,
    testimonialsSection,
    closingCta,
    servicesPage,
    about,
    contact,
    socials,
    contactPage,
    contactForm,
    feedbackPage,
    feedbackForm,
    footer,
    legal,
    seo,
  }
}

export const site = buildSite(defaultContent)

export type Site = typeof site

/**
 * Replaces all content in place, e.g. with the live Google Sheet content.
 * Components read `site` while rendering, so the next render shows it.
 */
export function replaceSiteContent(c: ContentFiles): void {
  setServices(c.services)
  setBrands(c.brands)
  setTestimonials(c.testimonials)
  Object.assign(site, buildSite(c))
}
