// A generative "sword and sandal" score synthesized with the Web Audio API.
// Nothing is pre-recorded. The ensemble:
//   aulos (tibia)  reed double-pipe: one pipe drones, the other sings the melody
//   cornu          the legion's bronze horn, sounding fanfares between phrases
//   lyre           broken-chord accompaniment
//   drums          a deep war drum and a frame drum in march time
// Everything is in the Phrygian dominant mode (D Eb F# G A Bb C), the sound
// most listeners hear as the ancient Mediterranean.

const BPM = 80
const EIGHTH = 60 / BPM / 2
const LOOKAHEAD_S = 0.4
const SCHEDULER_MS = 60

const ROOT_MIDI = 50 // D3
const MODE = [0, 1, 4, 5, 7, 8, 10] // Phrygian dominant

// chord roots as scale degrees: I–bII–I–bII, I–iv–bII–I, I–vii–bII–I, I–iv–I–bII
const PROGRESSIONS = [
  [0, 1, 0, 1],
  [0, 3, 1, 0],
  [0, 6, 1, 0],
  [0, 3, 0, 1],
]

// melody rhythms as note lengths in eighths per bar (0 = rest of that length)
const PHRASES = [
  [3, 1, 2, 2],
  [2, 1, 1, 4],
  [1, 1, 2, 4],
  [4, 2, 2],
  [2, 2, 1, 1, 2],
  [6, 2],
]

// cornu calls: [scale degree offset from the tonic, length in eighths]
const FANFARES = [
  [[4, 1], [4, 1], [7, 2], [4, 1], [7, 1], [9, 6]],
  [[0, 1], [4, 1], [7, 4], [7, 1], [9, 1], [7, 4]],
  [[7, 2], [7, 1], [7, 1], [9, 4], [7, 2], [4, 6]],
]

const MELODY_LOW = 7 // D4
const MELODY_HIGH = 16 // Eb5... up to an octave and a bit

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12)
const degreeToMidi = (d) => ROOT_MIDI + 12 * Math.floor(d / 7) + MODE[((d % 7) + 7) % 7]
const pick = (list) => list[Math.floor(Math.random() * list.length)]

function impulseResponse(ctx, seconds = 3.2, decay = 2.6) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay
  }
  return buffer
}

class Music {
  enabled = false
  volume = 0.5
  unlocked = false
  ctx = null
  timer = null
  drone = null

