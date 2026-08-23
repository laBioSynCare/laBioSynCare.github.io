// 3D landscape generator for /field/landscape.
//
// A small countryside: receding hills, a winding river, houses, trees, and
// flowers, each placed at a depth d∈[0,1] (0 far, 1 near). Screen height is tied
// to depth (far = higher up, near = lower) for a readable layout, while `spread`
// sets the z extent the shared renderer turns into stereoscopic disparity (flat
// at 0, deep at 1). Elements carry their own colours. Deterministic per seed.

import { mulberry32 } from '../scene/sceneGeom.js'

const TWO_PI = Math.PI * 2

export const LANDSCAPE_PALETTES = ['day', 'dusk', 'night']

const PALETTES = {
  day: {
    sky: '#bfe3f2',
    hills: ['#9fb6c9', '#a7c6ad', '#82b377'],
    ground: '#74a85a',
    river: '#5aa6d8',
    sun: '#fdf3c4',
    houseBodies: ['#cf8f5e', '#d2785a', '#dcc77f', '#b9744d'],
    roof: '#7d4536',
    trunk: '#7a5230',
    canopy: ['#4e8d4a', '#3f7d3e', '#69a256'],
    flowers: ['#e2566f', '#f2c14e', '#e98bbf', '#d96f8f', '#f08a3c'],
  },
  dusk: {
    sky: '#f3c08a',
    hills: ['#b58aa0', '#a8829a', '#8d6f86'],
    ground: '#7c7a5a',
    river: '#caa0c0',
    sun: '#ffd9a0',
    houseBodies: ['#b9774f', '#c46a4f', '#caa05f', '#9c6242'],
    roof: '#5e3b39',
    trunk: '#5f4129',
    canopy: ['#5a7250', '#48603f', '#6e7a4a'],
    flowers: ['#e0607a', '#f0b65a', '#d98bb0', '#cf6f6f', '#e08a4a'],
  },
  night: {
    sky: '#141d33',
    hills: ['#243150', '#1f2c47', '#1a233a'],
    ground: '#1e3a2c',
    river: '#3a6fb0',
    sun: '#e8eefc',
    houseBodies: ['#3b3550', '#473a52', '#5a4a3f', '#33384f'],
    roof: '#21202f',
    trunk: '#2c2436',
    canopy: ['#2c4b3b', '#26402f', '#33543f'],
    flowers: ['#c75d8a', '#d8b75a', '#b07ab0', '#cf6f8f', '#d88a5a'],
  },
}

export const LANDSCAPE_DEFAULTS = {
  seed: 1,
  palette: 'day',
  houses: 5,
  trees: 7,
  flowers: 26,
  hillAmplitude: 0.4,
  riverWidth: 0.16,
  spread: 0.6,
}

// Screen height for a depth d: far (d=0) high up, near (d=1) low.
const groundY = (d) => 0.15 + (-1.0 - 0.15) * d

