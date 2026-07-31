import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { Parser } from 'n3'
import {
  CONTROL_PROPERTIES,
  DELIBERATELY_UNUSED,
  PARAM_PROPERTIES,
  PROJECTION_MODEL,
  STRUCTURAL_FINDINGS,
  TIMING_PROPERTIES,
  projectPatch,
} from './patchProjection.js'
import { buildPatchExport, createAudioTrack, createControlTrack, createDraft, createVisualTrack }
  from '../ui/creator/presetDraft.js'

const SSTIM = 'https://w3id.org/sstim#'
const RDFS_DOMAIN = 'http://www.w3.org/2000/01/rdf-schema#domain'
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
const OWL_DATATYPE_PROPERTY = 'http://www.w3.org/2002/07/owl#DatatypeProperty'

/** Parse an ontology module into { localName: domainLocalName }. */
function ontologyProperties(...files) {
  const parser = new Parser()
  const quads = files.flatMap((f) => parser.parse(readFileSync(f, 'utf8')))
  const isDatatypeProperty = new Set(
    quads.filter((q) => q.predicate.value === RDF_TYPE && q.object.value === OWL_DATATYPE_PROPERTY)
      .map((q) => q.subject.value),
  )
  const domains = new Map(
    quads.filter((q) => q.predicate.value === RDFS_DOMAIN).map((q) => [q.subject.value, q.object.value]),
  )
  const out = {}
  for (const iri of isDatatypeProperty) {
    if (!iri.startsWith(SSTIM)) continue
    out[iri.slice(SSTIM.length)] = (domains.get(iri) ?? '').replace(SSTIM, '')
  }
  return out
}

const PATCH_STUDIO_TTL = 'static/ontology/sstim-patch-studio.ttl'
const CORE_TTL = 'static/ontology/sstim-core.ttl'

const patchStudioProps = ontologyProperties(PATCH_STUDIO_TTL)
const allProps = ontologyProperties(PATCH_STUDIO_TTL, CORE_TTL)

/** Every property this module claims to use, flattened. */
function claimedProperties() {
  const claimed = new Map()
  for (const [source, spec] of Object.entries(PARAM_PROPERTIES)) claimed.set(spec.property, { source, spec })
  for (const table of Object.values(CONTROL_PROPERTIES)) {
    for (const [source, spec] of Object.entries(table)) claimed.set(spec.property, { source, spec })
  }
  for (const [source, spec] of Object.entries(TIMING_PROPERTIES)) claimed.set(spec.property, { source, spec })
  return claimed
}

// ── the table cannot drift from the ontology ────────────────────────────────

describe('the mapping table is grounded in the ontology', () => {
  it('parses the patch-studio module', () => {
    expect(Object.keys(patchStudioProps).length).toBeGreaterThan(20)
  })

  it('names only properties that actually exist in SSTIM', () => {
    const missing = []
    for (const [property, { source }] of claimedProperties()) {
      if (!(property in allProps)) missing.push(`${property} (claimed for ${source})`)
    }
    expect(missing, `properties named in the mapping table but absent from the ontology:\n${missing.join('\n')}`)
      .toEqual([])
  })

  it('records each property with the domain the ontology gives it', () => {
    const wrong = []
    for (const [property, { spec, source }] of claimedProperties()) {
      const actual = allProps[property]
      if (actual && actual !== spec.domain) {
        wrong.push(`${property} (${source}): table says ${spec.domain}, ontology says ${actual}`)
      }
    }
    expect(wrong, `domain mismatches:\n${wrong.join('\n')}`).toEqual([])
  })

  it('accounts for every patch-studio property — used or deliberately not', () => {
    const claimed = new Set(claimedProperties().keys())
    const unaccounted = Object.keys(patchStudioProps)
      .filter((p) => !claimed.has(p) && !(p in DELIBERATELY_UNUSED))
    expect(
      unaccounted,
      `sstim-patch-studio.ttl declares properties this projection neither uses nor explains.\n` +
      `Either map them in PARAM_PROPERTIES/CONTROL_PROPERTIES or add a reason to DELIBERATELY_UNUSED:\n` +
      unaccounted.join('\n'),
    ).toEqual([])
  })

  it('does not carry stale exclusions for properties the ontology dropped', () => {
    const stale = Object.keys(DELIBERATELY_UNUSED).filter((p) => !(p in allProps))
    expect(stale, `DELIBERATELY_UNUSED names properties that no longer exist:\n${stale.join('\n')}`).toEqual([])
  })
})

// ── projection behaviour ────────────────────────────────────────────────────

const OPTIONS = {
  sessionIri: 'https://w3id.org/sstim/implementation/bsclab/session/test-1',
  created: '2026-07-31T00:00:00Z',
}

