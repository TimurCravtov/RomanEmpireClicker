import { sfx } from '../audio/sfx.js'
import { UPGRADES } from '../game/data.js'
import { isUpgradeVisible } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/shop.css'

export default function Upgrades({ state, onBuy }) {
  const i18n = useI18n()
  const { t } = i18n
  const available = UPGRADES.filter((u) => isUpgradeVisible(state, u)).sort((a, b) => a.cost - b.cost)

  return (
    <section className="panel edicts">
      <h2 className="panel__title">
        {t('edicts.title')} <small>{t('edicts.enacted', { n: state.upgrades.length })}</small>
      </h2>
      {available.length === 0 ? (
        <p className="empty muted">{t('edicts.none')}</p>
      ) : (
        <ul className="list upgrade-list">
          {available.slice(0, 8).map((u) => {
            const { name, desc } = i18n.upgrade(u)
            return (
              <li key={u.id}>
                <button
                  className="item"
                  disabled={u.cost > state.denarii}
                  onClick={() => {
                    sfx.edict()
                    onBuy(u.id)
                  }}
                >
                  <img src={u.icon} alt="" />
                  <div>
                    <div className="item__name">{name}</div>
                    <div className="item__desc">{desc}</div>
                  </div>
                  <div className="item__meta item__cost">{formatNumber(u.cost)}</div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {available.length > 8 && <p className="empty muted">{t('edicts.more', { n: available.length - 8 })}</p>}
    </section>
  )
}
