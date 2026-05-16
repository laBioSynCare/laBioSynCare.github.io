// Real-time scalar evaluation and visualization state for control tracks
// (Martigli / Symmetry). All time inputs MUST come from
// AudioContext.currentTime (CLAUDE.md §3.1).

const TWO_PI = Math.PI * 2

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }
function num(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : fallback }

// Waveform value at a given normalized phase, honoring inhaleRatio for the
// asymmetric duty cycle. Output range: [-1, +1].
export function martigliWaveformValue(waveform, phase, ratio) {
  const r = clamp(ratio, 0.01, 0.99)
  const p = ((phase % 1) + 1) % 1
  if (waveform === 'square') return p < r ? 1 : -1
  if (waveform === 'triangle') {
    return p < r
      ? -1 + 2 * (p / r)
      : 1 - 2 * ((p - r) / (1 - r))
  }
  return p < r
    ? Math.sin(Math.PI * (p / r) - Math.PI / 2)
    : Math.sin(Math.PI * ((p - r) / (1 - r)) + Math.PI / 2)
}

// Build an SVG path string for one waveform cycle, mapped into the box
// x ∈ [xMin, xMax], y centered at yMid with half-height yAmp.
export function martigliPathD(track, xMin, xMax, yMid, yAmp, samples = 60) {
  const ratio = clamp(num(track.inhaleRatio, 0.5), 0.01, 0.99)
  const span = xMax - xMin
  let d = ''
  for (let i = 0; i <= samples; i += 1) {
    const phase = i / samples
    const v = martigliWaveformValue(track.waveform, phase, ratio)
    const x = xMin + span * phase
    const y = yMid - v * yAmp
    d += (i === 0 ? 'M' : ' L') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return d
}

// Compute Martigli state under an active session: integrates the phase
// across the linear period transition from periodSec to targetPeriodSec
// over the session length.
export function computeMartigliState(track, sessionElapsed, sessionLength) {
  const p0 = Math.max(0.001, num(track.periodSec, 10))
  const p1 = Math.max(0.001, num(track.targetPeriodSec, p0))
  const T = Math.max(0.001, num(sessionLength, 1))
  const e = clamp(num(sessionElapsed, 0), 0, T)
  const progress = e / T
  const currentPeriod = p0 + (p1 - p0) * progress

  let cycles
  if (Math.abs(p1 - p0) < 1e-6) {
    cycles = e / p0
  } else {
    const k = (p1 - p0) / T
    cycles = (1 / k) * Math.log((p0 + k * e) / p0)
  }
  const phase = ((cycles % 1) + 1) % 1

  const ratio = clamp(num(track.inhaleRatio, 0.5), 0.01, 0.99)
  const amp = num(track.amplitude, 1)
  const value = amp * martigliWaveformValue(track.waveform, phase, ratio)
  return { phase, value, currentPeriod, progress, amp, ratio }
}

// Free-running Martigli state (used before a session starts). No transition.
export function computeMartigliStateFree(track, t) {
  const period = Math.max(0.001, num(track.periodSec, 10))
  const phase = ((t % period) / period + 1) % 1
  const ratio = clamp(num(track.inhaleRatio, 0.5), 0.01, 0.99)
  const amp = num(track.amplitude, 1)
  const value = amp * martigliWaveformValue(track.waveform, phase, ratio)
  return { phase, value, currentPeriod: period, progress: 0, amp, ratio }
}

export function evaluateSymmetry(track, t) {
  const rate = Math.max(0.0001, num(track.rateHz, 1))
  const depth = num(track.depth, 1)
  const offset = num(track.offset, 0)
  const phase = num(track.phaseDeg, 0) * Math.PI / 180
  return offset + depth * Math.sin(TWO_PI * rate * t + phase)
}

export function evaluateControl(track, t, sessionElapsed, sessionLength) {
  if (!track) return 0
  if (track.type === 'Martigli') {
    const inSession = Number.isFinite(sessionElapsed) && Number.isFinite(sessionLength) && sessionLength > 0
    return inSession
      ? computeMartigliState(track, sessionElapsed, sessionLength).value
      : computeMartigliStateFree(track, t).value
  }
  if (track.type === 'Symmetry') return evaluateSymmetry(track, t)
  return 0
}
