import type {
  Achievement,
  BrandColors,
  BrandTypography,
  Cta,
  Differentiator,
  FormField,
  Milestone,
  PageSeo,
  Placeholderable,
  SocialLink,
  Stat,
  TeamMember,
} from '../types/content'
import { services } from '../data/services'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION — the single place to edit the agency's identity.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Anything marked `placeholder: true` or commented PLACEHOLDER is temporary
 *  development content. Services, brands and testimonials live in `src/data/`.
 *
 *  This file must stay plain data (no React, no browser APIs): it is also read
 *  at build time by `scripts/vite-site-plugin.ts` to generate the HTML head,
 *  theme variables, the Netlify form definition, sitemap.xml and robots.txt.
 */

// ── Identity ────────────────────────────────────────────────────────────────

const brand = {
  /** Full legal / trading name. */
  name: 'Kunnect Digital and Softwares',
  /** Short name used in the wordmark and page titles. */
  shortName: 'Kunnect',
  /** Optional suffix shown faintly after the wordmark. */
  wordmarkSuffix: 'DS',
  /**
   * Logo in /public, with its intrinsic size. Leave `src` empty to fall back to
   * a typographic wordmark. Originals are kept in src/assets/.
   */
  logo: { src: '/logo.webp', width: 377, height: 120 },
  /** Square brand mark (the circuit head), used for icons and social images. */
  mark: '/logo-mark.png',
  /** Favicon and Apple touch icon in /public. */
  favicon: '/favicon.png',
  appleTouchIcon: '/apple-touch-icon.png',
  /** Company philosophy, used as the tagline. */
  tagline: 'Building Connections, Delivering Growth.',
}

/**
 * Palette derived from the Kunnect logo (gold on black, white wordmark).
 * `accentInk` must keep ≥ 4.5:1 contrast on `paper` for text use (currently 5.8:1).
 */
const colors: BrandColors = {
  ink: '#0B0C10',
  inkRaised: '#14161D',
  paper: '#EFECE5',
  paperDeep: '#E3DFD5',
  ash: '#9497A1',
  stone: '#5D5F66',
  accent: '#F9A30B',
  accentInk: '#8A4B00',
  signal: '#FFE3A8',
}

/** Font stacks. To change fonts, update these and the imports in `src/main.tsx`. */
const typography: BrandTypography = {
  display: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  serif: "'Instrument Serif', ui-serif, Georgia, serif",
  body: "'Inter Tight Variable', 'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
}

// ── Launch switches ─────────────────────────────────────────────────────────

const launch = {
  /**
   * Set to `true` before going live. Every item marked `placeholder: true`
   * (services, brands, testimonials, team, milestones, contact details…) is
   * then removed, and sections left empty are hidden automatically.
   */
  hidePlaceholderContent: false,
}

// ── Home: hero ──────────────────────────────────────────────────────────────

const hero = {
  eyebrow: 'Digital marketing & software for growing businesses',
  /** The headline. `headlineEmphasis` must appear inside it and is set in italic serif. */
  headline: 'Building connections, delivering growth.',
  headlineEmphasis: 'delivering growth.',
  subheadline:
    'Strategic digital marketing and custom software for small and medium-scale businesses — shaped around your budget and guided by a dedicated account manager.',
  primaryCta: { label: 'Discuss your project', href: '/contact' } satisfies Cta,
  secondaryCta: { label: 'Explore services', href: '/services' } satisfies Cta,
  /** The featured "hero service" card at the bottom of the hero. */
  featuredService: {
    label: 'Featured service',
    title: 'Dedicated Account Manager',
    summary: 'One point of contact who coordinates every part of your growth.',
    href: '/services/account-manager',
  } as Cta & Placeholderable & { title: string; summary: string },
  /** Labels orbiting the 3D centrepiece (3–8 works best). */
  channels: ['SEO', 'Ads', 'Social', 'Branding', 'Reviews', 'Web', 'Automation'],
  /** Accessible description of the 3D scene for screen readers. */
  sceneDescription:
    'An illustration of the marketing ecosystem: channel nodes orbit a central core, sending streams of light inward, above a ring of rising bars that represents growth.',
}

// ── Home: company introduction ──────────────────────────────────────────────

