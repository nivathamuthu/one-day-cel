import { sampleDraft } from '../lib/sample.js'
import { shareUrl } from '../lib/share.js'
import { BalloonDoodle, CakeDoodle, GiftDoodle, HeartDoodle, StarDoodle } from './Doodles.jsx'

const STEPS = ['The star', 'The cake', 'Balloons', 'Photos', 'The letter']

export default function Landing({ onCreate }) {
  const openExample = () => {
    window.location.assign(shareUrl(sampleDraft()))
  }

  return (
    <section className="landing">
      <div className="landing-doodles" aria-hidden="true">
        <BalloonDoodle className="doodle l1" />
        <StarDoodle className="doodle l2" />
        <GiftDoodle className="doodle l3" />
        <HeartDoodle className="doodle l4" />
        <CakeDoodle className="doodle l5" />
      </div>

      <div className="landing-inner">
        <svg className="heart-defs" aria-hidden="true">
          <defs>
            <clipPath id="love-heart" clipPathUnits="objectBoundingBox">
              <path d="M0.5 0.93 C0.5 0.93 0.05 0.6 0.05 0.36 C0.05 0.16 0.2 0.04 0.36 0.1 C0.44 0.13 0.48 0.2 0.5 0.28 C0.52 0.2 0.56 0.13 0.64 0.1 C0.8 0.04 0.95 0.16 0.95 0.36 C0.95 0.6 0.5 0.93 0.5 0.93 Z" />
            </clipPath>
          </defs>
        </svg>
        <div className="heart-frame">
          <div className="heart-photo" role="img" aria-label="A couple smiling together" />
        </div>

        <p className="landing-kicker">Birthday Moments</p>
        <h1>Send a birthday surprise they will never forget</h1>
        <p className="tagline">
          They unwrap a gift, blow out the candles, pop balloons full of reasons, see your photos on fairy lights,
          and read your letter. All from one link.
        </p>

        <div className="landing-actions">
          <button type="button" className="btn btn-primary btn-big" onClick={onCreate}>
            Create a surprise →
          </button>
          <button type="button" className="btn btn-ghost" onClick={openExample}>
            See an example
          </button>
        </div>

        <ol className="landing-steps">
          {STEPS.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="fine-print">Free · No sign-up · Opens on any phone</p>
      </div>
    </section>
  )
}
