// Pure conversion and composition for Patch Studio's first-class spatial
// visual tracks. Content-specific generators produce neutral scene primitives;
// this module applies the ordinary track transform/opacity contract and merges
// all sources before the shared visual stage projects them.

import {
  isSpatialVisualTrackType,
  normalizeAbstractSceneConfig,
  normalizeDepthMarkersConfig,
  normalizeLandscapeSceneConfig,
  normalizeTreeSceneConfig,
} from './visualTrackModel.js'
import { generateAbstract } from '../field/abstract/abstractScene.js'
import { generateLandscape } from '../field/landscape/landscapeScene.js'
import { generateTree, treeToScene } from '../field/tree/treeModel.js'
import { rotateY } from '../field/scene/sceneGeom.js'

export const DEFAULT_SPATIAL_SCENE_BACKGROUND = '#07090c'
export const SPATIAL_ROTATION_SPEED_UNIT = 'turns-per-second'
export const SPATIAL_SOURCE_CACHE_LIMIT = 32
export const AUTOSTEREOGRAM_MAX_FPS = 8
export const DEPTH_SIZE_SCALE_MIN = 0.5
export const DEPTH_SIZE_SCALE_MAX = 2

const MARKER_COLOR = '#ffffff'
const PLANE_COLOR = '#8a94a3'
const SPATIAL_BLEND_MODES = new Set([
  'screen', 'lighten', 'normal', 'multiply', 'overlay', 'difference',
])
// Scene space is approximately two units high. At a common 400 px stage this
// keeps the legacy pixel-sized marker visually close to its authored size.
const MARKER_PX_TO_SCENE = 1 / 400
const TWO_PI = Math.PI * 2
const sourceSceneCache = new Map()

const finiteNumber = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const clamp01 = (value) => Math.min(1, Math.max(0, finiteNumber(value, 1)))

