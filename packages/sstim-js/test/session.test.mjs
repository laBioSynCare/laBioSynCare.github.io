import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { Parser, Writer } from 'n3'

import { Session, SstimError, validate } from '../src/index.js'
import { CONTROLLED } from '../src/session.js'
import { assrBlock } from '../../../examples/tools/jspsych-assr.js'

// Offline, like the rest of this suite: validation resolves the frozen 0.18.0
// manifest in this repository.
const ROOT = new URL('../../../', import.meta.url)
const MANIFEST = new URL('static/ontology/0.18.0/manifest.json', ROOT).pathname
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')
const START = '2026-09-17T09:00:00Z'

function fixtureSession () {
  const spec = JSON.parse(read('packages/fixtures/session-parity.json'))
  const session = new Session(spec.base, spec.session)
  const signals = spec.signals.map(s => session.signal(s))
  for (const { label, signal, ...rest } of spec.channels) session.channel(label, { ...rest, signal: signals[signal] })
  for (const { kind, ...rest } of spec.events) session.event(kind, rest)
  session.close(spec.close)
  return session
}

const minimal = (overrides = {}) => new Session('https://example.org/lab/test/', {
  label: 't', duration: 60, masterVolume: 0, timing: 'monotonic-substitute', clock: 10, startedAt: START, ...overrides
})

function withChannel (session, overrides = {}) {
  const signal = session.signal({ hz: 10, shape: 'square' })
  session.channel('disc', {
    modality: 'visual', medium: 'visual-light', placement: 'eyes', signal,
    parameter: 'luminance', mechanism: 'direct-presentation', ...overrides
  })
  return session
}

const ntriples = (quads) =>
  new Writer({ format: 'N-Triples' }).quadsToString(quads).split('\n').filter(Boolean).sort().join('\n') + '\n'

describe('the session builder', () => {
  it('emits exactly the triples of the golden file shared with the Python client', () => {
    expect(ntriples(fixtureSession().quads())).toBe(read('packages/fixtures/session-parity.nt'))
  })

  it('validates in Full, and says the SPARQL half was not evaluated here', async () => {
    // The Python suite validates this same graph with SPARQL active; the
    // parity test above is what lets that result stand for this client too.
    const report = await fixtureSession().validate({ manifest: MANIFEST })
    expect(report.ok, String(report)).toBe(true)
    expect(report.partial).toBe(true)
  })

  it('round-trips its Turtle to the same triples', () => {
    const session = fixtureSession()
    expect(ntriples(new Parser().parse(session.toTurtle()))).toBe(ntriples(session.quads()))
  })

  it('refuses, at the call, what the Full shapes would reject', () => {
    const cases = [
      [() => minimal({ duration: 30 }), '60 to 7200'],
      [() => minimal({ masterVolume: 1.5 }), '[0, 1]'],
      [() => minimal({ timing: 'wall-clock' }), 'is not one of'],
      [() => minimal({ startedAt: '2026-09-17T09:00:00' }), 'time zone'],
      [() => minimal({ digest: 'ab'.repeat(16) }), 'algorithm'],
      [() => new Session('https://w3id.org/sstim/mine/', { label: 't', duration: 60, masterVolume: 0, timing: 'audio-hardware', clock: 0 }), 'only SSTIM mints'],
      [() => minimal().signal({ hz: 10, shape: 'sampled' }), 'sampled from'],
      [() => withChannel(minimal(), { carrierHz: 200 }), 'no carrier'],
      [() => withChannel(minimal(), { medium: [] }), 'at least one medium'],
      [() => minimal().event('playback-pause', { at: 11 }), 'while playback is idle'],
      [() => minimal().event('session-open', { at: 11 }), 'not recorded by hand'],
      [() => minimal().event('parameter-changed', { at: 11, parameter: 'level' }), 'new value'],
      [() => minimal().event('playback-start', { at: 11, after: 0.5 }), 'belong to'],
      [() => minimal().event('playback-start', { at: 9 }), 'before the clock origin'],
      [() => minimal().quads(), 'close() the session first'],
      [() => minimal().close({ at: 80, completed: true, delivered: 90 }), 'cannot deliver more'],
      [() => minimal().close({ at: 80, completed: true, endedAt: START }), 'later than']
    ]
    for (const [build, fragment] of cases) {
      expect(build, fragment).toThrow(SstimError)
      expect(build, fragment).toThrow(fragment)
    }
  })

  it('rounds elapsed time up from the written offset, not the float', () => {
    // 72.1 - 12.1 is 60.00000000000001 in binary floating point.
    const session = minimal({ clock: 12.1 })
    session.close({ at: 72.1, completed: true, endedAt: '2026-09-17T09:02:00Z' })
    const elapsed = session.quads().find(q => q.predicate.value.endsWith('#actualDurationSeconds'))
    expect(elapsed.object.value).toBe('60')
  })
})

