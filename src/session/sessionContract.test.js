import { describe, expect, it } from 'vitest'
import { createSessionValidator } from './sessionValidator.js'
import {
  COMMITTABLE_CLASSIFICATIONS,
  EVENT_TYPES,
  OBSERVATION_ROLES,
  RESPONSE_STATES,
  SESSION_SCHEMA,
  canonicalJson,
  contentHash,
  deriveCompletionStatus,
  leafPointers,
  sessionIds,
} from './sessionContract.js'
import { GOLDEN_SESSIONS } from './fixtures/goldenSessions.js'

// The native contract, checked against itself. KR-02 existed because three
// documents described the session differently and nothing executed any of them.

describe('session schema', () => {
  const validate = createSessionValidator()

  it.each(Object.entries(GOLDEN_SESSIONS))('golden case "%s" validates', (_name, bundle) => {
    const ok = validate(bundle)
    expect(validate.errors ?? []).toEqual([])
    expect(ok).toBe(true)
  })

  it('rejects a supplied response with no value', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    delete bundle.reports[0].items[0].value
    expect(validate(bundle)).toBe(false)
  })

  it('rejects a value carried under a non-supplied response state', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['abandoned, everything declined or not asked'])
    bundle.reports[0].items[0].value = 4
    expect(validate(bundle)).toBe(false)
  })

  it('rejects unwanted-experience records under "none-reported"', () => {
    // The distinction the block exists to protect: "none reported" and "here is
    // one" cannot both be true.
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    bundle.reports[1].unwantedExperiences.records = [{
      id: 'x-ue-00',
      category: 'other',
      participantReportedSeverity: 'mild',
      onsetPhase: 'unknown',
      participantPerceivedRelatedness: 'unknown',
    }]
    expect(validate(bundle)).toBe(false)
  })

  it('rejects "supplied" unwanted experiences with an empty record list', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    bundle.reports[1].unwantedExperiences = { responseState: 'supplied', records: [] }
    expect(validate(bundle)).toBe(false)
  })

  it('requires a closed instance to say when it ended and how much ran', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    delete bundle.instance.endedAt
    expect(validate(bundle)).toBe(false)
  })

  it('lets an in-progress instance omit them', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    bundle.instance.completionStatus = 'in-progress'
    delete bundle.instance.endedAt
    delete bundle.instance.actualDurationSeconds
    delete bundle.instance.deliveredSeconds
    expect(validate(bundle)).toBe(true)
  })

  it('holds the duration bounds sstim-sh:SessionSpecShape holds', () => {
    // The KR-02 repair: where the shape is stricter, the schema adopts it, so a
    // bundle cannot be valid JSON and an invalid graph at the same time.
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    bundle.specification.durationSeconds = 30
    expect(validate(bundle)).toBe(false)
    bundle.specification.durationSeconds = 9000
    expect(validate(bundle)).toBe(false)
  })

  it('refuses unknown fields anywhere', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    bundle.instance.headphoneMode = 'headphones'
    expect(validate(bundle)).toBe(false)
  })

  it('names an instrument version and language on every report', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    delete bundle.reports[0].instrument.version
    expect(validate(bundle)).toBe(false)
  })

  it('places a during-session report on the engine clock, and only that one', () => {
    // Only a during-session report happens on the session clock. Requiring the
    // offset there, and refusing it elsewhere, keeps a fabricated placement out
    // of reports that were collected before or after the session ran.
    const bundle = structuredClone(GOLDEN_SESSIONS['during-session report, multiple experiences'])
    delete bundle.reports[0].collectedAtOffsetSeconds
    expect(validate(bundle)).toBe(false)

    const post = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    post.reports[1].collectedAtOffsetSeconds = 300
    expect(validate(post)).toBe(false)
  })

  it('requires a privacy profile', () => {
    const bundle = structuredClone(GOLDEN_SESSIONS['helpful, no unwanted experience'])
    delete bundle.privacy
    expect(validate(bundle)).toBe(false)
  })
})

describe('controlled values', () => {
  it('carries the six response states that make absence legible', () => {
    expect(RESPONSE_STATES).toEqual(
      ['supplied', 'none-reported', 'not-asked', 'declined', 'unknown', 'not-applicable'],
    )
  })

  it('includes the perceived-helpfulness role KR-03 found missing', () => {
    expect(OBSERVATION_ROLES).toContain('perceived-helpfulness')
  })

  it('has no side-effect vocabulary in any field name or value', () => {
    // KR-03: a `sideEffect` predicate would assert a causal medical conclusion
    // that a participant report cannot establish. Descriptions are exempt —
    // the schema explains at length why it does not use the word.
    const names = []
    const collect = (node) => {
      if (Array.isArray(node)) return node.forEach(collect)
      if (!node || typeof node !== 'object') return
      for (const [key, value] of Object.entries(node)) {
        if (key === 'description' || key === 'title') continue
        if (key === 'properties' || key === '$defs') names.push(...Object.keys(value))
        if (key === 'enum') names.push(...value)
        collect(value)
      }
    }
    collect(SESSION_SCHEMA)

    expect(names.length).toBeGreaterThan(50)
    for (const name of names) {
      expect(String(name).toLowerCase()).not.toMatch(/side[-_ ]?effect|adverse/)
    }
  })

  it('covers the events a recorder can actually observe', () => {
    expect(EVENT_TYPES).toContain('playback-pause')
    expect(EVENT_TYPES).toContain('playback-resume')
    expect(EVENT_TYPES).toContain('session-interrupt')
    expect(EVENT_TYPES).toContain('engine-fallback')
  })
})

