import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { AppRoutes } from './AppRoutes'
export { prerenderRoutes } from './config/routes'

/**
 * Build-time pre-rendering (see scripts/prerender.mjs): renders one URL to
 * static HTML, waiting for lazily loaded pages, so every page ships with its
 * full content for search engines and social previews.
 */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  )
  return new Response(prelude).text()
}
