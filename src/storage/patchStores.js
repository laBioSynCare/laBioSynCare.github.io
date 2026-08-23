// Which patch store a caller gets, and why.
//
// The rule is local-first: storage on this device is the default and always
// available, and an account adds a second place to keep patches rather than
// being the price of keeping any at all. That ordering is the point of the
// whole seam — see ADR 0038 and docs/technical/PORTABLE_DEPLOYMENT.md §3.2.

import { createLocalPatchStore } from './localPatchStore.js'
import { createFirestorePatchStore } from './firestorePatchStore.js'

/**
 * Every store currently available to a caller, local first.
 *
 * Firestore appears only when Firebase is configured *and* someone is signed
 * in; otherwise the list is simply shorter and nothing else changes.
 *
 * @param {{ storage?: Storage, uid?: string|null, firebaseConfigured?: boolean,
 *           requireClient?: () => Promise<{ db: unknown }> }} options
 * @returns {import('./PatchStore.js').PatchStore[]}
 */
export function availablePatchStores({
  storage = undefined,
  uid = null,
  firebaseConfigured = false,
  requireClient = null,
} = {}) {
  const stores = []

  const local = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (local) stores.push(createLocalPatchStore(local))

  if (firebaseConfigured && uid && requireClient) {
    stores.push(createFirestorePatchStore(uid, requireClient))
  }

  return stores
}

/**
 * The store a save should default to: the account when one is available, so a
 * signed-in user's patches follow them between devices, otherwise this device.
 *
 * Callers may still target any store from `availablePatchStores`.
 */
export function defaultPatchStore(options = {}) {
  const stores = availablePatchStores(options)
  return stores.find((store) => store.id === 'firestore') ?? stores[0] ?? null
}
