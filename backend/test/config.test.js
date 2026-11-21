import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadConfig } from '../src/config.js'
import { newId } from '../src/ids.js'

test('production requires a database and explicit origins', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production', ALLOWED_ORIGINS: 'https://a.example' }), /DATABASE_URL/)
  assert.throws(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://x' }), /ALLOWED_ORIGINS/)
})

test('wildcard CORS is refused', () => {
  assert.throws(() => loadConfig({ ALLOWED_ORIGINS: '*' }), /exact website origins/)
})

test('config reads PORT and normalises origins', () => {
  const config = loadConfig({
    NODE_ENV: 'production',
    PORT: '10000',
    DATABASE_URL: 'postgresql://x',
    ALLOWED_ORIGINS: 'https://a.example/, https://b.example',
    PUBLIC_BASE: 'https://a.example/',
  })
  assert.equal(config.port, 10000)
  assert.deepEqual(config.allowedOrigins, ['https://a.example', 'https://b.example'])
  assert.equal(config.publicBase, 'https://a.example')
})

test('local development defaults to the Vite origins and port 3001', () => {
  const config = loadConfig({})
  assert.equal(config.port, 3001)
  assert.ok(config.allowedOrigins.includes('http://localhost:5173'))
})

test('new ids are 10 lowercase characters', () => {
  for (let i = 0; i < 200; i += 1) assert.match(newId(), /^[a-z0-9]{10}$/)
})
