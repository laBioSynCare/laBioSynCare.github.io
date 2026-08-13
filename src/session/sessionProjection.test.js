import { describe, expect, it } from 'vitest'
import { Parser, Store } from 'n3'
import { CONCEPT_TABLES, projectSession, sessionToTurtle } from './sessionProjection.js'
import { SESSION_SCHEMA, canonicalJson, leafPointers } from './sessionContract.js'
import { GOLDEN_SESSIONS } from './fixtures/goldenSessions.js'

const SSTIM = 'https://w3id.org/sstim#'
const SSTIM_V = 'https://w3id.org/sstim/vocab#'
const PROV = 'http://www.w3.org/ns/prov#'
const cases = Object.entries(GOLDEN_SESSIONS)

const helpful = GOLDEN_SESSIONS['helpful, no unwanted experience']
const during = GOLDEN_SESSIONS['during-session report, multiple experiences']
const declined = GOLDEN_SESSIONS['abandoned, everything declined or not asked']

function objects(store, subject, predicate) {
  return store.getQuads(subject, predicate, null, null).map((q) => q.object)
}

describe('loss accounting', () => {
  // The property that makes the report usable as a work order rather than a
  // gesture: nothing in the bundle is unaccounted for.
  it.each(cases)('every field of "%s" is projected or withheld', (_name, bundle) => {
    const { report } = projectSession(bundle)
    const classified = new Set([
      ...report.projected.map((p) => p.pointer),
      ...report.withheld.map((w) => w.pointer),
    ])
    for (const pointer of leafPointers(bundle)) {
      expect(classified, pointer).toContain(pointer)
    }
  })

  it.each(cases)('classifies each field of "%s" exactly once', (_name, bundle) => {
    const { report } = projectSession(bundle)
    const all = [...report.projected.map((p) => p.pointer), ...report.withheld.map((w) => w.pointer)]
    expect(all.length).toBe(new Set(all).size)
  })

  it('fails loudly when a field is added and the projection forgets it', () => {
    const bundle = structuredClone(helpful)
    bundle.specification.environment.newlyAddedField = 'x'
    // dropTree walks the environment object, so this one is picked up; the guard
    // is proved instead by an unclassifiable location.
    expect(() => projectSession(bundle)).not.toThrow()

    const orphan = structuredClone(helpful)
    orphan.instance.somethingUnmapped = 'x'
    expect(() => projectSession(orphan)).toThrow(/did not account for/)
  })

  it('names the term each remaining gap would need', () => {
    const { report } = projectSession(helpful)
    for (const term of report.requiredTerms) expect(term).toBeTruthy()
  })

  it('projects the great majority of the record, now that the terms exist', () => {
    // Before ADR 0048 this ratio was inverted: the event timeline, every
    // qualified observation and every unwanted experience were withheld.
    const { report } = projectSession(helpful)
    expect(report.projected.length).toBeGreaterThan(report.withheld.length)
  })
})

describe('what the graph carries', () => {
  it('states the specification, the execution, and the source configuration', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const spec = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-spec'
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful'

    expect(objects(store, spec, `${SSTIM}durationSeconds`)[0].value).toBe('600')
    expect(objects(store, spec, `${SSTIM}masterVolume`)[0].value).toBe('0.2')
    expect(objects(store, inst, `${SSTIM}usesSpecification`)[0].value).toBe(spec)
    expect(objects(store, inst, `${SSTIM}completionStatus`)[0].value).toBe('completed')
    expect(objects(store, inst, `${PROV}startedAtTime`)[0].value).toBe('2026-08-13T09:01:00Z')

    // The source is typed and labelled so the graph validates standalone.
    const preset = objects(store, spec, `${SSTIM}referencesPreset`)[0].value
    expect(preset).toBe('https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed')
    expect(store.getQuads(preset, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', `${SSTIM}Preset`, null))
      .toHaveLength(1)
  })

  it('narrows elapsed time to the integer the shape requires, and says so', () => {
    const bundle = structuredClone(helpful)
    bundle.instance.actualDurationSeconds = 602.75
    const { quads, report } = projectSession(bundle)
    const store = new Store(quads)
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful'

    expect(objects(store, inst, `${SSTIM}actualDurationSeconds`)[0].value).toBe('603')
    expect(report.projected.find((p) => p.pointer === '/instance/actualDurationSeconds').property)
      .toMatch(/rounded up to xsd:integer/)
  })

  it('projects the five legacy scalars alongside the report', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const post = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post'

    expect(objects(store, post, `${SSTIM}primaryAffect`)[0].value).toBe('4')
    expect(objects(store, post, `${SSTIM}subjectiveQuality`)[0].value).toBe('4')
    expect(objects(store, post, `${SSTIM}goalAchieved`)[0].value).toBe('true')
    expect(objects(store, post, `${SSTIM}hasReportPhase`)[0].value).toBe(`${SSTIM_V}reportImmediatePost`)
  })
})

