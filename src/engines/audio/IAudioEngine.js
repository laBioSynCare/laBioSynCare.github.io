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
 * @property {string} type    Patch Studio voice type:
 *                            'Carrier' | 'IsochronicTone' | 'BinauralBeat' |
 *                            'Noise' | 'Drone' | 'Sample'
 * @property {number} volume  0–1 initial scalar
 * @property {Object} params  Voice-type-specific parameters
 * @property {Object} [tremolo]  Optional AM effect { enabled, rate, depth, mode }
 * @property {Object} [envelope] IsochronicTone envelope spec
 * @property {string} [noiseColor]  Noise: 'white' | 'pink' | 'brown'
 * @property {string} [noiseFilter] Noise: 'lowpass' | 'bandpass' | 'highpass'
 * @property {number} [droneVoices] Drone: detuned-oscillator count
 * @property {string} [sampleId]    Sample: ambient clip id
 */

/**
 * IAudioEngine — BSC audio engine interface contract.
 *
 * Target design in `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md`; the as-built
 * engines and the live voice model are in `src/engines/README.md` and
 * `docs/technical/PATCH_STUDIO.md`. Callers (today the Patch Studio; later a
 * `StimulationOrchestrator`) use only these interface methods.
 *
 * Implementations: VanillaWebAudioEngine, AudioWorkletEngine,
 * WasmAudioWorkletEngine, NullAudioEngine — registered in `audioEngines.js`.
 *
 * Invariant: the AudioContext — or, for the capability-free Silent engine, an
 * AudioContext-compatible monotonic clock — is the timing authority for all
 * visual and haptic synchronization.
 */
export class IAudioEngine {
  async initialize() { throw new Error('not implemented') }
  async resume() { throw new Error('not implemented') }
  async suspend() { throw new Error('not implemented') }

  /** @returns {AudioEngineCapabilities} */
  getCapabilities() { throw new Error('not implemented') }

  /** @returns {AudioContext|{currentTime:number, state:string}} */
  getAudioContext() { throw new Error('not implemented') }

  /**
   * @param {VoiceSpec} spec
   * @param {number}    startTime Engine timing-context currentTime value
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
   * Update an IsochronicTone voice's envelope shape. Optional capability —
   * meaningful only for envelope-bearing voices; engines without per-voice
   * envelopes may treat this as a no-op. Defaults to a no-op so callers never
   * need to feature-detect.
   *
   * @param {VoiceHandle} handle
   * @param {Object}      envSpec
   */
  setVoiceEnvelope(handle, envSpec) {}

  /**
   * Update a voice's tremolo / amplitude-modulation effect. Optional capability;
   * defaults to a no-op so callers never need to feature-detect.
   *
   * @param {VoiceHandle} handle
   * @param {{enabled:boolean, rate:number, depth:number, mode:'linear'|'exponential'}} tremolo
   */
  setTremolo(handle, tremolo) {}

  /**
   * @param {number} volume 0–1
   * @param {number} atTime
   */
  setMasterVolume(volume, atTime) { throw new Error('not implemented') }

  async dispose() { throw new Error('not implemented') }
}
