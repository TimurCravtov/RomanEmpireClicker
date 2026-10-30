// Deterministic layout for the Rome diorama: where every building of every
// type would stand. Slots are generated once with a seeded RNG, so the city
// grows in place as the player buys more rather than reshuffling.

export const ISLAND_RADIUS = 16
export const WALL_RADIUS = 7.6
export const COLOSSEUM_POS = [3.2, 4.6]
export const TRAJAN_POS = [-1.4, 3.9]

// the seven hills, flattened to a few bumps: [x, z, radius, height]
const HILLS = [
  [0, 0, 3.2, 1.0], // Palatine
  [-3.6, 1.6, 2.2, 0.8], // Capitoline
  [-2.4, -3.6, 2.6, 0.7], // Quirinal
  [2.2, -3.4, 2.4, 0.6], // Esquiline
]

export function riverX(z) {
  return 6.4 + 1.6 * Math.sin(z * 0.25)
}

export function inRiver(x, z, margin = 0) {
  return Math.abs(x - riverX(z)) < 1.0 + margin
}

export function terrainHeight(x, z) {
  let h = 0
  for (const [hx, hz, r, height] of HILLS) {
    const d2 = ((x - hx) ** 2 + (z - hz) ** 2) / (r * r)
    h += height * Math.exp(-d2)
  }
  const river = Math.abs(x - riverX(z))
  if (river < 1.4) h -= 0.3 * (1 - river / 1.4)
  return h
}

export function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// how many of each building the diorama shows, and where they may stand
export const ZONES = {
  temple: { cap: 6, rMin: 0.6, rMax: 3.6, size: 1.0 },
  senate: { cap: 2, rMin: 1.2, rMax: 3.4, size: 0.9 },
  forum: { cap: 3, rMin: 1.4, rMax: 4.2, size: 1.2 },
  amphora: { cap: 12, rMin: 3.0, rMax: 6.8, size: 0.5, side: 1 },
  colonus: { cap: 28, rMin: 2.8, rMax: 7.0, size: 0.45 },
  century: { cap: 8, rMin: 9.0, rMax: 12.5, size: 1.4, arc: [Math.PI * 1.05, Math.PI * 1.6] },
  barracks: { cap: 6, rMin: 10, rMax: 14, size: 1.2 },
  farm: { cap: 30, rMin: 8.6, rMax: 14.8, size: 1.0 },
}

function generateSlots() {
  const rand = mulberry32(753) // ab urbe condita
  const taken = [
    { x: COLOSSEUM_POS[0], z: COLOSSEUM_POS[1], size: 2.2 },
    { x: TRAJAN_POS[0], z: TRAJAN_POS[1], size: 0.6 },
    ...aqueductPoints(14).map(([x, z]) => ({ x, z, size: 0.5 })),
  ]
  const slots = {}
  for (const [type, zone] of Object.entries(ZONES)) {
    slots[type] = []
    for (let i = 0; i < zone.cap; i++) {
      for (let attempt = 0; attempt < 600; attempt++) {
        const angle = zone.arc ? zone.arc[0] + rand() * (zone.arc[1] - zone.arc[0]) : rand() * Math.PI * 2
        const r = zone.rMin + Math.sqrt(rand()) * (zone.rMax - zone.rMin)
        const x = Math.cos(angle) * r
        const z = Math.sin(angle) * r
        if (zone.side && Math.sign(x) !== zone.side) continue
        if (inRiver(x, z, zone.size)) continue
        if (Math.abs(Math.hypot(x, z) - WALL_RADIUS) < 0.5 + zone.size / 2) continue
        if (taken.some((t) => Math.hypot(t.x - x, t.z - z) < (t.size + zone.size) * 0.75)) continue
        taken.push({ x, z, size: zone.size })
        slots[type].push({ x, z, y: terrainHeight(x, z), rot: rand() * Math.PI * 2, seed: rand() })
        break
      }
    }
  }
  return slots
}

// aqueduct runs in from the eastern hills toward the city
export function aqueductPoints(count) {
  const from = [-15, -8.5]
  const to = [-2.6, -1.4]
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
  })
}

export const SLOTS = generateSlots()

// owned count -> shown count; the first few matter most, then it fills slowly
export function shownCount(owned, cap) {
  if (owned <= 0) return 0
  if (owned <= cap / 2) return owned
  return Math.min(cap, Math.round(cap / 2 + Math.sqrt(owned - cap / 2) * 1.5))
}
