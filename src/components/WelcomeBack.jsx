import { ICONS } from '../game/data.js'
import { formatDuration, formatNumber } from '../game/format.js'
import '../styles/achievements.css'

export default function WelcomeBack({ gained, elapsed, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={(e) => e.stopPropagation()}>
        <img src={ICONS.crown} alt="" width="64" height="64" />
        <h2 id="welcome-title">Ave, Imperator!</h2>
        <p>
          Your provinces labored for <strong>{formatDuration(elapsed)}</strong> in your absence and delivered{' '}
          <strong>{formatNumber(gained)}</strong> denarii.
        </p>
        <button className="btn" onClick={onClose} autoFocus>
          Collect
        </button>
      </div>
    </div>
  )
}
