import {
  TEMPO_DIVISIONS,
  TEMPO_MAX_BEATS_PER_BAR,
  TEMPO_MAX_BPM,
  TEMPO_MIN_BEATS_PER_BAR,
  TEMPO_MIN_BPM,
  TEMPO_MODIFIERS,
  clampBeatsPerBar,
  clampBpm,
  createTempoSyncConfig,
  validateTempoSyncConfig,
} from './tempo.js'

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
// Symmetry is a change-ringing-style stepped LFO: a row of `nnotes` notes is
// played one step at a time, then the row is permuted (plain hunt) and the
// next cycle begins. After 2N rows the sequence returns to rounds.
export const SYMMETRY_PARAM_RANGE = {
  nnotes:    [2,    8,   1],
  rateHz:    [0.05, 50,  0.1],
  amplitude: [0,    2,   0.05],
}

export const SYMMETRY_PARAMS = ['nnotes', 'rateHz', 'amplitude']

export const SYMMETRY_FAMILIES = ['plain-hunt']

// Audio track types
export const AUDIO_TRACK_TYPES = ['IsochronicTone', 'BinauralBeat', 'Carrier']

// Audio parameters that can accept modulation
export const AUDIO_PARAMS = ['gain', 'pan', 'frequency', 'pulseRate', 'noteDurationFrac']

// Knob ranges for audio params [min, max, step]
export const AUDIO_PARAM_RANGE = {
  gain:      [0,    1,     0.01],
  pan:       [-1,   1,     0.01],
  frequency: [20,   2000,  1],
  pulseRate: [0.5,  50,    0.5],
  noteDurationFrac: [0.05, 1,    0.01],
  leftFreq:  [20,   2000,  1],
  rightFreq: [20,   2000,  1],
  // Virtual params for BinauralBeat center-beat modulation
  centerFreq: [20,  2000,  1],
  beatFreq:   [-50, 50,    0.5],
}

// Canonical (audible & modulatable) params per voice type. BinauralBeat owns
// leftFreq and rightFreq INDEPENDENTLY — center/beat are derived for display
// only. No pan on Binaural (the two carriers are hard-panned L/R by definition;
// a user pan stage defeats the binaural effect). No pulseRate on Carrier.
export const VOICE_PARAMS = {
  Carrier:        ['gain', 'pan', 'frequency'],
  IsochronicTone: ['gain', 'pan', 'frequency', 'pulseRate', 'noteDurationFrac'],
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
export const HAPTIC_PARAMS = ['intensity', 'frequency', 'pulseRate', 'pattern']

// Knob ranges for haptic params [min, max, step]
export const HAPTIC_PARAM_RANGE = {
  intensity:  [0,   1,    0.01],
  frequency:  [20,  500,  1],
  pulseRate:  [0.25, 50,  0.25],
  pattern:    [0,   10,   1],
}

export { TEMPO_DIVISIONS, TEMPO_MODIFIERS, createTempoSyncConfig }

export const TIMING_PARAM_RANGE = {
  bpm: [TEMPO_MIN_BPM, TEMPO_MAX_BPM, 1],
}

export const TEMPO_SYNC_TARGETS = {
  Martigli: { periodSec: 'duration', targetPeriodSec: 'duration' },
  Symmetry: { rateHz: 'rate' },
  IsochronicTone: { pulseRate: 'rate' },
  BinauralBeat: { beatFreq: 'rate' },
  Geometry: { rotationSpeed: 'signedRate' },
  Particles: { rotationSpeed: 'signedRate' },
  Gradient: { rotationSpeed: 'signedRate' },
  Vibration: { pulseRate: 'rate' },
}

export function tempoSyncKindForTrackParam(track, paramName) {
  return TEMPO_SYNC_TARGETS[track?.trackType ?? track?.type]?.[paramName] ?? null
}

function tempoSyncFor(trackType, paramName) {
  return TEMPO_SYNC_TARGETS[trackType]?.[paramName]
    ? createTempoSyncConfig()
    : undefined
}

function attachTempoSync(param, trackType, paramName) {
  const sync = tempoSyncFor(trackType, paramName)
  return sync ? { ...param, tempoSync: sync } : param
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
    tempoSync: {
      periodSec: createTempoSyncConfig(),
      targetPeriodSec: createTempoSyncConfig(),
    },
    ...overrides,
  }
}

export function createSymmetryTrack(overrides = {}) {
  return {
    id: uid('ctl'),
    type: 'Symmetry',
    name: 'Primary Symmetry',
    nnotes: 4,
    rateHz: 2,
    amplitude: 1.0,
    family: 'plain-hunt',
    tempoSync: {
      rateHz: createTempoSyncConfig(),
    },
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
    : { gain: 0.5, pan: 0, frequency: 200, pulseRate: 10, noteDurationFrac: 0.5 }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of voiceParamNames(trackType)) {
    params[key] = attachTempoSync({ value: merged[key], mods: [] }, trackType, key)
  }
  // Virtual params for center-beat modulation (mods only; value is derived)
  if (trackType === 'BinauralBeat') {
    params.centerFreq = { value: (merged.leftFreq + merged.rightFreq) / 2, mods: [] }
    params.beatFreq   = attachTempoSync({ value: merged.rightFreq - merged.leftFreq, mods: [] }, trackType, 'beatFreq')
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
    params: audioParams(trackType, overrides),
  }
  if (trackType === 'IsochronicTone') {
    base.envelope = 'AR'
    base.noteDurationFrac = overrides.noteDurationFrac ?? 0.5
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
    params[key] = attachTempoSync({ value: merged[key], mods: [] }, 'Geometry', key)
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
  const base = { intensity: 0.5, frequency: 100, pulseRate: 4, pattern: 0 }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of HAPTIC_PARAMS) {
    params[key] = attachTempoSync({ value: merged[key], mods: [] }, 'Vibration', key)
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
    timing: createTiming(),
    playing: false,
    controlTracks: [ctrl],
    audioTracks: [audio],
    visualTracks: [],
    hapticTracks: [],
  }
}

