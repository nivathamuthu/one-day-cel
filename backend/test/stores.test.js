import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createFileStore } from '../src/stores/file.js'
import { createPostgresStore, poolConfig } from '../src/stores/postgres.js'
import { sampleDraft } from './helpers.js'

function fakePool(handler) {
  const calls = []
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params })
      return handler(sql, params)
    },
    async end() {},
  }
}

test('postgres insert never overwrites: it uses ON CONFLICT DO NOTHING', async () => {
  const pool = fakePool(() => ({ rowCount: 1 }))
  const store = createPostgresStore({ pool })
  assert.equal(await store.insert('abcdefghij', sampleDraft()), true)
  assert.match(pool.calls[0].sql, /on conflict \(id\) do nothing/i)
  assert.deepEqual(pool.calls[0].params, ['abcdefghij', JSON.stringify(sampleDraft())])
})

test('postgres insert reports a duplicate id as not inserted', async () => {
  const store = createPostgresStore({ pool: fakePool(() => ({ rowCount: 0 })) })
  assert.equal(await store.insert('abcdefghij', sampleDraft()), false)
})

test('postgres get returns the stored data or null', async () => {
  const store = createPostgresStore({
    pool: fakePool((sql, [id]) => ({ rows: id === 'abcdefghij' ? [{ data: sampleDraft() }] : [] })),
  })
  assert.deepEqual(await store.get('abcdefghij'), sampleDraft())
  assert.equal(await store.get('zzzzzzzzzz'), null)
})

test('poolConfig requires a connection string', () => {
  assert.throws(() => poolConfig({}), /DATABASE_URL/)
})

test('poolConfig verifies the server certificate when a CA is given', () => {
  const config = poolConfig({
    connectionString: 'postgresql://u:p@db.example:5432/postgres?sslmode=require',
    caCert: '-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----',
  })
  assert.equal(config.connectionString.includes('sslmode'), false)
  assert.equal(config.ssl.rejectUnauthorized, true)
  assert.equal(config.ssl.ca, '-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----')
})

test('poolConfig still encrypts without a CA, and can disable SSL for local databases', () => {
  const url = 'postgresql://u:p@db.example:5432/postgres'
  assert.deepEqual(poolConfig({ connectionString: url }).ssl, { rejectUnauthorized: false })
  assert.equal(poolConfig({ connectionString: url, ssl: 'disable' }).ssl, undefined)
})

test('file store never overwrites an existing surprise', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'surprises-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const store = createFileStore(dir)
  assert.equal(await store.insert('abcdefghij', sampleDraft({ name: 'First' })), true)
  assert.equal(await store.insert('abcdefghij', sampleDraft({ name: 'Second' })), false)
  assert.equal(JSON.parse(readFileSync(join(dir, 'abcdefghij.json'), 'utf8')).name, 'First')
  assert.equal((await store.get('abcdefghij')).name, 'First')
  assert.equal(await store.get('zzzzzzzzzz'), null)
})