const intro = {
  label: 'Who we are',
  heading: 'Marketing and software, connected for small and medium businesses.',
  /** Large editorial statement revealed word by word on scroll. */
  statement:
    'We help small and medium-scale businesses grow with strategic digital marketing and custom software — connecting your brand to the customers, tools and technology it needs to reach its full potential.',
  philosophy: 'Building Connections, Delivering Growth.',
  differentiators: [
    {
      title: 'Built for SMEs',
      text: 'Every service is designed around the realities of small and medium-scale businesses.',
    },
    {
      title: 'Shaped to your budget',
      text: 'Professional, quality work scoped to what you can invest — so more businesses can get started.',
    },
    {
      title: 'A dedicated account manager',
      text: 'One point of contact who knows your business and keeps communication seamless.',
    },
  ] satisfies Differentiator[],
  /** Only verified statistics are displayed. Unverified entries are hidden. */
  stats: [
    { placeholder: true, value: '—', label: 'Projects delivered', verified: false },
    { placeholder: true, value: '—', label: 'Years in practice', verified: false },
    { placeholder: true, value: '—', label: 'Specialists', verified: false },
  ] as Stat[],
  cta: { label: 'More about us', href: '/about' } satisfies Cta,
}

// ── Home: brands & testimonials headings ────────────────────────────────────

const brandsSection = {
  label: 'Brands & platforms',
  heading: 'Brands and platforms we work with', // Only accurate once real, confirmed logos are added.
}

const testimonialsSection = {
  label: 'Client voices',
  heading: 'What working together feels like',
}

/** Closing call-to-action band used at the end of most pages. */
const closingCta = {
  eyebrow: 'Start a conversation',
  heading: 'Ready to connect your business to growth?',
  text: 'Tell us where you are and where you want to be. Your dedicated account manager will take it from there.',
  primary: { label: 'Discuss your project', href: '/contact' } satisfies Cta,
  secondary: { label: 'Explore services', href: '/services' } satisfies Cta,
}

// ── Services page ───────────────────────────────────────────────────────────

const servicesPage = {
  label: 'Services',
  heading: 'Everything your business needs to grow online.',
  intro:
    'Digital marketing and software solutions that work on their own or together as one plan — coordinated by a dedicated account manager and shaped around your budget.',
}

// ── About page ──────────────────────────────────────────────────────────────

const about = {
  label: 'About us',
  heading: 'Building connections, delivering growth.',
  intro: [
    'At Kunnect Digital and Softwares, we empower small and medium-scale businesses with strategic digital marketing solutions and custom software development.',
    'We deliver professional, quality work shaped around your budget, so more businesses can take the next step. And every business we work with is assigned a dedicated account manager, keeping communication seamless throughout your growth journey.',
  ],
  mission: 'Connecting small and medium-scale businesses to the tech and digital world.',
  vision: 'Empowering businesses with technology and research.',
  values: [
    { title: 'Innovation', text: 'We look for better, smarter ways to solve everyday business problems.' },
    { title: 'Integration', text: 'Marketing, content and software work best when they work together.' },
    { title: 'Trends', text: 'We keep up with how platforms and customers change, so you don’t have to.' },
  ] satisfies Differentiator[],
  // DRAFT copy — confirm it matches how Kunnect actually works.
  methodology: [
    { title: 'Discover', text: 'We learn your business, customers, goals and budget.' },
    { title: 'Design', text: 'We shape a plan across marketing, content and software.' },
    { title: 'Deliver', text: 'We put it to work across the right channels and tools.' },
    { title: 'Develop', text: 'We review what is working and keep improving.' },
  ] satisfies Differentiator[],
  team: [
    { placeholder: true, name: 'Team member', role: 'Role title', bio: 'Placeholder — a short line about this person.' },
    { placeholder: true, name: 'Team member', role: 'Role title', bio: 'Placeholder — a short line about this person.' },
    { placeholder: true, name: 'Team member', role: 'Role title', bio: 'Placeholder — a short line about this person.' },
    { placeholder: true, name: 'Team member', role: 'Role title', bio: 'Placeholder — a short line about this person.' },
  ] as TeamMember[],
  milestones: [
    { placeholder: true, year: '20XX', title: 'Milestone', text: 'Placeholder — a real moment in the company’s history.' },
    { placeholder: true, year: '20XX', title: 'Milestone', text: 'Placeholder — a real moment in the company’s history.' },
    { placeholder: true, year: '20XX', title: 'Milestone', text: 'Placeholder — a real moment in the company’s history.' },
  ] as Milestone[],
  /** Only verified achievements are displayed. */
  achievements: [] as Achievement[],
}

