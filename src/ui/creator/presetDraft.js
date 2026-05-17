// Control track types
export const CONTROL_TYPES = ['Martigli', 'Symmetry']

// Martigli waveform shapes for breath curve
export const MARTIGLI_WAVEFORMS = ['sine', 'triangle', 'square']

// Knob ranges for Martigli control params [min, max, step]
export const MARTIGLI_PARAM_RANGE = {
  periodSec:       [3,   60,  1],
  targetPeriodSec: [3,   60,  1],
  inhaleRatio:     [0.1, 0.9, 0.05],
  amplitude:       [0,   2,   0.05],
}

export const MARTIGLI_PARAMS = ['periodSec', 'targetPeriodSec', 'inhaleRatio', 'amplitude']

// Knob ranges for Symmetry control params [min, max, step]
export const SYMMETRY_PARAM_RANGE = {
  rateHz:   [0.001, 50,  0.1],
  depth:    [0,     10,  0.1],
  offset:   [-5,    5,   0.1],
  phaseDeg: [0,     360, 1],
}

export const SYMMETRY_PARAMS = ['rateHz', 'depth', 'offset', 'phaseDeg']

// Audio track types
export const AUDIO_TRACK_TYPES = ['IsochronicTone', 'BinauralBeat', 'Carrier']

// Audio parameters that can accept modulation
export const AUDIO_PARAMS = ['gain', 'pan', 'frequency', 'pulseRate']

// Knob ranges for audio params [min, max, step]
export const AUDIO_PARAM_RANGE = {
  gain:      [0,    1,     0.01],
  pan:       [-1,   1,     0.01],
  frequency: [20,   2000,  1],
  pulseRate: [0.5,  50,    0.5],
  leftFreq:  [20,   2000,  1],
  rightFreq: [20,   2000,  1],
}

// Canonical (audible & modulatable) params per voice type. BinauralBeat owns
// leftFreq and rightFreq INDEPENDENTLY — center/beat are derived for display
// only. No pan on Binaural (the two carriers are hard-panned L/R by definition;
// a user pan stage defeats the binaural effect). No pulseRate on Carrier.
export const VOICE_PARAMS = {
  Carrier:        ['gain', 'pan', 'frequency'],
  IsochronicTone: ['gain', 'pan', 'frequency', 'pulseRate'],
  BinauralBeat:   ['gain', 'leftFreq', 'rightFreq'],
}

export function voiceParamNames(trackType) {
  return VOICE_PARAMS[trackType] ?? AUDIO_PARAMS
}

// IsochronicTone envelope types
export const ISO_ENVELOPES = ['square', 'AR', 'AD', 'ADSR']

// Envelope sub-fraction defaults per type (only fractions meaningful for the
// active envelope are honored by the engine).
export const ISO_ENVELOPE_DEFAULTS = {
  square: { attackFrac: 0,    decayFrac: 0,    sustainLevel: 1.0, releaseFrac: 0    },
  AD:     { attackFrac: 0.5,  decayFrac: 0,    sustainLevel: 1.0, releaseFrac: 0    },
  AR:     { attackFrac: 0.1,  decayFrac: 0,    sustainLevel: 1.0, releaseFrac: 0.15 },
  ADSR:   { attackFrac: 0.1,  decayFrac: 0.15, sustainLevel: 0.7, releaseFrac: 0.2  },
}

// Binaural parametrization modes
export const BINAURAL_MODES = ['center-beat', 'left-right']

// Visual track types
export const VISUAL_TRACK_TYPES = ['Geometry', 'Particles', 'Gradient']

// Visual parameters that can accept modulation
export const VISUAL_PARAMS = ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue']

// Knob ranges for visual params [min, max, step]
export const VISUAL_PARAM_RANGE = {
  opacity:       [0,   1,    0.01],
  scale:         [0,   4,    0.01],
  rotationSpeed: [-2,  2,    0.01],
  sides:         [3,   12,   1],
  hue:           [0,   360,  1],
}

// Haptic track types
export const HAPTIC_TRACK_TYPES = ['Vibration']

// Haptic parameters that can accept modulation
export const HAPTIC_PARAMS = ['intensity', 'frequency', 'pattern']

// Knob ranges for haptic params [min, max, step]
export const HAPTIC_PARAM_RANGE = {
  intensity:  [0,   1,    0.01],
  frequency:  [20,  500,  1],
  pattern:    [0,   10,   1],
}

let _nextId = 1
function uid(prefix) { return `${prefix}-${_nextId++}` }

// ── Control tracks ──────────────────────────────────────────────────────────

export function createMartigliTrack(overrides = {}) {
  return {
    id: uid('ctl'),
    type: 'Martigli',
    name: 'Primary Martigli',
    waveform: 'sine',
    periodSec: 10,
    targetPeriodSec: 20,
    inhaleRatio: 0.5,
    amplitude: 1.0,
    ...overrides,
  }
}

export function createSymmetryTrack(overrides = {}) {
  return {
    id: uid('ctl'),
    type: 'Symmetry',
    name: 'Primary Symmetry',
    rateHz: 10,
    waveform: 'sine',
    depth: 1.0,
    offset: 0,
    phaseDeg: 0,
    ...overrides,
  }
}

export function createControlTrack(type = 'Martigli', overrides = {}) {
  return type === 'Symmetry'
    ? createSymmetryTrack(overrides)
    : createMartigliTrack(overrides)
}

// ── Mod slot (per-parameter modulation link) ────────────────────────────────

