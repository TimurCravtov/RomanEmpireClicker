import { ACHIEVEMENTS, BUILDINGS, BUILDINGS_BY_ID, COST_GROWTH, UPGRADES, UPGRADES_BY_ID } from './data.js'
import { OMENS_BY_ID } from './omens.js'
import { CHAPTERS, CHAPTERS_BY_ID, chapterEffects } from './story.js'

export const GLORY_BONUS = 0.05
export const CLICK_CPS_SHARE = 0.02
export const OFFLINE_CAP_SECONDS = 4 * 3600
export const OFFLINE_EFFICIENCY = 0.5
export const ASCEND_MIN_GAIN = 1

export function createInitialState() {
  return withChapters({
    denarii: 0,
    lifetime: 0, // earned across every run, drives ranks and achievements
    runEarned: 0, // earned this run, drives glory and the chronicle
    clicks: 0,
    owned: {},
    upgrades: [],
    achievements: [],
    glory: 0,
    ascensions: 0,
    chapters: [], // chronicle chapters reached this reign
    choices: {}, // chapterId -> choiceId for this reign
    chronicleSeen: [], // chapters the player has read, kept across reigns
    buffs: [], // active omen buffs: { id, target, mult, until }
    omensClaimed: 0,
    savedAt: Date.now(),
  })
}

// --- costs ---------------------------------------------------------------

export function buildingCost(building, owned, qty = 1) {
  const first = building.baseCost * COST_GROWTH ** owned
  return Math.ceil((first * (COST_GROWTH ** qty - 1)) / (COST_GROWTH - 1))
}

export function maxAffordable(building, owned, denarii) {
  const first = building.baseCost * COST_GROWTH ** owned
  const n = Math.floor(Math.log(1 + (denarii * (COST_GROWTH - 1)) / first) / Math.log(COST_GROWTH))
  // guard against floating point drift at the boundary
  return n > 0 && buildingCost(building, owned, n) > denarii ? n - 1 : Math.max(n, 0)
}

// --- derived stats -------------------------------------------------------

export function gloryMultiplier(glory) {
  return 1 + glory * GLORY_BONUS
}

function activeEffects(state) {
  const effects = []
  for (const u of state.upgrades) {
    const upgrade = UPGRADES_BY_ID[u]
    if (!upgrade) continue
    if (upgrade.kind === 'global') effects.push({ type: 'global', mult: upgrade.global })
    else if (upgrade.kind === 'click') effects.push({ type: 'click', mult: upgrade.mult })
    else effects.push({ type: 'building', building: upgrade.building, mult: upgrade.mult })
  }
  for (const id of state.chapters) {
    const chapter = CHAPTERS_BY_ID[id]
    if (chapter) effects.push(...chapterEffects(chapter, state.choices[id]))
  }
  return effects
}

export function computeStats(state) {
  let globalMult = gloryMultiplier(state.glory)
  let clickMult = 1
  let omenRate = 1
  const buildingMult = {}
  for (const e of activeEffects(state)) {
    if (e.type === 'global') globalMult *= e.mult
    else if (e.type === 'click') clickMult *= e.mult
    else if (e.type === 'omenRate') omenRate *= e.mult
    else buildingMult[e.building] = (buildingMult[e.building] ?? 1) * e.mult
  }

  let productionBuff = 1
  let clickBuff = 1
  for (const b of state.buffs) {
    if (b.target === 'production') productionBuff *= b.mult
    else clickBuff *= b.mult
  }

  const perBuilding = {}
  let perSecond = 0
  for (const b of BUILDINGS) {
    const total = b.cps * (state.owned[b.id] ?? 0) * (buildingMult[b.id] ?? 1) * globalMult * productionBuff
    perBuilding[b.id] = total
    perSecond += total
  }

  const perClick = (clickMult * gloryMultiplier(state.glory) + perSecond * CLICK_CPS_SHARE) * clickBuff
  return { perSecond, perClick, perBuilding, globalMult, omenRate }
}

export function isUpgradeVisible(state, upgrade) {
  if (state.upgrades.includes(upgrade.id)) return false
  switch (upgrade.kind) {
    case 'building':
      return (state.owned[upgrade.building] ?? 0) >= upgrade.need
    case 'global':
      return (state.owned[upgrade.requires] ?? 0) >= 1
    default: {
      // click upgrades unlock in order
      const clickUpgrades = UPGRADES.filter((u) => u.kind === 'click')
      const idx = clickUpgrades.findIndex((u) => u.id === upgrade.id)
      return idx === 0 || state.upgrades.includes(clickUpgrades[idx - 1].id)
    }
  }
}

export function gloryPotential(state) {
  return Math.floor(Math.cbrt(state.runEarned / 1e8))
}

export function nextChapter(state) {
  return CHAPTERS.find((c) => !state.chapters.includes(c.id)) ?? null
}

