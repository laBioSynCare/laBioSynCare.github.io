// Knob captions for the Patch Studio.
//
// Knob.svelte renders the caption in a fixed 56px column (`.knob-label`) with
// `text-overflow: ellipsis`, which shows roughly eight lowercase characters.
// Raw parameter keys overflowed it into misreadings: `inhaleRatio` rendered as
// "inhaler", a word this project must never appear to use.
//
// These are display abbreviations only. The full ontology label and the term
// itself stay one click away in the semantic panel (semantic.js), and the knob
// carries the full name as hover text. See docs/technical/PATCH_STUDIO.md §11.5.
//
// paramLabels.test.js holds every caption to KNOB_LABEL_MAX_CHARS, so adding a
// long parameter fails a test instead of silently truncating in the UI.

/** Characters that fit the 56px caption column before the ellipsis takes over. */
export const KNOB_LABEL_MAX_CHARS = 8

/** Keys absent from this map already fit and are shown verbatim. */
export const PARAM_SHORT_LABELS = {
  amplitude: 'amp',
  beatFreq: 'beat',
  blinkRate: 'rate',
  centerFreq: 'center',
  frequency: 'freq',
  inhaleRatio: 'inhale',
  intensity: 'level',
  leftFreq: 'left',
  nnotes: 'notes',
  noctaves: 'octaves',
  noteDurationFrac: 'note%',
  oscRate: 'rate',
  periodSec: 'period',
  phaseRad: 'phase',
  pulseRate: 'pulse',
  resonance: 'res',
  rightFreq: 'right',
  rotationSpeed: 'spin',
  spatialScale: 'sp.scale',
  targetPeriodSec: 'target',
}

/** The caption shown under a knob. */
export function paramLabel(name) {
  return PARAM_SHORT_LABELS[name] ?? name
}
