// Canonical model contracts for Patch Studio visual tracks introduced by
// ADR 0046. Spatial source state belongs to the track; the presentation mode,
// camera, eye order, and depth scale belong once to the shared visual stage.

export const COLOR_FIELD_TRACK_TYPE = 'ColorField'
export const SPATIAL_VISUAL_TRACK_TYPES = [
  'DepthMarkers',
  'TreeScene',
  'AbstractScene',
  'LandscapeScene',
]
export const CONFIGURED_VISUAL_TRACK_TYPES = [
  COLOR_FIELD_TRACK_TYPE,
  ...SPATIAL_VISUAL_TRACK_TYPES,
]

export const VISUAL_STAGE_PRESENTATION_MODES = [
  'mono',
  'stereo-pair',
  'anaglyph',
  'autostereogram',
]
export const VISUAL_STAGE_VIEWING_MODES = ['parallel', 'cross']

export const DEPTH_MARKER_GRID_AXES = ['none', 'x', 'y', 'both']
export const ABSTRACT_SCENE_STYLES = ['miro', 'kandinsky', 'klee']
export const LANDSCAPE_SCENE_PALETTES = ['day', 'dusk', 'night']

const VISUAL_STAGE_DEFAULT = {
  presentationMode: 'mono',
  viewingMode: 'parallel',
  backgroundColor: '#07090c',
  depthScalePx: 60,
  zoom: 1,
  strokeWidth: 1,
  depthColor: {
    enabled: false,
    near: '#ffe7a8',
    far: '#274b73',
    strength: 0.75,
  },
  camera: {
    yawDeg: 20,
    autoRotate: false,
    autoRotateSec: 24,
  },
}

const COLOR_FIELD_DEFAULT = {
  color: '#3355ff',
  offColor: '#000000',
  blinkEnabled: false,
}

const DEPTH_MARKERS_DEFAULT = {
  dotSizePx: 16,
  showCartesianPlane: true,
  gridSize: 3,
  gridDepthAxis: 'none',
  // Normalized source-space depth. visualStage.depthScalePx turns this into
  // delivered disparity, so the track does not own a second projector.
  gridDepthRange: 0.4,
  gridDotScaleX: 1,
  gridDotScaleY: 1,
  trajectoryEnabled: false,
  trajectorySteps: 12,
}

const TREE_SCENE_DEFAULT = {
  generatorVersion: 1,
  seed: 1,
  levels: 7,
  branchAngleDeg: 26,
  spread: 0.6,
  leafDensity: 1.4,
  rootLevels: 4,
  showLeaves: true,
  showRoots: true,
  branchColor: '#d8c4a0',
  rootColor: '#9c8161',
  leafColor: '#8ccb6f',
}

const ABSTRACT_SCENE_DEFAULT = {
  generatorVersion: 1,
  seed: 1,
  style: 'miro',
  objectCount: 46,
  sizeScale: 1,
  spread: 0.6,
  lineDensity: 0.28,
}

const LANDSCAPE_SCENE_DEFAULT = {
  generatorVersion: 1,
  seed: 1,
  palette: 'day',
  houses: 5,
  trees: 7,
  flowers: 26,
  hillAmplitude: 0.4,
  riverWidth: 0.16,
  spread: 0.6,
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function finiteNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clampedNumber(value, min, max, fallback) {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)))
}

function clampedInteger(value, min, max, fallback) {
  return Math.min(max, Math.max(min, Math.round(finiteNumber(value, fallback))))
}

function choice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

function boolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

function hexColor(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : fallback
}

function seed(value, fallback) {
  const rounded = Math.round(finiteNumber(value, fallback))
  if (rounded === 0) return fallback
  return Math.min(2147483647, Math.max(-2147483648, rounded))
}

export function createVisualStagePresentation(overrides = {}) {
  return normalizeVisualStagePresentation(overrides)
}

