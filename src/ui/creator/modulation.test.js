import { describe, expect, it } from 'vitest'
import {
  clampRange,
  effectiveTempoValue,
  evalParamValue,
  modAmountRange,
  resolveBinauralLR,
  sumMods,
} from './modulation.js'
import { createTempoSyncConfig, tempoContextFromTiming } from './tempo.js'

const RANGES = {
  gain: [0, 1, 0.01],
  frequency: [20, 2000, 1],
  pulseRate: [0.5, 50, 0.5],
}

describe('clampRange', () => {
  it('clamps into the named range', () => {
    expect(clampRange(5, RANGES, 'gain')).toBe(1)
    expect(clampRange(-2, RANGES, 'gain')).toBe(0)
    expect(clampRange(0.5, RANGES, 'gain')).toBe(0.5)
  })

  it('passes the value through when there is no range for the param', () => {
    expect(clampRange(999, RANGES, 'unknown')).toBe(999)
    expect(clampRange(999, undefined, 'gain')).toBe(999)
  })
})

describe('modAmountRange', () => {
  it('is symmetric around zero at the target param span', () => {
    expect(modAmountRange(0, 1, 0.01)).toEqual([-1, 1, 0.01])
    expect(modAmountRange(20, 2000, 1)).toEqual([-1980, 1980, 1])
  })

  it('enforces a minimum span and a positive step', () => {
    const [min, max, step] = modAmountRange(5, 5, 0)
    expect(min).toBe(-0.01)
    expect(max).toBe(0.01)
    expect(step).toBeGreaterThan(0)
  })
})

describe('sumMods', () => {
  const controlValues = new Map([['a', 2], ['b', -3]])

  it('sums enabled amount·control contributions', () => {
    const delta = sumMods([{ controlId: 'a', amount: 1.5 }, { controlId: 'b', amount: 2 }], controlValues)
    expect(delta).toBe(1.5 * 2 + 2 * -3)
  })

  it('ignores disabled mods and control ids that do not resolve', () => {
    const delta = sumMods(
      [{ controlId: 'a', amount: 1, enabled: false }, { controlId: 'z', amount: 5 }],
      controlValues,
    )
    expect(delta).toBe(0)
  })

  it('treats missing/empty mod arrays as zero', () => {
    expect(sumMods(undefined, controlValues)).toBe(0)
    expect(sumMods([], controlValues)).toBe(0)
  })
})

describe('effectiveTempoValue', () => {
  const ctx = tempoContextFromTiming({ bpm: { value: 120 }, beatsPerBar: 4 }) // 1 beat = 0.5s

  it('returns the fallback when BPM is disabled', () => {
    const cfg = createTempoSyncConfig({ enabled: true, division: '1/4' })
    expect(effectiveTempoValue({ tempoSync: cfg }, 10, 'rate', ctx, false)).toBe(10)
  })

  it('returns the fallback when the param is not tempo-synced', () => {
    const cfg = createTempoSyncConfig({ enabled: false })
    expect(effectiveTempoValue({ tempoSync: cfg }, 10, 'rate', ctx, true)).toBe(10)
  })

  it('derives duration and rate from the division at 120 BPM', () => {
    const cfg = createTempoSyncConfig({ enabled: true, division: '1/4' })
    expect(effectiveTempoValue({ tempoSync: cfg }, 0, 'duration', ctx, true)).toBeCloseTo(0.5)
    expect(effectiveTempoValue({ tempoSync: cfg }, 0, 'rate', ctx, true)).toBeCloseTo(2)
  })
})

describe('evalParamValue', () => {
  const controlValues = new Map([['ctl', 4]])

  it('computes clamp(base + Σ amount·control)', () => {
    const param = { value: 0.2, mods: [{ controlId: 'ctl', amount: 0.1 }] } // 0.2 + 0.4 = 0.6
    expect(evalParamValue(param, { name: 'gain', ranges: RANGES, controlValues })).toBeCloseTo(0.6)
  })

  it('clamps the result into the param range', () => {
    const param = { value: 0.9, mods: [{ controlId: 'ctl', amount: 1 }] } // 4.9 → 1
    expect(evalParamValue(param, { name: 'gain', ranges: RANGES, controlValues })).toBe(1)
  })

  it('forces gain to 0 when the track is muted', () => {
    const param = { value: 0.8, mods: [] }
    expect(evalParamValue(param, { name: 'gain', ranges: RANGES, controlValues, muted: true })).toBe(0)
  })

  it('does not mute non-gain params', () => {
    const param = { value: 200, mods: [] }
    expect(evalParamValue(param, { name: 'frequency', ranges: RANGES, controlValues, muted: true })).toBe(200)
  })

  it('uses the tempo-effective base (ignoring param.value) when tempo-synced', () => {
    const ctx = tempoContextFromTiming({ bpm: { value: 120 }, beatsPerBar: 4 })
    const param = {
      value: 999,
      mods: [],
      tempoSync: createTempoSyncConfig({ enabled: true, division: '1/4' }), // rate = 2 Hz
    }
    const v = evalParamValue(param, {
      name: 'pulseRate',
      ranges: RANGES,
      controlValues,
      tempoKind: 'rate',
      tempoContext: ctx,
      bpmEnabled: true,
    })
    expect(v).toBeCloseTo(2)
  })
})

describe('resolveBinauralLR', () => {
  const range = [20, 2000]
  const noControl = new Map()

  it('splits center/beat into a symmetric carrier pair', () => {
    const { leftFreq, rightFreq } = resolveBinauralLR({
      baseLeft: 200, baseRight: 210, beatBase: 10,
      centerMods: [], beatMods: [], controlValues: noControl, range,
    })
    expect(leftFreq).toBe(200)
    expect(rightFreq).toBe(210)
  })

  it('applies center modulation to both carriers equally', () => {
    const cv = new Map([['c', 1]])
    const { leftFreq, rightFreq } = resolveBinauralLR({
      baseLeft: 200, baseRight: 210, beatBase: 10,
      centerMods: [{ controlId: 'c', amount: 20 }], beatMods: [], controlValues: cv, range,
    })
    expect(leftFreq).toBe(220)
    expect(rightFreq).toBe(230)
  })

  it('applies beat modulation symmetrically around the center', () => {
    const cv = new Map([['c', 1]])
    const { leftFreq, rightFreq } = resolveBinauralLR({
      baseLeft: 200, baseRight: 210, beatBase: 10,
      centerMods: [], beatMods: [{ controlId: 'c', amount: 4 }], controlValues: cv, range,
    })
    expect(leftFreq).toBe(198)
    expect(rightFreq).toBe(212)
  })

  it('clamps each carrier into the frequency range', () => {
    const { leftFreq, rightFreq } = resolveBinauralLR({
      baseLeft: 30, baseRight: 30, beatBase: 100, // center 30, beat 100 → -20/80
      centerMods: [], beatMods: [], controlValues: noControl, range,
    })
    expect(leftFreq).toBe(20)
    expect(rightFreq).toBe(80)
  })
})
