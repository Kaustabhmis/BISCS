import { useSearchParams } from 'react-router'
import { site } from '../../config/site'
import { services } from '../../data/services'
import { useHydrated } from '../../hooks/useHydrated'
import { NetlifyForm } from './NetlifyForm'

/** Project enquiry form. `/contact?service=<slug>` pre-selects that service. */
export function ContactForm() {
  const [params] = useSearchParams()
  // The query string isn't known when pages are pre-rendered, so apply the
  // pre-selection after hydration (the key re-mounts the form with it).
  const hydrated = useHydrated()
  const svc = hydrated ? services.find((s) => s.slug === params.get('service')) : undefined
  return <NetlifyForm key={svc?.slug ?? 'none'} config={site.contactForm} prefill={svc ? { service: svc.title } : undefined} />
}
