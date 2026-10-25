import type { Cta } from '../types/content.ts'

/** Primary navigation. Order here is the order in the navbar, mobile menu and footer. */
export const mainNav: Cta[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
]

/** The prominent enquiry button in the navbar. */
export const navCta: Cta = { label: 'Start a project', href: '/contact' }

/** Static routes, used for the sitemap. Service detail routes are added automatically. */
export const staticRoutes = ['/', '/services', '/about', '/contact', '/feedback', '/privacy', '/terms']
