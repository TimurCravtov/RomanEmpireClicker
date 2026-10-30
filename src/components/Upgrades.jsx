import { UPGRADES } from '../game/data.js'
import { isUpgradeVisible } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import '../styles/shop.css'

export default function Upgrades({ state, onBuy }) {
  const available = UPGRADES.filter((u) => isUpgradeVisible(state, u)).sort((a, b) => a.cost - b.cost)

  return (
    <section className="panel edicts">
      <h2 className="panel__title">
        Edicts <small>{state.upgrades.length} enacted</small>
      </h2>
      {available.length === 0 ? (
        <p className="empty muted">No edicts available. Build more to unlock them.</p>
      ) : (
        <ul className="list upgrade-list">
          {available.slice(0, 8).map((u) => (
            <li key={u.id}>
              <button className="item" disabled={u.cost > state.denarii} onClick={() => onBuy(u.id)}>
                <img src={u.icon} alt="" />
                <div>
                  <div className="item__name">{u.name}</div>
                  <div className="item__desc">{u.desc}</div>
                </div>
                <div className="item__meta item__cost">{formatNumber(u.cost)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 8 && <p className="empty muted">+{available.length - 8} more edicts waiting…</p>}
    </section>
  )
}
