import { ShieldCheck } from 'lucide-react'
import { NetlifyForm } from '../components/contact/NetlifyForm'
import { Seo } from '../components/Seo'
import { PageHeader } from '../components/ui/PageHeader'
import { site } from '../config/site'

/**
 * Customers submit feedback here. Submissions go to Netlify Forms ("feedback")
 * for review; nothing is published automatically.
 */
export default function FeedbackPage() {
  const page = site.feedbackPage
  return (
    <>
      <Seo {...site.seo.pages.feedback} path="/feedback" />
      <PageHeader label={page.label} title={page.heading} emphasis="hear from you.">
        <p>{page.intro}</p>
      </PageHeader>
      <section aria-label="Feedback form" className="on-paper bg-paper text-ink">
        <div className="shell grid gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="t-h3 mb-10">Your feedback</h2>
            <NetlifyForm config={site.feedbackForm} />
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="rounded-3xl bg-ink p-8 text-paper lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <ShieldCheck aria-hidden="true" className="size-8 text-accent" strokeWidth={1.5} />
              <h2 className="mt-5 text-xl font-medium tracking-[-0.02em]">How we handle reviews</h2>
              <ul className="mt-5 space-y-4">
                {page.notes.map((n) => (
                  <li key={n} className="flex gap-3 text-sm text-paper/75">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-accent" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
