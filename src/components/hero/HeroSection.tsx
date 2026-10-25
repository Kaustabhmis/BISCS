import { ArrowDown, ArrowRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { site } from '../../config/site'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../lib/cn'
import { isShown, splitEmphasis } from '../../lib/content'
import { gsap, MOTION_OK } from '../../lib/gsap'
import { deviceTier, hasWebGL } from '../../lib/webgl'
import { ButtonLink } from '../ui/Button'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'
import { HeroFallback } from './HeroFallback'

// three.js is loaded in its own chunk so it never blocks the first paint.
const HeroScene = lazy(() => import('./HeroScene'))

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
  const sceneLayer = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const reducedMotion = usePrefersReducedMotion()
  const active = useInView(section)
  const [webgl] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  const [loadScene, setLoadScene] = useState(false)
  const [quality] = useState(deviceTier)
  const [before, emphasis, after] = splitEmphasis(hero.headline, hero.headlineEmphasis)

  // Load three.js only once the page is idle, so the headline and CTAs render
  // first. The static illustration is shown until the scene is ready.
  useEffect(() => {
    if (!webgl) return
    let idleId: number | undefined
    let timer: number | undefined
    const start = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => setLoadScene(true), { timeout: 2500 })
      } else {
        timer = window.setTimeout(() => setLoadScene(true), 600)
      }
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      if (idleId !== undefined) window.cancelIdleCallback(idleId)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [webgl])

  useLayoutEffect(() => {
    const el = section.current
    if (!el) return

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const ctx = gsap.context(() => {
      // Scroll progress feeds the 3D camera; works with or without reduced motion.
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => (progress.current = self.progress),
        },
      })

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // Cinematic entrance: atmosphere → structure → headline → copy → actions.
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.from('.hero-atmos', { autoAlpha: 0, scale: 1.08, duration: 2 }, 0)
          .from(sceneLayer.current, { autoAlpha: 0, duration: 1.6 }, 0.15)
          .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 1 }, 0.45)
          .from('.hero-word', { yPercent: 110, duration: 1.3, stagger: 0.06 }, 0.55)
          .from('.hero-sub', { autoAlpha: 0, y: 20, duration: 1.1 }, 1.05)
          .from('.hero-cta > *', { autoAlpha: 0, y: 18, duration: 1, stagger: 0.08 }, 1.2)
          .from('.hero-foot > *', { autoAlpha: 0, y: 14, duration: 1, stagger: 0.1 }, 1.4)

        // As the visitor scrolls on, copy lifts away while the structure rises (driven in the scene).
        gsap.to('.hero-copy', {
          yPercent: -18,
          autoAlpha: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 20%', scrub: true },
        })
        gsap.to(sceneLayer.current, {
          autoAlpha: 0.25,
          ease: 'none',
          scrollTrigger: { trigger: el, start: '40% top', end: 'bottom top', scrub: true },
        })
      })
    }, el)

    return () => {
      window.removeEventListener('pointermove', onPointer)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={section}
      aria-labelledby="hero-heading"
      className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-paper lg:min-h-[max(100svh,720px)]"
    >
      {/* Atmosphere */}
      <div aria-hidden="true" className="hero-atmos absolute inset-0 -z-20">
        <div className="grid-lines absolute inset-0" />
        <div className="absolute right-[-10%] top-[10%] size-[70vmax] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-accent)_16%,transparent),transparent)] lg:top-[-5%]" />
        <div className="absolute left-[-20%] bottom-[-30%] size-[60vmax] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-signal)_9%,transparent),transparent)]" />
      </div>

      {/* 3D centrepiece */}
      <div ref={sceneLayer} className="absolute inset-x-0 top-0 -z-10 h-[100svh] min-h-[640px]">
        <HeroFallback
          channels={hero.channels}
          className={cn('transition-opacity duration-1000', webgl && ready ? 'opacity-0' : 'opacity-100')}
        />
        {webgl && loadScene && (
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <div
                role="img"
                aria-label={hero.sceneDescription}
                className={cn('absolute inset-0 transition-opacity duration-1000', ready ? 'opacity-100' : 'opacity-0')}
              >
                <HeroScene
                  channels={hero.channels}
                  progress={progress}
                  pointer={pointer}
                  active={active}
                  reducedMotion={reducedMotion}
                  quality={quality}
                  onReady={() => setReady(true)}
                />
              </div>
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

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
            {emphasis && <Words text={emphasis} className="serif-em pr-[0.06em] text-accent" />}
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
