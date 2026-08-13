// Project a native session bundle into SSTIM RDF — the declared subset — and
// name everything that did not travel.
//
// The native bundle is the record. This is a projection over it, and it is a
// partial one: SSTIM today has classes for a specification, an execution and a
// self-report, and has no term at all for an event timeline, for instrument
// provenance, for the six response states, for a qualified unwanted experience,
// or for a privacy profile. Those are not oversights in this file — they are the
// terms KR-02 and KR-03 asked for and that the ontology has not yet declared.
//
// Two rules follow, and they are the reason this module is worth having:
//
//   1. **Never mint an undeclared IRI.** KR-17 was exactly this failure in the
//      Patch Studio runtime: a serialiser inventing sstim: IRIs for things the
//      ontology never defined, producing graphs that look authoritative and
//      validate against nothing. Where there is no term, this projection emits
//      no triple and says so.
//
//   2. **Account for every field.** Every leaf in the bundle is classified as
//      projected or withheld, and `assertExhaustive` fails the build if one is
//      neither. A field added to the schema and forgotten here cannot slip out
//      silently; it stops CI instead.
//
// The withheld list doubles as the work order: each entry names the term SSTIM
// would need. That list is the input to the protected-file change that closes
// the rest of KR-02/KR-03, and it is generated rather than maintained by hand.

import { DataFactory, Writer } from 'n3'
import {
  SSTIM, SSTIM_V, RDF, RDFS, DCT, XSD, PROV, BSCLAB_SESSION, BSCLAB_IRI, PREFIXES,
} from '../rdf/namespaces.js'
import { leafPointers } from './sessionContract.js'

const { namedNode, literal, quad } = DataFactory

export const SESSION_PROJECTION_MODEL = 'bsc-lab-session-projection-1'

const a = RDF('type')
const int = (n) => literal(String(Math.round(n)), XSD('integer'))
const dec = (n) => literal(String(n), XSD('decimal'))
const dt = (s) => literal(s, XSD('dateTime'))
const bool = (b) => literal(String(b), XSD('boolean'))
const en = (s) => literal(s, 'en')

/** The three phases SSTIM declares. `during-session` is not one of them. */
const PHASE_CONCEPTS = {
  'pre-session': 'reportPreSession',
  'immediate-post': 'reportImmediatePost',
  'follow-up': 'reportFollowUp',
}

const MODALITY_CONCEPTS = {
  auditory: 'modalityAuditory',
  visual: 'modalityVisual',
  somatosensory: 'modalitySomatosensory',
}

/**
 * Observation roles that have a declared scalar property.
 *
 * Improvement plan 2.1 permits the legacy scalars as "documented simple
 * projections" of the qualified model, which is what this table is. It carries
 * the answer and drops everything that made the answer interpretable — the
 * prompt, the scale, the instrument version, the response state. That loss is
 * reported per field rather than absorbed.
 */
const SCALAR_PROPERTIES = {
  'primary-affect': { property: 'primaryAffect', kind: 'integer' },
  focus: { property: 'focusRating', kind: 'integer' },
  sleepiness: { property: 'sleepiness', kind: 'integer' },
  'subjective-quality': { property: 'subjectiveQuality', kind: 'integer' },
  'goal-achieved': { property: 'goalAchieved', kind: 'boolean' },
}

/**
 * Project a bundle.
 *
 * @param {object} bundle a document conforming to static/schemas/session.schema.json
 * @param {{ trackIri?: (localId: string) => string }} [options]
 *        `trackIri` resolves a disabled track's local id to the IRI its own
 *        configuration projection used. Without it the disabled-track list is
 *        withheld rather than pointed at IRIs this graph does not define.
 * @returns {{ quads: import('n3').Quad[], report: object }}
 */
