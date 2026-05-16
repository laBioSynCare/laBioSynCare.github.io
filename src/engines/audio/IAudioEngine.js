/**
 * @typedef {Object} AudioEngineCapabilities
 * @property {boolean} supportsAudioWorklet
 * @property {boolean} supportsWasm
 * @property {boolean} supportsSharedArrayBuffer
 * @property {number}  sampleRate
 * @property {number}  outputLatency
 * @property {string}  implementationName
 */

/**
 * @typedef {Object} VoiceHandle
 * @property {string}  id
 * @property {string}  type
 * @property {boolean} isScheduled
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} VoiceSpec
 * @property {string} type    Voice type: 'Carrier' | 'IsochronicTone' | 'BinauralBeat'
 *                            (later: 'Binaural' | 'Martigli' | 'Martigli-Binaural' | 'Symmetry')
 * @property {number} volume  0–1 initial scalar
 * @property {Object} params  Voice-type-specific parameters
 */

/**
 * IAudioEngine — BSC audio engine interface contract.
 *
 * Defined in `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` §3. The
 * orchestrator (and, for now, the patch studio) call only these methods.
 * Implementations: VanillaWebAudioEngine (now). Future: ToneJsEngine,
 * WasmAudioEngine.
 *
 * Invariant: the AudioContext created by this engine is the timing
 * authority for all visual and haptic synchronization.
 */
export class IAudioEngine {
  async initialize() { throw new Error('not implemented') }
  async resume() { throw new Error('not implemented') }
  async suspend() { throw new Error('not implemented') }

  /** @returns {AudioEngineCapabilities} */
  getCapabilities() { throw new Error('not implemented') }

  /** @returns {AudioContext} */
  getAudioContext() { throw new Error('not implemented') }

  /**
   * @param {VoiceSpec} spec
   * @param {number}    startTime AudioContext.currentTime value
   * @returns {VoiceHandle}
   */
  scheduleVoice(spec, startTime) { throw new Error('not implemented') }

  /**
   * @param {VoiceHandle} handle
   * @param {number}      stopTime
   * @param {number}      [releaseSeconds=0.05]
   */
  stopVoice(handle, stopTime, releaseSeconds = 0.05) { throw new Error('not implemented') }

  /**
   * @param {VoiceHandle} handle
   * @param {string}      paramName
   * @param {number}      value
   * @param {number}      atTime
   * @param {'step'|'linear'|'exponential'} [curve='step']
   */
  setVoiceParameter(handle, paramName, value, atTime, curve = 'step') {
    throw new Error('not implemented')
  }

  /**
   * @param {number} volume 0–1
   * @param {number} atTime
   */
  setMasterVolume(volume, atTime) { throw new Error('not implemented') }

  async dispose() { throw new Error('not implemented') }
}
