// Headlines for the Acta Diurna, Rome's daily gazette posted in the Forum.
// `when` limits a headline to the right moment in the player's history.

const has = (s, chapter) => s.chapters.includes(chapter)
const owns = (s, building) => (s.owned[building] ?? 0) > 0

export const HEADLINES = [
  // timeless
  { id: 'garum', text: 'Price of garum up again at the Forum Boarium. Fish-sauce merchants blame the weather.' },
  { id: 'factions', text: 'Chariot fans of the Greens and the Blues asked to keep their quarrels outside the Circus.' },
  { id: 'graffitiWall', text: 'Graffito, Pompeii: “O wall, I am amazed you have not collapsed under the weight of so much tedious scribbling.”' },
  { id: 'graffitiDiphilus', text: 'Graffito, Pompeii: “Gaius Pumidius Diphilus was here.”' },
  { id: 'graffitiNero', text: 'Graffito, Pompeii: “The food taster of the emperor Nero says: this is poison.”' },
  { id: 'toga', text: 'Lost: one toga, last seen at the public baths. Reward offered. No questions asked.' },
  { id: 'philosopher', text: 'Philosopher seen arguing with himself in the baths. Again.' },

  // the chronicle
  { id: 'augurs', text: 'Augurs report favorable birds over the Palatine. Romulus pleased.', when: (s) => !has(s, 'republic') },
  { id: 'consuls', text: 'Consuls elected for the coming year. Both promise to veto each other responsibly.', when: (s) => has(s, 'republic') && !has(s, 'augustus') },
  { id: 'geese', text: 'The sacred geese of Juno honored with a procession. The watchdogs who failed to bark, less so.', when: (s) => has(s, 'gauls') },
  { id: 'appia', text: 'Travelers report the Via Appia now runs all the way to Capua.', when: (s) => has(s, 'appia') },
  { id: 'rowers', text: 'New rowers still training on benches on dry land. Locals amused.', when: (s) => has(s, 'navy') && !has(s, 'hannibal') },
  { id: 'hannibalAdPortas', text: 'Mothers silence unruly children with two words: “Hannibal ad portas!”', when: (s) => has(s, 'hannibal') && !has(s, 'carthage') },
  { id: 'cato', text: 'Cato ends a speech on olive-oil tariffs: “Furthermore, I think Carthage must be destroyed.”', when: (s) => has(s, 'hannibal') && !has(s, 'carthage') },
  { id: 'recruiters', text: 'Recruiters seek landless volunteers. Kit not included; legs required.', when: (s) => has(s, 'marius') },
  { id: 'menander', text: 'Caesar reportedly quoted the Greek playwright Menander at the Rubicon. Senators unimpressed.', when: (s) => has(s, 'rubicon') && !has(s, 'ides') },
  { id: 'calpurnia', text: 'Calpurnia, wife of Caesar, reports troubling dreams. The soothsayer Spurinna concurs.', when: (s) => has(s, 'rubicon') && !has(s, 'augustus') },
  { id: 'janus', text: 'Doors of the Temple of Janus closed. The world, for once, is at peace.', when: (s) => has(s, 'augustus') },
  { id: 'grainFleet', text: 'Grain fleet from Egypt arrives at Ostia. Bread prices fall.', when: (s) => has(s, 'augustus') },
  { id: 'titusGames', text: 'Titus declares one hundred days of games. Thousands of beasts expected.', when: (s) => has(s, 'colosseum') },
  { id: 'trajanMarket', text: 'Trajan’s Market opens: some 150 shops and offices under one roof.', when: (s) => has(s, 'trajan') },
  { id: 'emperorAcclaimed', text: 'Another emperor acclaimed by the legions. Mint asked to hurry the new portraits.', when: (s) => has(s, 'crisis') },
  { id: 'bosporus', text: 'Construction booming on the Bosporus. Builders wanted, marble included.', when: (s) => has(s, 'constantine') },
  { id: 'odoacer', text: 'Odoacer returns the imperial regalia to Constantinople: one emperor, he says, is enough.', when: (s) => has(s, 'fall') },

  // the player's empire
  { id: 'robigalia', text: 'Farmers celebrate the Robigalia, praying the god Robigus keeps rust from the wheat.', when: (s) => owns(s, 'farm') },
  { id: 'testaccio', text: 'Monte Testaccio grows taller. Broken amphorae now number in the millions.', when: (s) => owns(s, 'amphora') },
  { id: 'aqueductPipes', text: 'Water commissioner reports illegal pipes tapping the aqueducts again.', when: (s) => owns(s, 'aqueduct') },
  { id: 'legionPace', text: 'Legionaries grumble at the regulation pace: twenty Roman miles in five hours.', when: (s) => owns(s, 'century') },
  { id: 'pirates', text: 'Cilician pirates raid the coast. Senate debates an extraordinary command at sea.', when: (s) => owns(s, 'trireme') },
  { id: 'ballista', text: 'Engineers test a new torsion bolt-thrower. Neighbors request a quieter hobby.', when: (s) => owns(s, 'ballista') },
  { id: 'vestals', text: 'The Vestal Virgins report the sacred flame still burning bright.', when: (s) => owns(s, 'temple') },
  { id: 'catoFilibuster', text: 'Senate session ends at sunset after Cato the Younger talks until the light fails.', when: (s) => owns(s, 'senate') },
]

export function eligibleHeadlines(state) {
  return HEADLINES.filter((h) => !h.when || h.when(state))
}
