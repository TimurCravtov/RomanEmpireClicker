import { describe, expect, it } from 'vitest'
import { BUILDINGS_BY_ID } from './data.js'
import {
  applyOffline,
  buildingCost,
  computeStats,
  createInitialState,
  gloryPotential,
  maxAffordable,
  nextChapter,
  omenPayout,
  pendingChapter,
  reducer,
} from './engine.js'
import { OMENS_BY_ID, pickOmen } from './omens.js'
import { CHAPTERS, DYNASTIES, dynastyName } from './story.js'

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
    s = reducer(s, { type: 'TICK', dt: 2, now: Date.now() })
    expect(s.denarii).toBeCloseTo(2)
  })
})

describe('chronicle', () => {
  it('a new game opens on the founding of Rome, waiting to be read', () => {
    const s = createInitialState()
    expect(s.chapters).toEqual(['founding'])
    expect(pendingChapter(s).id).toBe('founding')
    expect(pendingChapter(reducer(s, { type: 'MARK_SEEN', chapterId: 'founding' }))).toBeNull()
  })

  it('unlocks chapters as the reign earns and applies their boons', () => {
    let s = { ...createInitialState(), runEarned: 249 }
    expect(nextChapter(s).id).toBe('republic')
    s = reducer(s, { type: 'CLICK' })
    expect(s.chapters).toContain('republic')
    expect(computeStats(s).perClick).toBe(2) // Res Publica: clicks ×2
  })

  it('choice chapters apply only the chosen boon, once', () => {
    let s = { ...createInitialState(), runEarned: 3000, owned: { farm: 10 }, chronicleSeen: ['founding', 'republic'] }
    s = reducer(s, { type: 'CLICK' })
    expect(pendingChapter(s).id).toBe('gauls')
    const before = computeStats(s).perSecond

    s = reducer(s, { type: 'CHOOSE', chapterId: 'gauls', choiceId: 'pay' })
    expect(s.choices.gauls).toBe('pay')
    expect(s.chronicleSeen).toContain('gauls')
    expect(computeStats(s).perSecond).toBeCloseTo(before * 3)

    expect(reducer(s, { type: 'CHOOSE', chapterId: 'gauls', choiceId: 'iron' })).toBe(s)
  })

  it('ignores choices for chapters not yet reached or that do not exist', () => {
    const s = createInitialState()
    expect(reducer(s, { type: 'CHOOSE', chapterId: 'rubicon', choiceId: 'cross' })).toBe(s)
    expect(reducer(s, { type: 'CHOOSE', chapterId: 'gauls', choiceId: 'nope' })).toBe(s)
  })

  it('every chapter boon references a real building', () => {
    for (const c of CHAPTERS) {
      const effects = c.choices ? c.choices.flatMap((o) => o.effects) : c.effects
      for (const e of effects.filter((e) => e.type === 'building')) expect(BUILDINGS_BY_ID[e.building]).toBeDefined()
    }
  })

  it('chapter thresholds are in ascending order', () => {
    for (let i = 1; i < CHAPTERS.length; i++) expect(CHAPTERS[i].at).toBeGreaterThan(CHAPTERS[i - 1].at)
  })

  it('names a dynasty for every reign', () => {
    expect(dynastyName(0)).toBe('House of Romulus')
    expect(dynastyName(1)).toBe('Julio-Claudian')
    expect(dynastyName(DYNASTIES.length)).toBe('House of Romulus II')
  })
})

describe('omens', () => {
  const now = 1_000_000

  it('buff omens multiply output until they expire', () => {
    let s = { ...createInitialState(), owned: { farm: 10 } }
    s = reducer(s, { type: 'CLAIM_OMEN', omenId: 'circuses', now })
    expect(s.omensClaimed).toBe(1)
    expect(computeStats(s).perSecond).toBeCloseTo(5)

    s = reducer(s, { type: 'TICK', dt: 0.1, now: now + 31_000 })
    expect(s.buffs).toEqual([])
    expect(computeStats(s).perSecond).toBeCloseTo(1)
  })

  it('claiming the same omen refreshes rather than stacks', () => {
    let s = reducer(createInitialState(), { type: 'CLAIM_OMEN', omenId: 'saturnalia', now })
    s = reducer(s, { type: 'CLAIM_OMEN', omenId: 'saturnalia', now: now + 5000 })
    expect(s.buffs).toHaveLength(1)
    expect(computeStats(s).perClick).toBe(10)
  })

  it('a triumph pays minutes of production at once', () => {
    const s = { ...createInitialState(), owned: { farm: 10 } }
    const after = reducer(s, { type: 'CLAIM_OMEN', omenId: 'triumph', now })
    expect(after.denarii).toBeCloseTo(omenPayout(s, OMENS_BY_ID.triumph))
    expect(after.denarii).toBeCloseTo(300)
  })

  it('pickOmen respects weights', () => {
    expect(pickOmen(() => 0).id).toBe('triumph')
    expect(pickOmen(() => 0.999).id).toBe('auspices')
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

  it('a new reign restarts the chronicle but remembers what was read', () => {
    const before = {
      ...createInitialState(),
      runEarned: 1e9,
      chapters: ['founding', 'republic', 'gauls'],
      choices: { gauls: 'iron' },
      chronicleSeen: ['founding', 'republic', 'gauls'],
      buffs: [{ id: 'circuses', target: 'production', mult: 5, until: Infinity }],
    }
    const after = reducer(before, { type: 'ASCEND' })
    expect(after.chapters).toEqual(['founding'])
    expect(after.choices).toEqual({})
    expect(after.buffs).toEqual([])
    expect(after.chronicleSeen).toEqual(before.chronicleSeen)
    expect(pendingChapter(after)).toBeNull()
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

  it('omen buffs do not apply while away', () => {
    const now = Date.now()
    const s = {
      ...createInitialState(),
      owned: { farm: 10 },
      savedAt: now - 100 * 1000,
      buffs: [{ id: 'circuses', target: 'production', mult: 5, until: now + 1e9 }],
    }
    const { state, gained } = applyOffline(s, now)
    expect(state.buffs).toEqual([])
    expect(gained).toBeCloseTo(100 * 0.5)
  })
})
