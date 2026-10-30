import { RANKS } from '../game/data.js'

export function rankFor(lifetime) {
  return [...RANKS].reverse().find((r) => lifetime >= r.at) ?? RANKS[0]
}

export default function Header({ lifetime }) {
  const rank = rankFor(lifetime)
  return (
    <header className="header">
      <h1>Imperium Clicker</h1>
      <p className="header__sub">SPQR · {rank.title}</p>
    </header>
  )
}
