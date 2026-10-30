import { ICONS } from '../game/data.js'
import { ASCEND_MIN_GAIN, GLORY_BONUS, gloryPotential } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import '../styles/achievements.css'

export default function Ascend({ state, onAscend }) {
  const gain = gloryPotential(state)
  const canAscend = gain >= ASCEND_MIN_GAIN

  function handleAscend() {
    const msg = `Ascend and found a new dynasty?\n\nYour denarii, buildings and edicts reset. You gain ${gain} Glory (+${Math.round(gain * GLORY_BONUS * 100)}% production).`
    if (window.confirm(msg)) onAscend()
  }

  return (
    <section className="panel ascend">
      <h2 className="panel__title">
        Gloria <small>{state.ascensions} ascensions</small>
      </h2>
      <p>
        <img src={ICONS.laurelCrown} alt="" width="18" height="18" style={{ verticalAlign: '-3px' }} /> Glory: <strong>{state.glory}</strong>{' '}
        <span className="muted">(+{Math.round(state.glory * GLORY_BONUS * 100)}% production &amp; clicks)</span>
      </p>
      <p className="muted">
        {canAscend
          ? `Ascend now to earn ${formatNumber(gain)} Glory.`
          : 'Earn about 100 million denarii in a single reign to claim Glory.'}
      </p>
      <button className="btn" disabled={!canAscend} onClick={handleAscend}>
        Ascend to the Purple
      </button>
    </section>
  )
}
