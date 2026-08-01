// Project a Patch Studio patch into SSTIM RDF — the declared mappable subset,
// with an explicit report of everything that did not travel.
//
// ADR 0026 established that `patch-studio-model-1` and the catalog model are
// structurally different and that conversion is partial. This module is the RDF
// half of that: it never claims more than it can support, and it makes the gap
// machine-readable instead of leaving it to a footnote.
//
// ## The projection is a `sstim:Preset`
//
// It has been three things. Originally an untyped `prov:Entity`, because typing
// a patch as `sstim:SessionSpecification` failed SHACL — that class is the
// execution of a catalog preset and a patch executes none. ADR 0040 then minted
// `sstim:Patch` to fix that, which was the wrong repair: it put an
// engine-specific serialisation into the shared term space.
//
// ADR 0041 withdrew it. "Patch" and "preset" name the same layer — a saved
// parameter configuration for some engine — and the difference between BSC's two
// serialisations is a fact about BSC, not about sensory stimulation. So the
// projection is a `sstim:Preset` composed of `sstim:Track` instances, and the
// BSC catalog's curation requirements moved to a profile shape targeting
// configurations built from catalog `sstim:Voice`s.
//
// What a preset is *not* is the stimulation itself. The engine-independent
// description of what reaches the subject is `sstim:StimulusSpecification`,
// introduced by ADR 0042: `gain: 0.5` is an engine control, `65 dB SPL at the
// ear` is a stimulus property, and only the second is reproducible across
// engines. This projection has no calibrated-output observation from which to
// build that specification, so it truthfully describes settings only.

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
  LFO: {
    periodSec:       { property: 'martigliPeriodInitial', domain: 'Voice', datatype: 'decimal' },
    targetPeriodSec: { property: 'martigliPeriodFinal',   domain: 'Voice', datatype: 'decimal' },
    inhaleRatio:     { property: 'breathingPhaseRatio',   domain: 'Voice', datatype: 'decimal' },
    amplitude:       { property: 'martigliAmplitude',     domain: 'Voice', datatype: 'decimal' },
  },
  Permutation: {
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
  hasBreathGuide: 'This relation identifies a catalog Voice used as the breathing guide; Patch Studio tracks are generic configuration tracks, not catalog voices.',
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
 * S1 and S2 were resolved by ADR 0040 and then *re-resolved differently* by
 * ADR 0041, which withdrew the classes 0040 added. They are kept rather than
 * deleted because packages built on 2026-07-31 carry the intermediate answer,
 * and a reader comparing packages should be able to see the sequence.
 *
 * V1 remains resolved: the widened property domains survived, only their union
 * members changed.
 */
export const STRUCTURAL_FINDINGS = [
  {
    id: 'S1',
    severity: 'resolved',
    resolvedIn: 'ADR 0041 (superseding ADR 0040)',
    finding: 'A Patch Studio configuration had no SSTIM class it could claim.',
    detail:
      'sstim:SessionSpecification requires exactly one sstim:referencesPreset and a configuration executes no catalog preset. ADR 0040 answered by minting sstim:Patch; ADR 0041 withdrew that as an engine-specific serialisation in a shared term space (CLAUDE.md §5.1).',
    consequence:
      'The projection is a sstim:Preset — the engine-configuration layer, of which "patch" is a synonym. Curation requirements moved to a BSC catalog profile shape, so a configuration is not required to carry metadata it does not have.',
  },
  {
    id: 'S2',
    severity: 'resolved',
    resolvedIn: 'ADR 0040, retained by ADR 0041',
    finding: 'Configuration layers had no SSTIM class.',
    detail:
      'sstim-sh:VoiceShape requires one of four catalog voice types, which Carrier, Noise, Drone, Sample, the nine visual types and Vibration are not.',
    consequence:
      'sstim:Track with four disjoint subtypes, linked by sstim:composedOfTrack. Retained by ADR 0041 as genuinely general: any multi-layer configuration has layers. Whether sstim:Voice is a sstim:AudioTrack is still open.',
  },
  {
    id: 'V1',
    severity: 'resolved',
    resolvedIn: 'ADR 0040, adjusted by ADR 0041',
    finding: 'Visual and haptic properties were session-scoped but are layer-scoped in a configuration.',
    detail:
      'rotationSpeed, visualSideCount, visualDensity, stimulationIntensity and hapticPattern had rdfs:domain sstim:SessionSpecification, implying one visual and one haptic configuration per session.',
    consequence:
      'Domains widened to unions admitting the layer classes. A union domain is a weaker entailment, so no prior catalog assertion changed meaning.',
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
    ['a', 'sstim:Preset'],
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
      'SHACL-validated SSTIM projection: a sstim:Preset — the engine-configuration layer — composed of typed sstim:Track instances (ADR 0041). It is deliberately not a sstim:SessionSpecification, which is an execution rather than a configuration, and it asserts no evidence, outcome or safety metadata: those are authored by a human through the gated catalog bridge (ADR 0026). It is also not a sstim:StimulusSpecification: that engine-independent description exists (ADR 0042), but producing one requires calibrated delivered-output data that a saved engine configuration does not contain. The lossless patch in the package remains the executable truth; see unmapped for parameters with no SSTIM property.',
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
