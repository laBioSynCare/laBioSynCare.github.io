// Write an SSTIM session record from what a tool already knows.
//
// Every exporter needs the same thing: take a stated clock, the stimulus that
// was delivered and the moments things happened, and produce a graph the Full
// profile accepts. None of that is specific to PsychoPy, jsPsych or Lab
// Streaming Layer, so it lives here once, and a tool adapter shrinks to reading
// its own clock (ADR 0058).
//
//     const session = new Session('https://example.org/lab/run-001/', {
//       label: '40 Hz auditory steady-state block', duration: 60,
//       masterVolume: 0.5, timing: 'audio-hardware', clock: ctx.currentTime
//     })
//     const tone = session.signal({ hz: 40, shape: 'sine' })
//     session.channel('Tone, headphones', {
//       modality: 'auditory', medium: 'air-conducted-sound', placement: 'ears',
//       signal: tone, parameter: 'amplitude', mechanism: 'amplitude-modulation',
//       carrierHz: 1000
//     })
//     session.event('playback-start', { at: ctx.currentTime })
//     session.close({ at: ctx.currentTime, completed: true })
//     const turtle = session.toTurtle()
//
// It is the same builder as the Python client's, call for call, and the two
// emit the same triples: both test suites compare their output with one shared
// golden file.
//
// It refuses at the call that breaks the model. That matters more here than in
// Python: this runtime cannot evaluate SHACL-SPARQL constraints, so every one
// of them that could apply to what this builder emits is enforced where the
// offending value is written, with the reason.
//
// It writes nothing about a participant: no identifier, no observation, no
// free text (ADR 0048).
//
// This module imports only n3, so it runs in a browser. validate() and write()
// load the validator on demand.

import { DataFactory, Store, Writer } from 'n3'

import { SstimError, TERM_NAMESPACE } from './resolve.js'

const { namedNode, literal } = DataFactory

const SSTIM = 'https://w3id.org/sstim#'
const SSTIM_V = 'https://w3id.org/sstim/vocab#'
const SSTIM_EX = 'https://w3id.org/sstim/exposure#'
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const XSD = 'http://www.w3.org/2001/XMLSchema#'
const PROV = 'http://www.w3.org/ns/prov#'
const DCT = 'http://purl.org/dc/terms/'

