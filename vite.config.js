import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { surpriseMiddleware } from './scripts/surprise-store.mjs'

function surpriseStore() {
  return {
    name: 'surprise-store',
    async configureServer(server) {
      server.middlewares.use(await surpriseMiddleware())
    },
    async configurePreviewServer(server) {
      server.middlewares.use(await surpriseMiddleware())
    },
  }
}

function githubPagesFallback() {
  return {
    name: 'github-pages-fallback',
    writeBundle() {
      const index = fileURLToPath(new URL('./dist/index.html', import.meta.url))
      const fallback = fileURLToPath(new URL('./dist/404.html', import.meta.url))
      if (existsSync(index)) copyFileSync(index, fallback)
    },
  }
}

export default defineConfig({
  plugins: [react(), githubPagesFallback(), surpriseStore()],
  preview: {
    // The phone link is a Cloudflare tunnel hostname, which changes each time.
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        view: fileURLToPath(new URL('./view/index.html', import.meta.url)),
      },
    },
  },
})
