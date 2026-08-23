// 3D tree geometry for the Stereoscopic Tree instrument (/field/tree).
//
// Pure, framework-free. A single procedural tree lives in normalized 3D space
// (origin at the trunk base, +y up, +z toward the viewer). The scene-agnostic
// projection / colour / autostereogram machinery now lives in ../scene/sceneGeom.js
// and is re-exported below so existing importers (TreeStage, this module's test)
// are unaffected.
//
// Depth (z) is what makes the tree genuinely 3D. The `spread` generation knob
// controls how far branches tilt out of the x-y plane: at spread = 0 the tree is
// planar (z = 0 everywhere) and at spread = 1 the branching is fully 3D.

import {
  DEG, WORLD_Z, mulberry32, cross, len, normalize, rotateAboutAxis,
} from '../scene/sceneGeom.js'

// Re-export the shared geometry helpers under their historical names so callers
// that import them from treeModel keep working.
export {
  TWO_PI, mulberry32, rotateY, project, disparity, normalizeDepth,
  parseHexColor, toHexColor, lerpHexColor, buildAutostereogram,
} from '../scene/sceneGeom.js'

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

/**
 * Convert a generated tree into the generic scene primitive model
 * (../scene/sceneGeom.js) so it can be drawn by the shared SceneStage. Colours
 * match TreeStage's defaults. Not yet used by /field/tree (which keeps its own
 * stage) but lets the tree move onto the shared renderer later.
 */
export function treeToScene(tree, {
  branchColor = '#d8c4a0', rootColor = '#9c8161', leafColor = '#8ccb6f',
  background = '#07090c', showRoots = true, showLeaves = true,
} = {}) {
  const segments = tree.branches.map((s) => ({ a: s.a, b: s.b, width: s.width, color: branchColor }))
  if (showRoots) for (const s of tree.roots) segments.push({ a: s.a, b: s.b, width: s.width, color: rootColor })
  const dots = showLeaves ? tree.leaves.map((l) => ({ x: l.x, y: l.y, z: l.z, r: l.r, fill: leafColor })) : []
  return { background, segments, dots, polys: [] }
}
