import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory, Parser, Store } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'
import { createFieldState } from './fieldState.js'
import { fieldStateToQuads } from './exposureProfile.js'

// Runtime SHACL conformance harness for the Sensory Field RDF export
// (improvement plan phase 0.1, Gate P0-A; audit finding KR-01).
//
// KR-01 is closed (ADR 0027): the exporter emits a defining framework,
// technique/editorial-note baseline, and role-specific statements (hypotheses,
// research questions, boundary applicability) instead of manufactured
// evidence claims, so every state in the matrix below must produce a
// SHACL-conformant graph (`expect(rep.conforms).toBe(true)`). This suite
// pins that as a regression test — an exporter change that silently breaks
// the contract fails the build — not a violation-set golden.
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
  // exported nodes; the BSC framework instance types the sstim:definedByFramework
  // target the export references. Mirrors `make shacl-instances` against the
  // authoritative graph the app loads at runtime.
  baseQuads = [
    'sstim-core.ttl', 'sstim-vocab.ttl', 'sstim-exposure.ttl',
    'instances/frameworks/bsc.ttl',
  ].flatMap(parseTtl)
})

function report(state) {
  const data = new Store(baseQuads)
  for (const q of fieldStateToQuads(state, { id: EXPORT_ID, now: NOW })) data.add(q)
  return validator.validate(data)
}

function violationKeys(rep) {
  return rep.results
    .map((r) => {
      const focus = r.focusNode?.value ?? ''
      const frag = focus.includes('#') ? focus.split('#')[1] : 'protocol'
      const path = r.path?.value?.split(/[#/]/).pop() ?? 'node'
      return `${frag}:${path}`
    })
    .sort()
}

// ADR 0027 closed KR-01: the runtime export now carries a defining framework,
// technique/editorial-note baseline, and role-specific statements (hypotheses,
// research questions, boundary applicability) instead of manufactured evidence
// claims. Every state in the matrix must produce a SHACL-conformant graph.
const matrix = [
  ['default (visual + audio, no beat)', (s) => s],
  ['visual only', (s) => { s.audio.enabled = false }],
  ['audio only', (s) => { s.visual.enabled = false }],
  ['monaural beat', (s) => { s.audio.beatMode = 'monaural'; s.audio.beatRateHz = 4 }],
  ['binaural beat', (s) => { s.audio.beatMode = 'binaural'; s.audio.beatRateHz = 4 }],
  ['free-view depth', (s) => { s.depth.enabled = true }],
  ['blinking field', (s) => { s.visual.blinkEnabled = true; s.visual.blinkRateHz = 3 }],
  ['mixed (blink + depth + binaural)', (s) => {
    s.visual.blinkEnabled = true
    s.visual.blinkRateHz = 3
    s.depth.enabled = true
    s.audio.beatMode = 'binaural'
    s.audio.beatRateHz = 4
  }],
]

describe('exposureProfile SHACL conformance (golden, KR-01)', () => {
  it.each(matrix)('%s exports a SHACL-conformant graph', (_label, mutate) => {
    const state = createFieldState()
    mutate(state)
    const rep = report(state)
    expect(violationKeys(rep)).toEqual([])
    expect(rep.conforms).toBe(true)
  })

  it('emits no deprecated evidence-claim typing', () => {
    const state = createFieldState()
    state.depth.enabled = true
    state.visual.blinkEnabled = true
    const objs = fieldStateToQuads(state, { id: EXPORT_ID, now: NOW }).map((q) => q.object.value)
    expect(objs).not.toContain('https://w3id.org/sstim#EvidenceClaim')
    expect(objs).not.toContain('https://w3id.org/sstim/exposure#ExposureEffectClaim')
  })

  it('validator sanity: the curated fixture conforms', () => {
    const data = new Store(baseQuads)
    for (const q of parseTtl('instances/experiments/sensory-field-example.ttl')) {
      data.add(q)
    }
    expect(validator.validate(data).conforms).toBe(true)
  })
})
