import { describeEffect } from '../game/effects.js'
import { nextChapter } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import { CHAPTERS, CHAPTERS_BY_ID, chapterEffects } from '../game/story.js'
import '../styles/story.css'

export default function Chronicle({ state, onRead }) {
  const current = CHAPTERS_BY_ID[state.chapters[state.chapters.length - 1]]
  const next = nextChapter(state)
  const progress = next ? Math.min((state.runEarned - current.at) / (next.at - current.at), 1) : 1
  const boons = state.chapters.flatMap((id) => chapterEffects(CHAPTERS_BY_ID[id], state.choices[id]))

  return (
    <section className="panel chronicle">
      <h2 className="panel__title">
        Chronicle{' '}
        <small>
          {state.chapters.length} / {CHAPTERS.length} chapters
        </small>
      </h2>

      <button className="chronicle__current" onClick={() => onRead(current.id)}>
        <img src={current.icon} alt="" />
        <div>
          <div className="chronicle__kicker">
            {current.numeral} · {current.year}
          </div>
          <div className="chronicle__title">{current.title}</div>
          <div className="chronicle__motto">{current.motto}</div>
        </div>
      </button>

      {next ? (
        <div className="chronicle__next">
          <div className="chronicle__next-label">
            <span>Next: Chapter {next.numeral}</span>
            <span>
              {formatNumber(state.runEarned)} / {formatNumber(next.at)}
            </span>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Progress to the next chapter"
          >
            <div className="bar__fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : (
        <p className="chronicle__end muted">The chronicle is complete. Ascend, and let Rome rise again.</p>
      )}

      <div className="timeline" aria-label="Chapters">
        {CHAPTERS.map((c) => {
          const reached = state.chapters.includes(c.id)
          return (
            <button
              key={c.id}
              className={`timeline__dot${reached ? ' timeline__dot--reached' : ''}`}
              disabled={!reached}
              onClick={() => onRead(c.id)}
              title={reached ? `${c.numeral}. ${c.title} (${c.year})` : 'Not yet written'}
            >
              {c.numeral}
            </button>
          )
        })}
      </div>

      {boons.length > 0 && (
        <details className="chronicle__boons">
          <summary>Boons of this reign ({boons.length})</summary>
          <ul className="boons">
            {boons.map((e, i) => (
              <li key={i}>{describeEffect(e)}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
