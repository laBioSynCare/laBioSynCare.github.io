import { describe, it, expect } from 'vitest'
import {
  parseViewParams,
  focusOnArrival,
  focusParamFor,
  formatZoomParam,
  pulseSchedule,
  pulseRateHz,
  pulseDurationMs,
  PULSE_CYCLES,
  PULSE_STEADY_MS,
  MIN_ZOOM,
  MAX_ZOOM,
  FLASH_SAFE_MAX_HZ,
  qualifyArrivalHash,
  propertyEnds,
  propertyFocusPositions,
} from './deepLink.js'
import { PREFIXES, SSTIM } from '../../rdf/namespaces.js'

describe('qualifyArrivalHash', () => {
  it('qualifies the bare fragment a namespace route delivers, and drops the parameter', () => {
    // What a browser holds after w3id answers .../framework/bsc/vocab#Voice
    // with /graph/?ns=bsc-v and re-attaches the fragment it never sent.
    expect(qualifyArrivalHash('?ns=bsc-v', '#Voice', PREFIXES))
      .toEqual({ hash: '#bsc-v:Voice', search: '' })
  })

  it('keeps every other parameter', () => {
    expect(qualifyArrivalHash('?zoom=1.5&ns=bsc-v&focus=neighborhood', '#groupHeal', PREFIXES))
      .toEqual({ hash: '#bsc-v:groupHeal', search: '?zoom=1.5&focus=neighborhood' })
  })

  it('leaves a hash that already names its prefix alone', () => {
    expect(qualifyArrivalHash('?ns=bsc-v', '#sstim-v:alpha', PREFIXES))
      .toEqual({ hash: '#sstim-v:alpha', search: '' })
  })

  it('does not invent a prefix it does not know', () => {
    expect(qualifyArrivalHash('?ns=nonsense', '#Voice', PREFIXES))
      .toEqual({ hash: '#Voice', search: '' })
  })

  it('opens the namespace itself without a hash when no fragment arrived', () => {
    expect(qualifyArrivalHash('?ns=bsc-v', '', PREFIXES)).toEqual({ hash: '', search: '' })
  })

  it('changes nothing without the parameter', () => {
    expect(qualifyArrivalHash('?zoom=2', '#Preset', PREFIXES))
      .toEqual({ hash: '#Preset', search: '?zoom=2' })
  })

  it('knows the prefix the BSC vocabulary route sends', () => {
    expect(PREFIXES['bsc-v']).toBe('https://w3id.org/sstim/framework/bsc/vocab#')
  })
})

describe('parseViewParams', () => {
  it('reads a zoom level and the neighborhood focus flag', () => {
    const view = parseViewParams('?layer=terms,ecosystem&zoom=1.85&focus=neighborhood')
    expect(view).toEqual({ zoom: 1.85, neighborhoodFocus: true, focus: 'neighborhood' })
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

describe('focus on arrival', () => {
  it('reads both stated values, and nothing else', () => {
    expect(parseViewParams('?focus=neighborhood').focus).toBe('neighborhood')
    expect(parseViewParams('?focus=none').focus).toBe('none')
    expect(parseViewParams('?focus=none').neighborhoodFocus).toBe(false)
    expect(parseViewParams('?focus=1').focus).toBeNull()
    expect(parseViewParams('').focus).toBeNull()
  })

  it('folds the graph around whatever a link names unless it states none', () => {
    expect(focusOnArrival(null)).toBe(true)
    expect(focusOnArrival('neighborhood')).toBe(true)
    expect(focusOnArrival('none')).toBe(false)
  })

  it('writes what a recipient needs to see the same view', () => {
    for (const focused of [true, false]) {
      expect(focusOnArrival(focusParamFor(focused)), `focused=${focused}`).toBe(focused)
    }
    expect(focusParamFor(false)).toBe('none')
  })
})

describe("a property's neighbourhood", () => {
  // The shapes graph.js draws: one edge per domain class and range, carrying
  // the property's IRI, beside catalog relations that use the same predicate.
  const USES = SSTIM('usesTechnique').value
  const BEAT = SSTIM('beatHz').value
  const edge = (id, kind, iri, source, target) => ({ data: { id, kind, iri, source, target } })
  const elements = [
    { data: { id: 'Protocol' } },
    { data: { id: 'Preset' } },
    { data: { id: 'Technique' } },
    edge('obj_a', 'objProp', USES, 'Protocol', 'Technique'),
    edge('obj_b', 'objProp', USES, 'Preset', 'Technique'),
    edge('rel_1', 'catalogRelation', USES, 'some-record', 'Technique'),
    edge('dat_1', 'dataProp', BEAT, 'AudioTrack', 'xsd:decimal'),
  ]

  it('collects the ends of every edge drawn for the property, once each', () => {
    expect(propertyEnds(elements, { iri: USES, kind: 'objProp' }))
      .toEqual({ sources: ['Protocol', 'Preset'], targets: ['Technique'] })
  })

  it('is the domain and range, not every record using the predicate', () => {
    const { sources } = propertyEnds(elements, { iri: USES, kind: 'objProp' })
    expect(sources).not.toContain('some-record')
  })

  it('reaches a datatype property through its datatype node', () => {
    expect(propertyEnds(elements, { iri: BEAT, kind: 'dataProp' }))
      .toEqual({ sources: ['AudioTrack'], targets: ['xsd:decimal'] })
  })

  it('leaves out an end the view may not show', () => {
    const shown = (id) => id !== 'Preset'
    expect(propertyEnds(elements, { iri: USES, kind: 'objProp' }, shown).sources).toEqual(['Protocol'])
  })

  it('treats a class the property links to itself as a source only', () => {
    const loop = [edge('obj_l', 'objProp', USES, 'Concept', 'Concept')]
    expect(propertyEnds(loop, { iri: USES, kind: 'objProp' }))
      .toEqual({ sources: ['Concept'], targets: [] })
  })

  it('finds nothing for a selection that is not a property', () => {
    expect(propertyEnds(elements, { kind: 'objProp' })).toEqual({ sources: [], targets: [] })
  })

  it('lays the ends out left to right, each column centred', () => {
    const positions = propertyFocusPositions(['a', 'b'], ['c'], { columnGap: 200, rowGap: 100 })
    expect(positions.get('a')).toEqual({ x: -100, y: -50 })
    expect(positions.get('b')).toEqual({ x: -100, y: 50 })
    expect(positions.get('c')).toEqual({ x: 100, y: 0 })
  })

  it('centres a lone class that the property links to itself', () => {
    expect(propertyFocusPositions(['a'], []).get('a')).toEqual({ x: 0, y: 0 })
  })
})
