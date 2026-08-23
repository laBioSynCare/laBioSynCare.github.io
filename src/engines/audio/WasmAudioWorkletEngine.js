import { WorkletVoiceEngine } from './WorkletVoiceEngine.js'
import { applicationAsset } from '../../config/applicationUrls.js'

const WASM_URL = '/worklets/bsc-osc.wasm'

/**
 * WasmAudioWorkletEngine — same voice model as AudioWorkletEngine, but the
 * `bsc-voice-wasm` processor runs the per-sample sine oscillator in WebAssembly
 * (sine-LUT interpolation compiled from `static/worklets/bsc-osc.wat`).
 *
 * The WASM bytes are fetched once on the main thread (AudioWorkletGlobalScope
 * has no `fetch`) and compiled once into a `WebAssembly.Module`, which is
 * structured-cloneable. Each voice receives that finished module through
 * `processorOptions`, so its processor instantiates synchronously in its own
 * constructor and is ready before the first render quantum — no voice starts
 * silent, and the module is never recompiled per voice.
 *
 * Should a browser refuse to clone a Module into the worklet agent, the engine
 * falls back permanently to posting the raw bytes over the node port; that path
 * compiles asynchronously on the audio thread, so those voices stay silent for
 * the first render quanta.
 */
export class WasmAudioWorkletEngine extends WorkletVoiceEngine {
  constructor() {
    super()
    this._moduleUrl = '/worklets/bsc-voice-wasm.worklet.js'
    this._processorName = 'bsc-voice-wasm'
    this._implementationName = 'AudioWorklet+WASM'
    this._supportsWasm = true
    this._wasmBytes = null
    this._wasmModule = null
    this._moduleClonable = true
  }

  async _loadModules() {
    if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly not supported on this browser')
    await this._ctx.audioWorklet.addModule(applicationAsset(this._moduleUrl))
    const response = await fetch(applicationAsset(WASM_URL))
    if (!response.ok) throw new Error(`Failed to load WASM oscillator (${response.status})`)
    this._wasmBytes = await response.arrayBuffer()
    this._wasmModule = await WebAssembly.compile(this._wasmBytes)
  }

  _voiceProcessorOptions(spec) {
    const options = super._voiceProcessorOptions(spec)
    if (this._moduleClonable && this._wasmModule) options.wasmModule = this._wasmModule
    return options
  }

  _createVoiceNode(spec) {
    try {
      return super._createVoiceNode(spec)
    } catch (error) {
      if (!this._moduleClonable) throw error
      // The Module could not be serialised into the worklet agent. Stop trying
      // for the lifetime of this engine and rebuild the node without it.
      this._moduleClonable = false
      return super._createVoiceNode(spec)
    }
  }

  _onVoiceCreated(node) {
    if (this._moduleClonable || !this._wasmBytes) return
    // Clone the bytes so each node owns its copy (postMessage structured-clones
    // by default; we keep the cached buffer intact for the next voice).
    node.port.postMessage({ type: 'wasm', bytes: this._wasmBytes.slice(0) })
  }
}