  bar = 0
  slot = 0
  phrase = 0
  nextTime = 0
  progression = PROGRESSIONS[0]
  section = 'full' // 'fanfare' | 'full' | 'quiet'
  melody = MELODY_LOW + 2
  melodyFreeAt = 0 // melody slot index (within the phrase) when the current note ends
  fanfare = null

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.#update())
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled
    this.#update()
  }

  setVolume(volume) {
    this.volume = volume
    if (this.master) this.master.gain.setTargetAtTime(this.#gain(), this.ctx.currentTime, 0.15)
  }

  // Browsers only allow audio after a user gesture; call this from one.
  unlock() {
    if (this.unlocked) return
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext
    if (!AudioCtx) return
    this.unlocked = true
    this.#build(new AudioCtx())
    this.#update()
  }

  #gain() {
    return this.volume ** 2 * 0.75 // perceptual curve
  }

  #build(ctx) {
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.ratio.value = 3.5
    this.master.connect(comp).connect(ctx.destination)

    this.dry = ctx.createGain()
    this.dry.connect(this.master)
    const reverb = ctx.createConvolver()
    reverb.buffer = impulseResponse(ctx)
    this.wet = ctx.createGain()
    this.wet.gain.value = 0.42
    this.wet.connect(reverb).connect(this.master)
  }

  #update() {
    if (!this.ctx) return
    const play = this.enabled && document.visibilityState === 'visible'
    if (play && !this.timer) this.#start()
    else if (!play && this.timer) this.#stop()
  }

  #start() {
    const ctx = this.ctx
    ctx.resume()
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setTargetAtTime(this.#gain(), ctx.currentTime, 0.5)
    this.#startDrone()
    // open every session with the horns
    this.bar = 0
    this.slot = 0
    this.section = 'fanfare'
    this.fanfare = this.#fanfareNotes(pick(FANFARES))
    this.nextTime = ctx.currentTime + 0.15
    this.timer = setInterval(() => this.#schedule(), SCHEDULER_MS)
  }

  #stop() {
    const ctx = this.ctx
    clearInterval(this.timer)
    this.timer = null
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
    const drone = this.drone
    this.drone = null
    setTimeout(() => {
      drone?.forEach((node) => node.stop())
      if (!this.timer) ctx.suspend()
    }, 1500)
  }

  // --- the score -----------------------------------------------------------

  #schedule() {
    const ctx = this.ctx
    // after a stall (background tab, slow frame) skip ahead rather than cram notes
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      this.#playSlot(this.nextTime)
      this.nextTime += EIGHTH
      this.slot = (this.slot + 1) % 8
      if (this.slot === 0) this.#nextBar()
    }
  }

  #nextBar() {
    this.bar = (this.bar + 1) % 4
    if (this.bar !== 0) return
    this.phrase++
    this.progression = pick(PROGRESSIONS)
    // horns every few phrases, a breath of quiet now and then, otherwise the full band
    const r = Math.random()
    this.section = this.phrase % 4 === 0 || r < 0.12 ? 'fanfare' : r < 0.3 ? 'quiet' : 'full'
    this.fanfare = this.section === 'fanfare' ? this.#fanfareNotes(pick(FANFARES)) : null
    this.melodyFreeAt = 0
  }

  #fanfareNotes(call) {
    // flatten a call into { slot: [degree, length] } across the phrase
    const notes = {}
    let at = 0
    for (const [degree, length] of call) {
      notes[at] = [degree, length]
      at += length
    }
    return notes
  }

  #playSlot(time) {
    const root = this.progression[this.bar]
    const chord = [root, root + 2, root + 4]
    const phraseSlot = this.bar * 8 + this.slot
    const loud = this.section !== 'quiet'

    // drums: war drum on the downbeat, frame drum answering in march time
    if (loud) {
      if (this.slot === 0) this.#warDrum(time, this.bar === 0 ? 0.55 : 0.4)
      if (this.slot === 4 && this.section === 'full' && Math.random() < 0.5) this.#warDrum(time, 0.25)
      if (this.slot === 2 || this.slot === 3 || this.slot === 6) this.#frameDrum(time, this.slot === 6 ? 0.1 : 0.06)
    } else if (this.slot === 0 && this.bar % 2 === 0) {
      this.#warDrum(time, 0.22)
    }

    // lyre: a broken chord climbing through each bar
    if (this.slot % 2 === 0) {
      const pattern = [chord[0], chord[2], chord[1] + 7, chord[2]]
      this.#lyre(degreeToMidi(pattern[this.slot / 2]) - 12, time, this.slot === 0 ? 0.2 : 0.12)
    }

    if (this.section === 'fanfare') {
      const note = this.fanfare?.[phraseSlot]
      if (note) this.#cornu(degreeToMidi(note[0]), time, note[1] * EIGHTH * 0.95, note[1] >= 4)
      return
    }

    // aulos melody, composed note by note
    if (phraseSlot >= this.melodyFreeAt) {
      const lengths = this.slot === 0 ? pick(PHRASES) : [pick([1, 2, 2, 3])]
      const length = Math.min(lengths[0], 8 - this.slot + (this.bar < 3 ? 8 : 0))
      const lastNote = this.bar === 3 && this.slot >= 4
      const strong = this.slot === 0 || this.slot === 4
      if (lastNote) this.melody = this.#nearest(this.melody, [7, 11, 14]) // home: D, A, D
      else this.melody = this.#step(this.melody, chord, strong)
      const rest = !lastNote && this.section === 'quiet' && Math.random() < 0.35
      if (!rest) this.#aulos(degreeToMidi(this.melody), time, length * EIGHTH, strong)
      this.melodyFreeAt = phraseSlot + (lastNote ? 99 : length)
    }
  }

  // wander mostly by step; land on chord tones on strong beats
  #step(current, chord, strong) {
    const r = Math.random()
    const move = r < 0.32 ? 1 : r < 0.66 ? -1 : r < 0.8 ? 2 : r < 0.92 ? -2 : pick([3, -3, 4])
    let next = Math.min(MELODY_HIGH, Math.max(MELODY_LOW, current + move))
    if (strong && Math.random() < 0.75) next = this.#nearest(next, chord.flatMap((d) => [d + 7, d + 14]))
    return next
  }

  #nearest(target, options) {
    return options
      .filter((d) => d >= MELODY_LOW && d <= MELODY_HIGH)
      .reduce((best, d) => (Math.abs(d - target) < Math.abs(best - target) ? d : best), target)
  }

  // --- instruments ---------------------------------------------------------

  #out(node, wet = 1) {
    node.connect(this.dry)
    if (wet > 0) {
      const send = this.ctx.createGain()
      send.gain.value = wet
      node.connect(send).connect(this.wet)
    }
  }

  // The aulos drone pipe: reedy, nasal, always sounding the tonic.
  #startDrone() {
    const ctx = this.ctx
    const body = ctx.createBiquadFilter()
    body.type = 'bandpass'
    body.frequency.value = 900
    body.Q.value = 0.9
    const soft = ctx.createBiquadFilter()
    soft.type = 'lowpass'
    soft.frequency.value = 1800
    const gain = ctx.createGain()
    gain.gain.value = 0.05
    body.connect(soft).connect(gain)
    this.#out(gain, 0.8)

    const nodes = [ROOT_MIDI, ROOT_MIDI - 12].map((m, i) => {
      const osc = ctx.createOscillator()
      osc.type = i ? 'sawtooth' : 'square'
      osc.frequency.value = midiToHz(m)
      osc.detune.value = i ? -5 : 3
      const g = ctx.createGain()
      g.gain.value = i ? 0.6 : 0.35
      osc.connect(g).connect(body)
      osc.start()
      return osc
    })
    // breath: a slow wobble in the drone's loudness
    const breath = ctx.createOscillator()
    const depth = ctx.createGain()
    breath.frequency.value = 0.18
    depth.gain.value = 0.012
    breath.connect(depth).connect(gain.gain)
    breath.start()
    this.drone = [...nodes, breath]
  }

  // The melody pipe: two slightly detuned reeds, vibrato that blooms, and a
  // grace note flicked in from above, the way double-pipe players ornament.
  #aulos(midi, time, length, accent) {
    const ctx = this.ctx
    const freq = midiToHz(midi)
    const end = time + length

    const body = ctx.createBiquadFilter()
    body.type = 'bandpass'
    body.frequency.value = Math.min(freq * 2.2, 2600)
    body.Q.value = 1.1
    const amp = ctx.createGain()
    const level = accent ? 0.2 : 0.16
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(level, time + 0.06)
    amp.gain.setValueAtTime(level, Math.max(time + 0.06, end - 0.08))
    amp.gain.exponentialRampToValueAtTime(0.0001, end + 0.12)
    body.connect(amp)
    this.#out(amp, 1)

    const vibrato = ctx.createOscillator()
    const vibratoDepth = ctx.createGain()
    vibrato.frequency.value = 5.4
    vibratoDepth.gain.setValueAtTime(0, time)
    vibratoDepth.gain.linearRampToValueAtTime(length > 0.4 ? 14 : 4, time + Math.min(length, 0.5))
    vibrato.connect(vibratoDepth)

    const grace = length > 0.3 && Math.random() < 0.45
    for (const [type, detune, level2] of [
      ['sawtooth', -6, 0.5],
      ['square', 6, 0.3],
    ]) {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.detune.value = detune
      if (grace) {
        osc.frequency.setValueAtTime(midiToHz(midi + 2), time)
        osc.frequency.setValueAtTime(freq, time + 0.07)
      } else {
        osc.frequency.setValueAtTime(freq * 0.985, time) // reeds scoop up into pitch
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05)
      }
      vibratoDepth.connect(osc.detune)
      const g = ctx.createGain()
      g.gain.value = level2
      osc.connect(g).connect(body)
      osc.start(time)
      osc.stop(end + 0.15)
    }
    vibrato.start(time)
    vibrato.stop(end + 0.15)
  }

  // The cornu: bright bronze, a brassy blat as the filter opens, a slight lip
  // bend up into the note. Long notes swell.
  #cornu(midi, time, length, swell) {
    const ctx = this.ctx
    const freq = midiToHz(midi)
    const end = time + length
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 2
    filter.frequency.setValueAtTime(freq * 1.5, time)
    filter.frequency.exponentialRampToValueAtTime(freq * (swell ? 7 : 5), time + (swell ? 0.35 : 0.08))
    filter.frequency.exponentialRampToValueAtTime(freq * 3, end)

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(0.22, time + 0.04)
    if (swell) amp.gain.linearRampToValueAtTime(0.3, time + length * 0.6)
    amp.gain.setValueAtTime(swell ? 0.3 : 0.2, Math.max(time + 0.05, end - 0.06))
    amp.gain.exponentialRampToValueAtTime(0.0001, end + 0.18)
    filter.connect(amp)
    this.#out(amp, 1.2)

    // two horns in unison and one an octave below, as a section would sound
    for (const [ratio, detune, level] of [
      [1, -7, 0.45],
      [1, 7, 0.45],
      [0.5, 0, 0.35],
    ]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.detune.setValueAtTime(detune - 35, time)
      osc.detune.linearRampToValueAtTime(detune, time + 0.06)
      osc.frequency.value = freq * ratio
      const g = ctx.createGain()
      g.gain.value = level
      osc.connect(g).connect(filter)
      osc.start(time)
      osc.stop(end + 0.25)
    }
  }

  // A plucked lyre string: a few harmonics through a closing filter.
  #lyre(midi, time, velocity) {
    const ctx = this.ctx
    const freq = midiToHz(midi)
    const length = 1.6
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(freq * 8, 6000), time)
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 250), time + 0.3)
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(velocity, time + 0.004)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + length)
    filter.connect(amp)
    this.#out(amp, 0.7)
    for (const [ratio, level] of [
      [1, 1],
      [2, 0.3],
      [3, 0.1],
    ]) {
      const osc = ctx.createOscillator()
      osc.type = ratio === 1 ? 'triangle' : 'sine'
      osc.frequency.value = freq * ratio
      const g = ctx.createGain()
      g.gain.value = level
      osc.connect(g).connect(filter)
      osc.start(time)
      osc.stop(time + length + 0.05)
    }
  }

  // A deep war drum: a falling boom with a thump of skin.
  #warDrum(time, velocity) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, time)
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.25)
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(velocity, time + 0.006)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.9)
    osc.connect(amp)
    this.#out(amp, 0.6)
    osc.start(time)
    osc.stop(time + 1)
    this.#noise(time, 400, velocity * 0.25, 0.08)
  }

  // A frame drum tapped at the rim.
  #frameDrum(time, velocity) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, time)
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.08)
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(velocity, time + 0.004)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.14)
    osc.connect(amp)
    this.#out(amp, 0.5)
    osc.start(time)
    osc.stop(time + 0.2)
    this.#noise(time, 2200, velocity * 0.8, 0.04)
  }

  #noise(time, frequency, level, length) {
    const ctx = this.ctx
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = frequency
    const g = ctx.createGain()
    g.gain.setValueAtTime(level, time)
    g.gain.exponentialRampToValueAtTime(0.0001, time + length)
    src.connect(band).connect(g)
    this.#out(g, 0.3)
    src.start(time)
    src.stop(time + length + 0.02)
  }
}

export const music = new Music()
