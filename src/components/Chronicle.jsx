import { nextChapter } from '../game/engine.js'
import { formatNumber } from '../game/format.js'
import { CHAPTERS, CHAPTERS_BY_ID, chapterEffects } from '../game/story.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/story.css'

export default function Chronicle({ state, onRead }) {
  const i18n = useI18n()
  const { t } = i18n
  const current = i18n.chapter(CHAPTERS_BY_ID[state.chapters[state.chapters.length - 1]])
  const next = nextChapter(state)
  const progress = next ? Math.min((state.runEarned - current.at) / (next.at - current.at), 1) : 1
  const boons = state.chapters.flatMap((id) => chapterEffects(CHAPTERS_BY_ID[id], state.choices[id]))

  return (
    <section className="panel chronicle">
      <h2 className="panel__title">
        {t('chronicle.title')} <small>{t('chronicle.count', { a: state.chapters.length, b: CHAPTERS.length })}</small>
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
            <span>{t('chronicle.next', { n: next.numeral })}</span>
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
            aria-label={t('chronicle.progressAria')}
          >
            <div className="bar__fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : (
        <p className="chronicle__end muted">{t('chronicle.complete')}</p>
      )}

      <div className="timeline" aria-label={t('chronicle.chaptersAria')}>
        {CHAPTERS.map((c) => {
          const reached = state.chapters.includes(c.id)
          const local = reached ? i18n.chapter(c) : null
          return (
            <button
              key={c.id}
              className={`timeline__dot${reached ? ' timeline__dot--reached' : ''}`}
              disabled={!reached}
              onClick={() => onRead(c.id)}
              title={reached ? `${c.numeral}. ${local.title} (${local.year})` : t('chronicle.unwritten')}
            >
              {c.numeral}
            </button>
          )
        })}
      </div>

      {boons.length > 0 && (
        <details className="chronicle__boons">
          <summary>{t('chronicle.boons', { n: boons.length })}</summary>
          <ul className="boons">
            {boons.map((e, i) => (
              <li key={i}>{i18n.effect(e)}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