export function generateLandscape(params = {}) {
  const p = { ...LANDSCAPE_DEFAULTS, ...params }
  const pal = PALETTES[p.palette] ? p.palette : 'day'
  const c = PALETTES[pal]
  const rng = mulberry32(Math.round(p.seed))
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const zOf = (d) => (2 * d - 1) * p.spread // depth → model z

  const segments = []
  const dots = []
  const polys = []

  // Sun / moon, far and high.
  dots.push({ x: -0.55 + rng() * 1.1, y: 0.78, z: zOf(0.02), r: 0.12, fill: c.sun })

  // Receding hill ranges (far → mid). Each spans the width with an undulating top.
  const ranges = 3
  for (let h = 0; h < ranges; h++) {
    const d = 0.05 + (h / ranges) * 0.4
    const z = zOf(d)
    const topY = groundY(d) + 0.45 - h * 0.05
    const amp = p.hillAmplitude * (0.18 + 0.06 * (ranges - h))
    const phase = rng() * TWO_PI
    const freq = 1.4 + rng() * 1.6
    const pts = []
    const steps = 14
    for (let i = 0; i <= steps; i++) {
      const x = -1.15 + (2.3 * i) / steps
      pts.push({ x, y: topY + amp * Math.sin(phase + freq * x), z })
    }
    pts.push({ x: 1.15, y: -1.25, z }, { x: -1.15, y: -1.25, z })
    polys.push({ pts, fill: c.hills[h % c.hills.length], stroke: 'none', strokeWidth: 0, closed: true })
  }

  // Ground plane (near, green) under the foreground.
  {
    const d = 0.55
    const z = zOf(d)
    polys.push({
      pts: [
        { x: -1.2, y: groundY(d) + 0.1, z }, { x: 1.2, y: groundY(d) + 0.1, z },
        { x: 1.2, y: -1.3, z }, { x: -1.2, y: -1.3, z },
      ],
      fill: c.ground, stroke: 'none', strokeWidth: 0, closed: true,
    })
  }

  // Winding river flowing from back to front (a banked polygon strip).
  {
    const steps = 12
    const phase = rng() * TWO_PI
    const left = []
    const right = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const d = 0.42 + t * 0.5 // mid → near
      const z = zOf(d)
      const xc = 0.32 * Math.sin(phase + t * Math.PI * 1.6)
      const y = groundY(d) + 0.06
      const w = p.riverWidth * (0.35 + 1.0 * t) // wider as it nears
      left.push({ x: xc - w, y, z })
      right.push({ x: xc + w, y, z })
    }
    const pts = [...left, ...right.reverse()]
    polys.push({ pts, fill: c.river, stroke: 'none', strokeWidth: 0, closed: true })
  }

  // Houses on the mid-to-near ground.
  function addHouse(x, d, scale) {
    const z = zOf(d)
    const y = groundY(d)
    const w = 0.1 * scale
    const bh = 0.13 * scale
    polys.push({
      pts: [{ x: x - w, y, z }, { x: x + w, y, z }, { x: x + w, y: y + bh, z }, { x: x - w, y: y + bh, z }],
      fill: pick(c.houseBodies), stroke: 'none', strokeWidth: 0, closed: true,
    })
    polys.push({
      pts: [{ x: x - w * 1.2, y: y + bh, z }, { x: x + w * 1.2, y: y + bh, z }, { x, y: y + bh + 0.1 * scale, z }],
      fill: c.roof, stroke: 'none', strokeWidth: 0, closed: true,
    })
    // Door.
    polys.push({
      pts: [{ x: x - w * 0.25, y, z }, { x: x + w * 0.25, y, z }, { x: x + w * 0.25, y: y + bh * 0.55, z }, { x: x - w * 0.25, y: y + bh * 0.55, z }],
      fill: c.roof, stroke: 'none', strokeWidth: 0, closed: true,
    })
  }
  for (let i = 0; i < Math.round(p.houses); i++) {
    addHouse((rng() * 2 - 1) * 0.92, 0.45 + rng() * 0.45, 0.7 + rng() * 0.7)
  }

  // Trees: a trunk plus a small clustered canopy.
  function addTree(x, d, scale) {
    const z = zOf(d)
    const y = groundY(d)
    const th = 0.14 * scale
    segments.push({ a: { x, y, z }, b: { x, y: y + th, z }, width: 0.012 * scale, color: c.trunk })
    const cr = 0.07 * scale
    for (let k = 0; k < 3; k++) {
      dots.push({
        x: x + (rng() * 2 - 1) * cr * 0.6,
        y: y + th + (rng() * 0.6) * cr,
        z: z + (rng() * 2 - 1) * cr * 0.4 * p.spread,
        r: cr * (0.7 + rng() * 0.5), fill: pick(c.canopy),
      })
    }
  }
  for (let i = 0; i < Math.round(p.trees); i++) {
    addTree((rng() * 2 - 1) * 0.95, 0.4 + rng() * 0.55, 0.7 + rng() * 0.8)
  }

  // Flowers near the foreground: a stem and a coloured head.
  function addFlower(x, d, scale) {
    const z = zOf(d)
    const y = groundY(d)
    const sh = 0.05 * scale
    segments.push({ a: { x, y, z }, b: { x, y: y + sh, z }, width: 0.005 * scale, color: c.canopy[1] })
    dots.push({ x, y: y + sh, z, r: 0.018 * scale, fill: pick(c.flowers) })
    dots.push({ x, y: y + sh, z, r: 0.008 * scale, fill: c.sun })
  }
  for (let i = 0; i < Math.round(p.flowers); i++) {
    addFlower((rng() * 2 - 1) * 1.0, 0.62 + rng() * 0.36, 0.7 + rng() * 0.9)
  }

  return { background: c.sky, segments, dots, polys }
}
