// Sensory Field state model.
//
// A minimal "instrument": one full-screen visual field plus an independent
// per-ear audio channel. Static is the f=0 (DC) case; blink/beat add the time
// axis (Step 2). The shape mirrors the per-channel matrix in
// docs/technical/SENSORY_FIELD.md and is what exposureProfile.js serialises to
// an sstim-ex:ExposureProfile.
//
// Persistence mirrors the localStorage-guarded pattern used by skins.js and
// audioEngines.js. Runtime audio nodes live in the component, not here.

export const SENSORY_FIELD_MODEL = 'sensory-field-model-1'
export const FIELD_STORAGE_KEY = 'bsclab.field'

export const NOISE_COLORS = ['white', 'pink', 'brown']
export const BEAT_MODES = ['none', 'monaural', 'binaural']
export const DEPTH_VIEWING_MODES = ['parallel', 'cross']
export const DEPTH_SOURCES = ['static', 'beat', 'breath']

// Tone frequency bounds (Hz) and absolute caps shared with the UI sliders.
export const TONE_MIN_HZ = 50
export const TONE_MAX_HZ = 1000
export const BEAT_MIN_HZ = 0
export const BEAT_MAX_HZ = 40
export const BLINK_MIN_HZ = 0.1
export const BLINK_MAX_HZ = 60
export const DEPTH_SEPARATION_MIN_PX = 0
export const DEPTH_SEPARATION_MAX_PX = 160
export const DEPTH_MODULATION_MIN_PX = 0
export const DEPTH_MODULATION_MAX_PX = 80
export const DEPTH_DOT_MIN_PX = 6
export const DEPTH_DOT_MAX_PX = 40
export const DEPTH_BREATH_MIN_SEC = 3
export const DEPTH_BREATH_MAX_SEC = 30

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const TWO_PI = Math.PI * 2
const numberOr = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function createFieldState() {
  return {
    model: SENSORY_FIELD_MODEL,
    visual: {
      enabled: true,
      color: '#3355ff',
      offColor: '#000000',
      intensity: 0.6,
      blinkEnabled: false,
      blinkRateHz: 1,
      blinkDuty: 0.5,
    },
    depth: {
      enabled: false,
      viewingMode: 'parallel',
      source: 'static',
      baseSeparationPx: 48,
      modulationPx: 18,
      dotSizePx: 16,
      breathPeriodSec: 10,
    },
    audio: {
      enabled: true,
      linkEars: true,
      beatMode: 'none',
      beatRateHz: 4,
      left: createEarState(),
      right: createEarState(),
    },
    // Per-session acknowledgement that the user accepts a flash rate inside the
    // photosensitivity risk band. Never persisted — always re-confirmed.
    flashRiskAccepted: false,
  }
}

function normalizeDepth(depth = {}) {
  const base = createFieldState().depth
  return {
    enabled: typeof depth.enabled === 'boolean' ? depth.enabled : base.enabled,
    viewingMode: DEPTH_VIEWING_MODES.includes(depth.viewingMode) ? depth.viewingMode : base.viewingMode,
    source: DEPTH_SOURCES.includes(depth.source) ? depth.source : base.source,
    baseSeparationPx: clamp(
      numberOr(depth.baseSeparationPx, base.baseSeparationPx),
      DEPTH_SEPARATION_MIN_PX,
      DEPTH_SEPARATION_MAX_PX,
    ),
    modulationPx: clamp(
      numberOr(depth.modulationPx, base.modulationPx),
      DEPTH_MODULATION_MIN_PX,
      DEPTH_MODULATION_MAX_PX,
    ),
    dotSizePx: clamp(
      numberOr(depth.dotSizePx, base.dotSizePx),
      DEPTH_DOT_MIN_PX,
      DEPTH_DOT_MAX_PX,
    ),
    breathPeriodSec: clamp(
      numberOr(depth.breathPeriodSec, base.breathPeriodSec),
      DEPTH_BREATH_MIN_SEC,
      DEPTH_BREATH_MAX_SEC,
    ),
  }
}

function createEarState() {
  return {
    tone: true,
    freqHz: 200,
    noise: false,
    noiseColor: 'pink',
    gain: 0.18,
  }
}

const isHexColor = (s) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)

