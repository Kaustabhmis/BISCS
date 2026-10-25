import type { ReactNode } from 'react'
import { splitEmphasis } from '../../lib/content'
import { SectionLabel } from './SectionLabel'

/** Dark editorial page header shared by inner pages. */
export function PageHeader({
  label,
  title,
  emphasis = '',
  children,
  aside,
}: {
  label: string
  title: string
  /** Part of the title to set in italic serif. */
  emphasis?: string
  children?: ReactNode
  aside?: ReactNode
}) {
  const [before, em, after] = splitEmphasis(title, emphasis)
  return (
    <header className="grain relative isolate overflow-hidden bg-ink pb-16 pt-[calc(var(--header-h)+4rem)] text-paper md:pb-24 md:pt-[calc(var(--header-h)+7rem)]">
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden="true" className="absolute -right-[15%] -top-[30%] -z-10 size-[60vmax] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-accent)_14%,transparent),transparent)]" />
      <div className="shell page-enter">
        <SectionLabel className="text-paper/60">{label}</SectionLabel>
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="t-h1 max-w-[18ch]">
              {before}
              {em && <span className="serif-em text-gold text-gold-shimmer pr-[0.04em]">{em}</span>}
              {after}
            </h1>
            {children && <div className="t-lead mt-8 max-w-2xl text-paper/70">{children}</div>}
          </div>
          {aside && <div className="lg:col-span-4">{aside}</div>}
        </div>
      </div>
    </header>
  )
}
