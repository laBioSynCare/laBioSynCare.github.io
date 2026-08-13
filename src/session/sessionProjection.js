// Project a native session bundle into SSTIM RDF — the declared subset — and
// name everything that did not travel.
//
// The native bundle is the record; this is a projection over it. As of ADR 0048
// most of it travels: SSTIM now declares the event timeline, the clock that
// orders it, qualified participant observations with their six response states,
// unwanted-experience records, instrument provenance, and the reproducibility
// and integrity metadata that make a specification more than a name. What
// remains withheld is withheld on purpose rather than for want of a term — see
// the tail of this file.
//
// Two rules survive that change, and they are the reason this module is worth
// having:
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
// The withheld list is still generated rather than maintained by hand, so it
// shrinks by itself as terms land and cannot claim a gap that has closed.

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

/**
 * Resolve a bundle value to a declared vocabulary concept, or refuse.
 *
 * Rule 1 of this module is "never mint an undeclared IRI", and an unguarded
 * table lookup breaks it silently: `SSTIM_V(undefined)` is a perfectly
 * well-formed IRI ending in `#undefined` that no ontology declares and no
 * shape rejects. The JSON Schema makes an unmapped value impossible, but
 * `projectSession` does not validate its input, so the rule has to hold on its
 * own rather than by trusting a check that may not have run.
 */
function declaredConcept(table, value, what) {
  const local = table[value]
  if (!local) {
    throw new Error(`No declared vocabulary concept for ${what} "${value}"; refusing to mint one.`)
  }
  return SSTIM_V(local)
}

/** All four phases, since ADR 0048 added the during-session concept. */
const PHASE_CONCEPTS = {
  'pre-session': 'reportPreSession',
  'during-session': 'reportDuringSession',
  'immediate-post': 'reportImmediatePost',
  'follow-up': 'reportFollowUp',
}

const MODALITY_CONCEPTS = {
  auditory: 'modalityAuditory',
  visual: 'modalityVisual',
  somatosensory: 'modalitySomatosensory',
}

const EVENT_TYPE_CONCEPTS = {
  'session-open': 'eventSessionOpen',
  'playback-start': 'eventPlaybackStart',
  'playback-pause': 'eventPlaybackPause',
  'playback-resume': 'eventPlaybackResume',
  'playback-stop': 'eventPlaybackStop',
  'session-complete': 'eventSessionComplete',
  'session-interrupt': 'eventSessionInterrupt',
  'engine-fallback': 'eventEngineFallback',
  'safety-clamp-applied': 'eventSafetyLimitApplied',
  'report-collected': 'eventObservationCollected',
}

const TIMING_AUTHORITY_CONCEPTS = {
  'audio-context': 'timingAudioHardwareClock',
  'silent-monotonic': 'timingMonotonicSubstitute',
}

const REPRODUCIBILITY_CONCEPTS = {
  'bit-exact': 'reproIdenticalRendering',
  'signal-equivalent': 'reproEquivalentSignal',
  'perceptually-equivalent': 'reproEquivalentPresentation',
}

const RESPONSE_STATE_CONCEPTS = {
  supplied: 'responseSupplied',
  'none-reported': 'responseNoneReported',
  'not-asked': 'responseNotAsked',
  declined: 'responseDeclined',
  unknown: 'responseUnknown',
  'not-applicable': 'responseNotApplicable',
}

const OBSERVATION_ROLE_CONCEPTS = {
  'perceived-helpfulness': 'rolePerceivedHelpfulness',
  'primary-affect': 'rolePrimaryAffect',
  focus: 'roleFocus',
  sleepiness: 'roleSleepiness',
  'subjective-quality': 'roleSubjectiveQuality',
  'goal-achieved': 'roleGoalAchieved',
}

const EXPERIENCE_CATEGORY_CONCEPTS = {
  'auditory-discomfort': 'experienceAuditoryDiscomfort',
  'visual-discomfort': 'experienceVisualDiscomfort',
  'eye-strain': 'experienceEyeStrain',
  'head-sensation': 'experienceHeadSensation',
  dizziness: 'experienceDizziness',
  nausea: 'experienceNausea',
  restlessness: 'experienceRestlessness',
  'low-mood': 'experienceLowMood',
  'sleep-disruption': 'experienceSleepDisruption',
  other: 'experienceOther',
}