// notation -> local name, per category, identical to the Python client's table
// and checked against the frozen vocabulary by the test suite. The last three
// categories live in the exposure namespace, the rest in the vocabulary one.
export const CONTROLLED = {
  timing: {
    'audio-hardware': 'timingAudioHardwareClock',
    'monotonic-substitute': 'timingMonotonicSubstitute'
  },
  reproducibility: {
    'identical-rendering': 'reproIdenticalRendering',
    'equivalent-signal': 'reproEquivalentSignal',
    'equivalent-presentation': 'reproEquivalentPresentation'
  },
  event: {
    'session-open': 'eventSessionOpen',
    'playback-start': 'eventPlaybackStart',
    'playback-pause': 'eventPlaybackPause',
    'playback-resume': 'eventPlaybackResume',
    'playback-stop': 'eventPlaybackStop',
    'session-complete': 'eventSessionComplete',
    'session-interrupt': 'eventSessionInterrupt',
    'engine-fallback': 'eventEngineFallback',
    'safety-limit-applied': 'eventSafetyLimitApplied',
    'observation-collected': 'eventObservationCollected',
    'parameter-changed': 'eventParameterChanged'
  },
  change: {
    level: 'paramLevel',
    'carrier-frequency': 'paramCarrierFrequency',
    'modulation-frequency': 'paramModulationFrequency',
    'duty-cycle': 'paramDutyCycle',
    'phase-offset': 'paramPhaseOffset'
  },
  shape: {
    sine: 'shapeSine',
    square: 'shapeSquare',
    triangle: 'shapeTriangle',
    sawtooth: 'shapeSawtooth',
    noise: 'shapeNoise',
    envelope: 'shapeEnvelope',
    sampled: 'shapeSampled'
  },
  parameter: {
    amplitude: 'paramAmplitude',
    frequency: 'paramFrequency',
    luminance: 'paramLuminance',
    size: 'paramSize',
    'spatial-position': 'paramSpatialPosition',
    'vibration-intensity': 'paramVibrationIntensity'
  },
  mechanism: {
    'amplitude-modulation': 'mechanismAmplitudeModulation',
    'frequency-modulation': 'mechanismFrequencyModulation',
    'monaural-beat': 'mechanismMonauralBeat',
    'binaural-beat': 'mechanismBinauralBeat',
    'direct-presentation': 'mechanismDirectPresentation'
  },
  modality: {
    auditory: 'modalityAuditory',
    visual: 'modalityVisual',
    somatosensory: 'modalitySomatosensory',
    vestibular: 'modalityVestibular',
    olfactory: 'modalityOlfactory',
    interoceptive: 'modalityInteroceptive'
  },
  perceived: {
    auditory: 'modalityAuditory',
    visual: 'modalityVisual',
    tactile: 'modalityTactile',
    somatosensory: 'modalitySomatosensory',
    proprioceptive: 'modalityProprioceptive',
    vestibular: 'modalityVestibular',
    olfactory: 'modalityOlfactory',
    gustatory: 'modalityGustatory',
    interoceptive: 'modalityInteroceptive',
    'social-perceptual': 'modalitySocialPerceptual',
    multimodal: 'modalityMultimodal',
    'not-directly-perceived': 'modalityNotDirectlyPerceived'
  },
  medium: {
    'acoustic-energy': 'mediumAcousticEnergy',
    'air-conducted-sound': 'mediumAirConductedSound',
    'contact-acoustic-vibration': 'mediumContactAcousticVibration',
    'focused-ultrasound': 'mediumFocusedUltrasound',
    airflow: 'mediumAirflow',
    'applied-electric-current': 'mediumAppliedElectricCurrent',
    'applied-electric-field': 'mediumAppliedElectricField',
    'applied-magnetic-field': 'mediumAppliedMagneticField',
    'chemical-agent': 'mediumChemicalAgent',
    'gustatory-chemical-exposure': 'mediumGustatoryChemicalExposure',
    'olfactory-chemical-exposure': 'mediumOlfactoryChemicalExposure',
    'pharmacological-agent': 'mediumPharmacologicalAgent',
    'electromagnetic-field': 'mediumElectromagneticField',
    'electromagnetic-radiation': 'mediumElectromagneticRadiation',
    'infrared-radiation': 'mediumInfraredRadiation',
    'ultraviolet-radiation': 'mediumUltravioletRadiation',
    'visual-light': 'mediumVisualLight',
    'fluid-motion': 'mediumFluidMotion',
    'liquid-gel-immersion': 'mediumLiquidGelImmersion',
    'mechanical-force': 'mediumMechanicalForce',
    'mechanical-vibration': 'mediumMechanicalVibration',
    'respiratory-cue': 'mediumRespiratoryCue',
    'rigid-surface-contact': 'mediumRigidSurfaceContact',
    'stereoscopic-visual-presentation': 'mediumStereoscopicVisualPresentation',
    'textile-clothing-contact': 'mediumTextileClothingContact',
    'thermal-contact': 'mediumThermalContact',
    'thermal-energy': 'mediumThermalEnergy'
  },
  placement: {
    ears: 'placementEars',
    'ear-left': 'placementEarLeft',
    'ear-right': 'placementEarRight',
    eyes: 'placementEyes',
    'eye-left': 'placementEyeLeft',
    'eye-right': 'placementEyeRight',
    feet: 'placementFeet',
    hands: 'placementHands',
    joints: 'placementJoints',
    mouth: 'placementMouth',
    nose: 'placementNose',
    'top-of-head': 'placementTopOfHead',
    torso: 'placementTorso',
    'whole-body': 'placementWholeBody',
    'nearby-environment': 'placementNearbyEnvironment'
  }
}
const EXPOSURE_CATEGORIES = new Set(['perceived', 'medium', 'placement'])

// Presence follows from the mechanism (sstim:impliesPresence), so it is read
// from here rather than asked for.
const PERCEPTUAL_MECHANISMS = new Set(['binaural-beat'])
// A channel delivering these must declare the optical-radiation comfort
// boundary, which follows from the medium, so it is written rather than asked.
const OPTICAL_RADIATION = new Set(['infrared-radiation', 'ultraviolet-radiation'])

