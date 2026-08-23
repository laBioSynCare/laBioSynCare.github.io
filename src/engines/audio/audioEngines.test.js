import { describe, expect, it } from 'vitest'
import {
  audioEngines,
  isAudioEngineSupported,
  resolveAudioEnginePreference,
} from './audioEngines.js'

const byId = (id) => audioEngines.find((engine) => engine.id === id)

describe('audio-engine capability resolution', () => {
  it('distinguishes browser availability from a saved selection', () => {
    const caps = { webAudio: true, audioWorklet: false, wasm: true }

    expect(isAudioEngineSupported(byId('vanilla'), caps)).toBe(true)
    expect(isAudioEngineSupported(byId('worklet'), caps)).toBe(false)
    expect(isAudioEngineSupported(byId('worklet-wasm'), caps)).toBe(false)
    expect(isAudioEngineSupported(byId('silent'), caps)).toBe(true)

    const resolution = resolveAudioEnginePreference('worklet-wasm', caps)
    expect(resolution.selected.id).toBe('worklet-wasm')
    expect(resolution.effective.id).toBe('vanilla')
    expect(resolution.fellBack).toBe(true)
  })

  it('uses the silent engine when Web Audio itself is unavailable', () => {
    const resolution = resolveAudioEnginePreference('vanilla', {
      webAudio: false,
      audioWorklet: false,
      wasm: true,
    })

    expect(resolution.effective.id).toBe('silent')
    expect(resolution.fellBack).toBe(true)
  })

  it('keeps a supported saved preference as the effective engine', () => {
    const resolution = resolveAudioEnginePreference('worklet-wasm', {
      webAudio: true,
      audioWorklet: true,
      wasm: true,
    })

    expect(resolution.effective.id).toBe('worklet-wasm')
    expect(resolution.fellBack).toBe(false)
  })

  it('normalizes an unknown stored id before capability resolution', () => {
    const resolution = resolveAudioEnginePreference('removed-engine', {
      webAudio: true,
      audioWorklet: false,
      wasm: true,
    })

    expect(resolution.selected.id).toBe('vanilla')
    expect(resolution.effective.id).toBe('vanilla')
    expect(resolution.fellBack).toBe(false)
  })
})
