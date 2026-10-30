import { lazy, useRef, useState } from 'react'
import { ICONS } from '../game/data.js'
import { formatNumber } from '../game/format.js'
import { OMENS_BY_ID } from '../game/omens.js'
import Scene3D from './Scene3D.jsx'
import '../styles/omens.css'
import '../styles/click-area.css'

const CoinScene = lazy(() => import('../three/CoinScene.jsx'))
const FLOATER_LIFETIME_MS = 900

export default function ClickArea({ denarii, perClick, perSecond, clicks, buffs, onClick }) {
  const areaRef = useRef(null)
  const nextId = useRef(0)
  const [floaters, setFloaters] = useState([])

  function handleClick(e) {
    onClick()

    const rect = areaRef.current.getBoundingClientRect()
    // keyboard activation reports 0,0 — spawn from the button's center instead
    const keyboard = e.detail === 0
    const target = e.currentTarget.getBoundingClientRect()
    const x = keyboard ? target.left + target.width / 2 - rect.left : e.clientX - rect.left
    const y = keyboard ? target.top + target.height / 2 - rect.top : e.clientY - rect.top

    const id = nextId.current++
    setFloaters((list) => [...list.slice(-12), { id, x, y, value: perClick }])
    setTimeout(() => setFloaters((list) => list.filter((f) => f.id !== id)), FLOATER_LIFETIME_MS)
  }

  return (
    <section className="panel click-area" ref={areaRef}>
      <div className="counter__label">Denarii in the treasury</div>
      <div className="counter__value" aria-live="off">
        {formatNumber(denarii)}
      </div>
      <div className="counter__rate">
        <img src={ICONS.coins} alt="" width="16" height="16" style={{ verticalAlign: '-2px' }} /> {formatNumber(perSecond)} per second
      </div>

      <div className="coin-stage">
        <button className="eagle" onClick={handleClick} aria-label={`Strike the denarius to collect ${formatNumber(perClick)} denarii`} />
        <div className="coin-stage__canvas" aria-hidden="true">
          <Scene3D fallback={<img className="coin-fallback" src={ICONS.eagle} alt="" draggable="false" />}>
            <CoinScene pulse={clicks} />
          </Scene3D>
        </div>
      </div>
      <div className="click-area__hint muted">+{formatNumber(perClick)} per click</div>

      {buffs.length > 0 && (
        <div className="buffs">
          {buffs.map((b) => {
            const omen = OMENS_BY_ID[b.id]
            const left = Math.max(Math.ceil((b.until - Date.now()) / 1000), 0)
            return (
              <span key={b.id} className="buff" title={omen.text}>
                <img src={omen.icon} alt="" />
                {omen.name}: {b.target === 'click' ? 'clicks' : 'production'} ×{b.mult} · {left}s
              </span>
            )
          })}
        </div>
      )}

      {floaters.map((f) => (
        <span key={f.id} className="floater" style={{ left: f.x, top: f.y }}>
          +{formatNumber(f.value)}
        </span>
      ))}
    </section>
  )
}