const RESERVED_EVENTS = new Set(['session-open', 'session-complete', 'session-interrupt', 'observation-collected'])
const CHANGE_EVENTS = new Set(['parameter-changed', 'safety-limit-applied'])
const REGIMES = ['determinate', 'stochastic', 'adaptive']
const PLANNED_MIN = 60
const PLANNED_MAX = 7200

function controlled (category, value, what) {
  const table = CONTROLLED[category]
  if (!Object.hasOwn(table, value)) {
    throw new SstimError(`${what} ${JSON.stringify(value)} is not one of: ${Object.keys(table).join(', ')}`)
  }
  return namedNode((EXPOSURE_CATEGORIES.has(category) ? SSTIM_EX : SSTIM_V) + table[value])
}

function several (category, value, what) {
  const values = typeof value === 'string' ? [value] : [...(value ?? [])]
  if (values.length === 0) throw new SstimError(`a channel needs at least one ${what}`)
  for (const item of values) controlled(category, item, what)
  return values
}

function number (value, what) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) >= 1e15) {
    throw new SstimError(`${what} must be a finite number below 1e15, got ${value}`)
  }
  return value
}

// Nine fractional digits (nanoseconds, for offsets), trailing zeros dropped,
// one kept: the Python client's rule, so the two emit identical literals.
function lexical (value) {
  let text = value.toFixed(9).replace(/0+$/, '')
  if (text.endsWith('.')) text += '0'
  return text === '-0.0' ? '0.0' : text
}

const decimal = (value) => literal(lexical(value), namedNode(XSD + 'decimal'))
const integer = (value) => literal(String(Math.trunc(value)), namedNode(XSD + 'integer'))
const dateTime = (value) => literal(value.toISOString(), namedNode(XSD + 'dateTime'))

function instant (value, what) {
  if (typeof value === 'string') {
    if (!/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
      throw new SstimError(`${what} has no time zone. A naive time cannot be placed in the calendar.`)
    }
    value = new Date(value)
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new SstimError(`${what} must be a Date or an ISO 8601 string with a time zone`)
  }
  return value
}

const rateLabel = (value) => String(value)

/** A modality-free signal. Pass it to `Session.channel` to render it. */
export class Signal {
  constructor (index, hzMin, hzMax, shape, label) {
    Object.assign(this, { index, hzMin, hzMax, shape, label })
    Object.freeze(this)
  }
}

/**
 * One execution of a stimulus, with its plan and what happened during it.
 *
 * `base` is your namespace for this one record. `clock` is your timing
 * context's reading when the session opened, and every later `at` is a reading
 * of the same clock. `timing` is "audio-hardware" when those readings come from
 * the device that rendered the audio (an AudioContext), and
 * "monotonic-substitute" for any other monotonic clock.
 */
