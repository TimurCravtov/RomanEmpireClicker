import { ICONS } from '../game/data.js'
import { formatNumber } from '../game/format.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/achievements.css'

export default function WelcomeBack({ gained, elapsed, onClose }) {
  const i18n = useI18n()
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={(e) => e.stopPropagation()}>
        <img src={ICONS.crown} alt="" width="64" height="64" />
        <h2 id="welcome-title">{i18n.t('welcome.title')}</h2>
        <p>
          {i18n.rich('welcome.body', {
            time: <strong>{i18n.duration(elapsed)}</strong>,
            n: <strong>{formatNumber(gained)}</strong>,
          })}
        </p>
        <button className="btn" onClick={onClose} autoFocus>
          {i18n.t('welcome.collect')}
        </button>
      </div>
    </div>
  )
}
