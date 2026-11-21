import { useRef, useState } from 'react'
import { burstFrom, popSound } from '../../lib/celebrate.js'

const COLORS = ['#ff6b8b', '#ffb547', '#5ec8f2', '#9b7cf6', '#4fd1a5']

export default function BalloonScene({ reasons, name, onContinue }) {
  const [popped, setPopped] = useState(() => reasons.map(() => false))
  const [open, setOpen] = useState(null)
  const refs = useRef([])
  const allPopped = popped.every(Boolean)

  const pop = (index) => {
    if (popped[index]) return
    popSound()
    burstFrom(refs.current[index], [COLORS[index % COLORS.length], '#ffffff'])
    setPopped((current) => current.map((value, item) => (item === index ? true : value)))
    setOpen(index)
  }

  return (
    <section className="scene balloon-scene">
      <h2>{allPopped && open === null ? '…and a million more reasons' : 'Pop the balloons'}</h2>
      <p className="scene-copy">
        {allPopped && open === null ? `That is why everyone loves you, ${name}. 💛` : 'Each one is hiding a reason you are loved.'}
      </p>

      <div className="balloons">
        {reasons.map((reason, index) => (
          <button
            key={index}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            className={popped[index] ? 'balloon popped' : 'balloon'}
            style={{
              '--balloon': COLORS[index % COLORS.length],
              '--float-delay': `${index * -0.7}s`,
              '--sway': `${index % 2 ? 4 : -4}deg`,
            }}
            aria-label={popped[index] ? `Reason ${index + 1}: ${reason}` : `Pop balloon ${index + 1}`}
            onClick={() => (popped[index] ? setOpen(index) : pop(index))}
          >
            <span className="balloon-body" aria-hidden="true" />
            <span className="balloon-string" aria-hidden="true" />
            {popped[index] && <span className="balloon-done" aria-hidden="true">{index + 1}</span>}
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="reason-card" role="dialog" aria-label={`Reason ${open + 1}`}>
          <p className="reason-number">Reason #{open + 1}</p>
          <p className="reason-text">{reasons[open]}</p>
          <button type="button" className="btn btn-primary" autoFocus onClick={() => setOpen(null)}>
            {allPopped ? 'Aww 💛' : 'Pop the next one'}
          </button>
        </div>
      )}

      {allPopped && open === null && (
        <div className="scene-actions">
          <button type="button" className="btn btn-glow" onClick={onContinue}>Continue →</button>
        </div>
      )}
    </section>
  )
}
