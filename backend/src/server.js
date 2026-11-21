import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createFileStore } from './stores/file.js'
import { createPostgresStore } from './stores/postgres.js'

const config = loadConfig()
const store = config.databaseUrl
  ? createPostgresStore({ connectionString: config.databaseUrl, caCert: config.databaseCaCert, ssl: config.databaseSsl })
  : createFileStore(config.dataDir)

if (store.kind === 'postgres' && !config.databaseCaCert && config.databaseSsl !== 'disable') {
  console.warn('DATABASE_CA_CERT is not set: the database connection is encrypted but its certificate is not verified.')
}

const app = createApp({
  store,
  allowedOrigins: config.allowedOrigins,
  publicBase: config.publicBase,
  trustProxy: config.production,
  rateLimit: config.rateLimit,
})

const server = app.listen(config.port, () => {
  console.log(`Birthday Moments API listening on port ${config.port} (storage: ${store.kind})`)
})

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`)
  server.close(async () => {
    await store.close().catch(() => {})
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
