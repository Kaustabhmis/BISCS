import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { mainNav, navCta } from '../../config/navigation'
import { cn } from '../../lib/cn'
import { ButtonLink } from '../ui/Button'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu on navigation (state adjusted during render, per React guidance).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mql.matches && setOpen(false)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  const solid = scrolled || open

  return (
    <>
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[var(--header-h)] text-paper transition-[background-color,border-color,backdrop-filter] duration-500',
        solid ? 'border-b border-paper/10 bg-ink/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
      )}
    >
      <a
        href="#main"
        className="t-label sr-only rounded-full bg-accent px-4 py-2 text-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <div className="shell flex h-full items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-paper/10 bg-ink/30 p-1 backdrop-blur-md">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 rounded-full px-4 py-2 text-[0.9rem] transition-colors duration-300',
                      isActive ? 'bg-paper/10 text-paper' : 'text-paper/65 hover:text-paper',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn('size-1.5 rounded-full bg-accent transition-transform duration-500 ease-expo', isActive ? 'scale-100' : 'scale-0')}
                      />
                      {item.label}
                      {isActive && <span className="sr-only">(current page)</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block">
            <ButtonLink href={navCta.href} className="min-h-11 px-5 py-2.5 text-sm">
              {navCta.label}
            </ButtonLink>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center rounded-full border border-paper/20 transition-colors hover:border-paper lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => (open ? close() : setOpen(true))}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
    {/* Outside <header>: its backdrop-filter would otherwise become the containing block for this fixed panel. */}
    <MobileMenu id="mobile-menu" open={open} onClose={close} />
    </>
  )
}
