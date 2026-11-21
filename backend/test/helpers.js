import { createApp } from '../src/app.js'

export const ORIGIN = 'https://birthday-moments.example'

export const PHOTO = 'data:image/jpeg;base64,' + 'A'.repeat(1000)

export function sampleDraft(overrides = {}) {
  return {
    v: 1,
    name: 'Saravanan',
    from: 'Nivetha',
    age: 25,
    birthday: '11-12',
    theme: 'rose',
    reasons: ['kind', 'funny', 'brave'],
    photos: [PHOTO],
    captions: ['Us'],
    message: 'Happy birthday!',
    ...overrides,
  }
}

export const silentLogger = { error() {}, warn() {}, log() {} }

export async function startApp(t, options) {
  const app = createApp({ allowedOrigins: [ORIGIN], logger: silentLogger, ...options })
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  return (path, init) => fetch(base + path, init)
}

export function postJson(request, body, headers = {}) {
  return request('/api/surprises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
