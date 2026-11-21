import { useEffect, useState } from 'react'
import { daysInMonth, formatBirthday, MONTHS } from '../lib/dates.js'
import { compressImage } from '../lib/photos.js'
import { samplePhotos } from '../lib/sample.js'
import { MAX_PHOTOS, MIN_REASONS, publishDraft, whatsAppUrl } from '../lib/share.js'
import { THEMES, themeById } from '../lib/themes.js'
import { BalloonDoodle, CakeDoodle, CameraDoodle, EnvelopeDoodle, GiftDoodle, HeartDoodle, StarDoodle } from './Doodles.jsx'
import FairyLights from './FairyLights.jsx'

const STEPS = [
  {
    label: 'The star',
    title: 'Who are we celebrating?',
    sub: 'Start with their name. The whole thing takes about two minutes.',
    Doodle: StarDoodle,
  },
  {
    label: 'The cake',
    title: 'Choose their cake',
    sub: 'They will light the candles, make a wish, and cut the first slice.',
    Doodle: CakeDoodle,
  },
  {
    label: 'Balloons',
    title: 'Tie a reason to each balloon',
    sub: 'They pop the balloons one at a time to find out why they are loved.',
    Doodle: BalloonDoodle,
  },
  {
    label: 'Photos',
    title: 'Add your favourite photos',
    sub: `Up to ${MAX_PHOTOS} pictures, hung on a string of fairy lights. A short caption makes each one special.`,
    Doodle: CameraDoodle,
  },
  {
    label: 'The letter',
    title: 'Write them a letter',
    sub: 'The last thing they see. Say the thing you always mean to say.',
    Doodle: EnvelopeDoodle,
  },
]

const READY = STEPS.length
const STORAGE_KEY = 'birthday-moments-draft'
const REASON_MAX = 60
const MESSAGE_MAX = 600
const BALLOON_COLORS = ['#ff6b8b', '#ffb547', '#5ec8f2', '#9b7cf6', '#4fd1a5']
const REASON_IDEAS = [
  'Your laugh fixes my worst days',
  'You always know what to say',
  'You make every plan more fun',
  'You never forget the little things',
  'You believe in me more than I do',
  'Your hugs are the best',
]
const LETTER_STARTERS = [
  'Happy birthday! I still remember the day we met…',
  'To my favourite person, another year of you is the best gift.',
  'I do not say it enough, so here it is: thank you for being you.',
]

const emptyData = {
  name: '',
  from: '',
  age: '',
  day: '',
  month: '',
  theme: 'rose',
  reasons: ['', '', '', '', ''],
  photos: [],
  message: '',
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && typeof saved === 'object' && Array.isArray(saved.reasons)) {
      return { ...emptyData, ...saved }
    }
  } catch {
    // ignore unreadable drafts
  }
  return emptyData
}

function validateStep(step, data) {
  if (step === 0) {
    if (!data.name.trim()) return 'Add the birthday person’s name.'
    if (!data.from.trim()) return 'Add your name so they know who it is from.'
    if (data.age !== '') {
      const age = Number(data.age)
      if (!Number.isInteger(age) || age < 1 || age > 120) return 'Age should be a number between 1 and 120.'
    }
    if (Boolean(data.day) !== Boolean(data.month)) return 'Pick both a day and a month, or leave both empty.'
    if (data.month && Number(data.day) > daysInMonth(data.month)) {
      return `${MONTHS[data.month - 1]} only has ${daysInMonth(data.month)} days.`
    }
  }
  if (step === 1 && !THEMES.some((theme) => theme.id === data.theme)) return 'Pick a cake.'
  if (step === 2) {
    const filled = data.reasons.filter((reason) => reason.trim()).length
    if (filled < MIN_REASONS) return `Fill at least ${MIN_REASONS} balloons.`
  }
  if (step === 3 && data.photos.length < 1) return 'Add at least one photo.'
  if (step === 4) {
    if (!data.message.trim()) return 'Write a few words for your letter.'
    if (data.message.length > MESSAGE_MAX) return `Keep the letter under ${MESSAGE_MAX} characters.`
  }
  return ''
}

