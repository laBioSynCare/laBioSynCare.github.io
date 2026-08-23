// The framing half of a knowledge-browser deep link.
//
// The node hash (`#sstim-organization:junto-innovation-hub`) says *what* a link
// points at; this module says *how it is framed* when the reader arrives —
// `?zoom=`, `?focus=neighborhood`, and the arrival blink that makes the named
// node findable in a canvas of hundreds.
//
// Pure functions and constants only, no DOM and no cytoscape, so the contract a
// shared URL has to keep is unit-testable on its own. OntologyGraph.svelte is
// the only consumer.

import { FLASH_SAFE_MAX_HZ } from '../safety/flashSafety.js'

// Camera bounds, shared with the cytoscape instance so a link can never ask for
// a scale the canvas refuses.
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export const FOCUS_PARAM_VALUE = 'neighborhood'

/**
 * Read the framing parameters out of a query string.
 *
 * Zoom is the only camera value that can honestly travel in a URL. Pan
 * deliberately cannot: node positions come from a cose layout that is re-run on
 * every load and is not seeded, so a pan coordinate captured here would frame
 * empty canvas on the recipient's screen. The node hash is the anchor — the
 * reader lands centred on that node — and `?zoom=` says how closely. That pair
 * reproduces the sharer's framing independently of layout.
 *
 * @param {string} search `window.location.search`
 * @returns {{ zoom: number|null, neighborhoodFocus: boolean }}
 */
export function parseViewParams(search) {
  const params = new URLSearchParams(search ?? '')
  const raw = Number(params.get('zoom'))
  const zoom = params.get('zoom') !== null && Number.isFinite(raw) && raw > 0
    ? Math.min(Math.max(raw, MIN_ZOOM), MAX_ZOOM)
    : null
  return { zoom, neighborhoodFocus: params.get('focus') === FOCUS_PARAM_VALUE }
}

/**
 * The `?zoom=` value for a live camera scale. Three decimals is finer than the
 * eye can tell apart and keeps the address bar readable.
 * @param {number} zoom
 * @returns {string}
 */
export function formatZoomParam(zoom) {
  return String(Number(Number(zoom).toFixed(3)))
}

// ── Arrival beacon ──────────────────────────────────────────────────────────
// Landing on `#node` selects and centres it, but in a canvas of hundreds of
// nodes a static selection ring reads as "some node is selected", not "this
// one". A short blink resolves that in the first second, before the reader has
// to hunt for it.
//
// The rate is a safety constraint, not a taste one: this is flashing visual
// content in an app whose whole subject is sensory stimulation. One cycle is
// 480 ms — 2.08 Hz, under the three-per-second general-safe ceiling that
// flashSafety.js models from WCAG 2.3.1 / Harding — and pulseRateHz() is
// asserted against FLASH_SAFE_MAX_HZ in the tests so a later tweak to the
// timings cannot quietly cross it.
export const PULSE_CYCLES = 4
export const PULSE_ON_MS = 260
export const PULSE_OFF_MS = 220

// How long the halo is held when it must not blink at all — reduced motion, or
// visual stimulation switched off in Settings. The cue still has to *locate*
// the node, so it is held steady rather than dropped.
export const PULSE_STEADY_MS = 1600

/** @returns {number} flashes per second of the arrival beacon */
export function pulseRateHz() {
  return 1000 / (PULSE_ON_MS + PULSE_OFF_MS)
}

/**
 * The blink as a list of scheduled class toggles, relative to arrival.
 * @param {{ steady?: boolean }} [options] `steady` for reduced motion / visual
 *   stimulation off: one hold, no flashing.
 * @returns {Array<{ at: number, on: boolean }>}
 */
export function pulseSchedule({ steady = false } = {}) {
  if (steady) return [{ at: 0, on: true }, { at: PULSE_STEADY_MS, on: false }]
  const steps = []
  let at = 0
  for (let cycle = 0; cycle < PULSE_CYCLES; cycle++) {
    steps.push({ at, on: true })
    at += PULSE_ON_MS
    steps.push({ at, on: false })
    at += PULSE_OFF_MS
  }
  return steps
}

/** Total duration of the beacon, for callers that need to know when it ends. */
export function pulseDurationMs({ steady = false } = {}) {
  const steps = pulseSchedule({ steady })
  return steps[steps.length - 1].at
}

export { FLASH_SAFE_MAX_HZ }
