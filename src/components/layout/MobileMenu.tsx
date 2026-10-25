import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { mainNav, navCta } from '../../config/navigation'
import { site } from '../../config/site'
import { cn } from '../../lib/cn'
import { ButtonLink } from '../ui/Button'

/**
 * Full-screen mobile navigation dialog.
 * Traps focus while open, closes on Escape, and locks page scroll.
 */
export function MobileMenu({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto bg-ink lg:hidden"
    >
      <nav aria-label="Mobile" className="shell flex min-h-full flex-col justify-between gap-10 pb-10 pt-8">
        <ul className="flex flex-col">
          {mainNav.map((item, i) => (
            <li key={item.href} className="hairline border-b">
              <NavLink
                to={item.href}
                end={item.href === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-baseline gap-4 py-5 text-[2.5rem] font-medium leading-none tracking-[-0.04em] transition-colors',
                    isActive ? 'text-paper' : 'text-paper/55 hover:text-paper',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="t-label text-accent">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                    {isActive && <span className="sr-only">(current page)</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-6">
          <ButtonLink href={navCta.href} className="w-full">
            {navCta.label}
          </ButtonLink>
          {site.contact.email && (
            <a href={`mailto:${site.contact.email}`} className="text-paper/70 underline-offset-4 hover:underline">
              {site.contact.email}
            </a>
          )}
        </div>
      </nav>
    </div>
  )
}
