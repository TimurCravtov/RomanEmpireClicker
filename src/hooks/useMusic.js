import { useEffect } from 'react'
import { music } from '../audio/music.js'
import { useSettings } from '../settings.jsx'

// Keeps the score in step with the player's settings. Browsers block audio
// until the first interaction, so the engine is unlocked by the first tap or key.
export function useMusic() {
  const { settings } = useSettings()

  useEffect(() => music.setVolume(settings.volume), [settings.volume])
  useEffect(() => music.setEnabled(settings.music), [settings.music])

  useEffect(() => {
    const unlock = () => {
      music.unlock()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
}
