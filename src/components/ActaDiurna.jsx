import { useEffect, useRef, useState } from 'react'
import { eligibleHeadlines } from '../game/acta.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/omens.css'

const ROTATE_MS = 10000
// headlines tied to the player's history are more likely than timeless ones
const CONTEXT_WEIGHT = 3

function pick(state, previous) {
  const pool = eligibleHeadlines(state).filter((h) => h !== previous)
  const weighted = pool.flatMap((h) => Array(h.when ? CONTEXT_WEIGHT : 1).fill(h))
  return weighted[Math.floor(Math.random() * weighted.length)] ?? previous
}

export default function ActaDiurna({ state }) {
  const i18n = useI18n()
  const stateRef = useRef(state)
  stateRef.current = state
  const [headline, setHeadline] = useState(() => pick(state, null))

  useEffect(() => {
    const id = setInterval(() => setHeadline((prev) => pick(stateRef.current, prev)), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="acta" aria-live="polite">
      <span className="acta__label">Acta Diurna</span>
      <span key={headline?.id} className="acta__text">
        {headline && i18n.headline(headline)}
      </span>
    </div>
  )
}