export function normalizeVisualStagePresentation(input) {
  const source = plainObject(input)
  const depthColor = plainObject(source.depthColor)
  const camera = plainObject(source.camera)
  return {
    presentationMode: choice(
      source.presentationMode,
      VISUAL_STAGE_PRESENTATION_MODES,
      VISUAL_STAGE_DEFAULT.presentationMode,
    ),
    viewingMode: choice(
      source.viewingMode,
      VISUAL_STAGE_VIEWING_MODES,
      VISUAL_STAGE_DEFAULT.viewingMode,
    ),
    backgroundColor: hexColor(source.backgroundColor, VISUAL_STAGE_DEFAULT.backgroundColor),
    depthScalePx: clampedNumber(source.depthScalePx, 0, 160, VISUAL_STAGE_DEFAULT.depthScalePx),
    zoom: clampedNumber(source.zoom, 0.4, 1.5, VISUAL_STAGE_DEFAULT.zoom),
    strokeWidth: clampedNumber(source.strokeWidth, 0.5, 3, VISUAL_STAGE_DEFAULT.strokeWidth),
    depthColor: {
      enabled: boolean(depthColor.enabled, VISUAL_STAGE_DEFAULT.depthColor.enabled),
      near: hexColor(depthColor.near, VISUAL_STAGE_DEFAULT.depthColor.near),
      far: hexColor(depthColor.far, VISUAL_STAGE_DEFAULT.depthColor.far),
      strength: clampedNumber(
        depthColor.strength,
        0,
        1,
        VISUAL_STAGE_DEFAULT.depthColor.strength,
      ),
    },
    camera: {
      yawDeg: clampedNumber(camera.yawDeg, 0, 360, VISUAL_STAGE_DEFAULT.camera.yawDeg),
      autoRotate: boolean(camera.autoRotate, VISUAL_STAGE_DEFAULT.camera.autoRotate),
      autoRotateSec: clampedNumber(
        camera.autoRotateSec,
        6,
        90,
        VISUAL_STAGE_DEFAULT.camera.autoRotateSec,
      ),
    },
  }
}

export function createColorFieldConfig(overrides = {}) {
  return normalizeColorFieldConfig(overrides)
}

export function normalizeColorFieldConfig(input) {
  const source = plainObject(input)
  return {
    color: hexColor(source.color, COLOR_FIELD_DEFAULT.color),
    offColor: hexColor(source.offColor, COLOR_FIELD_DEFAULT.offColor),
    blinkEnabled: boolean(source.blinkEnabled, COLOR_FIELD_DEFAULT.blinkEnabled),
  }
}

export function createDepthMarkersConfig(overrides = {}) {
  return normalizeDepthMarkersConfig(overrides)
}

export function normalizeDepthMarkersConfig(input) {
  const source = plainObject(input)
  return {
    dotSizePx: clampedNumber(source.dotSizePx, 6, 40, DEPTH_MARKERS_DEFAULT.dotSizePx),
    showCartesianPlane: boolean(
      source.showCartesianPlane,
      DEPTH_MARKERS_DEFAULT.showCartesianPlane,
    ),
    gridSize: clampedInteger(source.gridSize, 1, 7, DEPTH_MARKERS_DEFAULT.gridSize),
    gridDepthAxis: choice(
      source.gridDepthAxis,
      DEPTH_MARKER_GRID_AXES,
      DEPTH_MARKERS_DEFAULT.gridDepthAxis,
    ),
    gridDepthRange: clampedNumber(
      source.gridDepthRange,
      0,
      4,
      DEPTH_MARKERS_DEFAULT.gridDepthRange,
    ),
    gridDotScaleX: clampedNumber(
      source.gridDotScaleX,
      0.25,
      4,
      DEPTH_MARKERS_DEFAULT.gridDotScaleX,
    ),
    gridDotScaleY: clampedNumber(
      source.gridDotScaleY,
      0.25,
      4,
      DEPTH_MARKERS_DEFAULT.gridDotScaleY,
    ),
    trajectoryEnabled: boolean(
      source.trajectoryEnabled,
      DEPTH_MARKERS_DEFAULT.trajectoryEnabled,
    ),
    trajectorySteps: clampedInteger(
      source.trajectorySteps,
      3,
      36,
      DEPTH_MARKERS_DEFAULT.trajectorySteps,
    ),
  }
}

export function createTreeSceneConfig(overrides = {}) {
  return normalizeTreeSceneConfig(overrides)
}

export function normalizeTreeSceneConfig(input) {
  const source = plainObject(input)
  return {
    generatorVersion: TREE_SCENE_DEFAULT.generatorVersion,
    seed: seed(source.seed, TREE_SCENE_DEFAULT.seed),
    levels: clampedInteger(source.levels, 3, 11, TREE_SCENE_DEFAULT.levels),
    branchAngleDeg: clampedNumber(
      source.branchAngleDeg,
      10,
      55,
      TREE_SCENE_DEFAULT.branchAngleDeg,
    ),
    spread: clampedNumber(source.spread, 0, 1, TREE_SCENE_DEFAULT.spread),
    leafDensity: clampedNumber(
      source.leafDensity,
      0,
      4,
      TREE_SCENE_DEFAULT.leafDensity,
    ),
    rootLevels: clampedInteger(source.rootLevels, 0, 6, TREE_SCENE_DEFAULT.rootLevels),
    showLeaves: boolean(source.showLeaves, TREE_SCENE_DEFAULT.showLeaves),
    showRoots: boolean(source.showRoots, TREE_SCENE_DEFAULT.showRoots),
    branchColor: hexColor(source.branchColor, TREE_SCENE_DEFAULT.branchColor),
    rootColor: hexColor(source.rootColor, TREE_SCENE_DEFAULT.rootColor),
    leafColor: hexColor(source.leafColor, TREE_SCENE_DEFAULT.leafColor),
  }
}