describe('the execution timeline (ADR 0048)', () => {
  it('projects every event, typed and placed on the engine clock', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful'

    const events = objects(store, inst, `${SSTIM}hasSessionEvent`)
    expect(events).toHaveLength(helpful.events.length)

    const first = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-event-0000'
    expect(objects(store, first, `${SSTIM}hasEventType`)[0].value).toBe(`${SSTIM_V}eventSessionOpen`)
    expect(objects(store, first, `${SSTIM}eventOffsetSeconds`)[0].value).toBe('0')
  })

  it('keeps ordering in the offsets, not in statement order', () => {
    // An RDF graph is a set. A consumer reading the timeline off statement
    // order would get a different answer each time, so the offset is the only
    // ordering authority — and every event must carry one.
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful'

    for (const event of objects(store, inst, `${SSTIM}hasSessionEvent`)) {
      expect(objects(store, event.value, `${SSTIM}eventOffsetSeconds`)).toHaveLength(1)
    }
  })

  it('projects the clock origin, its authority, and delivered time', () => {
    const bundle = GOLDEN_SESSIONS['unhelpful, interrupted, one experience, follow-up']
    const { quads } = projectSession(bundle)
    const store = new Store(quads)
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-interrupted'

    expect(objects(store, inst, `${SSTIM}clockOriginSeconds`)[0].value).toBe('3.25')
    expect(objects(store, inst, `${SSTIM}hasTimingAuthority`)[0].value).toBe(`${SSTIM_V}timingAudioHardwareClock`)
    // 400 s elapsed, 340 s delivered: the pause is visible in the graph.
    expect(objects(store, inst, `${SSTIM}actualDurationSeconds`)[0].value).toBe('400')
    expect(objects(store, inst, `${SSTIM}deliveredDurationSeconds`)[0].value).toBe('340')
  })

  it('projects the configuration digest with the algorithm that made it', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const spec = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-spec'

    expect(objects(store, spec, `${SSTIM}configurationDigest`)[0].value)
      .toBe(helpful.specification.source.contentHash)
    expect(objects(store, spec, `${SSTIM}digestAlgorithm`)[0].value).toBe('sha256-canonical-json')
    expect(objects(store, spec, `${SSTIM}hasReproducibilityLevel`)[0].value)
      .toBe(`${SSTIM_V}reproEquivalentPresentation`)
  })
})

