import { IAudioEngine } from './IAudioEngine.js'

const DEFAULT_RELEASE = 0.05
const PARAM_RAMP = 0.02
const ATTACK = 0.05

/**
 * Minimal Vanilla Web Audio implementation of IAudioEngine.
 *
 * Phase 1 scope — supports the patch studio's three audio track types
 * (Carrier, IsochronicTone, BinauralBeat) using plain OscillatorNode +
 * GainNode + StereoPannerNode graphs. The AudioWorklet-backed voices
 * (Binaural, Martigli, Martigli-Binaural, Symmetry) from
 * docs/technical/AUDIO_ENGINE_ARCHITECTURE.md are not yet implemented.
 */
export class VanillaWebAudioEngine extends IAudioEngine {
  constructor() {
    super()
    this._ctx = null
    this._masterGain = null
    this._voices = new Map()
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
    v.outGain.gain.cancelScheduledValues(t)
    v.outGain.gain.setValueAtTime(v.outGain.gain.value, t)
    v.outGain.gain.linearRampToValueAtTime(0.0001, tEnd)
    for (const node of v.sources) {
      try { node.stop(tEnd + 0.01) } catch (_) {}
    }
    handle.isActive = false
    setTimeout(() => {
      for (const node of v.sources) { try { node.disconnect() } catch (_) {} }
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
    }
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
    outGain.connect(this._masterGain)

    const userPan = ctx.createStereoPanner()
    userPan.pan.value = pan
    userPan.connect(outGain)

    const v = {
      type, userGain, frequency, pulseRate,
      outGain, userPan, sources: [],
    }

    if (type === 'BinauralBeat') {
      const panL = ctx.createStereoPanner(); panL.pan.value = -1
      const panR = ctx.createStereoPanner(); panR.pan.value = +1
      const gL = ctx.createGain(); gL.gain.value = userGain
      const gR = ctx.createGain(); gR.gain.value = userGain
      const oscL = ctx.createOscillator(); oscL.type = 'sine'; oscL.frequency.value = frequency
      const oscR = ctx.createOscillator(); oscR.type = 'sine'; oscR.frequency.value = frequency + pulseRate

      oscL.connect(gL).connect(panL).connect(userPan)
      oscR.connect(gR).connect(panR).connect(userPan)
      oscL.start(t0); oscR.start(t0)

      v.sources.push(oscL, oscR)
      v._gainL = gL; v._gainR = gR
      v._oscL = oscL; v._oscR = oscR
    } else if (type === 'IsochronicTone') {
      const ampGain = ctx.createGain(); ampGain.gain.value = 0
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = pulseRate
      const lfoDepth = ctx.createGain(); lfoDepth.gain.value = userGain * 0.5
      const dc = ctx.createConstantSource(); dc.offset.value = userGain * 0.5
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency

      lfo.connect(lfoDepth).connect(ampGain.gain)
      dc.connect(ampGain.gain)
      osc.connect(ampGain).connect(userPan)
      osc.start(t0); lfo.start(t0); dc.start(t0)

      v.sources.push(osc, lfo, dc)
      v._osc = osc; v._lfo = lfo; v._lfoDepth = lfoDepth; v._dc = dc
    } else {
      const ampGain = ctx.createGain(); ampGain.gain.value = userGain
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency
      osc.connect(ampGain).connect(userPan)
      osc.start(t0)

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
      apply(v._dc.offset, g * 0.5)
      apply(v._lfoDepth.gain, g * 0.5)
    } else {
      apply(v._ampGain.gain, g)
    }
  }

  _applyFrequency(v, apply) {
    if (v.type === 'BinauralBeat') {
      apply(v._oscL.frequency, v.frequency)
      apply(v._oscR.frequency, v.frequency + v.pulseRate)
    } else {
      apply(v._osc.frequency, v.frequency)
    }
  }

  _applyPulseRate(v, apply) {
    if (v.type === 'BinauralBeat') {
      apply(v._oscR.frequency, v.frequency + v.pulseRate)
    } else if (v.type === 'IsochronicTone') {
      apply(v._lfo.frequency, v.pulseRate)
    }
  }
}