const SEVERITY_CONCEPTS = {
  mild: 'severityMild',
  moderate: 'severityModerate',
  severe: 'severitySevere',
  declined: 'severityDeclined',
  unknown: 'severityUnknown',
}

const ONSET_PHASE_CONCEPTS = {
  'before-session': 'onsetBeforeSession',
  'during-session': 'onsetDuringSession',
  'immediately-after': 'onsetImmediatelyAfter',
  'later-same-day': 'onsetLaterSameDay',
  'next-day': 'onsetNextDay',
  unknown: 'onsetUnknown',
}

const PERSISTENCE_CONCEPTS = {
  'resolved-during-session': 'persistenceResolvedDuringSession',
  'resolved-same-day': 'persistenceResolvedSameDay',
  'resolved-later': 'persistenceResolvedLater',
  ongoing: 'persistenceOngoing',
  unknown: 'persistenceUnknown',
}

const ACTION_CONCEPTS = {
  none: 'actionNone',
  'reduced-intensity': 'actionReducedIntensity',
  'paused-session': 'actionPausedSession',
  'stopped-session': 'actionStoppedSession',
  'removed-headphones': 'actionChangedDelivery',
  other: 'actionOther',
  declined: 'actionDeclined',
  unknown: 'actionUnknown',
}

const RESOLUTION_CONCEPTS = {
  resolved: 'resolutionResolved',
  improved: 'resolutionImproved',
  unchanged: 'resolutionUnchanged',
  worsened: 'resolutionWorsened',
  unknown: 'resolutionUnknown',
}

const RELATEDNESS_CONCEPTS = {
  related: 'relatednessRelated',
  'possibly-related': 'relatednessPossiblyRelated',
  unrelated: 'relatednessUnrelated',
  unknown: 'relatednessUnknown',
  declined: 'relatednessDeclined',
}

/**
 * Every controlled value the projection must resolve, keyed by where the schema
 * declares it.
 *
 * Exported so a test can assert the two stay aligned in both directions: an
 * enum value the schema gained and this file never learned would otherwise
 * surface only at runtime, on the one recording that happened to use it, and a
 * mapping to a concept name that does not exist in the vocabulary would produce
 * a well-formed IRI that nothing declares.
 */
export const CONCEPT_TABLES = Object.freeze({
  '$defs/event/properties/type': EVENT_TYPE_CONCEPTS,
  '$defs/report/properties/phase': PHASE_CONCEPTS,
  '$defs/observationItem/properties/role': OBSERVATION_ROLE_CONCEPTS,
  '$defs/responseState': RESPONSE_STATE_CONCEPTS,
  '$defs/unwantedExperience/properties/category': EXPERIENCE_CATEGORY_CONCEPTS,
  '$defs/unwantedExperience/properties/participantReportedSeverity': SEVERITY_CONCEPTS,
  '$defs/unwantedExperience/properties/onsetPhase': ONSET_PHASE_CONCEPTS,
  '$defs/unwantedExperience/properties/persistence': PERSISTENCE_CONCEPTS,
  '$defs/unwantedExperience/properties/actionTaken': ACTION_CONCEPTS,
  '$defs/unwantedExperience/properties/resolution': RESOLUTION_CONCEPTS,
  '$defs/unwantedExperience/properties/participantPerceivedRelatedness': RELATEDNESS_CONCEPTS,
  '$defs/instance/properties/deliveryModalities/items': MODALITY_CONCEPTS,
  '$defs/instance/properties/clockSource': TIMING_AUTHORITY_CONCEPTS,
  '$defs/specification/properties/outputGuarantee': REPRODUCIBILITY_CONCEPTS,
})

