import { IAudioEngine } from './IAudioEngine.js'

const PARAM_RAMP = 0.02
const ATTACK = 0.05
const DEFAULT_RELEASE = 0.05

// Parameter names the BSC voice processors expose as AudioParams. The studio
// drives all of them from the main thread via timed AudioParam automation, so
// AudioContext.currentTime stays the only clock.
const VOICE_PARAMS = ['gain', 'frequency', 'pulseRate', 'pan', 'cutoff', 'leftFreq', 'rightFreq']

/**
 * Shared base for the AudioWorklet-backed engines.
 *
 * Each voice is one `AudioWorkletNode` (numberOfInputs 0, stereo output) that
 * synthesises the whole voice on the audio render thread, followed by a per-voice
 * GainNode used purely for the attack/release fade. The node's `gain` AudioParam
 * carries the user gain; frequency / pulseRate / pan / leftFreq / rightFreq are
 * the remaining AudioParams. Subclasses pick the worklet module + processor name
 * and may post extra setup to each node (see WasmAudioWorkletEngine).
 *
 * Voice types match VanillaWebAudioEngine: Carrier, IsochronicTone, BinauralBeat.
 */
export class WorkletVoiceEngine extends IAudioEngine {
  constructor() {
    super()
    this._ctx = null
    this._masterGain = null
    this._voices = new Map()
    // Subclasses override:
    this._moduleUrl = '/worklets/bsc-voice.worklet.js'
    this._processorName = 'bsc-voice'
    this._implementationName = 'AudioWorklet'
    this._supportsWasm = false
  }

  async initialize() {
    if (this._ctx) return
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) throw new Error('Web Audio API not available')
    if (typeof AudioWorkletNode === 'undefined') throw new Error('AudioWorklet not supported on this browser')
    this._ctx = new Ctor()
    this._masterGain = this._ctx.createGain()
    this._masterGain.gain.value = 0.8
    this._masterGain.connect(this._ctx.destination)
    await this._loadModules()
  }

  /** Load the worklet module(s). Subclasses extend (e.g. fetch WASM bytes). */
  async _loadModules() {
    await this._ctx.audioWorklet.addModule(this._moduleUrl)
  }

  /** Hook: called after each voice node is created (subclass setup). */
  _onVoiceCreated(_node, _spec) {}

  async resume() {
    if (this._ctx && this._ctx.state !== 'running') await this._ctx.resume()
  }

  async suspend() {
    if (this._ctx && this._ctx.state === 'running') await this._ctx.suspend()
  }

  getCapabilities() {
    return {
      supportsAudioWorklet: typeof AudioWorkletNode !== 'undefined',
      supportsWasm: this._supportsWasm,
      supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      sampleRate: this._ctx ? this._ctx.sampleRate : 0,
      outputLatency: this._ctx ? (this._ctx.outputLatency ?? 0) : 0,
      implementationName: this._implementationName,
    }
  }

  getAudioContext() { return this._ctx }

  scheduleVoice(spec, startTime) {
    const ctx = this._ctx
    const t0 = Math.max(startTime, ctx.currentTime + 0.005)
    const params = spec.params || {}
    const userGain = Number.isFinite(params.gain) ? params.gain : (spec.volume ?? 0.5)

    const node = new AudioWorkletNode(ctx, this._processorName, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        voiceType: spec.type,
        envelope: spec.envelope || null,
        noiseColor: spec.noiseColor || null,
      },
    })
    this._onVoiceCreated(node, spec)

    // Initial AudioParam values.
    const setP = (name, value) => {
      if (!Number.isFinite(value)) return
      const p = node.parameters.get(name)
      if (p) p.setValueAtTime(value, t0)
    }
    setP('gain', userGain)
    if (spec.type === 'BinauralBeat') {
      setP('leftFreq', params.leftFreq)
      setP('rightFreq', params.rightFreq)
    } else if (spec.type === 'Noise') {
      setP('pan', params.pan)
      setP('cutoff', params.cutoff)
    } else {
      setP('frequency', params.frequency)
      setP('pulseRate', params.pulseRate)
      setP('pan', params.pan)
    }

    // Per-voice fade gain for attack/release.
    const outGain = ctx.createGain()
    outGain.gain.setValueAtTime(0, t0)
    outGain.gain.linearRampToValueAtTime(1, t0 + ATTACK)
    node.connect(outGain).connect(this._masterGain)

    const handle = {
      id: this._uid(),
      type: spec.type,
      isScheduled: true,
      isActive: true,
      _node: node,
      _outGain: outGain,
    }
    this._voices.set(handle.id, handle)
    return handle
  }

  stopVoice(handle, stopTime, releaseSeconds = DEFAULT_RELEASE) {
    if (!handle || !handle._node) return
    const t = Math.max(stopTime, this._ctx.currentTime)
    const tEnd = t + releaseSeconds
    const g = handle._outGain.gain
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(0.0001, tEnd)
    handle.isActive = false
    setTimeout(() => {
      try { handle._node.disconnect() } catch (_) {}
      try { handle._outGain.disconnect() } catch (_) {}
      try { handle._node.port.close?.() } catch (_) {}
      this._voices.delete(handle.id)
    }, (releaseSeconds + 0.05) * 1000)
  }

  setVoiceParameter(handle, paramName, value, atTime, curve = 'step') {
    if (!handle || !handle._node) return
    if (!VOICE_PARAMS.includes(paramName)) return
    const param = handle._node.parameters.get(paramName)
    if (!param) return
    const t = Math.max(atTime, this._ctx.currentTime)
    this._applyParam(param, value, t, curve)
  }

  setVoiceEnvelope(handle, envSpec) {
    if (!handle || !handle._node || handle.type !== 'IsochronicTone') return
    try { handle._node.port.postMessage({ type: 'envelope', envelope: envSpec }) } catch (_) {}
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
    if (!Number.isFinite(value)) return
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
    if (curve === 'linear') param.linearRampToValueAtTime(value, t + PARAM_RAMP)
    else if (curve === 'exponential') param.exponentialRampToValueAtTime(Math.max(value, 0.0001), t + PARAM_RAMP)
    else param.setValueAtTime(value, t)
  }
}
