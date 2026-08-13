import { describe, expect, it, vi } from 'vitest'
import { openSession } from './sessionRecorder.js'
import { createSessionValidator } from './sessionValidator.js'

// A stand-in for engine.getAudioContext(): the only thing the recorder is
// allowed to read time from. Advancing it by hand is what makes these tests
// deterministic — and is also the point, since a recorder that secretly used a
// wall clock would keep working here and produce a timeline that drifts against
// the audio hardware in production.
function fakeTimingContext(start = 0) {
  return {
    currentTime: start,
    advance(seconds) { this.currentTime += seconds },
  }
}

const PRIVACY = {
  classification: 'synthetic',
  reportingRole: 'synthetic',
  consentBasis: 'none-required-synthetic',
  policyVersion: '1.0.0',
  visibility: 'public',
  deidentification: 'none',
  withdrawn: false,
  freeTextIncluded: false,
}

function specification(id = 'rec-test-spec') {
  return {
    id,
    label: 'Recorder test specification',
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
  }
}

function open(clock, overrides = {}) {
  return openSession({
    specification: specification(),
    timingContext: clock,
    instanceId: 'rec-test',
    startedAt: '2026-08-13T09:01:00Z',
    ...overrides,
  })
}

describe('the clock', () => {
  it('measures offsets from the engine clock, not from zero', () => {
    // An AudioContext that has been alive for a while starts at a non-zero
    // currentTime. Offsets are relative to the origin captured at open.
    const clock = fakeTimingContext(931.25)
    const recorder = open(clock)
    expect(recorder.clockOriginSeconds).toBe(931.25)

    clock.advance(10)
    expect(recorder.offsetSeconds).toBe(10)
  })

  it('refuses to open without a timing context', () => {
    expect(() => openSession({
      specification: specification(),
      instanceId: 'rec-test',
      startedAt: '2026-08-13T09:01:00Z',
    })).toThrow(/only clock/)
  })

  it('does not read a wall clock to order events', () => {
    const clock = fakeTimingContext()
    const dateNow = vi.spyOn(Date, 'now')
    const performanceNow = vi.spyOn(performance, 'now')

    const recorder = open(clock)
    clock.advance(5)
    recorder.mark('playback-start')
    clock.advance(5)
    recorder.close({ endedAt: '2026-08-13T09:11:00Z', status: 'completed', privacy: PRIVACY })

    expect(dateNow).not.toHaveBeenCalled()
    expect(performanceNow).not.toHaveBeenCalled()
    dateNow.mockRestore()
    performanceNow.mockRestore()
  })

  it('records session-open first, at offset zero', () => {
    const recorder = open(fakeTimingContext(400))
    expect(recorder.events[0]).toMatchObject({ type: 'session-open', offsetSeconds: 0 })
  })

  it('never emits a negative offset if the clock stalls', () => {
    const clock = fakeTimingContext(10)
    const recorder = open(clock)
    clock.currentTime = 9.999 // a suspended context can report slightly backwards
    expect(recorder.offsetSeconds).toBe(0)
  })
})

describe('pause accounting', () => {
  it('separates elapsed time from delivered time', () => {
    const clock = fakeTimingContext()
    const recorder = open(clock)

    clock.advance(100)
    recorder.pause()
    clock.advance(60) // paused
    recorder.resume()
    clock.advance(500)

    const bundle = recorder.close({ endedAt: '2026-08-13T09:12:00Z', privacy: PRIVACY })
    expect(bundle.instance.actualDurationSeconds).toBe(660)
    expect(bundle.instance.deliveredSeconds).toBe(600)
    // 600 s delivered against a 600 s intention: completed, despite the session
    // occupying 11 minutes of wall time.
    expect(bundle.instance.completionStatus).toBe('completed')
  })

  it('ignores a second pause and a resume that follows nothing', () => {
    const clock = fakeTimingContext()
    const recorder = open(clock)
    expect(recorder.resume()).toBeNull()
    recorder.pause()
    expect(recorder.pause()).toBeNull()
  })

  it('settles an open pause without inventing a resume', () => {
    // Closing while paused must account for the interval and nothing more. An
    // earlier version emitted a `playback-resume` so the pause had a partner,
    // which put an event that never happened into a record of what did.
    const clock = fakeTimingContext()
    const recorder = open(clock)
    clock.advance(200)
    recorder.pause()
    clock.advance(100)

    const bundle = recorder.close({ endedAt: '2026-08-13T09:06:00Z', privacy: PRIVACY })
    expect(bundle.instance.actualDurationSeconds).toBe(300)
    expect(bundle.instance.deliveredSeconds).toBe(200)
    expect(bundle.events.map((e) => e.type)).toEqual([
      'session-open', 'playback-pause', 'session-interrupt',
    ])
  })

  it('closes at the duration it records, not a moment later', () => {
    // mark() reads the clock, so re-reading it for the closing event put that
    // event a few microseconds past the duration close() had just computed —
    // a timeline running beyond its own session.
    const clock = fakeTimingContext()
    const recorder = open(clock)
    clock.advance(600)

    const bundle = recorder.close({ endedAt: '2026-08-13T09:11:00Z', privacy: PRIVACY })
    for (const event of bundle.events) {
      expect(event.offsetSeconds).toBeLessThanOrEqual(bundle.instance.actualDurationSeconds)
    }
    expect(bundle.events.at(-1).offsetSeconds).toBe(bundle.instance.actualDurationSeconds)
  })
})

