export function listenForBlow(ms, signal) {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      reject(new Error('Microphone is unavailable'))
      return
    }

    let stream
    let audio
    let frame
    let settled = false

    const finish = (heard) => {
      if (settled) return
      settled = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
      audio?.close()
      signal?.removeEventListener('abort', onAbort)
      resolve(heard)
    }

    const fail = (error) => {
      if (settled) return
      settled = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
      audio?.close()
      signal?.removeEventListener('abort', onAbort)
      reject(error)
    }

    const onAbort = () => fail(new DOMException('Aborted', 'AbortError'))
    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    navigator.mediaDevices.getUserMedia({ audio: true }).then((nextStream) => {
      if (signal?.aborted) {
        nextStream.getTracks().forEach((track) => track.stop())
        return
      }
      stream = nextStream
      audio = new AudioContext()
      const source = audio.createMediaStreamSource(stream)
      const analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      const started = performance.now()
      let hits = 0

      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i += 1) {
          const sample = (data[i] - 128) / 128
          sum += sample * sample
        }
        const rms = Math.sqrt(sum / data.length)
        hits = rms > 0.1 ? hits + 1 : Math.max(0, hits - 1)
        if (hits >= 4) {
          finish(true)
          return
        }
        if (performance.now() - started > ms) {
          finish(false)
          return
        }
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }).catch(fail)
  })
}
