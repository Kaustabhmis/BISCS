import { site } from '../config/site'

/** Click-to-chat link for the configured WhatsApp number, or '' when not configured. */
export function whatsappUrl(message = site.contact.whatsappMessage): string {
  const number = site.contact.whatsapp.replace(/\D/g, '')
  if (!number) return ''
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
