import { ACHIEVEMENTS } from '../game/data.js'
import '../styles/achievements.css'

export default function Achievements({ unlocked }) {
  return (
    <section className="panel">
      <h2 className="panel__title">
        Triumphs{' '}
        <small>
          {unlocked.length} / {ACHIEVEMENTS.length}
        </small>
      </h2>
      <div className="achievements">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.includes(a.id)
          return done ? (
            <div key={a.id} className="achievement" title={`${a.name}: ${a.desc}`}>
              <img src={a.icon} alt={a.name} />
            </div>
          ) : (
            <div key={a.id} className="achievement achievement--locked" title={a.desc}>
              ?
            </div>
          )
        })}
      </div>
    </section>
  )
}