export function createAbstractSceneConfig(overrides = {}) {
  return normalizeAbstractSceneConfig(overrides)
}

export function normalizeAbstractSceneConfig(input) {
  const source = plainObject(input)
  return {
    generatorVersion: ABSTRACT_SCENE_DEFAULT.generatorVersion,
    seed: seed(source.seed, ABSTRACT_SCENE_DEFAULT.seed),
    style: choice(source.style, ABSTRACT_SCENE_STYLES, ABSTRACT_SCENE_DEFAULT.style),
    objectCount: clampedInteger(
      source.objectCount,
      6,
      140,
      ABSTRACT_SCENE_DEFAULT.objectCount,
    ),
    sizeScale: clampedNumber(source.sizeScale, 0.4, 2.2, ABSTRACT_SCENE_DEFAULT.sizeScale),
    spread: clampedNumber(source.spread, 0, 1, ABSTRACT_SCENE_DEFAULT.spread),
    lineDensity: clampedNumber(source.lineDensity, 0, 1, ABSTRACT_SCENE_DEFAULT.lineDensity),
  }
}

export function createLandscapeSceneConfig(overrides = {}) {
  return normalizeLandscapeSceneConfig(overrides)
}

export function normalizeLandscapeSceneConfig(input) {
  const source = plainObject(input)
  return {
    generatorVersion: LANDSCAPE_SCENE_DEFAULT.generatorVersion,
    seed: seed(source.seed, LANDSCAPE_SCENE_DEFAULT.seed),
    palette: choice(
      source.palette,
      LANDSCAPE_SCENE_PALETTES,
      LANDSCAPE_SCENE_DEFAULT.palette,
    ),
    houses: clampedInteger(source.houses, 0, 16, LANDSCAPE_SCENE_DEFAULT.houses),
    trees: clampedInteger(source.trees, 0, 30, LANDSCAPE_SCENE_DEFAULT.trees),
    flowers: clampedInteger(source.flowers, 0, 80, LANDSCAPE_SCENE_DEFAULT.flowers),
    hillAmplitude: clampedNumber(
      source.hillAmplitude,
      0,
      1,
      LANDSCAPE_SCENE_DEFAULT.hillAmplitude,
    ),
    riverWidth: clampedNumber(
      source.riverWidth,
      0,
      0.4,
      LANDSCAPE_SCENE_DEFAULT.riverWidth,
    ),
    spread: clampedNumber(source.spread, 0, 1, LANDSCAPE_SCENE_DEFAULT.spread),
  }
}

const CONFIG_FACTORIES = {
  ColorField: createColorFieldConfig,
  DepthMarkers: createDepthMarkersConfig,
  TreeScene: createTreeSceneConfig,
  AbstractScene: createAbstractSceneConfig,
  LandscapeScene: createLandscapeSceneConfig,
}

const CONFIG_NORMALIZERS = {
  ColorField: normalizeColorFieldConfig,
  DepthMarkers: normalizeDepthMarkersConfig,
  TreeScene: normalizeTreeSceneConfig,
  AbstractScene: normalizeAbstractSceneConfig,
  LandscapeScene: normalizeLandscapeSceneConfig,
}

export function isSpatialVisualTrackType(trackType) {
  return SPATIAL_VISUAL_TRACK_TYPES.includes(trackType)
}

/**
 * Plan the shared-stage topology without pretending independent 3-D sources
 * can be projected separately. Color fields retain their authored order around
 * one spatial-composition boundary, placed at the first enabled spatial track.
 */
export function visualStageLayerPlan(tracks) {
  const layers = []
  let spatialStageAdded = false
  for (const track of Array.isArray(tracks) ? tracks : []) {
    if (track?.enabled === false) continue
    if (track?.trackType === COLOR_FIELD_TRACK_TYPE) {
      layers.push({ kind: 'color', track })
    } else if (isSpatialVisualTrackType(track?.trackType) && !spatialStageAdded) {
      layers.push({ kind: 'spatial' })
      spatialStageAdded = true
    }
  }
  return layers
}

/** ID at which the one shared stage enters the ordinary visual track order. */
export function firstEnabledVisualStageTrackId(tracks) {
  return (Array.isArray(tracks) ? tracks : []).find((track) => (
    track?.enabled !== false
    && (track?.trackType === COLOR_FIELD_TRACK_TYPE || isSpatialVisualTrackType(track?.trackType))
  ))?.id
}

export function createVisualTrackConfig(trackType, overrides = {}) {
  return CONFIG_FACTORIES[trackType]?.(overrides)
}

export function normalizeVisualTrackConfig(trackType, input) {
  return CONFIG_NORMALIZERS[trackType]?.(input)
}
