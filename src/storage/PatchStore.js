// The patch storage seam.
//
// Before this, Patch Studio talked to Firestore directly, so saving a patch
// required an account and a configured Firebase project. The application was
// "Firebase optional" only in the sense that it degraded — the feature simply
// disappeared. That is the coupling gap G4/G5 in
// docs/technical/PORTABLE_DEPLOYMENT.md, and the reason a self-hosted instance
// could not offer saved patches at all.
//
// This file defines the contract. Implementations live beside it and are
// exercised by one shared conformance suite, so "works on device" and "works in
// Firestore" are the same assertion run twice rather than two separate hopes.
//
// The contract is deliberately small — list / save / remove over one owner's
// patches — because a wide interface is a wide surface for implementations to
// disagree on.

/**
 * A stored patch record, identical in shape from every implementation.
 *
 * @typedef {object} StoredPatch
 * @property {string}  id         implementation-assigned, opaque to callers
 * @property {string}  patchName  display name, never empty
 * @property {string}  model      patch model identifier
 * @property {object}  patch      the portable patch export itself
 * @property {string}  createdAt  ISO 8601, or '' when unknown
 * @property {string}  updatedAt  ISO 8601, or '' when unknown
 */

/**
 * @typedef {object} PatchStore
 * @property {string} id                       stable identifier, e.g. 'local'
 * @property {string} label                    short human description
 * @property {() => Promise<StoredPatch[]>} list
 *   Newest first, by updatedAt then createdAt.
 * @property {(patch: object, patchId?: string|null) => Promise<string>} save
 *   Creates when patchId is absent, replaces when present. Returns the id.
 * @property {(patchId: string) => Promise<void>} remove
 */

export const PATCH_STUDIO_MODEL = 'patch-studio-model-1'

/** Longest accepted patch name; longer names are truncated, not rejected. */
const MAX_NAME = 200

/**
 * Normalise and validate a patch export before storing it.
 *
 * Shared by every implementation so they cannot drift on what is acceptable —
 * a patch rejected on device must be rejected in the cloud, and vice versa.
 *
 * @param {object} patchExport
 * @returns {object} a deep copy, safe to persist
 */
export function cleanPatchExport(patchExport) {
  const patch = JSON.parse(JSON.stringify(patchExport ?? {}))
  if (patch.model !== PATCH_STUDIO_MODEL) {
    throw new Error('Only Patch Studio patches can be saved.')
  }
  patch.patchName = (patch.patchName ?? '').toString().trim().slice(0, MAX_NAME) || 'Untitled Patch'
  return patch
}

/**
 * Sort helper shared by implementations so ordering is part of the contract
 * rather than an accident of each backend's query.
 *
 * @param {StoredPatch[]} records
 * @returns {StoredPatch[]} the same array, sorted newest first
 */
export function sortNewestFirst(records) {
  return records.sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''),
  )
}
