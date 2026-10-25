import { Check } from 'lucide-react'
import type { Service } from '../../types/content'
import { ButtonLink } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'
import { Reveal } from '../ui/Reveal'

/**
 * Full description of one service. Used on /services (as a section per
 * service) and on /services/:slug (with `standalone`, which omits the title
 * because the page header already shows it).
 */
export function ServiceDetail({
  service,
  index,
  standalone = false,
}: {
  service: Service
  index: number
  standalone?: boolean
}) {
  const HeadingTag = standalone ? 'h2' : 'h3'
  const SubTag = standalone ? 'h3' : 'h4'
  return (
    <article id={service.slug} aria-labelledby={`${service.slug}-title`} className="scroll-mt-[calc(var(--header-h)+5rem)]">
      <Reveal>
        {!standalone && (
          <div className="flex items-center gap-4">
            <span className="t-label text-accent-ink">{String(index + 1).padStart(2, '0')}</span>
            <span className="grid size-10 place-items-center rounded-full bg-ink text-paper">
              <Icon name={service.icon} className="size-5" />
            </span>
            {service.placeholder && <PlaceholderBadge />}
          </div>
        )}
        <HeadingTag id={`${service.slug}-title`} className={standalone ? 'sr-only' : 't-h2 mt-6'}>
          {service.title}
        </HeadingTag>
        {!standalone && <p className="t-lead mt-5 max-w-2xl text-ink/80">{service.intro}</p>}
      </Reveal>

      <Reveal className="mt-8 max-w-2xl space-y-4 text-stone">
        {(standalone ? service.description : service.description.slice(0, 1)).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Reveal>

      {service.image && (
        <img
          src={service.image.src}
          alt={service.image.alt}
          width={service.image.width}
          height={service.image.height}
          loading="lazy"
          decoding="async"
          className="mt-10 h-auto w-full rounded-2xl object-cover"
        />
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <SubTag className="t-label text-stone">What you gain</SubTag>
          <ul className="mt-5 space-y-4">
            {service.benefits.map((b) => (
              <li key={b} className="flex gap-3">
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" strokeWidth={2} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SubTag className="t-label text-stone">Deliverables</SubTag>
          <ul className="mt-5 flex flex-wrap gap-2">
            {service.deliverables.map((d) => (
              <li key={d} className="rounded-full border border-ink/15 px-4 py-2 text-sm">
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {standalone && service.process.length > 0 && (
        <div className="mt-12">
          <SubTag className="t-label text-stone">How it works</SubTag>
          <ol className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 xl:grid-cols-4">
            {service.process.map((step, i) => (
              <li key={step.title} className="bg-paper p-5">
                <span className="t-label text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-3 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-stone">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {service.caseStudy && (
        <aside className="mt-12 rounded-2xl bg-ink p-6 text-paper">
          <p className="t-label text-accent">Related work</p>
          <p className="mt-3 text-lg font-medium">{service.caseStudy.title}</p>
          <p className="mt-2 text-paper/70">{service.caseStudy.summary}</p>
          {service.caseStudy.href && (
            <ButtonLink href={service.caseStudy.href} variant="ghost" className="mt-5">
              View case study
            </ButtonLink>
          )}
        </aside>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href={service.cta?.href ?? `/contact?service=${service.slug}`} variant="dark">
          {service.cta?.label ?? 'Discuss this service'}
        </ButtonLink>
        {!standalone && (
          <ButtonLink href={`/services/${service.slug}`} variant="outline-dark" arrow={false}>
            Service details
          </ButtonLink>
        )}
      </div>
    </article>
  )
}
