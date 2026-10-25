import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ScrollTrigger } from '../../lib/gsap'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  const { pathname, hash } = useLocation()

  // Scroll to top (or to the hash target) on navigation, then recalculate scroll animations.
  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname, hash])

  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1} key={pathname} className="page-enter outline-none">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
