// Interface sounds, synthesized with Web Audio. They use their own context so
// muting the music (which suspends its context) never silences them.

class Sfx {
  enabled = true
  volume = 0.5
  ctx = null

  setEnabled(enabled) {
    this.enabled = enabled
  }

  setVolume(volume) {
    this.volume = volume
    if (this.out) this.out.gain.value = this.#gain()
  }

  // Browsers only allow audio after a user gesture; call this from one.
  unlock() {
    if (this.ctx) {
      this.ctx.resume()
      return
    }
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext
    if (!AudioCtx) return
    this.ctx = new AudioCtx()
    this.out = this.ctx.createGain()
    this.out.gain.value = this.#gain()
    this.out.connect(this.ctx.destination)
  }

  #gain() {
    return this.volume ** 2 * 1.4
  }

  #ready() {
    if (!this.enabled || !this.ctx) return false
    // a context born in this very gesture can still be starting up; sounds
    // scheduled now play the moment it resumes
    if (this.ctx.state !== 'running') this.ctx.resume()
    return true
  }

  // a struck silver coin: inharmonic partials ringing out at different rates
  coin() {
    if (!this.#ready()) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const base = 2100 + Math.random() * 500
    for (const [ratio, level, decay] of [
      [1, 0.22, 0.45],
      [2.76, 0.12, 0.3],
      [5.4, 0.07, 0.18],
      [8.93, 0.04, 0.1],
    ]) {
      this.#tone(base * ratio, t, level, decay, 'sine')
    }
    this.#noise(t, 6000, 0.08, 0.02, 'highpass')
  }

  // a sheet of parchment unrolled: a swish with a crinkle of tiny crackles
  paper() {
    if (!this.#ready()) return
    const t = this.ctx.currentTime
    this.#noise(t, 1800, 0.12, 0.35, 'bandpass', 0.7, 0.12)
    for (let i = 0; i < 9; i++) {
      this.#noise(t + 0.02 + Math.random() * 0.32, 2500 + Math.random() * 3500, 0.05 + Math.random() * 0.07, 0.025, 'bandpass', 3)
    }
  }

  // stone and timber set in place, and a coin paid for it
  build() {
    if (!this.#ready()) return
    const t = this.ctx.currentTime
    this.#thump(t, 160, 70, 0.4, 0.22)
    this.#noise(t, 1100, 0.14, 0.06, 'bandpass', 1.5)
    this.#tone(2600 + Math.random() * 300, t + 0.07, 0.07, 0.25, 'sine')
  }

  // a wax seal pressed onto an edict
  edict() {
    if (!this.#ready()) return
    const t = this.ctx.currentTime
    this.#thump(t, 120, 55, 0.45, 0.28)
    this.#noise(t, 600, 0.12, 0.08, 'lowpass')
    this.#noise(t + 0.06, 2200, 0.06, 0.18, 'bandpass', 0.8, 0.04)
  }

  // the favour of Fortuna: a rising shimmer of bells
  omen() {
    if (!this.#ready()) return
    const t = this.ctx.currentTime
    ;[1174.7, 1760, 2349.3, 2637].forEach((f, i) => {
      this.#tone(f, t + i * 0.07, 0.1, 1.2, 'sine')
      this.#tone(f * 2.01, t + i * 0.07, 0.025, 0.6, 'sine')
    })
  }

  #tone(freq, time, level, decay, type) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(level, time + 0.003)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + decay)
    osc.connect(amp).connect(this.out)
    osc.start(time)
    osc.stop(time + decay + 0.05)
  }

  #thump(time, from, to, level, decay) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(from, time)
    osc.frequency.exponentialRampToValueAtTime(to, time + decay * 0.6)
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(level, time + 0.004)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + decay)
    osc.connect(amp).connect(this.out)
    osc.start(time)
    osc.stop(time + decay + 0.05)
  }

  #noise(time, frequency, level, length, type = 'bandpass', q = 1, attack = 0.002) {
    const ctx = this.ctx
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = 0.8 + Math.random() * 0.4
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = q
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(level, time + attack)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + attack + length)
    src.connect(filter).connect(amp).connect(this.out)
    src.start(time, Math.random() * 0.5)
    src.stop(time + attack + length + 0.05)
  }
}

export const sfx = new Sfx()
