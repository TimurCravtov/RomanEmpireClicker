import { ICONS } from '../game/data.js'
import { OMEN_LIFETIME_S } from '../game/omens.js'
import '../styles/omens.css'

export default function Omen({ omen, onClaim }) {
  if (!omen) return null
  return (
    <button
      key={omen.key}
      className="omen"
      style={{ left: `${omen.x}%`, top: `${omen.y}%`, animationDuration: `${OMEN_LIFETIME_S}s` }}
      onClick={onClaim}
      aria-label="An omen from Fortuna! Click to claim it."
      title="An omen from Fortuna!"
    >
      <img src={ICONS.laurelCrown} alt="" draggable="false" />
    </button>
  )
}
