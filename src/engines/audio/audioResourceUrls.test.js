import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('$app/paths', () => ({
  asset: (path) => `/sstim${path}`,
  base: '/sstim',
  resolve: (path) => `/sstim${path}`,
}))

import { AudioWorkletEngine } from './AudioWorkletEngine.js'
import { WasmAudioWorkletEngine } from './WasmAudioWorkletEngine.js'
import { decodeSample, sampleUrl } from './sampleLoader.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('base-aware audio resources', () => {
  it('resolves the JavaScript worklet at the configured application base', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined)
    const engine = new AudioWorkletEngine()
    engine._ctx = { audioWorklet: { addModule } }

    await engine._loadModules()

    expect(addModule).toHaveBeenCalledWith('/sstim/worklets/bsc-voice.worklet.js')
  })

  it('resolves the WASM worklet and binary at the configured application base', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined)
    const bytes = new ArrayBuffer(8)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(bytes),
    })
    const compiledModule = { compiled: true }
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(WebAssembly, 'compile').mockResolvedValue(compiledModule)

    const engine = new WasmAudioWorkletEngine()
    engine._ctx = { audioWorklet: { addModule } }
    await engine._loadModules()

    expect(addModule).toHaveBeenCalledWith('/sstim/worklets/bsc-voice-wasm.worklet.js')
    expect(fetchMock).toHaveBeenCalledWith('/sstim/worklets/bsc-osc.wasm')
    expect(engine._wasmBytes).toBe(bytes)
    expect(engine._wasmModule).toBe(compiledModule)
  })

  it('keeps sample identifiers logical and resolves only at fetch time', async () => {
    const decodeAudioData = vi.fn().mockResolvedValue({ decoded: true })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = sampleUrl('rain & wind')
    const decoded = await decodeSample({ decodeAudioData }, url)

    expect(url).toBe('/audio/rain%20%26%20wind.wav')
    expect(fetchMock).toHaveBeenCalledWith('/sstim/audio/rain%20%26%20wind.wav')
    expect(decoded).toEqual({ decoded: true })
  })

  it('does not rewrite an external sample URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    })
    vi.stubGlobal('fetch', fetchMock)

    await decodeSample(
      { decodeAudioData: vi.fn().mockResolvedValue({}) },
      'https://cdn.example.test/sample.wav',
    )

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.test/sample.wav')
  })
})
