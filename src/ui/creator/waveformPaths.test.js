import { describe, expect, it } from 'vitest'
import {
  adaptiveSamples,
  binauralRowWindow,
  binauralSumPath,
  isoEnvSpec,
  isoEnvelopeOutlinePath,
  isoWavePath,
  noisePath,
  polygonPoints,
  rectanglePath,
  sineWavePath,
} from './waveformPaths.js'

describe('adaptiveSamples', () => {
  it('never drops below the base or above the cap', () => {
    expect(adaptiveSamples(0)).toBe(200)
    expect(adaptiveSamples(1000)).toBe(1500)
  })

  it('scales with visible cycles between the bounds', () => {
    expect(adaptiveSamples(50)).toBe(300) // ceil(50 * 6)
  })
})

describe('binauralRowWindow', () => {
  it('caps the window at one beat period', () => {
    expect(binauralRowWindow(10, 5)).toBeCloseTo(0.1)
  })

  it('falls back to the user window for tiny or invalid beats', () => {
    expect(binauralRowWindow(0, 5)).toBe(5)
    expect(binauralRowWindow(Number.NaN, 5)).toBe(5)
  })
})

describe('isoEnvSpec', () => {
  it('honors the track envelope type and note fraction', () => {
    const track = { envelope: 'AD', params: { pulseRate: { value: 10 } }, noteDurationFrac: 0.5 }
    const spec = isoEnvSpec(track)
    expect(spec.type).toBe('AD')
    expect(spec.noteDurationFrac).toBeCloseTo(0.5)
  })

  it('raises attack/release to a click-safe minimum at high pulse rate', () => {
    const track = {
      envelope: 'AR',
      params: { pulseRate: { value: 50 } },
      noteDurationFrac: 1,
      attackFrac: 0.0001,
      releaseFrac: 0.0001,
    }
    const spec = isoEnvSpec(track)
    // noteSec = 1/50 = 0.02; minPhaseFrac = min(0.4, 0.0005/0.02) = 0.025
    expect(spec.attackFrac).toBeCloseTo(0.025)
    expect(spec.releaseFrac).toBeCloseTo(0.025)
  })

  it('respects a note-duration override', () => {
    const track = { envelope: 'AR', params: { pulseRate: { value: 10 }, noteDurationFrac: { value: 0.5 } } }
    expect(isoEnvSpec(track, 0.2).noteDurationFrac).toBeCloseTo(0.2)
  })
})

describe('path builders', () => {
  it('rectanglePath returns a closed rectangle', () => {
    expect(rectanglePath(0, 100, 20, 10)).toBe('M0 10.0 L100 10.0 L100 30.0 L0 30.0 Z')
  })

  it('sineWavePath begins with a moveto and emits samples+1 vertices', () => {
    const d = sineWavePath(0, 100, 20, 10, 2, 8)
    expect(d.startsWith('M')).toBe(true)
    expect(d.match(/[ML]/g)).toHaveLength(9) // vertices 0..8 inclusive
    expect(d.includes('NaN')).toBe(false)
  })

  it('binauralSumPath produces a finite path string', () => {
    const d = binauralSumPath(0, 100, 20, 10, 3, 4, 10)
    expect(d.startsWith('M')).toBe(true)
    expect(d.includes('NaN')).toBe(false)
  })

  it('isoWavePath / isoEnvelopeOutlinePath accept an envelope spec', () => {
    const env = isoEnvSpec({ envelope: 'AR', params: { pulseRate: { value: 10 } }, noteDurationFrac: 0.5 })
    expect(isoWavePath(0, 100, 20, 10, 4, env, 2, 16).startsWith('M')).toBe(true)
    expect(isoEnvelopeOutlinePath(0, 100, 20, 10, env, 2, 16).endsWith('Z')).toBe(true)
  })

  it('polygonPoints emits a vertex count clamped to 3..12', () => {
    expect(polygonPoints(3).split(' ')).toHaveLength(3)
    expect(polygonPoints(6).split(' ')).toHaveLength(6)
    expect(polygonPoints(99).split(' ')).toHaveLength(12)
    expect(polygonPoints(1).split(' ')).toHaveLength(3)
  })

  it('noisePath is deterministic across calls (seeded)', () => {
    expect(noisePath(0, 100, 20, 10, 0.5)).toBe(noisePath(0, 100, 20, 10, 0.5))
  })
})