/**
 * Observation roles that also have a legacy scalar property.
 *
 * Improvement plan 2.1 keeps the five scalars as "documented simple
 * projections" of the qualified model. They are emitted *in addition to* the
 * qualified observation, not instead of it: existing consumers keep working,
 * and nothing is lost, because the observation beside them carries the prompt,
 * the scale and the response state the scalar cannot.
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

  assertDistinctIds(bundle)

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
  add(specNode, SSTIM('configurationDigest'), literal(spec.source.contentHash, XSD('string')))
  add(specNode, SSTIM('digestAlgorithm'),
    literal(spec.source.contentHashAlgorithm ?? 'sha256-canonical-json', XSD('string')))
  keep('/specification/source/contentHash', 'sstim:configurationDigest')
  if (spec.source.contentHashAlgorithm !== undefined) {
    keep('/specification/source/contentHashAlgorithm', 'sstim:digestAlgorithm')
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

  const reproConcept = REPRODUCIBILITY_CONCEPTS[spec.outputGuarantee]
  if (reproConcept) {
    add(specNode, SSTIM('hasReproducibilityLevel'), SSTIM_V(reproConcept))
    keep('/specification/outputGuarantee', 'sstim:hasReproducibilityLevel')
  } else {
    drop('/specification/outputGuarantee', `No declared sstim:ReproducibilityLevel concept for "${spec.outputGuarantee}".`)
  }

  // ── Instance ───────────────────────────────────────────────────────────────
  add(instNode, a, SSTIM('SessionInstance'))
  add(instNode, RDFS('label'), en(inst.label ?? `Session ${inst.id}`))
  add(instNode, SSTIM('usesSpecification'), specNode)
  // Rounded *up*, not to nearest. sstim:actualDurationSeconds is xsd:integer
  // while deliveredDurationSeconds is decimal, and rounding to nearest can put
  // elapsed below delivered — a 602.4 s session delivering all of it projects as
  // 602 elapsed and 602.4 delivered, which violates the delivered ≤ elapsed
  // constraint on data that is perfectly correct. Ceiling can only overstate
  // elapsed by under a second, and never breaks the invariant.
  add(instNode, SSTIM('actualDurationSeconds'),
    literal(String(Math.ceil(inst.actualDurationSeconds)), XSD('integer')))
  add(instNode, SSTIM('completionStatus'), literal(inst.completionStatus, XSD('string')))
  add(instNode, PROV('startedAtTime'), dt(inst.startedAt))
  add(instNode, PROV('endedAtTime'), dt(inst.endedAt))
  add(instNode, PROV('wasAssociatedWith'), BSCLAB_IRI)
  keep('/instance/id', 'IRI identity')
  keep('/instance/specificationId', 'sstim:usesSpecification')
  keep('/instance/startedAt', 'prov:startedAtTime')
  keep('/instance/endedAt', 'prov:endedAtTime')
  keep('/instance/completionStatus', 'sstim:completionStatus')
  keep('/instance/actualDurationSeconds', 'sstim:actualDurationSeconds (rounded up to xsd:integer)')
  if (inst.label !== undefined) keep('/instance/label', 'rdfs:label')

  add(instNode, SSTIM('clockOriginSeconds'), dec(inst.clockOriginSeconds))
  keep('/instance/clockOriginSeconds', 'sstim:clockOriginSeconds')

  if (inst.clockSource !== undefined) {
    const authority = TIMING_AUTHORITY_CONCEPTS[inst.clockSource]
    if (authority) {
      add(instNode, SSTIM('hasTimingAuthority'), SSTIM_V(authority))
      keep('/instance/clockSource', 'sstim:hasTimingAuthority')
    } else {
      drop('/instance/clockSource', `No declared sstim:TimingAuthority concept for "${inst.clockSource}".`)
    }
  }

  add(instNode, SSTIM('deliveredDurationSeconds'), dec(inst.deliveredSeconds))
  keep('/instance/deliveredSeconds', 'sstim:deliveredDurationSeconds')

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
  // The execution timeline. Ordering lives in each event's offset, not in the
  // order of the statements: an RDF graph is a set, so a consumer that read the
  // timeline off statement order would get a different answer each time.
  for (const [index, event] of (bundle.events ?? []).entries()) {
    projectEvent(event, `/events/${index}`)
  }
  if (!bundle.events?.length) drop('/events', 'No events recorded.')

  function projectEvent(event, base) {
    const concept = EVENT_TYPE_CONCEPTS[event.type]
    if (!concept) {
      dropTree(base, event, `No declared sstim:SessionEventType concept for "${event.type}".`,
        'a session-event type concept for every event the recorder can emit')
      return
    }

    const node = BSCLAB_SESSION(event.id)
    add(node, a, SSTIM('SessionEvent'))
    add(node, SSTIM('hasEventType'), SSTIM_V(concept))
    add(node, SSTIM('eventOffsetSeconds'), dec(event.offsetSeconds))
    add(instNode, SSTIM('hasSessionEvent'), node)
    keep(`${base}/id`, 'IRI identity')
    keep(`${base}/type`, 'sstim:hasEventType')
    keep(`${base}/offsetSeconds`, 'sstim:eventOffsetSeconds')

    if (event.wallClock !== undefined) {
      // prov:startedAtTime, not prov:atTime: the latter has domain
      // prov:InstantaneousEvent, and sstim:SessionEvent is a prov:Activity. The
      // wrong one would have typed every event as something it is not, and no
      // local check would have caught it — the quality audit only polices
      // sstim: predicates.
      add(node, PROV('startedAtTime'), dt(event.wallClock))
      keep(`${base}/wallClock`, 'prov:startedAtTime')
    }
    if (event.detail) {
      dropTree(`${base}/detail`, event.detail,
        'Type-specific event detail — which engine replaced which, which parameter a safety limit constrained and to what value — has no representation. The event is recorded; its particulars are not.',
        'event-detail properties, at minimum the engine pair for a fallback and the parameter/requested/delivered triple for a safety limit')
    }
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  for (const [index, report] of (bundle.reports ?? []).entries()) {
    projectReport(report, `/reports/${index}`)
  }
  if (!bundle.reports?.length) drop('/reports', 'No reports collected.')

  function projectReport(report, base) {
    const concept = PHASE_CONCEPTS[report.phase]

    // One structural reason a report still cannot be projected: SelfReportShape
    // requires a collection timestamp, and a report without one would produce a
    // graph that fails its own contract.
    if (!concept) {
      dropTree(base, report, `No declared sstim:SelfReportPhase concept for "${report.phase}".`)
      return
    }
    if (!report.collectedAt) {
      dropTree(base, report,
        'sstim-sh:SelfReportShape requires one xsd:dateTime collection timestamp, and this report has no wall-clock collectedAt.')
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
        'Where on the session clock the report was collected has no property on sstim:SelfReport. The report-collected event carries the same instant, so the fact survives on the timeline; it is not recoverable from the report node itself.',
        'an engine-clock offset property on sstim:SelfReport')
    }

    // ── Instrument ──
    const instrumentNode = BSCLAB_SESSION(`${report.id}-instrument`)
    add(instrumentNode, a, SSTIM('ObservationInstrument'))
    add(instrumentNode, RDFS('label'), en(`${report.instrument.id} ${report.instrument.version}`))
    add(instrumentNode, DCT('identifier'), literal(report.instrument.id, XSD('string')))
    add(instrumentNode, SSTIM('instrumentVersion'), literal(report.instrument.version, XSD('string')))
    add(instrumentNode, DCT('language'), literal(report.instrument.language, XSD('string')))
    add(reportNode, SSTIM('hasInstrument'), instrumentNode)
    keep(`${base}/instrument/id`, 'dct:identifier')
    keep(`${base}/instrument/version`, 'sstim:instrumentVersion')
    keep(`${base}/instrument/language`, 'dct:language')

    // ── Stated goal ──
    // Modelled as an observation with its own role and response state, so a
    // goal that was never asked for stays distinct from one that was declined.
    if (report.statedGoal) {
      // Improvement plan 2.2: free text stays out of exports by default, because
      // it can carry identifiers no schema can anticipate.
      //
      // Which means a *supplied* goal cannot be projected at all while its text
      // is withheld. Emitting the observation with a `supplied` state and no
      // value would say "they answered, and here is the answer: nothing" — a
      // claim the value/state constraint rightly rejects. The states that carry
      // no text in the first place — declined, not-asked — project normally,
      // and those are the ones worth having anyway, since they record that the
      // question was put.
      const carriesText = report.statedGoal.text !== undefined
      const textTravels = carriesText && options.includeFreeText === true

      if (report.statedGoal.responseState === 'supplied' && !textTravels) {
        dropTree(`${base}/statedGoal`, report.statedGoal,
          'A supplied goal is withheld with its text: free text stays out of exports by default because it can carry identifying information, and an answer projected without its answer would claim the participant said nothing. sstim:observedTextValue carries it when the caller passes includeFreeText and the governing privacy profile permits it.')
      } else {
        const goalNode = BSCLAB_SESSION(`${report.id}-item-stated-goal`)
        add(goalNode, a, SSTIM('ParticipantObservation'))
        add(goalNode, SSTIM('hasObservationRole'), SSTIM_V('roleStatedGoal'))
        add(goalNode, SSTIM('hasResponseState'), declaredConcept(RESPONSE_STATE_CONCEPTS, report.statedGoal.responseState, 'response state'))
        add(reportNode, SSTIM('hasObservation'), goalNode)
        keep(`${base}/statedGoal/responseState`, 'sstim:hasResponseState')

        if (textTravels) {
          add(goalNode, SSTIM('observedTextValue'), literal(report.statedGoal.text, XSD('string')))
          keep(`${base}/statedGoal/text`, 'sstim:observedTextValue')
        } else if (carriesText) {
          drop(`${base}/statedGoal/text`, 'Free text is withheld by default: it can carry identifying information.')
        }
      }
    }

    for (const [i, item] of (report.items ?? []).entries()) {
      projectItem(item, `${base}/items/${i}`, reportNode)
    }
    if (!report.items?.length) drop(`${base}/items`, 'No items in this report.')

    projectUnwantedExperiences(report, `${base}/unwantedExperiences`, reportNode)
  }

  function projectItem(item, base, reportNode) {
    const role = OBSERVATION_ROLE_CONCEPTS[item.role]
    if (!role) {
      dropTree(base, item, `No declared sstim:ObservationRole concept for "${item.role}".`)
      return
    }

    // A supplied answer must reach a declared value property, or the whole
    // observation is withheld. Emitting the node without its value would leave
    // a `responseSupplied` observation carrying nothing, which the SHACL-SPARQL
    // value/state constraint rejects — a projection that produces graphs
    // failing its own contract is worse than one that declines to project.
    const projectableValue =
      item.responseState !== 'supplied' ||
      typeof item.value === 'boolean' ||
      Number.isInteger(item.value)

    if (!projectableValue) {
      dropTree(base, item,
        `A non-integer answer (${item.value}) has no declared property: sstim:observedOrdinalValue is xsd:integer, and rounding it would record an answer the participant did not give.`,
        'a continuous observation value, distinct from the ordinal one')
      return
    }

    const node = BSCLAB_SESSION(item.id)
    add(node, a, SSTIM('ParticipantObservation'))
    add(node, SSTIM('hasObservationRole'), SSTIM_V(role))
    add(node, SSTIM('hasResponseState'), declaredConcept(RESPONSE_STATE_CONCEPTS, item.responseState, 'response state'))
    add(reportNode, SSTIM('hasObservation'), node)
    keep(`${base}/id`, 'IRI identity')
    keep(`${base}/role`, 'sstim:hasObservationRole')
    keep(`${base}/responseState`, 'sstim:hasResponseState')

    if (item.responseState === 'supplied') {
      if (typeof item.value === 'boolean') {
        add(node, SSTIM('observedBooleanValue'), bool(item.value))
        keep(`${base}/value`, 'sstim:observedBooleanValue')
      } else {
        add(node, SSTIM('observedOrdinalValue'), int(item.value))
        keep(`${base}/value`, 'sstim:observedOrdinalValue')
      }

      // The legacy scalar, in addition to the observation rather than instead
      // of it: existing consumers keep reading what they always read, and the
      // qualified record beside it carries what the scalar cannot.
      const scalar = SCALAR_PROPERTIES[item.role]
      if (scalar) {
        add(reportNode, SSTIM(scalar.property), scalar.kind === 'boolean' ? bool(item.value) : int(item.value))
      }
    } else if (item.value !== undefined) {
      // Schema-guaranteed null. Recorded as projected because the response
      // state already carries the fact the null was standing in for.
      keep(`${base}/value`, 'sstim:hasResponseState (the absence is stated, not the null)')
    }

    if (item.scale) {
      if (item.scale.min !== undefined) {
        add(node, SSTIM('scaleMinimum'), int(item.scale.min))
        keep(`${base}/scale/min`, 'sstim:scaleMinimum')
      }
      if (item.scale.max !== undefined) {
        add(node, SSTIM('scaleMaximum'), int(item.scale.max))
        keep(`${base}/scale/max`, 'sstim:scaleMaximum')
      }
      if (item.scale.minLabel !== undefined) {
        add(node, SSTIM('scaleMinimumLabel'), literal(item.scale.minLabel, XSD('string')))
        keep(`${base}/scale/minLabel`, 'sstim:scaleMinimumLabel')
      }
      if (item.scale.maxLabel !== undefined) {
        add(node, SSTIM('scaleMaximumLabel'), literal(item.scale.maxLabel, XSD('string')))
        keep(`${base}/scale/maxLabel`, 'sstim:scaleMaximumLabel')
      }
      drop(`${base}/scale/kind`,
        'Recoverable from which value property carries the answer — an ordinal value or a boolean one — so stating it again would be a second, desynchronisable source.')
    }

    if (item.prompt) {
      add(node, SSTIM('promptIdentifier'), literal(item.prompt.id, XSD('string')))
      keep(`${base}/prompt/id`, 'sstim:promptIdentifier')
      if (item.prompt.text !== undefined) {
        add(node, SSTIM('promptText'), literal(item.prompt.text, XSD('string')))
        keep(`${base}/prompt/text`, 'sstim:promptText')
      }
    }

    if (item.confidence !== undefined && item.confidence !== null) {
      add(node, SSTIM('reportedConfidence'), dec(item.confidence))
      keep(`${base}/confidence`, 'sstim:reportedConfidence')
    } else if (item.confidence === null) {
      drop(`${base}/confidence`, 'Explicit null; no confidence was collected.')
    }
  }

  function projectUnwantedExperiences(report, base, reportNode) {
    const block = report.unwantedExperiences
    const node = BSCLAB_SESSION(`${report.id}-item-unwanted-experience-report`)

    // The asking is itself an observation. That is what keeps "asked, none
    // reported" distinct from "never asked" and from "declined" — an empty
    // list of experiences expresses none of those three.
    add(node, a, SSTIM('ParticipantObservation'))
    add(node, SSTIM('hasObservationRole'), SSTIM_V('roleUnwantedExperienceReport'))
    add(node, SSTIM('hasResponseState'), declaredConcept(RESPONSE_STATE_CONCEPTS, block.responseState, 'response state'))
    add(reportNode, SSTIM('hasObservation'), node)
    keep(`${base}/responseState`, 'sstim:hasResponseState')

    for (const [index, record] of (block.records ?? []).entries()) {
      projectExperience(record, `${base}/records/${index}`, node)
    }
    if (block.records && block.records.length === 0) {
      drop(`${base}/records`, 'Empty list; the response state carries why.')
    }
  }

  function projectExperience(record, base, blockNode) {
    const category = EXPERIENCE_CATEGORY_CONCEPTS[record.category]
    if (!category) {
      dropTree(base, record, `No declared sstim:UnwantedExperienceCategory concept for "${record.category}".`)
      return
    }

    const node = BSCLAB_SESSION(record.id)
    add(node, a, SSTIM('UnwantedExperienceObservation'))
    add(node, SSTIM('hasExperienceCategory'), SSTIM_V(category))
    add(node, SSTIM('hasReportedSeverity'), declaredConcept(SEVERITY_CONCEPTS, record.participantReportedSeverity, 'reported severity'))
    add(node, SSTIM('hasOnsetPhase'), declaredConcept(ONSET_PHASE_CONCEPTS, record.onsetPhase, 'onset phase'))
    add(node, SSTIM('hasPerceivedRelatedness'), declaredConcept(RELATEDNESS_CONCEPTS, record.participantPerceivedRelatedness, 'perceived relatedness'))
    add(blockNode, SSTIM('reportsUnwantedExperience'), node)
    keep(`${base}/id`, 'IRI identity')
    keep(`${base}/category`, 'sstim:hasExperienceCategory')
    keep(`${base}/participantReportedSeverity`, 'sstim:hasReportedSeverity')
    keep(`${base}/onsetPhase`, 'sstim:hasOnsetPhase')
    keep(`${base}/participantPerceivedRelatedness`, 'sstim:hasPerceivedRelatedness')

    const optional = [
      ['persistence', PERSISTENCE_CONCEPTS, 'hasPersistence'],
      ['actionTaken', ACTION_CONCEPTS, 'hasResponseAction'],
      ['resolution', RESOLUTION_CONCEPTS, 'hasResolutionState'],
    ]
    for (const [field, concepts, property] of optional) {
      if (record[field] === undefined) continue
      const concept = concepts[record[field]]
      if (concept) {
        add(node, SSTIM(property), SSTIM_V(concept))
        keep(`${base}/${field}`, `sstim:${property}`)
      } else {
        drop(`${base}/${field}`, `No declared concept for "${record[field]}".`)
      }
    }

    if (record.onsetOffsetSeconds !== undefined) {
      add(node, SSTIM('onsetOffsetSeconds'), dec(record.onsetOffsetSeconds))
      keep(`${base}/onsetOffsetSeconds`, 'sstim:onsetOffsetSeconds')
    }
    if (record.durationSeconds !== undefined) {
      add(node, SSTIM('experienceDurationSeconds'), dec(record.durationSeconds))
      keep(`${base}/durationSeconds`, 'sstim:experienceDurationSeconds')
    }
    if (record.text !== undefined) {
      drop(`${base}/text`,
        'Free text is withheld by default: it can carry identifying information, and an unwanted-experience description is the most likely place for it.')
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
 * Every identifier in a bundle names one thing.
 *
 * RDF has no notion of a duplicate subject: two records sharing an id do not
 * collide, they *merge*, and the graph then describes one node holding both
 * records' facts. Nothing downstream can tell that apart from a single record
 * that genuinely had two collection times — SHACL would report a maxCount
 * violation on a node that looks well-formed, pointing nowhere near the cause.
 *
 * The ids are derivable from the instance id
 * (`sessionIds`), which makes a collision easy to produce by accident: two
 * during-session reports both derive `…-report-during-session`. Catching it here
 * turns a confusing downstream violation into a direct statement of what is
 * wrong.
 */
export function assertDistinctIds(bundle) {
  const seen = new Map()
  const claim = (id, what) => {
    if (id === undefined) return
    if (seen.has(id)) {
      throw new Error(
        `Duplicate identifier "${id}" (${seen.get(id)} and ${what}). ` +
        'Two records sharing an id merge into one RDF node instead of colliding.',
      )
    }
    seen.set(id, what)
  }

  claim(bundle.specification?.id, 'the specification')
  claim(bundle.instance?.id, 'the instance')
  for (const [index, event] of (bundle.events ?? []).entries()) claim(event.id, `events[${index}]`)
  for (const [index, report] of (bundle.reports ?? []).entries()) {
    claim(report.id, `reports[${index}]`)
    for (const [i, item] of (report.items ?? []).entries()) claim(item.id, `reports[${index}].items[${i}]`)
    for (const [i, record] of (report.unwantedExperiences?.records ?? []).entries()) {
      claim(record.id, `reports[${index}].unwantedExperiences.records[${i}]`)
    }
  }
  return true
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