const sample = () => {
  const draft = createDraft()
  draft.patchName = 'Projection Sample'
  draft.audioTracks = [...draft.audioTracks, createAudioTrack('BinauralBeat')]
  draft.visualTracks = [createVisualTrack('Geometry')]
  draft.controlTracks = [createControlTrack('Martigli')]
  return buildPatchExport(draft)
}

describe('projection', () => {
  it('emits parseable Turtle', () => {
    const { turtle } = projectPatch(sample(), OPTIONS)
    const quads = new Parser().parse(turtle)
    expect(quads.length).toBeGreaterThan(10)
  })

  it('is deterministic — the same patch yields the same bytes', () => {
    const patch = sample()
    expect(projectPatch(patch, OPTIONS).turtle).toBe(projectPatch(patch, OPTIONS).turtle)
  })

  it('does not depend on key order in the source patch', () => {
    // Rebuild every object with its keys in reverse order. Content identical,
    // insertion order maximally different — the Turtle must not move.
    const reverseKeys = (value) => {
      if (Array.isArray(value)) return value.map(reverseKeys)
      if (value === null || typeof value !== 'object') return value
      return Object.fromEntries(Object.keys(value).reverse().map((k) => [k, reverseKeys(value[k])]))
    }
    const patch = sample()
    const reordered = reverseKeys(patch)
    expect(Object.keys(reordered)).not.toEqual(Object.keys(patch))
    expect(projectPatch(reordered, OPTIONS).turtle).toBe(projectPatch(patch, OPTIONS).turtle)
  })

  it('emits only real SSTIM properties', () => {
    const { turtle } = projectPatch(sample(), OPTIONS)
    const used = [...turtle.matchAll(/sstim:(\w+)/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThan(0)
    for (const property of new Set(used)) expect(allProps).toHaveProperty(property)
  })

  it('produces JSON-LD alongside the Turtle', () => {
    const { jsonld } = projectPatch(sample(), OPTIONS)
    expect(jsonld['@context'].sstim).toBe(SSTIM)
    expect(Array.isArray(jsonld['@graph'])).toBe(true)
    expect(jsonld['@graph'][0]['@id']).toBe(OPTIONS.sessionIri)
  })

  it('refuses anything that is not a Patch Studio patch', () => {
    expect(() => projectPatch({ model: 'other' }, OPTIONS)).toThrow(/Only Patch Studio patches/)
  })

  it('requires an explicit timestamp, so output cannot depend on the clock', () => {
    expect(() => projectPatch(sample(), { sessionIri: OPTIONS.sessionIri })).toThrow(/created/)
  })
})

describe('the mapping report tells the truth about what did not travel', () => {
  it('reports both mapped and unmapped parameters', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    expect(report.model).toBe(PROJECTION_MODEL)
    expect(report.mappedCount).toBeGreaterThan(0)
    expect(report.unmappedCount).toBeGreaterThan(0)
    expect(report.mapped.length).toBe(report.mappedCount)
    expect(report.unmapped.length).toBe(report.unmappedCount)
  })

  it('names the parameters that have no SSTIM property', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    const sources = report.unmapped.map((u) => u.source).join(' ')
    // cutoff/resonance/detune are real Patch Studio audio parameters with no
    // ontology counterpart. If SSTIM gains one, this test should be updated
    // deliberately rather than the gap disappearing silently.
    expect(sources).toMatch(/cutoff|resonance|detune|opacity|scale|hue/)
  })

  it('carries the structural findings that block catalog conformance', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    const ids = report.structuralFindings.map((f) => f.id)
    expect(ids).toContain('S1')
    expect(ids).toContain('S2')
    expect(report.structuralFindings.filter((f) => f.severity === 'blocking')).toHaveLength(2)
  })

  it('states plainly that this is not catalog-conformant RDF', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    expect(report.conformance).toMatch(/[Nn]ot a sstim:SessionSpecification/)
    expect(report.conformance).toMatch(/not catalog-conformant/)
  })

  it('does not claim a SessionSpecification or Voice type in the RDF', () => {
    // The whole point of S1/S2: emitting these types would fail SHACL.
    const { turtle } = projectPatch(sample(), OPTIONS)
    expect(turtle).not.toMatch(/sstim:SessionSpecification/)
    expect(turtle).not.toMatch(/a\s+sstim:Voice/)
  })

  it('keeps the structural findings in sync with the module docs', () => {
    expect(STRUCTURAL_FINDINGS.every((f) => f.finding && f.detail && f.consequence)).toBe(true)
  })
})

describe('nothing private travels', () => {
  it('carries no identifier of any kind', () => {
    const patch = sample()
    const { turtle, jsonld, report } = projectPatch(patch, OPTIONS)
    const all = `${turtle}\n${JSON.stringify(jsonld)}\n${JSON.stringify(report)}`
    expect(all).not.toMatch(/local-device/)
    expect(all).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/)
    expect(all).not.toMatch(/\buid\b/i)
  })
})
