import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { site } from '../../config/site'
import { testimonials as allTestimonials } from '../../data/testimonials'
import { cn } from '../../lib/cn'
import { visible } from '../../lib/content'
import { gsap, MOTION_OK } from '../../lib/gsap'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'
import { SectionLabel } from '../ui/SectionLabel'

/**
 * Editorial testimonial carousel: one large quote at a time with previous /
 * next controls and progress. No autoplay, so visitors read at their own pace.
 */
export function Testimonials() {
  const items = visible(allTestimonials)
  const [index, setIndex] = useState(0)
  const quoteRef = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = quoteRef.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(el.querySelectorAll('.q-anim'), { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.06 })
    })
    return () => mm.revert()
  }, [index])

  if (items.length === 0) return null
  const t = items[index]
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length)

  return (
    <section aria-labelledby="testimonials-heading" className="on-paper relative overflow-hidden bg-paper pb-24 text-ink md:pb-36">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-ink/10 pt-20 md:pt-28">
          <div>
            <SectionLabel index="03" className="text-stone">
              {site.testimonialsSection.label}
            </SectionLabel>
            <h2 id="testimonials-heading" className="t-h3 mt-5">
              {site.testimonialsSection.heading}
            </h2>
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="grid size-12 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-paper">
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="grid size-12 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-paper">
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="relative mt-24 grid gap-10 md:mt-28 lg:grid-cols-12">
          <span aria-hidden="true" className="serif-em pointer-events-none absolute -left-1 -top-16 select-none text-[9rem] leading-[0.8] text-accent/90 md:-top-20 md:text-[12rem] lg:left-0">
            “
          </span>
          <div ref={quoteRef} className="relative lg:col-span-10 lg:col-start-2" aria-live="polite" aria-atomic="true">
            <figure>
              {t.placeholder && <PlaceholderBadge className="q-anim mb-6 text-accent-ink" label="Placeholder testimonial" />}
              <blockquote className="q-anim t-statement">
                <p>{t.quote}</p>
              </blockquote>
              <figcaption className="q-anim mt-12 flex flex-wrap items-center gap-5">
                {t.portrait ? (
                  <img src={t.portrait.src} alt={t.portrait.alt} width={56} height={56} loading="lazy" className="size-14 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-ink font-display text-lg text-paper">
                    {t.name.charAt(0)}
                  </span>
                )}
                <span>
                  <span className="block font-medium">{t.name}</span>
                  <span className="block text-stone">
                    {t.role}, {t.company}
                    {t.project && <> · {t.project}</>}
                  </span>
                </span>
                {t.logo && <img src={t.logo.src} alt={t.logo.alt} width={t.logo.width} height={t.logo.height} loading="lazy" className="ml-auto h-8 w-auto" />}
              </figcaption>
            </figure>
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-16 flex items-center gap-4 lg:ml-[calc(100%/12)]">
            <span className="t-label tabular-nums text-stone">
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <div className="flex gap-2" role="group" aria-label="Choose testimonial">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  aria-current={i === index}
                  className="group flex h-11 items-center"
                >
                  <span className={cn('block h-[3px] rounded-full transition-all duration-700 ease-expo', i === index ? 'w-14 bg-ink' : 'w-6 bg-ink/20 group-hover:bg-ink/50')} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
