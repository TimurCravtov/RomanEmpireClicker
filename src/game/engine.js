import { ACHIEVEMENTS, BUILDINGS, BUILDINGS_BY_ID, COST_GROWTH, UPGRADES, UPGRADES_BY_ID } from './data.js'

export const GLORY_BONUS = 0.05
export const CLICK_CPS_SHARE = 0.02
export const OFFLINE_CAP_SECONDS = 4 * 3600
export const OFFLINE_EFFICIENCY = 0.5
export const ASCEND_MIN_GAIN = 1

export function createInitialState() {
  return {
    denarii: 0,
    lifetime: 0, // earned across every run, drives ranks and achievements
    runEarned: 0, // earned this run, drives glory
    clicks: 0,
    owned: {},
    upgrades: [],
    achievements: [],
    glory: 0,
    ascensions: 0,
    savedAt: Date.now(),
  }
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

export function computeStats(state) {
  const bought = state.upgrades.map((id) => UPGRADES_BY_ID[id]).filter(Boolean)

  let globalMult = gloryMultiplier(state.glory)
  let clickMult = 1
  const buildingMult = {}
  for (const u of bought) {
    if (u.kind === 'global') globalMult *= u.global
    else if (u.kind === 'click') clickMult *= u.mult
    else buildingMult[u.building] = (buildingMult[u.building] ?? 1) * u.mult
  }

  const perBuilding = {}
  let perSecond = 0
  for (const b of BUILDINGS) {
    const total = b.cps * (state.owned[b.id] ?? 0) * (buildingMult[b.id] ?? 1) * globalMult
    perBuilding[b.id] = total
    perSecond += total
  }

  const perClick = clickMult * gloryMultiplier(state.glory) + perSecond * CLICK_CPS_SHARE
  return { perSecond, perClick, perBuilding, globalMult }
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

// --- state transitions ---------------------------------------------------

function earn(state, amount) {
  return {
    ...state,
    denarii: state.denarii + amount,
    lifetime: state.lifetime + amount,
    runEarned: state.runEarned + amount,
  }
}

export function withAchievements(state) {
  const fresh = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.test(state))
  if (fresh.length === 0) return state
  return { ...state, achievements: [...state.achievements, ...fresh.map((a) => a.id)] }
}

export function applyOffline(state, now = Date.now()) {
  const elapsed = Math.min(Math.max((now - state.savedAt) / 1000, 0), OFFLINE_CAP_SECONDS)
  const { perSecond } = computeStats(state)
  const gained = perSecond * elapsed * OFFLINE_EFFICIENCY
  if (elapsed < 10 || gained <= 0) return { state, gained: 0, elapsed: 0 }
  return { state: earn(state, gained), gained, elapsed }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      const { perClick } = computeStats(state)
      return withAchievements({ ...earn(state, perClick), clicks: state.clicks + 1 })
    }

    case 'TICK': {
      const { perSecond } = computeStats(state)
      if (perSecond === 0) return state
      return withAchievements(earn(state, perSecond * action.dt))
    }

    case 'BUY_BUILDING': {
      const building = BUILDINGS_BY_ID[action.id]
      const owned = state.owned[action.id] ?? 0
      const qty = action.qty === 'max' ? maxAffordable(building, owned, state.denarii) : action.qty
      if (qty < 1) return state
      const cost = buildingCost(building, owned, qty)
      if (cost > state.denarii) return state
      return withAchievements({
        ...state,
        denarii: state.denarii - cost,
        owned: { ...state.owned, [action.id]: owned + qty },
      })
    }

    case 'BUY_UPGRADE': {
      const upgrade = UPGRADES_BY_ID[action.id]
      if (!upgrade || state.upgrades.includes(upgrade.id) || upgrade.cost > state.denarii) return state
      return withAchievements({
        ...state,
        denarii: state.denarii - upgrade.cost,
        upgrades: [...state.upgrades, upgrade.id],
      })
    }

    case 'ASCEND': {
      const gain = gloryPotential(state)
      if (gain < ASCEND_MIN_GAIN) return state
      return withAchievements({
        ...createInitialState(),
        lifetime: state.lifetime,
        clicks: state.clicks,
        achievements: state.achievements,
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
