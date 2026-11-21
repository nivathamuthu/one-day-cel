const SAG = 34
const WIRE_TOP = 10
const BULB_COLORS = ['#ffd166', '#ff8fab', '#8bd3ff', '#b8f2a0', '#ffb36b']

function wireY(t) {
  return WIRE_TOP + SAG * 4 * t * (1 - t)
}

export default function FairyLights({ photos, onOpen, compact = false }) {
  const count = Math.max(photos.length, 1)
  const bulbs = Array.from({ length: compact ? 9 : 14 }, (_, index) => (index + 0.5) / (compact ? 9 : 14))

  return (
    <div className={compact ? 'lights-scroll compact' : 'lights-scroll'}>
      <div className="lights" style={{ '--n': count }}>
        <svg className="wire" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          <path d={`M0 ${WIRE_TOP} Q50 ${WIRE_TOP + SAG * 2} 100 ${WIRE_TOP}`} vectorEffect="non-scaling-stroke" />
        </svg>
        {bulbs.map((t, index) => (
          <span
            key={t}
            className="bulb"
            aria-hidden="true"
            style={{
              left: `${t * 100}%`,
              top: `${wireY(t)}px`,
              '--bulb': BULB_COLORS[index % BULB_COLORS.length],
              animationDelay: `${(index % 5) * 0.35}s`,
            }}
          />
        ))}
        {photos.map((photo, index) => {
          const t = (index + 0.5) / count
          const content = (
            <>
              <span className="peg" aria-hidden="true" />
              <img src={photo.src} alt={photo.caption || `Photo ${index + 1}`} />
              <span className="polaroid-caption">{photo.caption}</span>
            </>
          )
          const style = {
            left: `${t * 100}%`,
            top: `${wireY(t) - 4}px`,
            '--tilt': `${index % 2 ? 3 : -3}deg`,
            animationDelay: `${index * 0.4}s`,
          }
          return onOpen ? (
            <button key={photo.src + index} type="button" className="polaroid" style={style} onClick={() => onOpen(index)}>
              {content}
            </button>
          ) : (
            <figure key={photo.src + index} className="polaroid" style={style}>
              {content}
            </figure>
          )
        })}
      </div>
    </div>
  )
}
