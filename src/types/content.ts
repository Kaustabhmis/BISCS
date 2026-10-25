/**
 * Content model for the whole website.
 *
 * Every piece of business information lives in `src/config` or `src/data`
 * and is typed here. Components never hardcode business content.
 *
 * `placeholder: true` marks temporary development content. Placeholder items
 * show a visible "Placeholder" badge, and are removed everywhere when
 * `site.launch.hidePlaceholderContent` is set to `true`.
 */

/** Names of icons available to content (mapped to Lucide icons in `components/ui/Icon.tsx`). */
export type IconName =
  | 'search'
  | 'target'
  | 'share'
  | 'pen'
  | 'sparkles'
  | 'chart'
  | 'layers'
  | 'compass'
  | 'zap'
  | 'globe'
  | 'mail'
  | 'phone'
  | 'map'
  | 'clock'
  | 'linkedin'
  | 'instagram'
  | 'x'
  | 'youtube'
  | 'facebook'
  | 'link'
  | 'id'
  | 'camera'
  | 'monitor'
  | 'pin'
  | 'star'
  | 'message'
  | 'megaphone'
  | 'calendar'
  | 'user'
  | 'whatsapp'
  | 'users'

export interface Placeholderable {
  /** True while this is temporary content that must be replaced before launch. */
  placeholder?: boolean
}

export interface Cta {
  label: string
  /** Internal route (e.g. `/contact`) or absolute URL. */
  href: string
}

export interface BrandColors {
  /** Primary dark background. */
  ink: string
  /** Raised dark surface. */
  inkRaised: string
  /** Primary light background / text on dark. */
  paper: string
  /** Secondary light surface. */
  paperDeep: string
  /** Muted text on dark backgrounds. */
  ash: string
  /** Muted text on light backgrounds. */
  stone: string
  /** Signature accent. Use sparingly. */
  accent: string
  /** Accessible accent for text on light backgrounds. */
  accentInk: string
  /** Secondary highlight used in data visuals and the 3D scene. */
  signal: string
  /** Metallic gold gradient stops (light → mid → deep), used for premium accents. */
  goldLight: string
  goldDeep: string
}

export interface BrandTypography {
  /** CSS font-family stacks. Font files are imported in `src/main.tsx`. */
  display: string
  serif: string
  body: string
  mono: string
}

export interface Stat extends Placeholderable {
  value: string
  label: string
  /** Statistics are only rendered when verified. Never publish unverified numbers. */
  verified: boolean
}

export interface Differentiator {
  title: string
  text: string
}

export interface ServiceProcessStep {
  title: string
  text: string
}

export interface CaseStudyRef {
  title: string
  summary: string
  href?: string
}

export interface Service extends Placeholderable {
  /** URL-safe identifier, used for `/services/:slug` and anchors. */
  slug: string
  title: string
  /** Short label used in navigation, chips and the 3D hero. */
  shortTitle: string
  /** Group heading on the services page (e.g. "Digital Marketing Solutions"). */
  category: string
  icon: IconName
  /** One-sentence introduction. */
  intro: string
  /** Longer description (one or more paragraphs). */
  description: string[]
  benefits: string[]
  deliverables: string[]
  process: ServiceProcessStep[]
  /** Optional image path (in /public) shown on the detail page. */
  image?: { src: string; alt: string; width: number; height: number }
  caseStudy?: CaseStudyRef
  cta?: Cta
}

export interface Brand extends Placeholderable {
  name: string
  /** Path to an SVG, PNG or WebP logo in /public. Omit to show a neutral placeholder. */
  logo?: string
  /** Intrinsic logo dimensions, used to preserve aspect ratio. */
  width?: number
  height?: number
  href?: string
  /** What the relationship is. Only use confirmed relationships. */
  relationship?: 'client' | 'partner' | 'platform'
}

export interface Testimonial extends Placeholderable {
  quote: string
  /** Optional rating out of 5, only if the client actually gave one. */
  rating?: number
  name: string
  role: string
  company: string
  portrait?: { src: string; alt: string }
  logo?: { src: string; alt: string; width: number; height: number }
  project?: string
}

export interface TeamMember extends Placeholderable {
  name: string
  role: string
  bio?: string
  portrait?: { src: string; alt: string }
  links?: { label: string; href: string }[]
}

export interface Milestone extends Placeholderable {
  year: string
  title: string
  text: string
}

export interface Achievement extends Placeholderable {
  title: string
  detail: string
  verified: boolean
}

export interface SocialLink {
  label: string
  icon: IconName
  /** Leave empty to hide the link. */
  href: string
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox'

export interface FormField {
  name: string
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
  autoComplete?: string
  options?: string[]
  maxLength?: number
  /** Render at half width on larger screens. */
  half?: boolean
  /** Helper text shown below the field. */
  hint?: string
}

export interface PageSeo {
  title: string
  description: string
  /** Set to true for pages that should not be indexed (e.g. placeholder legal pages). */
  noindex?: boolean
}

/** A form submitted to Netlify Forms. Field names also generate the static form used for detection. */
export interface FormConfig {
  /** Netlify form name. Changing it creates a new form in the Netlify UI. */
  name: string
  /** Where submissions are POSTed (`/` for Netlify Forms). */
  endpoint: string
  /** Screen-reader name for the group of fields. */
  legend: string
  submitLabel: string
  successTitle: string
  successText: string
  errorText: string
  fields: FormField[]
}
