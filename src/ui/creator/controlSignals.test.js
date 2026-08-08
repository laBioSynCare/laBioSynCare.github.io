import { describe, expect, it } from 'vitest'
import { computeSinusoidState, evaluateControl } from './controlSignals.js'

describe('general sinusoid control', () => {
  it('honors frequency, amplitude, and explicit phase', () => {
    const track = { type: 'Sinusoid', rateHz: 2, phaseRad: Math.PI / 2, amplitude: 0.75 }

    expect(computeSinusoidState(track, 0).value).toBeCloseTo(0.75)
    expect(computeSinusoidState(track, 0.125).value).toBeCloseTo(0)
    expect(computeSinusoidState(track, 0.25).value).toBeCloseTo(-0.75)
  })

  it('supports phase-paired circular x/y signals', () => {
    const x = { type: 'Sinusoid', rateHz: 1, phaseRad: 0, amplitude: 1 }
    const y = { type: 'Sinusoid', rateHz: 1, phaseRad: Math.PI / 2, amplitude: 1 }

    for (const t of [0, 0.125, 0.25, 0.5, 0.875]) {
      const xv = evaluateControl(x, t)
      const yv = evaluateControl(y, t)
      expect(xv * xv + yv * yv).toBeCloseTo(1, 8)
    }
  })

  it('pins the supported Field-equivalent range', () => {
    expect(computeSinusoidState({ rateHz: 80, amplitude: 5, phaseRad: 0 }, 1))
      .toMatchObject({ rateHz: 40, amp: 2 })
    expect(computeSinusoidState({ rateHz: -5, amplitude: -1, phaseRad: 0 }, 1))
      .toMatchObject({ rateHz: 0, amp: 0, value: 0 })
  })
})
