import pg from 'pg'

export function poolConfig({ connectionString, caCert, ssl = 'require' }) {
  if (!connectionString) throw new Error('DATABASE_URL is not set.')
  const url = new URL(connectionString)
  // pg treats sslmode=require as full verification; SSL is configured explicitly below instead.
  url.searchParams.delete('sslmode')
  const config = {
    connectionString: url.toString(),
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  }
  if (ssl === 'disable') return config
  config.ssl = caCert ? { ca: caCert.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: false }
  return config
}

export function createPostgresStore({ pool, ...options }) {
  const db = pool || new pg.Pool(poolConfig(options))
  if (!pool) db.on('error', (error) => console.error('Idle database connection error:', error.message))

  return {
    kind: 'postgres',
    async insert(id, data) {
      const result = await db.query(
        'insert into surprises (id, data) values ($1, $2::jsonb) on conflict (id) do nothing',
        [id, JSON.stringify(data)],
      )
      return result.rowCount === 1
    },
    async get(id) {
      const result = await db.query('select data from surprises where id = $1', [id])
      return result.rows[0]?.data ?? null
    },
    async ping() {
      await db.query('select 1')
    },
    async close() {
      await db.end()
    },
  }
}
