import confetti from 'canvas-confetti'

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function burst(options = {}) {
  if (reducedMotion()) return
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, ...options })
}

export function burstFrom(element, colors) {
  if (reducedMotion() || !element) return
  const rect = element.getBoundingClientRect()
  confetti({
    particleCount: 40,
    spread: 70,
    startVelocity: 26,
    scalar: 0.8,
    ticks: 120,
    colors,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
  })
}

export function sideCannons(colors) {
  if (reducedMotion()) return
  confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors })
  confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors })
}

let popContext
export function popSound() {
  try {
    popContext ||= new AudioContext()
    const ctx = popContext
    const length = Math.floor(ctx.sampleRate * 0.12)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    source.buffer = buffer
    source.connect(gain).connect(ctx.destination)
    source.start()
  } catch {
    // sound is a nice-to-have
  }
}
