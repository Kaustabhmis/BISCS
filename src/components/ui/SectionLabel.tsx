import { cn } from '../../lib/cn'

/** Small mono eyebrow with an index number, e.g. "01 — Who we are". */
export function SectionLabel({ index, children, className }: { index?: string; children: string; className?: string }) {
  return (
    <p className={cn('t-label flex items-center gap-3', className)}>
      {index && <span className="text-accent in-[.on-paper]:text-accent-ink">{index}</span>}
      {index && <span aria-hidden="true" className="h-px w-8 bg-current opacity-30" />}
      <span>{children}</span>
    </p>
  )
}
