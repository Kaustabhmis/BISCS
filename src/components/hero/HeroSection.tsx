import { ArrowDown, ArrowRight } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { site } from '../../config/site'
import { cn } from '../../lib/cn'
import { isShown, splitEmphasis } from '../../lib/content'
import { gsap, MOTION_OK } from '../../lib/gsap'
import { initialLoad } from '../../lib/hydration'
import { ButtonLink } from '../ui/Button'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'

function Words({ text, className }: { text: string; className?: string }) {
  return text
    .split(/(\s+)/)
    .map((w, i) =>
      /^\s+$/.test(w) || !w ? (
        w
      ) : (
        <span key={i} className="inline-block overflow-hidden pb-[0.2em] -mb-[0.2em] pr-[0.04em] -mr-[0.04em] align-bottom">
          <span className={cn('hero-word inline-block', className)}>{w}</span>
        </span>
      ),
    )
}

export function HeroSection() {
  const { hero } = site
  const section = useRef<HTMLElement>(null)
  const [before, emphasis, after] = splitEmphasis(hero.headline, hero.headlineEmphasis)

  useLayoutEffect(() => {
    const el = section.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      // Skip the entrance when the headline is already painted from pre-rendered HTML.
      if (!initialLoad.prerendered) {
        mm.add(MOTION_OK, () => {
          // Cinematic entrance: eyebrow → headline → copy → actions (the 3D stage fades in on its own).
          gsap
            .timeline({ defaults: { ease: 'expo.out' } })
            .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 1 }, 0.15)
            .from('.hero-word', { yPercent: 110, duration: 1.3, stagger: 0.06 }, 0.25)
            .from('.hero-sub', { autoAlpha: 0, y: 20, duration: 1.1 }, 0.75)
            .from('.hero-cta > *', { autoAlpha: 0, y: 18, duration: 1, stagger: 0.08 }, 0.9)
            .from('.hero-foot > *', { autoAlpha: 0, y: 14, duration: 1, stagger: 0.1 }, 1.1)
        })
      }
      mm.add(MOTION_OK, () => {
        // As the visitor scrolls on, copy lifts away while the structure rises (driven in the scene).
        gsap.to('.hero-copy', {
          yPercent: -18,
          autoAlpha: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 20%', scrub: true },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={section}
      aria-labelledby="hero-heading"
      data-stage="hero"
      className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden text-paper lg:min-h-[max(100svh,720px)]"
    >
      {/* Scrims keep the headline readable over the scene */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-t from-ink via-ink/85 via-45% to-transparent to-75% lg:bg-gradient-to-r lg:from-ink/90 lg:via-ink/40 lg:via-50% lg:to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="hero-copy shell flex flex-1 flex-col justify-end pb-10 pt-[50svh] sm:pt-[52svh] lg:justify-center lg:pb-0 lg:pt-[var(--header-h)]">
        <div className="max-w-[46rem] lg:max-w-[min(54vw,52rem)]">
          <p className="hero-eyebrow t-label flex items-center gap-3 text-paper/70">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-accent" />
            </span>
            {hero.eyebrow}
          </p>
          <h1 id="hero-heading" className="t-display mt-6">
            <Words text={before} />
            {emphasis && <Words text={emphasis} className="serif-em text-gold text-gold-shimmer pr-[0.06em]" />}
            <Words text={after} />
          </h1>
          <p className="hero-sub t-lead mt-7 max-w-[36rem] text-paper/72">{hero.subheadline}</p>
          <div className="hero-cta mt-9 flex flex-wrap gap-3">
            <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="ghost">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="hero-foot shell relative mt-10 grid grid-cols-1 items-end gap-6 pb-8 md:grid-cols-[1fr_auto] lg:mt-0 lg:pb-10">
        {isShown(hero.featuredService) && (
          <Link
            to={hero.featuredService.href}
            className="group flex max-w-md items-center gap-5 rounded-2xl border border-paper/12 bg-ink-raised/60 p-4 pr-5 backdrop-blur-md transition-colors hover:border-paper/30"
          >
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
              <span className="size-3 rounded-full bg-accent shadow-[0_0_24px_var(--brand-accent)]" />
            </span>
            <span className="min-w-0">
              <span className="t-label flex items-center gap-2 text-paper/60">
                {hero.featuredService.label}
                {hero.featuredService.placeholder && <PlaceholderBadge />}
              </span>
              <span className="mt-1 block font-medium">{hero.featuredService.title}</span>
              <span className="line-clamp-2 block text-sm text-paper/60">{hero.featuredService.summary}</span>
            </span>
            <ArrowRight aria-hidden="true" className="ml-auto size-5 shrink-0 text-paper/60 transition-transform duration-500 ease-expo group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        )}

        <a href="#intro" className="t-label hidden items-center gap-4 text-paper/55 transition-colors hover:text-paper md:flex">
          <span>Scroll to explore</span>
          <span aria-hidden="true" className="scroll-cue relative h-12 w-px overflow-hidden bg-paper/15" />
          <ArrowDown aria-hidden="true" className="size-4 md:hidden" />
        </a>
      </div>
    </section>
  )
}
