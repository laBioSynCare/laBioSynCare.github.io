import { describe, expect, it } from 'vitest'
import { generateAbstract, ABSTRACT_STYLES } from './abstractScene.js'
import { scenePoints, sceneExtent } from '../scene/sceneGeom.js'

const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)

describe('generateAbstract', () => {
  it('is deterministic for a fixed seed and varies with the seed', () => {
    expect(generateAbstract({ seed: 7 })).toEqual(generateAbstract({ seed: 7 }))
    expect(generateAbstract({ seed: 7 })).not.toEqual(generateAbstract({ seed: 8 }))
  })

  it('emits primitives with finite 3D coordinates', () => {
    const s = generateAbstract({ seed: 3, objectCount: 80, lineDensity: 0.4 })
    const total = s.segments.length + s.dots.length + s.polys.length
    expect(total).toBeGreaterThan(0)
    for (const pt of scenePoints(s)) expect(finite(pt)).toBe(true)
  })

  it('is planar at spread 0 and deep at spread 1', () => {
    const flat = sceneExtent(generateAbstract({ seed: 5, spread: 0 }))
    // maxR includes hypot(x,z); with z = 0 it reduces to |x|, but to test depth
    // directly, check the z-range of points.
    const flatPts = scenePoints(generateAbstract({ seed: 5, spread: 0 }))
    const deepPts = scenePoints(generateAbstract({ seed: 5, spread: 1 }))
    const zr = (pts) => Math.max(...pts.map((p) => p.z)) - Math.min(...pts.map((p) => p.z))
    expect(zr(flatPts)).toBeCloseTo(0, 6)
    expect(zr(deepPts)).toBeGreaterThan(0.3)
    expect(flat.maxR).toBeGreaterThan(0)
  })

  it('gives each style its own background and falls back on a bad style', () => {
    const bgs = new Set(ABSTRACT_STYLES.map((style) => generateAbstract({ style }).background))
    expect(bgs.size).toBe(ABSTRACT_STYLES.length)
    expect(generateAbstract({ style: 'bogus' }).background).toBe(generateAbstract({ style: 'miro' }).background)
  })
})
