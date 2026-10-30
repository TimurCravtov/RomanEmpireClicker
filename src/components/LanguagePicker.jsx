import { LANGUAGES, useI18n } from '../i18n/index.jsx'
import { useSettings } from '../settings.jsx'

// A compact row of language codes, for places where the full settings dialog
// would be a detour (such as mid-story).
export default function LanguagePicker({ className = '' }) {
  const { t } = useI18n()
  const { settings, update } = useSettings()
  return (
    <div className={`lang-picker ${className}`} role="group" aria-label={t('settings.language')}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          lang={l.code}
          aria-pressed={settings.lang === l.code}
          aria-label={l.label}
          title={l.label}
          onClick={() => update({ lang: l.code })}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
