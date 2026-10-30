import { ACHIEVEMENTS } from '../game/data.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/achievements.css'

export default function Achievements({ unlocked }) {
  const i18n = useI18n()
  return (
    <section className="panel triumphs">
      <h2 className="panel__title">
        {i18n.t('triumphs.title')}{' '}
        <small>
          {unlocked.length} / {ACHIEVEMENTS.length}
        </small>
      </h2>
      <div className="achievements">
        {ACHIEVEMENTS.map((a) => {
          const { name, desc } = i18n.achievement(a)
          return unlocked.includes(a.id) ? (
            <div key={a.id} className="achievement" title={`${name}: ${desc}`}>
              <img src={a.icon} alt={name} />
            </div>
          ) : (
            <div key={a.id} className="achievement achievement--locked" title={desc}>
              ?
            </div>
          )
        })}
      </div>
    </section>
  )
}
