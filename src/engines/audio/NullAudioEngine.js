import { IAudioEngine } from './IAudioEngine.js'

/**
 * NullAudioEngine — "Silent (visual & timing only)".
 *
 * Implements the full IAudioEngine contract but produces no sound. It still owns
 * a real AudioContext so `getAudioContext().currentTime` keeps driving the
 * studio's rAF loop, control-signal modulation and visual previews exactly as a
 * sounding engine would — the session runs identically, just muted.
 *
 * Useful for quiet/shared environments, accessibility, and debugging timing or
 * visuals without audio; it is also the guaranteed fallback when no AudioWorklet
 * is available. Mirrors the NullHapticEngine pattern (see src/engines/README.md).
 */
export class NullAudioEngine extends IAudioEngine {
  constructor() {
    super()
    this._ctx = null
    this._seq = 0
  }

  async initialize() {
    if (this._ctx) return
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) throw new Error('Web Audio API not available')
    // A real context is required so currentTime remains the timing authority,
    // even though nothing is ever connected to its destination.
    this._ctx = new Ctor()
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
      implementationName: 'Silent',
    }
  }

  getAudioContext() { return this._ctx }

  scheduleVoice(spec, _startTime) {
    return {
      id: `null-${this._seq++}`,
      type: spec?.type ?? 'Carrier',
      isScheduled: true,
      isActive: true,
    }
  }

  stopVoice(handle) {
    if (handle) handle.isActive = false
  }

  setVoiceParameter() {}
  setVoiceEnvelope() {}
  setMasterVolume() {}

  async dispose() {
    if (!this._ctx) return
    try { await this._ctx.close() } catch (_) {}
    this._ctx = null
  }
}
