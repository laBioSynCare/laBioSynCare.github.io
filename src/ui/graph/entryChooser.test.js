import { describe, expect, it } from 'vitest'

import { GRAPH_CONCERNS } from './concerns.js'
import { ENTRY_POINTS, ENTRY_POINT_VALUES, SCOPE_PARAMS, shouldOfferEntryPoint } from './entryChooser.js'

describe('the entry points offered on arrival', () => {
  it('all resolve to real concerns, in the declared order', () => {
    expect(ENTRY_POINTS.map((entry) => entry.value)).toEqual(ENTRY_POINT_VALUES)
    for (const entry of ENTRY_POINTS) {
      expect(GRAPH_CONCERNS).toContainEqual(entry)
      expect(entry.label).toBeTruthy()
      // Each `about` is the chooser's description of the card, so an empty one
      // ships a button with no explanation.
      expect(entry.about.length).toBeGreaterThan(20)
    }
  })

  it('offers enough to describe the domain without becoming a second hairball', () => {
    expect(ENTRY_POINTS.length).toBeGreaterThanOrEqual(4)
    expect(ENTRY_POINTS.length).toBeLessThanOrEqual(8)
  })
})

describe('shouldOfferEntryPoint', () => {
  it('offers the chooser on a bare arrival', () => {
    expect(shouldOfferEntryPoint({ search: '', hash: '', session: {} })).toBe(true)
    expect(shouldOfferEntryPoint()).toBe(true)
  })

  // w3id.org resolves into this page, so a published link has already said
  // where it wants to land. The chooser must never come between the two.
  it('never interrupts a link that already names a scope', () => {
    for (const param of SCOPE_PARAMS) {
      expect(
        shouldOfferEntryPoint({ search: `?${param}=anything` }),
        `?${param}= should pass straight through`,
      ).toBe(false)
    }
  })

  it('passes through every legacy ?view= token', () => {
    const legacy = ['all', 'catalog-ecosystem', 'catalog', 'ecosystem', 'core', 'vocabulary']
    for (const token of [...legacy, ...GRAPH_CONCERNS.map((concern) => concern.value)]) {
      expect(shouldOfferEntryPoint({ search: `?view=${token}` }), token).toBe(false)
    }
  })

  it('passes through a node deep link', () => {
    expect(shouldOfferEntryPoint({ hash: '#highTheta' })).toBe(false)
    expect(shouldOfferEntryPoint({ search: '?zoom=1.4&focus=neighborhood', hash: '#alpha' })).toBe(false)
  })

  it('treats a bare hash as no deep link', () => {
    expect(shouldOfferEntryPoint({ hash: '#' })).toBe(true)
  })

  it('does not ask again once the reader has answered', () => {
    expect(shouldOfferEntryPoint({ session: { entryChosen: true } })).toBe(false)
    // Including when the answer was "show me everything", which leaves no
    // scope behind to detect.
    expect(shouldOfferEntryPoint({ session: { entryChosen: true, concernFilters: [] } })).toBe(false)
  })

  it('does not ask when an in-app return already carries a scope', () => {
    expect(shouldOfferEntryPoint({ session: { concernFilters: ['frequency'] } })).toBe(false)
    expect(shouldOfferEntryPoint({ session: { moduleFilters: ['sstim-core'] } })).toBe(false)
    expect(shouldOfferEntryPoint({ session: { hiddenKinds: ['skosConcept'] } })).toBe(false)
  })

  it('ignores layerFilters, which always carries a value', () => {
    // 'terms' is the default, so testing it would suppress the chooser on every
    // first arrival and quietly restore the old behaviour.
    expect(shouldOfferEntryPoint({ session: { layerFilters: ['terms'] } })).toBe(true)
  })

  it('ignores query parameters that say nothing about scope', () => {
    expect(shouldOfferEntryPoint({ search: '?utm_source=mastodon' })).toBe(true)
  })
})
