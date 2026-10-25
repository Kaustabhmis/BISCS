import { Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { site } from '../../config/site'
import { brands as allBrands } from '../../data/brands'
import { cn } from '../../lib/cn'
import { visible } from '../../lib/content'
import type { Brand } from '../../types/content'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'
import { SectionLabel } from '../ui/SectionLabel'

function BrandLogo({ brand }: { brand: Brand }) {
  const inner = brand.logo ? (
    <img
      src={brand.logo}
      alt={brand.name}
      width={brand.width}
      height={brand.height}
      loading="lazy"
      decoding="async"
      className="h-8 w-auto max-w-[9rem] object-contain grayscale transition-[filter,opacity] duration-500 group-hover:grayscale-0 md:h-9"
    />
  ) : (
    // Neutral slot for a brand that has not been supplied yet.
    <span className="flex items-center gap-3 text-ink/70">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-dashed border-ink/30">
        <span className="size-2 rounded-full bg-ink/25" />
      </span>
      <span className="font-display text-lg font-medium tracking-[-0.03em]">{brand.name}</span>
    </span>
  )

  return (
    <div className="group flex h-24 shrink-0 items-center justify-center px-10 opacity-70 transition-opacity duration-500 hover:opacity-100 md:h-28 md:px-14">
      {brand.href ? (
        <a href={brand.href} target="_blank" rel="noopener noreferrer" aria-label={`${brand.name} (opens in a new tab)`}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  )
}

/**
 * Continuous logo marquee. Pauses on hover, on keyboard focus and with the
 * pause button; becomes a static, swipeable row for reduced-motion users.
 */
export function BrandCarousel() {
  const brands = visible(allBrands)
  const [paused, setPaused] = useState(false)
  if (brands.length === 0) return null
  const hasPlaceholders = brands.some((b) => b.placeholder)
  // Repeat short lists so one track is always wider than the viewport.
  const track = brands.length < 6 ? [...brands, ...brands, ...brands] : brands

  return (
    <section aria-labelledby="brands-heading" className="on-paper relative bg-paper pb-16 pt-20 text-ink md:pb-20 md:pt-28">
      <div className="shell flex flex-wrap items-end justify-between gap-6">
        <div>
          <SectionLabel index="02" className="text-stone">
            {site.brandsSection.label}
          </SectionLabel>
          <h2 id="brands-heading" className="t-h3 mt-5 max-w-xl">
            {site.brandsSection.heading}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {hasPlaceholders && <PlaceholderBadge label="Placeholder logos" />}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="grid size-11 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink motion-reduce:hidden"
            aria-label={paused ? 'Play logo animation' : 'Pause logo animation'}
            aria-pressed={paused}
          >
            {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'group/marquee relative mt-12 overflow-hidden border-y border-ink/10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]',
          'motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]',
          paused && 'marquee-paused',
          'hover:[&_.marquee-track]:[animation-play-state:paused] focus-within:[&_.marquee-track]:[animation-play-state:paused]',
        )}
      >
        <ul
          className="marquee-track flex w-max motion-reduce:w-auto motion-reduce:snap-x"
          style={{ ['--marquee-duration' as string]: `${track.length * 5}s` }}
          aria-label={site.brandsSection.heading}
        >
          {track.map((b, i) => (
            <li key={`a-${i}`} className="motion-reduce:snap-start">
              <BrandLogo brand={b} />
            </li>
          ))}
          {/* Duplicate track for a seamless loop; hidden from assistive tech. */}
          {track.map((b, i) => (
            <li key={`b-${i}`} aria-hidden="true" className="motion-reduce:hidden" inert>
              <BrandLogo brand={b} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
