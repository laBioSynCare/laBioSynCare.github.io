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

// Plain-hunt change-ringing rows on n bells: starting from rounds [1..n],
// alternate "outside" swaps (positions 0-1, 2-3, …) and "inside" swaps
// (positions 1-2, 3-4, …) for 2n steps; the 2n-th step returns to rounds.
// We return the 2n distinct rows (rounds at index 0).
export function plainHuntRows(n) {
  const size = Math.max(2, Math.floor(n))
  let row = Array.from({ length: size }, (_, i) => i + 1)
  const rows = [row.slice()]
  for (let step = 0; step < 2 * size - 1; step += 1) {
    const next = row.slice()
    if (step % 2 === 0) {
      for (let i = 0; i + 1 < size; i += 2) {
        const tmp = next[i]; next[i] = next[i + 1]; next[i + 1] = tmp
      }
    } else {
      for (let i = 1; i + 1 < size; i += 2) {
        const tmp = next[i]; next[i] = next[i + 1]; next[i + 1] = tmp
      }
    }
    rows.push(next)
    row = next
  }
  return rows
}

const _huntCache = new Map()
function getPlainHunt(n) {
  if (!_huntCache.has(n)) _huntCache.set(n, plainHuntRows(n))
  return _huntCache.get(n)
}

// Compute the Symmetry control state at audio time t.
//   nnotes: 2..8 (sequence size)
//   rateHz: steps per second; one row spans nnotes steps; full cycle = 2·N
//           rows × nnotes steps = 2·N² steps = 2·N² / rateHz seconds.
//   amplitude: output scaling. Value is normalised to [-1, +1] across the
//              note indices 1..N, then multiplied by amplitude.
export function computeSymmetryState(track, t) {
  const N = clamp(Math.round(num(track.nnotes, 4)), 2, 8)
  const rate = Math.max(0.001, num(track.rateHz, 2))
  const amp = num(track.amplitude, 1)
  const rows = getPlainHunt(N)
  const totalRows = rows.length

  const totalSteps = Math.max(0, t) * rate
  const wrapStep = totalSteps % (N * totalRows)
  const rowIdx = Math.floor(wrapStep / N)
  const stepInRow = Math.floor(wrapStep) % N
  const row = rows[rowIdx]
  const note = row[stepInRow]
  const normalized = N > 1 ? (2 * (note - 1) / (N - 1)) - 1 : 0
  const progress = (rowIdx * N + (wrapStep - rowIdx * N)) / (N * totalRows)

  return {
    value: amp * normalized,
    note,
    nnotes: N,
    row,
    rowIdx,
    totalRows,
    stepInRow,
    progress,
  }
}

export function evaluateSymmetry(track, t) {
  return computeSymmetryState(track, t).value
}

export function evaluateControl(track, t, sessionElapsed, sessionLength) {
  if (!track) return 0
  if (track.type === 'Martigli') {
    const inSession = Number.isFinite(sessionElapsed) && Number.isFinite(sessionLength) && sessionLength > 0
    return inSession
      ? computeMartigliState(track, sessionElapsed, sessionLength).value
      : computeMartigliStateFree(track, t).value
  }
  if (track.type === 'Symmetry') {
    const ts = Number.isFinite(sessionElapsed) ? sessionElapsed : t
    return computeSymmetryState(track, ts).value
  }
  return 0
}
