export const TEMPO_MIN_BPM = 1
export const TEMPO_MAX_BPM = 500
export const TEMPO_MIN_BEATS_PER_BAR = 1
export const TEMPO_MAX_BEATS_PER_BAR = 16

export const TEMPO_DIVISIONS = ['bar', '1/1', '1/2', '1/4', '1/8', '1/16', '1/32']
export const TEMPO_MODIFIERS = ['straight', 'dotted', 'triplet']

const DIVISION_BEATS = {
  bar: null,
  '1/1': 4,
  '1/2': 2,
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/32': 0.125,
}

const MODIFIER_MULTIPLIERS = {
  straight: 1,
  dotted: 1.5,
  triplet: 2 / 3,
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function clampBpm(value) {
  return clamp(num(value, 60), TEMPO_MIN_BPM, TEMPO_MAX_BPM)
}

export function clampBeatsPerBar(value) {
  return Math.round(clamp(num(value, 4), TEMPO_MIN_BEATS_PER_BAR, TEMPO_MAX_BEATS_PER_BAR))
}

export function createTempoSyncConfig(overrides = {}) {
  return {
    enabled: false,
    mode: 'division',
    beats: 1,
    division: '1/4',
    modifier: 'straight',
    ...overrides,
  }
}

export function isTempoSyncEnabled(config) {
  return !!config?.enabled
}

export function beatSeconds(bpm) {
  return 60 / clampBpm(bpm)
}

export function barSeconds(bpm, beatsPerBar) {
  return beatSeconds(bpm) * clampBeatsPerBar(beatsPerBar)
}

export function divisionBeats(division, modifier = 'straight', beatsPerBar = 4) {
  const base = division === 'bar'
    ? clampBeatsPerBar(beatsPerBar)
    : DIVISION_BEATS[division]
  const multiplier = MODIFIER_MULTIPLIERS[modifier]
  if (!Number.isFinite(base) || !Number.isFinite(multiplier)) return null
  return base * multiplier
}

export function tempoSyncBeats(config, beatsPerBar = 4) {
  if (!config) return null
  if (config.mode === 'beats') {
    const beats = num(config.beats, 1)
    return beats > 0 ? beats : null
  }
  return divisionBeats(config.division, config.modifier, beatsPerBar)
}

export function tempoSyncDurationSeconds(config, bpm, beatsPerBar = 4) {
  const beats = tempoSyncBeats(config, beatsPerBar)
  if (!Number.isFinite(beats) || beats <= 0) return null
  return beats * beatSeconds(bpm)
}

export function tempoSyncRateHz(config, bpm, beatsPerBar = 4) {
  const duration = tempoSyncDurationSeconds(config, bpm, beatsPerBar)
  return duration && duration > 0 ? 1 / duration : null
}

export function tempoContextFromTiming(timing, liveBpm = null) {
  const bpm = clampBpm(liveBpm ?? timing?.bpm?.value ?? timing?.bpm ?? 60)
  const beatsPerBar = clampBeatsPerBar(timing?.beatsPerBar ?? 4)
  return {
    bpm,
    beatsPerBar,
    beatSec: beatSeconds(bpm),
    barSec: barSeconds(bpm, beatsPerBar),
  }
}

export function tempoValueFromSync(config, kind, tempoContext, fallbackValue = 0) {
  if (!isTempoSyncEnabled(config)) return fallbackValue
  const duration = tempoSyncDurationSeconds(config, tempoContext.bpm, tempoContext.beatsPerBar)
  if (!duration || duration <= 0) return fallbackValue
  if (kind === 'duration') return duration
  const rate = 1 / duration
  if (kind === 'signedRate') {
    const sign = num(fallbackValue, 0) < 0 ? -1 : 1
    return sign * rate
  }
  return rate
}

export function formatTempoSyncReadout(config, kind, tempoContext) {
  if (!isTempoSyncEnabled(config)) return 'free'
  const duration = tempoSyncDurationSeconds(config, tempoContext.bpm, tempoContext.beatsPerBar)
  if (!duration || duration <= 0) return 'invalid'
  if (kind === 'duration') return duration >= 1 ? `${duration.toFixed(2)}s` : `${(duration * 1000).toFixed(0)}ms`
  const rate = 1 / duration
  return rate >= 10 ? `${rate.toFixed(1)} Hz` : `${rate.toFixed(2)} Hz`
}

export function validateTempoSyncConfig(config) {
  if (!config || config.enabled !== true) return null
  if (config.mode !== 'beats' && config.mode !== 'division') return 'tempo sync mode must be beats or division'
  if (config.mode === 'beats') {
    const beats = num(config.beats, NaN)
    if (!Number.isFinite(beats) || beats <= 0) return 'tempo sync beats must be > 0'
  }
  if (config.mode === 'division') {
    if (!TEMPO_DIVISIONS.includes(config.division)) return 'tempo sync division is invalid'
    if (!TEMPO_MODIFIERS.includes(config.modifier)) return 'tempo sync modifier is invalid'
  }
  return null
}

export function evaluateModulatedBpm(bpmParam, controlValues) {
  let bpm = num(bpmParam?.value, 60)
  for (const mod of bpmParam?.mods ?? []) {
    if (mod.enabled === false) continue
    const cv = controlValues.get(mod.controlId)
    if (cv == null) continue
    bpm += (Number(mod.amount) || 0) * cv
  }
  return clampBpm(bpm)
}
