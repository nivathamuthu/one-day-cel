import { fileURLToPath } from 'node:url'

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173']

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production'
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  if (production && !env.DATABASE_URL) throw new Error('DATABASE_URL must be set in production.')
  if (production && allowedOrigins.length === 0) throw new Error('ALLOWED_ORIGINS must be set in production.')
  if (allowedOrigins.includes('*')) throw new Error('ALLOWED_ORIGINS must list exact website origins, not "*".')

  return {
    production,
    port: Number(env.PORT) || 3001,
    databaseUrl: env.DATABASE_URL || '',
    databaseCaCert: env.DATABASE_CA_CERT || '',
    databaseSsl: env.DATABASE_SSL === 'disable' ? 'disable' : 'require',
    dataDir: env.DATA_DIR || fileURLToPath(new URL('../../data/surprises/', import.meta.url)),
    allowedOrigins: allowedOrigins.length ? allowedOrigins : DEV_ORIGINS,
    publicBase: (env.PUBLIC_BASE || '').replace(/\/+$/, ''),
    rateLimit: { max: Number(env.RATE_LIMIT_MAX) || 30, windowMs: 15 * 60 * 1000 },
  }
}
