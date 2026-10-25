import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (no third-party requests). To change fonts, swap these
// imports and update `site.typography` in src/config/site.ts.
import '@fontsource-variable/inter-tight/index.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './styles/index.css'
import App from './App'

// Static default head tags (for crawlers that don't run JS) are replaced by
// per-page tags rendered by <Seo>; remove them to avoid duplicates.
document.querySelectorAll('[data-static-head]').forEach((el) => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
