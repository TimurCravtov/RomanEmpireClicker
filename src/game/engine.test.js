import { describe, expect, it } from 'vitest'
import { BUILDINGS_BY_ID } from './data.js'
import {
  applyOffline,
  buildingCost,
  computeStats,
  createInitialState,
  gloryPotential,
  maxAffordable,
  reducer,
} from './engine.js'

const farm = BUILDINGS_BY_ID.farm

describe('costs', () => {
  it('first farm costs its base price', () => {
    expect(buildingCost(farm, 0, 1)).toBe(15)
  })

  it('bulk cost equals the sum of single purchases', () => {
    let sum = 0
    for (let i = 0; i < 10; i++) sum += buildingCost(farm, 3 + i, 1)
    expect(Math.abs(buildingCost(farm, 3, 10) - sum)).toBeLessThanOrEqual(10)
  })

  it('maxAffordable never exceeds the budget', () => {
    for (const money of [14, 15, 100, 12345, 9e9]) {
      const n = maxAffordable(farm, 2, money)
      expect(buildingCost(farm, 2, n)).toBeLessThanOrEqual(money)
      expect(buildingCost(farm, 2, n + 1)).toBeGreaterThan(money)
    }
  })
})

describe('reducer', () => {
  it('clicking earns denarii and counts clicks', () => {
    const s = reducer(createInitialState(), { type: 'CLICK' })
    expect(s.denarii).toBe(1)
    expect(s.clicks).toBe(1)
    expect(s.achievements).toContain('first-click')
  })

  it('buying a building spends denarii and produces income', () => {
    let s = { ...createInitialState(), denarii: 15 }
    s = reducer(s, { type: 'BUY_BUILDING', id: 'farm', qty: 1 })
    expect(s.denarii).toBe(0)
    expect(s.owned.farm).toBe(1)
    expect(computeStats(s).perSecond).toBeCloseTo(0.1)
  })

  it('refuses purchases it cannot afford', () => {
    const s = createInitialState()
    expect(reducer(s, { type: 'BUY_BUILDING', id: 'farm', qty: 1 })).toBe(s)
    expect(reducer(s, { type: 'BUY_UPGRADE', id: 'gladius' })).toBe(s)
  })

  it('click upgrades double click power', () => {
    let s = { ...createInitialState(), denarii: 100 }
    s = reducer(s, { type: 'BUY_UPGRADE', id: 'gladius' })
    expect(computeStats(s).perClick).toBe(2)
  })

  it('tick adds income proportional to dt', () => {
    let s = { ...createInitialState(), owned: { farm: 10 } }
    s = reducer(s, { type: 'TICK', dt: 2 })
    expect(s.denarii).toBeCloseTo(2)
  })
})

describe('prestige', () => {
  it('requires enough earnings', () => {
    const s = { ...createInitialState(), runEarned: 1e6, denarii: 5 }
    expect(gloryPotential(s)).toBe(0)
    expect(reducer(s, { type: 'ASCEND' })).toBe(s)
  })

  it('resets the run but keeps glory, clicks and achievements', () => {
    const before = {
      ...createInitialState(),
      runEarned: 1e9,
      lifetime: 1e9,
      clicks: 42,
      owned: { farm: 5 },
      upgrades: ['gladius'],
    }
    const after = reducer(before, { type: 'ASCEND' })
    expect(after.glory).toBe(gloryPotential(before))
    expect(after.owned).toEqual({})
    expect(after.upgrades).toEqual([])
    expect(after.denarii).toBe(0)
    expect(after.clicks).toBe(42)
    expect(after.ascensions).toBe(1)
    expect(after.achievements).toContain('glory-1')
  })

  it('glory boosts production', () => {
    const base = { ...createInitialState(), owned: { farm: 10 } }
    const boosted = { ...base, glory: 20 }
    expect(computeStats(boosted).perSecond).toBeCloseTo(computeStats(base).perSecond * 2)
  })
})

describe('offline progress', () => {
  it('pays out at reduced efficiency and caps at four hours', () => {
    const now = Date.now()
    const s = { ...createInitialState(), owned: { farm: 10 }, savedAt: now - 10 * 3600 * 1000 }
    const { gained, elapsed } = applyOffline(s, now)
    expect(elapsed).toBe(4 * 3600)
    expect(gained).toBeCloseTo(1 * 4 * 3600 * 0.5)
  })

  it('ignores very short absences', () => {
    const now = Date.now()
    const s = { ...createInitialState(), owned: { farm: 10 }, savedAt: now - 3000 }
    expect(applyOffline(s, now).gained).toBe(0)
  })
})
