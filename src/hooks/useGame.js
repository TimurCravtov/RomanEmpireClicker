import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { sfx } from '../audio/sfx.js'
import { applyOffline, computeStats, createInitialState, omenPayout, pendingChapter, reducer } from '../game/engine.js'
import { OMEN_BASE_INTERVAL_S, OMEN_LIFETIME_S, pickOmen } from '../game/omens.js'
import { clearSave, loadGame, saveGame } from '../game/save.js'
import { CHAPTERS_BY_ID } from '../game/story.js'

const TICK_MS = 100
const AUTOSAVE_MS = 5000
const MAX_TOASTS = 4

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
  const [toasts, setToasts] = useState([])
  const [omen, setOmen] = useState(null)
  const [readingId, setReadingId] = useState(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const stats = useMemo(
    () => computeStats(state),
    [state.owned, state.upgrades, state.glory, state.chapters, state.choices, state.buffs],
  )
  const omenRateRef = useRef(stats.omenRate)
  omenRateRef.current = stats.omenRate

  const pushToast = useCallback((toast) => {
    setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { key: `${Date.now()}-${Math.random()}`, ...toast }])
  }, [])
  const dismissToast = useCallback((key) => setToasts((list) => list.filter((t) => t.key !== key)), [])

  // game loop: advance by real elapsed time so background throttling doesn't lose income
  useEffect(() => {
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 60)
      last = now
      dispatch({ type: 'TICK', dt, now: Date.now() })
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

  // omens drift onto the screen every so often and vanish if not caught
  useEffect(() => {
    let timer
    const schedule = () => {
      const mean = OMEN_BASE_INTERVAL_S / omenRateRef.current
      timer = setTimeout(
        () => {
          setOmen({ key: Date.now(), x: 8 + Math.random() * 80, y: 18 + Math.random() * 62 })
          timer = setTimeout(() => {
            setOmen(null)
            schedule()
          }, OMEN_LIFETIME_S * 1000)
        },
        mean * (0.5 + Math.random()) * 1000,
      )
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  // toasts carry ids, not text, so they render in whatever language is active
  const seenAchievements = useRef(new Set(state.achievements))
  useEffect(() => {
    const fresh = state.achievements.filter((id) => !seenAchievements.current.has(id))
    for (const id of fresh) {
      seenAchievements.current.add(id)
      pushToast({ kind: 'achievement', id })
    }
  }, [state.achievements, pushToast])

  // chapters already read in an earlier reign come back as a toast, not a full story card
  const knownChapters = useRef(new Set(state.chapters))
  useEffect(() => {
    knownChapters.current = new Set(stateRef.current.chapters)
  }, [state.ascensions])
  useEffect(() => {
    const fresh = state.chapters.filter((id) => !knownChapters.current.has(id))
    for (const id of fresh) {
      knownChapters.current.add(id)
      const chapter = CHAPTERS_BY_ID[id]
      if (!state.chronicleSeen.includes(id) || chapter.choices) continue
      pushToast({ kind: 'chapter', id })
    }
  }, [state.chapters, state.chronicleSeen, pushToast])

  const claimOmen = useCallback(() => {
    const picked = pickOmen()
    const gain = picked.kind === 'instant' ? omenPayout(stateRef.current, picked) : 0
    dispatch({ type: 'CLAIM_OMEN', omenId: picked.id, now: Date.now() })
    setOmen(null)
    sfx.omen()
    pushToast({ kind: 'omen', id: picked.id, gain })
  }, [pushToast])

  const actions = useMemo(
    () => ({
      click: () => dispatch({ type: 'CLICK' }),
      buyBuilding: (id, qty) => dispatch({ type: 'BUY_BUILDING', id, qty }),
      buyUpgrade: (id) => dispatch({ type: 'BUY_UPGRADE', id }),
      ascend: () => dispatch({ type: 'ASCEND' }),
      markSeen: (chapterId) => dispatch({ type: 'MARK_SEEN', chapterId }),
      choose: (chapterId, choiceId) => {
        dispatch({ type: 'CHOOSE', chapterId, choiceId })
        // keep the card open to reveal what history records
        setReadingId(chapterId)
      },
      readChapter: (chapterId) => setReadingId(chapterId),
      closeReading: () => setReadingId(null),
      dismissWelcome: () => setWelcomeBack(null),
      reset: () => {
        clearSave()
        seenAchievements.current = new Set()
        knownChapters.current = new Set()
        setReadingId(null)
        dispatch({ type: 'RESET' })
      },
    }),
    [],
  )

  // what the story card shows: a chapter the player chose to reread, else the next unread one
  const pending = pendingChapter(state)
  let story = null
  if (!welcomeBack) {
    if (readingId) story = { chapter: CHAPTERS_BY_ID[readingId], mode: 'read' }
    else if (pending) story = { chapter: pending, mode: 'new' }
  }

  return { state, stats, actions, toasts, dismissToast, welcomeBack, omen, claimOmen, story }
}
