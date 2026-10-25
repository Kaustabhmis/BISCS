import { site } from '../../config/site'
import { ButtonLink } from './Button'
import { Reveal } from './Reveal'

/** Closing call-to-action used at the end of pages. */
export function CtaBand({ heading = site.closingCta.heading }: { heading?: string }) {
  const c = site.closingCta
  return (
    <section aria-labelledby="cta-heading" className="grain relative isolate overflow-hidden bg-ink py-28 text-paper md:py-40">
      <OrbitMotif />
      <Reveal className="shell relative">
        <p className="t-label text-accent">{c.eyebrow}</p>
        <h2 id="cta-heading" className="t-h1 mt-6 max-w-[16ch]">
          {heading}
        </h2>
        <p className="t-lead mt-8 max-w-xl text-paper/70">{c.text}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={c.primary.href}>{c.primary.label}</ButtonLink>
          <ButtonLink href={c.secondary.href} variant="ghost">
            {c.secondary.label}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}

/** A quiet echo of the hero's orbital system. */
function OrbitMotif() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 800"
      className="pointer-events-none absolute -right-48 top-1/2 -z-10 w-[min(900px,120vw)] -translate-y-1/2 opacity-60 md:-right-24"
    >
      <defs>
        <radialGradient id="cta-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="400" r="180" fill="url(#cta-core)" />
      {[150, 230, 310].map((r, i) => (
        <ellipse
          key={r}
          cx="400"
          cy="400"
          rx={r}
          ry={r * 0.42}
          fill="none"
          stroke="var(--brand-paper)"
          strokeOpacity={0.14 - i * 0.03}
          transform={`rotate(${-18 + i * 14} 400 400)`}
        />
      ))}
      <circle cx="400" cy="400" r="10" fill="var(--brand-accent)" />
      <circle cx="660" cy="300" r="5" fill="var(--brand-paper)" fillOpacity="0.7" />
      <circle cx="210" cy="470" r="4" fill="var(--brand-signal)" fillOpacity="0.8" />
    </svg>
  )
}