function normalizeEar(ear = {}) {
  const base = createEarState()
  return {
    tone: typeof ear.tone === 'boolean' ? ear.tone : base.tone,
    freqHz: clamp(Number(ear.freqHz ?? base.freqHz) || base.freqHz, TONE_MIN_HZ, TONE_MAX_HZ),
    noise: typeof ear.noise === 'boolean' ? ear.noise : base.noise,
    noiseColor: NOISE_COLORS.includes(ear.noiseColor) ? ear.noiseColor : base.noiseColor,
    gain: clamp(Number(ear.gain ?? base.gain) || 0, 0, 1),
  }
}

/** Coerce an arbitrary (possibly persisted/older) object into a valid state. */
export function normalizeFieldState(input) {
  const base = createFieldState()
  const v = input?.visual ?? {}
  const a = input?.audio ?? {}
  return {
    model: SENSORY_FIELD_MODEL,
    visual: {
      enabled: typeof v.enabled === 'boolean' ? v.enabled : base.visual.enabled,
      color: isHexColor(v.color) ? v.color : base.visual.color,
      offColor: isHexColor(v.offColor) ? v.offColor : base.visual.offColor,
      intensity: clamp(Number(v.intensity ?? base.visual.intensity) || 0, 0, 1),
      blinkEnabled: typeof v.blinkEnabled === 'boolean' ? v.blinkEnabled : base.visual.blinkEnabled,
      blinkRateHz: clamp(Number(v.blinkRateHz ?? base.visual.blinkRateHz) || base.visual.blinkRateHz, BLINK_MIN_HZ, BLINK_MAX_HZ),
      blinkDuty: clamp(Number(v.blinkDuty ?? base.visual.blinkDuty) || base.visual.blinkDuty, 0.05, 0.95),
    },
    depth: normalizeDepth(input?.depth),
    audio: {
      enabled: typeof a.enabled === 'boolean' ? a.enabled : base.audio.enabled,
      linkEars: typeof a.linkEars === 'boolean' ? a.linkEars : base.audio.linkEars,
      beatMode: BEAT_MODES.includes(a.beatMode) ? a.beatMode : base.audio.beatMode,
      beatRateHz: clamp(Number(a.beatRateHz ?? base.audio.beatRateHz) || 0, BEAT_MIN_HZ, BEAT_MAX_HZ),
      left: normalizeEar(a.left),
      right: normalizeEar(a.right),
    },
    flashRiskAccepted: false,
  }
}

/**
 * Resolve the effective per-ear frequencies, applying the link toggle and the
 * binaural beat split (left = f − beat/2, right = f + beat/2). Returns the
 * concrete values the audio engine and the exposure profile should use.
 */
export function resolveEarFrequencies(state) {
  const { audio } = state
  const left = audio.left.freqHz
  const right = audio.linkEars ? audio.left.freqHz : audio.right.freqHz
  if (audio.beatMode === 'binaural') {
    const center = audio.linkEars ? left : (left + right) / 2
    const half = audio.beatRateHz / 2
    return {
      left: clamp(center - half, TONE_MIN_HZ, TONE_MAX_HZ),
      right: clamp(center + half, TONE_MIN_HZ, TONE_MAX_HZ),
    }
  }
  return { left, right }
}

/**
 * Resolve the delivered stereo point separation, in CSS pixels. The parent
 * component passes AudioContext.currentTime while a session is running.
 */
export function resolveDepthSeparation(state, t = 0) {
  const depth = normalizeDepth(state?.depth)
  const base = depth.baseSeparationPx
  if (!depth.enabled || depth.source === 'static' || depth.modulationPx <= 0) return base

  const time = Number.isFinite(t) ? t : 0
  let rate = 0
  if (depth.source === 'beat') rate = Number(state?.audio?.beatRateHz) || 0
  if (depth.source === 'breath') rate = 1 / depth.breathPeriodSec
  if (rate <= 0) return base

  const value = base + depth.modulationPx * Math.sin(time * rate * TWO_PI)
  return clamp(value, DEPTH_SEPARATION_MIN_PX, DEPTH_SEPARATION_MAX_PX)
}

export function loadFieldState() {
  if (typeof localStorage === 'undefined') return createFieldState()
  try {
    const raw = localStorage.getItem(FIELD_STORAGE_KEY)
    if (!raw) return createFieldState()
    return normalizeFieldState(JSON.parse(raw))
  } catch {
    return createFieldState()
  }
}

export function saveFieldState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    const { flashRiskAccepted, ...persisted } = normalizeFieldState(state)
    localStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // Storage unavailable (private mode / quota) — settings just won't persist.
  }
}
