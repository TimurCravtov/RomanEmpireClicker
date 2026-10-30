import { useState } from 'react'
import { BUILDINGS } from '../game/data.js'
import { buildingCost, maxAffordable } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import '../styles/shop.css'

const QUANTITIES = [1, 10, 100, 'max']

export default function Shop({ denarii, owned, perBuilding, onBuy }) {
  const [qty, setQty] = useState(1)

  // only reveal a building once the player is within reach of the previous tier
  const lastRevealed = BUILDINGS.reduce((last, b, i) => {
    const seen = (owned[b.id] ?? 0) > 0 || denarii >= b.baseCost * 0.5
    return seen ? i : last
  }, 0)
  const visible = BUILDINGS.slice(0, Math.min(lastRevealed + 2, BUILDINGS.length))

  return (
    <section className="panel">
      <h2 className="panel__title">Imperial Works</h2>
      <div className="qty" role="group" aria-label="Purchase quantity">
        {QUANTITIES.map((q) => (
          <button key={q} aria-pressed={qty === q} onClick={() => setQty(q)}>
            {q === 'max' ? 'Max' : `×${q}`}
          </button>
        ))}
      </div>

      <ul className="list">
        {visible.map((b, i) => {
          const count = owned[b.id] ?? 0
          const n = qty === 'max' ? Math.max(maxAffordable(b, count, denarii), 1) : qty
          const cost = buildingCost(b, count, n)
          const hidden = i > lastRevealed
          return (
            <li key={b.id}>
              <button
                className={`item${hidden ? ' item--locked' : ''}`}
                disabled={hidden || cost > denarii}
                onClick={() => onBuy(b.id, qty)}
                title={b.blurb}
              >
                <img src={b.icon} alt="" />
                <div>
                  <div className="item__name">{hidden ? '???' : b.name}</div>
                  <div className="item__desc">
                    {hidden ? 'Not yet discovered' : count > 0 ? `${formatNumber(perBuilding[b.id])} denarii/s` : `+${formatNumber(b.cps)} denarii/s each`}
                  </div>
                </div>
                <div className="item__meta">
                  <div className="item__owned">{count}</div>
                  <div className="item__cost">
                    {n > 1 ? `${n} for ` : ''}
                    {formatNumber(cost)}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
