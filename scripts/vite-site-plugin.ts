import type { Plugin } from 'vite'
import { site } from '../src/config/site.ts'
import { sitemapRoutes } from '../src/config/routes.ts'

/**
 * Build-time integration between `src/config/site.ts` and the static output:
 *
 *  - injects brand colours / fonts as CSS variables (no flash of default theme)
 *  - fills the default <title>, description, Open Graph and Twitter tags.
 *    Tags marked data-static-head are replaced at runtime by <Seo> per page.
 *  - injects the hidden static form Netlify needs to detect the contact form
 *  - emits sitemap.xml and robots.txt using the configured site URL
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function resolveSiteUrl(env: Record<string, string | undefined>): string {
  return (env.VITE_SITE_URL || site.seo.siteUrl).replace(/\/$/, '')
}

function themeCss(): string {
  const c = site.colors
  const t = site.typography
  const vars: Record<string, string> = {
    '--brand-ink': c.ink,
    '--brand-ink-raised': c.inkRaised,
    '--brand-paper': c.paper,
    '--brand-paper-deep': c.paperDeep,
    '--brand-ash': c.ash,
    '--brand-stone': c.stone,
    '--brand-accent': c.accent,
    '--brand-accent-ink': c.accentInk,
    '--brand-signal': c.signal,
    '--brand-gold-light': c.goldLight,
    '--brand-gold-deep': c.goldDeep,
    '--brand-font-display': t.display,
    '--brand-font-serif': t.serif,
    '--brand-font-body': t.body,
    '--brand-font-mono': t.mono,
  }
  // `:root:root` outranks the fallback :root values in src/styles/index.css.
  return `:root:root{color-scheme:dark;${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`
}

function headTags(url: string): string {
  const home = site.seo.pages.home
  const og = `${url}${site.seo.ogImage}`
  const tags = [
    `<title data-static-head>${esc(home.title)}</title>`,
    `<meta data-static-head name="description" content="${esc(home.description)}" />`,
    `<meta name="theme-color" content="${site.colors.ink}" />`,
    `<link rel="icon" href="${site.brand.favicon}" type="image/png" />`,
    `<link rel="apple-touch-icon" href="${site.brand.appleTouchIcon}" />`,
    `<meta property="og:site_name" content="${esc(site.brand.name)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${site.seo.locale}" />`,
    `<meta data-static-head property="og:title" content="${esc(home.title)}" />`,
    `<meta data-static-head property="og:description" content="${esc(home.description)}" />`,
    `<meta data-static-head property="og:url" content="${url}/" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${og}" />`,
  ]
  if (site.seo.twitterHandle) tags.push(`<meta name="twitter:site" content="${esc(site.seo.twitterHandle)}" />`)
  return tags.join('\n    ')
}

/** Hidden HTML forms so Netlify registers each form and its fields at deploy time. */
function netlifyForms(): string {
  return [site.contactForm, site.feedbackForm]
    .map((f) => {
      const inputs = f.fields
        .map((field) =>
          field.type === 'textarea'
            ? `<textarea name="${field.name}"></textarea>`
            : field.type === 'select'
              ? `<select name="${field.name}"><option value="">-</option></select>`
              : `<input type="${field.type}" name="${field.name}" />`,
        )
        .join('')
      return `<form name="${f.name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden aria-hidden="true"><input type="hidden" name="form-name" value="${f.name}" /><input name="bot-field" />${inputs}</form>`
    })
    .join('\n    ')
}

export function sitePlugin(env: Record<string, string | undefined>): Plugin {
  const url = resolveSiteUrl(env)
  // Netlify sets CONTEXT. Keep deploy previews and branch deploys out of search engines.
  const isProductionContext = !env.CONTEXT || env.CONTEXT === 'production'

  return {
    name: 'site-config',
    transformIndexHtml(html) {
      return html
        .replace('<!--site:theme-->', `<style>${themeCss()}</style>`)
        .replace('<!--site:head-->', headTags(url))
        .replace('<!--site:form-->', netlifyForms())
    },
    generateBundle() {
      // Only for the browser build (the pre-render server build reuses this config).
      if (this.environment && this.environment.name !== 'client') return
      const today = new Date().toISOString().slice(0, 10)
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes()
  .map((r) => `  <url><loc>${url}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`
      const robots = isProductionContext
        ? `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`
        : `User-agent: *\nDisallow: /\n`
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}
