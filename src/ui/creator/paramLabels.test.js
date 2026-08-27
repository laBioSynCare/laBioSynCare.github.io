import { describe, expect, it } from 'vitest'
import {
  KNOB_LABEL_MAX_CHARS,
  PARAM_SHORT_LABELS,
  paramLabel,
} from './paramLabels.js'
import {
  HAPTIC_PARAMS,
  MARTIGLI_PARAMS,
  SINUSOID_PARAMS,
  SPATIAL_VISUAL_PARAMS,
  SYMMETRY_PARAMS,
  VISUAL_VOICE_PARAMS,
  VOICE_PARAMS,
} from './presetDraft.js'

// Every parameter the studio can put a knob on. Derived from the draft model
// rather than listed here, so a new track type is covered the day it lands.
const KNOB_PARAMS = [...new Set([
  ...MARTIGLI_PARAMS,
  ...SYMMETRY_PARAMS,
  ...SINUSOID_PARAMS,
  ...Object.values(VOICE_PARAMS).flat(),
  ...Object.values(VISUAL_VOICE_PARAMS).flat(),
  ...SPATIAL_VISUAL_PARAMS,
  ...HAPTIC_PARAMS,
])]

describe('knob captions', () => {
  it('covers every parameter the studio can put a knob on', () => {
    expect(KNOB_PARAMS.length).toBeGreaterThan(0)
    for (const name of KNOB_PARAMS) {
      expect(typeof paramLabel(name), name).toBe('string')
      expect(paramLabel(name).length, name).toBeGreaterThan(0)
    }
  })

  // The defect this file exists to prevent: `inhaleRatio` rendered as
  // "inhaler". A caption over the budget is silently clipped by CSS, so
  // nothing else in the build would catch it.
  it('keeps every caption inside the 56px column', () => {
    const tooLong = KNOB_PARAMS
      .map(name => [name, paramLabel(name)])
      .filter(([, label]) => label.length > KNOB_LABEL_MAX_CHARS)
    expect(
      tooLong,
      `captions over ${KNOB_LABEL_MAX_CHARS} chars: ${tooLong.map(([n, l]) => `${n} -> "${l}"`).join(', ')}`,
    ).toEqual([])
  })

  it('never abbreviates a caption into a different word', () => {
    // Regression guard for the specific misreading, and a reminder that a
    // truncation is not a rename: the abbreviation has to stay recognisable.
    expect(paramLabel('inhaleRatio')).toBe('inhale')
    expect(paramLabel('inhaleRatio')).not.toBe('inhaler')
  })

  it('leaves keys that already fit untouched', () => {
    expect(paramLabel('gain')).toBe('gain')
    expect(paramLabel('pan')).toBe('pan')
    expect(paramLabel('cutoff')).toBe('cutoff')
  })

  it('maps only parameters that need it', () => {
    for (const [name, label] of Object.entries(PARAM_SHORT_LABELS)) {
      if (name.length <= KNOB_LABEL_MAX_CHARS && label !== 'rate' && label !== 'note%') {
        expect(label.length, `${name} is already short enough to need no entry`)
          .toBeLessThan(name.length)
      }
    }
  })
})
