import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import { ButtonLink } from '../components/ui/Button'
import { mainNav } from '../config/navigation'
import { site } from '../config/site'

export default function NotFoundPage() {
  return (
    <>
      <Seo {...site.seo.pages.notFound} path="/404" />
      <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink pt-[var(--header-h)] text-paper">
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
        <svg aria-hidden="true" viewBox="0 0 600 600" className="absolute -right-40 top-1/2 -z-10 w-[min(900px,130vw)] -translate-y-1/2 opacity-70 md:-right-10">
          <ellipse cx="300" cy="300" rx="250" ry="90" fill="none" stroke="var(--brand-paper)" strokeOpacity="0.15" transform="rotate(-20 300 300)" />
          <ellipse cx="300" cy="300" rx="180" ry="60" fill="none" stroke="var(--brand-paper)" strokeOpacity="0.12" strokeDasharray="4 10" transform="rotate(14 300 300)" />
          <circle cx="300" cy="300" r="34" fill="var(--brand-accent)" fillOpacity="0.9" />
          {/* A channel node that has drifted off its orbit */}
          <circle cx="545" cy="120" r="9" fill="var(--brand-signal)" />
          <path d="M535 128 Q 430 200 330 290" fill="none" stroke="var(--brand-signal)" strokeOpacity="0.4" strokeDasharray="2 8" />
        </svg>
        <div className="shell">
          <p className="t-label text-accent">Error 404 — signal lost</p>
          <h1 className="t-display mt-6 max-w-[12ch]">
            This page drifted <span className="serif-em text-accent">off orbit</span>.
          </h1>
          <p className="t-lead mt-8 max-w-lg text-paper/70">
            The page you’re looking for doesn’t exist or has moved. Let’s reconnect you with something useful.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/">Back to home</ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Contact us
            </ButtonLink>
          </div>
          <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-paper/60">
            {mainNav.map((n) => (
              <li key={n.href}>
                <Link to={n.href} className="hover:text-accent">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
