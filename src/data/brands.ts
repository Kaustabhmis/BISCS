import type { Brand } from '../types/content'

/**
 * BRANDS — PLACEHOLDER CONTENT
 *
 * Only list brands the agency has a confirmed relationship with (and permission
 * to show). Put logo files in `public/brands/` and reference them like
 * `logo: '/brands/acme.svg'`. SVG, PNG and WebP are supported; logos are
 * scaled to a consistent height without distortion.
 *
 * Example of a real entry:
 *   { name: 'Acme', logo: '/brands/acme.svg', width: 120, height: 32, relationship: 'client' }
 *
 * Placeholder entries render as neutral, clearly labelled slots and are
 * removed when `site.launch.hidePlaceholderContent` is true. If no real brands
 * remain, the whole section is hidden.
 */
export const brands: Brand[] = Array.from({ length: 8 }, (_, i) => ({
  placeholder: true,
  name: `Brand slot ${String(i + 1).padStart(2, '0')}`,
}))
