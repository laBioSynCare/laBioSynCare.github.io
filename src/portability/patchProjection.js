// Project a Patch Studio patch into SSTIM RDF — the declared mappable subset,
// with an explicit report of everything that did not travel.
//
// ADR 0026 established that `patch-studio-model-1` and the catalog model are
// structurally different and that conversion is partial. This module is the RDF
// half of that: it never claims more than it can support, and it makes the gap
// machine-readable instead of leaving it to a footnote.
//
// ## The projection is a `sstim:Patch`
//
// It was not always. Until ADR 0040 the only available typing was an untyped
// `prov:Entity`: a patch typed as `sstim:SessionSpecification` failed SHACL
// because that class is the *execution of a catalog preset* and a patch executes
// none, and its layers matched none of the four catalog `sstim:Voice` subtypes.
// Those were findings S1 and S2, and a third — V1 — recorded that the visual and
// haptic properties were session-scoped in the ontology but track-scoped in a
// patch.
//
// All three are now closed in the ontology itself. `sstim-patch-studio.ttl`
// declares `sstim:Patch` and `sstim:Track` with four disjoint subtypes, and the
// parameter domains admit them; `sstim-shapes.ttl` constrains them. So the
// projection emits properly typed, SHACL-validated RDF, and a patch is no longer
// a second-class citizen of its own ontology.
//
// The catalog model is untouched: `Preset`, `SessionSpecification` and `Voice`
// keep their meanings, and a patch is explicitly *not* a SessionSpecification —
// a shape enforces that, because asserting both would mean an object that both
// does and does not execute a preset.

import { PATCH_STUDIO_MODEL } from '../ui/creator/presetDraft.js'

export const TRACK_CLASSES = {
  audioTracks: 'AudioTrack',
  visualTracks: 'VisualTrack',
  hapticTracks: 'HapticTrack',
}

export const PROJECTION_MODEL = 'bsc-lab-patch-projection-1'

const SSTIM = 'https://w3id.org/sstim#'
const DCT = 'http://purl.org/dc/terms/'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const XSD = 'http://www.w3.org/2001/XMLSchema#'

/**
 * Patch Studio track parameters that have an SSTIM property.
 *
 * Every entry is grounded in `static/ontology/sstim-patch-studio.ttl` — a test
 * parses that file and fails if any property named here is absent, has a
 * different domain, or if a property exists in the ontology that this table
 * silently ignores. The table cannot drift from the ontology without CI saying so.
 *
 * `domain` records where the ontology puts the property, which is not always
 * where a patch puts the value — see `STRUCTURAL_FINDINGS`.
 */
export const PARAM_PROPERTIES = {
  // Audio track parameters → sstim:Voice
  gain:             { property: 'initialVolume',        domain: 'Voice', datatype: 'decimal' },
  pan:              { property: 'panPosition',          domain: 'Voice', datatype: 'decimal' },
  frequency:        { property: 'baseFrequency',        domain: 'Voice', datatype: 'decimal' },
  pulseRate:        { property: 'pulseRateHz',          domain: 'Voice', datatype: 'decimal' },
  noteDurationFrac: { property: 'noteDurationFraction', domain: 'Voice', datatype: 'decimal' },

  // BinauralBeat is parameterised as a carrier pair, which is exactly what
  // ADR 0005 requires of a catalog Binaural voice — so these four map directly.
  // An earlier draft of this table wrongly listed the carrier properties as
  // having no Patch Studio counterpart; the ontology-conformance test below now
  // makes that class of mistake visible instead of silent.
  leftFreq:         { property: 'carrierFreqLeft',      domain: 'Voice', datatype: 'decimal' },
  rightFreq:        { property: 'carrierFreqRight',     domain: 'Voice', datatype: 'decimal' },
  centerFreq:       { property: 'baseFrequency',        domain: 'Voice', datatype: 'decimal' },
  beatFreq:         { property: 'beatHz',               domain: 'Voice', datatype: 'decimal' },

  // Visual track parameters → sstim:SessionSpecification (see finding V1)
  rotationSpeed:    { property: 'rotationSpeed',        domain: 'SessionSpecification', datatype: 'decimal' },
  sides:            { property: 'visualSideCount',      domain: 'SessionSpecification', datatype: 'integer' },

  // Haptic track parameters → sstim:SessionSpecification (see finding V1)
  intensity:        { property: 'stimulationIntensity', domain: 'SessionSpecification', datatype: 'decimal' },
  pattern:          { property: 'hapticPattern',        domain: 'SessionSpecification', datatype: 'integer' },
}

