// A portable scientific object: one patch, packaged so another instance can
// reconstruct it exactly and a reader can tell what survived the trip.
//
// The distinction that makes this worth having, rather than "export RDF":
//
//   session.patch.json   the executable truth — lossless, byte-exact, the thing
//                        a BSC Lab instance actually reconstructs and plays
//   session.ttl/.jsonld  a semantic projection over the *declared* mappable
//                        subset, useful for querying and citation
//   mapping-report.json  everything the projection could not carry, named
//   manifest.json        what this is, which build made it, which SSTIM release
//                        it was projected against, and the checksums
//
// The projection is deliberately not the payload. ADR 0026 established that
// Patch Studio and the catalog model are structurally different and conversion
// is partial; a package that shipped only RDF would quietly lose whatever the
// ontology cannot yet express, and a package that shipped only JSON would not be
// a scientific object at all. Shipping both, with the gap written down, is the
// only arrangement that is honest in both directions.
//
// Nothing here reads storage or identity. A package carries a patch and the
// facts about its own construction — never a user, an account, or a device.

import { assertPatchStudioPatch } from './patchModel.js'
import { PROJECTION_MODEL, projectPatch } from './patchProjection.js'

export const SESSION_PACKAGE_MODEL = 'bsc-lab-session-package-1'

/** Largest package we will parse, guarding a mis-picked file. */
export const SESSION_PACKAGE_MAX_BYTES = 8 * 1024 * 1024

/** Files a conforming package contains, in a fixed order. */
export const PACKAGE_FILES = [
  'manifest.json',
  'session.patch.json',
  'session.ttl',
  'session.jsonld',
  'mapping-report.json',
]

/** Stable stringify, so a checksum does not depend on key insertion order. */
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Identifiers that must never appear in a package.
 *
 * Checked on the way out rather than trusted, because "the export does not
 * include the uid" is the kind of claim that stays true until someone adds a
 * field. The two-origin harness asserts the same thing from outside.
 */
const FORBIDDEN_PATTERNS = [
  [/AIza[0-9A-Za-z_-]{20,}/, 'a Firebase API key'],
  [/\blocal-device\b/, 'the local-device pseudonym'],
  [/"uid"\s*:/, 'a uid field'],
  [/\bfirebaseUid\b/, 'a Firebase uid'],
]

/**
 * Assert a serialised package carries no identifier.
 *
 * @returns {string[]} human-readable descriptions of anything found
 */
export function findForbiddenIdentifiers(text) {
  return FORBIDDEN_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label)
}

/**
 * Build a package around a patch.
 *
 * @param {object} patchExport a supported Patch Studio document
 * @param {{ sessionIri: string, created: string, bscLabCommit?: string,
 *           sstimRelease?: string, title?: string }} options
 *        `created` is supplied rather than read from the clock, so the same
 *        patch and the same options always produce byte-identical output — the
 *        property the conformance test depends on.
 * @returns {Promise<{ files: Record<string,string>, manifest: object, checksum: string }>}
 */
