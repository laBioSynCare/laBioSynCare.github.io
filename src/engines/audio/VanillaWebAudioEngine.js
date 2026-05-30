import { IAudioEngine } from './IAudioEngine.js'
import { loadSample, sampleUrl } from './sampleLoader.js'

const DEFAULT_RELEASE = 0.05
const PARAM_RAMP = 0.02
const ATTACK = 0.05

// ── Isochronic envelope shape (0..1 over one pulse slot) ─────────────────────
// slotPhase ∈ [0, 1) covers one full pulse period (1/pulseRate seconds).
// Within slotPhase < noteDurationFrac the note is "on" and the envelope plays;
// the remainder of the slot is silence.
export function envelopeValueAt(envSpec, slotPhase) {
  const {
    type = 'AR',
    attackFrac = 0.1,
    decayFrac = 0,
    sustainLevel = 1,
    releaseFrac = 0.15,
    noteDurationFrac = 0.5,
  } = envSpec || {}
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

// Build a PeriodicWave that reproduces the AC component of the envelope shape
// over one pulse cycle, plus return the DC mean separately. An OscillatorNode
// using this wave at frequency = pulseRate, summed with a ConstantSourceNode
// at offset = dc, reconstructs the full 0..1 envelope.
function buildEnvelopeWave(ctx, envSpec) {
  const N = 1024
  const K = 64
  const samples = new Float32Array(N)
  let sum = 0
  for (let i = 0; i < N; i += 1) {
    samples[i] = envelopeValueAt(envSpec, i / N)
    sum += samples[i]
  }
  const dc = sum / N
  const real = new Float32Array(K + 1)
  const imag = new Float32Array(K + 1)
  for (let k = 1; k <= K; k += 1) {
    let re = 0
    let im = 0
    for (let i = 0; i < N; i += 1) {
      const angle = (2 * Math.PI * k * i) / N
      const v = samples[i] - dc
      re += v * Math.cos(angle)
      im += v * Math.sin(angle)
    }
    real[k] = (2 * re) / N
    imag[k] = -(2 * im) / N
  }
  const wave = new PeriodicWave(ctx, { real, imag, disableNormalization: true })
  return { wave, dc }
}

// Fill a mono buffer with one of three noise colours. White is flat; pink uses
// Paul Kellet's economical −3 dB/oct filter; brown is a leaky integrator
// (−6 dB/oct). The buffer is looped by an AudioBufferSourceNode at playback.
export function buildNoiseBuffer(ctx, color = 'pink', seconds = 2) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  if (color === 'white') {
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1
  } else if (color === 'brown') {
    let last = 0
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

// WaveShaper curve mapping a sine LFO (domain [-1,1]) to a tremolo gain. The
// oscillator drives this curve into a GainNode's gain param, so one mechanism
// covers both modes: 'linear' (linear in amplitude) and 'exponential' (linear
// in dB / perceived loudness).
export function buildTremCurve(mode = 'exponential', depth = 0.5, N = 2048) {
  const d = Math.max(0, Math.min(1, depth))
  const floor = Math.max(0.001, 1 - d)
  const curve = new Float32Array(N)
  for (let i = 0; i < N; i += 1) {
    const x = (i / (N - 1)) * 2 - 1
    const lfo01 = 0.5 - 0.5 * x
    curve[i] = mode === 'linear' ? (1 - d * lfo01) : Math.pow(floor, lfo01)
  }
  return curve
}

/**
 * Minimal Vanilla Web Audio implementation of IAudioEngine.
 *
 * Phase 1 scope — supports the patch studio's three audio track types:
 *   - Carrier:        single sine
 *   - IsochronicTone: sine carrier × periodic-wave envelope (square/AR/AD/ADSR)
 *   - BinauralBeat:   two sines hard-panned L/R at center ± beat/2 (no user pan
 *                     stage — adding one defeats the binaural effect)
 * The AudioWorklet-backed voices (Binaural/Martigli/Martigli-Binaural/Symmetry
 * per docs/technical/AUDIO_ENGINE_ARCHITECTURE.md) are not yet implemented.
 */
export class VanillaWebAudioEngine extends IAudioEngine {
  constructor() {
    super()
    this._ctx = null
    this._masterGain = null
    this._voices = new Map()
    this._sampleCache = new Map()
  }

  async initialize() {
    if (this._ctx) return
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) throw new Error('Web Audio API not available')
    this._ctx = new Ctor()
    this._masterGain = this._ctx.createGain()
    this._masterGain.gain.value = 0.8
    this._masterGain.connect(this._ctx.destination)
  }

  async resume() {
    if (this._ctx && this._ctx.state !== 'running') await this._ctx.resume()
  }

  async suspend() {
    if (this._ctx && this._ctx.state === 'running') await this._ctx.suspend()
  }

  getCapabilities() {
    return {
      supportsAudioWorklet: typeof AudioWorkletNode !== 'undefined',
      supportsWasm: typeof WebAssembly !== 'undefined',
      supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      sampleRate: this._ctx ? this._ctx.sampleRate : 0,
      outputLatency: this._ctx ? (this._ctx.outputLatency ?? 0) : 0,
      implementationName: 'VanillaWebAudio',
    }
  }

  getAudioContext() { return this._ctx }

  scheduleVoice(spec, startTime) {
    const t0 = Math.max(startTime, this._ctx.currentTime + 0.005)
    const voice = this._buildVoice(spec, t0)
    const handle = {
      id: this._uid(),
      type: spec.type,
      isScheduled: true,
      isActive: true,
      _voice: voice,
    }
    this._voices.set(handle.id, handle)
    return handle
  }

  stopVoice(handle, stopTime, releaseSeconds = DEFAULT_RELEASE) {
    if (!handle || !handle._voice) return
    const t = Math.max(stopTime, this._ctx.currentTime)
    const tEnd = t + releaseSeconds
    const v = handle._voice
    v._stopped = true
    v.outGain.gain.cancelScheduledValues(t)
    v.outGain.gain.setValueAtTime(v.outGain.gain.value, t)
    v.outGain.gain.linearRampToValueAtTime(0.0001, tEnd)
    for (const node of v.sources) {
      try { node.stop(tEnd + 0.01) } catch (_) {}
    }
    handle.isActive = false
    setTimeout(() => {
      for (const node of v.sources) { try { node.disconnect() } catch (_) {} }
      for (const node of (v._extraNodes || [])) { try { node.disconnect() } catch (_) {} }
      try { v.outGain.disconnect() } catch (_) {}
      this._voices.delete(handle.id)
    }, (releaseSeconds + 0.05) * 1000)
  }

  setVoiceParameter(handle, paramName, value, atTime, curve = 'step') {
    if (!handle || !handle._voice) return
    const v = handle._voice
    const t = Math.max(atTime, this._ctx.currentTime)
    const apply = (param, val) => this._applyParam(param, val, t, curve)

    if (paramName === 'gain') {
      v.userGain = Number.isFinite(value) ? value : v.userGain
      this._applyGain(v, apply)
    } else if (paramName === 'pan' && v.userPan) {
      apply(v.userPan.pan, value)
    } else if (paramName === 'frequency') {
      v.frequency = Number.isFinite(value) ? value : v.frequency
      this._applyFrequency(v, apply)
    } else if (paramName === 'pulseRate') {
      v.pulseRate = Number.isFinite(value) ? value : v.pulseRate
      this._applyPulseRate(v, apply)
    } else if (paramName === 'cutoff' && v._filter) {
      v.cutoff = Number.isFinite(value) ? value : v.cutoff
      apply(v._filter.frequency, v.cutoff)
    } else if (paramName === 'resonance' && v._filter) {
      apply(v._filter.Q, value)
    } else if (paramName === 'detune' && v._droneOscs) {
      v.droneDetune = Number.isFinite(value) ? value : v.droneDetune
      for (const d of v._droneOscs) apply(d.osc.detune, d.norm * v.droneDetune)
    } else if (paramName === 'leftFreq' && v.type === 'BinauralBeat' && v._oscL) {
      v.leftFreq = Number.isFinite(value) ? value : v.leftFreq
      apply(v._oscL.frequency, v.leftFreq)
    } else if (paramName === 'rightFreq' && v.type === 'BinauralBeat' && v._oscR) {
      v.rightFreq = Number.isFinite(value) ? value : v.rightFreq
      apply(v._oscR.frequency, v.rightFreq)
    }
  }

  // Update an IsochronicTone voice's envelope shape. Recomputes the
  // PeriodicWave (cheap: O(N·K) once per call, not per frame) and applies the
  // new DC component immediately.
  setVoiceEnvelope(handle, envSpec) {
    if (!handle || !handle._voice) return
    const v = handle._voice
    if (v.type !== 'IsochronicTone' || !v._envOsc) return
    const info = buildEnvelopeWave(this._ctx, envSpec)
    v._envOsc.setPeriodicWave(info.wave)
    v._envInfo = info
    const t = this._ctx.currentTime
    this._applyParam(v._envDC.offset, v.userGain * info.dc, t, 'step')
  }

  // Live tremolo update for rate / depth / mode. Enabling or disabling tremolo
  // is structural (adds/removes a node), so the caller rebuilds the voice for
  // that; here we only adjust an already-present tremolo stage.
  setTremolo(handle, tremolo) {
    const v = handle?._voice
    if (!v || !v._trem || !tremolo) return
    const t = this._ctx.currentTime
    if (Number.isFinite(tremolo.rate)) {
      this._applyParam(v._trem.lfo.frequency, Math.max(0.01, tremolo.rate), t, 'linear')
    }
    v._trem.shaper.curve = buildTremCurve(tremolo.mode, tremolo.depth)
  }

  setMasterVolume(volume, atTime) {
    const t = Math.max(atTime, this._ctx.currentTime)
    this._applyParam(this._masterGain.gain, volume, t, 'linear')
  }

  async dispose() {
    if (!this._ctx) return
    for (const handle of Array.from(this._voices.values())) {
      this.stopVoice(handle, this._ctx.currentTime, 0.01)
    }
    this._voices.clear()
    try { await this._ctx.close() } catch (_) {}
    this._ctx = null
    this._masterGain = null
  }

  _uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `v-${Math.random().toString(36).slice(2)}`
  }

  _applyParam(param, value, t, curve) {
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
    if (curve === 'linear') param.linearRampToValueAtTime(value, t + PARAM_RAMP)
    else if (curve === 'exponential') param.exponentialRampToValueAtTime(Math.max(value, 0.0001), t + PARAM_RAMP)
    else param.setValueAtTime(value, t)
  }

  _buildVoice(spec, t0) {
    const ctx = this._ctx
    const { type } = spec
    const params = spec.params || {}
    const userGain  = Number.isFinite(params.gain)      ? params.gain      : (spec.volume ?? 0.5)
    const pan       = Number.isFinite(params.pan)       ? params.pan       : 0
    const frequency = Number.isFinite(params.frequency) ? params.frequency : 200
    const pulseRate = Number.isFinite(params.pulseRate) ? params.pulseRate : 10

    const outGain = ctx.createGain()
    outGain.gain.setValueAtTime(0, t0)
    outGain.gain.linearRampToValueAtTime(1, t0 + ATTACK)

    const v = {
      type, userGain, frequency, pulseRate,
      outGain, userPan: null, sources: [], _extraNodes: [],
    }

    // Optional tremolo / AM stage between the per-voice fade gain and master.
    const trem = spec.tremolo
    if (trem && trem.enabled && trem.depth > 0) {
      const tremGain = ctx.createGain()
      tremGain.gain.value = 0 // driven entirely by the shaped LFO
      const lfo = ctx.createOscillator(); lfo.type = 'sine'
      lfo.frequency.value = Math.max(0.01, trem.rate)
      const shaper = ctx.createWaveShaper()
      shaper.curve = buildTremCurve(trem.mode, trem.depth)
      lfo.connect(shaper).connect(tremGain.gain)
      outGain.connect(tremGain)
      tremGain.connect(this._masterGain)
      lfo.start(t0)
      v._trem = { lfo, shaper }
      v.sources.push(lfo)
      v._extraNodes.push(tremGain, shaper)
    } else {
      outGain.connect(this._masterGain)
    }

    if (type === 'BinauralBeat') {
      // Canonical binaural: two independent hard-panned carriers. No user-pan
      // stage — moving the stereo image breaks the L/R separation the binaural
      // effect depends on. L and R frequencies are independent params; center
      // and beat are derived by the UI for display only.
      const leftFreq  = Number.isFinite(params.leftFreq)  ? params.leftFreq  : frequency - pulseRate / 2
      const rightFreq = Number.isFinite(params.rightFreq) ? params.rightFreq : frequency + pulseRate / 2

      const panL = ctx.createStereoPanner(); panL.pan.value = -1
      const panR = ctx.createStereoPanner(); panR.pan.value = +1
      const gL = ctx.createGain(); gL.gain.value = userGain
      const gR = ctx.createGain(); gR.gain.value = userGain
      const oscL = ctx.createOscillator(); oscL.type = 'sine'
      const oscR = ctx.createOscillator(); oscR.type = 'sine'
      oscL.frequency.value = leftFreq
      oscR.frequency.value = rightFreq

      oscL.connect(gL).connect(panL).connect(outGain)
      oscR.connect(gR).connect(panR).connect(outGain)
      oscL.start(t0); oscR.start(t0)

      v.leftFreq = leftFreq; v.rightFreq = rightFreq
      v.sources.push(oscL, oscR)
      v._gainL = gL; v._gainR = gR
      v._oscL = oscL; v._oscR = oscR
    } else if (type === 'IsochronicTone') {
      // PeriodicWave-synthesised envelope (AC) + ConstantSource (DC) summed
      // into the carrier's gain AudioParam → carrier(t) × envelope(t).
      const envSpec = spec.envelope || { type: 'AR', attackFrac: 0.1, releaseFrac: 0.15, noteDurationFrac: 0.5 }
      const envInfo = buildEnvelopeWave(ctx, envSpec)

      const ampGain = ctx.createGain(); ampGain.gain.value = 0
      const envOsc = ctx.createOscillator(); envOsc.frequency.value = pulseRate
      envOsc.setPeriodicWave(envInfo.wave)
      const envScale = ctx.createGain(); envScale.gain.value = userGain
      const envDC = ctx.createConstantSource(); envDC.offset.value = userGain * envInfo.dc

      const carrier = ctx.createOscillator(); carrier.type = 'sine'
      carrier.frequency.value = frequency

      const userPan = ctx.createStereoPanner(); userPan.pan.value = pan
      userPan.connect(outGain)

      envOsc.connect(envScale).connect(ampGain.gain)
      envDC.connect(ampGain.gain)
      carrier.connect(ampGain).connect(userPan)
      carrier.start(t0); envOsc.start(t0); envDC.start(t0)

      v.userPan = userPan
      v.sources.push(carrier, envOsc, envDC)
      v._osc = carrier
      v._envOsc = envOsc
      v._envScale = envScale
      v._envDC = envDC
      v._envInfo = envInfo
    } else if (type === 'Noise') {
      // Looping colored-noise buffer → biquad (lowpass/bandpass/highpass with
      // modulatable cutoff + resonance) → gain → pan.
      const cutoff = Number.isFinite(params.cutoff) ? params.cutoff : 6000
      const resonance = Number.isFinite(params.resonance) ? params.resonance : 0.707
      const src = ctx.createBufferSource()
      src.buffer = buildNoiseBuffer(ctx, spec.noiseColor || 'pink', 2)
      src.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = spec.noiseFilter || 'lowpass'
      filter.frequency.value = cutoff
      filter.Q.value = resonance

      const ampGain = ctx.createGain(); ampGain.gain.value = userGain
      const userPan = ctx.createStereoPanner(); userPan.pan.value = pan
      userPan.connect(outGain)

      src.connect(filter).connect(ampGain).connect(userPan)
      src.start(t0)

      v.userPan = userPan
      v.cutoff = cutoff
      v.sources.push(src)
      v._ampGain = ampGain
      v._filter = filter
    } else if (type === 'Drone') {
      // Stack of N detuned sine oscillators (lush pad). Each carries the same
      // root frequency; per-voice detune in cents spreads them symmetrically.
      const root = Number.isFinite(params.frequency) ? params.frequency : 110
      const detune = Number.isFinite(params.detune) ? params.detune : 12
      const N = Math.max(1, Math.min(7, spec.droneVoices || 5))

      const normGain = ctx.createGain(); normGain.gain.value = 1 / Math.sqrt(N)
      const ampGain = ctx.createGain(); ampGain.gain.value = userGain
      const userPan = ctx.createStereoPanner(); userPan.pan.value = pan
      normGain.connect(ampGain).connect(userPan).connect(outGain)

      const oscs = []
      for (let i = 0; i < N; i += 1) {
        const norm = N > 1 ? (i - (N - 1) / 2) / ((N - 1) / 2) : 0 // -1..1
        const osc = ctx.createOscillator(); osc.type = 'sine'
        osc.frequency.value = root
        osc.detune.value = norm * detune
        osc.connect(normGain); osc.start(t0)
        oscs.push({ osc, norm })
        v.sources.push(osc)
      }
      v.userPan = userPan
      v.frequency = root
      v.droneDetune = detune
      v._ampGain = ampGain
      v._droneOscs = oscs
      v._extraNodes.push(normGain)
    } else if (type === 'Sample') {
      // Looping ambient clip → gain → pan. The buffer decodes asynchronously;
      // the source starts as soon as it is ready (a few ms after scheduling).
      const ampGain = ctx.createGain(); ampGain.gain.value = userGain
      const userPan = ctx.createStereoPanner(); userPan.pan.value = pan
      ampGain.connect(userPan).connect(outGain)
      const src = ctx.createBufferSource(); src.loop = true
      src.connect(ampGain)
      v.userPan = userPan
      v._ampGain = ampGain
      v.sources.push(src)
      loadSample(ctx, this._sampleCache, sampleUrl(spec.sampleId || 'rain'))
        .then((buf) => {
          if (v._stopped) return
          src.buffer = buf
          try { src.start(Math.max(t0, ctx.currentTime)) } catch (_) {}
        })
        .catch(() => {})
    } else {
      // Carrier
      const ampGain = ctx.createGain(); ampGain.gain.value = userGain
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency

      const userPan = ctx.createStereoPanner(); userPan.pan.value = pan
      userPan.connect(outGain)

      osc.connect(ampGain).connect(userPan)
      osc.start(t0)

      v.userPan = userPan
      v.sources.push(osc)
      v._osc = osc; v._ampGain = ampGain
    }
    return v
  }

  _applyGain(v, apply) {
    const g = Math.max(0, v.userGain)
    if (v.type === 'BinauralBeat') {
      apply(v._gainL.gain, g)
      apply(v._gainR.gain, g)
    } else if (v.type === 'IsochronicTone') {
      apply(v._envScale.gain, g)
      apply(v._envDC.offset, g * (v._envInfo?.dc ?? 0.5))
    } else {
      apply(v._ampGain.gain, g)
    }
  }

  _applyFrequency(v, apply) {
    // BinauralBeat uses independent leftFreq/rightFreq via dedicated branches
    // in setVoiceParameter — it doesn't share the 'frequency' param name.
    if (v._osc) apply(v._osc.frequency, v.frequency)
    if (v._droneOscs) for (const d of v._droneOscs) apply(d.osc.frequency, v.frequency)
  }

  _applyPulseRate(v, apply) {
    if (v.type === 'IsochronicTone' && v._envOsc) apply(v._envOsc.frequency, v.pulseRate)
  }
}
