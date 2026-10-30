import { useState } from 'react'
import { BUILDINGS } from '../game/data.js'
import { buildingCost, maxAffordable } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/shop.css'

const QUANTITIES = [1, 10, 100, 'max']

export default function Shop({ denarii, owned, perBuilding, onBuy }) {
  const i18n = useI18n()
  const { t } = i18n
  const [qty, setQty] = useState(1)

  // only reveal a building once the player is within reach of the previous tier
  const lastRevealed = BUILDINGS.reduce((last, b, i) => {
    const seen = (owned[b.id] ?? 0) > 0 || denarii >= b.baseCost * 0.5
    return seen ? i : last
  }, 0)
  const visible = BUILDINGS.slice(0, Math.min(lastRevealed + 2, BUILDINGS.length))

  return (
    <section className="panel shop">
      <h2 className="panel__title">{t('shop.title')}</h2>
      <div className="qty" role="group" aria-label={t('shop.qtyAria')}>
        {QUANTITIES.map((q) => (
          <button key={q} aria-pressed={qty === q} onClick={() => setQty(q)}>
            {q === 'max' ? t('shop.max') : `×${q}`}
          </button>
        ))}
      </div>

      <ul className="list">
        {visible.map((b, i) => {
          const count = owned[b.id] ?? 0
          const n = qty === 'max' ? Math.max(maxAffordable(b, count, denarii), 1) : qty
          const cost = buildingCost(b, count, n)
          const hidden = i > lastRevealed
          const { name, blurb } = i18n.building(b)
          return (
            <li key={b.id}>
              <button
                className={`item${hidden ? ' item--locked' : ''}`}
                disabled={hidden || cost > denarii}
                onClick={() => onBuy(b.id, qty)}
                title={hidden ? undefined : blurb}
              >
                <img src={b.icon} alt="" />
                <div>
                  <div className="item__name">{hidden ? t('shop.unknown') : name}</div>
                  <div className="item__desc">
                    {hidden
                      ? t('shop.undiscovered')
                      : count > 0
                        ? t('shop.rate', { n: formatNumber(perBuilding[b.id]) })
                        : t('shop.each', { n: formatNumber(b.cps) })}
                  </div>
                </div>
                <div className="item__meta">
                  <div className="item__owned">{count}</div>
                  <div className="item__cost">{n > 1 ? t('shop.bulk', { n, cost: formatNumber(cost) }) : formatNumber(cost)}</div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
