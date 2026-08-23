// Shared "view" state for every stereoscopic scene: the technique, depth, and
// rotation controls that are identical across the tree, the abstraction, and the
// landscape. Each scene's own state module composes `createSceneView()` with its
// scene-specific parameters. Mirrors the relevant slice of tree/treeState.js.

export const RENDER_MODES = ['stereo-pair', 'autostereogram', 'anaglyph']
export const VIEWING_MODES = ['parallel', 'cross']

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

export function createSceneView() {
  return {
    renderMode: 'stereo-pair',
    viewingMode: 'parallel',
    depthScalePx: 60,
    zoom: 1,
    strokeWidth: 1,
    // Depth-cued shading for the stereo pair (see sceneGeom.depthTint). Both eyes
    // get the same colour, so fusion is unaffected; ignored by anaglyph (per-eye
    // channels) and the autostereogram (grayscale dots).
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
  const base = createSceneView().depthColor
  return {
    enabled: typeof dc.enabled === 'boolean' ? dc.enabled : base.enabled,
    near: isHexColor(dc.near) ? dc.near : base.near,
    far: isHexColor(dc.far) ? dc.far : base.far,
    strength: clamp(numberOr(dc.strength, base.strength), 0, 1),
  }
}

function normalizeRotation(rot = {}) {
  const base = createSceneView().rotation
  return {
    yawDeg: clamp(numberOr(rot.yawDeg, base.yawDeg), YAW_MIN_DEG, YAW_MAX_DEG),
    autoRotate: typeof rot.autoRotate === 'boolean' ? rot.autoRotate : base.autoRotate,
    autoRotateSec: clamp(numberOr(rot.autoRotateSec, base.autoRotateSec), AUTO_ROTATE_SEC_MIN, AUTO_ROTATE_SEC_MAX),
  }
}

/** Coerce an arbitrary (possibly persisted/older) object into a valid view. */
export function normalizeSceneView(input) {
  const base = createSceneView()
  return {
    renderMode: RENDER_MODES.includes(input?.renderMode) ? input.renderMode : base.renderMode,
    viewingMode: VIEWING_MODES.includes(input?.viewingMode) ? input.viewingMode : base.viewingMode,
    depthScalePx: clamp(numberOr(input?.depthScalePx, base.depthScalePx), DEPTH_SCALE_MIN_PX, DEPTH_SCALE_MAX_PX),
    zoom: clamp(numberOr(input?.zoom, base.zoom), ZOOM_MIN, ZOOM_MAX),
    strokeWidth: clamp(numberOr(input?.strokeWidth, base.strokeWidth), STROKE_MIN, STROKE_MAX),
    depthColor: normalizeDepthColor(input?.depthColor),
    rotation: normalizeRotation(input?.rotation),
  }
}

/**
 * Total yaw (radians) at time `t` (seconds): manual yaw plus, when auto-rotate is
 * on, one revolution per `autoRotateSec`. The caller passes performance.now()/1000
 * for the free-running visual preview — no audio on these pages, so this is not
 * AV sync (CLAUDE.md §3.1 does not apply).
 */
export function resolveYaw(view, t = 0) {
  const rot = normalizeRotation(view?.rotation)
  const manual = rot.yawDeg * DEG
  if (!rot.autoRotate || rot.autoRotateSec <= 0) return manual
  const time = Number.isFinite(t) ? t : 0
  return manual + (time / rot.autoRotateSec) * TWO_PI
}
