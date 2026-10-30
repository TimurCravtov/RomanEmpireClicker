import { RANKS } from '../game/data.js'
import { useI18n } from '../i18n/index.jsx'

export function rankFor(lifetime) {
  return [...RANKS].reverse().find((r) => lifetime >= r.at) ?? RANKS[0]
}

export default function Header({ lifetime, ascensions }) {
  const i18n = useI18n()
  return (
    <header className="header">
      <h1>Imperium Clicker</h1>
      <p className="header__sub">
        {i18n.t('header.sub', { rank: i18n.rank(rankFor(lifetime)), dynasty: i18n.dynasty(ascensions) })}
      </p>
    </header>
  )
}