describe('qualified observations (ADR 0048)', () => {
  it('projects a during-session report under its own phase', () => {
    const { quads } = projectSession(during)
    const store = new Store(quads)
    const iri = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-multiple-report-during-session'

    expect(objects(store, iri, `${SSTIM}hasReportPhase`)[0].value).toBe(`${SSTIM_V}reportDuringSession`)
  })

  it('projects perceived helpfulness with its scale and prompt', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const item = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post-item-perceived-helpfulness'

    expect(objects(store, item, `${SSTIM}hasObservationRole`)[0].value).toBe(`${SSTIM_V}rolePerceivedHelpfulness`)
    expect(objects(store, item, `${SSTIM}observedOrdinalValue`)[0].value).toBe('4')
    expect(objects(store, item, `${SSTIM}scaleMinimum`)[0].value).toBe('1')
    expect(objects(store, item, `${SSTIM}scaleMaximum`)[0].value).toBe('5')
    expect(objects(store, item, `${SSTIM}scaleMaximumLabel`)[0].value).toBe('a great deal')
    expect(objects(store, item, `${SSTIM}promptIdentifier`)[0].value).toBe('helpfulness')
  })

  it('states why an answer is absent instead of omitting the triple', () => {
    const { quads } = projectSession(declined)
    const store = new Store(quads)
    const base = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-abandoned-report-immediate-post'

    const states = {
      'item-primary-affect': 'responseDeclined',
      'item-focus': 'responseNotAsked',
      'item-subjective-quality': 'responseNotApplicable',
    }
    for (const [suffix, concept] of Object.entries(states)) {
      expect(objects(store, `${base}-${suffix}`, `${SSTIM}hasResponseState`)[0].value)
        .toBe(`${SSTIM_V}${concept}`)
    }

    // …and no value anywhere on those observations, which the SHACL-SPARQL
    // constraint also enforces.
    for (const suffix of Object.keys(states)) {
      expect(objects(store, `${base}-${suffix}`, `${SSTIM}observedOrdinalValue`)).toHaveLength(0)
    }
  })

  it('distinguishes "none reported" from "not asked" on unwanted experiences', () => {
    const store = new Store(projectSession(helpful).quads)
    const pre = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-pre-session-item-unwanted-experience-report'
    const post = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post-item-unwanted-experience-report'

    expect(objects(store, pre, `${SSTIM}hasResponseState`)[0].value).toBe(`${SSTIM_V}responseNotAsked`)
    expect(objects(store, post, `${SSTIM}hasResponseState`)[0].value).toBe(`${SSTIM_V}responseNoneReported`)
  })

  it('projects each unwanted experience with everything that qualifies it', () => {
    const bundle = GOLDEN_SESSIONS['unhelpful, interrupted, one experience, follow-up']
    const store = new Store(projectSession(bundle).quads)
    const ue = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-interrupted-report-immediate-post-ue-00'

    expect(objects(store, ue, `${SSTIM}hasExperienceCategory`)[0].value).toBe(`${SSTIM_V}experienceEyeStrain`)
    expect(objects(store, ue, `${SSTIM}hasReportedSeverity`)[0].value).toBe(`${SSTIM_V}severityMild`)
    expect(objects(store, ue, `${SSTIM}hasOnsetPhase`)[0].value).toBe(`${SSTIM_V}onsetDuringSession`)
    expect(objects(store, ue, `${SSTIM}onsetOffsetSeconds`)[0].value).toBe('180')
    expect(objects(store, ue, `${SSTIM}hasResponseAction`)[0].value).toBe(`${SSTIM_V}actionPausedSession`)
    expect(objects(store, ue, `${SSTIM}hasPerceivedRelatedness`)[0].value)
      .toBe(`${SSTIM_V}relatednessPossiblyRelated`)
  })

  it('keeps the five legacy scalars alongside the observations', () => {
    // Additive, not a replacement: an existing consumer reading primaryAffect
    // keeps working, and the observation beside it carries what it cannot.
    const store = new Store(projectSession(helpful).quads)
    const post = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post'

    expect(objects(store, post, `${SSTIM}primaryAffect`)[0].value).toBe('4')
    expect(objects(store, post, `${SSTIM}goalAchieved`)[0].value).toBe('true')
    expect(objects(store, post, `${SSTIM}hasObservation`).length).toBeGreaterThan(5)
  })

  it('records the instrument version answers are not comparable across', () => {
    const store = new Store(projectSession(helpful).quads)
    const instrument = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post-instrument'

    expect(objects(store, instrument, `${SSTIM}instrumentVersion`)[0].value).toBe('1.0.0')
  })
})

