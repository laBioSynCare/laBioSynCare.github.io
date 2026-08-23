import { IAudioEngine } from './IAudioEngine.js'

function defaultNowMilliseconds() {
  if (typeof globalThis.performance?.now === 'function') {
    return globalThis.performance.now()
  }
  return Date.now()
}

/**
 * The timing-only subset of AudioContext used by Patch Studio.
 *
 * Keeping this clock local is what makes the Silent engine genuinely
 * capability-free: it neither constructs nor feature-detects Web Audio. The
 * injected `now` function also gives the clock deterministic tests without
 * browser globals.
 */
class SilentClockContext {
  constructor(now = defaultNowMilliseconds) {
    this.state = 'suspended'
    this.sampleRate = 0
    this.outputLatency = 0

    this._now = now
    this._lastNowMs = null
    this._startedAtMs = null
    this._elapsedSeconds = 0
  }

  _readNow() {
    let candidate
    try { candidate = Number(this._now()) } catch (_) { candidate = NaN }
    if (Number.isFinite(candidate)) {
      this._lastNowMs = this._lastNowMs == null
        ? candidate
        : Math.max(this._lastNowMs, candidate)
    }
    return this._lastNowMs ?? 0
  }

  get currentTime() {
    if (this.state !== 'running' || this._startedAtMs == null) {
      return this._elapsedSeconds
    }
    return this._elapsedSeconds + Math.max(0, this._readNow() - this._startedAtMs) / 1000
  }

  async resume() {
    if (this.state === 'running' || this.state === 'closed') return
    this._startedAtMs = this._readNow()
    this.state = 'running'
  }

  async suspend() {
    if (this.state !== 'running') return
    this._elapsedSeconds = this.currentTime
    this._startedAtMs = null
    this.state = 'suspended'
  }

  async close() {
    if (this.state === 'closed') return
    if (this.state === 'running') this._elapsedSeconds = this.currentTime
    this._startedAtMs = null
    this.state = 'closed'
  }
}

/**
 * NullAudioEngine — "Silent (visual & timing only)".
 *
 * Implements the full IAudioEngine contract but produces no sound. A monotonic,
 * AudioContext-compatible clock keeps `getAudioContext().currentTime` driving
 * the studio's rAF loop, control modulation and visual previews. It deliberately
 * creates no AudioContext, so it remains available when Web Audio is absent.
 *
 * Useful for quiet/shared environments, accessibility, and debugging timing or
 * visuals without audio; it is also the guaranteed floor when Web Audio itself
 * is unavailable. Mirrors the NullHapticEngine pattern (see src/engines/README.md).
 */
export class NullAudioEngine extends IAudioEngine {
  constructor({ now = defaultNowMilliseconds } = {}) {
    super()
    this._ctx = null
    this._seq = 0
    this._now = now
  }

  async initialize() {
    if (this._ctx) return
    this._ctx = new SilentClockContext(this._now)
  }

  async resume() {
    if (this._ctx && this._ctx.state !== 'running') await this._ctx.resume()
  }

  async suspend() {
    if (this._ctx && this._ctx.state === 'running') await this._ctx.suspend()
  }

  getCapabilities() {
    return {
      supportsAudioWorklet: false,
      supportsWasm: false,
      supportsSharedArrayBuffer: false,
      sampleRate: 0,
      outputLatency: 0,
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
