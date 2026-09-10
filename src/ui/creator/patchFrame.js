// Pure per-frame computations lifted out of PresetCreator's rafTick.
//
// This follows the rule modulation.js states and the rest of the Studio's
// extractions obey: no component, reactive or engine state crosses this
// boundary. Every input is passed in and every output is returned, so each
// function is unit-testable without a browser.
//
// It exists because the obvious reading of PATCH_STUDIO.md §11.2 — move
// `rafTick` wholesale into patchTransport.js — turns out to be the wrong shape.
// Measured on the real function: 158 lines touching twelve pieces of component
// reactive state with eleven writes, plus nine component-local helpers whose
// entire purpose is injecting reactive reads. A seam for that needs about
// twenty-one members and injects wrappers whose only job is injection, which
// moves the coupling rather than reducing it. Pulling the pure computations out
// and leaving the stateful loop where the state lives is the decomposition this
// codebase already uses everywhere else.

import { computeMartigliState, computeMartigliStateFree, computeSinusoidState, computeSymmetryState } from './controlSignals.js'
import { clampFlashRate } from '../safety/flashSafety.js'
import { clamp } from './tempo.js'

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * The live state of one control track for this frame.
 *
 * `sessionElapsed` is null when nothing is playing, which is what selects the
 * free-running Martigli variant: the control previews keep animating while the
 * transport is stopped, and that is deliberate rather than incidental.
 *
 * `track` is expected to be the tempo-resolved form, since whether a period is
 * tempo-synced is a reactive read the component owns.
 */
export function controlStateFor(track, { sessionElapsed = null, sessionLength = 0, now = 0 } = {}) {
  const playhead = sessionElapsed != null ? sessionElapsed : now
  if (track.type === 'LFO') {
    return sessionElapsed != null
      ? computeMartigliState(track, sessionElapsed, sessionLength)
      : computeMartigliStateFree(track, now)
  }
  if (track.type === 'Permutation') return computeSymmetryState(track, playhead)
  if (track.type === 'Sinusoid') return computeSinusoidState(track, playhead)
  return { value: 0 }
}

/**
 * Seconds to advance free-running visual phase by, given the previous tick.
 *
 * Clamped to 100ms so a backgrounded tab that resumes after ten seconds does
 * not jump a blink through hundreds of cycles in one frame.
 */
export const MAX_VISUAL_FRAME_SEC = 0.1

export function visualFrameDelta(previousTick, now) {
  if (previousTick == null) return 0
  return Math.max(0, Math.min(MAX_VISUAL_FRAME_SEC, now - previousTick))
}

/** Which free-running preview a visual track drives, if any. */
export function visualPhaseKind(track) {
  const type = track.trackType
  if (type === 'Blink') return 'blink'
  if (type === 'ColorField' && track.config?.blinkEnabled === true) return 'blink'
  if (type === 'Oscillate' || type === 'Pacer') return 'osc'
  return null
}

export const BLINK_RATE_LIMITS = [0.01, 40]
export const OSC_RATE_LIMITS = [0.01, 10]
export const DUTY_LIMITS = [0.01, 0.99]

/**
 * Advance one visual track's preview phase by `dt` seconds.
 *
 * Returns the new phase plus the derived preview value, rather than writing
 * either: the caller owns the phase accumulator and the liveValues cache.
 *
 * `live` is that track's modulated values, so a rate being modulated is
 * reflected in the preview. The blink rate passes through the photosensitivity
 * cap (flashSafety.js): above the general-safe ceiling it is clamped unless the
 * author accepted the risk for this session, which is a safety surface and not
 * a preview detail — see PHOTOSENSITIVITY_SAFETY.md §4.
 */
export function advanceVisualPhase(track, { phase = 0, live = {}, dt = 0, flashAccepted = false } = {}) {
  const kind = visualPhaseKind(track)
  if (!kind) return null

  if (kind === 'blink') {
    const rawRate = clamp(num(live.blinkRate ?? track.params.blinkRate?.value, 10), ...BLINK_RATE_LIMITS)
    const rate = clampFlashRate(rawRate, { accepted: flashAccepted })
    const duty = clamp(num(live.duty ?? track.params.duty?.value, 0.5), ...DUTY_LIMITS)
    const next = wrapPhase(phase + dt * rate)
    return { kind, phase: next, blinkOn: next < duty ? 1 : 0 }
  }

  // Oscillate and Pacer both breathe on oscRate (0..1 cosine).
  const rate = clamp(num(live.oscRate ?? track.params.oscRate?.value, 1), ...OSC_RATE_LIMITS)
  const next = wrapPhase(phase + dt * rate)
  return { kind, phase: next, oscVal: 0.5 - 0.5 * Math.cos(2 * Math.PI * next) }
}

function wrapPhase(phase) {
  return phase - Math.floor(phase)
}
