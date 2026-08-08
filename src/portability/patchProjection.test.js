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
import {
  PATCH_STUDIO_MODEL_V1,
  buildPatchExport,
  createAudioTrack,
  createControlTrack,
  createDraft,
  createVisualTrack,
}
  from '../ui/creator/presetDraft.js'

const SSTIM = 'https://w3id.org/sstim#'
const RDFS_DOMAIN = 'http://www.w3.org/2000/01/rdf-schema#domain'
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
const OWL_DATATYPE_PROPERTY = 'http://www.w3.org/2002/07/owl#DatatypeProperty'

const OWL_UNION_OF = 'http://www.w3.org/2002/07/owl#unionOf'
const RDF_FIRST = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'
const RDF_REST = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'
const RDF_NIL = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'

/**
 * Parse ontology modules into { propertyLocalName: [domainLocalName, …] }.
 *
 * Domains are a *list* because ADR 0040 widened twenty-three of them into
 * owl:unionOf, so a property may legitimately apply to a catalog class and its
 * patch counterpart. A helper that reads only a single named class would return
 * a blank-node id here and the conformance test would silently compare garbage.
 */
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
  const unionOf = new Map(
    quads.filter((q) => q.predicate.value === OWL_UNION_OF).map((q) => [q.subject.value, q.object.value]),
  )
  const first = new Map(quads.filter((q) => q.predicate.value === RDF_FIRST).map((q) => [q.subject.value, q.object.value]))
  const rest = new Map(quads.filter((q) => q.predicate.value === RDF_REST).map((q) => [q.subject.value, q.object.value]))

  const readList = (head) => {
    const out = []
    for (let node = head; node && node !== RDF_NIL; node = rest.get(node)) {
      const item = first.get(node)
      if (item) out.push(item)
    }
    return out
  }

  const out = {}
  for (const iri of isDatatypeProperty) {
    if (!iri.startsWith(SSTIM)) continue
    const domain = domains.get(iri)
    const members = domain && unionOf.has(domain) ? readList(unionOf.get(domain)) : [domain]
    out[iri.slice(SSTIM.length)] = members.filter(Boolean).map((m) => m.replace(SSTIM, ''))
  }
  return out
}

/** Every sstim: term the given modules declare — classes and properties alike. */
function ontologyTerms(...files) {
  const parser = new Parser()
  const quads = files.flatMap((f) => parser.parse(readFileSync(f, 'utf8')))
  return new Set(
    quads
      .filter((q) => q.predicate.value === RDF_TYPE && q.subject.value.startsWith(SSTIM))
      .map((q) => q.subject.value.slice(SSTIM.length)),
  )
}

const PATCH_STUDIO_TTL = 'static/ontology/sstim-patch-studio.ttl'
const CONFIGURATION_TTL = 'static/ontology/sstim-configuration.ttl'
const SESSION_TTL = 'static/ontology/sstim-session.ttl'

