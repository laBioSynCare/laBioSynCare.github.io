import { readdirSync, readFileSync } from 'node:fs'
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

// Every protocol file, BSC Lab's own two included: they name a framework and
// cite no paper, so they must not be listed as published.
const PROTOCOL_FILES = readdirSync(new URL('../../static/ontology/instances/protocols/', import.meta.url))
  .filter(name => name.endsWith('.ttl'))

beforeAll(async () => {
  const store = mergeStores(
    ...await Promise.all(PROTOCOL_FILES.map(name =>
      parseFixture(`../../static/ontology/instances/protocols/${name}`, PROTOCOL_GRAPH))),
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
    expect(PROTOCOL_FILES).toContain('auditory-observation-reference.ttl')
    expect(protocols.some(protocol => protocol.id === 'auditory-observation-reference')).toBe(false)
    for (const protocol of protocols) {
      expect(protocol.reference.doiUrl).toMatch(/^https:\/\/doi\.org\/10\./)
    }
  })

  it('encodes every published protocol from its full text', () => {
    expect(protocols.filter(protocol => protocol.encodedFrom === 'abstract')).toEqual([])
  })

  it('states levels relative to the subject where the paper set them so', () => {
    const galambos = protocolLevels(byId('galambos-1981-40hz-auditory-steady-state-response'))
    expect(galambos).toEqual([expect.objectContaining({
      quantity: 'Level above reference', minimum: 5, maximum: 50, unit: 'dB',
      stageId: 'stageSubjectRelative', relativeTo: 'Hearing threshold',
    })])

    const thaut = protocolLevels(byId('thaut-1996-rhythmic-auditory-stimulation-gait'))
    expect(thaut.map(formatMagnitude)).toEqual(['100 %', '105 to 110 %', '110 to 121 %'])
    for (const tempo of thaut) expect(tempo).toMatchObject({ stageId: 'stageSubjectRelative', relativeTo: 'Baseline cadence' })

    const lane = byId('lane-1998-binaural-beats-vigilance')
    expect(protocolLevels(lane)).toEqual([expect.objectContaining({ value: 0, relativeTo: 'Most comfortable level' })])
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
    expect(formatSchedule(byId('thaut-1996-rhythmic-auditory-stimulation-gait').schedule)).toBe('30 min a day for 3 weeks')
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

  it('reads each SSVEP target with its own sinusoid, phase and display', () => {
    const wang = byId('wang-2017-ssvep-40-target-speller')
    const targets = wang.profiles[0].channels
    expect(targets).toHaveLength(40)
    expect(targets[0].label).toMatch(/^Target 1:/)
    expect(targets.at(-1).label).toMatch(/^Target 40:/)
    expect(new Set(targets.map(target => target.initialPhase))).toEqual(new Set([0, 0.25, 0.5, 0.75]))
    expect(protocolRates(wang)).toBe('8 to 15.8 Hz')
    for (const target of targets) {
      expect(target.renderings).toHaveLength(1)
      expect(target.renderings[0].signal).toMatchObject({ hzMin: target.flickerHz, hzMax: target.flickerHz, shape: 'Sine' })
      expect(target.geometry).toMatchObject({ viewingDistanceMetres: 0.7, refreshHz: 60, visualAngleDegrees: 3.2 })
    }
  })

  it('compares binaural beats on their own carriers, with the training tape kept out of the arms', () => {
    const lane = byId('lane-1998-binaural-beats-vigilance')
    expect(lane.arms.map(arm => arm.roleId)).toEqual(['armExperimental', 'armActiveComparator'])
    const carriers = lane.profiles.flatMap(profile => profile.channels)
      .flatMap(channel => channel.renderings)
      .map(rendering => `${rendering.signal.hzMin} on ${rendering.carrierHz}`)
      .sort()
    expect(carriers).toEqual(['1.5 on 100', '16 on 200', '24 on 300', '4 on 200', '4 on 250'])
  })

  it('reads the random comparison timing and the closed-loop control law', () => {
    const tones = byId('martorell-2019-40hz-auditory-tone-train')
    const random = tones.profiles.flatMap(profile => profile.channels).find(channel => channel.interval)
    expect(random.interval).toMatchObject({ meanSeconds: 0.025 })
    expect(random.roleId).toBe('roleControlOrSham')

    const ngo = byId('ngo-2013-closed-loop-auditory-slow-oscillation')
    const laws = Object.fromEntries(ngo.controlLaws.map(law => [law.phase, law]))
    expect(Object.keys(laws).sort()).toEqual(['Down state', 'Up state'])
    expect(laws['Up state']).toMatchObject({
      oscillation: 'Slow oscillation', thresholdValue: -80, thresholdUnit: 'µV',
      triggerDelaySeconds: null, stimuliPerTrigger: 2, refractorySeconds: 2.5,
    })
    expect(laws['Down state']).toMatchObject({ triggerDelaySeconds: 0, stimuliPerTrigger: 2 })
    expect(ngo.arms.map(arm => arm.roleId)).toEqual(['armExperimental', 'armNoStimulation', 'armActiveComparator'])
    expect(protocolLevels(ngo)).toEqual([expect.objectContaining({ value: 55, unit: 'dB', stageId: 'stageUnstated' })])
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
