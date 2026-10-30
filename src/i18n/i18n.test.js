import { describe, expect, it } from 'vitest'
import { HEADLINES } from '../game/acta.js'
import { ACHIEVEMENTS, BUILDINGS, RANKS, UPGRADES } from '../game/data.js'
import { OMENS } from '../game/omens.js'
import { CHAPTERS, DYNASTIES } from '../game/story.js'
import en from './en.js'
import { DICTIONARIES, LANGUAGES, createTranslator, lookup } from './index.jsx'

// every leaf path in a nested object, e.g. 'shop.title'
function leaves(node, prefix = '') {
  return Object.entries(node).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

const placeholders = (s) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))

const TRANSLATED = LANGUAGES.map((l) => l.code).filter((c) => c !== 'en')

describe.each(TRANSLATED)('%s translation', (code) => {
  const dict = DICTIONARIES[code]

  it('covers every interface string, with the same placeholders', () => {
    for (const key of leaves(en.ui)) {
      const value = lookup(dict.ui, key)
      expect(value, `ui.${key}`).toBeTypeOf('string')
      // years may count ab urbe condita ({auc}) instead of BC/AD ({n})
      const allowed = new Set([...placeholders(lookup(en.ui, key)), ...(key.startsWith('year.') ? ['auc'] : [])])
      for (const p of placeholders(value)) expect(allowed.has(p), `ui.${key} uses unknown {${p}}`).toBe(true)
    }
  })

  it('names and describes every building, upgrade, achievement and omen', () => {
    for (const b of BUILDINGS) {
      expect(dict.buildings[b.id]?.name, b.id).toBeTruthy()
      expect(dict.buildings[b.id]?.blurb, b.id).toBeTruthy()
    }
    for (const u of UPGRADES.filter((u) => u.kind !== 'building')) expect(dict.upgrades[u.id], u.id).toBeTruthy()
    for (const a of ACHIEVEMENTS) {
      expect(dict.achievements[a.id]?.name, a.id).toBeTruthy()
      expect(dict.achievements[a.id]?.desc, a.id).toBeTruthy()
    }
    for (const o of OMENS) {
      expect(dict.omens[o.id]?.name, o.id).toBeTruthy()
      expect(dict.omens[o.id]?.text, o.id).toBeTruthy()
    }
  })

  it('translates every rank, dynasty and headline', () => {
    expect(dict.ranks).toHaveLength(RANKS.length)
    expect(dict.dynasties).toHaveLength(DYNASTIES.length)
    for (const h of HEADLINES) expect(dict.headlines[h.id], h.id).toBeTruthy()
  })

  it('tells every chapter of the chronicle in full, choices included', () => {
    for (const ch of CHAPTERS) {
      const tr = dict.chapters[ch.id]
      expect(tr?.title, ch.id).toBeTruthy()
      expect(tr?.motto, ch.id).toBeTruthy()
      expect(tr?.text, ch.id).toHaveLength(ch.text.length)
      for (const choice of ch.choices ?? []) {
        for (const field of ['label', 'desc', 'note']) expect(tr.choices?.[choice.id]?.[field], `${ch.id}.${choice.id}.${field}`).toBeTruthy()
      }
    }
  })

  it('leaves no unfilled placeholders in rendered text', () => {
    const i18n = createTranslator(code)
    const rendered = [
      i18n.t('treasury.perSecond', { n: 5 }),
      i18n.t('gloria.confirm', { g: 2, p: 10 }),
      i18n.year('753 BC'),
      i18n.year('AD 476'),
      ...UPGRADES.map((u) => i18n.upgrade(u).desc),
      ...CHAPTERS.flatMap((c) => (c.choices ?? []).flatMap((o) => o.effects).concat(c.effects ?? [])).map(i18n.effect),
    ]
    for (const text of rendered) expect(text).not.toMatch(/\{\w+\}/)
  })
})

describe('translator', () => {
  it('formats years the way each language does', () => {
    expect(createTranslator('en').year('753 BC')).toBe('753 BC')
    expect(createTranslator('en').year('AD 80')).toBe('AD 80')
    expect(createTranslator('ru').year('753 BC')).toBe('753 г. до н. э.')
    // Latin counts from the founding of the city: 753 BC is its first year
    expect(createTranslator('la').year('753 BC')).toBe('a.u.c. 1')
    expect(createTranslator('la').year('509 BC')).toBe('a.u.c. 245')
    expect(createTranslator('la').year('AD 476')).toBe('a.u.c. 1229')
  })

  it('falls back to English for an unknown language', () => {
    expect(createTranslator('xx').t('shop.title')).toBe('Imperial Works')
  })

  it('names building upgrades after the localized building', () => {
    const tier = UPGRADES.find((u) => u.id === 'farm-t2')
    expect(createTranslator('ro').upgrade(tier).name).toBe('Fermă II')
  })
})
