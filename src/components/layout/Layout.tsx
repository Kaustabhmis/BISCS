import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ScrollTrigger } from '../../lib/gsap'
import { initialLoad } from '../../lib/hydration'
import { loadLiveContent } from '../../lib/liveContent'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  const { pathname, hash } = useLocation()
  const firstPath = useRef(pathname)

  // Fetch the live content from the Google Sheet. This runs only after the
  // page (including its lazily loaded code) has hydrated, so swapping in new
  // content never conflicts with the pre-rendered HTML.
  useEffect(() => {
    loadLiveContent()
  }, [])

  // Once the visitor navigates, pages are rendered client-side and animate normally.
  useEffect(() => {
    if (pathname !== firstPath.current) initialLoad.prerendered = false
  }, [pathname])

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
