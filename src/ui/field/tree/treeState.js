// Stereoscopic Tree state model (/field/tree).
//
// A minimal visual instrument: one procedural 3D tree, viewed through a
// selectable stereoscopic technique. Mirrors the shape and persistence pattern
// of fieldState.js (clamp-on-load, localStorage guarded by `typeof localStorage`,
// per-session-only fields excluded from persistence). Runtime drawing state
// lives in the components, not here.

export const TREE_MODEL = 'sensory-field-tree-model-1'
export const TREE_STORAGE_KEY = 'bsclab.field.tree'

export const TREE_RENDER_MODES = ['stereo-pair', 'autostereogram', 'anaglyph']
export const TREE_VIEWING_MODES = ['parallel', 'cross']

export const LEVELS_MIN = 3
export const LEVELS_MAX = 11
export const BRANCH_ANGLE_MIN_DEG = 10
export const BRANCH_ANGLE_MAX_DEG = 55
export const SPREAD_MIN = 0
export const SPREAD_MAX = 1
export const LEAF_DENSITY_MIN = 0
export const LEAF_DENSITY_MAX = 4
export const ROOT_LEVELS_MIN = 0
export const ROOT_LEVELS_MAX = 6
export const DEPTH_SCALE_MIN_PX = 0
export const DEPTH_SCALE_MAX_PX = 160
export const ZOOM_MIN = 0.4
export const ZOOM_MAX = 1.5
export const STROKE_MIN = 0.5
export const STROKE_MAX = 3
export const YAW_MIN_DEG = 0
export const YAW_MAX_DEG = 360
export const AUTO_ROTATE_SEC_MIN = 6
export const AUTO_ROTATE_SEC_MAX = 90

const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const numberOr = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
const isHexColor = (s) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)

export function createTreeState() {
  return {
    model: TREE_MODEL,
    renderMode: 'stereo-pair',
    viewingMode: 'parallel',
    tree: {
      seed: 1,
      levels: 7,
      branchAngleDeg: 26,
      spread: 0.6,
      leafDensity: 1.4,
      rootLevels: 4,
    },
    depthScalePx: 60,
    zoom: 1,
    strokeWidth: 1,
    showLeaves: true,
    showRoots: true,
    // Depth-cued shading for the free-view stereo pair: each vertex's colour is
    // blended toward a near/far gradient by its (rotated) z. A monocular depth
    // cue on top of binocular disparity; both eyes get the same colour so fusion
    // is unaffected. Does not apply to anaglyph (per-eye channels) or the
    // autostereogram (grayscale dots).
    depthColor: {
      enabled: false,
      near: '#ffe7a8',
      far: '#274b73',
      strength: 0.75,
    },
    rotation: {
      yawDeg: 20,
      autoRotate: false,
      autoRotateSec: 24,
    },
  }
}

function normalizeDepthColor(dc = {}) {
  const base = createTreeState().depthColor
  return {
    enabled: typeof dc.enabled === 'boolean' ? dc.enabled : base.enabled,
    near: isHexColor(dc.near) ? dc.near : base.near,
    far: isHexColor(dc.far) ? dc.far : base.far,
    strength: clamp(numberOr(dc.strength, base.strength), 0, 1),
  }
}

function normalizeTree(tree = {}) {
  const base = createTreeState().tree
  return {
    seed: Math.round(numberOr(tree.seed, base.seed)) || base.seed,
    levels: clamp(Math.round(numberOr(tree.levels, base.levels)), LEVELS_MIN, LEVELS_MAX),
    branchAngleDeg: clamp(numberOr(tree.branchAngleDeg, base.branchAngleDeg), BRANCH_ANGLE_MIN_DEG, BRANCH_ANGLE_MAX_DEG),
    spread: clamp(numberOr(tree.spread, base.spread), SPREAD_MIN, SPREAD_MAX),
    leafDensity: clamp(numberOr(tree.leafDensity, base.leafDensity), LEAF_DENSITY_MIN, LEAF_DENSITY_MAX),
    rootLevels: clamp(Math.round(numberOr(tree.rootLevels, base.rootLevels)), ROOT_LEVELS_MIN, ROOT_LEVELS_MAX),
  }
}

function normalizeRotation(rot = {}) {
  const base = createTreeState().rotation
  return {
    yawDeg: clamp(numberOr(rot.yawDeg, base.yawDeg), YAW_MIN_DEG, YAW_MAX_DEG),
    autoRotate: typeof rot.autoRotate === 'boolean' ? rot.autoRotate : base.autoRotate,
    autoRotateSec: clamp(numberOr(rot.autoRotateSec, base.autoRotateSec), AUTO_ROTATE_SEC_MIN, AUTO_ROTATE_SEC_MAX),
  }
}

/** Coerce an arbitrary (possibly persisted/older) object into a valid state. */
export function normalizeTreeState(input) {
  const base = createTreeState()
  return {
    model: TREE_MODEL,
    renderMode: TREE_RENDER_MODES.includes(input?.renderMode) ? input.renderMode : base.renderMode,
    viewingMode: TREE_VIEWING_MODES.includes(input?.viewingMode) ? input.viewingMode : base.viewingMode,
    tree: normalizeTree(input?.tree),
    depthScalePx: clamp(numberOr(input?.depthScalePx, base.depthScalePx), DEPTH_SCALE_MIN_PX, DEPTH_SCALE_MAX_PX),
    zoom: clamp(numberOr(input?.zoom, base.zoom), ZOOM_MIN, ZOOM_MAX),
    strokeWidth: clamp(numberOr(input?.strokeWidth, base.strokeWidth), STROKE_MIN, STROKE_MAX),
    showLeaves: typeof input?.showLeaves === 'boolean' ? input.showLeaves : base.showLeaves,
    showRoots: typeof input?.showRoots === 'boolean' ? input.showRoots : base.showRoots,
    depthColor: normalizeDepthColor(input?.depthColor),
    rotation: normalizeRotation(input?.rotation),
  }
}

/**
 * Total yaw (radians) at time `t` (seconds): the manual yaw plus, when
 * auto-rotate is on, a steady turn of one revolution per `autoRotateSec`. The
 * caller passes performance.now()/1000 for the free-running visual preview —
 * there is no audio on this page, so this is not AV sync (CLAUDE.md §3.1).
 */
export function resolveYaw(state, t = 0) {
  const rot = normalizeRotation(state?.rotation)
  const manual = rot.yawDeg * DEG
  if (!rot.autoRotate || rot.autoRotateSec <= 0) return manual
  const time = Number.isFinite(t) ? t : 0
  return manual + (time / rot.autoRotateSec) * TWO_PI
}

export function loadTreeState() {
  if (typeof localStorage === 'undefined') return createTreeState()
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY)
    if (!raw) return createTreeState()
    return normalizeTreeState(JSON.parse(raw))
  } catch {
    return createTreeState()
  }
}

export function saveTreeState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(normalizeTreeState(state)))
  } catch {
    // Storage unavailable (private mode / quota) — settings just won't persist.
  }
}
