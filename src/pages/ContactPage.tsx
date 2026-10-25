import { ContactForm } from '../components/contact/ContactForm'
import { WhatsAppButton, WhatsAppGlyph } from '../components/contact/WhatsAppButton'
import { buttonClass } from '../components/ui/buttonStyles'
import { whatsappUrl } from '../lib/whatsapp'
import { Seo } from '../components/Seo'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { site } from '../config/site'
import type { IconName } from '../types/content'

export default function ContactPage() {
  const { contact, contactPage } = site
  type Detail = { icon: IconName; label: string; value: string; href?: string }
  const candidates: (Detail | false | '')[] = [
    contact.email && { icon: 'mail' as const, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: 'phone' as const, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    contact.whatsapp && { icon: 'whatsapp' as const, label: 'WhatsApp', value: contact.phone || `+${contact.whatsapp}`, href: whatsappUrl() },
    contact.address && { icon: 'map' as const, label: 'Office', value: contact.address, href: contact.mapUrl || undefined },
    contact.hours && { icon: 'clock' as const, label: 'Hours', value: contact.hours },
  ]
  const details = candidates.filter((d): d is Detail => Boolean(d))
  const socials = site.socials.filter((s) => s.href)

  return (
    <>
      <Seo {...site.seo.pages.contact} path="/contact" />
      <PageHeader label={contactPage.label} title={contactPage.heading} emphasis="conversation">
        <p>{contactPage.intro}</p>
        {(contact.whatsapp || contact.phone) && (
          <div className="mt-10 flex flex-wrap gap-3">
            <WhatsAppButton />
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={buttonClass('ghost')}>
                Call {contact.phone}
              </a>
            )}
          </div>
        )}
      </PageHeader>

      <section aria-label="Enquiry form and contact details" className="on-paper bg-paper text-ink">
        <div className="shell grid gap-16 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="t-h3 mb-10">Tell us about your project</h2>
            <ContactForm />
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="space-y-12 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              {details.length > 0 && (
                <div>
                  <h2 className="t-label text-stone">Reach us directly</h2>
                  <ul className="mt-6 space-y-5">
                    {details.map((d) => (
                      <li key={d.label} className="flex gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-paper">
                          <Icon name={d.icon} className="size-4" />
                        </span>
                        <span>
                          <span className="t-label block text-stone">{d.label}</span>
                          {d.href ? (
                            <a
                              href={d.href}
                              {...(d.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                              className="mt-1 block font-medium underline-offset-4 hover:underline"
                            >
                              {d.value}
                            </a>
                          ) : (
                            <span className="mt-1 block font-medium">{d.value}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {whatsappUrl() && (
                <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-paper">
                  <div aria-hidden="true" className="absolute -right-10 -top-10 size-40 rounded-full bg-[#25D366]/20 blur-3xl" />
                  <WhatsAppGlyph className="relative size-8 text-[#25D366]" />
                  <h2 className="relative mt-5 text-xl font-medium tracking-[-0.02em]">Prefer to chat?</h2>
                  <p className="relative mt-2 text-sm text-paper/70">Message us on WhatsApp and we’ll reply as soon as we can.</p>
                  <WhatsAppButton label="Start a WhatsApp chat" className="relative mt-6" />
                </div>
              )}

              <div className="rounded-3xl bg-ink p-8 text-paper">
                <h2 className="t-label text-accent">What happens next</h2>
                <ol className="mt-6 space-y-6">
                  {contactPage.nextSteps.map((s, i) => (
                    <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-2">
                      <span className="t-label pt-1 text-paper/60">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block font-medium">{s.title}</span>
                        <span className="mt-1 block text-sm text-paper/65">{s.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {socials.length > 0 && (
                <div>
                  <h2 className="t-label text-stone">Follow</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <li key={s.label}>
                        <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm hover:border-ink">
                          <Icon name={s.icon} className="size-3.5" />
                          {s.label}
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
