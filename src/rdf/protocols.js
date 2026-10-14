import { MESH, NCBITAXON, DCT, RDF, RDFS, SKOS, SSTIM, SSTIM_EX } from './namespaces.js'

// Published protocols (ADR 0064): sensory stimulation protocols accountable to
// the paper that specifies them, read into one plain object each for the
// comparison page.
//
// The store is walked directly rather than queried. Each protocol nests four
// levels deep (protocol, exposure profile, channel, magnitude or rendering),
// most links are optional, and Comunica drops a whole row when an OPTIONAL's
// FILTER rejects it (GB-10); a walk keeps every protocol whatever it lacks.

const TAXON_NAMES = new Map([
  [NCBITAXON('10090').value, 'Mouse'],
  [NCBITAXON('9606').value, 'Human'],
])

export function localName(iri) {
  return String(iri ?? '').split(/[#/]/).pop()
}

// Literals equal in value but not in language or datatype are different terms:
// "visual"@en and "visual"@pt must both survive, or the English one can be lost.
function termKey(term) {
  return term.termType === 'Literal'
    ? `Literal:${term.value}@${term.language}^^${term.datatype?.value ?? ''}`
    : `${term.termType}:${term.value}`
}

function unique(terms) {
  const seen = new Map()
  for (const term of terms) if (!seen.has(termKey(term))) seen.set(termKey(term), term)
  return [...seen.values()]
}

function objects(store, subject, predicate) {
  return subject ? unique(store.getObjects(subject, predicate, null)) : []
}

function first(store, subject, predicate) {
  return objects(store, subject, predicate)[0]
}

function text(store, subject, predicate) {
  return first(store, subject, predicate)?.value ?? ''
}

function number(store, subject, predicate) {
  const term = first(store, subject, predicate)
  if (!term) return null
  const value = Number(term.value)
  return Number.isFinite(value) ? value : null
}

function englishLiteral(store, subject, predicate) {
  const literals = objects(store, subject, predicate).filter(term => term.termType === 'Literal')
  return (literals.find(term => term.language === 'en') ?? literals.find(term => !term.language))?.value ?? ''
}

/** The English preferred label, or rdfs:label, or the local name. */
export function labelOf(store, term) {
  if (!term) return ''
  return englishLiteral(store, term, SKOS('prefLabel'))
    || englishLiteral(store, term, RDFS('label'))
    || localName(term.value)
}

function labels(store, subject, predicate) {
  return objects(store, subject, predicate).map(term => labelOf(store, term))
}

function hasType(store, subject, type) {
  return store.countQuads(subject, RDF('type'), type, null) > 0
}

const byNumericLabel = (a, b) => a.label.localeCompare(b.label, 'en', { numeric: true })

// A unit's symbol where it has a short one (dB, lx, µV), its name otherwise.
function unitSymbol(store, unit) {
  if (!unit) return ''
  const symbol = objects(store, unit, SKOS('altLabel'))
    .filter(term => term.termType === 'Literal' && term.value.length <= 6)
    .map(term => term.value)[0]
  return symbol || labelOf(store, unit).toLocaleLowerCase()
}

function magnitudeDetail(store, magnitude) {
  const stage = first(store, magnitude, SSTIM('deliveryStage'))
  const basis = first(store, magnitude, SSTIM('valueBasis'))
  return {
    iri: magnitude.value,
    quantity: labelOf(store, first(store, magnitude, SSTIM('magnitudeQuantity'))),
    unit: unitSymbol(store, first(store, magnitude, SSTIM('magnitudeUnit'))),
    value: number(store, magnitude, SSTIM('magnitudeValue')),
    minimum: number(store, magnitude, SSTIM('magnitudeMinimum')),
    maximum: number(store, magnitude, SSTIM('magnitudeMaximum')),
    stage: labelOf(store, stage),
    stageId: localName(stage?.value),
    basis: labelOf(store, basis),
    basisId: localName(basis?.value),
    relativeTo: labelOf(store, first(store, magnitude, SSTIM('relativeToParticipantMeasure'))),
    distanceMetres: number(store, magnitude, SSTIM('measurementDistanceMetres')),
    reportedAs: text(store, magnitude, SSTIM('reportedAs')),
  }
}

function signalDetail(store, signal) {
  if (!signal) return null
  return {
    iri: signal.value,
    label: labelOf(store, signal),
    hzMin: number(store, signal, SSTIM('hzMin')),
    hzMax: number(store, signal, SSTIM('hzMax')),
    shape: labelOf(store, first(store, signal, SSTIM('hasSignalShape'))),
  }
}

function channelDetail(store, channel) {
  const role = first(store, channel, SSTIM_EX('channelRole'))
  const distribution = first(store, channel, SSTIM_EX('hasOnsetIntervalDistribution'))
  return {
    iri: channel.value,
    label: labelOf(store, channel),
    role: labelOf(store, role),
    roleId: localName(role?.value),
    modalities: labels(store, channel, SSTIM_EX('perceivedModality')),
    media: labels(store, channel, SSTIM_EX('deliveryMedium')),
    placements: labels(store, channel, SSTIM_EX('hasBodyPlacement')),
    flickerHz: number(store, channel, SSTIM_EX('hasFlickerRateHz')),
    modulationHz: number(store, channel, SSTIM_EX('hasModulationFrequencyHz')),
    carrierHz: number(store, channel, SSTIM_EX('hasCarrierFrequencyHz')),
    dutyCycle: number(store, channel, SSTIM_EX('hasDutyCycle')),
    initialPhase: number(store, channel, SSTIM_EX('hasInitialPhase')),
    durationSeconds: number(store, channel, SSTIM('channelDurationSeconds')),
    interval: distribution ? {
      distribution: labelOf(store, distribution),
      meanSeconds: number(store, channel, SSTIM_EX('meanOnsetIntervalSeconds')),
      minSeconds: number(store, channel, SSTIM_EX('minOnsetIntervalSeconds')),
      maxSeconds: number(store, channel, SSTIM_EX('maxOnsetIntervalSeconds')),
    } : null,
    geometry: {
      viewingDistanceMetres: number(store, channel, SSTIM_EX('viewingDistanceMetres')),
      widthMetres: number(store, channel, SSTIM_EX('sourceWidthMetres')),
      heightMetres: number(store, channel, SSTIM_EX('sourceHeightMetres')),
      refreshHz: number(store, channel, SSTIM_EX('displayRefreshRateHz')),
      visualAngleDegrees: number(store, channel, SSTIM_EX('visualAngleDegrees')),
    },
    magnitudes: objects(store, channel, SSTIM('hasMagnitude')).map(term => magnitudeDetail(store, term)),
    renderings: objects(store, channel, SSTIM('hasSignalRendering')).map(rendering => ({
      signal: signalDetail(store, first(store, rendering, SSTIM('rendersSignal'))),
      mechanism: labelOf(store, first(store, rendering, SSTIM('hasRenderingMechanism'))),
      presence: labelOf(store, first(store, rendering, SSTIM('hasRenderingPresence'))),
      parameter: labelOf(store, first(store, rendering, SSTIM('rendersOntoParameter'))),
      carrierHz: number(store, rendering, SSTIM('renderingCarrierHz')),
    })),
  }
}

function controlLawDetail(store, law) {
  return {
    iri: law.value,
    inputs: labels(store, law, SSTIM('controlInputSignal')),
    oscillation: labelOf(store, first(store, law, SSTIM('trackedOscillation'))),
    phase: labelOf(store, first(store, law, SSTIM('targetOscillationPhase'))),
    thresholdValue: number(store, law, SSTIM('detectionThresholdValue')),
    thresholdUnit: unitSymbol(store, first(store, law, SSTIM('detectionThresholdUnit'))),
    triggerDelaySeconds: number(store, law, SSTIM('triggerDelaySeconds')),
    stimuliPerTrigger: number(store, law, SSTIM('stimuliPerTrigger')),
    refractorySeconds: number(store, law, SSTIM('refractoryPeriodSeconds')),
  }
}

function scheduleDetail(store, schedule) {
  if (!schedule) return null
  const courseUnit = first(store, schedule, SSTIM('courseDurationUnit'))
  return {
    sessionSeconds: number(store, schedule, SSTIM('sessionDurationSeconds')),
    sessionsPerDay: number(store, schedule, SSTIM('sessionsPerDay')),
    sessionCount: number(store, schedule, SSTIM('sessionCount')),
    courseValue: number(store, schedule, SSTIM('courseDurationValue')),
    courseUnit: labelOf(store, courseUnit).toLocaleLowerCase(),
    trialsPerBlock: number(store, schedule, SSTIM('trialsPerBlock')),
    blocksPerSession: number(store, schedule, SSTIM('blocksPerSession')),
    segments: objects(store, schedule, SSTIM('hasScheduleSegment'))
      .map(segment => ({
        order: number(store, segment, SSTIM('segmentOrder')),
        durationSeconds: number(store, segment, SSTIM('segmentDurationSeconds')),
        role: labelOf(store, first(store, segment, SSTIM('segmentRole'))),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }
}

function referenceDetail(store, protocol) {
  const reference = objects(store, protocol, DCT('source'))
    .find(term => hasType(store, term, SSTIM('BibliographicReference')))
  if (!reference) return null
  const key = text(store, reference, SSTIM('referenceKey'))
  const year = text(store, reference, DCT('issued')).slice(0, 4)
  const creators = objects(store, reference, DCT('creator')).length
  const surname = key.split('_').slice(0, -1).join(' ').toLocaleLowerCase()
    .replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase())
  const doiUrl = objects(store, reference, DCT('source'))
    .map(term => term.value)
    .find(value => value.startsWith('https://doi.org/')) ?? ''
  return {
    iri: reference.value,
    key,
    title: text(store, reference, DCT('title')),
    year,
    citation: [surname, creators > 2 ? 'et al.' : '', year].filter(Boolean).join(' '),
    doiUrl,
  }
}

function populationDetail(store, population) {
  if (!population) return null
  return {
    iri: population.value,
    label: labelOf(store, population),
    description: englishLiteral(store, population, DCT('description')),
    taxa: objects(store, population, SSTIM('populationTaxon'))
      .map(term => TAXON_NAMES.get(term.value) ?? localName(term.value)),
    conditions: objects(store, population, SSTIM('populationCondition'))
      .map(term => term.value.startsWith(MESH('').value) ? `MeSH ${localName(term.value)}` : localName(term.value)),
  }
}

/**
 * Every sensory stimulation protocol that cites a bibliographic record, in
 * publication order: the published protocols of ADR 0064. A protocol that
 * names only a framework, as BSC Lab's own reference protocols do, is not one.
 *
 * @param {import('n3').Store} store
 * @returns {Array<object>}
 */
export function listPublishedProtocols(store) {
  const protocols = store.getSubjects(RDF('type'), SSTIM('SensoryStimulationProtocol'), null)
  const rows = []
  for (const protocol of unique(protocols)) {
    const reference = referenceDetail(store, protocol)
    if (!reference) continue

    const arms = objects(store, protocol, SSTIM('hasStudyArm')).map(arm => {
      const role = first(store, arm, SSTIM('armRole'))
      const stimuli = objects(store, arm, SSTIM('armStimulus'))
      return {
        iri: arm.value,
        label: labelOf(store, arm),
        role: labelOf(store, role),
        roleId: localName(role?.value),
        stimuli,
      }
    })
    const schedule = first(store, protocol, SSTIM('hasSchedule'))
    const stimuli = unique([
      ...arms.flatMap(arm => arm.stimuli),
      ...objects(store, schedule, SSTIM('hasScheduleSegment'))
        .flatMap(segment => objects(store, segment, SSTIM('segmentStimulus'))),
    ])
    const controlLaws = stimuli
      .flatMap(stimulus => objects(store, stimulus, SSTIM('hasControlLaw')))
      .map(law => controlLawDetail(store, law))

    const profiles = objects(store, protocol, SSTIM_EX('hasExposureProfile')).map(profile => ({
      iri: profile.value,
      label: labelOf(store, profile),
      channels: objects(store, profile, SSTIM_EX('usesStimulusChannel'))
        .map(channel => channelDetail(store, channel))
        .sort(byNumericLabel),
    }))

    const note = englishLiteral(store, protocol, SKOS('editorialNote'))
    rows.push({
      iri: protocol.value,
      id: localName(protocol.value),
      label: labelOf(store, protocol),
      description: englishLiteral(store, protocol, DCT('description')),
      editorialNote: note,
      encodedFrom: /abstract only/i.test(note) ? 'abstract' : 'full text',
      sensoryRouteNeuromodulation: hasType(store, protocol, SSTIM('SensoryRouteNeuromodulationProtocol')),
      reference,
      techniques: labels(store, protocol, SSTIM('usesTechnique')),
      techniqueModalities: [...new Set(
        objects(store, protocol, SSTIM('usesTechnique'))
          .flatMap(technique => labels(store, technique, SSTIM('techniqueModality'))),
      )],
      neuralPhenomena: labels(store, protocol, SSTIM('intendedNeuralPhenomenon')),
      neuralSystems: labels(store, protocol, SSTIM('intendedNeuralSystem')),
      neuralTargets: labels(store, protocol, SSTIM('intendedNeuralTargetSite')),
      engagement: labelOf(store, first(store, protocol, SSTIM('participantEngagementMode'))),
      design: labelOf(store, first(store, protocol, SSTIM('protocolStudyDesign'))),
      allocation: labelOf(store, first(store, protocol, SSTIM('armAllocation'))),
      population: populationDetail(store, first(store, protocol, SSTIM('hasStudyPopulation'))),
      schedule: scheduleDetail(store, schedule),
      arms: arms.map(({ stimuli: armStimuli, ...arm }) => ({ ...arm, presentsStimulus: armStimuli.length > 0 })),
      profiles,
      controlLaws,
    })
  }
  return rows.sort((a, b) =>
    a.reference.year.localeCompare(b.reference.year) || a.label.localeCompare(b.label))
}

// ── Summaries for the comparison table ──────────────────────────────────────

const trim = value => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))

/** "40 Hz", "8 to 15.8 Hz", or "1.5, 4, 16 and 24 Hz". */
export function formatRates(values) {
  const distinct = [...new Set(values.filter(value => value !== null))].sort((a, b) => a - b)
  if (!distinct.length) return ''
  if (distinct.length === 1) return `${trim(distinct[0])} Hz`
  if (distinct.length > 4) return `${trim(distinct[0])} to ${trim(distinct.at(-1))} Hz`
  return `${distinct.slice(0, -1).map(trim).join(', ')} and ${trim(distinct.at(-1))} Hz`
}

/** "40 Hz", "10 kHz": one frequency, in kilohertz from 1000 Hz up. */
export function formatFrequency(hz) {
  if (hz === null) return ''
  return hz >= 1000 ? `${trim(hz / 1000)} kHz` : `${trim(hz)} Hz`
}

/** The rates a protocol's intervention channels present, from signals first. */
export function protocolRates(protocol) {
  const channels = protocol.profiles.flatMap(profile => profile.channels)
    .filter(channel => channel.roleId !== 'roleControlOrSham')
  const fromSignals = channels.flatMap(channel => channel.renderings)
    .flatMap(rendering => rendering.signal ? [rendering.signal.hzMin, rendering.signal.hzMax] : [])
  if (fromSignals.some(value => value !== null)) return formatRates(fromSignals)
  return formatRates(channels.flatMap(channel => [channel.flickerHz, channel.modulationHz]))
}

/** The senses a protocol addresses: its channels', or its techniques' when it has none. */
export function protocolSenses(protocol) {
  const channels = protocol.profiles.flatMap(profile => profile.channels)
    .filter(channel => channel.roleId !== 'roleControlOrSham')
  const named = channels.flatMap(channel => channel.modalities)
  // Exposure modalities are labelled in lower case and vocabulary ones in title
  // case, so one sense must not appear twice for its capital letter.
  const capitalised = (named.length ? named : protocol.techniqueModalities)
    .map(label => label.charAt(0).toLocaleUpperCase() + label.slice(1))
  return [...new Set(capitalised)]
}

/** "60 dB", "390 to 400 lx": the number and unit a magnitude states. */
export function formatMagnitude(magnitude) {
  let amount = ''
  if (magnitude.value !== null) amount = trim(magnitude.value)
  else if (magnitude.minimum !== null && magnitude.maximum !== null) {
    amount = `${trim(magnitude.minimum)} to ${trim(magnitude.maximum)}`
  }
  return amount ? `${amount} ${magnitude.unit}`.trim() : ''
}

/** The magnitudes stated on a protocol's intervention channels. */
export function protocolLevels(protocol) {
  return protocol.profiles.flatMap(profile => profile.channels)
    .filter(channel => channel.roleId !== 'roleControlOrSham')
    .flatMap(channel => channel.magnitudes)
}

const DURATION_UNITS = [[3600, 'h'], [60, 'min'], [1, 's']]

export function formatSeconds(seconds) {
  if (seconds === null) return ''
  for (const [size, unit] of DURATION_UNITS) {
    if (seconds >= size && seconds % size === 0) return `${seconds / size} ${unit}`
  }
  return `${trim(seconds)} s`
}

/** "1 h a day for 7 days", "3 sessions of 30 min", "6 blocks of 40 trials". */
export function formatSchedule(schedule) {
  if (!schedule) return ''
  const parts = []
  if (schedule.sessionSeconds !== null) {
    const session = formatSeconds(schedule.sessionSeconds)
    parts.push(schedule.sessionsPerDay === 1 ? `${session} a day` : schedule.sessionCount ? `${schedule.sessionCount} sessions of ${session}` : `${session} sessions`)
  } else if (schedule.sessionCount !== null) {
    parts.push(`${schedule.sessionCount} sessions`)
  }
  if (schedule.courseValue !== null) {
    const unit = schedule.courseValue === 1 ? schedule.courseUnit : `${schedule.courseUnit}s`
    parts.push(`for ${trim(schedule.courseValue)} ${unit}`)
  } else if (schedule.sessionsPerDay === 1 && schedule.sessionCount !== null) {
    parts.push(`on ${schedule.sessionCount} days`)
  }
  if (schedule.blocksPerSession !== null && schedule.trialsPerBlock !== null) {
    parts.push(`${schedule.blocksPerSession} blocks of ${schedule.trialsPerBlock} trials`)
  }
  return parts.join(' ')
}