function emptyScene(background = null) {
  return { background, segments: [], dots: [], polys: [] }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

function cachedScene(key, build) {
  if (sourceSceneCache.has(key)) {
    const scene = sourceSceneCache.get(key)
    // Refresh insertion order so the bounded cache behaves as an LRU.
    sourceSceneCache.delete(key)
    sourceSceneCache.set(key, scene)
    return scene
  }
  const scene = deepFreeze(build())
  sourceSceneCache.set(key, scene)
  if (sourceSceneCache.size > SPATIAL_SOURCE_CACHE_LIMIT) {
    sourceSceneCache.delete(sourceSceneCache.keys().next().value)
  }
  return scene
}

export function clearSpatialSourceSceneCache() {
  sourceSceneCache.clear()
}

export function spatialSourceSceneCacheSize() {
  return sourceSceneCache.size
}

function withoutSourceBackground(scene) {
  return {
    background: null,
    segments: scene?.segments ?? [],
    dots: scene?.dots ?? [],
    polys: scene?.polys ?? [],
  }
}

function gridDepth(x, y, axis, range) {
  if (axis === 'x') return x * range
  if (axis === 'y') return y * range
  if (axis === 'both') return ((x + y) / 2) * range
  return 0
}

/**
 * Build the neutral marker scene used by a DepthMarkers track.
 *
 * The regular grid follows the legacy Field spacing, while the optional
 * trajectory is a deterministic reference loop. Runtime motion can transform
 * the resulting track without introducing a renderer-owned clock.
 */
function buildDepthMarkersScene(config) {
  const scene = emptyScene()
  const radius = config.dotSizePx * MARKER_PX_TO_SCENE / 2

  if (config.showCartesianPlane) {
    scene.segments.push(
      {
        a: { x: -1, y: 0, z: 0 },
        b: { x: 1, y: 0, z: 0 },
        width: 0.004,
        color: PLANE_COLOR,
        opacity: 0.45,
      },
      {
        a: { x: 0, y: -1, z: 0 },
        b: { x: 0, y: 1, z: 0 },
        width: 0.004,
        color: PLANE_COLOR,
        opacity: 0.45,
      },
    )
  }

  for (let column = 1; column <= config.gridSize; column += 1) {
    for (let row = 1; row <= config.gridSize; row += 1) {
      // The central marker is emitted separately below.
      if (2 * column === config.gridSize + 1 && 2 * row === config.gridSize + 1) continue
      const x = (2 * column) / (config.gridSize + 1) - 1
      const y = 1 - (2 * row) / (config.gridSize + 1)
      scene.dots.push({
        x,
        y,
        z: gridDepth(x, y, config.gridDepthAxis, config.gridDepthRange),
        r: radius,
        rx: radius * config.gridDotScaleX,
        ry: radius * config.gridDotScaleY,
        fill: MARKER_COLOR,
        opacity: 0.45,
      })
    }
  }

  if (config.trajectoryEnabled) {
    for (let step = 0; step < config.trajectorySteps; step += 1) {
      const phase = (step / config.trajectorySteps) * TWO_PI
      scene.dots.push({
        x: 0.28 * Math.sin(phase),
        y: 0.28 * Math.cos(phase),
        z: config.gridDepthRange * Math.sin(phase),
        r: radius,
        fill: MARKER_COLOR,
        opacity: 0.2 + 0.7 * (step / Math.max(1, config.trajectorySteps - 1)),
      })
    }
  } else {
    scene.segments.push({
      a: { x: 0, y: radius, z: 0 },
      b: { x: 0, y: radius * 4, z: 0 },
      width: Math.max(0.004, radius * 0.16),
      color: MARKER_COLOR,
      opacity: 0.82,
    })
    scene.dots.push({ x: 0, y: 0, z: 0, r: radius, fill: MARKER_COLOR })
  }

  return scene
}

export function createDepthMarkersScene(input = {}) {
  return spatialSourceToScene('DepthMarkers', input)
}

function normalizeSourceConfig(trackType, input) {
  if (trackType === 'DepthMarkers') return normalizeDepthMarkersConfig(input)
  if (trackType === 'TreeScene') return normalizeTreeSceneConfig(input)
  if (trackType === 'AbstractScene') return normalizeAbstractSceneConfig(input)
  if (trackType === 'LandscapeScene') return normalizeLandscapeSceneConfig(input)
  return null
}

/** Convert one content recipe to the renderer-neutral scene contract. */
export function spatialSourceToScene(trackType, input = {}) {
  const config = normalizeSourceConfig(trackType, input)
  if (!config) return deepFreeze(emptyScene())
  const cacheKey = `${trackType}:${JSON.stringify(config)}`

  return cachedScene(cacheKey, () => {
    if (trackType === 'DepthMarkers') return buildDepthMarkersScene(config)

    if (trackType === 'TreeScene') {
      const tree = generateTree({
        seed: config.seed,
        levels: config.levels,
        branchAngleDeg: config.branchAngleDeg,
        spread: config.spread,
        leafDensity: config.leafDensity,
        rootLevels: config.rootLevels,
      })
      return withoutSourceBackground(treeToScene(tree, {
        branchColor: config.branchColor,
        rootColor: config.rootColor,
        leafColor: config.leafColor,
        showRoots: config.showRoots,
        showLeaves: config.showLeaves,
      }))
    }

    if (trackType === 'AbstractScene') {
      return withoutSourceBackground(generateAbstract(config))
    }

    return withoutSourceBackground(generateLandscape(config))
  })
}

function transformPoint(point, transform) {
  const rotated = rotateY({
    x: finiteNumber(point?.x, 0) * transform.spatialScale,
    y: finiteNumber(point?.y, 0) * transform.spatialScale,
    z: finiteNumber(point?.z, 0) * transform.spatialScale,
  }, transform.rotationRad)
  return {
    ...point,
    x: rotated.x,
    y: rotated.y,
    z: rotated.z,
    // Ordinary track x/y/z are camera-space offsets. The shared projector
    // applies them after camera yaw, keeping planar placement and binocular
    // disparity independent from one another.
    viewOffsetX: finiteNumber(point?.viewOffsetX, 0) + transform.x,
    viewOffsetY: finiteNumber(point?.viewOffsetY, 0) + transform.y,
    depthOffset: finiteNumber(point?.depthOffset, 0) + transform.z,
  }
}

function transformedOpacity(primitive, opacity) {
  return clamp01(clamp01(primitive?.opacity) * opacity)
}

/**
 * Optional perspective cue for a whole track. +z is nearer and grows; -z is
 * farther and shrinks. The exponential mapping is symmetric around z=0 and
 * remains bounded even when a caller bypasses the normal parameter clamp.
 */
export function depthSizeScale(z, enabled = false) {
  if (enabled !== true) return 1
  const factor = 2 ** (finiteNumber(z, 0) / 2)
  return Math.min(DEPTH_SIZE_SCALE_MAX, Math.max(DEPTH_SIZE_SCALE_MIN, factor))
}

/** Apply one ordinary spatial track's transform without mutating its source. */
export function transformSpatialScene(scene, values = {}) {
  const requestedScale = finiteNumber(values.spatialScale, 1)
  const rotationSpeed = finiteNumber(values.rotationSpeed, 0)
  const timeSec = finiteNumber(values.timeSec, 0)
  const z = finiteNumber(values.z, 0)
  const authoredScale = requestedScale > 0 ? requestedScale : 1
  const transform = {
    x: finiteNumber(values.x, 0),
    y: finiteNumber(values.y, 0),
    z,
    spatialScale: authoredScale * depthSizeScale(z, values.depthAffectsScale),
    opacity: clamp01(values.opacity),
    // Match the existing Studio visual contract: 1 means one full turn/sec.
    rotationRad: rotationSpeed * timeSec * TWO_PI,
  }

  return {
    background: scene?.background ?? null,
    segments: (scene?.segments ?? []).map((segment) => ({
      ...segment,
      a: transformPoint(segment.a, transform),
      b: transformPoint(segment.b, transform),
      width: finiteNumber(segment.width, 0.01) * transform.spatialScale,
      opacity: transformedOpacity(segment, transform.opacity),
    })),
    dots: (scene?.dots ?? []).map((dot) => ({
      ...dot,
      ...transformPoint(dot, transform),
      r: finiteNumber(dot.r, 0.01) * transform.spatialScale,
      ...(dot.rx == null ? {} : { rx: finiteNumber(dot.rx, dot.r ?? 0.01) * transform.spatialScale }),
      ...(dot.ry == null ? {} : { ry: finiteNumber(dot.ry, dot.r ?? 0.01) * transform.spatialScale }),
      ...(dot.strokeWidth == null
        ? {}
        : { strokeWidth: finiteNumber(dot.strokeWidth, 0) * transform.spatialScale }),
      opacity: transformedOpacity(dot, transform.opacity),
    })),
    polys: (scene?.polys ?? []).map((poly) => ({
      ...poly,
      pts: (poly.pts ?? []).map((point) => transformPoint(point, transform)),
      ...(poly.strokeWidth == null
        ? {}
        : { strokeWidth: finiteNumber(poly.strokeWidth, 0) * transform.spatialScale }),
      opacity: transformedOpacity(poly, transform.opacity),
    })),
  }
}

function parameterValue(track, liveValues, name, fallback) {
  const live = liveValues?.[name]
  if (Number.isFinite(Number(live))) return Number(live)
  const authored = track?.params?.[name]?.value
  return finiteNumber(authored, fallback)
}

/** Whether a spatial source needs the controller clock for local rotation. */
export function spatialTrackUsesControllerTime(track, liveValues = {}) {
  return Math.abs(parameterValue(track, liveValues, 'rotationSpeed', 0)) > 1e-9
}

/**
 * Bound expensive full-frame autostereogram updates while leaving vector modes
 * on the controller clock. Static scenes use time zero and never call this.
 */
export function spatialRenderTime(timeSec, presentationMode) {
  const time = Math.max(0, finiteNumber(timeSec, 0))
  if (presentationMode !== 'autostereogram') return time
  return Math.floor(time * AUTOSTEREOGRAM_MAX_FPS) / AUTOSTEREOGRAM_MAX_FPS
}

/** Convert and transform one canonical spatial visual track. */
export function spatialTrackToScene(track, { liveValues = {}, timeSec = 0 } = {}) {
  const values = {
    x: parameterValue(track, liveValues, 'x', 0),
    y: parameterValue(track, liveValues, 'y', 0),
    z: parameterValue(track, liveValues, 'z', 0),
    depthAffectsScale: track?.depthAffectsScale === true,
    spatialScale: parameterValue(track, liveValues, 'spatialScale', 1),
    opacity: parameterValue(track, liveValues, 'opacity', 1),
    rotationSpeed: parameterValue(track, liveValues, 'rotationSpeed', 0),
    timeSec,
  }
  const transformed = transformSpatialScene(
    spatialSourceToScene(track?.trackType, track?.config),
    values,
  )
  const blend = SPATIAL_BLEND_MODES.has(track?.blend) ? track.blend : 'normal'
  return {
    ...transformed,
    segments: transformed.segments.map((primitive) => ({ ...primitive, blend })),
    dots: transformed.dots.map((primitive) => ({ ...primitive, blend })),
    polys: transformed.polys.map((primitive) => ({ ...primitive, blend })),
  }
}

/**
 * Compose every enabled spatial visual track into one scene. Array order is
 * retained; the shared renderer may subsequently depth-sort the primitives.
 */
export function composeSpatialTrackScenes(
  tracks,
  {
    liveValues = {},
    backgroundColor = DEFAULT_SPATIAL_SCENE_BACKGROUND,
    timeSec = 0,
  } = {},
) {
  const composed = emptyScene(backgroundColor)
  for (const track of Array.isArray(tracks) ? tracks : []) {
    if (track?.enabled === false) continue
    if (!isSpatialVisualTrackType(track?.trackType)) continue
    const scene = spatialTrackToScene(track, {
      liveValues: liveValues?.[track.id] ?? {},
      timeSec,
    })
    composed.segments.push(...scene.segments)
    composed.dots.push(...scene.dots)
    composed.polys.push(...scene.polys)
  }
  return composed
}
