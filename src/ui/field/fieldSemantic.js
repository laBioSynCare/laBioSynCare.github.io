import { SSTIM_EX } from '../../rdf/namespaces.js'

// Maps Sensory Field UI concepts to the exposure ontology terms they emit,
// for inline "what this means in the ontology" links. Mirrors the Patch Studio
// bridge in src/ui/creator/semantic.js.

export const FIELD_SEMANTICS = {
  visual: {
    label: 'Visual field',
    kind: 'Stimulus channel',
    uri: SSTIM_EX('mediumVisualLight').value,
    description: 'A full-screen visible-light field delivered to the eyes.',
  },
  blink: {
    label: 'Blink',
    kind: 'Stimulus pattern',
    uri: SSTIM_EX('patternBlinking').value,
    description: 'The field alternates on and off at a chosen flicker rate; bounded by the photosensitivity flash-rate limit.',
  },
  leftEar: {
    label: 'Left ear',
    kind: 'Body placement',
    uri: SSTIM_EX('placementEarLeft').value,
    description: 'Air-conducted sound delivered to the left ear specifically.',
  },
  rightEar: {
    label: 'Right ear',
    kind: 'Body placement',
    uri: SSTIM_EX('placementEarRight').value,
    description: 'Air-conducted sound delivered to the right ear specifically.',
  },
  binaural: {
    label: 'Binaural beat',
    kind: 'Audio modulation',
    uri: SSTIM_EX('hasBeatFrequencyHz').value,
    description: 'A small frequency difference between the ears that produces a perceived beat.',
  },
  monaural: {
    label: 'Monaural beat',
    kind: 'Audio modulation',
    uri: SSTIM_EX('hasBeatFrequencyHz').value,
    description: 'Amplitude modulation of the same tone in both ears, producing an acoustic beat.',
  },
  photosensitivity: {
    label: 'Photosensitivity boundary',
    kind: 'Comfort boundary',
    uri: SSTIM_EX('boundaryPhotosensitivity').value,
    description: 'Flash-rate safety boundary carrying the WCAG 2.3.1 / ITU-R BT.1702 flicker limit.',
  },
  hearing: {
    label: 'Hearing-risk boundary',
    kind: 'Comfort boundary',
    uri: SSTIM_EX('boundaryHearingRisk').value,
    description: 'Sound-exposure boundary carrying the NIOSH 85 dBA / 8 h advisory limit.',
  },
}

export function localSemanticName(uri) {
  return uri?.split(/[#/]/).pop() ?? ''
}

/** Link to the graph view focused on a term, matching semanticGraphHref(). */
export function fieldGraphHref(info) {
  const local = localSemanticName(info?.uri)
  return local ? `/#${encodeURIComponent(local)}` : '/'
}
