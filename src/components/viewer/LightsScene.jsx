import { useEffect, useState } from 'react'
import FairyLights from '../FairyLights.jsx'

export default function LightsScene({ photos, onContinue }) {
  const [open, setOpen] = useState(null)

  useEffect(() => {
    if (open === null) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(null)
      if (event.key === 'ArrowRight') setOpen((index) => (index + 1) % photos.length)
      if (event.key === 'ArrowLeft') setOpen((index) => (index - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, photos.length])

  return (
    <section className="scene lights-scene">
      <h2>Little moments</h2>
      <p className="scene-copy">Tap a photo to see it up close.</p>
      <FairyLights photos={photos} onOpen={setOpen} />
      <div className="scene-actions">
        <button type="button" className="btn btn-glow" onClick={onContinue}>One last thing →</button>
      </div>

      {open !== null && (
        <div className="lightbox" role="dialog" aria-label="Photo" onClick={() => setOpen(null)}>
          <figure className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <img src={photos[open].src} alt={photos[open].caption || `Photo ${open + 1}`} />
            {photos[open].caption && <figcaption>{photos[open].caption}</figcaption>}
          </figure>
          <div className="lightbox-nav" onClick={(event) => event.stopPropagation()}>
            {photos.length > 1 && (
              <button type="button" aria-label="Previous photo" onClick={() => setOpen((open - 1 + photos.length) % photos.length)}>←</button>
            )}
            <button type="button" aria-label="Close photo" onClick={() => setOpen(null)}>✕</button>
            {photos.length > 1 && (
              <button type="button" aria-label="Next photo" onClick={() => setOpen((open + 1) % photos.length)}>→</button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
