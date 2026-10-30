import { useEffect } from 'react'
import { music } from '../audio/music.js'
import { sfx } from '../audio/sfx.js'
import { useSettings } from '../settings.jsx'

// Keeps the score and the interface sounds in step with the player's settings.
// Browsers block audio until an interaction, so the first tap or key unlocks it.
export function useAudio() {
  const { settings } = useSettings()

  useEffect(() => {
    music.setVolume(settings.volume)
    sfx.setVolume(settings.volume)
  }, [settings.volume])
  useEffect(() => music.setEnabled(settings.music), [settings.music])
  useEffect(() => sfx.setEnabled(settings.sfx), [settings.sfx])

  useEffect(() => {
    // capture phase: unlock before the click that triggered it plays its sound
    const unlock = () => {
      music.unlock()
      sfx.unlock()
    }
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])
}