describe('what the graph still refuses to carry', () => {
  it('withholds free text by default, even though the term exists', () => {
    const { quads, report } = projectSession(helpful)
    const withheld = report.withheld.find((w) => w.pointer === '/reports/0/statedGoal/text')
    expect(withheld.reason).toMatch(/identifying information/)
    expect(quads.some((q) => q.predicate.value === `${SSTIM}observedTextValue`)).toBe(false)
  })

  it('carries free text only when the caller asks for it', () => {
    const { quads } = projectSession(helpful, { includeFreeText: true })
    const store = new Store(quads)
    const goal = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-pre-session-item-stated-goal'
    expect(objects(store, goal, `${SSTIM}observedTextValue`)[0].value)
      .toBe('Settle before a long stretch of writing.')
  })

  it('withholds event detail, naming what it would need', () => {
    const bundle = GOLDEN_SESSIONS['during-session report, multiple experiences']
    const { report } = projectSession(bundle)
    const detail = report.withheld.filter((w) => w.pointer.includes('/detail/'))
    expect(detail.length).toBeGreaterThan(0)
    expect(detail[0].requiredTerm).toMatch(/event-detail properties/)
  })

  it('withholds the privacy profile in full, by design', () => {
    const { report } = projectSession(helpful)
    const privacy = report.withheld.filter((w) => w.pointer.startsWith('/privacy'))
    expect(privacy.length).toBe(leafPointers(helpful.privacy, '/privacy').length)
    expect(privacy[0].reason).toMatch(/access-controlled/)
  })

  it('withholds the reproduction chain, including the route SESSION_MODEL.md invented', () => {
    const { report } = projectSession(helpful)
    const route = report.withheld.find((w) => w.pointer === '/specification/environment/outputRoute')
    expect(route.reason).toMatch(/headphoneMode/)
  })

  it('withholds an explicit null override, which projects as an absence', () => {
    const { report } = projectSession(helpful)
    const withheld = report.withheld.find((w) => w.pointer === '/specification/breathingPeriodInitial')
    expect(withheld.reason).toMatch(/indistinguishable/)
  })

  it('projects an override that was actually set', () => {
    const { report } = projectSession(GOLDEN_SESSIONS['unhelpful, interrupted, one experience, follow-up'])
    expect(report.projected.find((p) => p.pointer === '/specification/breathingPeriodInitial').property)
      .toBe('sstim:breathingPeriodInitial')
  })

  it('never mints an IRI for a track it cannot resolve', () => {
    const interrupted = GOLDEN_SESSIONS['unhelpful, interrupted, one experience, follow-up']
    const { quads, report } = projectSession(interrupted)
    expect(quads.some((q) => q.predicate.value === `${SSTIM}disablesTrack`)).toBe(false)
    expect(report.withheld.some((w) => w.pointer === '/specification/disabledTracks/0')).toBe(true)

    // With a resolver that knows the configuration's own IRIs, it projects.
    const resolved = projectSession(interrupted, {
      trackIri: (id) => `https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed#${id}`,
    })
    expect(resolved.quads.some((q) => q.predicate.value === `${SSTIM}disablesTrack`)).toBe(true)
  })
})

describe('drift between the schema and the vocabulary', () => {
  // Both directions. A value the schema gained and the projection never learned
  // would otherwise surface at runtime, on whichever recording first used it.
  it.each(Object.entries(CONCEPT_TABLES))('%s maps every enum value', (path, table) => {
    const node = path.split('/').reduce((acc, key) => acc[key], SESSION_SCHEMA)
    expect(node.enum, path).toBeDefined()
    for (const value of node.enum) {
      expect(Object.keys(table), `${path} → ${value}`).toContain(value)
    }
  })

  it('maps nothing the schema does not declare', () => {
    for (const [path, table] of Object.entries(CONCEPT_TABLES)) {
      const node = path.split('/').reduce((acc, key) => acc[key], SESSION_SCHEMA)
      for (const value of Object.keys(table)) {
        expect(node.enum, `${path} → ${value}`).toContain(value)
      }
    }
  })
})

describe('numeric fidelity', () => {
  it('rounds elapsed time up, so it never falls below delivered time', () => {
    // Rounding to nearest put a 602.4 s session that delivered all of it at 602
    // elapsed and 602.4 delivered, breaking the delivered ≤ elapsed constraint
    // on data that was entirely correct. Nothing caught it: the vitest SHACL
    // harness strips sh:sparql. `make shacl-session-projection` does now.
    const bundle = structuredClone(helpful)
    bundle.instance.actualDurationSeconds = 602.4
    bundle.instance.deliveredSeconds = 602.4

    const store = new Store(projectSession(bundle).quads)
    const inst = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful'
    const elapsed = Number(objects(store, inst, `${SSTIM}actualDurationSeconds`)[0].value)
    const delivered = Number(objects(store, inst, `${SSTIM}deliveredDurationSeconds`)[0].value)

    expect(elapsed).toBe(603)
    expect(delivered).toBeLessThanOrEqual(elapsed)
  })

  it('withholds a non-integer answer rather than rounding it', () => {
    // sstim:observedOrdinalValue is xsd:integer. Rounding 4.5 to 4 would record
    // an answer the participant did not give.
    const bundle = structuredClone(helpful)
    bundle.reports[1].items[0].value = 4.5

    const { quads, report } = projectSession(bundle)
    const store = new Store(quads)
    const item = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post-item-primary-affect'

    expect(store.getQuads(item, null, null, null)).toHaveLength(0)
    const withheld = report.withheld.find((w) => /non-integer answer/.test(w.reason))
    expect(withheld.requiredTerm).toMatch(/continuous observation value/)

    // …and the legacy scalar is not emitted either, so the two cannot disagree.
    const post = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post'
    expect(objects(store, post, `${SSTIM}primaryAffect`)).toHaveLength(0)
  })

  it('places an event wall clock on a property an Activity may carry', () => {
    // prov:atTime has domain prov:InstantaneousEvent; sstim:SessionEvent is a
    // prov:Activity. No local check polices external predicates, so the wrong
    // one would have typed every event as something it is not.
    const bundle = structuredClone(helpful)
    bundle.events[0].wallClock = '2026-08-13T09:01:00Z'

    const store = new Store(projectSession(bundle).quads)
    const event = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-event-0000'
    expect(objects(store, event, 'http://www.w3.org/ns/prov#startedAtTime')[0].value)
      .toBe('2026-08-13T09:01:00Z')
    expect(objects(store, event, 'http://www.w3.org/ns/prov#atTime')).toHaveLength(0)
  })
})

