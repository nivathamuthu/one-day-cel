import { encodeDraft } from './codec.js'

export const MAX_PHOTOS = 5
export const MIN_REASONS = 3

export function shareUrl(data) {
  return `${location.origin}/view/#draft=${encodeDraft(data)}`
}

async function shareOrigin() {
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  if (!local) return location.origin
  try {
    const response = await fetch('/api/public-base')
    const body = await response.json()
    if (body?.origin) return String(body.origin).replace(/\/$/, '')
  } catch {
    // opened on this computer, with no phone address configured
  }
  return location.origin
}

export async function viewUrl(id) {
  return `${await shareOrigin()}/view/#s=${id}`
}

export async function publishDraft(data) {
  const response = await fetch('/api/surprises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toDraft(data)),
  })
  if (response.status === 413) {
    throw new Error('Those photos are too big to share. Remove one and try again.')
  }
  if (!response.ok) throw new Error('Could not save the surprise. Keep this computer on and try again.')
  const body = await response.json()
  if (!body?.id) throw new Error('Could not save the surprise. Keep this computer on and try again.')
  return viewUrl(body.id)
}

export function whatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function toDraft(data) {
  return {
    v: 1,
    name: data.name.trim(),
    from: data.from.trim(),
    age: Number(data.age) || 0,
    birthday: data.birthday,
    theme: data.theme,
    reasons: data.reasons.map((reason) => reason.trim()).filter(Boolean),
    photos: data.photos.map((photo) => photo.src),
    captions: data.photos.map((photo) => photo.caption.trim()),
    message: data.message.trim(),
  }
}
