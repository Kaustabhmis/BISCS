/**
 * Pre-renders every route to static HTML after `vite build`.
 *
 *   dist/index.html            → /
 *   dist/services/index.html   → /services
 *   dist/services/<slug>/index.html …
 *   dist/404.html              → served by Netlify (status 404) for unknown URLs
 *
 * Each page ships with its full content and its own <title>, description,
 * canonical URL, Open Graph tags and structured data, so search engines and
 * social previews never depend on JavaScript. The browser bundle then
 * hydrates the markup.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const dist = path.join(root, 'dist')
const serverDir = path.join(root, 'dist-server')

const { render, prerenderRoutes } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href)
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')

// Tags React hoists into <head> (title, meta, canonical link, JSON-LD stays in body).
const HEAD_TAG = /<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>/g

function toPage(appHtml) {
  const headTags = (appHtml.match(HEAD_TAG) ?? [])
    // Marked so the browser bundle can swap them for the live <Seo> tags.
    .map((t) => t.replace(/^<(title|meta|link)/, '<$1 data-static-head'))
  const body = appHtml.replace(HEAD_TAG, '')
  let html = template
    // Drop the generic defaults that the page-specific tags replace.
    .replace(/\s*<title data-static-head>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta data-static-head[^>]*>/g, '')
    .replace('</head>', `    ${headTags.join('\n    ')}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

async function write(file, html) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, html)
}

const routes = prerenderRoutes()
for (const route of routes) {
  const html = toPage(await render(route))
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html')
  await write(file, html)
  console.log(`  prerendered ${route}`)
}

// Branded 404 page, served with a real 404 status for unknown URLs.
await write(path.join(dist, '404.html'), toPage(await render('/__not-found__')))
console.log('  prerendered 404.html')

// Netlify: real files are served first; anything else gets the 404 page with a 404 status.
await write(path.join(dist, '_redirects'), '/*    /404.html    404\n')

await fs.rm(serverDir, { recursive: true, force: true })
console.log(`Pre-rendered ${routes.length + 1} pages.`)