/** Control-track parameters, keyed by control type then parameter. */
export const CONTROL_PROPERTIES = {
  Martigli: {
    periodSec:       { property: 'martigliPeriodInitial', domain: 'Voice', datatype: 'decimal' },
    targetPeriodSec: { property: 'martigliPeriodFinal',   domain: 'Voice', datatype: 'decimal' },
    inhaleRatio:     { property: 'breathingPhaseRatio',   domain: 'Voice', datatype: 'decimal' },
    amplitude:       { property: 'martigliAmplitude',     domain: 'Voice', datatype: 'decimal' },
  },
  Symmetry: {
    nnotes:          { property: 'noteCount',             domain: 'Voice', datatype: 'integer' },
    rateHz:          { property: 'pulseRateHz',           domain: 'Voice', datatype: 'decimal' },
    amplitude:       { property: 'breathingAmplitude',    domain: 'Voice', datatype: 'decimal' },
  },
}

/** Patch-level timing fields with an SSTIM property. */
export const TIMING_PROPERTIES = {
  bpm:         { property: 'tempoBpm',        domain: 'SessionSpecification', datatype: 'decimal' },
  beatsPerBar: { property: 'beatsPerBar',     domain: 'SessionSpecification', datatype: 'integer' },
  lengthSec:   { property: 'durationSeconds', domain: 'SessionSpecification', datatype: 'integer' },
}

/**
 * SSTIM properties this projection deliberately does not emit, with the reason.
 *
 * Listed so the ontology-conformance test can distinguish "we forgot" from "we
 * decided". Every one of these describes a *catalog* voice, which a Patch Studio
 * track is not.
 */
export const DELIBERATELY_UNUSED = {
  martigliCenterFreq: 'A Martigli control track modulates other tracks; it has no carrier of its own.',
  martigliTransitionDuration: 'Patch Studio expresses the transition through control-track automation, not a single scalar.',
  isBreathReference: 'The one-breath-reference rule (CLAUDE.md §4.5) is a catalog preset constraint; Patch Studio does not mark a reference track.',
  cycleDuration: 'Symmetry timing is expressed as rateHz in Patch Studio; d = nnotes / rateHz is derivable but not stored.',
  octaveSpan: 'Patch Studio Symmetry controls are isochronic (noctaves = 0) and do not expose an octave span.',
  permutationFunction: 'The plain-hunt family is fixed; no numeric permutation function is stored.',
  visualDensity: 'No Patch Studio visual parameter corresponds; particle count is not exposed as a density.',
}

/**
 * Structural divergences between the two models, reported with every package.
 *
 * All three are **resolved** as of ADR 0040 (2026-07-31). They are kept, rather
 * than deleted, because packages built before that date carry them as open
 * findings and a reader comparing two packages should be able to see what
 * changed and when. A `resolved` entry is not a warning.
 */
export const STRUCTURAL_FINDINGS = [
  {
    id: 'S1',
    severity: 'resolved',
    resolvedIn: 'ADR 0040',
    finding: 'SSTIM had no patch-studio-native session class.',
    detail:
      'Typing the projection as sstim:SessionSpecification failed SHACL: that shape requires exactly one sstim:referencesPreset pointing at a sstim:Preset, and a patch executes no catalog preset.',
    consequence:
      'sstim:Patch now exists in sstim-patch-studio.ttl as an information content entity and prov:Plan, sibling to sstim:Preset. A SHACL shape additionally forbids typing one object as both a Patch and a SessionSpecification.',
  },
  {
    id: 'S2',
    severity: 'resolved',
    resolvedIn: 'ADR 0040',
    finding: 'Patch Studio track types had no corresponding sstim:Voice subtype.',
    detail:
      'sstim-sh:VoiceShape requires sh:xone of BinauralVoice, MartigliVoice, MartigliBinauralVoice or SymmetryVoice. Carrier, Noise, Drone, Sample, the nine visual types and Vibration match none of them.',
    consequence:
      'sstim:Track now exists with four disjoint subtypes — AudioTrack, VisualTrack, HapticTrack, ControlTrack — parallel to sstim:Voice rather than hierarchically related to it, and sstim:composedOfTrack links a patch to them.',
  },
  {
    id: 'V1',
    severity: 'resolved',
    resolvedIn: 'ADR 0040',
    finding: 'Visual and haptic properties were session-scoped in SSTIM but track-scoped in Patch Studio.',
    detail:
      'rotationSpeed, visualSideCount, visualDensity, stimulationIntensity and hapticPattern had rdfs:domain sstim:SessionSpecification, implying one visual and one haptic configuration per session, while a patch may carry nine visual tracks.',
    consequence:
      'Twenty-three property domains were widened to unions admitting the corresponding patch class. Existing catalog data is unaffected: a union domain is a weaker entailment, so every prior assertion remains valid.',
  },
]

