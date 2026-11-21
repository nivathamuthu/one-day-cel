import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMemoryStore } from '../src/stores/memory.js'
import { MAX_PHOTO_CHARS } from '../src/validate.js'
import { ORIGIN, PHOTO, postJson, sampleDraft, startApp } from './helpers.js'

test('GET /health reports ok when storage responds', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await request('/health')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', storage: 'memory' })
})

test('GET /health returns 503 when storage is down', async (t) => {
  const store = { ...createMemoryStore(), ping: async () => Promise.reject(new Error('down')) }
  const request = await startApp(t, { store })
  const response = await request('/health')
  assert.equal(response.status, 503)
  assert.equal((await response.json()).status, 'error')
})

test('POST then GET returns the same surprise under a 10-character id', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const created = await postJson(request, sampleDraft())
  assert.equal(created.status, 201)
  const { id } = await created.json()
  assert.match(id, /^[a-z0-9]{10}$/)

  const fetched = await request(`/api/surprises/${id}`)
  assert.equal(fetched.status, 200)
  assert.deepEqual(await fetched.json(), sampleDraft())
})

test('unknown fields are dropped before saving', async (t) => {
  const store = createMemoryStore()
  const request = await startApp(t, { store, newIdFn: () => 'abcdefghij' })
  await postJson(request, sampleDraft({ injected: '<script>' }))
  assert.equal('injected' in (await store.get('abcdefghij')), false)
})

test('existing surprises keep working (backward compatible ids and data)', async (t) => {
  const legacy = { v: 1, name: 'saran', from: 'nivi', age: 1, birthday: '', theme: 'rose', reasons: [], photos: [], captions: [], message: 'hi' }
  const request = await startApp(t, { store: createMemoryStore({ toesg8xxyq: legacy }) })
  const response = await request('/api/surprises/toesg8xxyq')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), legacy)
})

test('GET returns 404 for a missing surprise and 400 for a malformed id', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  assert.equal((await request('/api/surprises/abcdefghij')).status, 404)
  assert.equal((await request('/api/surprises/short')).status, 400)
  assert.equal((await request('/api/surprises/ABCDEFGHIJ')).status, 400)
  assert.equal((await request('/api/surprises/..%2F..%2Fetc')).status, 400)
})

test('malformed JSON is rejected with 400', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await postJson(request, '{"v":1,')
  assert.equal(response.status, 400)
  assert.ok((await response.json()).error)
})

test('non-JSON bodies are rejected with 415', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await request('/api/surprises', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello',
  })
  assert.equal(response.status, 415)
})

test('invalid surprises are rejected with 400', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const invalid = [
    [],
    { ...sampleDraft(), v: 2 },
    sampleDraft({ name: 42 }),
    sampleDraft({ photos: Array(6).fill(PHOTO) }),
    sampleDraft({ photos: ['https://example.com/a.jpg'] }),
    sampleDraft({ photos: ['data:image/jpeg;base64,' + 'A'.repeat(MAX_PHOTO_CHARS)] }),
    sampleDraft({ birthday: '2024-12-11' }),
    sampleDraft({ age: 500 }),
    sampleDraft({ reasons: Array(6).fill('x') }),
    sampleDraft({ message: 'x'.repeat(3001) }),
  ]
  for (const body of invalid) {
    const response = await postJson(request, body)
    assert.equal(response.status, 400, JSON.stringify(body).slice(0, 80))
  }
})

test('bodies over the size limit are rejected with 413', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await postJson(request, { v: 1, padding: 'x'.repeat(4 * 1024 * 1024) })
  assert.equal(response.status, 413)
})

test('allowed origins get CORS headers, other origins get 403', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const allowed = await request('/health', { headers: { Origin: ORIGIN } })
  assert.equal(allowed.status, 200)
  assert.equal(allowed.headers.get('access-control-allow-origin'), ORIGIN)

  const blocked = await postJson(request, sampleDraft(), { Origin: 'https://evil.example' })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.headers.get('access-control-allow-origin'), null)
})

test('CORS preflight from an allowed origin succeeds', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await request('/api/surprises', {
    method: 'OPTIONS',
    headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN)
  assert.match(response.headers.get('access-control-allow-methods'), /POST/)
})

test('an id collision retries with a new id instead of overwriting', async (t) => {
  const store = createMemoryStore({ aaaaaaaaaa: sampleDraft({ name: 'Original' }) })
  const ids = ['aaaaaaaaaa', 'bbbbbbbbbb']
  const request = await startApp(t, { store, newIdFn: () => ids.shift() })
  const response = await postJson(request, sampleDraft({ name: 'New' }))
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { id: 'bbbbbbbbbb' })
  assert.equal((await store.get('aaaaaaaaaa')).name, 'Original')
})

test('returns 500 when no free id can be found', async (t) => {
  const request = await startApp(t, { store: createMemoryStore({ aaaaaaaaaa: sampleDraft() }), newIdFn: () => 'aaaaaaaaaa' })
  assert.equal((await postJson(request, sampleDraft())).status, 500)
})

test('storage failures return 503 and never report success', async (t) => {
  const failing = new Error('connection refused')
  const store = {
    ...createMemoryStore(),
    insert: async () => Promise.reject(failing),
    get: async () => Promise.reject(failing),
  }
  const request = await startApp(t, { store })
  const created = await postJson(request, sampleDraft())
  assert.equal(created.status, 503)
  assert.equal('id' in (await created.json()), false)
  assert.equal((await request('/api/surprises/abcdefghij')).status, 503)
})

test('GET /api/public-base returns the configured origin', async (t) => {
  const request = await startApp(t, { store: createMemoryStore(), publicBase: 'https://site.example' })
  assert.deepEqual(await (await request('/api/public-base')).json(), { origin: 'https://site.example' })
})

test('creating too many surprises returns 429', async (t) => {
  const request = await startApp(t, { store: createMemoryStore(), rateLimit: { max: 2, windowMs: 60_000 } })
  assert.equal((await postJson(request, sampleDraft())).status, 201)
  assert.equal((await postJson(request, sampleDraft())).status, 201)
  assert.equal((await postJson(request, sampleDraft())).status, 429)
})

test('unknown routes return JSON 404', async (t) => {
  const request = await startApp(t, { store: createMemoryStore() })
  const response = await request('/nope')
  assert.equal(response.status, 404)
  assert.ok((await response.json()).error)
})
