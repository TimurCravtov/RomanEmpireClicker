import { useRef, useState } from 'react'
import { ICONS } from '../game/data.js'
import { formatNumber } from '../game/format.js'
import '../styles/click-area.css'

const FLOATER_LIFETIME_MS = 900

export default function ClickArea({ denarii, perClick, perSecond, onClick }) {
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

      <button className="eagle" onClick={handleClick} aria-label={`Click the eagle to collect ${formatNumber(perClick)} denarii`}>
        <img src={ICONS.eagle} alt="" draggable="false" />
      </button>
      <div className="click-area__hint muted">+{formatNumber(perClick)} per click</div>

      {floaters.map((f) => (
        <span key={f.id} className="floater" style={{ left: f.x, top: f.y }}>
          +{formatNumber(f.value)}
        </span>
      ))}
    </section>
  )
}