describe('refusals', () => {
  it('refuses a bundle whose records share an identifier', () => {
    // RDF has no duplicate subjects: two records sharing an id merge into one
    // node holding both records' facts, and nothing downstream can tell that
    // apart from a single record that genuinely had two of everything. Two
    // during-session reports are the easy way to produce it, since ids are
    // derived from the phase.
    const bundle = structuredClone(during)
    bundle.reports.push(structuredClone(bundle.reports[0]))
    expect(() => projectSession(bundle)).toThrow(/Duplicate identifier/)
  })

  it('refuses duplicate ids nested inside a report', () => {
    const bundle = structuredClone(helpful)
    bundle.reports[1].items[1].id = bundle.reports[1].items[0].id
    expect(() => projectSession(bundle)).toThrow(/Duplicate identifier/)
  })

  it('refuses to mint an IRI for a value the vocabulary does not declare', () => {
    // The schema makes this impossible, but projectSession does not validate its
    // input, so rule 1 has to hold on its own rather than by trusting a check
    // that may not have run.
    const bundle = structuredClone(helpful)
    bundle.reports[1].items[0].responseState = 'sort-of'
    expect(() => projectSession(bundle)).toThrow(/refusing to mint one/)
  })

  it('refuses a withdrawn bundle outright', () => {
    const bundle = structuredClone(helpful)
    bundle.privacy.withdrawn = true
    expect(() => projectSession(bundle)).toThrow(/withdrawn/)
  })

  it('refuses an open instance', () => {
    const bundle = structuredClone(helpful)
    bundle.instance.completionStatus = 'in-progress'
    expect(() => projectSession(bundle)).toThrow(/in-progress/)
  })

  it('refuses a foreign model tag', () => {
    expect(() => projectSession({ ...helpful, model: 'something-else' })).toThrow(/Unsupported/)
  })
})

describe('round trip', () => {
  it.each(cases)('"%s" survives canonical JSON with ids, order and hashes intact', (_name, bundle) => {
    const back = JSON.parse(canonicalJson(bundle))
    expect(back.specification.source.contentHash).toBe(bundle.specification.source.contentHash)
    expect(back.events.map((e) => e.id)).toEqual(bundle.events.map((e) => e.id))
    expect(back.events.map((e) => e.offsetSeconds)).toEqual(bundle.events.map((e) => e.offsetSeconds))
    expect(canonicalJson(back)).toBe(canonicalJson(bundle))
  })

  it.each(cases)('"%s" survives Turtle with datatypes and values intact', async (_name, bundle) => {
    const { quads } = projectSession(bundle)
    const turtle = await sessionToTurtle(quads)
    const reparsed = new Parser().parse(turtle)

    expect(reparsed).toHaveLength(quads.length)

    const key = (q) => `${q.subject.value} ${q.predicate.value} ${q.object.value} ${q.object.datatypeString ?? ''}`
    expect(reparsed.map(key).sort()).toEqual(quads.map(key).sort())
  })

  it('keeps the engine-clock timeline strictly ordered', () => {
    for (const bundle of Object.values(GOLDEN_SESSIONS)) {
      const offsets = bundle.events.map((e) => e.offsetSeconds)
      expect([...offsets].sort((x, y) => x - y)).toEqual(offsets)
    }
  })
})
