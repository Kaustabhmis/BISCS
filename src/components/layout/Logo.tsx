import { Link } from 'react-router'
import { site } from '../../config/site'
import { cn } from '../../lib/cn'

/** Agency logo. Uses `site.brand.logo` when set, otherwise a typographic wordmark. */
export function Logo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const { logo, shortName, wordmarkSuffix, name } = site.brand
  return (
    <Link to="/" className={cn('group inline-flex shrink-0 items-center gap-2.5', className)} aria-label={`${name} — home`}>
      {logo.src ? (
        <img
          src={logo.src}
          alt=""
          width={logo.width}
          height={logo.height}
          decoding="async"
          className={cn('w-auto transition-[filter] duration-500 group-hover:brightness-110', size === 'lg' ? 'h-14 md:h-16' : 'h-9 md:h-10')}
        />
      ) : (
        <>
          <span aria-hidden="true" className="relative grid size-8 place-items-center">
            <span className="absolute inset-0 rounded-full border border-current opacity-40" />
            <span className="size-2.5 rounded-full bg-accent" />
          </span>
          <span className="font-display text-[1.35rem] font-semibold leading-none tracking-[-0.045em]">
            {shortName}
            {wordmarkSuffix && <span className="ml-1 align-top font-mono text-[0.6rem] font-normal tracking-[0.1em] opacity-55">{wordmarkSuffix}</span>}
          </span>
        </>
      )}
    </Link>
  )
}
