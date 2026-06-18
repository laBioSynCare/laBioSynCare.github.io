import { describe, expect, it } from 'vitest'
import {
  SENSORY_FIELD_MODEL,
  createFieldState,
  normalizeFieldState,
  resolveEarFrequencies,
} from './fieldState.js'

describe('fieldState', () => {
  it('creates a tagged default state', () => {
    const s = createFieldState()
    expect(s.model).toBe(SENSORY_FIELD_MODEL)
    expect(s.visual.enabled).toBe(true)
    expect(s.audio.left.freqHz).toBe(200)
  })

  it('normalises and clamps out-of-range or malformed input', () => {
    const s = normalizeFieldState({
      visual: { color: 'not-a-color', intensity: 5, blinkRateHz: 999 },
      audio: { beatMode: 'bogus', left: { freqHz: 5, gain: -1 } },
    })
    expect(s.model).toBe(SENSORY_FIELD_MODEL)
    expect(s.visual.color).toBe('#3355ff') // rejected bad color → default
    expect(s.visual.intensity).toBe(1) // clamped to 1
    expect(s.visual.blinkRateHz).toBe(60) // clamped to BLINK_MAX_HZ
    expect(s.audio.beatMode).toBe('none') // rejected → default
    expect(s.audio.left.freqHz).toBe(50) // clamped to TONE_MIN_HZ
    expect(s.audio.left.gain).toBe(0) // clamped to 0
    expect(s.flashRiskAccepted).toBe(false)
  })

  it('resolves linked ear frequencies', () => {
    const s = createFieldState()
    s.audio.linkEars = true
    s.audio.left.freqHz = 240
    expect(resolveEarFrequencies(s)).toEqual({ left: 240, right: 240 })
  })

  it('splits a binaural beat symmetrically around the centre', () => {
    const s = createFieldState()
    s.audio.linkEars = true
    s.audio.left.freqHz = 200
    s.audio.beatMode = 'binaural'
    s.audio.beatRateHz = 4
    expect(resolveEarFrequencies(s)).toEqual({ left: 198, right: 202 })
  })

  it('keeps ears independent when unlinked and no beat', () => {
    const s = createFieldState()
    s.audio.linkEars = false
    s.audio.left.freqHz = 200
    s.audio.right.freqHz = 260
    expect(resolveEarFrequencies(s)).toEqual({ left: 200, right: 260 })
  })
})
