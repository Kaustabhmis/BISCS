import { useEffect, useState } from 'react'
import { Seo } from '../components/Seo'
import { ServiceDetail } from '../components/services/ServiceDetail'
import { ServiceVisual } from '../components/services/ServiceVisual'
import { CtaBand } from '../components/ui/CtaBand'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { site } from '../config/site'
import { services as allServices, serviceCategories } from '../data/services'
import { cn } from '../lib/cn'
import { visible } from '../lib/content'

export default function ServicesPage() {
  const services = visible(allServices)
  const [active, setActive] = useState(services[0]?.slug ?? '')
  const activeIndex = Math.max(0, services.findIndex((s) => s.slug === active))
  const groups = [
    ...serviceCategories,
    ...new Set(services.map((s) => s.category).filter((c) => !(serviceCategories as readonly string[]).includes(c))),
  ]
    .map((category) => ({ category, items: services.filter((s) => s.category === category) }))
    .filter((g) => g.items.length > 0)

  // Scroll-spy: highlight the service currently in the middle of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-35% 0px -60% 0px' },
    )
    services.forEach((s) => {
      const el = document.getElementById(s.slug)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the active chip visible in the mobile service bar.
  useEffect(() => {
    document.getElementById(`chip-${active}`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [active])

  return (
    <>
      <Seo {...site.seo.pages.services} path="/services" />
      <PageHeader
        label={site.servicesPage.label}
        title={site.servicesPage.heading}
        aside={
          <ul className="grid gap-4">
            {groups.map((g) => (
              <li key={g.category} className="flex items-baseline justify-between gap-4 border-t border-paper/15 pt-4">
                <a href={`#${g.items[0].slug}`} className="font-medium hover:text-accent">
                  {g.category}
                </a>
                <span className="t-label text-paper/60">{String(g.items.length).padStart(2, '0')}</span>
              </li>
            ))}
          </ul>
        }
      >
        <p>{site.servicesPage.intro}</p>
      </PageHeader>

      {/* Mobile / tablet service bar */}
      <nav aria-label="Services" className="sticky top-[var(--header-h)] z-30 border-b border-ink/10 bg-paper/90 backdrop-blur-lg lg:hidden">
        <ul className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] sm:px-8">
          {services.map((s) => (
            <li key={s.slug} className="shrink-0">
              <a
                id={`chip-${s.slug}`}
                href={`#${s.slug}`}
                aria-current={active === s.slug ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-full px-4 text-sm transition-colors',
                  active === s.slug ? 'bg-ink text-paper' : 'text-ink/70 ring-1 ring-inset ring-ink/15',
                )}
              >
                {s.shortTitle}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="on-paper bg-paper text-ink">
        <div className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)] space-y-8">
              <div className="rounded-3xl bg-ink p-8 text-paper">
                {services[activeIndex] && <ServiceVisual service={services[activeIndex]} index={activeIndex} total={services.length} />}
              </div>
              <nav aria-label="Services">
                <ol className="max-h-[calc(100svh-var(--header-h)-30rem)] min-h-40 space-y-0.5 overflow-y-auto pr-2">
                  {services.map((s, i) => (
                    <li key={s.slug}>
                      <a
                        href={`#${s.slug}`}
                        aria-current={active === s.slug ? 'true' : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.95rem] transition-colors',
                          active === s.slug ? 'bg-ink/[0.06] text-ink' : 'text-ink/55 hover:text-ink',
                        )}
                      >
                        <span className="t-label w-6 text-[0.65rem] text-stone">{String(i + 1).padStart(2, '0')}</span>
                        <Icon name={s.icon} className={cn('size-4', active === s.slug ? 'text-accent-ink' : '')} />
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-8">
            {groups.map((g) => (
              <section key={g.category} aria-labelledby={`cat-${g.category}`} className="mb-24 last:mb-0">
                <h2 id={`cat-${g.category}`} className="t-label flex items-center gap-3 border-b border-ink/15 pb-4 text-stone">
                  <span className="size-1.5 rounded-full bg-accent-ink" aria-hidden="true" />
                  {g.category}
                  <span className="ml-auto">{String(g.items.length).padStart(2, '0')} services</span>
                </h2>
                <div className="divide-y divide-ink/10">
                  {g.items.map((s) => (
                    <div key={s.slug} className="py-16 md:py-20">
                      <ServiceDetail service={s} index={services.indexOf(s)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <CtaBand />
    </>
  )
}
