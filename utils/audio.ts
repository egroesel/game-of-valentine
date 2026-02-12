let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let _volume = 1.0

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = _volume
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function out(): AudioNode {
  getCtx()
  return masterGain!
}

/** Set master volume (0–1) for all sound effects */
export function setSfxVolume(v: number) {
  _volume = Math.max(0, Math.min(1, v))
  if (masterGain) masterGain.gain.value = _volume
}

/** Get current master volume */
export function getSfxVolume(): number {
  return _volume
}

/** Short punchy thump — noise burst + low sine */
export function playPunch() {
  const ac = getCtx()
  const now = ac.currentTime

  // Noise burst
  const bufferSize = ac.sampleRate * 0.06
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const noise = ac.createBufferSource()
  noise.buffer = buffer

  const noiseFilter = ac.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.value = 400

  const noiseGain = ac.createGain()
  noiseGain.gain.setValueAtTime(0.35, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  noise.connect(noiseFilter).connect(noiseGain).connect(out())
  noise.start(now)
  noise.stop(now + 0.08)

  // Low thump oscillator
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)

  const oscGain = ac.createGain()
  oscGain.gain.setValueAtTime(0.4, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

  osc.connect(oscGain).connect(out())
  osc.start(now)
  osc.stop(now + 0.1)
}

/** High beep for countdown ticks (3, 2, 1) */
export function playCountdownBeep() {
  const ac = getCtx()
  const now = ac.currentTime

  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 880

  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

  osc.connect(gain).connect(out())
  osc.start(now)
  osc.stop(now + 0.2)
}

/** Deeper, stronger tone for "Los!" */
export function playGo() {
  const ac = getCtx()
  const now = ac.currentTime

  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 440

  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.35, now)
  gain.gain.linearRampToValueAtTime(0.3, now + 0.15)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

  osc.connect(gain).connect(out())
  osc.start(now)
  osc.stop(now + 0.35)
}

/** Rising three-tone jingle for level complete */
export function playLevelComplete() {
  const ac = getCtx()
  const now = ac.currentTime
  const notes = [523, 659, 784] // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const gain = ac.createGain()
    const t = now + i * 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.3, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)

    osc.connect(gain).connect(out())
    osc.start(t)
    osc.stop(t + 0.25)
  })
}

/** Descending three-tone for game over */
export function playGameOver() {
  const ac = getCtx()
  const now = ac.currentTime
  const notes = [392, 311, 261] // G4, Eb4, C4

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const gain = ac.createGain()
    const t = now + i * 0.18
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)

    osc.connect(gain).connect(out())
    osc.start(t)
    osc.stop(t + 0.35)
  })
}
