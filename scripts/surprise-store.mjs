// Local development API: the same Express app that runs on Render, storing surprises as JSON files in data/surprises.
// Only used when VITE_API_BASE_URL is empty. Requires `npm install` in backend/.
import { fileURLToPath } from 'node:url'

export async function surpriseMiddleware() {
  const [{ createApp }, { createFileStore }] = await Promise.all([
    import('../backend/src/app.js'),
    import('../backend/src/stores/file.js'),
  ])
  const app = createApp({
    store: createFileStore(fileURLToPath(new URL('../data/surprises/', import.meta.url))),
    publicBase: (process.env.PUBLIC_BASE || '').replace(/\/+$/, ''),
    rateLimit: { max: 200, windowMs: 15 * 60 * 1000 },
  })

  return function surpriseApi(req, res, next) {
    const pathname = (req.url || '').split('?')[0]
    if (!pathname.startsWith('/api/') && pathname !== '/health') {
      next()
      return
    }
    const origin = req.headers.origin
    // Same-origin requests (including through a tunnel hostname) need no CORS approval.
    if (origin && URL.canParse(origin) && new URL(origin).host === req.headers.host) delete req.headers.origin
    app(req, res, next)
  }
}
