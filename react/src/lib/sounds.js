// Synthesised sound effects (Web Audio), shared engine util.
// - playWarHorn(): the timer-completion blast, ported from the original.
// - installClickSounds(): a global capture-phase listener that plays a soft
//   "clunk" on button presses (skips text inputs).

export function playWarHorn() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const duration = 2.5
  const now = ctx.currentTime

  function makeHornTone(freq, gain, start, end) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.3)
    osc.frequency.setValueAtTime(freq * 1.02, now + end - 0.4)
    osc.frequency.linearRampToValueAtTime(freq * 0.98, now + end)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 4.5
    lfoGain.gain.value = freq * 0.015
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    lfo.start(now + start)
    lfo.stop(now + end)
    g.gain.setValueAtTime(0, now + start)
    g.gain.linearRampToValueAtTime(gain, now + start + 0.4)
    g.gain.setValueAtTime(gain, now + end - 0.6)
    g.gain.linearRampToValueAtTime(0, now + end)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(now + start)
    osc.stop(now + end)
  }

  function makeNoiseBurst() {
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 180
    bandpass.Q.value = 2
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.12, now + 0.05)
    g.gain.linearRampToValueAtTime(0, now + 0.4)
    source.connect(bandpass)
    bandpass.connect(g)
    g.connect(ctx.destination)
    source.start(now)
    source.stop(now + 0.5)
  }

  makeHornTone(110, 0.25, 0, duration)
  makeHornTone(165, 0.12, 0, duration)
  makeHornTone(220, 0.06, 0.1, duration - 0.2)
  makeNoiseBurst()
  setTimeout(() => {
    makeHornTone(110, 0.2, 0, 1.5)
    makeHornTone(165, 0.1, 0, 1.5)
    makeNoiseBurst()
  }, (duration + 0.3) * 1000)
  setTimeout(() => ctx.close(), (duration + 2.5) * 1000)
}

// --- click sounds ---
let _ctx = null
const audioCtx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function clunk() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  // low thump
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150 + Math.random() * 30, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.08)
  g.gain.setValueAtTime(0.18, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.13)
}

let _installed = false
export function installClickSounds() {
  if (_installed) return
  _installed = true
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest('button, .btn, .select-card, .pip, .chip')
      if (!el) return
      try { clunk() } catch { /* ignore audio errors */ }
    },
    true,
  )
}
