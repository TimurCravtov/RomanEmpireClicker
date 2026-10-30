import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ACHIEVEMENTS } from '../game/data.js'
import { applyOffline, computeStats, createInitialState, reducer } from '../game/engine.js'
import { clearSave, loadGame, saveGame } from '../game/save.js'

const TICK_MS = 100
const AUTOSAVE_MS = 5000

function init() {
  const saved = loadGame()
  if (!saved) return { state: createInitialState(), welcomeBack: null }
  const { state, gained, elapsed } = applyOffline(saved)
  return { state, welcomeBack: gained > 0 ? { gained, elapsed } : null }
}

export function useGame() {
  const [boot] = useState(init)
  const [state, dispatch] = useReducer(reducer, boot.state)
  const [welcomeBack, setWelcomeBack] = useState(boot.welcomeBack)
  const [unlocked, setUnlocked] = useState([])
  const stateRef = useRef(state)
  stateRef.current = state

  // game loop: advance by real elapsed time so background throttling doesn't lose income
  useEffect(() => {
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 60)
      last = now
      dispatch({ type: 'TICK', dt })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // autosave
  useEffect(() => {
    const save = () => saveGame(stateRef.current)
    const id = setInterval(save, AUTOSAVE_MS)
    window.addEventListener('beforeunload', save)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', save)
    }
  }, [])

  // surface newly unlocked achievements as toasts
  const seen = useRef(new Set(state.achievements))
  useEffect(() => {
    const fresh = state.achievements.filter((id) => !seen.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => seen.current.add(id))
    setUnlocked((list) => [
      ...list,
      ...fresh.map((id) => ({ key: `${id}-${Date.now()}`, achievement: ACHIEVEMENTS.find((a) => a.id === id) })),
    ])
  }, [state.achievements])

  const stats = useMemo(() => computeStats(state), [state.owned, state.upgrades, state.glory])

  const dismissToast = useCallback((key) => setUnlocked((list) => list.filter((t) => t.key !== key)), [])
  const dismissWelcome = useCallback(() => setWelcomeBack(null), [])

  const actions = useMemo(
    () => ({
      click: () => dispatch({ type: 'CLICK' }),
      buyBuilding: (id, qty) => dispatch({ type: 'BUY_BUILDING', id, qty }),
      buyUpgrade: (id) => dispatch({ type: 'BUY_UPGRADE', id }),
      ascend: () => dispatch({ type: 'ASCEND' }),
      reset: () => {
        clearSave()
        seen.current = new Set()
        dispatch({ type: 'RESET' })
      },
    }),
    [],
  )

  return { state, stats, actions, toasts: unlocked, dismissToast, welcomeBack, dismissWelcome }
}