export default function Wizard({ onExit }) {
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [data, setData] = useState(loadSaved)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [link, setLink] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage full (large photos); the draft just won't survive a refresh
    }
  }, [data])

  const patch = (partial) => {
    setData((prev) => ({ ...prev, ...(typeof partial === 'function' ? partial(prev) : partial) }))
    setError('')
    setCopied(false)
  }

  const goTo = (index) => {
    setError('')
    setStep(index)
    setReached((current) => Math.max(current, index))
  }

  const next = async () => {
    const problem = validateStep(step, data)
    if (problem) {
      setError(problem)
      return
    }
    if (step !== READY - 1) {
      goTo(step + 1)
      return
    }
    setBusy(true)
    setError('')
    try {
      setLink(await publishDraft({ ...data, birthday }))
      goTo(READY)
    } catch (reason) {
      setError(reason.message || 'Could not save the surprise.')
    } finally {
      setBusy(false)
    }
  }

  const back = () => {
    if (step === 0) onExit()
    else goTo(step - 1)
  }

  const addPhotoItems = (items) => {
    setData((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        ...items.slice(0, MAX_PHOTOS - prev.photos.length).map((item) => ({
          id: crypto.randomUUID(),
          src: item.src,
          caption: item.caption || '',
        })),
      ],
    }))
    setError('')
  }

  const addFiles = async (fileList) => {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'))
    if (!files.length) return
    const room = MAX_PHOTOS - data.photos.length
    if (room <= 0) {
      setError(`You can hang up to ${MAX_PHOTOS} photos.`)
      return
    }
    setBusy(true)
    try {
      const items = []
      for (const file of files.slice(0, room)) items.push({ src: await compressImage(file) })
      addPhotoItems(items)
      if (files.length > room) setError(`Only ${MAX_PHOTOS} photos fit on the string, so the extra ones were skipped.`)
    } catch (reason) {
      setError(reason.message || 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const movePhoto = (index, delta) => {
    patch((prev) => {
      const photos = [...prev.photos]
      const target = index + delta
      if (target < 0 || target >= photos.length) return {}
      ;[photos[index], photos[target]] = [photos[target], photos[index]]
      return { photos }
    })
  }

  const setReason = (index, value) => {
    patch((prev) => {
      const reasons = [...prev.reasons]
      reasons[index] = value
      return { reasons }
    })
  }

  const fillIdea = (idea) => {
    const index = data.reasons.findIndex((reason) => !reason.trim())
    if (index !== -1) setReason(index, idea)
  }

  const birthday = data.day && data.month ? formatBirthday(data.day, data.month) : ''
  const previewLink = link.replace('/view/#', '/view/?preview=1#')
  const shareText = `${data.from.trim() || 'Someone'} made you a birthday surprise 🎁 Open it: ${link}`
  const theme = themeById(data.theme)
  const meta = step < READY ? STEPS[step] : { title: 'Your surprise is ready', sub: 'Send the link and let them unwrap it.', Doodle: GiftDoodle }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setError('Could not copy automatically. Press and hold the link to copy it.')
    }
  }

  const maxDay = data.month ? daysInMonth(data.month) : 31

  return (
    <div className="builder">
      <aside className="builder-side">
        <button type="button" className="brand" onClick={onExit}>
          <span className="brand-icon" aria-hidden="true"><CakeDoodle /></span>
          Birthday Moments
        </button>
        <div className="side-head">
          <p className="step-number">
            {step < READY ? String(step + 1).padStart(2, '0') : '✓'}
            <small>{step < READY ? `/ ${String(STEPS.length).padStart(2, '0')}` : 'done'}</small>
          </p>
          <h1>{meta.title}</h1>
          <p className="side-sub">{meta.sub}</p>
        </div>
        <div className="side-doodles" aria-hidden="true">
          <BalloonDoodle className="doodle d1" />
          <StarDoodle className="doodle d2" />
          <GiftDoodle className="doodle d3" />
          <HeartDoodle className="doodle d4" />
          <meta.Doodle className="doodle d5" />
        </div>
        <ol className="step-list">
          {STEPS.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                className={index === step ? 'current' : index < reached || step === READY ? 'done' : ''}
                disabled={index > reached}
                aria-current={index === step ? 'step' : undefined}
                onClick={() => goTo(index)}
              >
                <span className="step-index">{index < reached && index !== step ? '✓' : String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <section className="builder-main">
        <div className="mobile-progress" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span key={item.label} className={index <= step ? 'on' : ''} />
          ))}
        </div>

        <div className="builder-form" key={step}>
          {step === 0 && (
            <>
              <label className="tab-field">
                <span className="tab">Their name</span>
                <input
                  value={data.name}
                  maxLength={40}
                  placeholder="e.g. Nila"
                  autoFocus
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </label>
              <label className="tab-field">
                <span className="tab">Your name</span>
                <input
                  value={data.from}
                  maxLength={40}
                  placeholder="e.g. Karthik"
                  onChange={(event) => patch({ from: event.target.value })}
                />
              </label>
              <label className="tab-field">
                <span className="tab">Turning <em>optional</em></span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={data.age}
                  placeholder="e.g. 25"
                  onChange={(event) => patch({ age: event.target.value })}
                />
              </label>
              <fieldset className="tab-field">
                <legend className="tab">Their birthday <em>optional · unlocks at midnight</em></legend>
                <div className="date-row">
                  <select
                    aria-label="Birthday day"
                    value={data.day}
                    onChange={(event) => patch({ day: event.target.value })}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: maxDay }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Birthday month"
                    value={data.month}
                    onChange={(event) => {
                      const month = event.target.value
                      patch((prev) => ({
                        month,
                        day: month && Number(prev.day) > daysInMonth(month) ? '' : prev.day,
                      }))
                    }}
                  >
                    <option value="">Month</option>
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </fieldset>
            </>
          )}

          {step === 1 && (
            <fieldset className="cake-grid">
              <legend className="sr-only">Cake flavour</legend>
              {THEMES.map((item) => (
                <label key={item.id} className={data.theme === item.id ? 'cake-card selected' : 'cake-card'}>
                  <input
                    type="radio"
                    name="theme"
                    value={item.id}
                    checked={data.theme === item.id}
                    onChange={() => patch({ theme: item.id })}
                  />
                  <span
                    className="mini-cake"
                    aria-hidden="true"
                    style={{ '--frosting': item.frosting, '--sponge': item.sponge, '--plate': item.plate }}
                  >
                    <span className="mini-candle" />
                    <span className="mini-top" />
                    <span className="mini-body" />
                    <span className="mini-plate" />
                  </span>
                  <strong>{item.name}</strong>
                  <small>♪ {item.tune}</small>
                </label>
              ))}
            </fieldset>
          )}

          {step === 2 && (
            <>
              <ul className="balloon-inputs">
                {data.reasons.map((reason, index) => (
                  <li key={index}>
                    <span
                      className="balloon-chip"
                      aria-hidden="true"
                      style={{
                        '--balloon': BALLOON_COLORS[index],
                        '--fill': 0.55 + Math.min(reason.length, 30) / 66,
                      }}
                    />
                    <label className="tab-field">
                      <span className="tab">
                        Balloon {index + 1} {index >= MIN_REASONS && <em>optional</em>}
                      </span>
                      <input
                        value={reason}
                        maxLength={REASON_MAX}
                        placeholder="Why do you love them?"
                        onChange={(event) => setReason(index, event.target.value)}
                      />
                    </label>
                  </li>
                ))}
              </ul>
              <p className="ideas-label">Need ideas? Tap one:</p>
              <div className="ideas">
                {REASON_IDEAS.filter((idea) => !data.reasons.includes(idea)).map((idea) => (
                  <button key={idea} type="button" className="idea" onClick={() => fillIdea(idea)}>
                    + {idea}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="lights-preview">
                {data.photos.length ? (
                  <FairyLights photos={data.photos} compact />
                ) : (
                  <p className="lights-empty">Your photos will hang here ✨</p>
                )}
              </div>

              {data.photos.length < MAX_PHOTOS && (
                <label
                  className={dragging ? 'dropzone dragging' : 'dropzone'}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    addFiles(event.dataTransfer.files)
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={busy}
                    onChange={(event) => {
                      addFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                  <CameraDoodle className="drop-icon" aria-hidden="true" />
                  <strong>{busy ? 'Adding your photos…' : 'Tap to add photos'}</strong>
                  <span>or drag them here · {data.photos.length} of {MAX_PHOTOS} added</span>
                </label>
              )}

              {data.photos.length === 0 && (
                <button type="button" className="text-btn" onClick={() => addPhotoItems(samplePhotos())}>
                  No photos handy? Try sample pictures
                </button>
              )}

              <ul className="photo-list">
                {data.photos.map((photo, index) => (
                  <li key={photo.id}>
                    <img src={photo.src} alt="" />
                    <label className="tab-field">
                      <span className="tab">Caption <em>optional</em></span>
                      <input
                        value={photo.caption}
                        maxLength={40}
                        placeholder="e.g. Ooty, 2024"
                        onChange={(event) => {
                          const value = event.target.value
                          patch((prev) => ({
                            photos: prev.photos.map((item) => (item.id === photo.id ? { ...item, caption: value } : item)),
                          }))
                        }}
                      />
                    </label>
                    <div className="photo-tools">
                      <button type="button" aria-label="Move photo left" disabled={index === 0} onClick={() => movePhoto(index, -1)}>←</button>
                      <button
                        type="button"
                        aria-label="Move photo right"
                        disabled={index === data.photos.length - 1}
                        onClick={() => movePhoto(index, 1)}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => patch((prev) => ({ photos: prev.photos.filter((item) => item.id !== photo.id) }))}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 4 && (
            <>
              <label className="paper">
                <span className="paper-to">Dear {data.name.trim() || 'you'},</span>
                <textarea
                  rows={9}
                  value={data.message}
                  maxLength={MESSAGE_MAX}
                  placeholder="Write from the heart…"
                  aria-label="Your birthday letter"
                  onChange={(event) => patch({ message: event.target.value })}
                />
                <span className="paper-from">With love, {data.from.trim() || 'me'}</span>
                <small className="count">{data.message.length}/{MESSAGE_MAX}</small>
              </label>
              {!data.message && (
                <div className="ideas">
                  {LETTER_STARTERS.map((line) => (
                    <button key={line} type="button" className="idea" onClick={() => patch({ message: line })}>
                      {line}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === READY && (
            <div className="ready">
              <div className="phone" style={{ '--bg': theme.bg, '--accent': theme.accent }}>
                <div className="phone-screen">
                  <GiftDoodle className="phone-gift" aria-hidden="true" />
                  <p className="phone-eyebrow">A surprise from {data.from.trim()}</p>
                  <p className="phone-name">For {data.name.trim()}</p>
                  <ul className="phone-list">
                    <li>🎂 {theme.name} cake{data.age ? `, turning ${data.age}` : ''}</li>
                    <li>🎈 {data.reasons.filter((reason) => reason.trim()).length} balloons</li>
                    <li>📸 {data.photos.length} photos</li>
                    <li>💌 A letter</li>
                    {birthday && <li>🔒 Opens {MONTHS[data.month - 1]} {Number(data.day)}</li>}
                  </ul>
                </div>
              </div>
              <div className="share-panel">
                <a className="btn btn-primary btn-wide" href={whatsAppUrl(shareText)} target="_blank" rel="noreferrer">
                  Send on WhatsApp
                </a>
                <button type="button" className="btn btn-soft btn-wide" onClick={copyLink}>
                  {copied ? 'Link copied ✓' : 'Copy link'}
                </button>
                <a className="btn btn-ghost btn-wide" href={previewLink} target="_blank" rel="noreferrer">
                  Preview it yourself
                </a>
                <textarea className="link-box" readOnly rows={2} value={link} aria-label="Share link" onFocus={(event) => event.target.select()} />
                <p className="notice">This short link opens on a phone, with the photos included. Keep this computer on while they view it.</p>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY)
                    setData(emptyData)
                    setLink('')
                    setReached(0)
                    goTo(0)
                  }}
                >
                  Start a new one
                </button>
              </div>
            </div>
          )}

          {error && <p className="error" role="alert">{error}</p>}
        </div>

        <footer className="builder-footer">
          <button type="button" className="btn btn-ghost" onClick={back}>
            ← {step === 0 ? 'Home' : 'Back'}
          </button>
          {step < READY && (
            <button type="button" className="btn btn-primary btn-next" onClick={next} disabled={busy}>
              {busy && step === READY - 1 ? 'Saving photos…' : step === 0 ? 'Let’s begin' : step === READY - 1 ? 'Finish my surprise' : 'Next'} →
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
