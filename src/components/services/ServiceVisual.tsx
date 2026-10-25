import type { Service } from '../../types/content'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/**
 * A lightweight dimensional visual (CSS 3D, no WebGL): stacked translucent
 * planes — strategy, execution, growth — with the active service's icon
 * on top. Re-tilts each time the active service changes.
 */
export function ServiceVisual({ service, index, total }: { service: Service; index: number; total: number }) {
  return (
    <div aria-hidden="true" className="relative aspect-square w-full [perspective:1100px]">
      <div
        className="absolute inset-[12%] transition-transform duration-[1200ms] ease-expo [transform-style:preserve-3d] motion-reduce:transition-none"
        style={{ transform: `rotateX(58deg) rotateZ(${-35 + index * 24}deg)` }}
      >
        {[0, 1, 2].map((layer) => (
          <div
            key={layer}
            className={cn(
              'absolute inset-0 rounded-[28%] border transition-colors duration-700',
              layer === 2 ? 'border-paper/50 bg-paper/[0.07]' : 'border-paper/15 bg-paper/[0.03]',
            )}
            style={{ transform: `translateZ(${layer * 56}px)` }}
          >
            {layer === 0 && (
              <div className="absolute inset-[18%] rounded-full bg-[conic-gradient(from_0deg,var(--brand-accent),transparent_40%,var(--brand-signal)_70%,transparent)] opacity-40 blur-2xl" />
            )}
            {layer === 2 && (
              <div className="absolute inset-0 grid place-items-center [transform:translateZ(1px)]">
                <span className="grid size-24 place-items-center rounded-3xl bg-accent text-ink shadow-[0_30px_80px_-20px_var(--brand-accent)]">
                  <Icon name={service.icon} className="size-10" strokeWidth={1.4} />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="t-label absolute bottom-0 left-0 text-paper/60">
        <span className="text-accent">{String(index + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
      </p>
      <p className="t-label absolute bottom-0 right-0 max-w-[60%] truncate text-right text-paper/60">{service.category}</p>
    </div>
  )
}
