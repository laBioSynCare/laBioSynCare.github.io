import { describe, it, expect } from 'vitest'
import {
  parseViewParams,
  formatZoomParam,
  pulseSchedule,
  pulseRateHz,
  pulseDurationMs,
  PULSE_CYCLES,
  PULSE_STEADY_MS,
  MIN_ZOOM,
  MAX_ZOOM,
  FLASH_SAFE_MAX_HZ,
} from './deepLink.js'

describe('parseViewParams', () => {
  it('reads a zoom level and the neighborhood focus flag', () => {
    const view = parseViewParams('?layer=terms,ecosystem&zoom=1.85&focus=neighborhood')
    expect(view).toEqual({ zoom: 1.85, neighborhoodFocus: true })
  })

  it('reports no zoom when the parameter is absent', () => {
    expect(parseViewParams('?layer=terms').zoom).toBeNull()
  })

  it('rejects a non-numeric, empty, zero or negative zoom rather than blanking the canvas', () => {
    for (const search of ['?zoom=', '?zoom=abc', '?zoom=0', '?zoom=-2', '?zoom=NaN']) {
      expect(parseViewParams(search).zoom, search).toBeNull()
    }
  })

  it('clamps to the camera bounds the canvas actually accepts', () => {
    expect(parseViewParams('?zoom=99').zoom).toBe(MAX_ZOOM)
    expect(parseViewParams('?zoom=0.0001').zoom).toBe(MIN_ZOOM)
  })

  it('only honours the one recognised focus value', () => {
    expect(parseViewParams('?focus=neighborhood').neighborhoodFocus).toBe(true)
    expect(parseViewParams('?focus=1').neighborhoodFocus).toBe(false)
    expect(parseViewParams('?focus=').neighborhoodFocus).toBe(false)
    expect(parseViewParams('').neighborhoodFocus).toBe(false)
  })

  it('round-trips a formatted zoom', () => {
    const zoom = 1.6666666
    expect(parseViewParams(`?zoom=${formatZoomParam(zoom)}`).zoom).toBeCloseTo(zoom, 2)
  })
})

describe('formatZoomParam', () => {
  it('keeps the address bar readable without losing visible precision', () => {
    expect(formatZoomParam(1)).toBe('1')
    expect(formatZoomParam(2.5)).toBe('2.5')
    expect(formatZoomParam(0.123456)).toBe('0.123')
  })
})

describe('arrival beacon', () => {
  // The one hard constraint: this is flashing content in a sensory-stimulation
  // app. WCAG 2.3.1 / Harding cap general flashing at three per second, which
  // flashSafety.js models as FLASH_SAFE_MAX_HZ.
  it('flashes below the general-safe ceiling', () => {
    expect(pulseRateHz()).toBeLessThan(FLASH_SAFE_MAX_HZ)
  })

  it('alternates on and off for the configured number of cycles', () => {
    const steps = pulseSchedule()
    expect(steps).toHaveLength(PULSE_CYCLES * 2)
    expect(steps.map((step) => step.on)).toEqual(
      Array.from({ length: PULSE_CYCLES * 2 }, (_, i) => i % 2 === 0),
    )
  })

  it('schedules strictly increasing times and ends dark', () => {
    const steps = pulseSchedule()
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].at).toBeGreaterThan(steps[i - 1].at)
    }
    expect(steps[steps.length - 1].on).toBe(false)
  })

  it('holds one steady halo instead of blinking under reduced motion', () => {
    const steps = pulseSchedule({ steady: true })
    expect(steps).toEqual([{ at: 0, on: true }, { at: PULSE_STEADY_MS, on: false }])
    expect(pulseDurationMs({ steady: true })).toBe(PULSE_STEADY_MS)
  })

  it('finishes fast enough to be an arrival cue, not an animation', () => {
    expect(pulseDurationMs()).toBeLessThanOrEqual(2500)
  })
})