export class Session {
  constructor (base, {
    label, duration, masterVolume, timing, clock,
    startedAt = null, created = null, masterBrightness = null,
    reproducibility = 'equivalent-presentation', digest = null, digestAlgorithm = null,
    stimulusLabel = null, regime = 'determinate'
  } = {}) {
    if (typeof base !== 'string' || !/^https?:\/\//.test(base)) {
      throw new SstimError(`base must be an http(s) IRI in your own namespace, got ${base}`)
    }
    if (base.startsWith(TERM_NAMESPACE)) {
      throw new SstimError(`base ${base} is under ${TERM_NAMESPACE}, which only SSTIM mints in. ` +
                           'Use your own namespace for your records.')
    }
    if (!base.endsWith('/') && !base.endsWith('#')) {
      throw new SstimError(`base must end with '/' or '#' so records can be minted under it, got ${base}`)
    }
    if (typeof label !== 'string' || !label.trim()) throw new SstimError('label must be a non-empty string')
    if (!Number.isInteger(duration) || duration < PLANNED_MIN || duration > PLANNED_MAX) {
      throw new SstimError(`duration is the planned length in whole seconds, ${PLANNED_MIN} to ` +
                           `${PLANNED_MAX} in SSTIM's session model; got ${duration}`)
    }
    this._volume = number(masterVolume, 'masterVolume')
    if (this._volume < 0 || this._volume > 1) {
      throw new SstimError('masterVolume is a normalized gain in [0, 1]; a silent session states 0')
    }
    this._brightness = null
    if (masterBrightness != null) {
      this._brightness = number(masterBrightness, 'masterBrightness')
      if (this._brightness < 0 || this._brightness > 1) {
        throw new SstimError('masterBrightness is a normalized level in [0, 1]')
      }
    }
    this._timing = controlled('timing', timing, 'timing')
    this._reproducibility = controlled('reproducibility', reproducibility, 'reproducibility')
    if (digest != null) {
      if (digestAlgorithm == null) {
        throw new SstimError('a digest without its algorithm cannot be recomputed; pass digestAlgorithm')
      }
      if (typeof digest !== 'string' || !/^[0-9a-f]{32,128}$/.test(digest)) {
        throw new SstimError('digest must be 32 to 128 lowercase hexadecimal characters')
      }
    } else if (digestAlgorithm != null) {
      throw new SstimError('digestAlgorithm was given without a digest')
    }
    if (!REGIMES.includes(regime)) {
      throw new SstimError(`regime ${JSON.stringify(regime)} is not one of: ${REGIMES.join(', ')}`)
    }
    this._origin = number(clock, 'clock')
    if (this._origin < 0) throw new SstimError('clock must be a non-negative reading of your timing context')

    this._base = base
    this._label = label
    this._duration = duration
    this._digest = digest
    this._digestAlgorithm = digestAlgorithm
    this._stimulusLabel = stimulusLabel || `Stimulus delivered in ${label}`
    this._regime = regime
    this._started = startedAt != null ? instant(startedAt, 'startedAt') : new Date()
    this._created = created != null ? instant(created, 'created') : this._started

    this._signals = []
    this._channels = []
    this._events = [{ kind: 'session-open', offset: 0 }]
    this._last = 0
    this._state = 'idle'
    this._segment = 0
    this._delivered = 0
    this._played = false
    this._closed = null
  }

  // ── describing the stimulus ────────────────────────────────────────────

  /** Declare a signal: a point rate with `hz`, or a range with both bounds. */
  signal ({ shape, hz = null, hzMin = null, hzMax = null, label = null } = {}) {
    this._open('signal')
    controlled('shape', shape, 'shape')
    if (shape === 'sampled') {
      throw new SstimError('a sampled signal must name the material it was sampled from, ' +
                           'which this builder cannot yet record')
    }
    let low, high
    if (hz != null) {
      if (hzMin != null || hzMax != null) {
        throw new SstimError('pass hz for a point signal, or hzMin and hzMax for a range, not both')
      }
      low = high = number(hz, 'hz')
    } else if (hzMin != null && hzMax != null) {
      low = number(hzMin, 'hzMin')
      high = number(hzMax, 'hzMax')
    } else {
      throw new SstimError('a signal needs its frequency: hz, or hzMin and hzMax')
    }
    if (low < 0 || low > high) {
      throw new SstimError(`frequency extent must satisfy 0 <= hzMin <= hzMax, got ${low} and ${high}`)
    }
    const rate = low === high ? `${rateLabel(low)} Hz` : `${rateLabel(low)} to ${rateLabel(high)} Hz`
    const signal = new Signal(this._signals.length + 1, low, high, shape, label || `${rate} ${shape}`)
    this._signals.push(signal)
    return signal
  }

  /**
   * Declare a channel that renders `signal` onto one parameter. `modality` is
   * what is perceived ("visual"), `medium` what physically carries it
   * ("visual-light"), `placement` where it meets the body ("eyes").
   */
  channel (label, { modality, medium, placement, signal, parameter, mechanism, carrierHz = null } = {}) {
    this._open('channel')
    if (typeof label !== 'string' || !label.trim()) throw new SstimError('a channel needs a non-empty label')
    if (!(signal instanceof Signal) || !this._signals.includes(signal)) {
      throw new SstimError("signal must be one returned by this session's signal()")
    }
    controlled('perceived', modality, 'modality')
    const media = several('medium', medium, 'medium')
    const placements = several('placement', placement, 'placement')
    controlled('parameter', parameter, 'parameter')
    controlled('mechanism', mechanism, 'mechanism')
    let carrier = null
    if (carrierHz != null) {
      if (mechanism === 'direct-presentation') {
        throw new SstimError('a directly presented rendering has no carrier: the signal ' +
                             'reaches the subject as itself')
      }
      carrier = number(carrierHz, 'carrierHz')
      if (carrier <= 0) throw new SstimError('carrierHz must be positive')
    }
    this._channels.push({ label, modality, media, placements, signal, parameter, mechanism, carrier })
  }

