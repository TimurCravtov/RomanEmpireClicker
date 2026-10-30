import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DICTIONARIES, I18nProvider } from './i18n/index.jsx'

// Player preferences live apart from the game save, so resetting a game
// never resets your language or volume.
const KEY = 'imperium-settings-v1'

function detectLanguage() {
  const preferred = (navigator.languages ?? [navigator.language ?? 'en']).map((l) => l.slice(0, 2).toLowerCase())
  return preferred.find((l) => l in DICTIONARIES) ?? 'en'
}

function load() {
  const defaults = { lang: detectLanguage(), music: true, sfx: true, volume: 0.5 }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return saved ? { ...defaults, ...saved } : defaults
  } catch {
    return defaults
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)
  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // storage unavailable: settings still apply for this visit
      }
      return next
    })
  }, [])
  const value = useMemo(() => ({ settings, update }), [settings, update])
  return (
    <SettingsContext.Provider value={value}>
      <I18nProvider lang={settings.lang}>{children}</I18nProvider>
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
