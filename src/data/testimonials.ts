import type { Testimonial } from '../types/content'
import testimonialsJson from '../content/testimonials.json'

/**
 * TESTIMONIALS — edited in the admin panel (Testimonials) or in
 * src/content/testimonials.json.
 *
 * Only publish genuine feedback the customer agreed to share. Submissions from
 * the /feedback page arrive in Netlify (Forms → feedback) for review.
 */
export const testimonials: Testimonial[] = (testimonialsJson.items as Testimonial[]).filter((t) => t.quote && t.name)
