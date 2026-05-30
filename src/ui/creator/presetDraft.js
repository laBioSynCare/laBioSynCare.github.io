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
export const AUDIO_TRACK_TYPES = ['IsochronicTone', 'BinauralBeat', 'Carrier', 'Noise', 'Drone', 'Sample']

// Built-in ambient sample clips (synthetic CC0 loops in static/audio/).
export const SAMPLE_CLIPS = ['rain', 'ocean', 'wind']

// Audio parameters that can accept modulation
export const AUDIO_PARAMS = ['gain', 'pan', 'frequency', 'pulseRate', 'noteDurationFrac', 'cutoff', 'resonance', 'detune']

// Drone voice-stack sizes (number of detuned oscillators).
export const DRONE_VOICES = [3, 5, 7]

// Noise spectral colours (broadband sources). White is flat power, pink falls
// −3 dB/octave, brown −6 dB/octave (progressively warmer / less harsh).
export const NOISE_COLORS = ['white', 'pink', 'brown']

// Noise shaping-filter modes (applied after the colour source).
export const NOISE_FILTERS = ['lowpass', 'bandpass', 'highpass']

// Knob ranges for audio params [min, max, step]
export const AUDIO_PARAM_RANGE = {
  gain:      [0,    1,     0.01],
  pan:       [-1,   1,     0.01],
  frequency: [20,   2000,  1],
  pulseRate: [0.5,  50,    0.5],
  noteDurationFrac: [0.05, 1,    0.01],
  cutoff:    [100,  12000, 10],
  resonance: [0.3,  18,    0.1],
  detune:    [0,    50,    0.5],   // cents — drone stack spread
  leftFreq:  [20,   2000,  1],
  rightFreq: [20,   2000,  1],
  // Virtual params for BinauralBeat center-beat modulation
  centerFreq: [20,  2000,  1],
  beatFreq:   [-50, 50,    0.5],
}

