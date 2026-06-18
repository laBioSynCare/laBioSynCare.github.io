// Scene-agnostic 3D geometry, projection, colour, and the autostereogram kernel.
//
// Pure and framework-free. Shared by every stereoscopic scene (tree, abstraction,
// landscape): each scene is a flat bag of primitives in normalized 3D space
// (+y up, +z toward the viewer), and these helpers project them to screen and
// turn depth (z) into the cues the three renderers use — horizontal disparity
// (stereo pair / anaglyph) and a per-pixel depth buffer (autostereogram), with
// the focal plane at z = 0.
//
// Scene shape:
//   { background: '#hex',
//     segments: [{ a:{x,y,z}, b:{x,y,z}, width, color }],
//     dots:     [{ x,y,z, r, fill, stroke?, strokeWidth? }],
//     polys:    [{ pts:[{x,y,z}...], fill, stroke?, strokeWidth?, closed }] }

export const TWO_PI = Math.PI * 2
export const DEG = Math.PI / 180
export const WORLD_Z = { x: 0, y: 0, z: 1 }

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
// mulberry32: tiny, fast, deterministic for a given seed (reproducible scenes).
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
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
export const len = (v) => Math.hypot(v.x, v.y, v.z)
export const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})
export function normalize(v) {
  const l = len(v) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

/** Rodrigues rotation of v about a unit axis by `angle` radians. */
export function rotateAboutAxis(v, axis, angle) {
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

// ── Projection ────────────────────────────────────────────────────────────────
/** Yaw rotation about the vertical (y) axis — makes 3D structure legible. */
export function rotateY(p, theta) {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }
}

/**
 * Orthographic screen projection. Returns the base screen position (no stereo
 * disparity) plus the rotated depth `z`, which renderers turn into horizontal
 * disparity. Orthographic keeps disparity a pure function of z (fuses more
 * comfortably in free-view than perspective).
 */
export function project(p, { cx = 0, cy = 0, scale = 1, theta = 0 } = {}) {
  const r = rotateY(p, theta)
  return { sx: cx + scale * r.x, sy: cy - scale * r.y, z: r.z }
}

/** Horizontal disparity (px) for a rotated depth `z`; odd in z, zero at z = 0. */
export function disparity(z, depthScale) {
  return z * depthScale
}

/** Map a model depth into [0,1] (near = 1), e.g. for the autostereogram buffer. */
export function normalizeDepth(z, zMin, zMax) {
  if (!(zMax > zMin)) return 0.5
  const t = (z - zMin) / (zMax - zMin)
  return t < 0 ? 0 : t > 1 ? 1 : t
}

// ── Scene helpers ─────────────────────────────────────────────────────────────
/** Every (x,y,z) point in a scene, for bounds and rasterization. */
export function scenePoints(scene) {
  const pts = []
  for (const s of scene.segments ?? []) { pts.push(s.a, s.b) }
  for (const d of scene.dots ?? []) pts.push(d)
  for (const poly of scene.polys ?? []) for (const pt of poly.pts) pts.push(pt)
  return pts
}

/** Min/max rotated depth across the scene at yaw `theta` (for depth shading). */
export function rotatedSceneBounds(scene, theta) {
  let minZ = Infinity
  let maxZ = -Infinity
  for (const p of scenePoints(scene)) {
    const z = rotateY(p, theta).z
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  if (!(maxZ > minZ)) { minZ = -1; maxZ = 1 }
  return { minZ, maxZ }
}

/**
 * Yaw-invariant fit extent: `maxR` is the largest horizontal radius any point
 * reaches over a full rotation (hypot(x,z)), so fitting to it never clips the
 * scene at any yaw; `minY`/`maxY` bound the (rotation-invariant) height.
 */
export function sceneExtent(scene) {
  let maxR = 0
  let minY = Infinity
  let maxY = -Infinity
  for (const p of scenePoints(scene)) {
    const r = Math.hypot(p.x, p.z)
    if (r > maxR) maxR = r
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  if (!(maxY > minY)) { minY = -1; maxY = 1 }
  if (maxR <= 0) maxR = 1
  return { maxR, minY, maxY }
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

/**
 * Blend a primitive's base colour toward a near/far depth gradient by its
 * (rotated) depth `z`. Returns `baseHex` unchanged when shading is off. Both eyes
 * receive the same colour (it depends only on z), so fusion is unaffected.
 */
export function depthTint(z, bounds, depthColor, baseHex) {
  if (!depthColor?.enabled || !bounds) return baseHex
  const zn = normalizeDepth(z, bounds.minZ, bounds.maxZ)
  const depthHex = lerpHexColor(depthColor.far, depthColor.near, zn) // far → near
  return lerpHexColor(baseHex, depthHex, depthColor.strength)
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
      // Constrain the left pixel to share the right pixel's colour. The link must
      // point rightward (higher index) so the right-to-left fill below always
      // copies from a pixel that has already been assigned.
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
