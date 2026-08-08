import { describe, expect, it } from 'vitest'
import {
  AUTOSTEREOGRAM_MAX_FPS,
  DEPTH_SIZE_SCALE_MAX,
  DEPTH_SIZE_SCALE_MIN,
  SPATIAL_ROTATION_SPEED_UNIT,
  SPATIAL_SOURCE_CACHE_LIMIT,
  clearSpatialSourceSceneCache,
  composeSpatialTrackScenes,
  createDepthMarkersScene,
  depthSizeScale,
  spatialRenderTime,
  spatialSourceToScene,
  spatialSourceSceneCacheSize,
  spatialTrackUsesControllerTime,
  spatialTrackToScene,
  transformSpatialScene,
} from './spatialScene.js'

function param(value) {
  return { value, mods: [] }
}

function spatialTrack(id, trackType, config = {}, values = {}) {
  return {
    id,
    trackType,
    enabled: true,
    config,
    params: {
      opacity: param(values.opacity ?? 1),
      x: param(values.x ?? 0),
      y: param(values.y ?? 0),
      z: param(values.z ?? 0),
      spatialScale: param(values.spatialScale ?? 1),
      rotationSpeed: param(values.rotationSpeed ?? 0),
    },
    depthAffectsScale: values.depthAffectsScale === true,
  }
}

describe('DepthMarkers neutral scene', () => {
  it('is deterministic and maps grid position to configured depth', () => {
    const config = {
      gridSize: 3,
      gridDepthAxis: 'x',
      gridDepthRange: 0.8,
      gridDotScaleX: 2,
      gridDotScaleY: 0.5,
      showCartesianPlane: true,
    }
    const first = createDepthMarkersScene(config)
    const second = createDepthMarkersScene(config)

    expect(second).toEqual(first)
    expect(first.background).toBeNull()
    expect(first.segments).toHaveLength(3)
    expect(first.dots).toHaveLength(9)
    const gridDot = first.dots.find((dot) => dot.x === 0.5 && dot.y === 0.5)
    expect(gridDot).toMatchObject({ z: 0.4, opacity: 0.45 })
    expect(gridDot.rx).toBeCloseTo(gridDot.r * 2)
    expect(gridDot.ry).toBeCloseTo(gridDot.r * 0.5)
  })

  it('emits a stable trajectory recipe instead of a renderer-owned clock', () => {
    const scene = createDepthMarkersScene({
      gridSize: 1,
      showCartesianPlane: false,
      trajectoryEnabled: true,
      trajectorySteps: 5,
      gridDepthRange: 0.4,
    })

    expect(scene.segments).toEqual([])
    expect(scene.dots).toHaveLength(5)
    expect(scene.dots[0]).toMatchObject({ x: 0, y: 0.28, z: 0, opacity: 0.2 })
    expect(scene.dots.at(-1).opacity).toBeCloseTo(0.9)
  })
})

describe('spatial source conversion', () => {
  it('reuses every deterministic source generator without retaining a projector background', () => {
    const cases = [
      ['TreeScene', { seed: 11, levels: 3, rootLevels: 1 }],
      ['AbstractScene', { seed: 12, objectCount: 6 }],
      ['LandscapeScene', { seed: 13, houses: 1, trees: 1, flowers: 1 }],
    ]

    for (const [trackType, config] of cases) {
      const first = spatialSourceToScene(trackType, config)
      expect(spatialSourceToScene(trackType, config)).toEqual(first)
      expect(first.background).toBeNull()
      expect(first.segments.length + first.dots.length + first.polys.length).toBeGreaterThan(0)
    }
  })

  it('returns an empty neutral scene for a non-spatial visual type', () => {
    expect(spatialSourceToScene('ColorField', { color: '#ffffff' })).toEqual({
      background: null,
      segments: [],
      dots: [],
      polys: [],
    })
  })

  it('caches immutable geometry by normalized config in a bounded cache', () => {
    clearSpatialSourceSceneCache()
    const first = spatialSourceToScene('TreeScene', { seed: 21, levels: 3 })
    const normalizedEquivalent = spatialSourceToScene('TreeScene', {
      seed: 21.1,
      levels: 3,
      unknown: 'discarded',
    })

    expect(normalizedEquivalent).toBe(first)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.segments)).toBe(true)

    for (let seed = 1; seed <= SPATIAL_SOURCE_CACHE_LIMIT + 4; seed += 1) {
      spatialSourceToScene('AbstractScene', { seed, objectCount: 6 })
    }
    expect(spatialSourceSceneCacheSize()).toBe(SPATIAL_SOURCE_CACHE_LIMIT)
  })
})

