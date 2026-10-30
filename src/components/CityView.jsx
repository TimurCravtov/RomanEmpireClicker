import { lazy, useMemo } from 'react'
import { formatNumber } from '../game/format.js'
import { CHAPTERS_BY_ID } from '../game/story.js'
import Scene3D from './Scene3D.jsx'
import '../styles/city.css'

const CityScene = lazy(() => import('../three/CityScene.jsx'))

// rough souls per building, purely for flavor
const POPULATION = {
  farm: 25,
  colonus: 180,
  amphora: 60,
  aqueduct: 900,
  century: 80,
  barracks: 480,
  trireme: 170,
  ballista: 20,
  temple: 350,
  forum: 2500,
  senate: 6000,
}

export default function CityView({ owned, chapters }) {
  const chapter = CHAPTERS_BY_ID[chapters[chapters.length - 1]]
  const population = useMemo(
    () => 300 + Object.entries(owned).reduce((sum, [id, n]) => sum + (POPULATION[id] ?? 0) * n, 0),
    [owned],
  )

  return (
    <section className="city" aria-label="Your Rome, rendered in 3D">
      <div className="city__canvas">
        <Scene3D>
          <CityScene owned={owned} chapters={chapters} />
        </Scene3D>
      </div>
      <div className="city__caption">
        <div className="city__name">Roma</div>
        <div className="city__meta">
          {chapter.year} · {formatNumber(population)} souls
        </div>
      </div>
      <div className="city__hint">Drag to look around</div>
    </section>
  )
}
