import { Howl } from 'howler'
import { useEffect, useMemo, useRef, useState } from 'react'
import { birthdayLabel, isBirthdayToday, nextBirthday, parseBirthday } from '../../lib/dates.js'
import { SURPRISE_ID, requestJson } from '../../lib/api.js'
import { decodeDraft } from '../../lib/codec.js'
import { themeById } from '../../lib/themes.js'
import { useSlow } from '../../lib/useSlow.js'
import BalloonScene from './BalloonScene.jsx'
import CakeScene from './CakeScene.jsx'
import GiftScene from './GiftScene.jsx'
import LetterScene from './LetterScene.jsx'
import LightsScene from './LightsScene.jsx'
import YourDayScene from './YourDayScene.jsx'

function surpriseId() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  return new URLSearchParams(hash).get('s') || ''
}

async function readDraft() {
  const id = surpriseId()
  if (id) {
    if (!SURPRISE_ID.test(id)) return { error: 'This birthday link is not complete. Ask them to send it again.' }
    try {
      const { status, ok, body } = await requestJson(`/api/surprises/${id}`)
      if (status === 404) return { error: 'This surprise could not be found. Ask them to send the link again.' }
      if (!ok || !body || typeof body !== 'object') {
        return { error: 'The birthday server is having trouble right now.', retryable: status !== 400 }
      }
      return { key: id, data: normalize(body) }
    } catch (error) {
      return { error: error.message, retryable: true }
    }
  }
  try {
    if (!window.location.hash.includes('draft=')) return { error: 'This link has no birthday surprise attached.' }
    return { key: 'draft', data: normalize(decodeDraft(window.location.hash)) }
  } catch {
    return { error: 'This birthday link is damaged and could not be opened. Photos make the old link too long for a phone.' }
  }
}

function normalize(data) {
  const photos = Array.isArray(data.photos) ? data.photos.filter((src) => typeof src === 'string') : []
  const captions = Array.isArray(data.captions) ? data.captions.map((caption) => String(caption || '')) : []
  return {
    name: String(data.name || 'Friend').slice(0, 40),
    from: String(data.from || 'Someone who loves you').slice(0, 40),
    age: Math.max(0, Math.min(120, Math.floor(Number(data.age) || 0))),
    birthday: String(data.birthday || ''),
    reasons: Array.isArray(data.reasons) ? data.reasons.map((reason) => String(reason || '')).filter(Boolean).slice(0, 5) : [],
    message: String(data.message || ''),
    photos: photos.slice(0, 8).map((src, index) => ({ src, caption: captions[index] || '' })),
    theme: themeById(data.theme),
  }
}

