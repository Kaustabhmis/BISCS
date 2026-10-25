import type { Brand } from '../types/content'
import brandsJson from '../content/brands.json'

/**
 * CLIENTS & PARTNERS — edited in the admin panel (Clients & partners) or in
 * src/content/brands.json.
 *
 * Only list brands the agency has a confirmed relationship with (and
 * permission to show). Logos are scaled to a consistent height without
 * distortion. If no real brands remain at launch, the section is hidden.
 */
export const brands: Brand[] = (brandsJson.items as Brand[]).filter((b) => b.name)
