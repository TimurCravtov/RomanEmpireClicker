import { useEffect, useRef } from 'react'
import { sfx } from '../audio/sfx.js'
import { chapterEffects } from '../game/story.js'
import { useI18n } from '../i18n/index.jsx'
import LanguagePicker from './LanguagePicker.jsx'
import '../styles/story.css'

function Boons({ effects }) {
  const i18n = useI18n()
  if (effects.length === 0) return null
  return (
    <ul className="boons">
      {effects.map((e, i) => (
        <li key={i}>{i18n.effect(e)}</li>
      ))}
    </ul>
  )
}

export default function StoryModal({ chapter: source, mode, chosen, onChoose, onClose }) {
  const i18n = useI18n()
  const { t } = i18n
  const chapter = i18n.chapter(source)
  const awaitingChoice = Boolean(chapter.choices) && !chosen
  const canClose = !awaitingChoice

  // the rustle of parchment as the chapter unrolls (once, even under StrictMode)
  const rustled = useRef(false)
  useEffect(() => {
    if (rustled.current) return
    rustled.current = true
    sfx.paper()
  }, [])

  useEffect(() => {
    if (!canClose) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canClose, onClose])

  return (
    <div className="modal-backdrop" onClick={canClose ? onClose : undefined}>
      <article
        className="scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        onClick={(e) => e.stopPropagation()}
      >
        <LanguagePicker className="scroll__langs" />
        {canClose && (
          <button className="scroll__close" onClick={onClose} aria-label={t('story.close')}>
            ×
          </button>
        )}
        <header className="scroll__head">
          <img src={chapter.icon} alt="" />
          <div className="scroll__kicker">
            {t('chronicle.chapter', { n: chapter.numeral })} · {chapter.year}
          </div>
          <h2 id="story-title">{chapter.title}</h2>
          <p className="scroll__motto">{chapter.motto}</p>
        </header>

        <div className="scroll__body">
          {chapter.text.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {awaitingChoice && (
          <div className="choices">
            {chapter.choices.map((c, i) => (
              <button key={c.id} className="choice" onClick={() => onChoose(c.id)} autoFocus={i === 0}>
                <span className="choice__label">{c.label}</span>
                <span className="choice__desc">{c.desc}</span>
                <Boons effects={c.effects} />
              </button>
            ))}
          </div>
        )}

        {chapter.choices && chosen && (
          <div className="outcome">
            <div className="boon-box">
              <div className="boon-box__title">
                {t('story.decision')} <em>{chapter.choices.find((c) => c.id === chosen).label}</em>
              </div>
              <Boons effects={chapterEffects(chapter, chosen)} />
            </div>
            <div className="history">
              <div className="history__title">{t('story.history')}</div>
              {chapter.choices.map((c) => (
                <p key={c.id}>
                  <strong>{c.label}.</strong> {c.note}
                </p>
              ))}
            </div>
          </div>
        )}

        {!chapter.choices && chapter.effects.length > 0 && (
          <div className="boon-box">
            <div className="boon-box__title">{t('story.boon')}</div>
            <Boons effects={chapter.effects} />
          </div>
        )}

        {chapter.choices && !chosen && mode === 'read' && <p className="scroll__note">{t('story.awaits')}</p>}

        {canClose && (
          <div className="scroll__actions">
            <button className="btn" onClick={onClose} autoFocus>
              {mode === 'new' ? t('story.continue') : t('story.close')}
            </button>
          </div>
        )}
      </article>
    </div>
  )
}
