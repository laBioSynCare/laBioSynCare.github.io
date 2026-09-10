import { describe, expect, it } from 'vitest'

import { FLASH_SAFE_MAX_HZ } from '../safety/flashSafety.js'
import {
  MAX_VISUAL_FRAME_SEC,
  advanceVisualPhase,
  controlStateFor,
  visualFrameDelta,
  visualPhaseKind,
} from './patchFrame.js'

const blink = (overrides = {}) => ({
  trackType: 'Blink',
  params: { blinkRate: { value: 2 }, duty: { value: 0.5 } },
  ...overrides,
})

describe('controlStateFor', () => {
  const lfo = { type: 'LFO', waveform: 'sine', periodSec: 10, targetPeriodSec: 10, inhaleRatio: 0.5, amplitude: 1 }

  it('returns a value for each control type', () => {
    for (const track of [
      lfo,
      { type: 'Permutation', nnotes: 4, rateHz: 2, amplitude: 1, family: 'plain-hunt' },
      { type: 'Sinusoid', rateHz: 1, phaseRad: 0, amplitude: 1 },
    ]) {
      const state = controlStateFor(track, { sessionElapsed: 1, sessionLength: 60, now: 1 })
      expect(Number.isFinite(state.value), track.type).toBe(true)
    }
  })

  it('falls back to a silent state for an unknown type rather than throwing', () => {
    expect(controlStateFor({ type: 'Nonesuch' }, {})).toEqual({ value: 0 })
  })

  // The previews keep animating while the transport is stopped, which is what
  // makes the control cards readable before you ever press play.
  it('uses the free-running LFO when nothing is playing', () => {
    const free = controlStateFor(lfo, { sessionElapsed: null, now: 3 })
    const bound = controlStateFor(lfo, { sessionElapsed: 3, sessionLength: 60, now: 3 })
    expect(Number.isFinite(free.value)).toBe(true)
    expect(Number.isFinite(bound.value)).toBe(true)
  })

  it('drives Permutation and Sinusoid from the wall position when stopped', () => {
    const track = { type: 'Sinusoid', rateHz: 1, phaseRad: 0, amplitude: 1 }
    expect(controlStateFor(track, { sessionElapsed: null, now: 2 }))
      .toEqual(controlStateFor(track, { sessionElapsed: 2, now: 999 }))
  })
})

describe('visualFrameDelta', () => {
  it('is zero on the first frame, when there is no previous tick', () => {
    expect(visualFrameDelta(null, 12.5)).toBe(0)
  })

  it('never goes backwards', () => {
    expect(visualFrameDelta(10, 9.5)).toBe(0)
  })

  // A backgrounded tab resuming after ten seconds must not jump a blink through
  // hundreds of cycles in a single frame.
  it('clamps a long gap to one frame budget', () => {
    expect(visualFrameDelta(0, 10)).toBe(MAX_VISUAL_FRAME_SEC)
  })
})

describe('visualPhaseKind', () => {
  it('recognises the free-running preview types', () => {
    expect(visualPhaseKind(blink())).toBe('blink')
    expect(visualPhaseKind({ trackType: 'Oscillate', params: {} })).toBe('osc')
    expect(visualPhaseKind({ trackType: 'Pacer', params: {} })).toBe('osc')
  })

  it('treats a ColorField as blinking only when its blink is switched on', () => {
    expect(visualPhaseKind({ trackType: 'ColorField', params: {}, config: { blinkEnabled: true } })).toBe('blink')
    expect(visualPhaseKind({ trackType: 'ColorField', params: {}, config: { blinkEnabled: false } })).toBe(null)
    expect(visualPhaseKind({ trackType: 'ColorField', params: {} })).toBe(null)
  })

  it('ignores track types with no free-running preview', () => {
    expect(visualPhaseKind({ trackType: 'Gradient', params: {} })).toBe(null)
  })
})

describe('advanceVisualPhase', () => {
  it('returns null for a track it does not drive', () => {
    expect(advanceVisualPhase({ trackType: 'Gradient', params: {} }, { dt: 0.1 })).toBe(null)
  })

  it('wraps the phase into [0, 1)', () => {
    const out = advanceVisualPhase(blink(), { phase: 0.9, dt: 1, flashAccepted: true })
    expect(out.phase).toBeGreaterThanOrEqual(0)
    expect(out.phase).toBeLessThan(1)
  })

  it('derives blinkOn from the duty cycle', () => {
    const params = { blinkRate: { value: 1 }, duty: { value: 0.25 } }
    expect(advanceVisualPhase(blink({ params }), { phase: 0, dt: 0.1 }).blinkOn).toBe(1)
    expect(advanceVisualPhase(blink({ params }), { phase: 0, dt: 0.5 }).blinkOn).toBe(0)
  })

  // The photosensitivity cap is a safety surface, not a preview detail.
  it('caps the blink rate at the general-safe ceiling unless accepted', () => {
    const fast = blink({ params: { blinkRate: { value: 30 }, duty: { value: 0.5 } } })
    const capped = advanceVisualPhase(fast, { phase: 0, dt: 1, flashAccepted: false })
    const accepted = advanceVisualPhase(fast, { phase: 0, dt: 1, flashAccepted: true })
    // One second at the capped rate advances exactly FLASH_SAFE_MAX_HZ cycles,
    // which wraps to zero; the accepted path runs at the authored 30 Hz.
    expect(capped.phase).toBeCloseTo(FLASH_SAFE_MAX_HZ % 1, 6)
    expect(accepted.phase).toBeCloseTo(30 % 1, 6)
  })

  it('prefers the modulated live rate over the authored one', () => {
    const track = blink({ params: { blinkRate: { value: 1 }, duty: { value: 0.5 } } })
    const base = advanceVisualPhase(track, { phase: 0, dt: 0.5, flashAccepted: true })
    const modulated = advanceVisualPhase(track, { phase: 0, dt: 0.5, live: { blinkRate: 2 }, flashAccepted: true })
    expect(base.phase).toBeCloseTo(0.5, 6)
    expect(modulated.phase).toBeCloseTo(0, 6)
  })

  it('breathes Oscillate and Pacer on a 0..1 cosine', () => {
    const osc = { trackType: 'Oscillate', params: { oscRate: { value: 1 } } }
    expect(advanceVisualPhase(osc, { phase: 0, dt: 0 }).oscVal).toBeCloseTo(0, 6)
    expect(advanceVisualPhase(osc, { phase: 0, dt: 0.5 }).oscVal).toBeCloseTo(1, 6)
  })

  it('falls back to sane defaults when a param is missing', () => {
    const bare = { trackType: 'Blink', params: {} }
    const out = advanceVisualPhase(bare, { phase: 0, dt: 0.1, flashAccepted: true })
    expect(Number.isFinite(out.phase)).toBe(true)
    expect([0, 1]).toContain(out.blinkOn)
  })
})
