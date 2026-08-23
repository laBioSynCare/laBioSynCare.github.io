// Pure SVG-geometry helpers for the Patch Studio track "scope" previews,
// extracted from PresetCreator.svelte. No component / reactive state — inputs
// are plain numbers and envelope specs — so these are unit-testable.
// See docs/technical/PATCH_STUDIO.md §10.2.
import { envelopeValueAt } from '../../engines/audio/VanillaWebAudioEngine.js'
import { ISO_ENVELOPE_DEFAULTS } from './presetDraft.js'

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// ≥ perCycle samples per visible cycle, capped, so a dense-but-still-resolved
// wave reads as a wave, not a bar.
export function adaptiveSamples(cycles, perCycle = 6, base = 200, max = 1500) {
  return Math.max(base, Math.min(max, Math.ceil(Math.abs(cycles) * perCycle)))
}

// Time-base for the L/R rows of a binaural scope: exactly ONE beat period
// (1/|beat|), capped at the user's screen window so very small beats don't make
// the row way too long.
export function binauralRowWindow(beatHz, userWinSec) {
  const absBeat = Math.abs(beatHz)
  if (!Number.isFinite(absBeat) || absBeat < 0.01) return userWinSec
  return Math.min(userWinSec, 1 / absBeat)
}

// Build the effective envelope spec from a track's user-set fields. The only
// auto-adjust we keep is a per-phase minimum (~0.5 ms absolute time) on
// attack/release/decay so they never produce clicks at high pulseRate. We do
// NOT clamp noteDurationFrac or override envelope type — the user's setting is
// final. Reads track.params.pulseRate.value (knob base, not the modulated live
// value) so the envelope shape stays stable under modulation.
export function isoEnvSpec(track, noteDurationOverride = null) {
  const pulseRate = clamp(num(track.params?.pulseRate?.value, 10), 0.5, 50)
  const type = track.envelope ?? 'AR'
  const def = ISO_ENVELOPE_DEFAULTS[type] ?? ISO_ENVELOPE_DEFAULTS.AR
  const rawNoteDuration = noteDurationOverride ?? track.params?.noteDurationFrac?.value ?? track.noteDurationFrac
  const noteDurationFrac = clamp(num(rawNoteDuration, 0.5), 0.01, 1)
  let attackFrac = num(track.attackFrac, def.attackFrac)
  let decayFrac = num(track.decayFrac, def.decayFrac)
  let releaseFrac = num(track.releaseFrac, def.releaseFrac)
  const sustainLevel = clamp(num(track.sustainLevel, def.sustainLevel), 0, 1)

  const noteSec = noteDurationFrac / pulseRate
  if (noteSec > 0) {
    const minPhaseFrac = Math.min(0.4, 0.0005 / noteSec)
    if (attackFrac > 0) attackFrac = Math.max(attackFrac, minPhaseFrac)
    if (releaseFrac > 0) releaseFrac = Math.max(releaseFrac, minPhaseFrac)
    if (decayFrac > 0) decayFrac = Math.max(decayFrac, minPhaseFrac)
  }
  return { type, attackFrac, decayFrac, sustainLevel, releaseFrac, noteDurationFrac }
}

export function rectanglePath(xMin, xMax, yMid, yAmp) {
  const top = (yMid - yAmp).toFixed(1)
  const bot = (yMid + yAmp).toFixed(1)
  return `M${xMin} ${top} L${xMax} ${top} L${xMax} ${bot} L${xMin} ${bot} Z`
}

export function sineWavePath(xMin, xMax, yMid, yAmp, cycles, samples) {
  const s = samples ?? adaptiveSamples(cycles)
  const span = xMax - xMin
  let d = ''
  for (let i = 0; i <= s; i += 1) {
    const u = i / s
    const x = xMin + span * u
    const y = yMid - yAmp * Math.sin(2 * Math.PI * cycles * u)
    d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
}

export function isoEnvelopeOutlinePath(xMin, xMax, yMid, yAmp, envSpec, envCycles, samples = 320) {
  const span = xMax - xMin
  let top = ''
  let bot = ''
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples
    const slotPhase = ((envCycles * u) % 1 + 1) % 1
    const env = envelopeValueAt(envSpec, slotPhase)
    const x = xMin + span * u
    top += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + (yMid - yAmp * env).toFixed(1)
    bot = ' L' + x.toFixed(1) + ' ' + (yMid + yAmp * env).toFixed(1) + bot
  }
  return top + bot + ' Z'
}

export function isoWavePath(xMin, xMax, yMid, yAmp, carrierCycles, envSpec, envCycles, samples) {
  const s = samples ?? adaptiveSamples(carrierCycles)
  const span = xMax - xMin
  let d = ''
  for (let i = 0; i <= s; i += 1) {
    const u = i / s
    const slotPhase = ((envCycles * u) % 1 + 1) % 1
    const env = envelopeValueAt(envSpec, slotPhase)
    const v = env * Math.sin(2 * Math.PI * carrierCycles * u)
    const x = xMin + span * u
    const y = yMid - yAmp * v
    d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
}

export function binauralSumPath(xMin, xMax, yMid, yAmp, leftCycles, rightCycles, samples) {
  const s = samples ?? adaptiveSamples(Math.max(Math.abs(leftCycles), Math.abs(rightCycles)))
  const span = xMax - xMin
  let d = ''
  for (let i = 0; i <= s; i += 1) {
    const u = i / s
    const v = 0.5 * (Math.sin(2 * Math.PI * leftCycles * u) + Math.sin(2 * Math.PI * rightCycles * u))
    const x = xMin + span * u
    const y = yMid - yAmp * v
    d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
}

export function binauralBeatEnvelopePath(xMin, xMax, yMid, yAmp, beatCycles, samples = 240) {
  const span = xMax - xMin
  let top = ''
  let bot = ''
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples
    const env = Math.abs(Math.cos(Math.PI * beatCycles * u))
    const x = xMin + span * u
    top += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + (yMid - yAmp * env).toFixed(1)
    bot = ' L' + x.toFixed(1) + ' ' + (yMid + yAmp * env).toFixed(1) + bot
  }
  return top + bot + ' Z'
}

// Deterministic low-passed noise trace for the Noise scope. Seeded so it does
// not flicker every render; cutoffNorm (0..1) controls how jagged it looks.
export function noisePath(xMin, xMax, yMid, yAmp, cutoffNorm, samples = 120) {
  const span = xMax - xMin
  let seed = 0x2545f491
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x7fffffff) * 2 - 1 }
  const alpha = clamp(cutoffNorm, 0.04, 1)
  let lp = 0
  let d = ''
  for (let i = 0; i <= samples; i += 1) {
    lp += alpha * (rand() - lp)
    const x = xMin + span * (i / samples)
    const y = yMid - yAmp * lp * 1.6
    d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
}

export function polygonPoints(rawSides) {
  const sides = Math.round(clamp(num(rawSides, 3), 3, 12))
  const points = []
  for (let i = 0; i < sides; i += 1) {
    const a = -Math.PI / 2 + (i / sides) * Math.PI * 2
    points.push(`${(40 + Math.cos(a) * 20).toFixed(1)},${(25 + Math.sin(a) * 18).toFixed(1)}`)
  }
  return points.join(' ')
}
