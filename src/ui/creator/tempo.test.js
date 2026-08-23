import { describe, expect, it } from 'vitest'
import {
  barSeconds,
  beatSeconds,
  createTempoSyncConfig,
  divisionBeats,
  evaluateModulatedBpm,
  tempoSyncDurationSeconds,
  tempoSyncRateHz,
} from './tempo.js'

describe('tempo helpers', () => {
  it('converts BPM to beat and bar duration', () => {
    expect(beatSeconds(120)).toBeCloseTo(0.5)
    expect(barSeconds(120, 3)).toBeCloseTo(1.5)
  })

  it('converts divisions with bar, dotted, and triplet modifiers', () => {
    expect(divisionBeats('bar', 'straight', 5)).toBe(5)
    expect(divisionBeats('1/4', 'dotted', 4)).toBeCloseTo(1.5)
    expect(divisionBeats('1/8', 'triplet', 4)).toBeCloseTo(1 / 3)
  })

  it('converts tempo sync configs to durations and rates', () => {
    const beats = createTempoSyncConfig({ enabled: true, mode: 'beats', beats: 2 })
    const division = createTempoSyncConfig({ enabled: true, mode: 'division', division: '1/8', modifier: 'straight' })

    expect(tempoSyncDurationSeconds(beats, 60, 4)).toBeCloseTo(2)
    expect(tempoSyncRateHz(beats, 60, 4)).toBeCloseTo(0.5)
    expect(tempoSyncDurationSeconds(division, 120, 4)).toBeCloseTo(0.25)
    expect(tempoSyncRateHz(division, 120, 4)).toBeCloseTo(4)
  })

  it('evaluates BPM modulation from supplied control values and clamps', () => {
    const bpm = {
      value: 120,
      mods: [
        { controlId: 'a', amount: 20, enabled: true },
        { controlId: 'b', amount: 200, enabled: false },
        { controlId: 'c', amount: -1000, enabled: true },
      ],
    }
    const values = new Map([
      ['a', 0.5],
      ['c', 1],
    ])

    expect(evaluateModulatedBpm(bpm, values)).toBe(1)
  })
})