  // ── what happened ──────────────────────────────────────────────────────

  /** Record an occurrence at clock reading `at`, in the order it happened. */
  event (kind, { at, parameter = null, before = null, after = null } = {}) {
    this._open('event')
    controlled('event', kind, 'event')
    if (RESERVED_EVENTS.has(kind)) {
      throw new SstimError(`${JSON.stringify(kind)} is not recorded by hand: session-open comes from ` +
                           'the constructor, session-complete and session-interrupt from close(), and ' +
                           'observation-collected needs an observation, which this builder does not record')
    }
    const offset = this._offset(at)
    const entry = { kind, offset }
    if (CHANGE_EVENTS.has(kind)) {
      if (parameter != null) {
        controlled('change', parameter, 'parameter')
        entry.parameter = parameter
      }
      if (after != null) entry.after = number(after, 'after')
      if (before != null) entry.before = number(before, 'before')
      if (kind === 'parameter-changed' && (entry.parameter == null || entry.after == null)) {
        throw new SstimError('a parameter-changed event must say which parameter and its new value ' +
                             '(parameter, after): a mark with no content cannot be replayed')
      }
    } else if (parameter != null || before != null || after != null) {
      throw new SstimError('parameter, before and after belong to parameter-changed and ' +
                           `safety-limit-applied events, not to ${JSON.stringify(kind)}`)
    }

    const state = this._state
    if (kind === 'playback-start') {
      if (state === 'delivering' || state === 'paused') throw new SstimError(`playback-start while playback is ${state}`)
      this._state = 'delivering'
      this._segment = offset
    } else if (kind === 'playback-pause') {
      if (state !== 'delivering') throw new SstimError(`playback-pause while playback is ${state}`)
      this._delivered += offset - this._segment
      this._state = 'paused'
    } else if (kind === 'playback-resume') {
      if (state !== 'paused') throw new SstimError(`playback-resume while playback is ${state}`)
      this._state = 'delivering'
      this._segment = offset
    } else if (kind === 'playback-stop') {
      if (state !== 'delivering' && state !== 'paused') throw new SstimError(`playback-stop while playback is ${state}`)
      if (state === 'delivering') this._delivered += offset - this._segment
      this._state = 'stopped'
    }
    if (kind.startsWith('playback-')) this._played = true
    this._events.push(entry)
  }

  /**
   * End the session at clock reading `at`. `completed` is the one thing only
   * you know. Elapsed time comes from the clock, rounded up to whole seconds as
   * the model requires; delivered time is summed from the playback events
   * unless you pass `delivered` yourself.
   */
  close ({ at, completed, endedAt = null, delivered = null } = {}) {
    this._open('close')
    if (typeof completed !== 'boolean') throw new SstimError('completed must be true or false')
    const offset = this._offset(at)
    if (this._state === 'delivering') this._delivered += offset - this._segment
    const elapsed = Math.ceil(Number(lexical(offset)))
    let value
    if (delivered != null) {
      value = number(delivered, 'delivered')
      if (value < 0 || value > elapsed) {
        throw new SstimError(`delivered must be between 0 and the elapsed ${elapsed} s: a ` +
                             'session cannot deliver more stimulus than it ran')
      }
    } else if (this._played) {
      value = Math.min(this._delivered, Number(lexical(offset)))
    } else {
      value = null
    }
    let status
    if (completed) {
      status = 'completed'
    } else {
      const played = value ?? offset
      status = played / this._duration > 0.3 ? 'interrupted' : 'abandoned'
    }
    const ended = endedAt != null ? instant(endedAt, 'endedAt') : new Date()
    if (ended.getTime() <= this._started.getTime()) {
      throw new SstimError('endedAt must be later than startedAt, at millisecond precision')
    }
    this._events.push({ kind: completed ? 'session-complete' : 'session-interrupt', offset })
    this._closed = { elapsed, delivered: value, status, ended }
  }

