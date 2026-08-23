// Abstract scene generator for /field/abstract.
//
// Scatters flat shape "cards" (discs, rings, stars, blobs, triangles, squares,
// lines, arcs) in 3D space, in the spirit of a Miró / Kandinsky / Paul Klee
// composition. Each object lives at its own z, so the scene has real depth: the
// shared renderer turns z into stereoscopic disparity. `spread` controls the z
// extent (flat at 0, deep at 1). Pure and deterministic for a given seed.

import { mulberry32 } from '../scene/sceneGeom.js'

const TWO_PI = Math.PI * 2

export const ABSTRACT_STYLES = ['miro', 'kandinsky', 'klee']

// Curated palettes + shape vocabularies per style. `shapes` is a weighted bag.
const STYLES = {
  miro: {
    background: '#f2ece1',
    palette: ['#e1322a', '#1f53a8', '#f4c20d', '#1c1c1c', '#178a4c'],
    line: '#1c1c1c',
    shapes: ['blob', 'blob', 'disc', 'dot', 'dot', 'star', 'disc', 'ring'],
  },
  kandinsky: {
    background: '#ece4d3',
    palette: ['#d8412a', '#f2a900', '#2f6db5', '#2c2c2c', '#5aa469', '#8e44ad'],
    line: '#2c2c2c',
    shapes: ['disc', 'ring', 'circles', 'triangle', 'disc', 'arc', 'circles'],
  },
  klee: {
    background: '#e7dab9',
    palette: ['#c2552c', '#d99a3d', '#5a7d8c', '#3b3a36', '#9c6b3f', '#6b8e6e', '#bf8a5b'],
    line: '#3b3a36',
    shapes: ['square', 'square', 'rect', 'triangle', 'square', 'disc', 'rect'],
  },
}

export const ABSTRACT_DEFAULTS = {
  seed: 1,
  style: 'miro',
  objectCount: 46,
  sizeScale: 1,
  spread: 0.6,
  lineDensity: 0.28,
}

// ── Shape builders (return generic primitives at depth z) ───────────────────────
function regularPoly(cx, cy, z, r, sides, rot, fill, stroke, strokeWidth) {
  const pts = []
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TWO_PI
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z })
  }
  return { pts, fill, stroke, strokeWidth, closed: true }
}

function star(cx, cy, z, r, points, rot, fill) {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = rot + (i / (points * 2)) * TWO_PI
    pts.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a), z })
  }
  return { pts, fill, stroke: 'none', strokeWidth: 0, closed: true }
}

function blob(cx, cy, z, r, rng, fill) {
  const n = 8 + Math.floor(rng() * 4)
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI
    const rr = r * (0.7 + rng() * 0.55)
    pts.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a), z })
  }
  return { pts, fill, stroke: 'none', strokeWidth: 0, closed: true }
}

function arc(cx, cy, z, r, rng, color, strokeWidth) {
  const start = rng() * TWO_PI
  const span = (0.4 + rng() * 0.9) * Math.PI
  const n = 10
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = start + (i / n) * span
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z })
  }
  return { pts, fill: 'none', stroke: color, strokeWidth, closed: false }
}

/**
 * Build an abstract scene. Returns the generic primitive model
 * { background, segments, dots, polys }. Deterministic for a fixed seed.
 */
export function generateAbstract(params = {}) {
  const p = { ...ABSTRACT_DEFAULTS, ...params }
  const style = STYLES[p.style] ? p.style : 'miro'
  const cfg = STYLES[style]
  const rng = mulberry32(Math.round(p.seed))
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const color = () => pick(cfg.palette)

  const segments = []
  const dots = []
  const polys = []
  const count = Math.max(1, Math.round(p.objectCount))

  for (let i = 0; i < count; i++) {
    const cx = (rng() * 2 - 1) * 0.92
    const cy = (rng() * 2 - 1) * 0.92
    const z = (rng() * 2 - 1) * p.spread
    const size = (0.06 + rng() * 0.16) * p.sizeScale
    const sw = (0.006 + rng() * 0.01) * p.sizeScale

    // A fraction of objects are connectors: bold lines or arcs.
    if (rng() < p.lineDensity) {
      if (style === 'kandinsky' && rng() < 0.5) {
        polys.push(arc(cx, cy, z, size * 1.5, rng, cfg.line, sw))
      } else {
        const len = (0.18 + rng() * 0.5) * p.sizeScale
        const a = rng() * TWO_PI
        segments.push({
          a: { x: cx - Math.cos(a) * len / 2, y: cy - Math.sin(a) * len / 2, z },
          b: { x: cx + Math.cos(a) * len / 2, y: cy + Math.sin(a) * len / 2, z },
          width: sw * 1.4, color: rng() < 0.7 ? cfg.line : color(),
        })
      }
      continue
    }

    switch (pick(cfg.shapes)) {
      case 'dot':
        dots.push({ x: cx, y: cy, z, r: size * 0.35, fill: color() })
        break
      case 'disc':
        dots.push({ x: cx, y: cy, z, r: size, fill: color() })
        break
      case 'ring':
        dots.push({ x: cx, y: cy, z, r: size, fill: 'none', stroke: color(), strokeWidth: sw * 2 })
        break
      case 'circles': {
        // Concentric Kandinsky discs.
        const base = color()
        dots.push({ x: cx, y: cy, z, r: size, fill: base })
        dots.push({ x: cx, y: cy, z, r: size * 0.6, fill: color() })
        dots.push({ x: cx, y: cy, z, r: size * 0.28, fill: color() })
        break
      }
      case 'star':
        polys.push(star(cx, cy, z, size, 5 + Math.floor(rng() * 2), rng() * TWO_PI, color()))
        break
      case 'blob':
        polys.push(blob(cx, cy, z, size, rng, color()))
        break
      case 'triangle':
        polys.push(regularPoly(cx, cy, z, size, 3, rng() * TWO_PI, color(), 'none', 0))
        break
      case 'square':
        polys.push(regularPoly(cx, cy, z, size, 4, Math.PI / 4, color(), 'none', 0))
        break
      case 'rect': {
        const w = size * (0.7 + rng() * 0.8)
        const h = size * (0.5 + rng() * 0.6)
        polys.push({
          pts: [
            { x: cx - w, y: cy - h, z }, { x: cx + w, y: cy - h, z },
            { x: cx + w, y: cy + h, z }, { x: cx - w, y: cy + h, z },
          ],
          fill: color(), stroke: 'none', strokeWidth: 0, closed: true,
        })
        break
      }
      default:
        dots.push({ x: cx, y: cy, z, r: size, fill: color() })
    }
  }

  return { background: cfg.background, segments, dots, polys }
}