// The chapter whose story card should be shown: unread, or awaiting a choice.
export function pendingChapter(state) {
  const id = state.chapters.find((c) => {
    const chapter = CHAPTERS_BY_ID[c]
    return !state.chronicleSeen.includes(c) || (chapter.choices && !state.choices[c])
  })
  return id ? CHAPTERS_BY_ID[id] : null
}

export function omenPayout(state, omen) {
  const { perSecond, perClick } = computeStats(state)
  return Math.max(perSecond * omen.seconds, perClick * omen.clicks)
}

// --- state transitions ---------------------------------------------------

function earn(state, amount) {
  return {
    ...state,
    denarii: state.denarii + amount,
    lifetime: state.lifetime + amount,
    runEarned: state.runEarned + amount,
  }
}

export function withChapters(state) {
  const reached = CHAPTERS.filter((c) => c.at <= state.runEarned && !state.chapters.includes(c.id))
  if (reached.length === 0) return state
  return { ...state, chapters: [...state.chapters, ...reached.map((c) => c.id)] }
}

export function withAchievements(state) {
  const fresh = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.test(state))
  if (fresh.length === 0) return state
  return { ...state, achievements: [...state.achievements, ...fresh.map((a) => a.id)] }
}

function progress(state) {
  return withAchievements(withChapters(state))
}

function markSeen(state, chapterId) {
  if (state.chronicleSeen.includes(chapterId)) return state
  return { ...state, chronicleSeen: [...state.chronicleSeen, chapterId] }
}

export function applyOffline(saved, now = Date.now()) {
  const state = { ...saved, buffs: [] } // omen buffs never survive a break
  const elapsed = Math.min(Math.max((now - state.savedAt) / 1000, 0), OFFLINE_CAP_SECONDS)
  const { perSecond } = computeStats(state)
  const gained = perSecond * elapsed * OFFLINE_EFFICIENCY
  if (elapsed < 10 || gained <= 0) return { state: progress(state), gained: 0, elapsed: 0 }
  return { state: progress(earn(state, gained)), gained, elapsed }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      const { perClick } = computeStats(state)
      return progress({ ...earn(state, perClick), clicks: state.clicks + 1 })
    }

    case 'TICK': {
      const buffs = state.buffs.filter((b) => b.until > action.now)
      const next = buffs.length === state.buffs.length ? state : { ...state, buffs }
      const { perSecond } = computeStats(next)
      if (perSecond === 0) return next
      return progress(earn(next, perSecond * action.dt))
    }

    case 'BUY_BUILDING': {
      const building = BUILDINGS_BY_ID[action.id]
      const owned = state.owned[action.id] ?? 0
      const qty = action.qty === 'max' ? maxAffordable(building, owned, state.denarii) : action.qty
      if (qty < 1) return state
      const cost = buildingCost(building, owned, qty)
      if (cost > state.denarii) return state
      return progress({
        ...state,
        denarii: state.denarii - cost,
        owned: { ...state.owned, [action.id]: owned + qty },
      })
    }

    case 'BUY_UPGRADE': {
      const upgrade = UPGRADES_BY_ID[action.id]
      if (!upgrade || state.upgrades.includes(upgrade.id) || upgrade.cost > state.denarii) return state
      return progress({
        ...state,
        denarii: state.denarii - upgrade.cost,
        upgrades: [...state.upgrades, upgrade.id],
      })
    }

    case 'MARK_SEEN':
      return markSeen(state, action.chapterId)

    case 'CHOOSE': {
      const chapter = CHAPTERS_BY_ID[action.chapterId]
      const valid =
        chapter?.choices?.some((c) => c.id === action.choiceId) &&
        state.chapters.includes(chapter.id) &&
        !state.choices[chapter.id]
      if (!valid) return state
      return progress(markSeen({ ...state, choices: { ...state.choices, [chapter.id]: action.choiceId } }, chapter.id))
    }

    case 'CLAIM_OMEN': {
      const omen = OMENS_BY_ID[action.omenId]
      if (!omen) return state
      const claimed = { ...state, omensClaimed: state.omensClaimed + 1 }
      if (omen.kind === 'instant') return progress(earn(claimed, omenPayout(state, omen)))
      const buff = { id: omen.id, target: omen.target, mult: omen.mult, until: action.now + omen.duration * 1000 }
      // re-rolling the same omen refreshes its timer rather than stacking
      return progress({ ...claimed, buffs: [...state.buffs.filter((b) => b.id !== omen.id), buff] })
    }

    case 'ASCEND': {
      const gain = gloryPotential(state)
      if (gain < ASCEND_MIN_GAIN) return state
      return progress({
        ...createInitialState(),
        lifetime: state.lifetime,
        clicks: state.clicks,
        achievements: state.achievements,
        chronicleSeen: state.chronicleSeen,
        omensClaimed: state.omensClaimed,
        glory: state.glory + gain,
        ascensions: state.ascensions + 1,
      })
    }

    case 'LOAD':
      return action.state

    case 'RESET':
      return createInitialState()

    default:
      return state
  }
}
