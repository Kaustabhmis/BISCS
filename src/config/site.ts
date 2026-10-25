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
} from '../types/content'
import { services } from '../data/services'
import aboutJson from '../content/about.json'
import companyJson from '../content/company.json'
import homeJson from '../content/home.json'
import pagesJson from '../content/pages.json'
import seoJson from '../content/seo.json'
import teamJson from '../content/team.json'
import themeJson from '../content/theme.json'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Editable content lives in `src/content/*.json` and is edited through the
 *  admin panel at /admin (see README → Admin panel). This file assembles it
 *  into one typed object and adds the technical settings editors don't need
 *  to touch (fonts, form field definitions, icon paths).
 *
 *  Items marked `placeholder: true` are temporary and are removed when
 *  "Hide placeholder content" (launch.hidePlaceholderContent) is switched on.
 *
 *  This file must stay plain data (no React, no browser APIs): it is also read
 *  at build time by `scripts/vite-site-plugin.ts` and the pre-renderer.
 */

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

// ── Identity ────────────────────────────────────────────────────────────────

const brand = {
  name: companyJson.brand.name,
  shortName: companyJson.brand.shortName,
  wordmarkSuffix: str(companyJson.brand.wordmarkSuffix),
  /** Logo (edited in the admin). Leave `src` empty to fall back to a typographic wordmark. */
  logo: companyJson.brand.logo as { src: string; width?: number; height?: number },
  tagline: companyJson.brand.tagline,
  /** Square brand mark (the circuit head), used for icons and structured data. */
  mark: '/logo-mark.png',
  favicon: '/favicon.png',
  appleTouchIcon: '/apple-touch-icon.png',
}

/** Brand colours (edited in the admin under "Brand colours"). */
const colors: BrandColors = themeJson

/** Font stacks. To change fonts, update these and the imports in `src/main.tsx`. */
const typography: BrandTypography = {
  display: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  serif: "'Instrument Serif', ui-serif, Georgia, serif",
  body: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
}

const launch = { hidePlaceholderContent: Boolean(companyJson.launch.hidePlaceholderContent) }

// ── Home ────────────────────────────────────────────────────────────────────

const hero = {
  ...homeJson.hero,
  primaryCta: homeJson.hero.primaryCta as Cta,
  secondaryCta: homeJson.hero.secondaryCta as Cta,
  featuredService: homeJson.hero.featuredService as Cta & Placeholderable & { title: string; summary: string },
  channels: homeJson.hero.channels as string[],
}

const intro = {
  ...homeJson.intro,
  differentiators: homeJson.intro.differentiators as Differentiator[],
  /** Only verified statistics are displayed. */
  stats: (homeJson.intro.stats ?? []) as Stat[],
  cta: homeJson.intro.cta as Cta,
}

const brandsSection = homeJson.brandsSection
const testimonialsSection = { ...homeJson.testimonialsSection, shareCta: homeJson.testimonialsSection.shareCta as Cta }
const closingCta = { ...homeJson.closingCta, primary: homeJson.closingCta.primary as Cta, secondary: homeJson.closingCta.secondary as Cta }

// ── Pages ───────────────────────────────────────────────────────────────────

const servicesPage = pagesJson.servicesPage

const about = {
  ...aboutJson,
  intro: aboutJson.intro as string[],
  values: aboutJson.values as Differentiator[],
  methodology: aboutJson.methodology as Differentiator[],
  team: (teamJson.items ?? []) as TeamMember[],
  milestones: (aboutJson.milestones ?? []) as Milestone[],
  /** Only verified achievements are displayed. */
  achievements: (aboutJson.achievements ?? []) as Achievement[],
}

/** Contact details. Empty values are hidden — never invent contact details. */
const contact = {
  email: str(companyJson.contact.email),
  phone: str(companyJson.contact.phone),
  /** WhatsApp number with country code, digits only. Empty hides the WhatsApp buttons. */
  whatsapp: str(companyJson.contact.whatsapp).replace(/\D/g, ''),
  whatsappMessage: str(companyJson.contact.whatsappMessage),
  address: str(companyJson.contact.address),
  hours: str(companyJson.contact.hours),
  mapUrl: str(companyJson.contact.mapUrl),
}

/** Social links. Empty `href` values are hidden. */
const socials = (companyJson.socials ?? []) as SocialLink[]

const contactPage = { ...pagesJson.contactPage, nextSteps: pagesJson.contactPage.nextSteps as Differentiator[] }

/**
 * Form definitions. Field names here generate the hidden static forms Netlify
 * needs for detection, so they stay in code; labels and messages are editable.
 */
const contactForm: FormConfig = {
  name: 'contact',
  endpoint: '/',
  legend: 'Project enquiry',
  submitLabel: pagesJson.contactForm.submitLabel,
  successTitle: pagesJson.contactForm.successTitle,
  successText: pagesJson.contactForm.successText,
  errorText: pagesJson.contactForm.errorText,
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
      options: pagesJson.contactForm.budgetOptions as string[],
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
 * adding it under Testimonials in the admin panel.
 */
const feedbackPage = pagesJson.feedbackPage

const feedbackForm: FormConfig = {
  name: 'feedback',
  endpoint: '/',
  legend: 'Customer feedback',
  submitLabel: pagesJson.feedbackForm.submitLabel,
  successTitle: pagesJson.feedbackForm.successTitle,
  successText: pagesJson.feedbackForm.successText,
  errorText: pagesJson.feedbackForm.errorText,
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
      label: `I agree that my feedback, name, role and business name may be published on the ${companyJson.brand.shortName} website.`,
      type: 'checkbox',
    },
  ],
}

// ── Footer & legal ──────────────────────────────────────────────────────────

const footer = {
  blurb: companyJson.footer.blurb,
  legalLinks: [
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ] satisfies Cta[],
}

/** Legal pages. While `body` is empty the page shows a clear notice and is not indexed. */
const legal = {
  privacy: { title: pagesJson.legal.privacy.title, body: (pagesJson.legal.privacy.body ?? []) as string[] },
  terms: { title: pagesJson.legal.terms.title, body: (pagesJson.legal.terms.body ?? []) as string[] },
}

// ── SEO ─────────────────────────────────────────────────────────────────────

const seo = {
  /** Canonical origin, no trailing slash. Override per environment with VITE_SITE_URL. */
  siteUrl: seoJson.siteUrl.replace(/\/$/, ''),
  locale: seoJson.locale,
  ogImage: seoJson.ogImage,
  twitterHandle: str(seoJson.twitterHandle),
  /** JSON-LD structured data. Only fields with real values are used. */
  structuredData: Boolean(seoJson.structuredData),
  pages: {
    home: seoJson.pages.home as PageSeo,
    services: seoJson.pages.services as PageSeo,
    about: seoJson.pages.about as PageSeo,
    contact: seoJson.pages.contact as PageSeo,
    feedback: seoJson.pages.feedback as PageSeo,
    notFound: { ...seoJson.pages.notFound, noindex: true } as PageSeo,
  },
}

export const site = {
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

export type Site = typeof site
