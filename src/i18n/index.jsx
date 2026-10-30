import { Fragment, createContext, useContext, useEffect, useMemo } from 'react'
import { BUILDINGS_BY_ID, RANKS } from '../game/data.js'
import { DYNASTIES, dynastyName } from '../game/story.js'
import en from './en.js'
import la from './la.js'
import ro from './ro.js'
import ru from './ru.js'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ro', label: 'Română' },
  { code: 'la', label: 'Latina' },
]

export const DICTIONARIES = { en, ru, ro, la }
const TIERS = ['I', 'II', 'III']

export function lookup(dict, path) {
  return path.split('.').reduce((node, key) => node?.[key], dict)
}

function fill(template, vars) {
  return vars ? template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`).toString()) : template
}

function percent(mult) {
  const pct = Math.round((mult - 1) * 100)
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`
}

// Everything the interface needs to speak one language. Content falls back to
// the English written into the game data, so a missing translation never blanks the UI.
export function createTranslator(lang) {
  const dict = DICTIONARIES[lang] ?? en
  const content = (path, fallback) => lookup(dict, path) ?? fallback

  const t = (key, vars) => fill(lookup(dict.ui, key) ?? lookup(en.ui, key) ?? key, vars)

  // like t(), but placeholders may be React nodes (e.g. <strong>)
  const rich = (key, vars) =>
    (lookup(dict.ui, key) ?? lookup(en.ui, key) ?? key)
      .split(/\{(\w+)\}/g)
      .map((part, i) => <Fragment key={i}>{i % 2 ? vars[part] : part}</Fragment>)

  const buildingName = (id) => content(`buildings.${id}.name`, BUILDINGS_BY_ID[id].name)

  const year = (text) => {
    const bc = text.match(/^(\d+) BC$/)
    const ad = text.match(/^AD (\d+)$/)
    if (bc) return t('year.bc', { n: bc[1] })
    if (ad) return t('year.ad', { n: ad[1] })
    return text
  }

  return {
    lang,
    t,
    rich,
    year,
    duration: (seconds) => {
      const s = Math.floor(seconds)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const u = (k) => t(`duration.${k}`)
      if (h > 0) return `${h}${u('h')} ${m}${u('m')}`
      if (m > 0) return `${m}${u('m')} ${s % 60}${u('s')}`
      return `${s}${u('s')}`
    },
    building: (b) => ({ name: buildingName(b.id), blurb: content(`buildings.${b.id}.blurb`, b.blurb) }),
    upgrade: (u) => {
      if (u.kind === 'building') {
        const name = buildingName(u.building)
        const tier = Number(u.id.split('-t')[1])
        return { name: `${name} ${TIERS[tier - 1]}`, desc: t('upgrade.buildingDesc', { building: name }) }
      }
      const name = content(`upgrades.${u.id}`, u.name)
      return { name, desc: u.kind === 'click' ? t('upgrade.clickDesc') : t('upgrade.globalDesc', { pct: percent(u.global) }) }
    },
    achievement: (a) => ({
      name: content(`achievements.${a.id}.name`, a.name),
      desc: content(`achievements.${a.id}.desc`, a.desc),
    }),
    chapter: (ch) => {
      const tr = lookup(dict, `chapters.${ch.id}`) ?? {}
      return {
        ...ch,
        year: year(ch.year),
        title: tr.title ?? ch.title,
        motto: tr.motto ?? ch.motto,
        text: tr.text ?? ch.text,
        choices: ch.choices?.map((o) => ({
          ...o,
          label: tr.choices?.[o.id]?.label ?? o.label,
          desc: tr.choices?.[o.id]?.desc ?? o.desc,
          note: tr.choices?.[o.id]?.note ?? o.note,
        })),
      }
    },
    omen: (o) => ({ name: content(`omens.${o.id}.name`, o.name), text: content(`omens.${o.id}.text`, o.text) }),
    headline: (h) => content(`headlines.${h.id}`, h.text),
    rank: (r) => content(`ranks.${RANKS.indexOf(r)}`, r.title),
    dynasty: (ascensions) => dynastyName(ascensions, dict.dynasties ?? DYNASTIES),
    effect: (e) => {
      switch (e.type) {
        case 'building':
          return t('effect.building', { building: buildingName(e.building), mult: e.mult })
        case 'global':
          return t('effect.global', { pct: percent(e.mult) })
        case 'click':
          return t('effect.click', { mult: e.mult })
        case 'omenRate':
          return t('effect.omenRate')
        default:
          return ''
      }
    },
  }
}

const I18nContext = createContext(createTranslator('en'))

export function I18nProvider({ lang, children }) {
  const value = useMemo(() => createTranslator(lang), [lang])
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = value.t('meta.title')
  }, [lang, value])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
