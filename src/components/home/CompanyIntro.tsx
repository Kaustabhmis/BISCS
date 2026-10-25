import { useLayoutEffect, useRef } from 'react'
import { site } from '../../config/site'
import { visible } from '../../lib/content'
import { gsap, MOTION_OK } from '../../lib/gsap'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

/**
 * Company introduction. The statement lights up word by word as it scrolls
 * through the viewport, then three connected nodes (echoing the hero's
 * channels) explain what makes the agency different.
 */
export function CompanyIntro() {
  const { intro } = site
  const root = useRef<HTMLElement>(null)
  const stats = visible(intro.stats).filter((s) => s.verified && s.value)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        el.querySelectorAll('.intro-word'),
        { opacity: 0.3 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.04,
          scrollTrigger: { trigger: el.querySelector('.intro-statement'), start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      )
      gsap.fromTo(
        el.querySelector('.intro-path'),
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: el.querySelector('.intro-steps'), start: 'top 85%', end: 'center 55%', scrub: 0.6 },
        },
      )
    }, el)
    return () => mm.revert()
  }, [])

  return (
    <section id="intro" ref={root} aria-labelledby="intro-heading" className="relative bg-ink py-24 text-paper md:py-36">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <SectionLabel index="01" className="text-paper/60">
              {intro.label}
            </SectionLabel>
            <h2 id="intro-heading" className="t-h3 mt-6 max-w-sm text-paper/90">
              {intro.heading}
            </h2>
            <p className="serif-em mt-8 text-3xl leading-tight text-accent">“{intro.philosophy}”</p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <p className="intro-statement t-statement">
            {intro.statement.split(' ').map((w, i) => (
              <span key={i} className="intro-word">
                {w}{' '}
              </span>
            ))}
          </p>

          <div className="intro-steps relative mt-20 md:mt-28">
            {/* Connector line linking the three ideas */}
            <svg aria-hidden="true" className="absolute left-0 top-[11px] hidden h-[2px] w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line x1="0" y1="1" x2="100" y2="1" stroke="var(--brand-paper)" strokeOpacity="0.12" vectorEffect="non-scaling-stroke" />
              <line
                className="intro-path"
                x1="0"
                y1="1"
                x2="100"
                y2="1"
                stroke="var(--brand-accent)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="1"
              />
            </svg>
            <Reveal as="ol" className="grid gap-10 md:grid-cols-3 md:gap-8">
              {intro.differentiators.map((d, i) => (
                <li key={d.title} className="relative pl-8 md:pl-0">
                  <span aria-hidden="true" className="absolute left-0 top-0 grid size-[22px] place-items-center rounded-full border border-paper/25 bg-ink md:relative">
                    <span className={i === intro.differentiators.length - 1 ? 'size-2 rounded-full bg-accent' : 'size-1.5 rounded-full bg-paper/70'} />
                  </span>
                  <p className="t-label mt-0 text-paper/60 md:mt-6">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.02em]">{d.title}</h3>
                  <p className="mt-3 max-w-xs text-paper/65">{d.text}</p>
                </li>
              ))}
            </Reveal>
          </div>

          {stats.length > 0 && (
            <dl className="mt-20 grid grid-cols-2 gap-8 border-t border-paper/10 pt-10 md:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="t-label text-paper/60">{s.label}</dt>
                  <dd className="t-h2 mt-3">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-16">
            <ButtonLink href={intro.cta.href} variant="ghost">
              {intro.cta.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
