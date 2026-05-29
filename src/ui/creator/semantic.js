import { SSTIM, SSTIM_V } from '../../rdf/namespaces.js'

const TRACK_SEMANTICS = {
  BinauralBeat: {
    label: 'Binaural Beat',
    kind: 'Audio voice type',
    uri: SSTIM('BinauralVoice').value,
    description: 'Two carrier tones presented dichotically so their frequency difference defines the perceived beat target.',
  },
  IsochronicTone: {
    label: 'Isochronic Tone',
    kind: 'Audio voice type',
    uri: SSTIM('SymmetryVoice').value,
    description: 'A pulsed tone mode represented in the ontology as the isochronous case of SymmetryVoice.',
  },
  Carrier: {
    label: 'Carrier',
    kind: 'Audio voice type',
    uri: SSTIM('Voice').value,
    description: 'A direct audio layer used as a carrier tone or continuous voice component in a patch.',
  },
  Noise: {
    label: 'Noise',
    kind: 'Audio voice type',
    uri: SSTIM('Voice').value,
    description: 'A broadband noise layer (white, pink, or brown) shaped by a low-pass cutoff, used for masking and calming textures.',
  },
  Martigli: {
    label: 'Martigli',
    kind: 'Control signal type',
    uri: SSTIM('MartigliVoice').value,
    description: 'A breathing-shaped oscillation used to drive slow auditory or cross-modal changes.',
  },
  Symmetry: {
    label: 'Symmetry',
    kind: 'Control signal type',
    uri: SSTIM('SymmetryVoice').value,
    description: 'A repeated sequence or permutation signal used for rhythmic or attentional entrainment.',
  },
  Geometry: {
    label: 'Geometry',
    kind: 'Visual track type',
    uri: SSTIM_V('modalityVisual').value,
    description: 'A visual sensory modality component rendered as structured geometry.',
  },
  Particles: {
    label: 'Particles',
    kind: 'Visual track type',
    uri: SSTIM_V('modalityVisual').value,
    description: 'A visual sensory modality component rendered as moving particles.',
  },
  Gradient: {
    label: 'Gradient',
    kind: 'Visual track type',
    uri: SSTIM_V('modalityVisual').value,
    description: 'A visual sensory modality component rendered as a changing gradient field.',
  },
  Blink: {
    label: 'Blink',
    kind: 'Visual track type',
    uri: SSTIM_V('modalityVisual').value,
    description: 'A photic visual component that flashes on and off at a set rate and duty cycle, supporting flicker-based entrainment.',
  },
  Oscillate: {
    label: 'Oscillate',
    kind: 'Visual track type',
    uri: SSTIM_V('modalityVisual').value,
    description: 'A visual component whose brightness and scale vary smoothly and sinusoidally at a set rate.',
  },
  Vibration: {
    label: 'Vibration',
    kind: 'Haptic track type',
    uri: SSTIM_V('modalitySomatosensory').value,
    description: 'A somatosensory modality component represented as vibration or haptic pulse delivery.',
  },
}

const PARAM_SEMANTICS = {
  gain: ['Gain', 'Amplitude parameter', 'initialVolume', 'Voice output amplitude for this layer.'],
  pan: ['Pan', 'Spatial parameter', 'panPosition', 'Stereo placement from left to right.'],
  frequency: ['Frequency', 'Frequency parameter', 'baseFrequency', 'Base or carrier frequency in Hz.'],
  pulseRate: ['Pulse rate', 'Rhythmic parameter', 'pulseRateHz', 'Rate of rhythmic pulses in Hz.'],
  noteDurationFrac: ['Note duration', 'Envelope parameter', 'noteDurationFraction', 'Fraction of each pulse occupied by the active note envelope.'],
  leftFreq: ['Left carrier frequency', 'Frequency parameter', 'carrierFreqLeft', 'Left-ear carrier frequency for binaural presentation.'],
  rightFreq: ['Right carrier frequency', 'Frequency parameter', 'carrierFreqRight', 'Right-ear carrier frequency for binaural presentation.'],
  centerFreq: ['Center frequency', 'Frequency parameter', 'baseFrequency', 'Center frequency around which binaural carriers are arranged.'],
  beatFreq: ['Beat frequency', 'Rhythmic parameter', 'beatHz', 'Difference frequency of a binaural beat.'],
  periodSec: ['Period', 'Timing parameter', 'breathingPeriodInitial', 'Initial cycle period for a breathing or control oscillation.'],
  targetPeriodSec: ['Target period', 'Timing parameter', 'breathingPeriodFinal', 'Final cycle period reached by a breathing or control oscillation.'],
  inhaleRatio: ['Inhale ratio', 'Timing parameter', 'breathingPhaseRatio', 'Fraction of a breathing cycle assigned to the inhale phase.'],
  amplitude: ['Amplitude', 'Control parameter', 'breathingAmplitude', 'Control signal depth or excursion.'],
  rateHz: ['Rate', 'Rhythmic parameter', 'pulseRateHz', 'Control or sequence step rate in Hz.'],
  nnotes: ['Note count', 'Sequence parameter', 'noteCount', 'Number of notes or sequence positions in a Symmetry cycle.'],
  noctaves: ['Octave span', 'Pitch parameter', 'octaveSpan', 'Pitch span covered by a Symmetry sequence.'],
  cutoff: ['Cutoff', 'Filter parameter', 'lowpassCutoffHz', 'Low-pass filter cutoff in Hz applied to a broadband noise source.'],
  rotationSpeed: ['Rotation speed', 'Visual parameter', 'rotationSpeed', 'Visual rotation rate or angular speed.'],
  sides: ['Sides', 'Visual parameter', 'visualSideCount', 'Number of sides used by a geometric visual form.'],
  density: ['Density', 'Visual parameter', 'visualDensity', 'Density of rendered visual elements.'],
  blinkRate: ['Blink rate', 'Visual parameter', 'flickerRateHz', 'Photic flicker rate in Hz for a blinking visual.'],
  duty: ['Duty cycle', 'Visual parameter', 'dutyCycle', 'On-fraction of each blink cycle.'],
  oscRate: ['Oscillation rate', 'Visual parameter', 'oscillationRateHz', 'Rate in Hz of a smooth visual oscillation.'],
  intensity: ['Intensity', 'Haptic parameter', 'stimulationIntensity', 'Strength of haptic or sensory output.'],
  pattern: ['Pattern', 'Haptic parameter', 'hapticPattern', 'Pattern index or selector for haptic delivery.'],
}

export function semanticForTrackType(type) {
  return TRACK_SEMANTICS[type] ?? {
    label: type ?? 'Track type',
    kind: 'Track type',
    uri: SSTIM('Voice').value,
    description: 'A patch track type used by Patch Studio.',
  }
}

export function semanticForParameter(_track, paramName) {
  const match = PARAM_SEMANTICS[paramName]
  if (!match) {
    return {
      label: paramName,
      kind: 'Patch parameter',
      uri: SSTIM(paramName).value,
      description: 'A Patch Studio parameter.',
    }
  }
  const [label, kind, local, description] = match
  return { label, kind, uri: SSTIM(local).value, description }
}

export function localSemanticName(uri) {
  return uri?.split(/[#/]/).pop() ?? ''
}

export function semanticGraphHref(info) {
  const local = localSemanticName(info?.uri)
  return local ? `/#${encodeURIComponent(local)}` : '/'
}
