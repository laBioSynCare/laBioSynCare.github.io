import { describe, expect, it } from 'vitest'
import { Parser, Store } from 'n3'
import { projectSession, sessionToTurtle } from './sessionProjection.js'
import { canonicalJson, leafPointers } from './sessionContract.js'
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

  it('names the term each withheld field would need', () => {
    const { report } = projectSession(helpful)
    expect(report.requiredTerms.length).toBeGreaterThan(5)
    for (const term of report.requiredTerms) expect(term).toBeTruthy()
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
      .toMatch(/narrowed to xsd:integer/)
  })

  it('projects the five legacy scalars and nothing else from a report', () => {
    const { quads } = projectSession(helpful)
    const store = new Store(quads)
    const post = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-helpful-report-immediate-post'

    expect(objects(store, post, `${SSTIM}primaryAffect`)[0].value).toBe('4')
    expect(objects(store, post, `${SSTIM}subjectiveQuality`)[0].value).toBe('4')
    expect(objects(store, post, `${SSTIM}goalAchieved`)[0].value).toBe('true')
    expect(objects(store, post, `${SSTIM}hasReportPhase`)[0].value).toBe(`${SSTIM_V}reportImmediatePost`)
  })
})

describe('what the graph refuses to carry', () => {
  it('withholds the whole event timeline, naming the missing class', () => {
    const { report } = projectSession(helpful)
    const events = report.withheld.filter((w) => w.pointer.startsWith('/events/'))
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].requiredTerm).toMatch(/session-event class/)
  })

  it('withholds a during-session report entirely rather than mis-phasing it', () => {
    // SSTIM declares three phases and this is not one of them. Projecting it
    // under the nearest neighbour would silently move when the answer was given.
    const { quads, report } = projectSession(during)
    const store = new Store(quads)
    const iri = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-multiple-report-during-session'

    expect(store.getQuads(iri, null, null, null)).toHaveLength(0)
    const withheld = report.withheld.filter((w) => w.pointer.startsWith('/reports/0/'))
    expect(withheld[0].requiredTerm).toMatch(/during-session/)
  })

  it('withholds perceived helpfulness, the item KR-03 found missing', () => {
    const { report } = projectSession(helpful)
    const helpfulness = report.withheld.filter((w) => /Perceived helpfulness/.test(w.reason))
    // The whole item — value, scale, prompt, response state — with the term it needs.
    expect(helpfulness.length).toBeGreaterThan(3)
    expect(helpfulness[0].requiredTerm).toMatch(/perceived-helpfulness observation/)
  })

  it('withholds a report whose every answer was declined or not asked', () => {
    // Four items, no supplied scalar: SelfReportShape requires at least one
    // value, so emitting the node would produce a graph that fails its own
    // contract. The record still exists in the bundle.
    const { quads, report } = projectSession(declined)
    const store = new Store(quads)
    const iri = 'https://w3id.org/sstim/implementation/bsclab/session/synthetic-abandoned-report-immediate-post'

    expect(store.getQuads(iri, null, null, null)).toHaveLength(0)
    expect(report.withheld.some((w) => w.reason.includes('at least one report value'))).toBe(true)
  })

  it('withholds the response state, because RDF can only omit the triple', () => {
    const { report } = projectSession(during)
    const notAsked = report.withheld.find(
      (w) => w.pointer === '/reports/1/items/1/responseState',
    )
    expect(notAsked.reason).toMatch(/collapses/)
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

describe('refusals', () => {
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
