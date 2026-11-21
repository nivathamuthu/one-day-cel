export const ID_PATTERN = /^[a-z0-9]{10}$/
export const MAX_PHOTOS = 5
export const MAX_PHOTO_CHARS = 500_000
export const MAX_BODY_BYTES = 3 * 1024 * 1024

const MAX_REASONS = 5
const BIRTHDAY_PATTERN = /^(\d{2}-\d{2})?$/

const isString = (value, max) => typeof value === 'string' && value.length <= max
const isStringList = (value, maxItems, maxChars) =>
  Array.isArray(value) && value.length <= maxItems && value.every((item) => isString(item, maxChars))

export function validateDraft(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'The surprise data is missing.' }
  if (data.v !== 1) return { error: 'This surprise uses an unsupported format.' }
  if (!isString(data.name, 80) || !isString(data.from, 80)) return { error: 'Names must be text of up to 80 characters.' }
  if (!Array.isArray(data.photos) || data.photos.length > MAX_PHOTOS) {
    return { error: `Add up to ${MAX_PHOTOS} photos.` }
  }
  const photosOk = data.photos.every(
    (src) => typeof src === 'string' && src.startsWith('data:image/') && src.length <= MAX_PHOTO_CHARS,
  )
  if (!photosOk) return { error: 'One of the photos is not a supported image or is too large.' }

  if (data.age !== undefined && !(Number.isFinite(data.age) && data.age >= 0 && data.age <= 120)) {
    return { error: 'Age must be a number between 0 and 120.' }
  }
  if (data.birthday !== undefined && !(isString(data.birthday, 5) && BIRTHDAY_PATTERN.test(data.birthday))) {
    return { error: 'The birthday must look like DD-MM.' }
  }
  if (data.theme !== undefined && !isString(data.theme, 40)) return { error: 'The cake theme is not valid.' }
  if (data.reasons !== undefined && !isStringList(data.reasons, MAX_REASONS, 300)) {
    return { error: `Add up to ${MAX_REASONS} reasons of up to 300 characters.` }
  }
  if (data.captions !== undefined && !isStringList(data.captions, MAX_PHOTOS, 200)) {
    return { error: 'Captions must be text of up to 200 characters.' }
  }
  if (data.message !== undefined && !isString(data.message, 3000)) {
    return { error: 'The letter is too long.' }
  }

  const value = { v: 1, name: data.name, from: data.from, photos: data.photos }
  for (const key of ['age', 'birthday', 'theme', 'reasons', 'captions', 'message']) {
    if (data[key] !== undefined) value[key] = data[key]
  }
  return { value }
}
