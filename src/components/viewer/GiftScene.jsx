import { useEffect, useRef, useState } from 'react'
import { burst, reducedMotion } from '../../lib/celebrate.js'

const PULL_DISTANCE = 70
const MAX_PULL = 120

export default function GiftScene({ from, onOpen, onDone }) {
  const [pull, setPull] = useState(0)
  const [open, setOpen] = useState(false)
  const drag = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const unwrap = () => {
    if (open) return
    setOpen(true)
    onOpen()
    burst({ particleCount: 150, spread: 100, origin: { y: 0.55 } })
    timer.current = setTimeout(onDone, reducedMotion() ? 200 : 1300)
  }

  const onPointerDown = (event) => {
    if (open) return
    drag.current = { y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!drag.current) return
    const distance = Math.max(0, Math.min(MAX_PULL, event.clientY - drag.current.y))
    if (distance > 4) drag.current.moved = true
    setPull(distance)
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const { moved } = drag.current
    drag.current = null
    if (pull >= PULL_DISTANCE || !moved) unwrap()
    else setPull(0)
  }

  return (
    <section className="scene gift-scene">
      <p className="eyebrow">🎁 A surprise from {from}</p>
      <h1 className="gift-title">Made just for you</h1>

      <div className={open ? 'gift open' : 'gift'} style={{ '--pull': `${pull}px` }}>
        <div className="gift-glow" aria-hidden="true" />
        <div className="gift-lid">
          <span className="bow bow-left" />
          <span className="bow bow-right" />
          <span className="bow-knot" />
        </div>
        <div className="gift-box">
          <span className="ribbon-v" />
          <span className="ribbon-h" />
        </div>
        <button
          type="button"
          className="ribbon-tail"
          aria-label="Pull the ribbon to open your gift"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null
            setPull(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              unwrap()
            }
          }}
        >
          <span className="tail-tip" />
        </button>
      </div>

      <p className="pull-hint" aria-hidden="true">{open ? 'Here it comes…' : 'Pull the ribbon ↓'}</p>
      <p className="sound-hint">🔊 Turn your sound on</p>
    </section>
  )
}
