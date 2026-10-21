import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CANVAS_LABEL_MAX, clampWords, recordCanvasLabels, shortCitation, splitCitation } from './recordLabels.js'

// The published protocols' own labels, read from their files, so a relabelled
// protocol is tested as it now reads rather than as it once did.
const PROTOCOL_DIR = new URL('../../static/ontology/instances/protocols/', import.meta.url)
const protocolLabels = readdirSync(PROTOCOL_DIR)
  .filter(name => name.endsWith('.ttl'))
  .map(name => ({
    id: name.replace(/\.ttl$/, ''),
    label: readFileSync(new URL(name, PROTOCOL_DIR), 'utf8').match(/^bsclab-protocol:\S+ a [^\n]*\n\s+rdfs:label "([^"]+)"/m)?.[1],
  }))
  .filter(record => record.label)

describe('shortCitation', () => {
  it('shortens three or more authors to the first and et al.', () => {
    expect(shortCitation('Galambos, Makeig and Talmachoff 1981')).toBe('Galambos et al. 1981')
  })

  it('keeps a citation that is already short, and drops what follows the year', () => {
    expect(shortCitation('Thaut et al. 1996')).toBe('Thaut et al. 1996')
    expect(shortCitation('Wang et al. 2017 benchmark dataset')).toBe('Wang et al. 2017')
    expect(shortCitation('Smith and Jones 2019')).toBe('Smith and Jones 2019')
  })
})

describe('splitCitation', () => {
  it('separates the citation from the title', () => {
    expect(splitCitation("Rhythmic auditory stimulation for 3 weeks of home-based gait training in Parkinson's disease (Thaut et al. 1996)"))
      .toEqual({ citation: 'Thaut et al. 1996', title: "Rhythmic auditory stimulation for 3 weeks of home-based gait training in Parkinson's disease" })
  })

  it('ignores a parenthetical with no year, and a label that is only a citation', () => {
    expect(splitCitation('Superseded legacy evidence claim (see assessment revision 1)')).toBeNull()
    expect(splitCitation('(Thaut et al. 1996)')).toBeNull()
    expect(splitCitation('Auditory rhythm observation reference protocol')).toBeNull()
  })
})

describe('clampWords', () => {
  it('cuts at a word and marks the cut', () => {
    expect(clampWords('Auditory Closed-Loop Stimulation of the Sleep Slow Oscillation Enhances Memory', 48))
      .toBe('Auditory Closed-Loop Stimulation of the Sleep…')
    expect(clampWords('Short enough', 48)).toBe('Short enough')
  })

  it('never leaves a trailing comma before the ellipsis', () => {
    expect(clampWords('40 Hz auditory tone train, 1 hour a day for 7 days, in mice', 27)).toBe('40 Hz auditory tone train…')
  })
})

describe('recordCanvasLabels', () => {
  it('names every published protocol by its citation, telling apart the two that share one', () => {
    const labels = recordCanvasLabels(protocolLabels)
    const short = id => labels.get(id)?.shortLabel
    expect(short('thaut-1996-rhythmic-auditory-stimulation-gait')).toBe('Thaut et al. 1996')
    expect(short('galambos-1981-40hz-auditory-steady-state-response')).toBe('Galambos et al. 1981')
    expect(short('wang-2017-ssvep-40-target-speller')).toBe('Wang et al. 2017')
    expect(short('martorell-2019-40hz-auditory-tone-train')).toMatch(/^Martorell et al\. 2019: 40 Hz auditory/)
    expect(short('martorell-2019-40hz-audiovisual')).toMatch(/^Martorell et al\. 2019: Concurrent 40 Hz/)
    expect(new Set(protocolLabels.map(({ id, label }) => short(id) ?? label)).size).toBe(protocolLabels.length)
  })

  it('keeps the citation and the title for the panel', () => {
    const entry = recordCanvasLabels(protocolLabels).get('ngo-2013-closed-loop-auditory-slow-oscillation')
    expect(entry).toMatchObject({ labelLead: 'Ngo et al. 2013', labelRest: 'Closed-loop auditory stimulation in phase with sleep slow-oscillation up states' })
  })

  it('leaves a short label alone and cuts a long one with no citation', () => {
    const labels = recordCanvasLabels([
      { id: 'a', label: 'Colored audio noise exposure' },
      { id: 'b', label: 'A Benchmark Dataset for SSVEP-Based Brain-Computer Interfaces' },
    ])
    expect(labels.has('a')).toBe(false)
    expect(labels.get('b').shortLabel.length).toBeLessThanOrEqual(CANVAS_LABEL_MAX)
    expect(labels.get('b').shortLabel).toMatch(/…$/)
  })
})
