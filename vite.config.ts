import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sitePlugin } from './scripts/vite-site-plugin'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), tailwindcss(), sitePlugin(env)],
    build: {
      target: 'es2022',
      // three.js lives in its own lazily-loaded chunk; it is large by nature.
      chunkSizeWarningLimit: 1100,
    },
  }
})
