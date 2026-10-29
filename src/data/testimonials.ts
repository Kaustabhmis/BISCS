import type { Testimonial } from '../types/content.ts'
import testimonialsJson from '../content/testimonials.json' with { type: 'json' }

/**
 * TESTIMONIALS — edited in the Google Sheet (Testimonials tab), copied into
 * src/content/testimonials.json at build time.
 *
 * Only publish genuine feedback the customer agreed to share. Submissions from
 * the /feedback page arrive in Netlify (Forms → feedback) for review.
 */
/** Updated in place when live content arrives (see replaceSiteContent). */
export const testimonials: Testimonial[] = []

export function setTestimonials(json: { items?: unknown[] }): void {
  testimonials.splice(0, testimonials.length, ...((json.items ?? []) as Testimonial[]).filter((t) => t?.quote && t?.name))
}

setTestimonials(testimonialsJson)
