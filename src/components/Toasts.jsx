import { useEffect } from 'react'
import { ACHIEVEMENTS } from '../game/data.js'
import { formatNumber } from '../game/format.js'
import { OMENS_BY_ID } from '../game/omens.js'
import { CHAPTERS_BY_ID, chapterEffects } from '../game/story.js'
import { useI18n } from '../i18n/index.jsx'
import '../styles/achievements.css'

const TOAST_MS = 5000

// Toasts are stored as { kind, id } so they speak the current language.
function describe(toast, i18n) {
  const { t } = i18n
  switch (toast.kind) {
    case 'achievement': {
      const a = ACHIEVEMENTS.find((x) => x.id === toast.id)
      const { name, desc } = i18n.achievement(a)
      return { label: t('toast.triumph'), icon: a.icon, title: name, desc }
    }
    case 'chapter': {
      const source = CHAPTERS_BY_ID[toast.id]
      const chapter = i18n.chapter(source)
      const boons = chapterEffects(source).map(i18n.effect).join(' · ')
      return {
        label: `${t('chronicle.chapter', { n: chapter.numeral })} · ${chapter.year}`,
        icon: chapter.icon,
        title: chapter.title,
        desc: boons || chapter.motto,
      }
    }
    default: {
      const omen = OMENS_BY_ID[toast.id]
      const { name, text } = i18n.omen(omen)
      const desc = toast.gain > 0 ? `${text} ${t('toast.gain', { n: formatNumber(toast.gain) })}` : text
      return { label: t('toast.omen'), icon: omen.icon, title: name, desc }
    }
  }
}

function Toast({ toast, onDismiss }) {
  const i18n = useI18n()
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.key), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast.key, onDismiss])

  const { label, icon, title, desc } = describe(toast, i18n)
  return (
    <div className="toast" role="status" onClick={() => onDismiss(toast.key)}>
      <img src={icon} alt="" />
      <div>
        <div className="toast__label">{label}</div>
        <div className="toast__title">{title}</div>
        <div className="toast__desc">{desc}</div>
      </div>
    </div>
  )
}

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <Toast key={t.key} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
