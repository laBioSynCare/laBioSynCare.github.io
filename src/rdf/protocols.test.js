import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { mergeStores, parseIntoStore } from './loader.js'
import {
  formatFrequency,
  formatMagnitude,
  formatRates,
  formatSchedule,
  listPublishedProtocols,
  protocolLevels,
  protocolRates,
  protocolSenses,
} from './protocols.js'

const PROTOCOL_GRAPH = 'https://w3id.org/sstim/implementation/bsclab/protocol/'
const REFERENCE_GRAPH = 'https://w3id.org/sstim/ref/'
const VOCAB_GRAPH = 'https://w3id.org/sstim/graph/vocab'
const EXPOSURE_GRAPH = 'https://w3id.org/sstim/graph/exposure'

async function parseFixture(relativePath, graphIri) {
  const turtle = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  return parseIntoStore(turtle, 'text/turtle', graphIri)
}

let protocols
const byId = id => protocols.find(protocol => protocol.id === id)

beforeAll(async () => {
  const store = mergeStores(
    await parseFixture('../../static/ontology/instances/protocols/published-protocols.ttl', PROTOCOL_GRAPH),
    // BSC Lab's own reference protocols name a framework and cite no paper:
    // they must not be listed as published.
    await parseFixture('../../static/ontology/instances/protocols/bsc-reference-protocols.ttl', PROTOCOL_GRAPH),
    await parseFixture('../../static/ontology/instances/references/references.ttl', REFERENCE_GRAPH),
    await parseFixture('../../static/ontology/sstim-vocab.ttl', VOCAB_GRAPH),
    await parseFixture('../../static/ontology/sstim-exposure.ttl', EXPOSURE_GRAPH),
  )
  protocols = listPublishedProtocols(store)
})

describe('listPublishedProtocols', () => {
  it('lists the nine published protocols in publication order, and no reference protocol', () => {
    expect(protocols.map(protocol => protocol.reference.citation)).toEqual([
      'Galambos et al. 1981',
      'Thaut et al. 1996',
      'Lane et al. 1998',
      'Ngo et al. 2013',
      'Iaccarino et al. 2016',
      'Wang et al. 2017',
      'Martorell et al. 2019',
      'Martorell et al. 2019',
      'Chan et al. 2022',
    ])
    expect(protocols.some(protocol => protocol.id === 'auditory-observation-reference')).toBe(false)
    for (const protocol of protocols) {
      expect(protocol.reference.doiUrl).toMatch(/^https:\/\/doi\.org\/10\./)
    }
  })

  it('marks the four abstract-level records as such', () => {
    expect(protocols.filter(protocol => protocol.encodedFrom === 'abstract').map(protocol => protocol.reference.citation))
      .toEqual(['Galambos et al. 1981', 'Thaut et al. 1996', 'Lane et al. 1998', 'Ngo et al. 2013'])
  })

  it('keeps a reported level at the stage its source gave, with the source\'s words', () => {
    const chan = byId('chan-2022-40hz-audiovisual-daily-home-use')
    const levels = protocolLevels(chan)
    const illuminance = levels.find(level => level.quantity === 'Illuminance')
    expect(illuminance).toMatchObject({ minimum: 390, maximum: 400, unit: 'lx', stageId: 'stageAtSubject', basisId: 'valueReported' })
    expect(illuminance.reportedAs).toContain('lux at the participant')
    const sound = levels.find(level => level.quantity === 'Sound pressure level')
    expect(sound).toMatchObject({ value: 68, unit: 'dB', stageId: 'stageUnstated' })
    expect(formatMagnitude(illuminance)).toBe('390 to 400 lx')
  })

  it('reads arms, design, population and schedule', () => {
    const chan = byId('chan-2022-40hz-audiovisual-daily-home-use')
    expect(chan.arms.map(arm => arm.roleId).sort()).toEqual(['armExperimental', 'armSham'])
    expect(chan.design).toBe('Randomized controlled trial')
    expect(chan.allocation).toBe('Between-subject')
    expect(chan.population).toMatchObject({ taxa: ['Human'], conditions: ['MeSH D000544'] })
    expect(formatSchedule(chan.schedule)).toBe('1 h a day for 6 months')

    const iaccarino = byId('iaccarino-2016-40hz-visual-flicker')
    expect(iaccarino.arms.find(arm => arm.roleId === 'armNoStimulation')).toMatchObject({ presentsStimulus: false })
    expect(iaccarino.population.taxa).toEqual(['Mouse'])
    expect(iaccarino.sensoryRouteNeuromodulation).toBe(true)
    expect(formatSchedule(iaccarino.schedule)).toBe('1 h a day for 7 days')

    expect(formatSchedule(byId('lane-1998-binaural-beats-vigilance').schedule)).toBe('30 min a day on 3 days')
    expect(formatSchedule(byId('thaut-1996-rhythmic-auditory-stimulation-gait').schedule)).toBe('for 3 weeks')
    expect(formatSchedule(byId('wang-2017-ssvep-40-target-speller').schedule)).toBe('6 blocks of 40 trials')
  })

  it('states one signal shared by light and sound in the combined protocols', () => {
    const combined = byId('martorell-2019-40hz-audiovisual')
    const channels = combined.profiles.flatMap(profile => profile.channels)
    const signals = new Set(channels.flatMap(channel => channel.renderings.map(rendering => rendering.signal.iri)))
    expect(channels).toHaveLength(2)
    expect(signals.size).toBe(1)
    expect(protocolSenses(combined).sort()).toEqual(['Auditory', 'Visual'])
    expect(protocolRates(combined)).toBe('40 Hz')
  })

  it('summarises the SSVEP targets from their channels, without a signal', () => {
    const wang = byId('wang-2017-ssvep-40-target-speller')
    const targets = wang.profiles[0].channels
    expect(targets).toHaveLength(40)
    expect(targets[0].label).toMatch(/^Target 1:/)
    expect(targets.at(-1).label).toMatch(/^Target 40:/)
    expect(new Set(targets.map(target => target.initialPhase))).toEqual(new Set([0, 0.25, 0.5, 0.75]))
    expect(protocolRates(wang)).toBe('8 to 15.8 Hz')
  })

  it('reads the random comparison timing and the closed-loop control law', () => {
    const tones = byId('martorell-2019-40hz-auditory-tone-train')
    const random = tones.profiles.flatMap(profile => profile.channels).find(channel => channel.interval)
    expect(random.interval).toMatchObject({ meanSeconds: 0.025 })
    expect(random.roleId).toBe('roleControlOrSham')

    const ngo = byId('ngo-2013-closed-loop-auditory-slow-oscillation')
    expect(ngo.controlLaws).toHaveLength(1)
    expect(ngo.controlLaws[0]).toMatchObject({ oscillation: 'Slow oscillation', phase: 'Up state' })
    expect(protocolSenses(ngo)).toEqual(['Auditory'])
  })
})

describe('formatFrequency', () => {
  it('reads a carrier in kilohertz', () => {
    expect(formatFrequency(10000)).toBe('10 kHz')
    expect(formatFrequency(40)).toBe('40 Hz')
    expect(formatFrequency(null)).toBe('')
  })
})

describe('formatRates', () => {
  it('names one rate, a few, or a range', () => {
    expect(formatRates([40, 40])).toBe('40 Hz')
    expect(formatRates([16, 24, 1.5, 4])).toBe('1.5, 4, 16 and 24 Hz')
    expect(formatRates([8, 8.2, 8.4, 8.6, 15.8])).toBe('8 to 15.8 Hz')
    expect(formatRates([null])).toBe('')
  })
})