describe('the record', () => {
  it('derives a valid bundle straight from the recorder', () => {
    const validate = createSessionValidator()
    const clock = fakeTimingContext()
    const recorder = open(clock, { deliveryModalities: ['auditory'] })

    recorder.mark('playback-start')
    clock.advance(600)
    const bundle = recorder.close({ endedAt: '2026-08-13T09:11:00Z', privacy: PRIVACY })

    expect(validate(bundle)).toBe(true)
    expect(validate.errors ?? []).toEqual([])
  })

  it('is append-only once closed', () => {
    const recorder = open(fakeTimingContext())
    recorder.close({ endedAt: '2026-08-13T09:11:00Z', privacy: PRIVACY })

    expect(() => recorder.mark('playback-stop')).toThrow(/closed/)
    expect(() => recorder.close({ endedAt: 'x', privacy: PRIVACY })).toThrow(/closed/)
  })

  it('requires a privacy profile to close', () => {
    const recorder = open(fakeTimingContext())
    expect(() => recorder.close({ endedAt: '2026-08-13T09:11:00Z' }))
      .toThrow(/privacy profile/)
  })

  it('rejects a specification id that is not derivable from the instance id', () => {
    expect(() => openSession({
      specification: specification('some-other-spec'),
      timingContext: fakeTimingContext(),
      instanceId: 'rec-test',
      startedAt: '2026-08-13T09:01:00Z',
    })).toThrow(/rec-test-spec/)
  })

  it('classifies a short stop as abandoned', () => {
    const clock = fakeTimingContext()
    const recorder = open(clock)
    clock.advance(60)
    const bundle = recorder.close({ endedAt: '2026-08-13T09:02:00Z', privacy: PRIVACY })
    expect(bundle.instance.completionStatus).toBe('abandoned')
    expect(bundle.events.at(-1).type).toBe('session-interrupt')
  })

  it('honours a forced status over the arithmetic', () => {
    const clock = fakeTimingContext()
    const recorder = open(clock)
    clock.advance(600)
    const bundle = recorder.close({
      endedAt: '2026-08-13T09:11:00Z',
      status: 'interrupted',
      privacy: PRIVACY,
    })
    expect(bundle.instance.completionStatus).toBe('interrupted')
  })
})

describe('reports', () => {
  const report = (phase) => ({
    id: `rec-test-report-${phase}`,
    phase,
    collectedAt: '2026-08-13T09:12:00Z',
    instrument: { id: 'bsc-lab-core-report', version: '1.0.0', language: 'en' },
    items: [{
      id: `rec-test-report-${phase}-item-primary-affect`,
      role: 'primary-affect',
      responseState: 'supplied',
      value: 4,
    }],
    unwantedExperiences: { responseState: 'none-reported' },
  })

  it('places a during-session report on the engine clock', () => {
    const clock = fakeTimingContext()
    const recorder = open(clock)
    clock.advance(300)

    const attached = recorder.attachReport(report('during-session'))
    expect(attached.collectedAtOffsetSeconds).toBe(300)
  })

  it('leaves a post-session report on the wall clock alone', () => {
    const recorder = open(fakeTimingContext())
    const attached = recorder.attachReport(report('immediate-post'))
    expect(attached.collectedAtOffsetSeconds).toBeUndefined()
  })

  it('marks the collection on the timeline', () => {
    const recorder = open(fakeTimingContext())
    recorder.attachReport(report('immediate-post'))
    expect(recorder.events.at(-1)).toMatchObject({
      type: 'report-collected',
      detail: { reportId: 'rec-test-report-immediate-post' },
    })
  })
})
