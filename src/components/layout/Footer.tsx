import { Link } from 'react-router'
import { mainNav } from '../../config/navigation'
import { site } from '../../config/site'
import { services } from '../../data/services'
import { visible } from '../../lib/content'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { whatsappUrl } from '../../lib/whatsapp'
import { WhatsAppGlyph } from '../contact/WhatsAppButton'

export function Footer() {
  const year = new Date().getFullYear()
  const { contact } = site
  const socials = site.socials.filter((s) => s.href)
  const serviceLinks = visible(services).slice(0, 7)
  const hasContact = contact.email || contact.phone || contact.address

  return (
    <footer className="relative overflow-hidden border-t border-paper/10 bg-ink text-paper">
      <div className="shell grid gap-12 pb-10 pt-20 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5 lg:col-span-4">
          <Logo size="lg" />
          <p className="mt-6 max-w-sm text-paper/65">{site.footer.blurb}</p>
          <p className="serif-em mt-6 text-2xl text-paper/90">{site.brand.tagline}</p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3 lg:col-span-2 lg:col-start-6">
          <h2 className="t-label text-paper/60">Company</h2>
          <ul className="mt-5 space-y-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="text-paper/80 transition-colors hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/feedback" className="text-paper/80 transition-colors hover:text-accent">
                Share your experience
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Services" className="md:col-span-4 lg:col-span-3 lg:col-start-8">
          <h2 className="t-label text-paper/60">Services</h2>
          <ul className="mt-5 space-y-3">
            {serviceLinks.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="text-paper/80 transition-colors hover:text-accent">
                  {s.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/services" className="text-paper/60 transition-colors hover:text-accent">
                All services →
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-12 lg:col-span-2">
          <h2 className="t-label text-paper/60">Contact</h2>
          <ul className="mt-5 space-y-3 text-paper/80">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-accent">
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-accent">
                  {contact.phone}
                </a>
              </li>
            )}
            {whatsappUrl() && (
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-accent">
                  <WhatsAppGlyph className="size-4 text-[#25D366]" />
                  WhatsApp us
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            )}
            {contact.address && <li className="not-italic">{contact.address}</li>}
            {!hasContact && (
              <li>
                <Link to="/contact" className="hover:text-accent">
                  Send us an enquiry →
                </Link>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-paper/15 px-3.5 text-sm text-paper/75 transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon name={s.icon} className="size-3.5" />
                    {s.label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Oversized wordmark — purely decorative, drawn with CSS so it stays out of the accessibility tree. */}
      <div aria-hidden="true" className="shell pointer-events-none select-none">
        <div
          data-word={site.brand.shortName}
          className="font-display text-[22vw] font-semibold leading-[0.75] tracking-[-0.07em] text-paper/[0.04] before:content-[attr(data-word)] lg:text-[17rem]"
        />
      </div>

      <div className="shell flex flex-col gap-4 border-t border-paper/10 py-6 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {site.brand.name}. All rights reserved.
        </p>
        <ul className="flex gap-6">
          {site.footer.legalLinks.map((l) => (
            <li key={l.href}>
              <Link to={l.href} className="hover:text-paper">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