// ── Contact ─────────────────────────────────────────────────────────────────

/**
 * Contact details. Empty values are hidden — never invent contact details.
 * PLACEHOLDER: add the real email, phone, address and hours.
 */
const contact = {
  email: '',
  phone: '',
  address: '',
  hours: '',
  /** Map link for the address, optional. */
  mapUrl: '',
}

/** Social links. Empty `href` values are hidden. */
const socials: SocialLink[] = [
  { label: 'LinkedIn', icon: 'linkedin', href: '' },
  { label: 'Instagram', icon: 'instagram', href: '' },
  { label: 'X', icon: 'x', href: '' },
  { label: 'YouTube', icon: 'youtube', href: '' },
]

const contactPage = {
  label: 'Contact',
  heading: 'Let’s start a conversation.',
  intro:
    'Tell us a little about your business and what you’re hoping to achieve. We’ll get back to you with clear next steps.',
  // DRAFT copy — confirm it matches your enquiry process.
  nextSteps: [
    { title: 'We read your enquiry', text: 'Your message comes straight to our team.' },
    { title: 'We talk it through', text: 'We get in touch to understand your goals and budget.' },
    { title: 'You meet your account manager', text: 'A dedicated point of contact guides everything from there.' },
  ] satisfies Differentiator[],
}

/**
 * Contact form definition. Field names here are also used to generate the
 * hidden static form Netlify needs for build-time form detection, so the
 * React form and Netlify always stay in sync.
 */
const contactForm = {
  /** Netlify form name. Changing it creates a new form in the Netlify UI. */
  name: 'contact',
  /** Where submissions are POSTed. `/` is correct for Netlify Forms on this SPA. */
  endpoint: '/',
  submitLabel: 'Send enquiry',
  successTitle: 'Thank you — your enquiry has been sent.',
  successText: 'We’ve received your message and will reply as soon as we can.', // PLACEHOLDER: state a real response time if you have one.
  errorText:
    'Sorry, your message could not be sent. Please try again in a moment.',
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
      // PLACEHOLDER ranges — set the currency and bands that suit the business.
      options: ['To be discussed', 'Under ₹1 lakh', '₹1–5 lakh', '₹5–15 lakh', '₹15 lakh+'],
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
  ] satisfies FormField[],
}

// ── Footer & legal ──────────────────────────────────────────────────────────

const footer = {
  blurb:
    'Strategic digital marketing and custom software for small and medium-scale businesses.',
  legalLinks: [
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ] satisfies Cta[],
}

/** Legal pages. Leave `body` empty until real policies are supplied — the page then shows a clear notice. */
const legal = {
  privacy: { title: 'Privacy policy', body: [] as string[] },
  terms: { title: 'Terms of use', body: [] as string[] },
}

// ── SEO ─────────────────────────────────────────────────────────────────────

const seo = {
  /** Canonical origin, no trailing slash. Override per environment with VITE_SITE_URL. */
  siteUrl: 'https://kunnectds.in',
  locale: 'en_IN',
  /** Social share image in /public (1200×630). Replace `public/og-image.jpg`. */
  ogImage: '/og-image.jpg',
  twitterHandle: '',
  /**
   * Organization structured data is emitted only when enabled. Enable it once
   * the name, logo, contact details and social profiles above are accurate.
   */
  structuredData: false,
  pages: {
    home: {
      title: 'Kunnect Digital and Softwares — Digital marketing & software studio',
      description:
        'Kunnect Digital and Softwares helps small and medium-scale businesses grow with strategic digital marketing and custom software, guided by a dedicated account manager.',
    },
    services: {
      title: 'Services',
      description:
        'SEO, Google & Meta ads, branding, social media, websites, review management, WhatsApp automation, HR software and more from Kunnect Digital and Softwares.',
    },
    about: {
      title: 'About us',
      description:
        'Kunnect Digital and Softwares connects small and medium-scale businesses to the tech and digital world. Our mission, vision and values.',
    },
    contact: {
      title: 'Contact',
      description: 'Start a conversation with Kunnect Digital and Softwares about your next project.',
    },
    notFound: { title: 'Page not found', description: 'The page you were looking for could not be found.', noindex: true },
  } satisfies Record<string, PageSeo>,
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
  footer,
  legal,
  seo,
}

export type Site = typeof site
