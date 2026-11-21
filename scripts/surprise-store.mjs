import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_BODY = 6 * 1024 * 1024
const MAX_PHOTO = 500_000
const ID_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'

function surpriseDir() {
  return fileURLToPath(new URL('../data/surprises/', import.meta.url))
}

function newId() {
  const bytes = randomBytes(10)
  let id = ''
  for (const byte of bytes) id += ID_ALPHABET[byte % ID_ALPHABET.length]
  return id
}

function isDraft(data) {
  if (!data || data.v !== 1 || typeof data.name !== 'string' || typeof data.from !== 'string') return false
  if (!Array.isArray(data.photos) || data.photos.length > 5) return false
  return data.photos.every((src) => typeof src === 'string' && src.startsWith('data:image/') && src.length <= MAX_PHOTO)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

export function surpriseMiddleware() {
  const dir = surpriseDir()
  mkdirSync(dir, { recursive: true })

  return async function surpriseApi(req, res, next) {
    const pathname = (req.url || '').split('?')[0]
    try {
      if (req.method === 'GET' && pathname === '/api/public-base') {
        send(res, 200, { origin: process.env.PUBLIC_BASE || '' })
        return
      }

      if (req.method === 'POST' && pathname === '/api/surprises') {
        const data = JSON.parse((await readBody(req)).toString('utf8') || '{}')
        if (!isDraft(data)) {
          send(res, 400, { error: 'This surprise could not be saved.' })
          return
        }
        const id = newId()
        writeFileSync(join(dir, `${id}.json`), JSON.stringify(data))
        send(res, 201, { id })
        return
      }

      const match = pathname.match(/^\/api\/surprises\/([a-z0-9]{10})$/)
      if (req.method === 'GET' && match) {
        const file = join(dir, `${match[1]}.json`)
        if (!existsSync(file)) {
          send(res, 404, { error: 'This surprise could not be found.' })
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(readFileSync(file))
        return
      }
    } catch (error) {
      send(res, error.status || 400, { error: 'This surprise could not be saved.' })
      return
    }
    next()
  }
}