  // ── output ─────────────────────────────────────────────────────────────

  /** The record as RDF/JS quads. Structurally checked, not SHACL-validated. */
  quads () {
    if (this._closed === null) {
      throw new SstimError('close() the session first: a record without its end is incomplete')
    }
    const closed = this._closed
    const store = new Store()
    const node = (name) => namedNode(this._base + name)
    const add = (s, p, o) => store.addQuad(s, namedNode(p), o)
    const type = (s, o) => add(s, RDF + 'type', namedNode(o))

    const preset = node('preset')
    const plan = node('plan')
    const session = node('session')
    const stimulus = node('stimulus')

    type(preset, SSTIM + 'Preset')
    add(preset, RDFS + 'label', literal(`Configuration used for ${this._label}`))

    type(plan, SSTIM + 'SessionSpecification')
    type(plan, PROV + 'Plan')
    add(plan, RDFS + 'label', literal(`Plan for ${this._label}`))
    add(plan, DCT + 'created', dateTime(this._created))
    add(plan, SSTIM + 'referencesPreset', preset)
    add(plan, SSTIM + 'durationSeconds', integer(this._duration))
    add(plan, SSTIM + 'masterVolume', decimal(this._volume))
    if (this._brightness !== null) add(plan, SSTIM + 'masterBrightness', decimal(this._brightness))
    add(plan, SSTIM + 'hasReproducibilityLevel', this._reproducibility)
    if (this._digest != null) {
      add(plan, SSTIM + 'configurationDigest', literal(this._digest))
      add(plan, SSTIM + 'digestAlgorithm', literal(this._digestAlgorithm))
    }

    type(session, SSTIM + 'SessionInstance')
    add(session, RDFS + 'label', literal(this._label))
    add(session, SSTIM + 'usesSpecification', plan)
    add(session, SSTIM + 'actualDurationSeconds', integer(closed.elapsed))
    add(session, SSTIM + 'completionStatus', literal(closed.status))
    add(session, PROV + 'startedAtTime', dateTime(this._started))
    add(session, PROV + 'endedAtTime', dateTime(closed.ended))
    add(session, SSTIM + 'clockOriginSeconds', decimal(this._origin))
    add(session, SSTIM + 'hasTimingAuthority', this._timing)
    if (closed.delivered !== null) add(session, SSTIM + 'deliveredDurationSeconds', decimal(closed.delivered))
    // Only notations the coarser session-level scheme shares are carried
    // across: "tactile" is not silently promoted to "somatosensory".
    for (const channel of this._channels) {
      if (Object.hasOwn(CONTROLLED.modality, channel.modality)) {
        add(session, SSTIM + 'hasDeliveryModality', controlled('modality', channel.modality, 'modality'))
      }
    }

    this._events.forEach((entry, i) => {
      const event = node(`event-${i + 1}`)
      add(session, SSTIM + 'hasSessionEvent', event)
      type(event, SSTIM + 'SessionEvent')
      add(event, SSTIM + 'hasEventType', controlled('event', entry.kind, 'event'))
      add(event, SSTIM + 'sessionClockOffsetSeconds', decimal(entry.offset))
      if (entry.parameter != null) add(event, SSTIM + 'hasChangedParameter', controlled('change', entry.parameter, 'parameter'))
      if (entry.before != null) add(event, SSTIM + 'parameterValueBefore', decimal(entry.before))
      if (entry.after != null) add(event, SSTIM + 'parameterValueAfter', decimal(entry.after))
    })

    // A record with no channel says nothing about the stimulus, so it carries
    // no stimulus specification rather than an empty one.
    if (this._channels.length > 0) {
      add(preset, SSTIM + 'specifiedBy', stimulus)
      type(stimulus, SSTIM + 'StimulusSpecification')
      add(stimulus, RDFS + 'label', literal(this._stimulusLabel))
      add(stimulus, SSTIM + 'stimulusRegime', literal(this._regime))
      for (const signal of this._signals) {
        const sig = node(`signal-${signal.index}`)
        add(stimulus, SSTIM + 'hasSignal', sig)
        type(sig, SSTIM + 'StimulationSignal')
        add(sig, RDFS + 'label', literal(signal.label))
        add(sig, SSTIM + 'hasSignalShape', controlled('shape', signal.shape, 'shape'))
        add(sig, SSTIM + 'hzMin', decimal(signal.hzMin))
        add(sig, SSTIM + 'hzMax', decimal(signal.hzMax))
      }
      this._channels.forEach((channel, i) => {
        const chan = node(`channel-${i + 1}`)
        const rendering = node(`rendering-${i + 1}`)
        add(stimulus, SSTIM + 'hasStimulusChannel', chan)
        type(chan, SSTIM_EX + 'StimulusChannel')
        add(chan, RDFS + 'label', literal(channel.label))
        add(chan, SSTIM_EX + 'perceivedModality', controlled('perceived', channel.modality, 'modality'))
        for (const medium of channel.media) add(chan, SSTIM_EX + 'deliveryMedium', controlled('medium', medium, 'medium'))
        for (const placement of channel.placements) {
          add(chan, SSTIM_EX + 'hasBodyPlacement', controlled('placement', placement, 'placement'))
        }
        if (channel.media.some(m => OPTICAL_RADIATION.has(m))) {
          add(chan, SSTIM_EX + 'hasComfortBoundary', namedNode(SSTIM_EX + 'boundaryOpticalRadiation'))
        }
        add(chan, SSTIM + 'hasSignalRendering', rendering)
        type(rendering, SSTIM + 'SignalRendering')
        add(rendering, RDFS + 'label', literal(`${channel.label}: ${channel.mechanism} onto ${channel.parameter}`))
        add(rendering, SSTIM + 'rendersSignal', node(`signal-${channel.signal.index}`))
        add(rendering, SSTIM + 'rendersOntoParameter', controlled('parameter', channel.parameter, 'parameter'))
        add(rendering, SSTIM + 'hasRenderingMechanism', controlled('mechanism', channel.mechanism, 'mechanism'))
        add(rendering, SSTIM + 'hasRenderingPresence', namedNode(
          SSTIM_V + (PERCEPTUAL_MECHANISMS.has(channel.mechanism) ? 'presencePerceptual' : 'presencePhysical')))
        if (channel.carrier !== null) add(rendering, SSTIM + 'renderingCarrierHz', decimal(channel.carrier))
      })
    }
    return store.getQuads(null, null, null, null)
  }