describe('spatial scene transform and composition', () => {
  it('keeps static sources off the controller-time invalidation path', () => {
    const track = spatialTrack('tree', 'TreeScene', {}, { rotationSpeed: 0 })
    expect(spatialTrackUsesControllerTime(track)).toBe(false)
    expect(spatialTrackUsesControllerTime(track, { rotationSpeed: 0.25 })).toBe(true)
  })

  it('bounds full-frame autostereogram refresh while preserving vector time', () => {
    const time = 1.23456
    expect(spatialRenderTime(time, 'stereo-pair')).toBe(time)
    expect(spatialRenderTime(time, 'autostereogram')).toBe(
      Math.floor(time * AUTOSTEREOGRAM_MAX_FPS) / AUTOSTEREOGRAM_MAX_FPS,
    )
  })

  it('keeps x/y/z as camera-space offsets, transforms sizes, and does not mutate its source', () => {
    const source = {
      background: null,
      segments: [{
        a: { x: 0, y: 1, z: 2 },
        b: { x: 1, y: 2, z: 3 },
        width: 0.1,
        color: '#ffffff',
        opacity: 0.5,
      }],
      dots: [{ x: 1, y: 0, z: -1, r: 0.2, rx: 0.3, ry: 0.1, fill: '#ffffff' }],
      polys: [{
        pts: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }],
        strokeWidth: 0.2,
        opacity: 0.25,
      }],
    }
    const before = structuredClone(source)
    const transformed = transformSpatialScene(source, {
      x: 10,
      y: -2,
      z: 4,
      spatialScale: 2,
      opacity: 0.4,
      rotationSpeed: 0,
      timeSec: 99,
    })

    expect(source).toEqual(before)
    expect(transformed.segments[0]).toMatchObject({
      a: { x: 0, y: 2, z: 4, viewOffsetX: 10, viewOffsetY: -2, depthOffset: 4 },
      b: { x: 2, y: 4, z: 6, viewOffsetX: 10, viewOffsetY: -2, depthOffset: 4 },
      width: 0.2,
      opacity: 0.2,
    })
    expect(transformed.dots[0]).toMatchObject({
      x: 2,
      y: 0,
      z: -2,
      viewOffsetX: 10,
      viewOffsetY: -2,
      depthOffset: 4,
      r: 0.4,
      rx: 0.6,
      ry: 0.2,
      opacity: 0.4,
    })
    expect(transformed.polys[0]).toMatchObject({ strokeWidth: 0.4, opacity: 0.1 })
  })

  it('optionally couples +z/-z to bounded apparent size', () => {
    expect(depthSizeScale(0, true)).toBe(1)
    expect(depthSizeScale(2, true)).toBe(DEPTH_SIZE_SCALE_MAX)
    expect(depthSizeScale(-2, true)).toBe(DEPTH_SIZE_SCALE_MIN)
    expect(depthSizeScale(200, true)).toBe(DEPTH_SIZE_SCALE_MAX)
    expect(depthSizeScale(-200, true)).toBe(DEPTH_SIZE_SCALE_MIN)
    expect(depthSizeScale(2, false)).toBe(1)

    const source = {
      background: null,
      segments: [],
      dots: [{ x: 0, y: 0, z: 0, r: 0.2, fill: '#ffffff' }],
      polys: [],
    }
    const fixed = transformSpatialScene(source, { z: 2, spatialScale: 1 })
    const perspective = transformSpatialScene(source, {
      z: 2,
      spatialScale: 1,
      depthAffectsScale: true,
    })

    expect(fixed.dots[0]).toMatchObject({ r: 0.2, depthOffset: 2 })
    expect(perspective.dots[0]).toMatchObject({ r: 0.4, depthOffset: 2 })
  })

  it('pins local rotation to controller time in turns per second', () => {
    const source = {
      background: null,
      segments: [{
        a: { x: 1, y: 0, z: 0 },
        b: { x: 0, y: 1, z: 0 },
        width: 0.1,
      }],
      dots: [],
      polys: [],
    }
    const values = { rotationSpeed: 0.25, timeSec: 1 }
    const first = transformSpatialScene(source, values)

    expect(SPATIAL_ROTATION_SPEED_UNIT).toBe('turns-per-second')
    expect(transformSpatialScene(source, values)).toEqual(first)
    expect(first.segments[0].a.x).toBeCloseTo(0)
    expect(first.segments[0].a.z).toBeCloseTo(-1)
    expect(source.segments[0].a).toEqual({ x: 1, y: 0, z: 0 })
  })

  it('uses live transform values without changing the authored track', () => {
    const track = spatialTrack('markers', 'DepthMarkers', { gridSize: 1 }, {
      x: -1,
      opacity: 0.8,
    })
    const scene = spatialTrackToScene(track, {
      liveValues: { x: 0.75, y: -0.5, spatialScale: 2, opacity: 0.25 },
    })

    const centralDot = scene.dots.at(-1)
    expect(centralDot).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
      viewOffsetX: 0.75,
      viewOffsetY: -0.5,
      depthOffset: 0,
      opacity: 0.25,
    })
    expect(track.params.x.value).toBe(-1)
    expect(track.params.opacity.value).toBe(0.8)
  })

  it('carries each ordinary track blend mode into vector primitives', () => {
    const track = { ...spatialTrack('markers', 'DepthMarkers', { gridSize: 1 }), blend: 'multiply' }
    const scene = spatialTrackToScene(track)

    expect([...scene.segments, ...scene.dots, ...scene.polys].length).toBeGreaterThan(0)
    expect([...scene.segments, ...scene.dots, ...scene.polys]
      .every((primitive) => primitive.blend === 'multiply')).toBe(true)
  })

  it('merges primitives from multiple ordinary tracks under one stage background', () => {
    const markers = spatialTrack('markers', 'DepthMarkers', {
      gridSize: 1,
      showCartesianPlane: false,
    }, { x: -0.5, opacity: 0.5 })
    const tree = spatialTrack('tree', 'TreeScene', {
      seed: 7,
      levels: 3,
      rootLevels: 1,
      showLeaves: false,
      showRoots: false,
    }, { x: 0.5 })
    const expectedMarkers = spatialTrackToScene(markers)
    const expectedTree = spatialTrackToScene(tree, {
      liveValues: { z: 0.75, rotationSpeed: 0.5 },
      timeSec: 2,
    })
    const composed = composeSpatialTrackScenes(
      [markers, { ...spatialTrack('off', 'LandscapeScene'), enabled: false }, tree],
      {
        backgroundColor: '#123456',
        liveValues: { tree: { z: 0.75, rotationSpeed: 0.5 } },
        timeSec: 2,
      },
    )

    expect(composed.background).toBe('#123456')
    expect(composed.segments).toEqual([...expectedMarkers.segments, ...expectedTree.segments])
    expect(composed.dots).toEqual([...expectedMarkers.dots, ...expectedTree.dots])
    expect(composed.polys).toEqual([...expectedMarkers.polys, ...expectedTree.polys])
  })
})
