import { Seo } from '../components/Seo'
import { ButtonLink } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import { site } from '../config/site'

/**
 * Legal pages (privacy, terms). Content comes from `site.legal`. Until real
 * policies are supplied the page shows a clear notice and is not indexed.
 * Do not publish invented legal text — have it written or reviewed properly.
 */
export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const doc = site.legal[kind]
  const path = `/${kind}`
  const pending = doc.body.length === 0
  return (
    <>
      <Seo
        title={doc.title}
        description={`${doc.title} for ${site.brand.name}.`}
        path={path}
        noindex={pending}
      />
      <PageHeader label="Legal" title={doc.title} />
      <section className="on-paper bg-paper py-16 text-ink md:py-24">
        <div className="shell max-w-3xl">
          {pending ? (
            <div className="rounded-3xl border border-dashed border-ink/25 p-8 md:p-12">
              <PlaceholderBadge label="Awaiting content" />
              <p className="t-lead mt-6">
                This {doc.title.toLowerCase()} has not been published yet.
              </p>
              <p className="mt-4 text-stone">
                If you have a question about how we handle information in the meantime, please get in touch.
              </p>
              <ButtonLink href="/contact" variant="dark" className="mt-8">
                Contact us
              </ButtonLink>
            </div>
          ) : (
            <div className="space-y-5 text-lg leading-relaxed">
              {doc.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
