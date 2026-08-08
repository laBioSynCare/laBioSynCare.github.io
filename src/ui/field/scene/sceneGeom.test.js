import { describe, expect, it } from 'vitest'
import {
  project, disparity, rotateY, normalizeDepth, lerpHexColor, parseHexColor,
  scenePoints, rotatedSceneBounds, sceneExtent, sceneFitScale, depthTint, buildAutostereogram,
} from './sceneGeom.js'

const scene = {
  segments: [{ a: { x: -0.5, y: 0, z: -0.5 }, b: { x: 0.5, y: 0.2, z: 0.5 }, width: 0.01, color: '#fff' }],
  dots: [{ x: 0, y: 0.8, z: 0.3, r: 0.05, fill: '#0f0' }],
  polys: [{ pts: [{ x: -0.2, y: -0.2, z: 0 }, { x: 0.2, y: -0.2, z: 0 }, { x: 0, y: 0.2, z: 0 }], fill: '#00f', closed: true }],
}

describe('projection', () => {
  it('places y up and carries rotated depth', () => {
    const r = project({ x: 1, y: 1, z: 0 }, { cx: 100, cy: 100, scale: 10, theta: 0 })
    expect(r.sx).toBe(110)
    expect(r.sy).toBe(90)
    expect(r.z).toBe(0)
  })

  it('rotateY preserves horizontal radius and height', () => {
    const r = rotateY({ x: 0.3, y: 0.7, z: -0.4 }, 0.9)
    expect(Math.hypot(r.x, r.z)).toBeCloseTo(Math.hypot(0.3, -0.4))
    expect(r.y).toBe(0.7)
  })

  it('disparity is odd in z and zero at the focal plane', () => {
    expect(disparity(0, 50)).toBe(0)
    expect(disparity(0.4, 50)).toBeCloseTo(20)
    expect(disparity(-0.4, 50)).toBeCloseTo(-20)
  })

  it('keeps view-plane x and camera-space z independent after yaw', () => {
    const options = { cx: 100, cy: 80, scale: 20, theta: 0.73 }
    const depthScale = 50
    const base = project({ x: 0.2, y: -0.1, z: 0.3 }, options)
    const movedX = project({
      x: 0.2, y: -0.1, z: 0.3, viewOffsetX: 0.4,
    }, options)
    const movedZ = project({
      x: 0.2, y: -0.1, z: 0.3, depthOffset: 0.4,
    }, options)
    const eyes = (point) => ({
      left: point.sx - disparity(point.z, depthScale) / 2,
      right: point.sx + disparity(point.z, depthScale) / 2,
    })
    const midpoint = (pair) => (pair.left + pair.right) / 2
    const separation = (pair) => pair.right - pair.left

    expect(movedX.sx - base.sx).toBeCloseTo(8)
    expect(movedX.z).toBeCloseTo(base.z)
    expect(midpoint(eyes(movedX)) - midpoint(eyes(base))).toBeCloseTo(8)
    expect(separation(eyes(movedX))).toBeCloseTo(separation(eyes(base)))

    expect(movedZ.sx).toBeCloseTo(base.sx)
    expect(movedZ.z - base.z).toBeCloseTo(0.4)
    expect(midpoint(eyes(movedZ))).toBeCloseTo(midpoint(eyes(base)))
    expect(separation(eyes(movedZ)) - separation(eyes(base))).toBeCloseTo(20)
  })
})

describe('scene helpers', () => {
  it('collects every point across primitive types', () => {
    expect(scenePoints(scene)).toHaveLength(2 + 1 + 3)
  })

  it('rotatedSceneBounds spans the scene depth', () => {
    const b = rotatedSceneBounds(scene, 0)
    expect(b.minZ).toBeLessThan(0)
    expect(b.maxZ).toBeGreaterThan(0)
  })

  it('includes camera-space track depth offsets in delivered depth bounds', () => {
    const shifted = {
      segments: [],
      dots: [{ x: 0, y: 0, z: 0, depthOffset: 0.75 }],
      polys: [],
    }
    const bounds = rotatedSceneBounds(shifted, 1.2)
    // Degenerate bounds deliberately expand to the generic fallback; use two
    // offsets so the exact delivered camera-space values remain observable.
    shifted.dots.push({ x: 0, y: 0, z: 0, depthOffset: -0.25 })
    expect(rotatedSceneBounds(shifted, 1.2)).toEqual({ minZ: -0.25, maxZ: 0.75 })
    expect(bounds).toEqual({ minZ: -1, maxZ: 1 })
  })

  it('sceneExtent gives a positive horizontal radius and a height range', () => {
    const e = sceneExtent(scene)
    expect(e.maxR).toBeGreaterThan(0)
    expect(e.maxY).toBeGreaterThan(e.minY)
  })

  it('applies the same shared zoom to every projection backend', () => {
    const extent = { maxR: 1, minY: -1, maxY: 1 }
    const fitted = sceneFitScale(400, 200, extent, 1)
    expect(sceneFitScale(400, 200, extent, 0.5)).toBeCloseTo(fitted * 0.5)
    expect(sceneFitScale(400, 200, extent, 1.5)).toBeCloseTo(fitted * 1.5)
  })
})

describe('colour + depthTint', () => {
  it('lerps and clamps', () => {
    expect(lerpHexColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(lerpHexColor('#000000', '#ffffff', 2)).toBe('#ffffff')
    expect(parseHexColor('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('returns the base colour when shading is off, and tints when on', () => {
    const off = { enabled: false, near: '#ffffff', far: '#000000', strength: 1 }
    const on = { enabled: true, near: '#ffffff', far: '#000000', strength: 1 }
    const bounds = { minZ: -1, maxZ: 1 }
    expect(depthTint(0.5, bounds, off, '#123456')).toBe('#123456')
    // near (z=+1) → white, far (z=-1) → black at full strength.
    expect(depthTint(1, bounds, on, '#123456')).toBe('#ffffff')
    expect(depthTint(-1, bounds, on, '#123456')).toBe('#000000')
  })
})

describe('normalizeDepth + autostereogram', () => {
  it('maps and clamps depth', () => {
    expect(normalizeDepth(0, -1, 1)).toBeCloseTo(0.5)
    expect(normalizeDepth(5, 0, 0)).toBe(0.5)
  })

  it('builds an RGBA buffer of the requested size, reproducible per seed', () => {
    const w = 48
    const h = 6
    const depth = new Float32Array(w * h).map((_, i) => (i % 5) / 4)
    const a = buildAutostereogram(depth, { width: w, height: h, seed: 2 })
    const b = buildAutostereogram(depth, { width: w, height: h, seed: 2 })
    expect(a.length).toBe(w * h * 4)
    expect(Array.from(a)).toEqual(Array.from(b))
  })
})
