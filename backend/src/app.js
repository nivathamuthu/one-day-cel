import cors from 'cors'
import express from 'express'
import { newId } from './ids.js'
import { ID_PATTERN, MAX_BODY_BYTES, validateDraft } from './validate.js'

const MAX_ID_ATTEMPTS = 5

function rateLimiter({ max, windowMs }) {
  const hits = new Map()
  return function limit(req, res, next) {
    const now = Date.now()
    const entry = hits.get(req.ip)
    if (!entry || now - entry.start > windowMs) {
      hits.set(req.ip, { start: now, count: 1 })
      if (hits.size > 10_000) {
        for (const [ip, value] of hits) if (now - value.start > windowMs) hits.delete(ip)
      }
      next()
      return
    }
    entry.count += 1
    if (entry.count > max) {
      res.status(429).json({ error: 'Too many surprises were created from here. Try again in a few minutes.' })
      return
    }
    next()
  }
}

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export function createApp({
  store,
  allowedOrigins = [],
  publicBase = '',
  trustProxy = false,
  rateLimit = { max: 30, windowMs: 15 * 60 * 1000 },
  newIdFn = newId,
  logger = console,
}) {
  const origins = new Set(allowedOrigins)
  const app = express()
  app.disable('x-powered-by')
  if (trustProxy) app.set('trust proxy', 1)

  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Cache-Control', 'no-store')
    const origin = req.get('origin')
    if (origin && !origins.has(origin)) {
      res.status(403).json({ error: 'This website is not allowed to use the birthday API.' })
      return
    }
    next()
  })
  app.use(
    cors({
      origin: (origin, callback) => callback(null, Boolean(origin) && origins.has(origin)),
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      maxAge: 600,
    }),
  )

  app.get('/health', async (req, res) => {
    try {
      await withTimeout(store.ping(), 3000)
      res.json({ status: 'ok', storage: store.kind })
    } catch (error) {
      logger.error('Health check failed:', error.message)
      res.status(503).json({ status: 'error', storage: store.kind })
    }
  })

  app.get('/api/public-base', (req, res) => {
    res.json({ origin: publicBase })
  })

  app.post(
    '/api/surprises',
    rateLimiter(rateLimit),
    express.json({ limit: MAX_BODY_BYTES, strict: true }),
    async (req, res) => {
      if (!req.is('application/json')) {
        res.status(415).json({ error: 'Send the surprise as JSON.' })
        return
      }
      const { value, error } = validateDraft(req.body)
      if (error) {
        res.status(400).json({ error })
        return
      }
      for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
        const id = newIdFn()
        if (await store.insert(id, value)) {
          res.status(201).json({ id })
          return
        }
      }
      logger.error(`Could not find a free surprise ID after ${MAX_ID_ATTEMPTS} attempts.`)
      res.status(500).json({ error: 'Could not save the surprise. Please try again.' })
    },
  )

  app.get('/api/surprises/:id', async (req, res) => {
    const { id } = req.params
    if (!ID_PATTERN.test(id)) {
      res.status(400).json({ error: 'This birthday link is not valid.' })
      return
    }
    const data = await store.get(id)
    if (!data) {
      res.status(404).json({ error: 'This surprise could not be found.' })
      return
    }
    res.json(data)
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' })
  })

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({ error: 'Those photos are too big to share. Remove one and try again.' })
      return
    }
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'The surprise data could not be read.' })
      return
    }
    logger.error('Request failed:', error.message)
    res.status(503).json({ error: 'The surprise storage is not available right now. Please try again.' })
  })

  return app
}
