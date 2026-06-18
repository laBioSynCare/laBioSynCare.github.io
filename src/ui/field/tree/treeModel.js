// 3D tree geometry for the Stereoscopic Tree instrument (/field/tree).
//
// Pure, framework-free. A single procedural tree lives in normalized 3D space
// (origin at the trunk base, +y up, +z toward the viewer). Three renderers in
// TreeStage.svelte share this one model and differ only in how they project z to
// screen: a free-view stereo pair, an anaglyph, and a random-dot autostereogram.
//
// Depth (z) is the parameter that makes the tree genuinely 3D. The `spread`
// generation knob controls how far branches tilt out of the x-y plane: at
// spread = 0 the tree is planar (z = 0 everywhere, flat) and at spread = 1 the
// branching is fully three-dimensional. Screen depth then maps to horizontal
// disparity, the same physical cue the Sensory Field uses for its markers
// (FieldStage.svelte `--offset`), with the focal plane at z = 0.

const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180
const WORLD_Z = { x: 0, y: 0, z: 1 }

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
// mulberry32: tiny, fast, good enough for procedural geometry and fully
// deterministic for a given seed (so a tree is reproducible and testable).
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Vector helpers ──────────────────────────────────────────────────────────
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const len = (v) => Math.hypot(v.x, v.y, v.z)
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})
function normalize(v) {
  const l = len(v) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

// Rodrigues rotation of v about a unit axis by `angle` radians.
function rotateAboutAxis(v, axis, angle) {
  const u = normalize(axis)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const dot = u.x * v.x + u.y * v.y + u.z * v.z
  const cr = cross(u, v)
  return {
    x: v.x * c + cr.x * s + u.x * dot * (1 - c),
    y: v.y * c + cr.y * s + u.y * dot * (1 - c),
    z: v.z * c + cr.z * s + u.z * dot * (1 - c),
  }
}

// ── Tree generation ───────────────────────────────────────────────────────────
export const TREE_GEN_DEFAULTS = {
  seed: 1,
  levels: 8,
  branchSplit: 2,
  branchAngleDeg: 26,
  lengthRatio: 0.74,
  spread: 0.6,
  trunkLength: 0.42,
  trunkWidth: 0.05,
  leafDensity: 1.4,
  rootLevels: 4,
}

/**
 * Build a 3D tree. Returns geometry in normalized units:
 *   { branches:[{a,b,width}], roots:[{a,b,width}], leaves:[{x,y,z,r}] }
 * where a/b are {x,y,z} segment endpoints. Deterministic for a fixed seed.
 */
export function generateTree(params = {}) {
  const p = { ...TREE_GEN_DEFAULTS, ...params }
  const rng = mulberry32(Math.round(p.seed))
  const branches = []
  const roots = []
  const leaves = []

  // Grow a recursive branching system from `origin` along unit `dir`.
  function grow(origin, dir, length, width, depthLeft, collection, makeLeaves) {
    const end = {
      x: origin.x + dir.x * length,
      y: origin.y + dir.y * length,
      z: origin.z + dir.z * length,
    }
    collection.push({ a: origin, b: end, width })

    if (depthLeft <= 1 || length < 0.02) {
      if (makeLeaves) addLeaves(end, dir)
      return
    }

    const n = Math.max(2, Math.round(p.branchSplit))
    const fan = p.branchAngleDeg * DEG
    for (let i = 0; i < n; i++) {
      // Fan within the x-y (screen) plane: rotation about world-z keeps z fixed,
      // so at spread = 0 the whole tree stays planar.
      const side = (i % 2 === 0) ? 1 : -1
      const inPlane = fan * side * (0.55 + 0.6 * rng())
      let cd = rotateAboutAxis(dir, WORLD_Z, inPlane)
      // Tilt out of the plane toward ±z, scaled by `spread` — the 3D knob.
      let tiltAxis = cross(WORLD_Z, cd)
      if (len(tiltAxis) < 1e-4) tiltAxis = { x: 1, y: 0, z: 0 }
      const tilt = (rng() * 2 - 1) * fan * 1.6 * p.spread
      cd = normalize(rotateAboutAxis(cd, tiltAxis, tilt))
      const childLen = length * p.lengthRatio * (0.85 + 0.3 * rng())
      grow(end, cd, childLen, width * 0.68, depthLeft - 1, collection, makeLeaves)
    }
  }

  // Scatter leaves around a branch tip. In-plane (x,y) jitter is always present;
  // the depth (z) jitter is scaled by `spread` so spread = 0 stays planar.
  function addLeaves(tip, dir) {
    const count = Math.round(p.leafDensity + rng() * p.leafDensity)
    for (let i = 0; i < count; i++) {
      const j = 0.05
      leaves.push({
        x: tip.x + dir.x * 0.03 + (rng() * 2 - 1) * j,
        y: tip.y + dir.y * 0.03 + (rng() * 2 - 1) * j,
        z: tip.z + dir.z * 0.03 + (rng() * 2 - 1) * j * p.spread,
        r: 0.018 + rng() * 0.014,
      })
    }
  }

  const base = { x: 0, y: -0.05, z: 0 }
  grow(base, { x: 0, y: 1, z: 0 }, p.trunkLength, p.trunkWidth, p.levels, branches, true)
  // Roots: a shorter, leafless system mirrored below ground.
  const rootDepth = Math.max(1, Math.round(p.rootLevels))
  grow(base, { x: 0, y: -1, z: 0 }, p.trunkLength * 0.7, p.trunkWidth, rootDepth, roots, false)

  return { branches, roots, leaves }
}

/** Every (x,y,z) point in the tree, for bounds and rasterization. */
export function treePoints(tree) {
  const pts = []
  for (const s of tree.branches) { pts.push(s.a, s.b) }
  for (const s of tree.roots) { pts.push(s.a, s.b) }
  for (const l of tree.leaves) pts.push(l)
  return pts
}

/** Axis-aligned bounds of the tree geometry. */
export function treeBounds(tree) {
  const b = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
  }
  for (const pt of treePoints(tree)) {
    if (pt.x < b.minX) b.minX = pt.x
    if (pt.x > b.maxX) b.maxX = pt.x
    if (pt.y < b.minY) b.minY = pt.y
    if (pt.y > b.maxY) b.maxY = pt.y
    if (pt.z < b.minZ) b.minZ = pt.z
    if (pt.z > b.maxZ) b.maxZ = pt.z
  }
  return b
}