  /**
   * The record as Turtle. Structurally checked, not SHACL-validated: use
   * write(), or validate() yourself, before publishing it.
   */
  toTurtle () {
    const writer = new Writer({
      prefixes: {
        '': this._base, sstim: SSTIM, 'sstim-v': SSTIM_V, 'sstim-ex': SSTIM_EX,
        prov: PROV, dct: DCT, rdfs: RDFS, xsd: XSD
      }
    })
    writer.addQuads(this.quads())
    let text
    // With no output stream, N3's writer calls back synchronously.
    writer.end((error, result) => {
      if (error) throw error
      text = result
    })
    return text
  }

  /** Validate the record; options are passed on to `validate`. */
  async validate ({ profile = 'full', ...resolve } = {}) {
    const { validate } = await import('./validate.js')
    return validate(this.quads(), { profile, ...resolve })
  }

  /** Validate, then write Turtle to `path` (Node only). Writes nothing if it fails. */
  async write (path, { profile = 'full', ...resolve } = {}) {
    const report = await this.validate({ profile, ...resolve })
    if (!report.ok) throw new SstimError(`not written: the record does not validate\n${report}`)
    const { writeFile } = await import('node:fs/promises')
    await writeFile(path, this.toTurtle(), 'utf8')
    return report
  }

  // ── internals ──────────────────────────────────────────────────────────

  _open (call) {
    if (this._closed !== null) throw new SstimError(`${call}() after close(): the record is already complete`)
  }

  _offset (at) {
    const offset = number(at, 'at') - this._origin
    if (offset < 0) throw new SstimError(`at=${at} is before the clock origin ${this._origin}`)
    if (offset < this._last) throw new SstimError(`at=${at} is earlier than the previous event: record events in order`)
    this._last = offset
    return offset
  }
}
