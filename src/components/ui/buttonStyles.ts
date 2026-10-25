import { cn } from '../../lib/cn'

export type Variant = 'primary' | 'ghost' | 'dark' | 'outline-dark'

const variants: Record<Variant, string> = {
  // Metallic gold pill.
  primary: 'bg-gold text-ink',
  // Outlined on dark backgrounds, warming to gold on hover.
  ghost: 'text-paper ring-1 ring-inset ring-paper/20 hover:ring-accent/70 hover:bg-accent/[0.06] hover:text-gold-light',
  // Solid ink on light backgrounds.
  dark: 'bg-ink text-paper hover:bg-accent-ink',
  // Outlined on light backgrounds.
  'outline-dark': 'text-ink ring-1 ring-inset ring-ink/25 hover:ring-ink hover:bg-ink/5',
}

export const buttonClass = (variant: Variant = 'primary', className?: string) =>
  cn(
    'group/btn relative inline-flex whitespace-nowrap min-h-12 items-center justify-center gap-3 overflow-hidden rounded-full px-6 py-3 text-[0.95rem] font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow] duration-300 ease-expo disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    className,
  )