describe('completion status', () => {
  it('calls a full run completed', () => {
    expect(deriveCompletionStatus(600, 600)).toBe('completed')
  })

  it('absorbs clock jitter at the end', () => {
    expect(deriveCompletionStatus(598, 600)).toBe('completed')
  })

  it('calls a stop past 30% interrupted', () => {
    expect(deriveCompletionStatus(400, 600)).toBe('interrupted')
  })

  it('calls a stop inside the first 30% abandoned', () => {
    expect(deriveCompletionStatus(90, 600)).toBe('abandoned')
    expect(deriveCompletionStatus(180, 600)).toBe('abandoned')
  })

  it('classifies on delivered time, so a long pause is not a short session', () => {
    // 600 s of stimulus with a 10-minute pause in the middle is a completed
    // session; charging the pause to playback would call it interrupted.
    expect(deriveCompletionStatus(600, 600)).toBe('completed')
    expect(deriveCompletionStatus(300, 600)).toBe('interrupted')
  })
})

describe('identifiers', () => {
  it('derives every part from the instance id', () => {
    const ids = sessionIds('synthetic-helpful')
    expect(ids.specification).toBe('synthetic-helpful-spec')
    expect(ids.event(3)).toBe('synthetic-helpful-event-0003')
    expect(ids.report('immediate-post')).toBe('synthetic-helpful-report-immediate-post')
    expect(ids.item(ids.report('immediate-post'), 'focus'))
      .toBe('synthetic-helpful-report-immediate-post-item-focus')
  })

  it('sorts events lexically in recording order', () => {
    const ids = sessionIds('s-one')
    const sorted = [ids.event(11), ids.event(2), ids.event(100)].sort()
    expect(sorted).toEqual([ids.event(2), ids.event(11), ids.event(100)])
  })

  it('rejects an id that would not survive being put in an IRI', () => {
    expect(() => sessionIds('Has Spaces')).toThrow(/stable lower-case identifier/)
    expect(() => sessionIds('../escape')).toThrow()
  })

  it('golden fixtures use derivable ids throughout', () => {
    for (const bundle of Object.values(GOLDEN_SESSIONS)) {
      const ids = sessionIds(bundle.instance.id)
      expect(bundle.specification.id).toBe(ids.specification)
      for (const [index, event] of bundle.events.entries()) {
        expect(event.id).toBe(ids.event(index))
      }
      for (const report of bundle.reports) {
        expect(report.id).toBe(ids.report(report.phase))
      }
    }
  })
})

describe('hashing and canonical form', () => {
  it('does not depend on key order', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }))
  })

  it('does depend on content', async () => {
    expect(await contentHash({ a: 1 })).not.toBe(await contentHash({ a: 2 }))
  })

  it('produces the sha256 hex the schema pattern expects', async () => {
    expect(await contentHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('leaf enumeration', () => {
  it('reaches every scalar as a JSON Pointer', () => {
    expect(leafPointers({ a: { b: 1 }, c: [2, 3] }).sort())
      .toEqual(['/a/b', '/c/0', '/c/1'])
  })

  it('treats an empty container as one leaf, so it is still accountable', () => {
    expect(leafPointers({ a: [], b: {} }).sort()).toEqual(['/a', '/b'])
  })

  it('escapes pointer syntax in keys', () => {
    expect(leafPointers({ 'a/b': 1 })).toEqual(['/a~1b'])
  })
})

describe('public-repository lint', () => {
  it('permits only machine-marked synthetic or public-safe bundles', () => {
    expect(COMMITTABLE_CLASSIFICATIONS).toEqual(['synthetic', 'public-safe'])
  })

  it('every committed golden fixture is synthetic', () => {
    for (const [name, bundle] of Object.entries(GOLDEN_SESSIONS)) {
      expect(bundle.privacy.classification, name).toBe('synthetic')
      expect(bundle.privacy.reportingRole, name).toBe('synthetic')
      expect(bundle.privacy.withdrawn, name).toBe(false)
    }
  })

  it('no fixture carries free text that could identify anyone', () => {
    for (const [name, bundle] of Object.entries(GOLDEN_SESSIONS)) {
      const texts = bundle.reports.flatMap((r) => [
        r.statedGoal?.text,
        ...(r.unwantedExperiences.records ?? []).map((u) => u.text),
      ]).filter(Boolean)
      // A stated goal is allowed; identifiers are not. The freeTextIncluded
      // flag must agree with what is actually there.
      expect(bundle.privacy.freeTextIncluded, name).toBe(false)
      for (const text of texts) expect(text, name).not.toMatch(/@|\+\d{6,}|https?:/)
    }
  })
})