export function createMod(controlId = '', amount = 1) {
  return { id: uid('mod'), controlId, amount, enabled: true }
}

// ── Audio tracks ─────────────────────────────────────────────────────────────

function audioParams(trackType = 'IsochronicTone', defaults = {}) {
  const base = trackType === 'BinauralBeat'
    ? { gain: 0.5, leftFreq: 200, rightFreq: 210 }
    : { gain: 0.5, pan: 0, frequency: 200, pulseRate: 10 }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of voiceParamNames(trackType)) {
    params[key] = { value: merged[key], mods: [] }
  }
  return params
}

export function createAudioTrack(trackType = 'IsochronicTone', overrides = {}) {
  const base = {
    id: uid('audio'),
    trackType,
    name: trackType,
    muted: false,
    windowSec: 1.0,
    params: audioParams(trackType),
  }
  if (trackType === 'IsochronicTone') {
    base.envelope = 'AR'
    base.noteDurationFrac = 0.5
    Object.assign(base, ISO_ENVELOPE_DEFAULTS.AR)
  }
  if (trackType === 'BinauralBeat') {
    base.binauralMode = 'center-beat'
  }
  return { ...base, ...overrides }
}

// ── Visual tracks ─────────────────────────────────────────────────────────────

function visualParams(defaults = {}) {
  const base = { opacity: 1, scale: 1, rotationSpeed: 0.1, sides: 3, hue: 200 }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of VISUAL_PARAMS) {
    params[key] = { value: merged[key], mods: [] }
  }
  return params
}

export function createVisualTrack(trackType = 'Geometry', overrides = {}) {
  return {
    id: uid('visual'),
    trackType,
    name: trackType,
    params: visualParams(),
    ...overrides,
  }
}

// ── Haptic tracks ─────────────────────────────────────────────────────────────

function hapticParams(defaults = {}) {
  const base = { intensity: 0.5, frequency: 100, pattern: 0 }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of HAPTIC_PARAMS) {
    params[key] = { value: merged[key], mods: [] }
  }
  return params
}

export function createHapticTrack(trackType = 'Vibration', overrides = {}) {
  return {
    id: uid('haptic'),
    trackType,
    name: trackType,
    params: hapticParams(),
    ...overrides,
  }
}

// ── Draft ─────────────────────────────────────────────────────────────────────

export function createDraft() {
  const ctrl = createMartigliTrack({ name: 'Primary Martigli', periodSec: 10, targetPeriodSec: 20 })

  const audio = createAudioTrack('IsochronicTone', { name: 'Isochronic Tone' })
  audio.params.gain.value = 0.5
  audio.params.frequency.value = 200
  audio.params.pulseRate.value = 10

  return {
    patchName: 'New Patch',
    bpm: 60,
    lengthSec: 900,
    playing: false,
    controlTracks: [ctrl],
    audioTracks: [audio],
    visualTracks: [],
    hapticTracks: [],
  }
}

// ── Counts / summary ──────────────────────────────────────────────────────────

export function patchSummary(draft) {
  let modLinks = 0
  for (const tracks of [draft.audioTracks, draft.visualTracks, draft.hapticTracks]) {
    for (const track of tracks) {
      for (const p of Object.values(track.params)) {
        modLinks += p.mods.length
      }
    }
  }
  return {
    controlCount: draft.controlTracks.length,
    audioCount: draft.audioTracks.length,
    visualCount: draft.visualTracks.length,
    hapticCount: draft.hapticTracks.length,
    modLinks,
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

export function buildPatchExport(draft) {
  return {
    model: 'patch-studio-model-1',
    patchName: draft.patchName,
    timing: { bpm: draft.bpm, lengthSec: draft.lengthSec },
    controlTracks: draft.controlTracks,
    audioTracks: draft.audioTracks,
    visualTracks: draft.visualTracks,
    hapticTracks: draft.hapticTracks,
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateDraft(draft) {
  const issues = []
  const ctrlIds = new Set(draft.controlTracks.map(t => t.id))

  if (!draft.patchName?.trim()) issues.push(err('Set a patch name.'))
  if ((draft.bpm ?? 0) <= 0) issues.push(err('BPM must be > 0.'))
  if ((draft.lengthSec ?? 0) <= 0) issues.push(err('Length must be > 0 sec.'))
  if (draft.controlTracks.length === 0) issues.push(warn('No control tracks — add a Martigli or Symmetry oscillator.'))

  for (const track of draft.controlTracks) {
    if (track.type === 'Martigli') {
      if ((track.periodSec ?? 0) < 3) issues.push(err(`${track.name}: period must be ≥ 3s (breathing minimum).`))
    }
    if (track.type === 'Symmetry') {
      if ((track.rateHz ?? 0) <= 0) issues.push(err(`${track.name}: rate must be > 0 Hz.`))
      if ((track.rateHz ?? 0) > 50) issues.push(err(`${track.name}: rate exceeds 50 Hz maximum.`))
    }
  }

  const allSensory = [...draft.audioTracks, ...draft.visualTracks, ...draft.hapticTracks]
  if (allSensory.length === 0) issues.push(warn('No sensory tracks — add at least one audio, visual, or haptic track.'))

  for (const track of allSensory) {
    for (const [paramName, param] of Object.entries(track.params)) {
      for (const mod of param.mods) {
        if (!ctrlIds.has(mod.controlId)) {
          issues.push(err(`${track.name}.${paramName}: linked control no longer exists.`))
        }
      }
    }
  }

  return issues
}

function err(message) { return { level: 'error', message } }
function warn(message) { return { level: 'warning', message } }