export function projectSession(bundle, options = {}) {
  if (bundle?.model !== 'bsc-lab-session-bundle-1') {
    throw new Error(`Unsupported session bundle model "${bundle?.model}".`)
  }
  if (bundle.privacy?.withdrawn === true) {
    throw new Error('Refusing to project a withdrawn session: withdrawal overrides every other field.')
  }
  if (bundle.instance?.completionStatus === 'in-progress') {
    throw new Error('Refusing to project an open session: an in-progress instance is not yet a record of anything.')
  }

  const quads = []
  const projected = []
  const withheld = []
  const add = (s, p, o) => quads.push(quad(s, p, o))
  const keep = (pointer, property) => projected.push({ pointer, property })
  const drop = (pointer, reason, requiredTerm) => {
    withheld.push(requiredTerm ? { pointer, reason, requiredTerm } : { pointer, reason })
  }
  /** Classify a whole subtree at once, one entry per leaf. */
  const dropTree = (pointer, value, reason, requiredTerm) => {
    for (const p of leafPointers(value, pointer)) drop(p, reason, requiredTerm)
  }

  const spec = bundle.specification
  const inst = bundle.instance
  const specNode = BSCLAB_SESSION(spec.id)
  const instNode = BSCLAB_SESSION(inst.id)
  const sourceNode = namedNode(spec.source.ref)

  // ── The source configuration ───────────────────────────────────────────────
  // Typed and labelled here so the graph validates on its own: SessionSpecShape
  // requires referencesPreset to point at a sstim:Preset, and PresetShape
  // requires that preset to carry a label. This asserts the type we already
  // depend on rather than describing a configuration we did not read.
  add(sourceNode, a, SSTIM('Preset'))
  add(sourceNode, RDFS('label'), en(spec.source.label))
  keep('/specification/source/ref', 'sstim:referencesPreset')
  keep('/specification/source/label', 'rdfs:label (on the referenced preset)')
  drop('/specification/source/kind',
    'ADR 0041: "patch" and "preset" name the same layer, and the difference between BSC\'s two serialisations is a fact about BSC rather than about sensory stimulation. Both project as sstim:Preset.')
  drop('/specification/source/contentHash',
    'No property records the content hash of the configuration a session executed, so the RDF cannot show that the source has not moved since.',
    'a content-integrity property (hash + algorithm) on sstim:Preset or sstim:SessionSpecification')
  if (spec.source.contentHashAlgorithm !== undefined) {
    drop('/specification/source/contentHashAlgorithm', 'Carried with the hash it qualifies.',
      'a content-integrity property (hash + algorithm) on sstim:Preset or sstim:SessionSpecification')
  }
  if (spec.source.catalogVersion !== undefined) {
    drop('/specification/source/catalogVersion', 'No property records which catalog version supplied the configuration.',
      'a catalog-version property on sstim:Preset')
  }

  // ── Specification ──────────────────────────────────────────────────────────
  add(specNode, a, SSTIM('SessionSpecification'))
  add(specNode, a, PROV('Plan'))
  add(specNode, RDFS('label'), en(spec.label))
  add(specNode, DCT('created'), dt(spec.created))
  add(specNode, SSTIM('referencesPreset'), sourceNode)
  add(specNode, SSTIM('durationSeconds'), int(spec.durationSeconds))
  add(specNode, SSTIM('masterVolume'), dec(spec.masterVolume))
  keep('/specification/id', 'IRI identity')
  keep('/specification/label', 'rdfs:label')
  keep('/specification/created', 'dct:created')
  keep('/specification/durationSeconds', 'sstim:durationSeconds')
  keep('/specification/masterVolume', 'sstim:masterVolume')

  if (spec.scheduledStart !== undefined) {
    add(specNode, SSTIM('scheduledStart'), dt(spec.scheduledStart))
    keep('/specification/scheduledStart', 'sstim:scheduledStart')
  }
  if (spec.masterBrightness !== undefined) {
    add(specNode, SSTIM('masterBrightness'), dec(spec.masterBrightness))
    keep('/specification/masterBrightness', 'sstim:masterBrightness')
  }

  for (const [field, property] of [
    ['breathingPeriodInitial', 'breathingPeriodInitial'],
    ['breathingPeriodFinal', 'breathingPeriodFinal'],
    ['breathingTransitionDuration', 'breathingTransitionDuration'],
  ]) {
    if (spec[field] === undefined) continue
    const pointer = `/specification/${field}`
    if (spec[field] === null) {
      // An explicit null means "the source's own value was used". RDF omits the
      // triple, and an omitted triple cannot be told apart from a record that
      // never captured the override at all — so the distinction the native
      // contract makes on purpose does not survive the projection.
      drop(pointer, 'An explicit null ("source default used") projects as an absent triple, which is indistinguishable from "not recorded".',
        'a way to assert that an override was deliberately not set')
    } else {
      add(specNode, SSTIM(property), dec(spec[field]))
      keep(pointer, `sstim:${property}`)
    }
  }

  if (spec.disabledTracks?.length) {
    for (const [index, localId] of spec.disabledTracks.entries()) {
      const pointer = `/specification/disabledTracks/${index}`
      const iri = options.trackIri?.(localId)
      if (iri) {
        add(specNode, SSTIM('disablesTrack'), namedNode(iri))
        keep(pointer, 'sstim:disablesTrack')
      } else {
        drop(pointer, 'sstim:disablesTrack exists, but a track\'s local id only becomes an IRI in its own configuration projection; minting one here would name a resource this graph does not define.')
      }
    }
  } else if (spec.disabledTracks) {
    drop('/specification/disabledTracks', 'Empty list; nothing to project.')
  }

  if (spec.environment) {
    dropTree('/specification/environment', spec.environment,
      'The reproduction chain — engine identity and build, output route, sample rate, latency, platform, app and ontology version — has no declared representation. SESSION_MODEL.md once showed a sstim:headphoneMode triple; that term has never existed.',
      'an execution-environment description (engine identity/build, declared output route, sample rate, output latency, platform, app version)')
  }

  drop('/specification/outputGuarantee',
    'Which reproduction claim the record supports cannot be stated in RDF, while sstim:SessionSpecification\'s own definition asserts fully determined output. The graph therefore claims more than the record does.',
    'a reproducibility-level property with values bit-exact / signal-equivalent / perceptually-equivalent')

  // ── Instance ───────────────────────────────────────────────────────────────
  add(instNode, a, SSTIM('SessionInstance'))
  add(instNode, RDFS('label'), en(inst.label ?? `Session ${inst.id}`))
  add(instNode, SSTIM('usesSpecification'), specNode)
  add(instNode, SSTIM('actualDurationSeconds'), int(inst.actualDurationSeconds))
  add(instNode, SSTIM('completionStatus'), literal(inst.completionStatus, XSD('string')))
  add(instNode, PROV('startedAtTime'), dt(inst.startedAt))
  add(instNode, PROV('endedAtTime'), dt(inst.endedAt))
  add(instNode, PROV('wasAssociatedWith'), BSCLAB_IRI)
  keep('/instance/id', 'IRI identity')
  keep('/instance/specificationId', 'sstim:usesSpecification')
  keep('/instance/startedAt', 'prov:startedAtTime')
  keep('/instance/endedAt', 'prov:endedAtTime')
  keep('/instance/completionStatus', 'sstim:completionStatus')
  keep('/instance/actualDurationSeconds', 'sstim:actualDurationSeconds (narrowed to xsd:integer)')
  if (inst.label !== undefined) keep('/instance/label', 'rdfs:label')

  drop('/instance/clockOriginSeconds',
    'The engine-clock origin every offset is measured from has no property, so a projected session cannot be re-aligned to its own timeline.',
    'a clock-origin property on sstim:SessionInstance')
  if (inst.clockSource !== undefined) {
    drop('/instance/clockSource', 'Which timing authority produced the offsets cannot be stated.',
      'a timing-authority property (audio-context / silent-monotonic)')
  }
  drop('/instance/deliveredSeconds',
    'Only total elapsed time has a property. A session paused for ten minutes and one that ran ten minutes shorter project identically.',
    'a delivered-duration property distinct from actualDurationSeconds')

  for (const [index, modality] of (inst.deliveryModalities ?? []).entries()) {
    const pointer = `/instance/deliveryModalities/${index}`
    const concept = MODALITY_CONCEPTS[modality]
    if (concept) {
      add(instNode, SSTIM('hasDeliveryModality'), SSTIM_V(concept))
      keep(pointer, 'sstim:hasDeliveryModality')
    } else {
      drop(pointer, `No declared sstim:SensoryModality concept for "${modality}".`)
    }
  }
  if (inst.deliveryModalities?.length === 0) {
    drop('/instance/deliveryModalities', 'Empty list; nothing to project.')
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  // The whole timeline. This is the largest single gap and the one that blocks
  // the HED event profile: HED describes what occurred and when, and SSTIM
  // currently cannot say that anything occurred at all.
  if (bundle.events?.length) {
    dropTree('/events', bundle.events,
      'SSTIM declares no event class. The execution timeline — open, start, pause, resume, stop, complete, interrupt, engine fallback, safety clamp, report collected — has no representation, so a projected session records that it ran but not what happened during it.',
      'a session-event class with an engine-clock offset, a controlled event-type scheme, and a link from sstim:SessionInstance')
  } else {
    drop('/events', 'No events recorded.')
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  for (const [index, report] of (bundle.reports ?? []).entries()) {
    projectReport(report, `/reports/${index}`)
  }
  if (!bundle.reports?.length) drop('/reports', 'No reports collected.')

  function projectReport(report, base) {
    const concept = PHASE_CONCEPTS[report.phase]
    const scalars = (report.items ?? []).filter(
      (item) => item.responseState === 'supplied' && SCALAR_PROPERTIES[item.role],
    )

    // Two reasons a report cannot be projected at all, both structural rather
    // than incidental: SelfReportShape requires exactly one declared phase and
    // at least one scalar value, so emitting a node without them would produce
    // a graph that fails its own contract.
    let blocked = null
    if (!concept) {
      blocked = {
        reason: `No sstim:SelfReportPhase concept exists for "${report.phase}"; SSTIM declares only pre-session, immediate-post and follow-up. The whole report is withheld because sstim-sh:SelfReportShape requires exactly one phase.`,
        requiredTerm: 'a during-session SelfReportPhase concept',
      }
    } else if (!report.collectedAt) {
      blocked = { reason: 'SelfReportShape requires one xsd:dateTime collection timestamp, and this report has no wall-clock collectedAt.' }
    } else if (scalars.length === 0) {
      blocked = {
        reason: 'No item has both a supplied response and a declared scalar property, and SelfReportShape requires at least one report value. A report whose only content is perceived helpfulness, or whose every answer was declined, cannot be projected.',
        requiredTerm: 'a qualified observation class that does not depend on the five legacy scalars',
      }
    }

    if (blocked) {
      dropTree(base, report, blocked.reason, blocked.requiredTerm)
      return
    }

    const reportNode = BSCLAB_SESSION(report.id)
    add(reportNode, a, SSTIM('SelfReport'))
    add(reportNode, RDFS('label'), en(`Report ${report.id}`))
    add(reportNode, SSTIM('hasReportPhase'), SSTIM_V(concept))
    add(reportNode, PROV('generatedAtTime'), dt(report.collectedAt))
    add(instNode, SSTIM('hasSelfReport'), reportNode)
    keep(`${base}/id`, 'IRI identity')
    keep(`${base}/phase`, 'sstim:hasReportPhase')
    keep(`${base}/collectedAt`, 'prov:generatedAtTime')

    if (report.collectedAtOffsetSeconds !== undefined) {
      drop(`${base}/collectedAtOffsetSeconds`,
        'Placement on the engine clock has no property; only the wall clock survives.',
        'an engine-clock offset property for observations collected during a session')
    }

    dropTree(`${base}/instrument`, report.instrument,
      'Instrument identity, version and language have no representation, and reports are not comparable across instrument versions. A projected report therefore cannot be analysed responsibly.',
      'instrument and prompt provenance (instrument id, version, language)')

    if (report.statedGoal) {
      dropTree(`${base}/statedGoal`, report.statedGoal,
        'The participant\'s own stated goal has no property. sstim:goalAchieved asserts a goal was met while the goal itself is unrepresentable.',
        'a participant-stated-goal property, kept distinct from any clinical target')
    }

    for (const [i, item] of (report.items ?? []).entries()) {
      projectItem(item, `${base}/items/${i}`, reportNode)
    }
    if (!report.items?.length) drop(`${base}/items`, 'No items in this report.')

    dropTree(`${base}/unwantedExperiences`, report.unwantedExperiences,
      'Unwanted experiences have no representation at any level: not the response state that distinguishes "none reported" from "not asked" and "declined", and not the qualified record — category, participant-reported severity, onset, persistence, action taken, resolution, participant-perceived relatedness.',
      'a qualified unwanted-experience observation class with a controlled category scheme, plus the six-value response-state scheme')
  }

  function projectItem(item, base, reportNode) {
    const scalar = SCALAR_PROPERTIES[item.role]

    if (!scalar) {
      dropTree(base, item,
        `No declared property observes "${item.role}". Perceived helpfulness is the direct magnitude item KR-03 found missing; the five legacy scalars do not cover it.`,
        'a perceived-helpfulness observation with a declared scale')
      return
    }
    if (item.responseState !== 'supplied') {
      dropTree(base, item,
        `Response state "${item.responseState}" has no representation: RDF can only omit the triple, which collapses "none reported", "not asked", "declined", "unknown" and "not applicable" into one silence.`,
        'a six-value response-state scheme so absence carries its reason')
      return
    }

    add(reportNode, SSTIM(scalar.property), scalar.kind === 'boolean' ? bool(item.value) : int(item.value))
    keep(`${base}/value`, `sstim:${scalar.property}`)
    drop(`${base}/id`, 'The answer projects as a literal on the report, so the item itself has no node and no identity.',
      'a qualified observation class, so each answer is an addressable record')
    drop(`${base}/role`, 'Carried implicitly by which scalar property was used; it is not stated.')
    drop(`${base}/responseState`, 'Only "supplied" is projectable, so the state itself is never asserted.',
      'a six-value response-state scheme so absence carries its reason')
    if (item.scale) {
      dropTree(`${base}/scale`, item.scale,
        'The scale as presented is dropped, leaving a bare integer whose range and anchors are not recoverable from the graph.',
        'a declared scale (kind, bounds, anchor labels) on an observation')
    }
    if (item.prompt) {
      dropTree(`${base}/prompt`, item.prompt, 'The exact question shown is dropped.',
        'instrument and prompt provenance (instrument id, version, language)')
    }
    if (item.confidence !== undefined) {
      drop(`${base}/confidence`, 'Participant-declared confidence has no property.',
        'a confidence property on an observation')
    }
  }

  // ── Privacy ────────────────────────────────────────────────────────────────
  dropTree('/privacy', bundle.privacy,
    'The privacy and consent profile is withheld in full, by design. It governs whether this projection may be published at all, so it is carried alongside the graph rather than inside it, and consent decisions belong in a separate access-controlled named graph (CLAUDE.md 5.5, improvement plan 2.2).',
    'a privacy/consent profile in an access-controlled graph, not in the projected session')

  drop('/model', 'The bundle model tag identifies the native contract, not anything in the graph.')

  const report = {
    model: SESSION_PROJECTION_MODEL,
    projectedTripleCount: quads.length,
    projected: projected.sort(byPointer),
    withheld: withheld.sort(byPointer),
    requiredTerms: [...new Set(withheld.map((w) => w.requiredTerm).filter(Boolean))].sort(),
    note:
      'The native bundle is the record; this graph is a partial projection over the terms SSTIM declares today. Every withheld field is listed with the term that would carry it. A session projected through this module states that it ran and how it was configured; it does not state what happened during it, how the answers were elicited, or what was not asked.',
  }

  assertExhaustive(bundle, report)
  return { quads, report }
}

function byPointer(x, y) {
  return x.pointer < y.pointer ? -1 : x.pointer > y.pointer ? 1 : 0
}

/**
 * Every leaf in the bundle is either projected or withheld.
 *
 * This is the check that makes the loss report worth trusting. It walks the
 * document independently of the projection, so a field the projection forgot is
 * a thrown error rather than a quiet omission — the failure mode that made the
 * old exports unsafe to rely on.
 */
export function assertExhaustive(bundle, report) {
  const classified = new Set([
    ...report.projected.map((p) => p.pointer),
    ...report.withheld.map((w) => w.pointer),
  ])
  const missing = leafPointers(bundle).filter((pointer) => !classified.has(pointer))
  if (missing.length > 0) {
    throw new Error(
      `Session projection did not account for ${missing.length} field(s): ${missing.slice(0, 8).join(', ')}` +
      `${missing.length > 8 ? ', …' : ''}. Every leaf must be projected or withheld with a reason.`,
    )
  }
  return true
}

/** Serialise projected quads as Turtle with the registered prefix map. */
export function sessionToTurtle(quads) {
  return new Promise((resolve, reject) => {
    const writer = new Writer({ prefixes: PREFIXES })
    writer.addQuads(quads)
    writer.end((error, result) => (error ? reject(error) : resolve(result)))
  })
}
