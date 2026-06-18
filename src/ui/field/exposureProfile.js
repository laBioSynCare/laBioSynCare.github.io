import { DataFactory, Writer } from 'n3'
import {
  SSTIM, SSTIM_EX, SSTIM_V, RDF, RDFS, DCT, XSD, BSCLAB, PREFIXES,
} from '../../rdf/namespaces.js'
import { resolveEarFrequencies } from './fieldState.js'

const { namedNode, literal, quad } = DataFactory

const a = RDF('type')
const dec = (n) => literal(String(n), XSD('decimal'))
const en = (s) => literal(s, 'en')

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `xxxxxxxx`.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))
    + '-' + Date.now().toString(16)
}

/**
 * Build the RDF quads describing a Sensory Field configuration as an
 * sstim-ex:ExposureProfile, mirroring
 * static/ontology/instances/experiments/sensory-field-example.ttl.
 *
 * @param {object} state  Normalised field state.
 * @param {{ id?: string, now?: string }} [opts]
 * @returns {import('n3').Quad[]}
 */
export function fieldStateToQuads(state, opts = {}) {
  const id = opts.id ?? newId()
  const now = opts.now ?? new Date().toISOString()
  const base = BSCLAB(`exposure/${id}`).value
  const node = (frag) => namedNode(`${base}#${frag}`)
  const protocol = namedNode(base)
  const profile = node('profile')

  const quads = []
  const add = (s, p, o) => quads.push(quad(s, p, o))

  const channels = []
  const profileBoundaries = new Set()
  const effectClaims = []

  // ── Visual channel ─────────────────────────────────────────────────────────
  if (state.visual.enabled) {
    const ch = node('visual-channel')
    channels.push(ch)
    add(ch, a, SSTIM_EX('StimulusChannel'))
    add(ch, RDFS('label'), en('Color-field visual channel'))
    add(ch, SSTIM_EX('deliveryMedium'), SSTIM_EX('mediumVisualLight'))
    add(ch, SSTIM_EX('perceivedModality'), SSTIM_EX('modalityVisual'))
    add(ch, SSTIM_EX('requiresDeviceCapability'), SSTIM_EX('capabilityDisplayLightOutput'))
    add(ch, SSTIM_EX('hasBodyPlacement'), SSTIM_EX('placementEyes'))
    add(ch, SSTIM_EX('hasStimulusPattern'), SSTIM_EX('patternFixedColor'))
    add(ch, SSTIM_EX('hasGainLevel'), dec(round(state.visual.intensity)))
    if (state.visual.blinkEnabled) {
      add(ch, SSTIM_EX('requiresDeviceCapability'), SSTIM_EX('capabilityDisplayFlicker'))
      add(ch, SSTIM_EX('hasStimulusPattern'), SSTIM_EX('patternBlinking'))
      add(ch, SSTIM_EX('hasFlickerRateHz'), dec(round(state.visual.blinkRateHz)))
      add(ch, SSTIM_EX('hasDutyCycle'), dec(round(state.visual.blinkDuty)))
      add(ch, SSTIM_EX('hasComfortBoundary'), SSTIM_EX('boundaryPhotosensitivity'))
      profileBoundaries.add('boundaryPhotosensitivity')
    }
    add(ch, SSTIM_EX('hasComfortBoundary'), SSTIM_EX('boundaryEyeStrain'))
    profileBoundaries.add('boundaryEyeStrain')
  }

  // ── Per-ear audio channels ──────────────────────────────────────────────────
  if (state.audio.enabled) {
    const freqs = resolveEarFrequencies(state)
    const monaural = state.audio.beatMode === 'monaural'
    const binaural = state.audio.beatMode === 'binaural'
    const earSpecs = [
      { ear: state.audio.left, placement: 'placementEarLeft', label: 'Left-ear audio channel', frag: 'left-ear-channel', freq: freqs.left },
      {
        ear: state.audio.linkEars ? state.audio.left : state.audio.right,
        placement: 'placementEarRight', label: 'Right-ear audio channel', frag: 'right-ear-channel', freq: freqs.right,
      },
    ]
    for (const spec of earSpecs) {
      const ch = node(spec.frag)
      channels.push(ch)
      add(ch, a, SSTIM_EX('StimulusChannel'))
      add(ch, RDFS('label'), en(spec.label))
      add(ch, SSTIM_EX('deliveryMedium'), SSTIM_EX('mediumAirConductedSound'))
      add(ch, SSTIM_EX('perceivedModality'), SSTIM_EX('modalityAuditory'))
      add(ch, SSTIM_EX('requiresDeviceCapability'), SSTIM_EX('capabilityHeadphones'))
      add(ch, SSTIM_EX('requiresDeviceCapability'), SSTIM_EX('capabilityStereoSeparation'))
      add(ch, SSTIM_EX('hasBodyPlacement'), SSTIM_EX(spec.placement))
      if (spec.ear.tone) {
        add(ch, SSTIM_EX('hasStimulusPattern'), SSTIM_EX('patternContinuous'))
        add(ch, SSTIM_EX('hasFrequencyHz'), dec(round(spec.freq)))
      }
      if (spec.ear.noise) {
        add(ch, SSTIM_EX('hasStimulusPattern'), SSTIM_EX('patternNoise'))
        add(ch, SSTIM_EX('hasStimulusPattern'), audioNoiseConcept(spec.ear.noiseColor))
      }
      if (monaural || binaural) {
        add(ch, SSTIM_EX('hasBeatFrequencyHz'), dec(round(state.audio.beatRateHz)))
      }
      add(ch, SSTIM_EX('hasGainLevel'), dec(round(spec.ear.gain)))
      add(ch, SSTIM_EX('hasComfortBoundary'), SSTIM_EX('boundaryHearingRisk'))
      profileBoundaries.add('boundaryHearingRisk')
    }
  }

  // ── Effect claims (qualified; never an unconditional benefit assertion) ──────
  const calmClaim = node('self-observation-claim')
  effectClaims.push(calmClaim)
  add(calmClaim, a, SSTIM_EX('ExposureEffectClaim'))
  add(calmClaim, a, SSTIM('EvidenceClaim'))
  add(calmClaim, RDFS('label'), en('Calm/arousal self-observation target'))
  add(calmClaim, DCT('description'), en('Records the question of how this field relates to self-reported calm or arousal. No effect direction or magnitude is asserted.'))
  add(calmClaim, SSTIM('hasEvidenceTier'), SSTIM_V('tierSpeculative'))
  add(calmClaim, SSTIM('hasModalityTag'), SSTIM_V('modalityAV'))
  add(calmClaim, SSTIM_EX('concernsEffectDimension'), SSTIM_EX('effectCalm'))
  add(calmClaim, SSTIM_EX('concernsEffectDimension'), SSTIM_EX('effectArousal'))
  add(calmClaim, SSTIM_EX('hasKnowledgeStatus'), SSTIM_EX('hypothesisInSSTIM'))

  if (state.visual.enabled && state.visual.blinkEnabled) {
    const photoClaim = node('photosensitivity-claim')
    effectClaims.push(photoClaim)
    add(photoClaim, a, SSTIM_EX('ExposureEffectClaim'))
    add(photoClaim, a, SSTIM('EvidenceClaim'))
    add(photoClaim, RDFS('label'), en('Flicker photosensitivity boundary'))
    add(photoClaim, DCT('description'), en('Marks the blinking field as bounded by the photosensitivity flash-rate limit.'))
    add(photoClaim, SSTIM('hasEvidenceTier'), SSTIM_V('tierSpeculative'))
    add(photoClaim, SSTIM('hasModalityTag'), SSTIM_V('modalityGENERAL'))
    add(photoClaim, SSTIM_EX('concernsEffectDimension'), SSTIM_EX('effectPhotosensitivityRisk'))
    add(photoClaim, SSTIM_EX('hasKnowledgeStatus'), SSTIM_EX('knownInSSTIM'))
  }

  // ── Protocol + profile ──────────────────────────────────────────────────────
  add(protocol, a, SSTIM_EX('ExploratoryProtocol'))
  add(protocol, RDFS('label'), en('Sensory Field exposure'))
  add(protocol, DCT('description'), en('A Sensory Field configuration exported from BSC Lab: a full-screen color field with an independent per-ear tone. Non-clinical; no physiological benefit is asserted.'))
  add(protocol, DCT('created'), literal(now, XSD('dateTime')))
  add(protocol, SSTIM_EX('hasExperimentContext'), SSTIM_EX('contextBscLabPrototype'))
  add(protocol, SSTIM_EX('hasExperimentContext'), SSTIM_EX('contextSelfObservation'))
  add(protocol, SSTIM_EX('hasKnowledgeStatus'), SSTIM_EX('knownInSSTIM'))
  add(protocol, SSTIM_EX('hasExposureProfile'), profile)

  add(profile, a, SSTIM_EX('ExposureProfile'))
  add(profile, RDFS('label'), en('Sensory Field exposure profile'))
  add(profile, SSTIM_EX('hasKnowledgeStatus'), SSTIM_EX('knownInSSTIM'))
  for (const ch of channels) add(profile, SSTIM_EX('usesStimulusChannel'), ch)
  for (const b of profileBoundaries) add(profile, SSTIM_EX('hasComfortBoundary'), SSTIM_EX(b))
  for (const claim of effectClaims) add(profile, SSTIM_EX('hasEffectClaim'), claim)

  return quads
}

const NOISE_CONCEPT = { white: 'audioNoiseWhite', pink: 'audioNoisePink', brown: 'audioNoiseBrownRed' }
function audioNoiseConcept(color) {
  return SSTIM_EX(NOISE_CONCEPT[color] ?? 'audioNoisePink')
}

// Round to a stable 3 decimals so serialised literals are tidy and deterministic.
function round(n) {
  return Math.round((Number(n) || 0) * 1000) / 1000
}

/**
 * Serialise a field state to a Turtle string.
 * @returns {Promise<string>}
 */
export function fieldStateToTurtle(state, opts = {}) {
  const quads = fieldStateToQuads(state, opts)
  return new Promise((resolve, reject) => {
    const writer = new Writer({ prefixes: PREFIXES })
    writer.addQuads(quads)
    writer.end((err, result) => (err ? reject(err) : resolve(result)))
  })
}
