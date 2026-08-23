// State for /field/landscape: a shared scene `view` plus landscape generation
// `params`. Same persistence pattern as abstract/abstractState.js.

import { createSceneView, normalizeSceneView } from '../scene/sceneView.js'
import { LANDSCAPE_DEFAULTS, LANDSCAPE_PALETTES } from './landscapeScene.js'

export const LANDSCAPE_MODEL = 'sensory-field-landscape-model-1'
export const LANDSCAPE_STORAGE_KEY = 'bsclab.field.landscape'

export const HOUSES_MIN = 0
export const HOUSES_MAX = 16
export const TREES_MIN = 0
export const TREES_MAX = 30
export const FLOWERS_MIN = 0
export const FLOWERS_MAX = 80
export const HILL_AMP_MIN = 0
export const HILL_AMP_MAX = 1
export const RIVER_WIDTH_MIN = 0
export const RIVER_WIDTH_MAX = 0.4
export const SPREAD_MIN = 0
export const SPREAD_MAX = 1

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const numberOr = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function createLandscapeState() {
  return { model: LANDSCAPE_MODEL, view: createSceneView(), params: { ...LANDSCAPE_DEFAULTS } }
}

function normalizeParams(params = {}) {
  const base = LANDSCAPE_DEFAULTS
  return {
    seed: Math.round(numberOr(params.seed, base.seed)) || base.seed,
    palette: LANDSCAPE_PALETTES.includes(params.palette) ? params.palette : base.palette,
    houses: clamp(Math.round(numberOr(params.houses, base.houses)), HOUSES_MIN, HOUSES_MAX),
    trees: clamp(Math.round(numberOr(params.trees, base.trees)), TREES_MIN, TREES_MAX),
    flowers: clamp(Math.round(numberOr(params.flowers, base.flowers)), FLOWERS_MIN, FLOWERS_MAX),
    hillAmplitude: clamp(numberOr(params.hillAmplitude, base.hillAmplitude), HILL_AMP_MIN, HILL_AMP_MAX),
    riverWidth: clamp(numberOr(params.riverWidth, base.riverWidth), RIVER_WIDTH_MIN, RIVER_WIDTH_MAX),
    spread: clamp(numberOr(params.spread, base.spread), SPREAD_MIN, SPREAD_MAX),
  }
}

export function normalizeLandscapeState(input) {
  return {
    model: LANDSCAPE_MODEL,
    view: normalizeSceneView(input?.view),
    params: normalizeParams(input?.params),
  }
}

export function loadLandscapeState() {
  if (typeof localStorage === 'undefined') return createLandscapeState()
  try {
    const raw = localStorage.getItem(LANDSCAPE_STORAGE_KEY)
    if (!raw) return createLandscapeState()
    return normalizeLandscapeState(JSON.parse(raw))
  } catch {
    return createLandscapeState()
  }
}

export function saveLandscapeState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LANDSCAPE_STORAGE_KEY, JSON.stringify(normalizeLandscapeState(state)))
  } catch {
    // Storage unavailable — settings just won't persist.
  }
}
