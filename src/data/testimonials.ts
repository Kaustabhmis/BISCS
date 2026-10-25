import type { Testimonial } from '../types/content'

/**
 * TESTIMONIALS — PLACEHOLDER CONTENT
 *
 * Never publish invented quotes. Replace these with genuine client feedback
 * (with the client's permission) and remove `placeholder: true`.
 * If no genuine testimonials exist at launch, set
 * `site.launch.hidePlaceholderContent = true` and the section is hidden.
 */
export const testimonials: Testimonial[] = [
  {
    placeholder: true,
    quote:
      'Placeholder testimonial. Replace this with a genuine quote from a client, describing what working with the agency was like and what changed for their business.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    project: 'Project reference',
  },
  {
    placeholder: true,
    quote:
      'Placeholder testimonial. Keep real quotes short and specific — one or two sentences about the collaboration reads better than a paragraph of praise.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
  },
  {
    placeholder: true,
    quote:
      'Placeholder testimonial. Only include outcomes and figures the client has confirmed and approved for publication.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    project: 'Project reference',
  },
]
