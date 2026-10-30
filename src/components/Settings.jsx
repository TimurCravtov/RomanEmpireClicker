import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LANGUAGES, useI18n } from '../i18n/index.jsx'
import { useSettings } from '../settings.jsx'
import '../styles/settings.css'

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
        transform="translate(-1 0)"
      />
    </svg>
  )
}

function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9z" />
      {muted ? (
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m16 9 5 6m0-6-5 6" />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
        />
      )}
    </svg>
  )
}

function SettingsDialog({ onClose }) {
  const { t } = useI18n()
  const { settings, update } = useSettings()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title">{t('settings.title')}</h2>

        <fieldset className="settings__group">
          <legend>{t('settings.language')}</legend>
          <div className="settings__langs">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                lang={l.code}
                aria-pressed={settings.lang === l.code}
                onClick={() => update({ lang: l.code })}
              >
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="settings__group">
          <legend>{t('settings.sound')}</legend>
          {[
            ['music', t('settings.music')],
            ['sfx', t('settings.effects')],
          ].map(([key, label]) => (
            <div key={key} className="settings__row">
              <span>{label}</span>
              <button
                className="settings__toggle"
                aria-pressed={settings[key]}
                aria-label={label}
                onClick={() => update({ [key]: !settings[key] })}
              >
                <SpeakerIcon muted={!settings[key]} />
                {settings[key] ? t('settings.on') : t('settings.off')}
              </button>
            </div>
          ))}
          <label className="settings__volume">
            <span>{t('settings.volume')}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              disabled={!settings.music && !settings.sfx}
              onChange={(e) => update({ volume: Number(e.target.value) })}
            />
          </label>
          <p className="settings__note muted">{t('settings.musicNote')}</p>
        </fieldset>

        <button className="btn" onClick={onClose} autoFocus>
          {t('settings.close')}
        </button>
      </div>
    </div>
  )
}

export default function SettingsButtons() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hud-buttons">
        <button className="hud-button" onClick={() => setOpen(true)} aria-label={t('settings.open')} title={t('settings.open')}>
          <GearIcon />
        </button>
      </div>
      {/* portal out of the HUD: it ignores the pointer (so drags reach the city),
          and the dialog would inherit that and let clicks fall through */}
      {open && createPortal(<SettingsDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}
