import { describe, expect, it } from 'vitest'
import { generateLandscape, LANDSCAPE_PALETTES } from './landscapeScene.js'
import { scenePoints } from '../scene/sceneGeom.js'

const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)
const zRange = (pts) => Math.max(...pts.map((p) => p.z)) - Math.min(...pts.map((p) => p.z))

describe('generateLandscape', () => {
  it('is deterministic for a fixed seed and varies with the seed', () => {
    expect(generateLandscape({ seed: 4 })).toEqual(generateLandscape({ seed: 4 }))
    expect(generateLandscape({ seed: 4 })).not.toEqual(generateLandscape({ seed: 5 }))
  })

  it('includes hills/river/houses (polys), trees & flowers (segments), and dots', () => {
    const s = generateLandscape({ seed: 2, houses: 4, trees: 6, flowers: 20 })
    expect(s.polys.length).toBeGreaterThan(4) // hills + ground + river + houses
    expect(s.segments.length).toBeGreaterThan(0) // tree trunks + flower stems
    expect(s.dots.length).toBeGreaterThan(0) // sun + canopies + flower heads
    for (const pt of scenePoints(s)) expect(finite(pt)).toBe(true)
  })

  it('is planar at spread 0 and deep at spread 1', () => {
    expect(zRange(scenePoints(generateLandscape({ seed: 1, spread: 0 })))).toBeCloseTo(0, 6)
    expect(zRange(scenePoints(generateLandscape({ seed: 1, spread: 1 })))).toBeGreaterThan(0.5)
  })

  it('respects element counts and palette choice', () => {
    const none = generateLandscape({ seed: 1, houses: 0, trees: 0, flowers: 0 })
    const some = generateLandscape({ seed: 1, houses: 6, trees: 6, flowers: 6 })
    expect(some.polys.length).toBeGreaterThan(none.polys.length)
    const bgs = new Set(LANDSCAPE_PALETTES.map((palette) => generateLandscape({ palette }).background))
    expect(bgs.size).toBe(LANDSCAPE_PALETTES.length)
  })
})
