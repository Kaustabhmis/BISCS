import type { Brand } from '../types/content.ts'
import brandsJson from '../content/brands.json' with { type: 'json' }

/**
 * CLIENTS & PARTNERS — edited in the Google Sheet (Clients tab), copied into
 * src/content/brands.json at build time.
 *
 * Only list brands the agency has a confirmed relationship with (and
 * permission to show). Logos are scaled to a consistent height without
 * distortion. If no real brands remain at launch, the section is hidden.
 */
/** Updated in place when live content arrives (see replaceSiteContent). */
export const brands: Brand[] = []

export function setBrands(json: { items?: unknown[] }): void {
  brands.splice(0, brands.length, ...((json.items ?? []) as Brand[]).filter((b) => b?.name))
}

setBrands(brandsJson)
