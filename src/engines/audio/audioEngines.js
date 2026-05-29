import { writable } from 'svelte/store'
import { VanillaWebAudioEngine } from './VanillaWebAudioEngine.js'
import { AudioWorkletEngine } from './AudioWorkletEngine.js'
import { WasmAudioWorkletEngine } from './WasmAudioWorkletEngine.js'
import { NullAudioEngine } from './NullAudioEngine.js'

export const AUDIO_ENGINE_STORAGE_KEY = 'bsclab.audioEngine'
export const DEFAULT_AUDIO_ENGINE_ID = 'vanilla'

/**
 * Selectable audio engines. `requires` lists capability flags that must be true
 * for the engine to run; unsupported engines are shown disabled in Settings and
 * fall back to the default at creation time. All implement IAudioEngine over the
 * same voice model (Carrier / IsochronicTone / BinauralBeat).
 */
export const audioEngines = [
  {
    id: 'vanilla',
    name: 'Vanilla Web Audio',
    tagline: 'Native nodes',
    description: 'Signal built from native Web Audio nodes (oscillators, gains, panners) on the main thread. Broadest compatibility; the default.',
    requires: [],
    create: () => new VanillaWebAudioEngine(),
  },
  {
    id: 'worklet',
    name: 'AudioWorklet',
    tagline: 'Audio-thread DSP (JS)',
    description: 'Each voice is synthesised sample-by-sample by a custom processor running on the dedicated audio render thread, isolated from main-thread jank.',
    requires: ['audioWorklet'],
    create: () => new AudioWorkletEngine(),
  },
  {
    id: 'worklet-wasm',
    name: 'AudioWorklet + WASM',
    tagline: 'Audio-thread DSP (WebAssembly)',
    description: 'Same audio-thread voices, but the per-sample oscillator runs as a hand-written WebAssembly kernel (sine-LUT interpolation) for a near-native inner loop.',
    requires: ['audioWorklet', 'wasm'],
    create: () => new WasmAudioWorkletEngine(),
  },
  {
    id: 'silent',
    name: 'Silent',
    tagline: 'Visual & timing only',
    description: 'Runs the full session — clock, control modulation and visual previews — but emits no sound. For quiet environments, accessibility, or debugging timing without audio.',
    requires: [],
    create: () => new NullAudioEngine(),
  },
]

const engineById = new Map(audioEngines.map((engine) => [engine.id, engine]))

/** Detect engine capabilities on the main thread (no AudioContext required). */
export function detectAudioCapabilities() {
  const browser = typeof window !== 'undefined'
  return {
    webAudio: browser && !!(window.AudioContext || window.webkitAudioContext),
    audioWorklet: browser && typeof AudioWorkletNode !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
  }
}

/** Whether a descriptor's requirements are all satisfied by `caps`. */
export function isAudioEngineSupported(descriptor, caps = detectAudioCapabilities()) {
  if (!descriptor) return false
  return descriptor.requires.every((flag) => caps[flag])
}

export function normalizeAudioEngineId(id) {
  return engineById.has(id) ? id : DEFAULT_AUDIO_ENGINE_ID
}

export const activeAudioEngineId = writable(DEFAULT_AUDIO_ENGINE_ID)

let currentId = DEFAULT_AUDIO_ENGINE_ID

export function applyAudioEngine(id, { persist = true } = {}) {
  const engineId = normalizeAudioEngineId(id)
  currentId = engineId
  activeAudioEngineId.set(engineId)
  if (persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(AUDIO_ENGINE_STORAGE_KEY, engineId)
  }
  return engineId
}

export function initAudioEnginePreference() {
  let stored = DEFAULT_AUDIO_ENGINE_ID
  if (typeof localStorage !== 'undefined') {
    stored = localStorage.getItem(AUDIO_ENGINE_STORAGE_KEY) ?? DEFAULT_AUDIO_ENGINE_ID
  }
  const engineId = applyAudioEngine(stored, { persist: false })
  if (typeof localStorage !== 'undefined' && stored !== engineId) {
    localStorage.setItem(AUDIO_ENGINE_STORAGE_KEY, engineId)
  }
  return engineId
}

/** Current persisted engine id, normalised. Reads localStorage on first use. */
export function getActiveAudioEngineId() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(AUDIO_ENGINE_STORAGE_KEY)
    if (stored) currentId = normalizeAudioEngineId(stored)
  }
  return currentId
}

/**
 * Instantiate an engine by id, falling back to the default when the requested
 * engine's capabilities are unavailable on this browser. Returns
 * `{ engine, id, fellBack }`. Callers still `await engine.initialize()`.
 */
export function createAudioEngine(id = getActiveAudioEngineId()) {
  const caps = detectAudioCapabilities()
  let descriptor = engineById.get(normalizeAudioEngineId(id))
  let fellBack = false
  if (!isAudioEngineSupported(descriptor, caps)) {
    descriptor = engineById.get(DEFAULT_AUDIO_ENGINE_ID)
    fellBack = true
  }
  return { engine: descriptor.create(), id: descriptor.id, fellBack }
}
