const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function BalloonDoodle(props) {
  return (
    <svg viewBox="0 0 40 64" {...props}>
      <g {...stroke}>
        <path d="M20 4c9 0 15 7 15 16 0 10-8 19-15 19S5 30 5 20C5 11 11 4 20 4z" />
        <path d="M17 39l3 4 3-4" />
        <path d="M20 43c-4 6 4 10 0 18" />
      </g>
    </svg>
  )
}

export function StarDoodle(props) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <path {...stroke} d="M20 4l4.6 10.4L36 15.6l-8.6 7.6 2.6 11.2L20 28.6 10 34.4l2.6-11.2L4 15.6l11.4-1.2z" />
    </svg>
  )
}

export function GiftDoodle(props) {
  return (
    <svg viewBox="0 0 44 44" {...props}>
      <g {...stroke}>
        <rect x="6" y="18" width="32" height="22" rx="2" />
        <rect x="4" y="12" width="36" height="7" rx="2" />
        <path d="M22 12v28" />
        <path d="M22 12c-4-8-13-6-10-1 2 2 6 1 10 1zM22 12c4-8 13-6 10-1-2 2-6 1-10 1z" />
      </g>
    </svg>
  )
}

export function CakeDoodle(props) {
  return (
    <svg viewBox="0 0 48 44" {...props}>
      <g {...stroke}>
        <path d="M6 22h36v18H6z" />
        <path d="M6 28c4 3 8 3 12 0s8-3 12 0 8 3 12 0" />
        <path d="M24 22v-8" />
        <path d="M24 6c2 2 2 4 0 6-2-2-2-4 0-6z" />
      </g>
    </svg>
  )
}

export function HeartDoodle(props) {
  return (
    <svg viewBox="0 0 40 36" {...props}>
      <path {...stroke} d="M20 33S4 23 4 12c0-5 4-8 8-8 4 0 6 3 8 6 2-3 4-6 8-6 4 0 8 3 8 8 0 11-16 21-16 21z" />
    </svg>
  )
}

export function EnvelopeDoodle(props) {
  return (
    <svg viewBox="0 0 48 36" {...props}>
      <g {...stroke}>
        <rect x="4" y="4" width="40" height="28" rx="3" />
        <path d="M4 7l20 14L44 7" />
      </g>
    </svg>
  )
}

export function CameraDoodle(props) {
  return (
    <svg viewBox="0 0 48 40" {...props}>
      <g {...stroke}>
        <rect x="4" y="10" width="40" height="26" rx="4" />
        <path d="M16 10l3-6h10l3 6" />
        <circle cx="24" cy="23" r="7" />
      </g>
    </svg>
  )
}
