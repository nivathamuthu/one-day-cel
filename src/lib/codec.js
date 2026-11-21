function bytesToBinary(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return binary
}

function binaryToBytes(binary) {
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function encodeDraft(data) {
  const json = JSON.stringify(data)
  return btoa(bytesToBinary(new TextEncoder().encode(json)))
}

export function decodeDraft(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const token = raw.startsWith('draft=') ? raw.slice('draft='.length) : ''
  if (!token) throw new Error('Missing draft')
  const json = new TextDecoder().decode(binaryToBytes(atob(token)))
  const data = JSON.parse(json)
  if (!data || data.v !== 1 || typeof data.name !== 'string') {
    throw new Error('Unrecognized draft')
  }
  return data
}
