// Generates the original background loops in public/music/.
// Run with: node scripts/make-music.mjs
// Each theme gets its own loop (see src/lib/themes.js). Tweak the arrangements below freely.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 22050
const TAU = Math.PI * 2
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)

// ---- instruments: each returns { len, fn(t) } where t is seconds since the note started ----
const marimba = (midi, vol, decay = 7) => {
  const f = hz(midi)
  return {
    len: 1.4,
    fn: (t) =>
      vol *
      Math.exp(-decay * t) *
      (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 4 * t) * Math.exp(-14 * t)) *
      Math.min(1, t / 0.004),
  }
}

const bell = (midi, vol, decay = 2.2, len = 3.5) => {
  const f = hz(midi)
  return {
    len,
    fn: (t) =>
      vol *
      Math.exp(-decay * t) *
      (Math.sin(TAU * f * t) +
        0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-3 * t) +
        0.2 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-6 * t)) *
      Math.min(1, t / 0.003),
  }
}

const bass = (midi, vol, len = 0.9) => {
  const f = hz(midi)
  return {
    len,
    fn: (t) => vol * Math.exp(-1.6 * t) * (Math.sin(TAU * f * t) + 0.15 * Math.sin(TAU * f * 2 * t)) * Math.min(1, t / 0.01),
  }
}

const pad = (midis, vol, len) => {
  const fs = midis.map(hz)
  return {
    len,
    fn: (t) => {
      let s = 0
      for (const f of fs) {
        s += Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t) + Math.sin(TAU * f * 1.004 * t) * 0.6
      }
      const env = Math.min(1, t / 0.5) * Math.min(1, (len - t) / 0.6)
      return (vol * s * env) / fs.length
    },
  }
}

// ---- rendering ----
function render(bpm, bars, arrange) {
  const beat = 60 / bpm
  const buf = new Float32Array(Math.round(bars * 4 * beat * SR))
  const n = buf.length
  const put = (beatPos, inst) => {
    const s0 = Math.round(beatPos * beat * SR)
    const len = Math.round(inst.len * SR)
    for (let i = 0; i < len; i++) {
      const v = inst.fn(i / SR)
      buf[(s0 + i) % n] += v // wrap around so the loop is seamless
    }
  }
  arrange(put, beat)

  let peak = 0
  for (const v of buf) peak = Math.max(peak, Math.abs(v))
  const k = 0.85 / peak
  for (let i = 0; i < n; i++) buf[i] *= k
  return buf
}

function toWav(samples) {
  const n = samples.length
  const out = Buffer.alloc(44 + n * 2)
  out.write('RIFF', 0)
  out.writeUInt32LE(36 + n * 2, 4)
  out.write('WAVE', 8)
  out.write('fmt ', 12)
  out.writeUInt32LE(16, 16)
  out.writeUInt16LE(1, 20) // PCM
  out.writeUInt16LE(1, 22) // mono
  out.writeUInt32LE(SR, 24)
  out.writeUInt32LE(SR * 2, 28)
  out.writeUInt16LE(2, 32)
  out.writeUInt16LE(16, 34)
  out.write('data', 36)
  out.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2)
  }
  return out
}

// ---- the four tracks ----

// Rose: bright, bouncy C major with a marimba arpeggio.
const rose = (put, beat) => {
  const chords = [
    [60, 64, 67], // C
    [55, 59, 62], // G
    [57, 60, 64], // Am
    [53, 57, 60], // F
  ]
  for (let bar = 0; bar < 8; bar += 1) {
    const c = chords[bar % 4]
    put(bar * 4, pad(c, 0.05, 4 * beat))
    for (let i = 0; i < 8; i += 1) {
      const idx = [0, 1, 2, 1, 0, 2, 1, 2][i]
      put(bar * 4 + i * 0.5, marimba(c[idx] + 12, 0.3))
    }
    put(bar * 4, bass(c[0] - 12, 0.3))
    put(bar * 4 + 2, bass(c[0] - 12, 0.22))
    if (bar % 2 === 0) put(bar * 4, bell(c[2] + 24, 0.05))
  }
}

// Cocoa: slower, warm G-major-seventh jazz feel with soft marimba notes.
const cocoa = (put, beat) => {
  const chords = {
    G: [55, 59, 62, 66],
    Em: [52, 55, 59, 62],
    C: [60, 64, 67, 71],
    D: [62, 66, 69, 72],
  }
  const order = ['G', 'G', 'Em', 'Em', 'C', 'C', 'D', 'D']
  const melody = [
    [0, 2],
    [1.5, 1],
    [2, 3],
    [3.25, 1],
  ]
  order.forEach((name, bar) => {
    const c = chords[name]
    put(bar * 4, pad(c, 0.04, 4 * beat))
    for (const [beatPos, idx] of melody) put(bar * 4 + beatPos, marimba(c[idx] + 12, 0.28, 4))
    put(bar * 4, bass(c[0] - 12, 0.3, 1.2))
    put(bar * 4 + 2, bass(c[0] - 5, 0.25, 1.2))
  })
}

// Mint: airy D major with fast bell sparkles.
const mint = (put, beat) => {
  const chords = [
    [62, 66, 69], // D
    [59, 62, 66], // Bm
    [55, 59, 62], // G
    [57, 61, 64], // A
  ]
  for (let bar = 0; bar < 8; bar += 1) {
    const c = chords[bar % 4]
    put(bar * 4, pad(c, 0.035, 4 * beat))
    const pattern = [c[0], c[1], c[2], c[1]]
    for (let i = 0; i < 16; i += 1) {
      const octave = Math.floor(i / 8) % 2 === 1 ? 12 : 0
      put(bar * 4 + i * 0.25, bell(pattern[i % 4] + octave, 0.08, 5, 2.2))
    }
    put(bar * 4, bass(c[0] - 12, 0.25))
  }
}

// Midnight: slow, dreamy A minor with long pads and soft bell tones.
const midnight = (put, beat) => {
  const chords = [
    [57, 60, 64, 67], // Am7
    [53, 57, 60, 64], // F
    [60, 64, 67, 71], // C
    [55, 59, 62, 66], // G
  ]
  for (let bar = 0; bar < 8; bar += 1) {
    const c = chords[bar % 4]
    put(bar * 4, pad(c, 0.045, 4 * beat))
    put(bar * 4 + 0.5, bell(c[3] + 12, 0.07, 1.8, 4))
    put(bar * 4 + 2.5, bell(c[2] + 12, 0.05, 1.8, 4))
    put(bar * 4, bass(c[0] - 12, 0.28, 2.5))
  }
}

const tracks = [
  { id: 'rose', bpm: 110, bars: 8, arrange: rose },
  { id: 'cocoa', bpm: 90, bars: 8, arrange: cocoa },
  { id: 'mint', bpm: 120, bars: 8, arrange: mint },
  { id: 'midnight', bpm: 70, bars: 8, arrange: midnight },
]

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'music')
mkdirSync(outDir, { recursive: true })

for (const track of tracks) {
  const samples = render(track.bpm, track.bars, track.arrange)
  const file = join(outDir, `${track.id}.wav`)
  writeFileSync(file, toWav(samples))
  console.log(`${track.id}.wav  ${(samples.length / SR).toFixed(1)}s`)
}
