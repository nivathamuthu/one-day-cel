import { useEffect } from 'react'
import { sideCannons } from '../../lib/celebrate.js'

const FLOATERS = ['🎈', '💖', '✨', '🎉', '🎈', '💛', '✨', '🎊']

export default function YourDayScene({ name, theme, onContinue }) {
  useEffect(() => {
    const colors = [theme.frosting, theme.accent, '#ffffff', theme.sponge, '#ffd166']
    sideCannons(colors)
    const again = setTimeout(() => sideCannons(colors), 900)
    return () => clearTimeout(again)
  }, [theme])

  return (
    <section className="scene yourday" onClick={onContinue}>
      <div className="floaters" aria-hidden="true">
        {FLOATERS.map((item, index) => (
          <span key={index} style={{ left: `${8 + index * 11.5}%`, animationDelay: `${index * 0.45}s` }}>{item}</span>
        ))}
      </div>
      <p className="eyebrow">It’s officially</p>
      <h1 className="yourday-title">
        <span>Your</span> <span>Day,</span>
        <br />
        <span className="yourday-name">{name}!</span>
      </h1>
      <button type="button" className="btn btn-glow">
        Let’s celebrate →
      </button>
      <p className="tap-hint">or tap anywhere</p>
    </section>
  )
}
