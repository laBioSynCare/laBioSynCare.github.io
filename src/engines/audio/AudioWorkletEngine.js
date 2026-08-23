import { WorkletVoiceEngine } from './WorkletVoiceEngine.js'

/**
 * AudioWorkletEngine — voices synthesised on the audio render thread by the
 * `bsc-voice` AudioWorkletProcessor (pure JS DSP). The processor script lives in
 * `static/worklets/` and is loaded by URL, never bundled (CLAUDE.md §3.2).
 */
export class AudioWorkletEngine extends WorkletVoiceEngine {
  constructor() {
    super()
    this._moduleUrl = '/worklets/bsc-voice.worklet.js'
    this._processorName = 'bsc-voice'
    this._implementationName = 'AudioWorklet'
    this._supportsWasm = false
  }
}