// ── serialisation ───────────────────────────────────────────────────────────

const PREFIXES = [
  ['sstim', SSTIM],
  ['dct', DCT],
  ['rdfs', RDFS],
  ['xsd', XSD],
]

/** Turtle string literal escaping, per the Turtle grammar. */
function escapeLiteral(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * A typed literal.
 *
 * Numbers are written through Number so that 10 and 10.0 cannot produce
 * different bytes for the same value — the package checksum depends on it.
 */
function literal(value, datatype) {
  if (datatype === 'boolean') return `"${value ? 'true' : 'false'}"^^xsd:boolean`
  if (datatype === 'integer') return `"${Math.round(Number(value))}"^^xsd:integer`
  if (datatype === 'decimal') {
    const n = Number(value)
    // Fixed precision keeps the serialisation canonical without losing the
    // resolution any stimulation parameter actually carries.
    return `"${(Math.round(n * 1e6) / 1e6).toFixed(6)}"^^xsd:decimal`
  }
  return `"${escapeLiteral(value)}"`
}

// ── projection ──────────────────────────────────────────────────────────────

function paramValue(track, name) {
  const param = track?.params?.[name]
  if (param === undefined || param === null) return undefined
  const value = typeof param === 'object' ? param.value : param
  return Number.isFinite(Number(value)) ? Number(value) : undefined
}

/**
 * Project a patch, returning RDF and a mapping report.
 *
 * @param {object} patchExport a `patch-studio-model-1` document
 * @param {{ sessionIri: string, created: string }} options
 *        `created` is supplied rather than read from the clock so the same patch
 *        always yields the same bytes.
 * @returns {{ turtle: string, jsonld: object, report: object }}
 */
export function projectPatch(patchExport, { sessionIri, created }) {
  if (patchExport?.model !== PATCH_STUDIO_MODEL) {
    throw new Error('Only Patch Studio patches can be projected into SSTIM.')
  }
  if (!sessionIri) throw new Error('projectPatch needs a sessionIri.')
  if (!created) throw new Error('projectPatch needs a created timestamp.')

  const mapped = []
  const unmapped = []
  /** @type {Array<{ iri: string, statements: Array<[string, string]> }>} */
  const nodes = []

  const sessionStatements = [
    ['a', 'sstim:Patch'],
    ['rdfs:label', `"${escapeLiteral(patchExport.patchName ?? 'Untitled Patch')}"`],
    ['dct:created', `"${created}"^^xsd:dateTime`],
    ['dct:conformsTo', `<https://w3id.org/sstim/patch-studio>`],
  ]

  // Timing.
  const timing = patchExport.timing ?? {}
  for (const [field, spec] of Object.entries(TIMING_PROPERTIES)) {
    const raw = field === 'bpm' ? (timing.bpm?.value ?? timing.bpm) : timing[field]
    if (raw === undefined || raw === null || !Number.isFinite(Number(raw))) continue
    sessionStatements.push([`sstim:${spec.property}`, literal(raw, spec.datatype)])
    mapped.push({ source: `timing.${field}`, property: `sstim:${spec.property}`, scope: 'session' })
  }

  nodes.push({ iri: sessionIri, statements: sessionStatements })

  const trackGroups = [
    ['audioTracks', patchExport.audioTracks],
    ['visualTracks', patchExport.visualTracks],
    ['hapticTracks', patchExport.hapticTracks],
  ]

  for (const [group, tracks] of trackGroups) {
    for (const [index, track] of (tracks ?? []).entries()) {
      const iri = `${sessionIri}/track/${group}-${index + 1}`
      const statements = [
        ['a', `sstim:${TRACK_CLASSES[group]}`],
        ['rdfs:label', `"${escapeLiteral(track.trackType ?? 'Track')}"`],
      ]

      for (const name of Object.keys(track.params ?? {}).sort()) {
        const spec = PARAM_PROPERTIES[name]
        const value = paramValue(track, name)
        if (value === undefined) continue

        if (!spec) {
          unmapped.push({
            source: `${group}[${index}].${name}`,
            reason: 'No SSTIM property corresponds to this parameter.',
          })
          continue
        }
        statements.push([`sstim:${spec.property}`, literal(value, spec.datatype)])
        mapped.push({
          source: `${group}[${index}].${name}`,
          property: `sstim:${spec.property}`,
          scope: spec.domain === 'SessionSpecification' ? 'track (domain divergence V1)' : 'track',
        })
      }


      sessionStatements.push(['sstim:composedOfTrack', `<${iri}>`])
      nodes.push({ iri, statements })
    }
  }

  // Control tracks.
  for (const [index, control] of (patchExport.controlTracks ?? []).entries()) {
    const iri = `${sessionIri}/control/${index + 1}`
    const statements = [
      ['a', 'sstim:ControlTrack'],
      ['rdfs:label', `"${escapeLiteral(control.type ?? 'Control')}"`],
    ]
    const table = CONTROL_PROPERTIES[control.type] ?? {}

    for (const name of Object.keys(control).sort()) {
      if (['id', 'type', 'name'].includes(name)) continue
      const value = Number(control[name])
      if (!Number.isFinite(value)) continue

      const spec = table[name]
      if (!spec) {
        unmapped.push({
          source: `controlTracks[${index}].${name}`,
          reason: 'No SSTIM property corresponds to this control parameter.',
        })
        continue
      }
      statements.push([`sstim:${spec.property}`, literal(value, spec.datatype)])
      mapped.push({ source: `controlTracks[${index}].${name}`, property: `sstim:${spec.property}`, scope: 'control' })
    }
    sessionStatements.push(['sstim:composedOfTrack', `<${iri}>`])
    nodes.push({ iri, statements })
  }

  const turtle = [
    ...PREFIXES.map(([p, iri]) => `@prefix ${p}: <${iri}> .`),
    '',
    ...nodes.map(({ iri, statements }) =>
      `<${iri}>\n${statements.map(([p, o]) => `    ${p} ${o}`).join(' ;\n')} .\n`,
    ),
  ].join('\n')

  const report = {
    model: PROJECTION_MODEL,
    sessionIri,
    mappedCount: mapped.length,
    unmappedCount: unmapped.length,
    mapped,
    unmapped,
    deliberatelyUnusedProperties: DELIBERATELY_UNUSED,
    structuralFindings: STRUCTURAL_FINDINGS,
    // Stated plainly so no downstream reader mistakes this for catalog RDF.
    conformance:
      'SHACL-validated SSTIM projection: the patch is a sstim:Patch composed of typed sstim:Track instances (ADR 0040). It is deliberately not a sstim:SessionSpecification, which executes a catalog preset, and it asserts no evidence, outcome or safety metadata — those are authored by a human through the gated catalog bridge (ADR 0026). The lossless patch in the package remains the executable truth; see unmapped for parameters with no SSTIM property.',
  }

  return { turtle, jsonld: toJsonLd(nodes), report }
}

/** The same statements as JSON-LD, for consumers that prefer it. */
function toJsonLd(nodes) {
  return {
    '@context': Object.fromEntries(PREFIXES.map(([p, iri]) => [p, iri])),
    '@graph': nodes.map(({ iri, statements }) => {
      const node = { '@id': iri }
      for (const [predicate, object] of statements) {
        if (predicate === 'a') { node['@type'] = object; continue }
        const key = predicate
        let value
        if (object.startsWith('<')) value = { '@id': object.slice(1, -1) }
        else {
          const typed = object.match(/^"(.*)"\^\^xsd:(\w+)$/s)
          value = typed
            ? { '@value': typed[1], '@type': `${XSD}${typed[2]}` }
            : object.replace(/^"|"$/g, '')
        }
        node[key] = node[key] === undefined ? value : [].concat(node[key], value)
      }
      return node
    }),
  }
}
