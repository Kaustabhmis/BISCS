import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react'
import { gsap, MOTION_OK } from '../../lib/gsap'
import { initialLoad } from '../../lib/hydration'

/**
 * Reveals its direct children with a short staggered rise when scrolled into
 * view. Content is fully visible without JavaScript and with reduced motion.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  stagger = 0.08,
  y = 28,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
  stagger?: number
  y?: number
}) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Content already visible in the pre-rendered page is left as is (no flash).
    if (initialLoad.prerendered && el.getBoundingClientRect().top < window.innerHeight) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(el.children, {
        y,
        opacity: 0,
        duration: 1.2,
        stagger,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    })
    return () => mm.revert()
  }, [stagger, y])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
