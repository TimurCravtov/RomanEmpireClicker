import eagle from '../assets/icons/eagle-emblem.png'
import wheat from '../assets/icons/wheat.png'
import amphora from '../assets/icons/amphora.png'
import aqueduct from '../assets/icons/aqueduct.png'
import romanShield from '../assets/icons/roman-shield.png'
import barracks from '../assets/icons/barracks.png'
import trireme from '../assets/icons/trireme.png'
import ballista from '../assets/icons/ballista.png'
import temple from '../assets/icons/greek-temple.png'
import columns from '../assets/icons/ancient-columns.png'
import toga from '../assets/icons/roman-toga.png'
import gladius from '../assets/icons/gladius.png'
import helmet from '../assets/icons/centurion-helmet.png'
import laurelsTrophy from '../assets/icons/laurels-trophy.png'
import coins from '../assets/icons/coins.png'
import crown from '../assets/icons/imperial-crown.png'
import scroll from '../assets/icons/scroll-quill.png'
import laurelCrown from '../assets/icons/laurel-crown.png'
import farmer from '../assets/icons/farmer.png'

export const ICONS = {
  eagle,
  coins,
  crown,
  scroll,
  laurelCrown,
  laurelsTrophy,
}

export const COST_GROWTH = 1.15

export const BUILDINGS = [
  { id: 'farm', name: 'Farm', icon: wheat, baseCost: 15, cps: 0.1, blurb: 'Wheat feeds the legions and fills the treasury.' },
  { id: 'colonus', name: 'Colonus Tenant', icon: farmer, baseCost: 100, cps: 1, blurb: 'Tenant farmers pay their rent in denarii.' },
  { id: 'amphora', name: 'Amphora Merchant', icon: amphora, baseCost: 1100, cps: 8, blurb: 'Wine and olive oil from every corner of the Mare Nostrum.' },
  { id: 'aqueduct', name: 'Aqueduct', icon: aqueduct, baseCost: 12000, cps: 47, blurb: 'Fresh water, and a toll for every city it reaches.' },
  { id: 'century', name: 'Legionary Century', icon: romanShield, baseCost: 130000, cps: 260, blurb: 'Eighty men behind shields; plunder follows.' },
  { id: 'barracks', name: 'Barracks', icon: barracks, baseCost: 1400000, cps: 1400, blurb: 'A castra on every frontier, taxing every road.' },
  { id: 'trireme', name: 'Trireme Fleet', icon: trireme, baseCost: 20000000, cps: 7800, blurb: 'Mare Nostrum belongs to Rome. Customs duties, too.' },
  { id: 'ballista', name: 'Ballista Battery', icon: ballista, baseCost: 330000000, cps: 44000, blurb: 'Negotiation by bolt. Tribute arrives swiftly.' },
  { id: 'temple', name: 'Temple of Jupiter', icon: temple, baseCost: 5100000000, cps: 260000, blurb: 'The gods approve of tithes.' },
  { id: 'forum', name: 'Forum Romanum', icon: columns, baseCost: 75000000000, cps: 1600000, blurb: 'The beating heart of commerce in the known world.' },
  { id: 'senate', name: 'Senate', icon: toga, baseCost: 1000000000000, cps: 10000000, blurb: 'Senatores Populusque Romanus. Taxes, mostly.' },
]

// Click upgrades multiply denarii per click.
const CLICK_UPGRADES = [
  { id: 'gladius', name: 'Whetted Gladius', icon: gladius, cost: 100, desc: 'Clicks are twice as effective.', mult: 2 },
  { id: 'helmet', name: "Centurion's Command", icon: helmet, cost: 1500, desc: 'Clicks are twice as effective.', mult: 2 },
  { id: 'laurels', name: 'Laurels of Victory', icon: laurelsTrophy, cost: 75000, desc: 'Clicks are twice as effective.', mult: 2 },
  { id: 'scroll', name: 'Edict of the Emperor', icon: scroll, cost: 5000000, desc: 'Clicks are twice as effective.', mult: 2 },
]

// Each building gets three tiers; every tier doubles its output.
const BUILDING_TIERS = [
  { need: 1, costMult: 10 },
  { need: 10, costMult: 100 },
  { need: 25, costMult: 1000 },
]

