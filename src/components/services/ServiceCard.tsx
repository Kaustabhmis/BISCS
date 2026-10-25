import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Service } from '../../types/content'
import { Icon } from '../ui/Icon'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'

/** Compact service link used in lists ("other services", category overviews). */
export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group relative flex h-full flex-col gap-6 border-t border-ink/15 pt-6 transition-colors"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-[-1px] h-px origin-left scale-x-0 bg-accent-ink transition-transform duration-700 ease-expo group-hover:scale-x-100" />
      <div className="flex items-center justify-between">
        <span className="t-label text-stone">{String(index + 1).padStart(2, '0')}</span>
        <ArrowUpRight aria-hidden="true" className="size-5 text-stone transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink" />
      </div>
      <Icon name={service.icon} className="size-7 text-accent-ink" />
      <div>
        <h3 className="text-xl font-medium tracking-[-0.02em]">{service.title}</h3>
        <p className="mt-2 text-stone">{service.intro}</p>
        {service.placeholder && <PlaceholderBadge className="mt-4" />}
      </div>
    </Link>
  )
}
