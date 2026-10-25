import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonClass, type Variant } from './buttonStyles'
import { SmartLink } from './SmartLink'

/** The arrow glyph that slides out and back in on hover. */
export function ButtonArrow() {
  return (
    <span aria-hidden="true" className="relative -mr-1 inline-flex size-5 overflow-hidden">
      <ArrowUpRight className="size-5 transition-transform duration-500 ease-expo group-hover/btn:translate-x-5 group-hover/btn:-translate-y-5" strokeWidth={1.75} />
      <ArrowUpRight className="absolute inset-0 size-5 -translate-x-5 translate-y-5 transition-transform duration-500 ease-expo group-hover/btn:translate-x-0 group-hover/btn:translate-y-0" strokeWidth={1.75} />
    </span>
  )
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  arrow = true,
}: {
  href: string
  children: ReactNode
  variant?: Variant
  className?: string
  arrow?: boolean
}) {
  return (
    <SmartLink href={href} className={buttonClass(variant, className)}>
      <span>{children}</span>
      {arrow && <ButtonArrow />}
    </SmartLink>
  )
}
