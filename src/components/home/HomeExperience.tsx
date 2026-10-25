import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { site } from '../../config/site'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../lib/cn'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { deviceTier, hasWebGL } from '../../lib/webgl'
import { HeroFallback } from '../hero/HeroFallback'
import type { SceneProgress } from '../hero/HeroScene'
import { ErrorBoundary } from '../ui/ErrorBoundary'

// three.js is loaded in its own chunk so it never blocks the first paint.
const HeroScene = lazy(() => import('../hero/HeroScene'))

/**
 * Wraps the hero and the company introduction with one sticky 3D stage, so
 * the scene keeps playing behind both: the engine assembles in the hero, then
 * bursts open into a constellation as the introduction scrolls through.
 *
 * Children must include an element with `data-stage="hero"` and one with
 * `id="intro"`; their scroll positions drive the scene.
 */
export function HomeExperience({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const progress = useRef<SceneProgress>({ hero: 0, journey: 0 })
  const pointer = useRef({ x: 0, y: 0 })
  const reducedMotion = usePrefersReducedMotion()
  const active = useInView(wrap)
  const [webgl] = useState(hasWebGL)
  const [quality] = useState(deviceTier)
  const [ready, setReady] = useState(false)
  const [loadScene, setLoadScene] = useState(false)

  // Load three.js once the page is idle, so the headline and CTAs render first.
  // The static illustration is shown until the scene is ready.
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
    const el = wrap.current
    const hero = el?.querySelector<HTMLElement>('[data-stage="hero"]')
    const intro = el?.querySelector<HTMLElement>('#intro')
    if (!el || !hero || !intro) return

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const triggers = [
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => (progress.current.hero = self.progress),
      }),
      ScrollTrigger.create({
        trigger: intro,
        start: 'top bottom',
        end: 'bottom bottom',
        onUpdate: (self) => (progress.current.journey = self.progress),
      }),
    ]

    // Dim the stage behind the introduction copy so it stays easy to read
    // (a fade, not motion, so it also applies with reduced motion).
    const dim = gsap.fromTo(
      stage.current,
      { opacity: 1 },
      { opacity: 0.6, ease: 'none', scrollTrigger: { trigger: intro, start: 'top 70%', end: 'top 10%', scrub: true } },
    )

    return () => {
      window.removeEventListener('pointermove', onPointer)
      triggers.forEach((t) => t.kill())
      dim.scrollTrigger?.kill()
      dim.kill()
    }
  }, [])

  return (
    <div ref={wrap} className="relative bg-ink">
      {/* Sticky 3D stage: pinned behind the hero and the introduction. */}
      <div ref={stage} className="sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden">
        <div className="page-enter absolute inset-0">
          <HeroFallback channels={site.hero.channels} className={cn('transition-opacity duration-1000', webgl && ready ? 'opacity-0' : 'opacity-100')} />
          {webgl && loadScene && (
            <ErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <div
                  role="img"
                  aria-label={site.hero.sceneDescription}
                  className={cn('absolute inset-0 transition-opacity duration-[1600ms]', ready ? 'opacity-100' : 'opacity-0')}
                >
                  <HeroScene
                    channels={site.hero.channels}
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
        <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
