import laurelsTrophy from '../assets/icons/laurels-trophy.png'
import bread from '../assets/icons/bread.png'
import sun from '../assets/icons/sun.png'
import eagle from '../assets/icons/eagle-emblem.png'

export const OMEN_BASE_INTERVAL_S = 100 // average seconds between omens
export const OMEN_LIFETIME_S = 13

// `instant` omens pay out `seconds` of production (or `clicks` worth of
// clicking, whichever is larger); `buff` omens multiply output for a while.
export const OMENS = [
  {
    id: 'triumph',
    name: 'A Triumph!',
    icon: laurelsTrophy,
    weight: 4,
    kind: 'instant',
    seconds: 300,
    clicks: 60,
    text: 'A victorious general rides through the Via Sacra in a four-horse chariot, the spoils of war carried before him.',
  },
  {
    id: 'circuses',
    name: 'Bread and Circuses',
    icon: bread,
    weight: 3,
    kind: 'buff',
    target: 'production',
    mult: 5,
    duration: 30,
    text: 'Races at the Circus Maximus! The crowd roars, and the coin flows. Production ×5.',
  },
  {
    id: 'saturnalia',
    name: 'Io Saturnalia!',
    icon: sun,
    weight: 2,
    kind: 'buff',
    target: 'click',
    mult: 10,
    duration: 15,
    text: 'Masters wait on their slaves and the world turns upside down. Clicks ×10.',
  },
  {
    id: 'auspices',
    name: 'Favorable Auspices',
    icon: eagle,
    weight: 2,
    kind: 'buff',
    target: 'production',
    mult: 2,
    duration: 90,
    text: 'The augurs watch birds fly on the left, a sign the gods approve. Production ×2.',
  },
]

export const OMENS_BY_ID = Object.fromEntries(OMENS.map((o) => [o.id, o]))

export function pickOmen(random = Math.random) {
  const total = OMENS.reduce((sum, o) => sum + o.weight, 0)
  let roll = random() * total
  for (const omen of OMENS) {
    roll -= omen.weight
    if (roll < 0) return omen
  }
  return OMENS[0]
}