const buildingUpgrades = BUILDINGS.flatMap((b) =>
  BUILDING_TIERS.map((tier, i) => ({
    id: `${b.id}-t${i + 1}`,
    name: `${b.name} ${['I', 'II', 'III'][i]}`,
    icon: b.icon,
    cost: b.baseCost * tier.costMult,
    desc: `${b.name} output is doubled.`,
    building: b.id,
    need: tier.need,
    mult: 2,
  })),
)

// Global multiplier upgrades.
const GLOBAL_UPGRADES = [
  { id: 'pax-romana', name: 'Pax Romana', icon: coins, cost: 250000, desc: 'All production +25%.', global: 1.25, requires: 'century' },
  { id: 'cursus-publicus', name: 'Cursus Publicus', icon: scroll, cost: 50000000, desc: 'All production +25%.', global: 1.25, requires: 'trireme' },
  { id: 'imperial-cult', name: 'Imperial Cult', icon: crown, cost: 5000000000, desc: 'All production +50%.', global: 1.5, requires: 'temple' },
]

export const UPGRADES = [
  ...CLICK_UPGRADES.map((u) => ({ ...u, kind: 'click' })),
  ...buildingUpgrades.map((u) => ({ ...u, kind: 'building' })),
  ...GLOBAL_UPGRADES.map((u) => ({ ...u, kind: 'global' })),
]

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))
export const BUILDINGS_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]))

export const RANKS = [
  { at: 0, title: 'Plebeian' },
  { at: 1e3, title: 'Legionary' },
  { at: 5e4, title: 'Centurion' },
  { at: 1e6, title: 'Tribune' },
  { at: 5e7, title: 'Senator' },
  { at: 1e9, title: 'Consul' },
  { at: 5e11, title: 'Caesar' },
  { at: 1e14, title: 'Imperator Augustus' },
]

export const ACHIEVEMENTS = [
  { id: 'first-click', name: 'Ave, Caesar!', desc: 'Click the eagle once.', icon: eagle, test: (s) => s.clicks >= 1 },
  { id: 'clicks-100', name: 'Tireless Tax Collector', desc: 'Click 100 times.', icon: gladius, test: (s) => s.clicks >= 100 },
  { id: 'clicks-1000', name: 'Hand of the Emperor', desc: 'Click 1,000 times.', icon: helmet, test: (s) => s.clicks >= 1000 },
  { id: 'earn-1k', name: 'A Modest Villa', desc: 'Earn 1,000 denarii.', icon: coins, test: (s) => s.lifetime >= 1e3 },
  { id: 'earn-1m', name: 'Equestrian Fortune', desc: 'Earn 1 million denarii.', icon: coins, test: (s) => s.lifetime >= 1e6 },
  { id: 'earn-1b', name: 'Richer than Crassus', desc: 'Earn 1 billion denarii.', icon: crown, test: (s) => s.lifetime >= 1e9 },
  { id: 'earn-1t', name: 'Master of the Mediterranean', desc: 'Earn 1 trillion denarii.', icon: laurelCrown, test: (s) => s.lifetime >= 1e12 },
  { id: 'farms-10', name: 'Breadbasket of Rome', desc: 'Own 10 farms.', icon: wheat, test: (s) => (s.owned.farm ?? 0) >= 10 },
  { id: 'aqueduct-1', name: 'Water for the People', desc: 'Build an aqueduct.', icon: aqueduct, test: (s) => (s.owned.aqueduct ?? 0) >= 1 },
  { id: 'century-10', name: 'Thin Red Line', desc: 'Raise 10 legionary centuries.', icon: romanShield, test: (s) => (s.owned.century ?? 0) >= 10 },
  { id: 'temple-1', name: 'Pontifex Maximus', desc: 'Dedicate a Temple of Jupiter.', icon: temple, test: (s) => (s.owned.temple ?? 0) >= 1 },
  { id: 'senate-1', name: 'Quorum Reached', desc: 'Seat the Senate.', icon: toga, test: (s) => (s.owned.senate ?? 0) >= 1 },
  {
    id: 'buildings-100',
    name: 'Urbs Aeterna',
    desc: 'Own 100 buildings.',
    icon: columns,
    test: (s) => Object.values(s.owned).reduce((a, n) => a + n, 0) >= 100,
  },
  { id: 'upgrades-10', name: 'Reformer', desc: 'Buy 10 upgrades.', icon: scroll, test: (s) => s.upgrades.length >= 10 },
  { id: 'glory-1', name: 'Ad Gloriam', desc: 'Ascend for the first time.', icon: laurelsTrophy, test: (s) => s.ascensions >= 1 },
]