const patchStudioProps = ontologyProperties(PATCH_STUDIO_TTL)
const projectionClosure = [PATCH_STUDIO_TTL, CONFIGURATION_TTL, SESSION_TTL]
const allProps = ontologyProperties(...projectionClosure)

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

  it('records a domain the ontology actually admits for that property', () => {
    const wrong = []
    for (const [property, { spec, source }] of claimedProperties()) {
      const admitted = allProps[property]
      if (admitted && admitted.length && !admitted.includes(spec.domain)) {
        wrong.push(`${property} (${source}): table says ${spec.domain}, ontology admits ${admitted.join(' | ')}`)
      }
    }
    expect(wrong, `domain mismatches:\n${wrong.join('\n')}`).toEqual([])
  })

  it('widened every domain the projection emits on a patch-side class', () => {
    // ADR 0040 finding V1. Each property the projection puts on a Track or a
    // Patch must admit that class, or the RDF would entail the node is a
    // catalog Voice or SessionSpecification — which is what V1 was about.
    const needed = [
      ['initialVolume', 'AudioTrack'], ['panPosition', 'AudioTrack'],
      ['baseFrequency', 'AudioTrack'], ['pulseRateHz', 'AudioTrack'],
      ['carrierFreqLeft', 'AudioTrack'], ['carrierFreqRight', 'AudioTrack'],
      ['beatHz', 'AudioTrack'], ['noteDurationFraction', 'AudioTrack'],
      ['rotationSpeed', 'VisualTrack'], ['visualSideCount', 'VisualTrack'],
      ['stimulationIntensity', 'HapticTrack'], ['hapticPattern', 'HapticTrack'],
      ['martigliPeriodInitial', 'ControlTrack'], ['breathingPhaseRatio', 'ControlTrack'],
      ['noteCount', 'ControlTrack'],
      ['tempoBpm', 'Preset'], ['beatsPerBar', 'Preset'],
      ['durationSeconds', 'Preset'], ['masterVolume', 'Preset'],
    ]
    const missing = needed.filter(([prop, cls]) => !(allProps[prop] ?? []).includes(cls))
      .map(([prop, cls]) => `${prop} does not admit sstim:${cls}`)
    expect(missing, missing.join('\n')).toEqual([])
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
  draft.controlTracks = [createControlTrack('LFO')]
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

  it('emits only terms the ontology declares', () => {
    // Classes and object properties as well as datatype properties, now that the
    // projection types its nodes (ADR 0040).
    const declared = new Set([
      ...Object.keys(allProps),
      ...ontologyTerms(...projectionClosure),
    ])
    const { turtle } = projectPatch(sample(), OPTIONS)
    const used = [...turtle.matchAll(/sstim:(\w+)/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThan(0)
    const undeclared = [...new Set(used)].filter((t) => !declared.has(t))
    expect(undeclared, `emitted but not declared in SSTIM: ${undeclared.join(', ')}`).toEqual([])
  })

  it('types the configuration and its tracks', () => {
    const { turtle } = projectPatch(sample(), OPTIONS)
    expect(turtle).toMatch(/a sstim:Preset/)
    expect(turtle).toMatch(/a sstim:AudioTrack/)
    expect(turtle).toMatch(/a sstim:VisualTrack/)
    expect(turtle).toMatch(/a sstim:ControlTrack/)
    expect(turtle).toMatch(/sstim:composedOfTrack/)
  })

  it('never types a configuration as a session specification', () => {
    // A shape forbids it; emitting it would be an object that both does and does
    // not execute a catalog preset.
    const { turtle } = projectPatch(sample(), OPTIONS)
    expect(turtle).not.toMatch(/sstim:SessionSpecification/)
    expect(turtle).not.toMatch(/a\s+sstim:Voice/)
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

  it('continues to project genuine model-1 patches', () => {
    const legacy = {
      model: PATCH_STUDIO_MODEL_V1,
      patchName: 'Legacy projection',
      timing: { bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [],
      audioTracks: [],
      visualTracks: [],
      hapticTracks: [],
    }
    expect(projectPatch(legacy, OPTIONS).turtle).toMatch(/Legacy projection/)
  })

  it('refuses model-2 projection data mislabeled as model 1', () => {
    expect(() => projectPatch({
      model: PATCH_STUDIO_MODEL_V1,
      visualStage: { presentationMode: 'mono' },
    }, OPTIONS)).toThrow(/model-2 features.*model-1/)
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

  it('accounts for spatial recipes, stage presentation, and discrete state', () => {
    const draft = createDraft()
    draft.visualStage.presentationMode = 'stereo-pair'
    draft.visualTracks = [createVisualTrack('TreeScene', {
      enabled: false,
      blend: 'normal',
      config: { seed: 42, levels: 9 },
    })]
    const { report } = projectPatch(buildPatchExport(draft), OPTIONS)
    const sources = report.unmapped.map((item) => item.source)

    expect(sources).toContain('visualStage.presentationMode')
    expect(sources).toContain('visualTracks[0].enabled')
    expect(sources).toContain('visualTracks[0].blend')
    expect(sources).toContain('visualTracks[0].config.seed')
    expect(sources).toContain('visualTracks[0].config.generatorVersion')
  })

  it('accounts for links nested under parameters SSTIM cannot map', () => {
    const patch = sample()
    patch.visualTracks[0].params.experimentalDepth = {
      value: 0.5,
      mods: [{ controlId: 'control-1', amount: 0.25 }],
      tempoSync: { enabled: true, subdivision: '1/4' },
    }
    const { report } = projectPatch(patch, OPTIONS)
    const sources = report.unmapped.map((item) => item.source)

    expect(sources).toContain('visualTracks[0].experimentalDepth')
    expect(sources).toContain('visualTracks[0].experimentalDepth.mods[0].controlId')
    expect(sources).toContain('visualTracks[0].experimentalDepth.tempoSync.enabled')
  })

  it('carries the structural findings, now recorded as resolved', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    const ids = report.structuralFindings.map((f) => f.id)
    expect(ids).toEqual(['S1', 'S2', 'V1'])
    // Kept rather than deleted: packages built before ADR 0040 carry them as
    // open, and a reader comparing two packages should see what changed.
    expect(report.structuralFindings.every((f) => f.severity === 'resolved')).toBe(true)
    expect(report.structuralFindings.every((f) => /ADR 004[01]/.test(f.resolvedIn))).toBe(true)
  })

  it('states what the projection is and what it still does not assert', () => {
    const { report } = projectPatch(sample(), OPTIONS)
    expect(report.conformance).toMatch(/requiring producer-side SHACL validation/)
    expect(report.conformance).toMatch(/does not itself run a SHACL engine/)
    expect(report.conformance).toMatch(/not a sstim:SessionSpecification/)
    // The line that must never soften: RDF validity is not scientific warrant.
    expect(report.conformance).toMatch(/no evidence, outcome or safety metadata/)
    // Nor is a configuration a description of the stimulation (ADR 0041 §3).
    expect(report.conformance).toMatch(/not a sstim:StimulusSpecification/)
    expect(report.conformance).toMatch(/requires calibrated delivered-output data/)
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
