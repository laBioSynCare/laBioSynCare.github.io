import { writable } from 'svelte/store'
import { VanillaWebAudioEngine } from './VanillaWebAudioEngine.js'
import { AudioWorkletEngine } from './AudioWorkletEngine.js'
import { WasmAudioWorkletEngine } from './WasmAudioWorkletEngine.js'
import { NullAudioEngine } from './NullAudioEngine.js'

export const AUDIO_ENGINE_STORAGE_KEY = 'bsclab.audioEngine'
export const DEFAULT_AUDIO_ENGINE_ID = 'vanilla'

/**
 * Selectable audio engines. `requires` lists capability flags that must be true
 * for the engine to run. Unsupported engines are shown disabled in Settings;
 * creation prefers the compatible default and ultimately falls through to the
 * capability-free Silent engine. All implement IAudioEngine over the same voice
 * model (Carrier / IsochronicTone / BinauralBeat).
 */
export const audioEngines = [
  {
    id: 'vanilla',
    name: 'Vanilla Web Audio',
    tagline: 'Native nodes',
    description: 'Signal built from native Web Audio nodes (oscillators, gains, panners) on the main thread. Broadest compatibility; the default.',
    requires: ['webAudio'],
    create: () => new VanillaWebAudioEngine(),
  },
  {
    id: 'worklet',
    name: 'AudioWorklet',
    tagline: 'Audio-thread DSP (JS)',
    description: 'Each voice is synthesised sample-by-sample by a custom processor running on the dedicated audio render thread, isolated from main-thread jank.',
    requires: ['webAudio', 'audioWorklet'],
    create: () => new AudioWorkletEngine(),
  },
  {
    id: 'worklet-wasm',
    name: 'AudioWorklet + WASM',
    tagline: 'Audio-thread DSP (WebAssembly)',
    description: 'Same audio-thread voices, but the per-sample oscillator runs as a hand-written WebAssembly kernel (sine-LUT interpolation) for a near-native inner loop.',
    requires: ['webAudio', 'audioWorklet', 'wasm'],
    create: () => new WasmAudioWorkletEngine(),
  },
  {
    id: 'silent',
    name: 'Silent',
    tagline: 'Visual & timing only',
    description: 'Runs the session clock, control modulation and visual previews without creating an AudioContext or emitting sound. Works even when Web Audio is unavailable.',
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

/**
 * Resolve a saved preference to what playback can actually construct here.
 * The preference is not rewritten: availability belongs to this browser, and
 * Settings must be able to show selected-vs-effective state honestly.
 */
export function resolveAudioEnginePreference(
  id,
  caps = detectAudioCapabilities(),
) {
  const selected = engineById.get(normalizeAudioEngineId(id))
  if (isAudioEngineSupported(selected, caps)) {
    return { selected, effective: selected, fellBack: false }
  }

  const effective = audioEngines.find((engine) => (
    engine.id === DEFAULT_AUDIO_ENGINE_ID && isAudioEngineSupported(engine, caps)
  )) ?? audioEngines.find((engine) => isAudioEngineSupported(engine, caps))

  return { selected, effective, fellBack: effective?.id !== selected?.id }
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
 * Instantiate an engine by id, resolving the compatible default or Silent when
 * the requested engine's capabilities are unavailable on this browser. Returns
 * `{ engine, id, fellBack }`. Callers still `await engine.initialize()`.
 */
export function createAudioEngine(id = getActiveAudioEngineId()) {
  const caps = detectAudioCapabilities()
  const { effective, fellBack } = resolveAudioEnginePreference(id, caps)
  return { engine: effective.create(), id: effective.id, fellBack }
}
