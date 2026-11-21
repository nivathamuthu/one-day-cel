import { useEffect, useRef, useState } from 'react'
import { listenForBlow } from '../../lib/blow.js'
import { burst, reducedMotion } from '../../lib/celebrate.js'

const COPY = {
  unlit: { title: 'First things first', text: 'Your cake is here. Light the candles.' },
  wish: { title: 'Make a wish…', text: 'Close your eyes. Take your time.' },
  blow: { title: 'Now blow them out!', text: 'Blow into your mic, or tap each flame.' },
  cut: { title: 'Cut the first slice', text: 'Drag down across the cake.' },
  done: { title: 'Happy birthday!', text: 'Hope your wish comes true.' },
}

function Candle({ label, lit, out, delay, onBlow, number }) {
  return (
    <button
      type="button"
      className={`candle${number ? ' number' : ''}${lit && !out ? ' lit' : ''}${out ? ' out' : ''}`}
      style={{ '--delay': `${delay}s` }}
      aria-label={out ? `${label} is out` : `Blow out ${label}`}
      aria-pressed={out}
      disabled={!lit || out}
      onClick={onBlow}
    >
      <span className="flame" aria-hidden="true" />
      <span className="smoke" aria-hidden="true" />
      <span className="wick" aria-hidden="true" />
      {number ? <span className="digit" aria-hidden="true">{number}</span> : <span className="wax" aria-hidden="true" />}
    </button>
  )
}

export default function CakeScene({ age, name, theme, onContinue }) {
  const candles = age > 0 ? String(age).split('') : ['', '', '', '', '']
  const [phase, setPhase] = useState('unlit')
  const [out, setOut] = useState(() => candles.map(() => false))
  const [listening, setListening] = useState(false)
  const [hint, setHint] = useState('')
  const [cut, setCut] = useState(0)
  const abortRef = useRef(null)
  const timers = useRef([])
  const cakeRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      abortRef.current?.abort()
    }
  }, [])

  const later = (fn, ms) => timers.current.push(setTimeout(fn, reducedMotion() ? 0 : ms))
  const colors = [theme.frosting, theme.accent, '#ffffff', theme.sponge, '#ffd166']

  const allOut = out.every(Boolean)

  useEffect(() => {
    if (!allOut || phase !== 'blow') return undefined
    abortRef.current?.abort()
    setListening(false)
    setHint('')
    burst({ colors: [theme.frosting, theme.accent, '#ffffff', theme.sponge, '#ffd166'] })
    const timer = setTimeout(() => setPhase('cut'), reducedMotion() ? 0 : 1400)
    return () => clearTimeout(timer)
  }, [allOut, phase, theme])

  const blowOut = (index) => {
    setOut((current) => current.map((value, item) => (item === index ? true : value)))
  }

  const listen = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setListening(true)
    setHint('Listening… blow now!')
    try {
      const heard = await listenForBlow(5000, controller.signal)
      if (heard) candles.forEach((_, index) => later(() => blowOut(index), index * 160))
      else setHint('Didn’t catch that. Blow a little harder, or tap the flames.')
    } catch (error) {
      if (error.name !== 'AbortError') setHint('No microphone here. Tap each flame instead.')
    } finally {
      if (abortRef.current === controller) setListening(false)
    }
  }

  const finishCut = () => {
    setCut(1)
    setPhase('done')
    burst({ colors, particleCount: 160, spread: 110 })
  }

  const onPointerDown = (event) => {
    if (phase !== 'cut') return
    drag.current = { y: event.clientY, height: cakeRef.current.getBoundingClientRect().height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event) => {
    if (!drag.current) return
    setCut(Math.max(0, Math.min(1, (event.clientY - drag.current.y) / (drag.current.height * 0.7))))
  }
  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    if (cut > 0.75) finishCut()
    else setCut(0)
  }

  const lit = phase !== 'unlit'
  const copy = COPY[phase]

  return (
    <section className="scene cake-scene">
      <h2>{copy.title}</h2>
      <p className="scene-copy">{copy.text}</p>

      <div
        ref={cakeRef}
        className={`cake phase-${phase}${listening ? ' blowing' : ''}`}
        style={{ '--frosting': theme.frosting, '--sponge': theme.sponge, '--plate': theme.plate, '--cut': cut }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          setCut(0)
        }}
      >
        <div className="candles">
          {candles.map((digit, index) => (
            <Candle
              key={index}
              label={digit ? `candle ${digit}` : `candle ${index + 1}`}
              number={digit}
              lit={lit}
              out={out[index]}
              delay={index * 0.25}
              onBlow={() => phase === 'blow' && blowOut(index)}
            />
          ))}
        </div>
        {['left', 'right'].map((side) => (
          <div key={side} className={`cake-half ${side}`} aria-hidden="true">
            <div className="tier top">
              <span className="drips" />
              <span className="sprinkles" />
            </div>
            <div className="tier bottom">
              <span className="drips" />
              <span className="cream-dots" />
            </div>
          </div>
        ))}
        <div className="cake-name" aria-hidden="true">{name}</div>
        <div className="knife" aria-hidden="true" />
        <div className="plate" aria-hidden="true" />
      </div>

      <div className="scene-actions">
        {phase === 'unlit' && (
          <button
            type="button"
            className="btn btn-glow"
            onClick={() => {
              setPhase('wish')
            }}
          >
            🔥 Light the candles
          </button>
        )}
        {phase === 'wish' && (
          <button type="button" className="btn btn-glow" onClick={() => setPhase('blow')}>
            I made my wish ✨
          </button>
        )}
        {phase === 'blow' && (
          <button type="button" className="btn btn-glow" onClick={listen} disabled={listening}>
            {listening ? 'Listening…' : '🌬️ Blow with the mic'}
          </button>
        )}
        {phase === 'cut' && (
          <button type="button" className="btn btn-soft-dark" onClick={finishCut}>
            🔪 Cut it for me
          </button>
        )}
        {phase === 'done' && (
          <button type="button" className="btn btn-glow" onClick={onContinue}>
            Continue →
          </button>
        )}
      </div>
      {hint && <p className="hint" role="status">{hint}</p>}
    </section>
  )
}
