import aqueduct from '../assets/icons/aqueduct.png'
import trireme from '../assets/icons/trireme.png'
import toga from '../assets/icons/roman-toga.png'
import helmet from '../assets/icons/centurion-helmet.png'
import laurelCrown from '../assets/icons/laurel-crown.png'
import wolf from '../assets/icons/wolf-howl.png'
import goose from '../assets/icons/goose.png'
import elephant from '../assets/icons/elephant.png'
import ruins from '../assets/icons/ancient-ruins.png'
import dice from '../assets/icons/dice.png'
import dagger from '../assets/icons/broad-dagger.png'
import swords from '../assets/icons/crossed-swords.png'
import column from '../assets/icons/ionic-column.png'
import brokenWall from '../assets/icons/broken-wall.png'
import church from '../assets/icons/church.png'
import castleRuins from '../assets/icons/castle-ruins.png'

// Chapters unlock as denarii are earned within a single reign (run).
// `effects` are permanent boons for that reign; chapters with `choices`
// let the player pick which boon applies.
//
// Effect shapes:
//   { type: 'building', building, mult }   one building's output
//   { type: 'global', mult }               all production
//   { type: 'click', mult }                denarii per click
//   { type: 'omenRate', mult }             how often omens appear
export const CHAPTERS = [
  {
    id: 'founding',
    numeral: 'I',
    year: '753 BC',
    title: 'The Founding of Rome',
    motto: 'Ab urbe condita',
    icon: wolf,
    at: 0,
    text: [
      'Legend tells of twins, Romulus and Remus, cast into the Tiber and nursed by a she-wolf. Grown to manhood, they chose to found a city on the hills where they had been saved. Romulus plowed a sacred furrow, the pomerium, around the Palatine. When Remus mocked it and leapt across, Romulus struck him down. The city took the victor’s name.',
      'Rome is a scatter of huts above a marsh. Romans would one day count their years from this moment, ab urbe condita, “from the founding of the city”. Every coin you gather builds what comes next.',
    ],
    effects: [],
  },
  {
    id: 'republic',
    numeral: 'II',
    year: '509 BC',
    title: 'Res Publica',
    motto: 'Senatus Populusque Romanus',
    icon: toga,
    at: 250,
    text: [
      'The seventh king, Tarquin the Proud, ruled by fear. When his son assaulted the noblewoman Lucretia, Lucius Junius Brutus swore on her dagger to drive the royal family from Rome. The people rose with him, and the Tarquins fled.',
      'Romans vowed never again to suffer a king. Instead two consuls would be elected each year, each able to veto the other. Power now belonged to “the public thing”: the res publica.',
    ],
    effects: [{ type: 'click', mult: 2 }],
  },
  {
    id: 'gauls',
    numeral: 'III',
    year: '390 BC',
    title: 'Vae Victis',
    motto: 'Woe to the vanquished',
    icon: goose,
    at: 3000,
    text: [
      'Gauls under their chieftain Brennus shattered a Roman army at the Allia and poured into an undefended city. Only the Capitoline Hill held out. When the Gauls climbed it by night, the sacred geese of Juno honked the alarm, and the defenders threw them back.',
      'Starving, the Romans agreed to buy their freedom with a thousand pounds of gold. When they complained the Gallic weights were rigged, Brennus threw his sword onto the scales: “Vae victis!” How will Rome answer?',
    ],
    choices: [
      {
        id: 'pay',
        label: 'Pay the gold',
        desc: 'The Gauls take their ransom and leave. Rome rebuilds and its fields are worked in peace.',
        note: 'As the Greek historian Polybius tells it.',
        effects: [{ type: 'building', building: 'farm', mult: 3 }, { type: 'building', building: 'colonus', mult: 2 }],
      },
      {
        id: 'iron',
        label: 'Non auro, sed ferro',
        desc: 'The exiled general Camillus arrives mid-weighing: “Rome is ransomed with iron, not gold.” The Gauls are driven out.',
        note: 'As Livy tells it, though many historians doubt it.',
        effects: [{ type: 'click', mult: 2 }, { type: 'building', building: 'century', mult: 2 }],
      },
    ],
  },
  {
    id: 'appia',
    numeral: 'IV',
    year: '312 BC',
    title: 'The Queen of Roads',
    motto: 'Regina viarum',
    icon: aqueduct,
    at: 25000,
    text: [
      'The censor Appius Claudius Caecus began two works that would define Rome. The first was a paved road running south to Capua, the Via Appia, later called the “queen of roads”. Parts of it are still walked today.',
      'The second was the Aqua Appia, Rome’s first aqueduct. It carried spring water more than sixteen kilometres into the city, almost all of it underground. Roads and water would follow Rome wherever its legions went.',
    ],
    effects: [{ type: 'building', building: 'aqueduct', mult: 2 }, { type: 'building', building: 'amphora', mult: 2 }],
  },
  {
    id: 'navy',
    numeral: 'V',
    year: '260 BC',
    title: 'Rome Takes to the Sea',
    motto: 'Mare nostrum',
    icon: trireme,
    at: 250000,
    text: [
      'War with Carthage, the great sea power of Africa, found Rome with almost no navy. Copying a Carthaginian warship that had run aground, Romans built a fleet of over a hundred ships in about sixty days, training rowers on benches set up on dry land.',
      'They added the corvus, a spiked boarding bridge that let legionaries turn a sea fight into a land battle. At Mylae in 260 BC the consul Gaius Duilius won Rome’s first great naval victory.',
    ],
    effects: [{ type: 'building', building: 'trireme', mult: 3 }],
  },
  {
    id: 'hannibal',
    numeral: 'VI',
    year: '216 BC',
    title: 'Hannibal at the Gates',
    motto: 'Hannibal ad portas',
    icon: elephant,
    at: 2e6,
    text: [
      'Hannibal of Carthage crossed the Alps with an army and war elephants and destroyed Roman forces at the Trebia and Lake Trasimene. At Cannae he encircled a far larger Roman army and annihilated it, perhaps the bloodiest single day in Rome’s history.',
      'Rome refused to make peace. In these desperate years, around 211 BC, the state began striking a new silver coin: the denarius. How should Rome fight on?',
    ],
    choices: [
      {
        id: 'fabius',
        label: 'Fabius the Delayer',
        desc: 'Avoid pitched battle. Shadow Hannibal, cut his supplies and let time grind him down.',
        note: 'Rome adopted this strategy after Cannae and earned Fabius the name Cunctator.',
        effects: [{ type: 'global', mult: 1.2 }],
      },
      {
        id: 'scipio',
        label: 'Scipio to Africa',
        desc: 'Carry the war to Carthage itself and force Hannibal home to defend it.',
        note: 'Scipio did exactly this, defeating Hannibal at Zama in 202 BC.',
        effects: [{ type: 'click', mult: 3 }, { type: 'building', building: 'barracks', mult: 2 }],
      },
    ],
  },
  {
    id: 'carthage',
    numeral: 'VII',
    year: '146 BC',
    title: 'Carthago Delenda Est',
    motto: 'Carthage must be destroyed',
    icon: ruins,
    at: 1.5e7,
    text: [
      'For years Cato the Elder ended every speech in the Senate, whatever its subject, with the same words: “Carthage must be destroyed.” In 146 BC, after a three-year siege, Scipio Aemilianus razed the city. That same year Roman armies sacked Corinth.',
      'The Mediterranean was becoming what Romans called mare nostrum, “our sea”. (The story that Rome sowed Carthage’s fields with salt is a modern invention.)',
    ],
    effects: [{ type: 'building', building: 'amphora', mult: 2 }, { type: 'global', mult: 1.1 }],
  },
  {
    id: 'marius',
    numeral: 'VIII',
    year: '107 BC',
    title: 'The Mules of Marius',
    motto: 'Muli Mariani',
    icon: helmet,
    at: 1e8,
    text: [
      'Gaius Marius, a “new man” with no noble ancestors, would be consul seven times. Tradition credits him with remaking the legion: the landless poor could now enlist, armed by the state and promised land on retirement.',
      'His soldiers carried their own heavy kit and were nicknamed “Marius’s mules”. Each legion took the silver eagle, the aquila, as its sacred standard. But soldiers now looked to their general rather than the Senate for their reward, a danger that would soon come true.',
    ],
    effects: [{ type: 'building', building: 'century', mult: 3 }, { type: 'building', building: 'barracks', mult: 2 }],
  },
  {
    id: 'rubicon',
    numeral: 'IX',
    year: '49 BC',
    title: 'The Rubicon',
    motto: 'Alea iacta est',
    icon: dice,
    at: 5e8,
    text: [
      'Julius Caesar has conquered Gaul and his legions adore him. His enemies in the Senate order him to give up his army and return to Rome as a private citizen, where prosecution awaits.',
      'In January of 49 BC he halts at the Rubicon, the small river marking the edge of his province. To cross it under arms is treason, and it means civil war.',
    ],
    choices: [
      {
        id: 'cross',
        label: 'Alea iacta est',
        desc: '“The die is cast.” Cross the river and march on Rome.',
        note: 'Caesar crossed. Pompey and much of the Senate fled within days.',
        effects: [{ type: 'click', mult: 3 }, { type: 'global', mult: 1.1 }],
      },
      {
        id: 'obey',
        label: 'Obey the Senate',
        desc: 'Lay down command and trust the old Republic to endure.',
        note: 'Caesar did not. Historians still debate whether the Republic could have survived if he had.',
        effects: [{ type: 'building', building: 'senate', mult: 3 }, { type: 'building', building: 'forum', mult: 2 }],
      },
    ],
  },
  {
    id: 'ides',
    numeral: 'X',
    year: '44 BC',
    title: 'The Ides of March',
    motto: 'Kai su, teknon?',
    icon: dagger,
    at: 2e9,
    text: [
      'Made dictator for life, Caesar met the Senate on 15 March 44 BC in the Theatre of Pompey. A band of senators led by Brutus and Cassius drew daggers and stabbed him twenty-three times. “Et tu, Brute?” is Shakespeare’s line. Suetonius reports that some said Caesar spoke in Greek: “You too, child?”',
      'The assassins meant to save the Republic. Instead came thirteen more years of civil war. The Senate declared the murdered dictator a god, Divus Iulius, and a temple rose where his body was burned.',
    ],
    effects: [{ type: 'building', building: 'temple', mult: 2 }],
  },
  {
    id: 'augustus',
    numeral: 'XI',
    year: '27 BC',
    title: 'Augustus',
    motto: 'Pax Romana',
    icon: laurelCrown,
    at: 8e9,
    text: [
      'Caesar’s adopted heir Octavian defeated Antony and Cleopatra at Actium in 31 BC. In 27 BC the Senate granted him a new name: Augustus, “the revered one”. He called himself only princeps, “first citizen”, keeping the forms of the Republic while holding all its power.',
      'He boasted that he found Rome a city of brick and left it a city of marble. The doors of the Temple of Janus, open in time of war, were shut. Two centuries of the Pax Romana had begun.',
    ],
    effects: [{ type: 'global', mult: 1.25 }, { type: 'building', building: 'forum', mult: 2 }],
  },
  {
    id: 'colosseum',
    numeral: 'XII',
    year: 'AD 80',
    title: 'Bread and Circuses',
    motto: 'Panem et circenses',
    icon: swords,
    at: 4e10,
    text: [
      'Vespasian built a vast amphitheatre on the drained lake of Nero’s hated palace. His son Titus opened it in AD 80 with a hundred days of games. Some fifty thousand spectators watched gladiators, wild-beast hunts and executions.',
      'The poet Juvenal sneered that a people who once handed out armies and consulships now wanted only two things: bread and circuses. Fortune favors those who give the crowd what it craves.',
    ],
    effects: [{ type: 'omenRate', mult: 2 }, { type: 'click', mult: 2 }],
  },
  {
    id: 'trajan',
    numeral: 'XIII',
    year: 'AD 117',
    title: 'Optimus Princeps',
    motto: 'The best of emperors',
    icon: column,
    at: 2e11,
    text: [
      'Trajan, the first emperor born outside Italy, conquered Dacia, and its gold mines paid for a new Forum. His column still stands in Rome, its spiral frieze showing legions marching, building and firing their bolt-throwers.',
      'He pushed east to the Persian Gulf. At his death in AD 117 the empire reached its greatest size, from Britain to Mesopotamia. The Senate would wish each new emperor to be “luckier than Augustus, better than Trajan”.',
    ],
    effects: [{ type: 'global', mult: 1.25 }, { type: 'building', building: 'ballista', mult: 2 }],
  },
  {
    id: 'crisis',
    numeral: 'XIV',
    year: 'AD 235',
    title: 'The Crisis of the Third Century',
    motto: 'Imperium fractum',
    icon: brokenWall,
    at: 1e12,
    text: [
      'After the murder of Severus Alexander, the empire tore itself apart. In fifty years some two dozen men claimed the purple, most of them killed by their own troops. Plague, Persian and Gothic invasion followed. For a time the empire split into three.',
      'To pay the armies, emperors kept thinning the silver in the denarius until it was little more than bronze with a silver wash. Prices soared. How do you hold the empire together?',
    ],
    choices: [
      {
        id: 'debase',
        label: 'Debase the coinage',
        desc: 'Strike more coins with less silver. Easy money now, rot underneath.',
        note: 'The emperors of the crisis did exactly this.',
        effects: [{ type: 'click', mult: 4 }, { type: 'global', mult: 0.9 }],
      },
      {
        id: 'diocletian',
        label: 'The reforms of Diocletian',
        desc: 'Divide rule among four emperors, rebuild the army and the tax system from the ground up.',
        note: 'Diocletian ended the crisis from AD 284, though his famous price edict failed.',
        effects: [{ type: 'global', mult: 1.2 }],
      },
    ],
  },
  {
    id: 'constantine',
    numeral: 'XV',
    year: 'AD 330',
    title: 'Nova Roma',
    motto: 'In hoc signo vinces',
    icon: church,
    at: 6e12,
    text: [
      'Before the battle of the Milvian Bridge in 312, Constantine is said to have seen a sign in the sky and heard the words “In this sign you will conquer.” He won, and the next year the Edict of Milan granted Christians freedom of worship.',
      'In AD 330 he dedicated a new capital on the Bosporus, astride the trade routes between Europe and Asia: Nova Roma, soon known as Constantinople.',
    ],
    effects: [{ type: 'building', building: 'temple', mult: 3 }, { type: 'building', building: 'trireme', mult: 2 }],
  },
  {
    id: 'fall',
    numeral: 'XVI',
    year: 'AD 476',
    title: 'The Fall of the West',
    motto: 'Sic transit gloria mundi',
    icon: castleRuins,
    at: 4e13,
    text: [
      'In 410 Alaric’s Visigoths sacked Rome, the first foreign army inside its walls since Brennus eight hundred years before. In 476 the general Odoacer deposed the boy emperor Romulus Augustulus, named for both Rome’s founder and its first emperor, and sent the imperial regalia to Constantinople. The West had no emperor.',
      'Yet Rome did not end. Its law, its language and its roads outlived it, and in the East the empire endured another thousand years, until 1453. Your reign is now history. Ascend to the purple, and let Rome rise again.',
    ],
    effects: [],
  },
]

export const CHAPTERS_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]))

export function chapterEffects(chapter, choiceId) {
  if (!chapter.choices) return chapter.effects
  return chapter.choices.find((c) => c.id === choiceId)?.effects ?? []
}

export const DYNASTIES = [
  'House of Romulus',
  'Julio-Claudian',
  'Flavian',
  'Nerva-Antonine',
  'Severan',
  'Constantinian',
  'Valentinianic',
  'Theodosian',
  'Justinian',
  'Heraclian',
  'Macedonian',
  'Komnenian',
  'Palaiologan',
]

const NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function dynastyName(ascensions, names = DYNASTIES) {
  const base = names[ascensions % names.length]
  const cycle = Math.floor(ascensions / names.length)
  return cycle === 0 ? base : `${base} ${NUMERALS[Math.min(cycle + 1, 10)]}`
}