export function createTiming(overrides = {}) {
  return {
    lengthSec: 900,
    bpmEnabled: false,
    beatsPerBar: 4,
    bpm: { value: 60, mods: [] },
    ...overrides,
  }
}

// ── Counts / summary ──────────────────────────────────────────────────────────

export function patchSummary(draft) {
  let modLinks = draft.timing?.bpmEnabled ? (draft.timing?.bpm?.mods?.length ?? 0) : 0
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
  const timing = draft.timing ?? createTiming({
    lengthSec: draft.lengthSec ?? 900,
    bpm: { value: draft.bpm ?? 60, mods: [] },
  })
  const bpmEnabled = !!timing.bpmEnabled
  return {
    model: 'patch-studio-model-1',
    patchName: draft.patchName,
    timing: {
      bpmEnabled,
      bpm: clampBpm(timing.bpm?.value ?? timing.bpm ?? 60),
      bpmMods: bpmEnabled ? (timing.bpm?.mods ?? []) : [],
      beatsPerBar: clampBeatsPerBar(timing.beatsPerBar ?? 4),
      lengthSec: timing.lengthSec ?? 900,
    },
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
  const timing = draft.timing ?? createTiming({
    lengthSec: draft.lengthSec ?? 900,
    bpm: { value: draft.bpm ?? 60, mods: [] },
  })
  const bpmEnabled = !!timing.bpmEnabled

  if (!draft.patchName?.trim()) issues.push(err('Set a patch name.'))
  if (bpmEnabled) {
    const bpm = timing.bpm?.value ?? timing.bpm
    if (Number(bpm) !== clampBpm(bpm)) issues.push(err(`BPM must be ${TEMPO_MIN_BPM}–${TEMPO_MAX_BPM}.`))
    if (clampBeatsPerBar(timing.beatsPerBar) !== Number(timing.beatsPerBar)) {
      issues.push(err(`Beats/bar must be an integer ${TEMPO_MIN_BEATS_PER_BAR}–${TEMPO_MAX_BEATS_PER_BAR}.`))
    }
  }
  if ((timing.lengthSec ?? 0) <= 0) issues.push(err('Length must be > 0 sec.'))
  if (draft.controlTracks.length === 0) issues.push(warn('No control tracks — add a Martigli or Symmetry oscillator.'))

  if (bpmEnabled) {
    for (const mod of timing.bpm?.mods ?? []) {
      if (!ctrlIds.has(mod.controlId)) issues.push(err('BPM: linked control no longer exists.'))
    }
  }

  for (const track of draft.controlTracks) {
    if (track.type === 'Martigli') {
      if ((track.periodSec ?? 0) < 3) issues.push(err(`${track.name}: period must be ≥ 3s (breathing minimum).`))
    }
    if (track.type === 'Symmetry') {
      if ((track.rateHz ?? 0) <= 0) issues.push(err(`${track.name}: rate must be > 0 Hz.`))
      if ((track.rateHz ?? 0) > 50) issues.push(err(`${track.name}: rate exceeds 50 Hz maximum.`))
    }
    if (bpmEnabled) validateTempoSyncMap(issues, track, track.tempoSync ?? {})
  }

  const allSensory = [...draft.audioTracks, ...draft.visualTracks, ...draft.hapticTracks]
  if (allSensory.length === 0) issues.push(warn('No sensory tracks — add at least one audio, visual, or haptic track.'))

  for (const track of allSensory) {
    for (const [paramName, param] of Object.entries(track.params)) {
      if (bpmEnabled) validateParamTempoSync(issues, track, paramName, param)
      for (const mod of param.mods) {
        if (!ctrlIds.has(mod.controlId)) {
          issues.push(err(`${track.name}.${paramName}: linked control no longer exists.`))
        }
      }
    }
  }

  return issues
}

function validateTempoSyncMap(issues, track, syncMap) {
  for (const [paramName, config] of Object.entries(syncMap)) {
    const kind = tempoSyncKindForTrackParam(track, paramName)
    if (!kind && config?.enabled) {
      issues.push(err(`${track.name}.${paramName}: tempo sync is not supported.`))
      continue
    }
    const issue = validateTempoSyncConfig(config)
    if (issue) issues.push(err(`${track.name}.${paramName}: ${issue}.`))
  }
}

function validateParamTempoSync(issues, track, paramName, param) {
  const config = param?.tempoSync
  if (!config) return
  const kind = tempoSyncKindForTrackParam(track, paramName)
  if (!kind && config.enabled) {
    issues.push(err(`${track.name}.${paramName}: tempo sync is not supported.`))
    return
  }
  const issue = validateTempoSyncConfig(config)
  if (issue) issues.push(err(`${track.name}.${paramName}: ${issue}.`))
}

function err(message) { return { level: 'error', message } }
function warn(message) { return { level: 'warning', message } }
