import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sitePlugin } from './scripts/vite-site-plugin.ts'

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), tailwindcss(), sitePlugin(env)],
    // The pre-render bundle (src/entry-server.tsx) includes its dependencies, so it runs in plain Node.
    ssr: { noExternal: true },
    build: {
      target: 'es2022',
      // three.js lives in its own lazily-loaded chunk; it is large by nature.
      chunkSizeWarningLimit: 1200,
      // Two pages: the website (index.html) and the admin panel (admin.html).
      ...(isSsrBuild ? {} : { rollupOptions: { input: { main: 'index.html', admin: 'admin.html' } } }),
    },
  }
})