// Canonical (audible & modulatable) params per voice type. BinauralBeat owns
// leftFreq and rightFreq INDEPENDENTLY — center/beat are derived for display
// only. No pan on Binaural (the two carriers are hard-panned L/R by definition;
// a user pan stage defeats the binaural effect). No pulseRate on Carrier. Noise
// is a broadband source shaped by a low-pass cutoff (modulatable for sweeps).
export const VOICE_PARAMS = {
  Carrier:        ['gain', 'pan', 'frequency'],
  IsochronicTone: ['gain', 'pan', 'frequency', 'pulseRate', 'noteDurationFrac'],
  BinauralBeat:   ['gain', 'leftFreq', 'rightFreq'],
  Noise:          ['gain', 'pan', 'cutoff', 'resonance'],
  Drone:          ['gain', 'pan', 'frequency', 'detune'],
  Sample:         ['gain', 'pan'],
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

// Tremolo / amplitude modulation, available on ANY audio track. 'linear' is
// linear in amplitude; 'exponential' is linear in perceived loudness (dB).
export const TREMOLO_MODES = ['exponential', 'linear']

export const TREMOLO_PARAM_RANGE = {
  rate:  [0.05, 30, 0.05],  // Hz
  depth: [0,    1,  0.01],  // 0 = none … 1 = full
}

export function createTremolo(overrides = {}) {
  return { enabled: false, rate: 4, depth: 0.5, mode: 'exponential', ...overrides }
}

// Visual track types
export const VISUAL_TRACK_TYPES = ['Geometry', 'Particles', 'Gradient', 'Blink', 'Oscillate', 'Pacer', 'Ripple', 'Spiral', 'Mandala']

// Visual parameters that can accept modulation (full registry across all types)
export const VISUAL_PARAMS = ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue', 'blinkRate', 'duty', 'oscRate']

// Knob ranges for visual params [min, max, step]
export const VISUAL_PARAM_RANGE = {
  opacity:       [0,    1,    0.01],
  scale:         [0,    4,    0.01],
  rotationSpeed: [-2,   2,    0.01],
  sides:         [3,    12,   1],
  hue:           [0,    360,  1],
  blinkRate:     [0.5,  40,   0.5],   // Hz — photic flicker rate
  duty:          [0.05, 0.95, 0.01],  // on-fraction of each blink cycle
  oscRate:       [0.05, 10,   0.05],  // Hz — sinusoidal oscillation rate
}

// Modulatable params per visual track type. The three legacy types keep the
// original shared set; Blink and Oscillate expose their own controls.
export const VISUAL_VOICE_PARAMS = {
  Geometry:  ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue'],
  Particles: ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue'],
  Gradient:  ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue'],
  Blink:     ['opacity', 'blinkRate', 'duty', 'hue'],
  Oscillate: ['opacity', 'scale', 'oscRate', 'hue'],
  Pacer:     ['opacity', 'scale', 'oscRate', 'hue'],
  Ripple:    ['opacity', 'scale', 'oscRate', 'hue'],
  Spiral:    ['opacity', 'scale', 'rotationSpeed', 'hue'],
  Mandala:   ['opacity', 'scale', 'rotationSpeed', 'sides', 'hue'],
}

// Blend modes for layering visual tracks in the mixed/fullscreen view.
export const BLEND_MODES = ['screen', 'lighten', 'normal', 'multiply', 'overlay', 'difference']

// Per-type default overrides (e.g. a breathing pacer wants a slow rate).
export const VISUAL_DEFAULTS = {
  Pacer:   { oscRate: 0.15, scale: 1.7 },
  Ripple:  { oscRate: 0.6 },
  Spiral:  { rotationSpeed: 0.4 },
  Mandala: { sides: 6, rotationSpeed: 0.15 },
}

export function visualParamNames(trackType) {
  return VISUAL_VOICE_PARAMS[trackType] ?? VISUAL_VOICE_PARAMS.Geometry
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
  Blink: { blinkRate: 'rate' },
  Oscillate: { oscRate: 'rate' },
  Pacer: { oscRate: 'rate' },
  Ripple: { oscRate: 'rate' },
  Spiral: { rotationSpeed: 'signedRate' },
  Mandala: { rotationSpeed: 'signedRate' },
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
  let base
  if (trackType === 'BinauralBeat') base = { gain: 0.5, leftFreq: 200, rightFreq: 210 }
  else if (trackType === 'Noise') base = { gain: 0.3, pan: 0, cutoff: 6000, resonance: 0.707 }
  else if (trackType === 'Drone') base = { gain: 0.3, pan: 0, frequency: 110, detune: 12 }
  else if (trackType === 'Sample') base = { gain: 0.4, pan: 0 }
  else base = { gain: 0.5, pan: 0, frequency: 200, pulseRate: 10, noteDurationFrac: 0.5 }
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
    tremolo: createTremolo(overrides.tremolo),
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
  if (trackType === 'Noise') {
    base.noiseColor = overrides.noiseColor ?? 'pink'
    base.noiseFilter = overrides.noiseFilter ?? 'lowpass'
  }
  if (trackType === 'Drone') {
    base.droneVoices = overrides.droneVoices ?? 5
  }
  if (trackType === 'Sample') {
    base.sampleId = overrides.sampleId ?? 'rain'
  }
  return { ...base, ...overrides }
}

// ── Visual tracks ─────────────────────────────────────────────────────────────

function visualParams(trackType = 'Geometry', defaults = {}) {
  const base = {
    opacity: 1, scale: 1, rotationSpeed: 0.1, sides: 3, hue: 200,
    blinkRate: 10, duty: 0.5, oscRate: 1,
  }
  const merged = { ...base, ...defaults }
  const params = {}
  for (const key of visualParamNames(trackType)) {
    params[key] = attachTempoSync({ value: merged[key], mods: [] }, trackType, key)
  }
  return params
}

export function createVisualTrack(trackType = 'Geometry', overrides = {}) {
  return {
    id: uid('visual'),
    trackType,
    name: trackType,
    blend: overrides.blend ?? 'screen',
    params: visualParams(trackType, VISUAL_DEFAULTS[trackType]),
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
