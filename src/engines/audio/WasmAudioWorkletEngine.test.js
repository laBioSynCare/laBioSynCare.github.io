import { afterEach, describe, expect, it, vi } from 'vitest'
import { WasmAudioWorkletEngine } from './WasmAudioWorkletEngine.js'

// The engine compiles bsc-osc.wasm once and hands the finished module to every
// voice through processorOptions, so each processor instantiates synchronously
// and is ready before its first render quantum. These tests pin that contract
// and the permanent fallback for agents that refuse to clone a Module.

const SPEC = { type: 'Carrier', params: { frequency: 440 } }

function makeEngine({ clonable = true } = {}) {
  const engine = new WasmAudioWorkletEngine()
  engine._ctx = { sampleRate: 48000, currentTime: 0 }
  engine._wasmBytes = new ArrayBuffer(185)
  engine._wasmModule = { fakeModule: true }

  const constructed = []
  globalThis.AudioWorkletNode = class {
    constructor(_ctx, name, options) {
      if (!clonable && options.processorOptions.wasmModule) {
        throw new DOMException('could not be cloned', 'DataCloneError')
      }
      constructed.push({ name, options })
      this.port = { postMessage: vi.fn() }
      this.parameters = { get: () => null }
    }
  }
  return { engine, constructed }
}

afterEach(() => {
  delete globalThis.AudioWorkletNode
})

describe('WasmAudioWorkletEngine', () => {
  it('hands the compiled module to each voice and posts no bytes', () => {
    const { engine, constructed } = makeEngine()

    const node = engine._createVoiceNode(SPEC)
    engine._onVoiceCreated(node)

    expect(constructed).toHaveLength(1)
    expect(constructed[0].name).toBe('bsc-voice-wasm')
    expect(constructed[0].options.processorOptions.wasmModule).toBe(engine._wasmModule)
    expect(constructed[0].options.processorOptions.voiceType).toBe('Carrier')
    expect(node.port.postMessage).not.toHaveBeenCalled()
  })

  it('falls back to posting bytes when the module cannot be cloned', () => {
    const { engine, constructed } = makeEngine({ clonable: false })

    const node = engine._createVoiceNode(SPEC)
    engine._onVoiceCreated(node)

    // One rejected attempt is retried without the module, not surfaced.
    expect(constructed).toHaveLength(1)
    expect(constructed[0].options.processorOptions.wasmModule).toBeUndefined()
    expect(engine._moduleClonable).toBe(false)
    expect(node.port.postMessage).toHaveBeenCalledTimes(1)
    const message = node.port.postMessage.mock.calls[0][0]
    expect(message.type).toBe('wasm')
    expect(message.bytes.byteLength).toBe(185)
    // Each node owns its copy; the cached buffer stays intact for the next voice.
    expect(message.bytes).not.toBe(engine._wasmBytes)
  })

  it('stops attempting the module path after the first refusal', () => {
    const { engine, constructed } = makeEngine({ clonable: false })

    engine._createVoiceNode(SPEC)
    engine._createVoiceNode(SPEC)

    expect(constructed).toHaveLength(2)
    for (const call of constructed) {
      expect(call.options.processorOptions.wasmModule).toBeUndefined()
    }
  })

  it('reports the WASM capability and its own implementation name', () => {
    const { engine } = makeEngine()
    const caps = engine.getCapabilities()

    expect(caps.supportsWasm).toBe(true)
    expect(caps.implementationName).toBe('AudioWorklet+WASM')
  })
})
