import { ICONS } from '../game/data.js'
import { OMEN_LIFETIME_S } from '../game/omens.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/omens.css'

export default function Omen({ omen, onClaim }) {
  const { t } = useI18n()
  if (!omen) return null
  return (
    <button
      key={omen.key}
      className="omen"
      style={{ left: `${omen.x}%`, top: `${omen.y}%`, animationDuration: `${OMEN_LIFETIME_S}s` }}
      onClick={onClaim}
      aria-label={t('omen.aria')}
      title={t('omen.aria')}
    >
      <img src={ICONS.laurelCrown} alt="" draggable="false" />
    </button>
  )
}