function useCountdown(birthday) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!parseBirthday(birthday)) return { unlocked: true }
  const diff = Math.max(0, nextBirthday(birthday, now).getTime() - now.getTime())
  return {
    unlocked: isBirthdayToday(birthday, now),
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export default function Viewer() {
  const [payload, setPayload] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const slow = useSlow(Boolean(payload.loading), 6000)

  useEffect(() => {
    let cancel = false
    const sync = () => {
      setPayload({ loading: true })
      readDraft().then((next) => {
        if (!cancel) setPayload(next)
      })
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => {
      cancel = true
      window.removeEventListener('hashchange', sync)
    }
  }, [attempt])

  if (payload.loading) {
    return (
      <main className="viewer missing">
        <section className="scene">
          <p className="big-emoji" aria-hidden="true">🎁</p>
          <h1>Opening the surprise…</h1>
          {slow && <p>Waking up the birthday server. The first visit can take up to a minute.</p>}
        </section>
      </main>
    )
  }

  if (payload.error) {
    return (
      <main className="viewer missing">
        <section className="scene">
          <p className="big-emoji" aria-hidden="true">🎈</p>
          <h1>{payload.retryable ? 'The surprise is taking a moment' : 'This surprise floated away'}</h1>
          <p>{payload.error}</p>
          {payload.retryable ? (
            <button type="button" className="btn btn-primary" onClick={() => setAttempt((count) => count + 1)}>
              Try again
            </button>
          ) : (
            <a className="btn btn-primary" href="/">Make a birthday surprise</a>
          )}
        </section>
      </main>
    )
  }
  return <Experience key={payload.key} data={payload.data} />
}

const pad = (value) => String(value).padStart(2, '0')

function Experience({ data }) {
  const preview = new URLSearchParams(window.location.search).has('preview')
  const countdown = useCountdown(data.birthday)
  const unlocked = preview || countdown.unlocked
  const [stage, setStage] = useState('gift')
  const [muted, setMuted] = useState(false)
  const soundRef = useRef(null)

  const stages = useMemo(() => {
    const order = ['gift', 'yourday', 'cake']
    if (data.reasons.length) order.push('balloons')
    if (data.photos.length) order.push('lights')
    order.push('letter')
    return order
  }, [data.reasons.length, data.photos.length])

  useEffect(() => {
    document.title = `A birthday surprise for ${data.name}`
    return () => soundRef.current?.unload()
  }, [data.name])

  const startMusic = () => {
    if (!soundRef.current) {
      soundRef.current = new Howl({ src: [data.theme.music], loop: true, volume: 0.35, html5: true })
    }
    if (!muted && !soundRef.current.playing()) soundRef.current.play()
  }

  const toggleMute = () => {
    if (!soundRef.current) return
    if (muted) soundRef.current.play()
    else soundRef.current.pause()
    setMuted(!muted)
  }

  const nextStage = () => {
    setStage((current) => stages[Math.min(stages.indexOf(current) + 1, stages.length - 1)])
    window.scrollTo({ top: 0 })
  }

  const style = { '--bg': data.theme.bg, '--accent': data.theme.accent, '--frosting': data.theme.frosting }

  if (!unlocked) {
    return (
      <main className="viewer" style={style}>
        <section className="scene lock">
          <p className="big-emoji" aria-hidden="true">🔒</p>
          <p className="eyebrow">A surprise from {data.from}</p>
          <h1>Not yet, {data.name}!</h1>
          <p className="scene-copy">
            This opens at midnight on {birthdayLabel(data.birthday)}. Some things are worth waiting for.
          </p>
          <div className="countdown" role="timer" aria-live="off">
            {countdown.days > 0 && <span><strong>{countdown.days}</strong>days</span>}
            <span><strong>{pad(countdown.hours)}</strong>hours</span>
            <span><strong>{pad(countdown.minutes)}</strong>min</span>
            <span><strong>{pad(countdown.seconds)}</strong>sec</span>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`viewer stage-${stage}`} style={style}>
      {stage !== 'gift' && (
        <button type="button" className="mute" aria-pressed={muted} aria-label={muted ? 'Turn music on' : 'Turn music off'} onClick={toggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {stage === 'gift' && (
        <GiftScene
          from={data.from}
          onOpen={startMusic}
          onDone={nextStage}
        />
      )}
      {stage === 'yourday' && <YourDayScene name={data.name} theme={data.theme} onContinue={nextStage} />}
      {stage === 'cake' && <CakeScene age={data.age} name={data.name} theme={data.theme} onContinue={nextStage} />}
      {stage === 'balloons' && <BalloonScene reasons={data.reasons} name={data.name} onContinue={nextStage} />}
      {stage === 'lights' && <LightsScene photos={data.photos} onContinue={nextStage} />}
      {stage === 'letter' && (
        <LetterScene
          name={data.name}
          from={data.from}
          message={data.message}
          theme={data.theme}
          onReplay={() => setStage('yourday')}
        />
      )}

      {stage !== 'gift' && (
        <ol className="stage-dots" aria-label="Progress">
          {stages.slice(1).map((item) => (
            <li key={item} className={item === stage ? 'on' : stages.indexOf(item) < stages.indexOf(stage) ? 'past' : ''} />
          ))}
        </ol>
      )}
    </main>
  )
}
