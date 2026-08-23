// State for /field/abstract: a shared scene `view` (technique/rotation/depth)
// plus the abstraction's generation `params`. Same persistence pattern as
// tree/treeState.js and fieldState.js (clamp on load, localStorage-guarded).

import { createSceneView, normalizeSceneView } from '../scene/sceneView.js'
import { ABSTRACT_DEFAULTS, ABSTRACT_STYLES } from './abstractScene.js'

export const ABSTRACT_MODEL = 'sensory-field-abstract-model-1'
export const ABSTRACT_STORAGE_KEY = 'bsclab.field.abstract'

export const OBJECT_COUNT_MIN = 6
export const OBJECT_COUNT_MAX = 140
export const SIZE_SCALE_MIN = 0.4
export const SIZE_SCALE_MAX = 2.2
export const SPREAD_MIN = 0
export const SPREAD_MAX = 1
export const LINE_DENSITY_MIN = 0
export const LINE_DENSITY_MAX = 1

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const numberOr = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function createAbstractState() {
  return { model: ABSTRACT_MODEL, view: createSceneView(), params: { ...ABSTRACT_DEFAULTS } }
}

function normalizeParams(params = {}) {
  const base = ABSTRACT_DEFAULTS
  return {
    seed: Math.round(numberOr(params.seed, base.seed)) || base.seed,
    style: ABSTRACT_STYLES.includes(params.style) ? params.style : base.style,
    objectCount: clamp(Math.round(numberOr(params.objectCount, base.objectCount)), OBJECT_COUNT_MIN, OBJECT_COUNT_MAX),
    sizeScale: clamp(numberOr(params.sizeScale, base.sizeScale), SIZE_SCALE_MIN, SIZE_SCALE_MAX),
    spread: clamp(numberOr(params.spread, base.spread), SPREAD_MIN, SPREAD_MAX),
    lineDensity: clamp(numberOr(params.lineDensity, base.lineDensity), LINE_DENSITY_MIN, LINE_DENSITY_MAX),
  }
}

export function normalizeAbstractState(input) {
  return {
    model: ABSTRACT_MODEL,
    view: normalizeSceneView(input?.view),
    params: normalizeParams(input?.params),
  }
}

export function loadAbstractState() {
  if (typeof localStorage === 'undefined') return createAbstractState()
  try {
    const raw = localStorage.getItem(ABSTRACT_STORAGE_KEY)
    if (!raw) return createAbstractState()
    return normalizeAbstractState(JSON.parse(raw))
  } catch {
    return createAbstractState()
  }
}

export function saveAbstractState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ABSTRACT_STORAGE_KEY, JSON.stringify(normalizeAbstractState(state)))
  } catch {
    // Storage unavailable — settings just won't persist.
  }
}
