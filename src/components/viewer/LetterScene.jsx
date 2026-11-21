import gsap from 'gsap'
import { useEffect, useState } from 'react'
import { burst, reducedMotion } from '../../lib/celebrate.js'
import { whatsAppUrl } from '../../lib/share.js'

export default function LetterScene({ name, from, message, theme, onReplay }) {
  const [opened, setOpened] = useState(false)
  const [shown, setShown] = useState('')
  const finished = opened && shown.length >= message.length

  useEffect(() => {
    if (!opened) return undefined
    if (reducedMotion()) {
      setShown(message)
      return undefined
    }
    const progress = { count: 0 }
    const tween = gsap.to(progress, {
      count: message.length,
      delay: 0.9,
      duration: Math.max(2, Math.min(14, message.length * 0.04)),
      ease: 'none',
      onUpdate: () => setShown(message.slice(0, Math.round(progress.count))),
    })
    return () => tween.kill()
  }, [opened, message])

  useEffect(() => {
    if (finished) burst({ colors: [theme.frosting, theme.accent, '#ffffff', '#ffd166'], origin: { y: 0.3 } })
  }, [finished, theme])

  const reply = `Thank you so much, ${from}! I loved my birthday surprise 💛 — ${name}`

  return (
    <section className="scene letter-scene">
      {!opened && (
        <>
          <h2>A letter for you</h2>
          <p className="scene-copy">From {from}, with love.</p>
        </>
      )}

      <div className={opened ? 'envelope opened' : 'envelope'}>
        <button
          type="button"
          className="envelope-front"
          aria-label="Open the letter"
          disabled={opened}
          onClick={() => setOpened(true)}
        >
          <span className="flap" aria-hidden="true" />
          <span className="seal" aria-hidden="true">♥</span>
        </button>
        <article className="letter" aria-live="polite">
          <p className="letter-to">Dear {name},</p>
          <p className="letter-body">
            {shown}
            {opened && !finished && <span className="caret" aria-hidden="true" />}
          </p>
          <p className={finished ? 'letter-from show' : 'letter-from'}>With love, {from}</p>
        </article>
      </div>

      {!opened && <p className="pull-hint">Tap the envelope</p>}

      {finished && (
        <div className="finale">
          <p className="finale-title">Happy Birthday!</p>
          <div className="scene-actions">
            <a className="btn btn-glow" href={whatsAppUrl(reply)} target="_blank" rel="noreferrer">
              💬 Say thank you
            </a>
            <button type="button" className="btn btn-soft-dark" onClick={onReplay}>↺ Watch again</button>
            <a className="btn btn-link" href="/">Make one for someone</a>
          </div>
        </div>
      )}
    </section>
  )
}
