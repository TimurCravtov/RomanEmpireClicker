import { BUILDINGS_BY_ID } from './data.js'

function percent(mult) {
  const pct = Math.round((mult - 1) * 100)
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`
}

export function describeEffect(effect) {
  switch (effect.type) {
    case 'building':
      return `${BUILDINGS_BY_ID[effect.building].name} output ×${effect.mult}`
    case 'global':
      return `All production ${percent(effect.mult)}`
    case 'click':
      return `Denarii per click ×${effect.mult}`
    case 'omenRate':
      return `Omens appear ${effect.mult === 2 ? 'twice' : `${effect.mult}×`} as often`
    default:
      return ''
  }
}
