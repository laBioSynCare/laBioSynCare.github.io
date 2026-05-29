import { WorkletVoiceEngine } from './WorkletVoiceEngine.js'

const WASM_URL = '/worklets/bsc-osc.wasm'

/**
 * WasmAudioWorkletEngine — same voice model as AudioWorkletEngine, but the
 * `bsc-voice-wasm` processor runs the per-sample sine oscillator in WebAssembly
 * (sine-LUT interpolation compiled from `static/worklets/bsc-osc.wat`).
 *
 * The WASM bytes are fetched once on the main thread (AudioWorkletGlobalScope
 * has no `fetch`) and posted into each voice node, which compiles + instantiates
 * them against memory it owns. Until a node reports ready it emits silence.
 */
export class WasmAudioWorkletEngine extends WorkletVoiceEngine {
  constructor() {
    super()
    this._moduleUrl = '/worklets/bsc-voice-wasm.worklet.js'
    this._processorName = 'bsc-voice-wasm'
    this._implementationName = 'AudioWorklet+WASM'
    this._supportsWasm = true
    this._wasmBytes = null
  }

  async _loadModules() {
    if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly not supported on this browser')
    await this._ctx.audioWorklet.addModule(this._moduleUrl)
    const response = await fetch(WASM_URL)
    if (!response.ok) throw new Error(`Failed to load WASM oscillator (${response.status})`)
    this._wasmBytes = await response.arrayBuffer()
  }

  _onVoiceCreated(node) {
    if (!this._wasmBytes) return
    // Clone the bytes so each node owns its copy (postMessage structured-clones
    // by default; we keep the cached buffer intact for the next voice).
    node.port.postMessage({ type: 'wasm', bytes: this._wasmBytes.slice(0) })
  }
}
