import { createInitialState } from './engine.js'

const SAVE_KEY = 'imperium-clicker-save-v1'

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // storage may be full or unavailable (private mode); the game keeps running
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    // merge over defaults so saves from older versions gain any new fields
    return { ...createInitialState(), ...JSON.parse(raw) }
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
