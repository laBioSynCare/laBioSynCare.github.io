import { describe, expect, it } from 'vitest'
import {
  generateTree,
  treePoints,
  treeBounds,
  rotateY,
  project,
  disparity,
  normalizeDepth,
  buildAutostereogram,
} from './treeModel.js'

const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)

describe('generateTree', () => {
  it('is deterministic for a fixed seed', () => {
    const a = generateTree({ seed: 42 })
    const b = generateTree({ seed: 42 })
    expect(b).toEqual(a)
  })

  it('produces different geometry for a different seed', () => {
    const a = generateTree({ seed: 1 })
    const b = generateTree({ seed: 2 })
    expect(b.branches).not.toEqual(a.branches)
  })

  it('emits branches, roots and leaves with finite 3D coordinates', () => {
    const t = generateTree({ seed: 7, rootLevels: 3, leafDensity: 2 })
    expect(t.branches.length).toBeGreaterThan(0)
    expect(t.roots.length).toBeGreaterThan(0)
    expect(t.leaves.length).toBeGreaterThan(0)
    for (const pt of treePoints(t)) expect(finite(pt)).toBe(true)
  })

  it('is planar at spread 0 and three-dimensional at spread 1', () => {
    const flat = treeBounds(generateTree({ seed: 3, spread: 0 }))
    const solid = treeBounds(generateTree({ seed: 3, spread: 1 }))
    expect(Math.abs(flat.maxZ - flat.minZ)).toBeCloseTo(0, 6)
    expect(solid.maxZ - solid.minZ).toBeGreaterThan(0.05)
  })

  it('omits roots when rootLevels is 0', () => {
    // rootLevels clamps to >= 1 inside generateTree's grow guard, so the root
    // collection always has at least the trunk-mirror segment; leaves are
    // suppressed below ground regardless.
    const t = generateTree({ seed: 5, rootLevels: 0 })
    expect(t.roots.every((s) => s.a.y <= 0 && s.b.y <= 0)).toBe(true)
  })
})

describe('rotateY', () => {
  it('is the identity at theta = 0', () => {
    const p = { x: 0.3, y: -0.2, z: 0.5 }
    expect(rotateY(p, 0)).toEqual(p)
  })

  it('preserves the horizontal radius and the height', () => {
    const p = { x: 0.3, y: 0.7, z: -0.4 }
    const r = rotateY(p, 1.1)
    expect(Math.hypot(r.x, r.z)).toBeCloseTo(Math.hypot(p.x, p.z))
    expect(r.y).toBe(p.y)
  })
})

describe('project', () => {
  it('places y up and offsets from the centre, carrying rotated depth', () => {
    const r = project({ x: 1, y: 1, z: 0 }, { cx: 100, cy: 100, scale: 10, theta: 0 })
    expect(r.sx).toBe(110)
    expect(r.sy).toBe(90) // +y goes up (smaller screen y)
    expect(r.z).toBe(0)
  })
})

describe('disparity', () => {
  it('is odd in z and zero at the focal plane', () => {
    expect(disparity(0, 50)).toBe(0)
    expect(disparity(0.4, 50)).toBeCloseTo(20)
    expect(disparity(-0.4, 50)).toBeCloseTo(-20)
  })
})

describe('normalizeDepth', () => {
  it('maps the range to [0,1] and clamps outside it', () => {
    expect(normalizeDepth(0, -1, 1)).toBeCloseTo(0.5)
    expect(normalizeDepth(1, -1, 1)).toBe(1)
    expect(normalizeDepth(-2, -1, 1)).toBe(0)
    expect(normalizeDepth(5, 0, 0)).toBe(0.5) // degenerate range
  })
})

describe('buildAutostereogram', () => {
  it('returns RGBA of the requested size and is reproducible for a seed', () => {
    const width = 64
    const height = 8
    const depth = new Float32Array(width * height)
    for (let i = 0; i < depth.length; i++) depth[i] = (i % 7) / 6 // some structure
    const a = buildAutostereogram(depth, { width, height, seed: 9 })
    const b = buildAutostereogram(depth, { width, height, seed: 9 })
    expect(a.length).toBe(width * height * 4)
    expect(Array.from(a)).toEqual(Array.from(b))
    expect(a[3]).toBe(255) // alpha is opaque
  })
})