// ── Projection ────────────────────────────────────────────────────────────────
/** Yaw rotation about the vertical (y) axis — makes 3D structure legible. */
export function rotateY(p, theta) {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }
}

/**
 * Orthographic screen projection of a model point. Returns the base screen
 * position (no stereo disparity) plus the rotated depth `z`, which the renderers
 * turn into horizontal disparity. Orthographic keeps disparity a pure function
 * of z, which fuses more comfortably in free-view than perspective.
 */
export function project(p, { cx = 0, cy = 0, scale = 1, theta = 0 } = {}) {
  const r = rotateY(p, theta)
  return { sx: cx + scale * r.x, sy: cy - scale * r.y, z: r.z }
}

/**
 * Horizontal disparity (px) for a rotated depth `z`. Odd in z and zero at the
 * focal plane (z = 0): points in front and behind separate in opposite
 * directions. `depthScale` is px per unit of model depth.
 */
export function disparity(z, depthScale) {
  return z * depthScale
}

/** Map a model depth into [0,1] (near = 1) for the autostereogram depth buffer. */
export function normalizeDepth(z, zMin, zMax) {
  if (!(zMax > zMin)) return 0.5
  const t = (z - zMin) / (zMax - zMin)
  return t < 0 ? 0 : t > 1 ? 1 : t
}

// ── Colour helpers (depth-cued shading) ─────────────────────────────────────────
const clampByte = (n) => (n < 0 ? 0 : n > 255 ? 255 : n)

/** Parse `#rgb` or `#rrggbb` into { r, g, b } (0..255); invalid → black. */
export function parseHexColor(hex) {
  let h = String(hex ?? '').replace('#', '').trim()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  if (h.length !== 6 || Number.isNaN(n)) return { r: 0, g: 0, b: 0 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Serialise { r, g, b } back to `#rrggbb`. */
export function toHexColor({ r, g, b }) {
  const h = (v) => clampByte(Math.round(v)).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Linear RGB interpolation between two hex colours; t clamped to [0,1]. */
export function lerpHexColor(a, b, t) {
  const ca = parseHexColor(a)
  const cb = parseHexColor(b)
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  return toHexColor({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
  })
}

// ── Autostereogram (single-image random-dot stereogram) ─────────────────────────
/**
 * Build an RGBA random-dot autostereogram from a per-pixel depth buffer.
 *
 * `depth` is a row-major Float32Array (length width*height) of values in [0,1],
 * 0 = far, 1 = near. Returns a Uint8ClampedArray of length width*height*4.
 *
 * Classic constraint-propagation SIRDS (Thimbleby, Inglis & Witten 1994,
 * "Displaying 3D Images: Algorithms for Single-Image Random-Dot Stereograms"):
 * for each row, pixels separated by the depth-dependent eye separation are
 * constrained to share a colour; unconstrained pixels get fresh random dots.
 */
export function buildAutostereogram(depth, opts = {}) {
  const { width, height, eyeSepPx = 120, depthFactor = 0.33, seed = 1 } = opts
  const out = new Uint8ClampedArray(width * height * 4)
  const rng = mulberry32(seed)
  const same = new Int32Array(width)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) same[x] = x

    for (let x = 0; x < width; x++) {
      const z = depth[y * width + x]
      // Near objects → smaller separation. Standard SIRDS separation formula.
      const sep = Math.round(((1 - depthFactor * z) * eyeSepPx) / (2 - depthFactor * z))
      const left = x - (sep >> 1)
      const right = left + sep
      // Constrain the left pixel to share the right pixel's colour. The link
      // must point rightward (to a higher index) so the right-to-left fill below
      // always copies from a pixel that has already been assigned.
      if (left >= 0 && right < width) same[left] = right
    }

    for (let x = width - 1; x >= 0; x--) {
      const o = (y * width + x) * 4
      let v
      if (same[x] === x) {
        v = rng() < 0.5 ? 0 : 255 // fresh black/white dot
      } else {
        const src = (y * width + same[x]) * 4
        v = out[src] // copy the colour of the constrained partner (to the right)
      }
      out[o] = v
      out[o + 1] = v
      out[o + 2] = v
      out[o + 3] = 255
    }
  }
  return out
}

export { TWO_PI }
