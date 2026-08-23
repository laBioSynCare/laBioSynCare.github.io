import { SSTIM_EX } from '../../rdf/namespaces.js'

// Maps Sensory Field UI concepts to the exposure ontology terms they emit,
// for inline "what this means in the ontology" links. Mirrors the Patch Studio
// bridge in src/ui/creator/semantic.js.
//
// This is a display lookup table, not an RDF emitter: it constructs no quads.
// Its tests live with that mirror, in ../creator/semantic.test.js, which checks
// every IRI here against the Full module closure (KR-17). They are together
// because they are one kind of thing and one kind of failure. A 2026-08-17
// review concluded this file was untested after searching for a test file beside
// it; the pointer is here so the next search ends differently.

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
  stereoscopy: {
    label: 'Free-view stereoscopy',
    kind: 'Device capability',
    uri: SSTIM_EX('capabilityFreeViewStereoscopy').value,
    description: 'Stereoscopic perception through cross-eye or parallel free-viewing rather than a headset.',
  },
  leftEye: {
    label: 'Left eye',
    kind: 'Body placement',
    uri: SSTIM_EX('placementEyeLeft').value,
    description: 'Visual content intended for the left eye in a stereoscopic pair.',
  },
  rightEye: {
    label: 'Right eye',
    kind: 'Body placement',
    uri: SSTIM_EX('placementEyeRight').value,
    description: 'Visual content intended for the right eye in a stereoscopic pair.',
  },
  stereoDepth: {
    label: 'Stereo depth',
    kind: 'Perceptual gain',
    uri: SSTIM_EX('gainStereoDepth').value,
    description: 'A perceived depth gain created by binocular separation.',
  },
  horizontalFieldLoss: {
    label: 'Horizontal-field loss',
    kind: 'Perceptual loss',
    uri: SSTIM_EX('lossHorizontalField').value,
    description: 'Reduced horizontal visual field created by side-by-side free-view presentation.',
  },
  eyeStrain: {
    label: 'Eye-strain boundary',
    kind: 'Comfort boundary',
    uri: SSTIM_EX('boundaryEyeStrain').value,
    description: 'Eye-comfort boundary for free-view or near-eye visual presentation.',
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
