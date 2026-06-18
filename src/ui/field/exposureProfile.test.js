import { describe, expect, it } from 'vitest'
import { Parser } from 'n3'
import { createFieldState } from './fieldState.js'
import { fieldStateToQuads, fieldStateToTurtle } from './exposureProfile.js'

const opts = { id: 'test-0001', now: '2026-06-18T00:00:00.000Z' }

describe('exposureProfile', () => {
  it('emits a profile with per-ear laterality and quantitative properties', async () => {
    const ttl = await fieldStateToTurtle(createFieldState(), opts)
    expect(ttl).toContain('sstim-ex:ExposureProfile')
    expect(ttl).toContain('sstim-ex:placementEarLeft')
    expect(ttl).toContain('sstim-ex:placementEarRight')
    expect(ttl).toContain('sstim-ex:hasFrequencyHz')
    expect(ttl).toContain('sstim-ex:hasGainLevel')
    expect(ttl).toContain('sstim-ex:knownInSSTIM')
  })

  it('produces parseable Turtle', async () => {
    const ttl = await fieldStateToTurtle(createFieldState(), opts)
    const quads = new Parser().parse(ttl)
    expect(quads.length).toBeGreaterThan(20)
  })

  it('adds blink + photosensitivity terms only when blinking', () => {
    const off = createFieldState()
    const offTtl = fieldStateToQuads(off, opts).map((q) => q.predicate.value + ' ' + q.object.value).join('\n')
    expect(offTtl).not.toContain('patternBlinking')

    const on = createFieldState()
    on.visual.blinkEnabled = true
    on.visual.blinkRateHz = 3
    const onObjs = fieldStateToQuads(on, opts).map((q) => q.object.value)
    expect(onObjs).toContain('https://w3id.org/sstim/exposure#patternBlinking')
    expect(onObjs).toContain('https://w3id.org/sstim/exposure#boundaryPhotosensitivity')
  })

  it('emits a beat frequency for a binaural beat', () => {
    const s = createFieldState()
    s.audio.beatMode = 'binaural'
    s.audio.beatRateHz = 4
    const preds = fieldStateToQuads(s, opts).map((q) => q.predicate.value)
    expect(preds).toContain('https://w3id.org/sstim/exposure#hasBeatFrequencyHz')
  })

  it('omits the audio channels when audio is disabled', () => {
    const s = createFieldState()
    s.audio.enabled = false
    const objs = fieldStateToQuads(s, opts).map((q) => q.object.value)
    expect(objs).not.toContain('https://w3id.org/sstim/exposure#placementEarLeft')
    expect(objs).toContain('https://w3id.org/sstim/exposure#mediumVisualLight')
  })
})
