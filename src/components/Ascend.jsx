import { ICONS } from '../game/data.js'
import { ASCEND_MIN_GAIN, GLORY_BONUS, gloryPotential } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/achievements.css'

export default function Ascend({ state, onAscend }) {
  const { t } = useI18n()
  const gain = gloryPotential(state)
  const canAscend = gain >= ASCEND_MIN_GAIN

  function handleAscend() {
    if (window.confirm(t('gloria.confirm', { g: gain, p: Math.round(gain * GLORY_BONUS * 100) }))) onAscend()
  }

  return (
    <section className="panel ascend">
      <h2 className="panel__title">
        {t('gloria.title')} <small>{t('gloria.ascensions', { n: state.ascensions })}</small>
      </h2>
      <p>
        <img src={ICONS.laurelCrown} alt="" width="18" height="18" style={{ verticalAlign: '-3px' }} /> {t('gloria.glory')}{' '}
        <strong>{state.glory}</strong>{' '}
        <span className="muted">{t('gloria.bonus', { p: Math.round(state.glory * GLORY_BONUS * 100) })}</span>
      </p>
      <p className="muted">{canAscend ? t('gloria.ready', { n: formatNumber(gain) }) : t('gloria.notReady')}</p>
      <button className="btn" disabled={!canAscend} onClick={handleAscend}>
        {t('gloria.button')}
      </button>
    </section>
  )
}
