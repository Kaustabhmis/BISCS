import { useParams } from 'react-router'
import { Seo } from '../components/Seo'
import { ServiceCard } from '../components/services/ServiceCard'
import { ServiceDetail } from '../components/services/ServiceDetail'
import { CtaBand } from '../components/ui/CtaBand'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import { services as allServices } from '../data/services'
import { visible } from '../lib/content'
import NotFoundPage from './NotFoundPage'

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const services = visible(allServices)
  const index = services.findIndex((s) => s.slug === slug)
  const service = services[index]
  if (!service) return <NotFoundPage />

  const related = services.filter((s) => s.slug !== service.slug && s.category === service.category).slice(0, 3)
  const others = related.length >= 3 ? related : [...related, ...services.filter((s) => s.slug !== service.slug && !related.includes(s))].slice(0, 3)

  return (
    <>
      <Seo title={service.title} description={service.intro} path={`/services/${service.slug}`} />
      <PageHeader
        label={`Services · ${service.category}`}
        title={service.title}
        aside={
          <div className="flex items-center gap-4 lg:justify-end">
            {service.placeholder && <PlaceholderBadge />}
            <span className="grid size-20 place-items-center rounded-3xl bg-accent text-ink shadow-[0_30px_80px_-24px_var(--brand-accent)]">
              <Icon name={service.icon} className="size-9" />
            </span>
          </div>
        }
      >
        <p>{service.intro}</p>
      </PageHeader>

      <div className="on-paper bg-paper text-ink">
        <div className="shell grid py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-3">
            <ServiceDetail service={service} index={index} standalone />
          </div>
        </div>

        {others.length > 0 && (
          <section aria-labelledby="more-services" className="shell pb-24">
            <h2 id="more-services" className="t-h3">
              Explore more services
            </h2>
            <ul className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {others.map((s) => (
                <li key={s.slug}>
                  <ServiceCard service={s} index={services.indexOf(s)} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <CtaBand />
    </>
  )
}