describe('the vocabulary table', () => {
  // The builder resolves notations from a table rather than a network call;
  // this keeps it honest against the frozen release, both ways.
  const frozen = ['sstim-vocab.ttl', 'sstim-stimulus.ttl', 'sstim-exposure.ttl']
    .flatMap(m => new Parser().parse(read(`static/ontology/0.18.0/${m}`)))
  const TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  const NOTATION = 'http://www.w3.org/2004/02/skos/core#notation'
  const CLASSES = {
    timing: 'https://w3id.org/sstim#TimingAuthority',
    reproducibility: 'https://w3id.org/sstim#ReproducibilityLevel',
    event: 'https://w3id.org/sstim#SessionEventType',
    change: 'https://w3id.org/sstim#StimulationParameterKind',
    shape: 'https://w3id.org/sstim#SignalShape',
    parameter: 'https://w3id.org/sstim#RenderableParameter',
    mechanism: 'https://w3id.org/sstim#RenderingMechanism',
    modality: 'https://w3id.org/sstim#SensoryModality',
    perceived: 'https://w3id.org/sstim/exposure#PerceivedModality',
    medium: 'https://w3id.org/sstim/exposure#PhysicalDeliveryMedium',
    placement: 'https://w3id.org/sstim/exposure#BodyPlacement'
  }

  it('maps every published notation of each class, and nothing else', () => {
    for (const [category, cls] of Object.entries(CLASSES)) {
      const concepts = frozen.filter(q => q.predicate.value === TYPE && q.object.value === cls).map(q => q.subject.value)
      const published = Object.fromEntries(concepts.map(c => [
        frozen.find(q => q.subject.value === c && q.predicate.value === NOTATION).object.value,
        c.split('#')[1]
      ]))
      expect(CONTROLLED[category], category).toEqual(published)
    }
  })
})

describe('the jsPsych example', () => {
  function fakeJsPsych () {
    const ctx = {
      currentTime: 3.25,
      destination: {},
      resume () {},
      createOscillator: () => ({ frequency: {}, connect: (n) => n, start () {}, stop () {} }),
      createGain: () => ({ gain: {}, connect: (n) => n })
    }
    return { ctx, jsPsych: { pluginAPI: { audioContext: () => ctx } } }
  }

  afterEach(() => { vi.useRealTimers() })

  for (const [response, advance, status] of [[null, 60, 'completed'], ['Escape', 30, 'interrupted']]) {
    it(`records the block as ${status}, on the audio clock`, async () => {
      // Wall-clock time only dates the record, but it has to move: a block
      // that starts and ends in the same millisecond is refused.
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-17T09:00:00Z'))
      const { ctx, jsPsych } = fakeJsPsych()
      const block = assrBlock(jsPsych, 'html-keyboard-response')
      block.trial.on_start()
      ctx.currentTime += advance
      vi.setSystemTime(new Date(Date.parse('2026-09-17T09:00:00Z') + advance * 1000))
      block.trial.on_finish({ response })
      const turtle = block.turtle()
      expect(turtle).toContain(`sstim:completionStatus "${status}"`)
      expect(turtle).toContain('sstim-v:timingAudioHardwareClock')
      const report = await validate(turtle, { profile: 'full', manifest: MANIFEST })
      expect(report.ok, String(report)).toBe(true)
    })
  }
})
