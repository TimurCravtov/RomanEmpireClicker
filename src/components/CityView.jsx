import { lazy, useEffect, useMemo, useState } from 'react'
import { formatNumber } from '../game/format.js'
import { CHAPTERS_BY_ID } from '../game/story.js'
import { useI18n } from '../i18n/index.jsx'
import Scene3D from './Scene3D.jsx'
import '../styles/city.css'

const CityScene = lazy(() => import('../three/CityScene.jsx'))

const HUD_BREAKPOINT = '(min-width: 900px)'
const HUD_TOP = 110 // title + gazette

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

// How much of the screen the HUD covers, read from the same CSS variables the
// layout uses, so the camera can frame Rome in the open space between panels.
function measureFrame() {
  if (!window.matchMedia(HUD_BREAKPOINT).matches) return { left: 0, right: 0, top: 0 }
  const css = getComputedStyle(document.documentElement)
  const px = (name) => parseFloat(css.getPropertyValue(name)) || 0
  const gap = px('--hud-gap')
  return { left: px('--hud-left') + gap * 2, right: px('--hud-right') + gap * 2, top: HUD_TOP }
}

function useHudFrame() {
  const [frame, setFrame] = useState(measureFrame)
  useEffect(() => {
    const update = () =>
      setFrame((prev) => {
        const next = measureFrame()
        return next.left === prev.left && next.right === prev.right && next.top === prev.top ? prev : next
      })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return frame
}

export default function CityView({ owned, chapters }) {
  const { t, year } = useI18n()
  const frame = useHudFrame()
  const chapter = CHAPTERS_BY_ID[chapters[chapters.length - 1]]
  const population = useMemo(
    () => 300 + Object.entries(owned).reduce((sum, [id, n]) => sum + (POPULATION[id] ?? 0) * n, 0),
    [owned],
  )

  return (
    <section className="city" aria-label={t('city.aria')}>
      <div className="city__canvas">
        <Scene3D>
          <CityScene owned={owned} chapters={chapters} frame={frame} />
        </Scene3D>
      </div>
      <div className="city__caption">
        <div className="city__name">{t('city.name')}</div>
        <div className="city__meta">
          {t('city.meta', { year: year(chapter.year), n: formatNumber(population) })}
        </div>
      </div>
      <div className="city__hint">{t('city.hint')}</div>
    </section>
  )
}
