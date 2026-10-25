import { cn } from '../../lib/cn'
import { whatsappUrl } from '../../lib/whatsapp'

/** WhatsApp glyph: speech bubble with a handset. */
export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M12 2.75a9.25 9.25 0 0 0-7.98 13.93l-1.27 4.57 4.7-1.23A9.25 9.25 0 1 0 12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 7.6c-.2-.45-.42-.46-.62-.47h-.53a1 1 0 0 0-.73.34c-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.9 3.04 4.69 4.13 2.32.91 2.79.73 3.3.69.5-.05 1.62-.66 1.85-1.3.23-.64.23-1.19.16-1.3-.07-.12-.25-.19-.53-.32-.27-.14-1.62-.8-1.87-.89-.25-.09-.43-.14-.62.14-.18.27-.71.89-.87 1.07-.16.18-.32.2-.6.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.36-1.62-1.52-1.89-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.6-1.5-.84-2.05Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Opens a WhatsApp chat with the configured number and a pre-filled message.
 * Renders nothing when no WhatsApp number is configured.
 */
export function WhatsAppButton({
  label = 'Chat on WhatsApp',
  className,
  tone = 'dark',
}: {
  label?: string
  className?: string
  /** `dark` for dark backgrounds, `light` for ivory backgrounds. */
  tone?: 'dark' | 'light'
}) {
  const href = whatsappUrl()
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group/wa inline-flex min-h-12 items-center gap-3 whitespace-nowrap rounded-full py-2 pl-2 pr-6 text-[0.95rem] font-medium transition-[box-shadow,background-color] duration-500 ease-expo',
        tone === 'dark'
          ? 'bg-paper/[0.06] text-paper ring-1 ring-inset ring-[#25D366]/40 hover:bg-[#25D366]/10 hover:ring-[#25D366]'
          : 'bg-ink text-paper hover:shadow-[0_14px_40px_-14px_#25D366]',
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-full bg-[#25D366] text-[#06260f] transition-transform duration-500 ease-expo group-hover/wa:scale-110">
        <WhatsAppGlyph className="size-5" />
      </span>
      {label}
      <span className="sr-only">(opens WhatsApp in a new tab)</span>
    </a>
  )
}
