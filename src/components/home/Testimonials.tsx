import { ArrowLeft, ArrowRight, MessageSquareQuote, Quote, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { site } from '../../config/site'
import { testimonials as allTestimonials } from '../../data/testimonials'
import { cn } from '../../lib/cn'
import { visible } from '../../lib/content'
import type { Testimonial } from '../../types/content'
import { ButtonLink } from '../ui/Button'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <p className="flex gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden="true" className={cn('size-4', i < value ? 'fill-accent text-accent' : 'text-ink/20')} strokeWidth={1.5} />
      ))}
    </p>
  )
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gold-soft bg-[color-mix(in_oklab,var(--brand-paper)_55%,white)] p-7 shadow-[0_1px_0_white_inset,0_30px_60px_-40px_color-mix(in_oklab,var(--brand-gold-deep)_55%,transparent)] transition-[transform,box-shadow] duration-700 ease-expo hover:-translate-y-1 hover:shadow-[0_1px_0_white_inset,0_40px_70px_-36px_color-mix(in_oklab,var(--brand-gold-deep)_70%,transparent)] md:p-9">
      {/* Gold sheen on hover */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-accent)_30%,transparent),transparent)] opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="relative flex items-center justify-between gap-4">
        <span aria-hidden="true" className="bg-gold grid size-11 place-items-center rounded-full text-ink">
          <Quote className="size-4" fill="currentColor" strokeWidth={0} />
        </span>
        {t.rating ? <Stars rating={t.rating} /> : t.placeholder ? <PlaceholderBadge className="text-accent-ink" /> : null}
      </div>
      <blockquote className="relative mt-6 flex-1 text-lg leading-relaxed tracking-[-0.01em] text-ink/90 md:text-xl">
        <p>{t.quote}</p>
      </blockquote>
      <figcaption className="relative mt-8 flex items-center gap-4 border-t border-ink/10 pt-6">
        {t.portrait ? (
          <img src={t.portrait.src} alt={t.portrait.alt} width={52} height={52} loading="lazy" className="size-13 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="bg-gold grid size-13 shrink-0 place-items-center rounded-full font-display text-lg font-semibold text-ink">
            {t.name.charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-medium">{t.name}</span>
          <span className="block truncate text-sm text-stone">
            {[t.role, t.company].filter(Boolean).join(', ')}
            {t.project && <> · {t.project}</>}
          </span>
        </span>
        {t.logo && <img src={t.logo.src} alt={t.logo.alt} width={t.logo.width} height={t.logo.height} loading="lazy" className="ml-auto h-7 w-auto" />}
      </figcaption>
    </figure>
  )
}

/**
 * Customer feedback cards in a swipeable row with previous / next controls
 * and a progress bar. Never auto-advances. Visitors can add their own
 * feedback via /feedback (reviewed before publishing).
 */
export function Testimonials() {
  const items = visible(allTestimonials)
  const track = useRef<HTMLUListElement>(null)
  const [progress, setProgress] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const share = site.testimonialsSection.shareCta

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setProgress(max > 0 ? el.scrollLeft / max : 1)
      setAtStart(el.scrollLeft <= 4)
      setAtEnd(el.scrollLeft >= max - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [items.length])

  const go = (dir: number) => {
    const el = track.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 24), behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="testimonials-heading" className="on-paper relative overflow-hidden bg-paper pb-24 text-ink md:pb-36">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-ink/10 pt-16 md:pt-24">
          <div>
            <SectionLabel index="03" className="text-stone">
              {site.testimonialsSection.label}
            </SectionLabel>
            <h2 id="testimonials-heading" className="t-h2 mt-5">
              {site.testimonialsSection.heading}
            </h2>
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={atStart}
                aria-controls="testimonial-track"
                aria-label="Previous testimonials"
                className="grid size-12 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={atEnd}
                aria-controls="testimonial-track"
                aria-label="Next testimonials"
                className="grid size-12 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <ul
            id="testimonial-track"
            ref={track}
            aria-label="Customer testimonials"
            className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-5 pb-6 [scrollbar-width:none] sm:px-8 scroll-px-5 sm:scroll-px-8 lg:px-[max(3rem,calc((100vw_-_1440px)/2_+_3rem))] lg:scroll-px-[max(3rem,calc((100vw_-_1440px)/2_+_3rem))] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((t, i) => (
              <li key={i} className="w-[min(86vw,26rem)] shrink-0 snap-start md:w-[28rem]">
                <TestimonialCard t={t} />
              </li>
            ))}
          </ul>
          <div className="shell mt-8">
            <div aria-hidden="true" className="h-px w-full max-w-xs overflow-hidden bg-ink/10">
              <div className="bg-gold h-full origin-left transition-transform duration-300" style={{ transform: `scaleX(${Math.max(0.12, progress)})` }} />
            </div>
          </div>
        </>
      ) : null}

      {/* Invite customers to add their own feedback. */}
      <Reveal className="shell mt-14">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[1.75rem] bg-ink p-8 text-paper md:flex-row md:items-center md:p-10">
          <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-24 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-accent)_28%,transparent),transparent)]" />
          <div className="relative flex items-center gap-5">
            <span aria-hidden="true" className="bg-gold grid size-14 shrink-0 place-items-center rounded-2xl text-ink">
              <MessageSquareQuote className="size-7" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-xl font-medium tracking-[-0.02em]">{items.length > 0 ? 'Worked with us?' : 'Be the first to share your experience.'}</p>
              <p className="mt-1 text-paper/65">Tell other business owners what it was like. Every review is checked before it’s published.</p>
            </div>
          </div>
          <ButtonLink href={share.href} className="relative">
            {share.label}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}
