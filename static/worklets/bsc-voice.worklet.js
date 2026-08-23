// bsc-voice.worklet.js — AudioWorklet DSP for the "AudioWorklet" audio engine.
//
// One BSCVoiceProcessor instance renders one voice (Carrier / IsochronicTone /
// BinauralBeat) entirely on the audio render thread. The main-thread engine
// (AudioWorkletEngine) drives every parameter through a-rate AudioParams, so
// AudioContext.currentTime remains the single timing authority — the processor
// never reads a wall clock and never schedules anything itself.
//
// Invariants (see CLAUDE.md §3.2, §3.3):
//   - This file is a plain static script, never bundled by Vite.
//   - process() allocates nothing: all state is pre-allocated in the
//     constructor and every loop reads pre-existing scalars / param arrays.

'use strict'

const TWO_PI = Math.PI * 2

// Isochronic envelope shape over one pulse slot, slotPhase in [0,1).
// Mirrors envelopeValueAt() in src/engines/audio/VanillaWebAudioEngine.js so the
// AudioWorklet engine sounds identical to the vanilla one. Kept inline because
// worklet scripts cannot import modules.
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
  // ADSR
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

class BSCVoiceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 0.5, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
      { name: 'frequency', defaultValue: 200, minValue: 0, maxValue: 24000, automationRate: 'a-rate' },
      { name: 'pulseRate', defaultValue: 10, minValue: 0, maxValue: 200, automationRate: 'a-rate' },
      { name: 'pan', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
      { name: 'cutoff', defaultValue: 6000, minValue: 20, maxValue: 24000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.707, minValue: 0.1, maxValue: 24, automationRate: 'a-rate' },
      { name: 'detune', defaultValue: 12, minValue: 0, maxValue: 100, automationRate: 'a-rate' },
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
    this._noiseFilter = opts.noiseFilter || 'lowpass'
    this._droneVoices = Math.max(1, Math.min(7, opts.droneVoices || 5))

    // Pre-allocated phase accumulators (cycles, [0,1)). No allocation in process().
    this._phase = 0
    this._phaseL = 0
    this._phaseR = 0
    this._slot = 0
    this._dronePhases = new Float32Array(8)
    this._droneIncs = new Float32Array(8)

    // Sample playback state (PCM posted from the main thread once decoded).
    this._sampleL = null
    this._sampleR = null
    this._sampleLen = 0
    this._samplePos = 0
    this._sampleStep = 1

    // Pre-allocated noise state: pink IIR taps, brown integrator, and the two
    // integrator states of a TPT state-variable filter (lowpass/bandpass/highpass).
    this._b0 = 0; this._b1 = 0; this._b2 = 0; this._b3 = 0
    this._b4 = 0; this._b5 = 0; this._b6 = 0
    this._brown = 0
    this._ic1 = 0; this._ic2 = 0

    // Tremolo / AM (applies to every voice type at the output stage).
    const trem = opts.tremolo || {}
    this._tremEnabled = !!trem.enabled
    this._tremRate = trem.rate != null ? trem.rate : 4
    this._tremDepth = trem.depth != null ? trem.depth : 0
    this._tremLinear = trem.mode === 'linear'
    this._tremPhase = 0

    this.port.onmessage = (event) => {
      const data = event.data || {}
      if (data.type === 'envelope' && data.envelope) {
        this._env = data.envelope
      } else if (data.type === 'tremolo' && data.tremolo) {
        const t = data.tremolo
        this._tremEnabled = !!t.enabled
        if (t.rate != null) this._tremRate = t.rate
        if (t.depth != null) this._tremDepth = t.depth
        this._tremLinear = t.mode === 'linear'
      } else if (data.type === 'sample' && data.left) {
        this._sampleL = data.left
        this._sampleR = data.right || data.left
        this._sampleLen = data.left.length
        this._samplePos = 0
        this._sampleStep = (data.sampleRate || sampleRate) / sampleRate
      }
    }
  }

  // Apply tremolo in place to a finished stereo block, then signal keep-alive.
  _finish(outL, outR, n) {
    if (this._tremEnabled && this._tremDepth > 0) {
      const depth = this._tremDepth
      const floor = Math.max(0.001, 1 - depth)
      const inc = this._tremRate / sampleRate
      let tph = this._tremPhase
      for (let i = 0; i < n; i += 1) {
        const lfo01 = 0.5 - 0.5 * Math.cos(TWO_PI * tph)
        const g = this._tremLinear ? (1 - depth * lfo01) : Math.pow(floor, lfo01)
        outL[i] *= g
        outR[i] *= g
        tph += inc; if (tph >= 1) tph -= Math.floor(tph)
      }
      this._tremPhase = tph
    }
    return true
  }

  process(_inputs, outputs, parameters) {
    const out = outputs[0]
    if (!out || out.length === 0) return true
    const outL = out[0]
    const outR = out.length > 1 ? out[1] : out[0]
    const n = outL.length
    const sr = sampleRate
    const invSr = 1 / sr

    const gainP = parameters.gain
    const freqP = parameters.frequency
    const pulseP = parameters.pulseRate
    const panP = parameters.pan
    const lfP = parameters.leftFreq
    const rfP = parameters.rightFreq

    const gC = gainP.length === 1
    const fC = freqP.length === 1
    const pC = pulseP.length === 1
    const paC = panP.length === 1
    const lC = lfP.length === 1
    const rC = rfP.length === 1

    if (this._type === 'BinauralBeat') {
      let phL = this._phaseL
      let phR = this._phaseR
      for (let i = 0; i < n; i += 1) {
        const g = gC ? gainP[0] : gainP[i]
        const lf = lC ? lfP[0] : lfP[i]
        const rf = rC ? rfP[0] : rfP[i]
        outL[i] = Math.sin(TWO_PI * phL) * g
        outR[i] = Math.sin(TWO_PI * phR) * g
        phL += lf * invSr; if (phL >= 1) phL -= Math.floor(phL)
        phR += rf * invSr; if (phR >= 1) phR -= Math.floor(phR)
      }
      this._phaseL = phL
      this._phaseR = phR
      return this._finish(outL, outR, n)
    }

    if (this._type === 'IsochronicTone') {
      let ph = this._phase
      let slot = this._slot
      const env = this._env
      for (let i = 0; i < n; i += 1) {
        const g = gC ? gainP[0] : gainP[i]
        const f = fC ? freqP[0] : freqP[i]
        const pr = pC ? pulseP[0] : pulseP[i]
        const pan = paC ? panP[0] : panP[i]
        const e = envelopeValueAt(env, slot)
        const s = Math.sin(TWO_PI * ph) * e * g
        const a = (pan + 1) * (Math.PI / 4)
        outL[i] = s * Math.cos(a)
        outR[i] = s * Math.sin(a)
        ph += f * invSr; if (ph >= 1) ph -= Math.floor(ph)
        slot += pr * invSr; if (slot >= 1) slot -= Math.floor(slot)
      }
      this._phase = ph
      this._slot = slot
      return this._finish(outL, outR, n)
    }

    if (this._type === 'Noise') {
      const color = this._noiseColor
      const mode = this._noiseFilter
      // TPT state-variable filter coefficients, block-constant (smooth for sweeps).
      const cutoff = Math.min(parameters.cutoff[0], sr * 0.45)
      const Q = Math.max(0.3, parameters.resonance[0])
      const gco = Math.tan(Math.PI * cutoff * invSr)
      const k = 1 / Q
      const a1 = 1 / (1 + gco * (gco + k))
      const a2 = gco * a1
      const a3 = gco * a2
      let ic1 = this._ic1, ic2 = this._ic2
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
        const v3 = x - ic2
        const v1 = a1 * ic1 + a2 * v3
        const v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        const out = mode === 'bandpass' ? v1 : (mode === 'highpass' ? (x - k * v1 - v2) : v2)
        const g = gC ? gainP[0] : gainP[i]
        const pan = paC ? panP[0] : panP[i]
        const s = out * g
        const a = (pan + 1) * (Math.PI / 4)
        outL[i] = s * Math.cos(a)
        outR[i] = s * Math.sin(a)
      }
      this._ic1 = ic1; this._ic2 = ic2
      this._b0 = b0; this._b1 = b1; this._b2 = b2; this._b3 = b3
      this._b4 = b4; this._b5 = b5; this._b6 = b6; this._brown = brown
      return this._finish(outL, outR, n)
    }

    if (this._type === 'Drone') {
      const N = this._droneVoices
      const root = freqP[0]
      const detune = parameters.detune[0]
      const norm = 1 / Math.sqrt(N)
      const ph = this._dronePhases
      const incs = this._droneIncs
      for (let j = 0; j < N; j += 1) {
        const nj = N > 1 ? (j - (N - 1) / 2) / ((N - 1) / 2) : 0
        incs[j] = (root * Math.pow(2, (nj * detune) / 1200)) * invSr
      }
      for (let i = 0; i < n; i += 1) {
        let sum = 0
        for (let j = 0; j < N; j += 1) {
          sum += Math.sin(TWO_PI * ph[j])
          ph[j] += incs[j]; if (ph[j] >= 1) ph[j] -= Math.floor(ph[j])
        }
        const g = gC ? gainP[0] : gainP[i]
        const pan = paC ? panP[0] : panP[i]
        const s = sum * norm * g
        const a = (pan + 1) * (Math.PI / 4)
        outL[i] = s * Math.cos(a)
        outR[i] = s * Math.sin(a)
      }
      return this._finish(outL, outR, n)
    }

    if (this._type === 'Sample') {
      const L = this._sampleL, R = this._sampleR
      if (!L) { for (let i = 0; i < n; i += 1) { outL[i] = 0; outR[i] = 0 } return this._finish(outL, outR, n) }
      const len = this._sampleLen, step = this._sampleStep
      let pos = this._samplePos
      for (let i = 0; i < n; i += 1) {
        const idx = pos | 0
        const frac = pos - idx
        const i2 = idx + 1 >= len ? 0 : idx + 1
        const sL = L[idx] + (L[i2] - L[idx]) * frac
        const sR = R[idx] + (R[i2] - R[idx]) * frac
        const g = gC ? gainP[0] : gainP[i]
        const pan = paC ? panP[0] : panP[i]
        outL[i] = sL * g * (pan > 0 ? 1 - pan : 1)
        outR[i] = sR * g * (pan < 0 ? 1 + pan : 1)
        pos += step; if (pos >= len) pos -= len
      }
      this._samplePos = pos
      return this._finish(outL, outR, n)
    }

    // Carrier
    let ph = this._phase
    for (let i = 0; i < n; i += 1) {
      const g = gC ? gainP[0] : gainP[i]
      const f = fC ? freqP[0] : freqP[i]
      const pan = paC ? panP[0] : panP[i]
      const s = Math.sin(TWO_PI * ph) * g
      const a = (pan + 1) * (Math.PI / 4)
      outL[i] = s * Math.cos(a)
      outR[i] = s * Math.sin(a)
      ph += f * invSr; if (ph >= 1) ph -= Math.floor(ph)
    }
    this._phase = ph
    return this._finish(outL, outR, n)
  }
}

registerProcessor('bsc-voice', BSCVoiceProcessor)
