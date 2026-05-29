// bsc-voice-wasm.worklet.js — AudioWorklet DSP for the "AudioWorklet + WASM"
// audio engine.
//
// Identical voice model to bsc-voice.worklet.js, but the per-sample sine
// oscillator (the hottest inner loop) runs in WebAssembly: render_osc() in
// bsc-osc.wasm advances phase and writes a block via 4096-point sine-LUT
// interpolation. Envelope shaping, gain, panning and stereo mixing stay in JS.
//
// The host engine fetches bsc-osc.wasm on the main thread and posts the bytes
// in; the processor compiles and instantiates them against memory it owns. As
// with every BSC worklet: plain static script (never bundled), no allocation in
// process(), and AudioContext.currentTime remains the only clock.

'use strict'

const TWO_PI = Math.PI * 2
const TABLE = 4096

// Memory layout shared with bsc-osc.wat:
//   [0, 16384)      sine LUT (4096 × f32)
//   [16384, 16896)  scratch block L (128 × f32)
//   [16896, 17408)  scratch block R (128 × f32)
const LUT_BYTES = TABLE * 4
const SCRATCH_L = LUT_BYTES
const SCRATCH_R = LUT_BYTES + 128 * 4

function envelopeValueAt(env, slotPhase) {
  const type = env.type || 'AR'
  const attackFrac = env.attackFrac != null ? env.attackFrac : 0.1
  const decayFrac = env.decayFrac != null ? env.decayFrac : 0
  const sustainLevel = env.sustainLevel != null ? env.sustainLevel : 1
  const releaseFrac = env.releaseFrac != null ? env.releaseFrac : 0.15
  const noteDurationFrac = env.noteDurationFrac != null ? env.noteDurationFrac : 0.5

  const nd = Math.max(0.01, Math.min(1, noteDurationFrac))
  if (slotPhase >= nd) return 0
  const np = slotPhase / nd
  if (type === 'square') return 1
  if (type === 'AD') {
    const a = Math.max(0.001, attackFrac)
    if (np < a) return np / a
    return Math.max(0, 1 - (np - a) / Math.max(0.001, 1 - a))
  }
  if (type === 'AR') {
    const a = Math.max(0.001, attackFrac)
    const r = Math.max(0.001, releaseFrac)
    const sustainEnd = 1 - r
    if (np < a) return np / a
    if (np < sustainEnd) return 1
    return Math.max(0, 1 - (np - sustainEnd) / r)
  }
  const a = Math.max(0.001, attackFrac)
  const d = Math.max(0.001, decayFrac)
  const r = Math.max(0.001, releaseFrac)
  const decayEnd = a + d
  const sustainEnd = 1 - r
  const sl = Math.max(0, Math.min(1, sustainLevel))
  if (np < a) return np / a
  if (np < decayEnd) return 1 - (1 - sl) * ((np - a) / d)
  if (np < sustainEnd) return sl
  return Math.max(0, sl * (1 - (np - sustainEnd) / r))
}

class BSCVoiceWasmProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 0.5, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
      { name: 'frequency', defaultValue: 200, minValue: 0, maxValue: 24000, automationRate: 'a-rate' },
      { name: 'pulseRate', defaultValue: 10, minValue: 0, maxValue: 200, automationRate: 'a-rate' },
      { name: 'pan', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
      { name: 'cutoff', defaultValue: 6000, minValue: 20, maxValue: 24000, automationRate: 'a-rate' },
      { name: 'leftFreq', defaultValue: 200, minValue: 0, maxValue: 24000, automationRate: 'a-rate' },
      { name: 'rightFreq', defaultValue: 200, minValue: 0, maxValue: 24000, automationRate: 'a-rate' },
    ]
  }

  constructor(options) {
    super()
    const opts = (options && options.processorOptions) || {}
    this._type = opts.voiceType || 'Carrier'
    this._env = opts.envelope || { type: 'AR', attackFrac: 0.1, releaseFrac: 0.15, noteDurationFrac: 0.5 }
    this._noiseColor = opts.noiseColor || 'pink'

    this._phase = 0
    this._phaseL = 0
    this._phaseR = 0
    this._slot = 0

    // Noise filter state (broadband voices don't use the WASM oscillator).
    this._b0 = 0; this._b1 = 0; this._b2 = 0; this._b3 = 0
    this._b4 = 0; this._b5 = 0; this._b6 = 0
    this._brown = 0
    this._lp = 0

    // Own the linear memory the WASM kernel reads/writes; fill the sine LUT.
    this._memory = new WebAssembly.Memory({ initial: 1 })
    this._lut = new Float32Array(this._memory.buffer, 0, TABLE)
    for (let i = 0; i < TABLE; i += 1) this._lut[i] = Math.sin((TWO_PI * i) / TABLE)
    this._scratchL = new Float32Array(this._memory.buffer, SCRATCH_L, 128)
    this._scratchR = new Float32Array(this._memory.buffer, SCRATCH_R, 128)

    this._render = null // set once WASM is instantiated
    this._ready = false

    this.port.onmessage = (event) => {
      const data = event.data || {}
      if (data.type === 'envelope' && data.envelope) {
        this._env = data.envelope
      } else if (data.type === 'wasm' && data.bytes) {
        WebAssembly.instantiate(data.bytes, { env: { memory: this._memory } })
          .then((result) => {
            this._render = result.instance.exports.render_osc
            this._ready = true
            this.port.postMessage({ type: 'ready' })
          })
          .catch((err) => {
            this.port.postMessage({ type: 'error', message: String(err) })
          })
      }
    }
  }

  process(_inputs, outputs, parameters) {
    const out = outputs[0]
    if (!out || out.length === 0) return true
    const outL = out[0]
    const outR = out.length > 1 ? out[1] : out[0]
    const n = outL.length

    // Noise voices are broadband — generated in JS regardless of WASM state
    // (the WASM kernel only renders the tonal sine oscillator).
    if (this._type === 'Noise') {
      const srN = sampleRate
      const invSrN = 1 / srN
      const gainP = parameters.gain
      const panP = parameters.pan
      const cutP = parameters.cutoff
      const gC = gainP.length === 1
      const paC = panP.length === 1
      const color = this._noiseColor
      const cutoff = Math.min(cutP[0], srN * 0.45)
      const alpha = 1 - Math.exp(-2 * Math.PI * cutoff * invSrN)
      let lp = this._lp
      let b0 = this._b0, b1 = this._b1, b2 = this._b2, b3 = this._b3
      let b4 = this._b4, b5 = this._b5, b6 = this._b6, brown = this._brown
      for (let i = 0; i < n; i += 1) {
        const white = Math.random() * 2 - 1
        let x
        if (color === 'white') {
          x = white
        } else if (color === 'brown') {
          brown = (brown + 0.02 * white) / 1.02
          x = brown * 3.5
        } else {
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          x = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
          b6 = white * 0.115926
        }
        lp += alpha * (x - lp)
        const g = gC ? gainP[0] : gainP[i]
        const pan = paC ? panP[0] : panP[i]
        const s = lp * g
        const a = (pan + 1) * (Math.PI / 4)
        outL[i] = s * Math.cos(a)
        outR[i] = s * Math.sin(a)
      }
      this._lp = lp
      this._b0 = b0; this._b1 = b1; this._b2 = b2; this._b3 = b3
      this._b4 = b4; this._b5 = b5; this._b6 = b6; this._brown = brown
      return true
    }

    // Until the WASM module is live, emit silence (a few ms during startup).
    if (!this._ready) {
      for (let i = 0; i < n; i += 1) { outL[i] = 0; outR[i] = 0 }
      return true
    }

    const sr = sampleRate
    const invSr = 1 / sr
    const render = this._render

    const gainP = parameters.gain
    const panP = parameters.pan
    const gC = gainP.length === 1
    const paC = panP.length === 1

    // Oscillator frequency is held constant across the 128-sample block (first
    // sample's value); per-sample gain/pan/envelope keep modulation smooth.
    if (this._type === 'BinauralBeat') {
      const lf = parameters.leftFreq[0]
      const rf = parameters.rightFreq[0]
      this._phaseL = render(SCRATCH_L, n, this._phaseL, lf * invSr)
      this._phaseR = render(SCRATCH_R, n, this._phaseR, rf * invSr)
      const sl = this._scratchL
      const srr = this._scratchR
      for (let i = 0; i < n; i += 1) {
        const g = gC ? gainP[0] : gainP[i]
        outL[i] = sl[i] * g
        outR[i] = srr[i] * g
      }
      return true
    }

    const f = parameters.frequency[0]
    this._phase = render(SCRATCH_L, n, this._phase, f * invSr)
    const sc = this._scratchL

    if (this._type === 'IsochronicTone') {
      const pulseP = parameters.pulseRate
      const pC = pulseP.length === 1
      const env = this._env
      let slot = this._slot
      for (let i = 0; i < n; i += 1) {
        const g = gC ? gainP[0] : gainP[i]
        const pan = paC ? panP[0] : panP[i]
        const pr = pC ? pulseP[0] : pulseP[i]
        const s = sc[i] * envelopeValueAt(env, slot) * g
        const a = (pan + 1) * (Math.PI / 4)
        outL[i] = s * Math.cos(a)
        outR[i] = s * Math.sin(a)
        slot += pr * invSr; if (slot >= 1) slot -= Math.floor(slot)
      }
      this._slot = slot
      return true
    }

    // Carrier
    for (let i = 0; i < n; i += 1) {
      const g = gC ? gainP[0] : gainP[i]
      const pan = paC ? panP[0] : panP[i]
      const s = sc[i] * g
      const a = (pan + 1) * (Math.PI / 4)
      outL[i] = s * Math.cos(a)
      outR[i] = s * Math.sin(a)
    }
    return true
  }
}

registerProcessor('bsc-voice-wasm', BSCVoiceWasmProcessor)
