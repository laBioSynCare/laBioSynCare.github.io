import { describe, expect, it, vi } from 'vitest'
import { holdThenRelease, teardownDelayMs } from './voiceRelease.js'

describe('teardownDelayMs', () => {
  it('waits for the release ramp to end, not for a fixed interval', () => {
    const ctx = { currentTime: 10 }
    // A stop scheduled 1.5 s ahead with a 50 ms release ends at 11.55.
    expect(teardownDelayMs(ctx, 11.55)).toBeCloseTo(1600, 5)
  })

  it('does not tear down early when the stop is scheduled ahead', () => {
    // The regression this exists for: the delay used to be
    // (releaseSeconds + 0.05) * 1000 = 100 ms regardless of stopTime, so a
    // lookahead scheduler disconnected the voice before it started releasing.
    const ctx = { currentTime: 0 }
    expect(teardownDelayMs(ctx, 1.55)).toBeGreaterThan(1000)
  })

  it('never returns a negative delay for a stop already in the past', () => {
    expect(teardownDelayMs({ currentTime: 5 }, 1)).toBe(0)
  })

  it('tolerates a missing context', () => {
    expect(teardownDelayMs(null, 0.1)).toBeCloseTo(150, 5)
  })
})

describe('holdThenRelease', () => {
  it('prefers cancelAndHoldAtTime so a mid-attack stop does not snap the gain', () => {
    const param = {
      value: 0.3,
      cancelAndHoldAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    }
    holdThenRelease(param, 2, 2.05)

    expect(param.cancelAndHoldAtTime).toHaveBeenCalledWith(2)
    expect(param.cancelScheduledValues).not.toHaveBeenCalled()
    expect(param.setValueAtTime).not.toHaveBeenCalled()
    expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 2.05)
  })

  it('falls back to pinning the current value where the API is missing', () => {
    const param = {
      value: 0.3,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    }
    holdThenRelease(param, 2, 2.05)

    expect(param.cancelScheduledValues).toHaveBeenCalledWith(2)
    expect(param.setValueAtTime).toHaveBeenCalledWith(0.3, 2)
    expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 2.05)
  })
})
