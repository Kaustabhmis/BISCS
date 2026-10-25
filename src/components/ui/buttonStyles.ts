import { cn } from '../../lib/cn'

export type Variant = 'primary' | 'ghost' | 'dark' | 'outline-dark'

const variants: Record<Variant, string> = {
  // Accent pill on dark backgrounds.
  primary: 'bg-accent text-ink hover:bg-paper',
  // Outlined on dark backgrounds.
  ghost: 'text-paper ring-1 ring-inset ring-paper/25 hover:ring-paper hover:bg-paper/5',
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
