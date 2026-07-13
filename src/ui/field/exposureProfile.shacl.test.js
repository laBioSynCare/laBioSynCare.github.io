import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory, Parser, Store } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'
import { createFieldState } from './fieldState.js'
import { fieldStateToQuads } from './exposureProfile.js'

// Runtime SHACL conformance harness for the Sensory Field RDF export
// (improvement plan phase 0.1, Gate P0-A; audit finding KR-01).
//
// The export is currently NOT conformant: the shapes require evidence-claim
// provenance the exporter cannot truthfully supply, and an ExposureProfile is
// required to carry an effect claim at all (KR-06). Until that semantic
// change set is approved, this suite pins the exact violation set so any
// drift — a new violation, or an exporter change that silently alters the
// contract — fails the build. The golden sets below may only shrink; when the
// exporter is repaired, replace them with `expect(report.conforms).toBe(true)`.
//
// sh:sparql constraints are stripped before validating: rdf-validate-shacl
// has no SPARQLConstraintComponent validator. Those constraints gate preset
// public-claim levels, not exposure profiles, and remain covered by pySHACL
// in `make validate`.

const ONTOLOGY_DIR = new URL('../../../static/ontology/', import.meta.url)
const SH_SPARQL = DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql')
const EXPORT_ID = 'shacl-golden-0001'
const NOW = '2026-07-13T00:00:00.000Z'

const parseTtl = (file) => new Parser().parse(readFileSync(new URL(file, ONTOLOGY_DIR), 'utf8'))

let validator
let baseQuads

beforeAll(() => {
  const shapes = new Store(parseTtl('sstim-shapes.ttl'))
  for (const q of shapes.getQuads(null, SH_SPARQL, null, null)) shapes.delete(q)
  validator = new SHACLValidator(shapes)
  // The ontology modules supply the class hierarchy (e.g. ExploratoryProtocol
  // ⊑ SensoryStimulationProtocol) that sh:targetClass needs to reach the
  // exported nodes, mirroring `make shacl-instances`.
  baseQuads = ['sstim-core.ttl', 'sstim-vocab.ttl', 'sstim-exposure.ttl'].flatMap(parseTtl)
})

function violationKeys(state) {
  const data = new Store(baseQuads)
  for (const q of fieldStateToQuads(state, { id: EXPORT_ID, now: NOW })) data.add(q)
  const report = validator.validate(data)
  return report.results
    .map((r) => {
      const focus = r.focusNode?.value ?? ''
      const frag = focus.includes('#') ? focus.split('#')[1] : 'protocol'
      const path = r.path?.value.split(/[#/]/).pop() ?? 'node'
      return `${frag}:${path}`
    })
    .sort()
}

// Known KR-01 gaps: the exploratory protocol names no defining framework and
// no technique/editorial-note baseline exception…
const PROTOCOL_GAPS = ['protocol:definedByFramework', 'protocol:node']
// …and each generated claim lacks the five mandatory EvidenceClaim fields.
const claimGaps = (frag) => [
  `${frag}:evidenceDate`,
  `${frag}:hasClaimDirection`,
  `${frag}:hasReviewStatus`,
  `${frag}:modified`,
  `${frag}:wasAttributedTo`,
]
const golden = (...claimFrags) =>
  [...PROTOCOL_GAPS, ...claimFrags.flatMap(claimGaps)].sort()

const matrix = [
  ['default (visual + audio, no beat)', (s) => s, golden('self-observation-claim')],
  ['visual only', (s) => { s.audio.enabled = false }, golden('self-observation-claim')],
  ['audio only', (s) => { s.visual.enabled = false }, golden('self-observation-claim')],
  ['monaural beat', (s) => { s.audio.beatMode = 'monaural'; s.audio.beatRateHz = 4 }, golden('self-observation-claim')],
  ['binaural beat', (s) => { s.audio.beatMode = 'binaural'; s.audio.beatRateHz = 4 }, golden('self-observation-claim')],
  ['free-view depth', (s) => { s.depth.enabled = true }, golden('self-observation-claim', 'stereo-depth-claim')],
  ['blinking field', (s) => { s.visual.blinkEnabled = true; s.visual.blinkRateHz = 3 }, golden('photosensitivity-claim', 'self-observation-claim')],
  ['mixed (blink + depth + binaural)', (s) => {
    s.visual.blinkEnabled = true
    s.visual.blinkRateHz = 3
    s.depth.enabled = true
    s.audio.beatMode = 'binaural'
    s.audio.beatRateHz = 4
  }, golden('photosensitivity-claim', 'self-observation-claim', 'stereo-depth-claim')],
]

describe('exposureProfile SHACL conformance (golden, KR-01)', () => {
  it.each(matrix)('%s produces exactly the known violation set', (_label, mutate, expected) => {
    const state = createFieldState()
    mutate(state)
    expect(violationKeys(state)).toEqual(expected)
  })

  it('validator sanity: the curated fixture conforms', () => {
    const data = new Store(baseQuads)
    for (const q of ['instances/frameworks/bsc.ttl', 'instances/experiments/sensory-field-example.ttl'].flatMap(parseTtl)) {
      data.add(q)
    }
    expect(validator.validate(data).conforms).toBe(true)
  })
})
