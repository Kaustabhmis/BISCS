import { cn } from '../../lib/cn'

/** Visible marker for temporary development content. */
export function PlaceholderBadge({ className, label = 'Placeholder' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        't-label inline-flex items-center gap-1.5 rounded-full border border-dashed border-current px-2.5 py-1 text-[0.625rem] opacity-70',
        className,
      )}
      title="Temporary content — replace in src/config or src/data before launch"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
