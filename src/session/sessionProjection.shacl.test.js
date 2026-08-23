import { globSync, readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory, Parser, Store } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'
import { CONCEPT_TABLES, projectSession } from './sessionProjection.js'
import { GOLDEN_SESSIONS } from './fixtures/goldenSessions.js'
import { openSession } from './sessionRecorder.js'

// Gate P0-B, second half: the RDF projection of every golden session validates.
//
// This is the half that KR-02 could not have passed. The prose example in
// SESSION_MODEL.md used three terms the ontology never defined, so it could not
// have validated against anything — and nothing ran it to find out. Here every
// projected graph goes through the same Full shape closure `make validate` uses.
//
// Mirrors src/ui/field/exposureProfile.shacl.test.js, including its reason for
// stripping sh:sparql: rdf-validate-shacl has no SPARQLConstraintComponent
// validator, and those constraints gate preset public-claim levels rather than
// sessions. pySHACL covers them in `make validate`.

const REPOSITORY_ROOT = new URL('../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('static/ontology/manifest.json', REPOSITORY_ROOT), 'utf8'))
const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
const fullProfile = manifest.profiles.find((profile) => profile.id === 'full')
const SH_SPARQL = DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql')
const SSTIM_V = 'https://w3id.org/sstim/vocab#'

const parseTtl = (file) => new Parser().parse(readFileSync(new URL(file, REPOSITORY_ROOT), 'utf8'))

let validator
let baseQuads

beforeAll(() => {
  const shapes = new Store(parseTtl(moduleById.get('shapes').source.path))
  for (const q of shapes.getQuads(null, SH_SPARQL, null, null)) shapes.delete(q)
  validator = new SHACLValidator(shapes)
  // The ontology modules supply the class hierarchy sh:targetClass needs, and
  // sstim-vocab.ttl types the phase and modality concepts the projection points
  // at — sh:class on hasReportPhase is only satisfiable if the concept is typed.
  baseQuads = fullProfile.modules.map((id) => moduleById.get(id).source.path).flatMap(parseTtl)
})

function validate(bundle, options) {
  const data = new Store(baseQuads)
  for (const q of projectSession(bundle, options).quads) data.add(q)
  return validator.validate(data)
}

function violationKeys(report) {
  return report.results
    .map((r) => {
      const focus = r.focusNode?.value ?? ''
      const name = focus.split('/').pop() || 'node'
      const path = r.path?.value?.split(/[#/]/).pop() ?? 'node'
      return `${name}:${path}`
    })
    .sort()
}

describe('session projection SHACL conformance (golden, KR-02)', () => {
  it.each(Object.entries(GOLDEN_SESSIONS))('"%s" projects a conformant graph', (_name, bundle) => {
    const report = validate(bundle)
    expect(violationKeys(report)).toEqual([])
    expect(report.conforms).toBe(true)
  })

  it('stays conformant when disabled tracks resolve to real IRIs', () => {
    const bundle = GOLDEN_SESSIONS['unhelpful, interrupted, one experience, follow-up']
    const report = validate(bundle, {
      trackIri: (id) => `https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed#${id}`,
    })
    expect(violationKeys(report)).toEqual([])
    expect(report.conforms).toBe(true)
  })

  it('validator sanity: the committed instance set still conforms', () => {
    // The whole instance tree, exactly as `make shacl-instances` loads it:
    // these files cross-reference each other, so validating one in isolation
    // fails for reasons that have nothing to do with the file.
    const data = new Store(baseQuads)
    const instances = globSync('**/*.ttl', {
      cwd: new URL('static/ontology/instances/', REPOSITORY_ROOT),
    }).sort()
    expect(instances.length).toBeGreaterThan(0)
    for (const file of instances) {
      for (const q of parseTtl(`static/ontology/instances/${file}`)) data.add(q)
    }
    expect(validator.validate(data).conforms).toBe(true)
  })

  it('every concept the projection can emit is declared in the vocabulary', () => {
    // Stronger than the schema-alignment test, which only proves the projection
    // knows every enum value. A mapping to a misspelled concept name produces a
    // perfectly well-formed sstim-v: IRI that nothing declares, and SHACL would
    // catch it only on a fixture that happened to use that value.
    const declared = new Set(
      new Store(baseQuads)
        .getSubjects(null, null, null)
        .map((s) => s.value)
        .filter((iri) => iri.startsWith(SSTIM_V)),
    )
    expect(declared.size).toBeGreaterThan(100)

    for (const [path, table] of Object.entries(CONCEPT_TABLES)) {
      for (const [value, local] of Object.entries(table)) {
        expect(declared, `${path} → ${value} → sstim-v:${local}`).toContain(`${SSTIM_V}${local}`)
      }
    }
  })

  it('a session the recorder produced projects to a conformant graph', () => {
    // The two halves have only ever met through the schema. A recorder change
    // that produced a valid bundle which nonetheless projected badly — a
    // fabricated event, an offset past the recorded duration — would pass both
    // suites and fail only here.
    const clock = { currentTime: 512.5 }
    const recorder = openSession({
      specification: {
        id: 'recorded-session-spec',
        label: 'Recorded session specification',
        created: '2026-08-13T09:00:00Z',
        source: {
          kind: 'preset',
          ref: 'https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed',
          label: 'Perform — Alpha 10 seed',
          contentHash: '32e114684d8a8e9d03a2a45d85b004d0aa9ddf21bfcc19b35bdf49b0e62ab79e',
        },
        durationSeconds: 600,
        masterVolume: 0.2,
        outputGuarantee: 'perceptually-equivalent',
      },
      timingContext: clock,
      instanceId: 'recorded-session',
      startedAt: '2026-08-13T09:01:00Z',
      deliveryModalities: ['auditory'],
    })

    recorder.mark('playback-start')
    clock.currentTime += 200
    recorder.pause()
    clock.currentTime += 60
    // Closed while still paused — the case that used to invent a resume.
    clock.currentTime += 10

    const bundle = recorder.close({
      endedAt: '2026-08-13T09:05:30Z',
      privacy: {
        classification: 'synthetic',
        reportingRole: 'synthetic',
        consentBasis: 'none-required-synthetic',
        policyVersion: '1.0.0',
        visibility: 'public',
        deidentification: 'none',
        withdrawn: false,
        freeTextIncluded: false,
      },
    })

    expect(bundle.events.map((e) => e.type)).toEqual([
      'session-open', 'playback-start', 'playback-pause', 'session-interrupt',
    ])
    // No event beyond the duration the same close() recorded.
    for (const event of bundle.events) {
      expect(event.offsetSeconds).toBeLessThanOrEqual(bundle.instance.actualDurationSeconds)
    }

    const report = validate(bundle)
    expect(violationKeys(report)).toEqual([])
    expect(report.conforms).toBe(true)
  })

  it('a graph missing the source type would not conform, so the stub is load-bearing', () => {
    // Proves the typing triple is doing real work rather than decorating.
    const bundle = GOLDEN_SESSIONS['helpful, no unwanted experience']
    const data = new Store(baseQuads)
    const { quads } = projectSession(bundle)
    for (const q of quads) {
      const isSourceTyping = q.subject.value.includes('/preset/perform-alpha-10-seed')
      if (!isSourceTyping) data.add(q)
    }
    expect(validator.validate(data).conforms).toBe(false)
  })
})