export async function buildSessionPackage(patchExport, options) {
  const { sessionIri, created, bscLabCommit = 'unknown', sstimRelease = 'unknown', title } = options ?? {}

  assertPatchStudioPatch(patchExport, 'Only Patch Studio patches can be packaged.')
  if (!sessionIri) throw new Error('buildSessionPackage needs a sessionIri.')
  if (!created) throw new Error('buildSessionPackage needs a created timestamp.')

  const patch = JSON.parse(JSON.stringify(patchExport))
  const { turtle, jsonld, report } = projectPatch(patch, { sessionIri, created })

  // Canonical JSON throughout: the checksum is over content, not formatting.
  const files = {
    'session.patch.json': canonical(patch),
    'session.ttl': turtle,
    'session.jsonld': canonical(jsonld),
    'mapping-report.json': canonical(report),
  }

  const checksums = {}
  for (const name of Object.keys(files).sort()) checksums[name] = await sha256Hex(files[name])

  const manifest = {
    model: SESSION_PACKAGE_MODEL,
    sessionIri,
    title: title ?? patch.patchName ?? 'Untitled Patch',
    created,
    patchModel: patch.model,
    projectionModel: PROJECTION_MODEL,
    // Which software and which ontology release produced this. Without these a
    // package is not reproducible: the projection depends on both.
    bscLabCommit,
    sstimRelease,
    files: PACKAGE_FILES,
    checksums,
    // The one sentence a reader most needs, carried in the package itself.
    note:
      'session.patch.json is the executable object and is lossless. session.ttl and session.jsonld are a property-level SSTIM projection over the declared mappable subset; see mapping-report.json for what did not travel and why.',
  }

  files['manifest.json'] = canonical(manifest)

  // Scan the file contents themselves, not their JSON encoding. Nesting them in
  // an outer document escapes every inner quote, so `"uid":` becomes `\"uid\":`
  // and a pattern written against the plain form silently stops matching — the
  // guard would still be there and would still pass, while catching nothing.
  const leaked = findForbiddenIdentifiers(Object.values(files).join('\n'))
  if (leaked.length > 0) {
    throw new Error(`Refusing to build a package containing ${leaked.join(', ')}.`)
  }

  return { files, manifest, checksum: await sha256Hex(canonical(files)) }
}

/** The package as one transferable JSON document. */
export async function serialiseSessionPackage(patchExport, options) {
  const { files, checksum } = await buildSessionPackage(patchExport, options)
  return canonical({ model: SESSION_PACKAGE_MODEL, checksum, files })
}

/**
 * Parse and verify a package, returning its contents.
 *
 * Every rejection happens before anything is applied, so a malformed or foreign
 * package cannot half-modify the receiving instance.
 *
 * @param {string} text a serialised package
 * @returns {Promise<{ patch: object, manifest: object, report: object, turtle: string, jsonld: object }>}
 */
export async function parseSessionPackage(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('That is not a session package.')
  if (text.length > SESSION_PACKAGE_MAX_BYTES) throw new Error('That file is too large to be a session package.')

  let outer
  try {
    outer = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (outer?.model !== SESSION_PACKAGE_MODEL) {
    throw new Error(`Unsupported package model "${outer?.model}"; expected "${SESSION_PACKAGE_MODEL}".`)
  }
  if (!outer.files || typeof outer.files !== 'object') throw new Error('This package has no files.')

  for (const name of PACKAGE_FILES) {
    if (typeof outer.files[name] !== 'string') throw new Error(`This package is missing ${name}.`)
  }

  // Integrity before interpretation.
  if (await sha256Hex(canonical(outer.files)) !== outer.checksum) {
    throw new Error('This package was altered or truncated: its checksum does not match.')
  }

  let manifest
  let patch
  let report
  let jsonld
  try {
    manifest = JSON.parse(outer.files['manifest.json'])
    patch = JSON.parse(outer.files['session.patch.json'])
    report = JSON.parse(outer.files['mapping-report.json'])
    jsonld = JSON.parse(outer.files['session.jsonld'])
  } catch {
    throw new Error('This package contains malformed JSON.')
  }

  if (manifest?.model !== SESSION_PACKAGE_MODEL) throw new Error('This package has an invalid manifest.')
  assertPatchStudioPatch(patch, 'This package does not contain a Patch Studio patch.')
  if (manifest.patchModel !== patch.model) {
    throw new Error('This package manifest does not match its Patch Studio model.')
  }

  // Per-file checksums, so a reader can tell *which* part was damaged.
  for (const [name, expected] of Object.entries(manifest.checksums ?? {})) {
    if (await sha256Hex(outer.files[name]) !== expected) {
      throw new Error(`This package is damaged: ${name} does not match its recorded checksum.`)
    }
  }

  // As in buildSessionPackage: scan the decoded files, never the outer document,
  // whose escaping would hide every pattern.
  const leaked = findForbiddenIdentifiers(Object.values(outer.files).join('\n'))
  if (leaked.length > 0) throw new Error(`Refusing to open a package containing ${leaked.join(', ')}.`)

  return { patch, manifest, report, turtle: outer.files['session.ttl'], jsonld }
}
