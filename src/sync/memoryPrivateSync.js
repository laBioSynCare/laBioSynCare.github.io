// A complete, in-memory implementation of `bsc-lab-private-sync-1`.
//
// Its purpose is to make the protocol executable. The conformance suite runs
// against this, so the specification is checked rather than merely written, and
// a future networked implementation gets a suite that already exists and that
// this one is known to pass.
//
// It is not a service and does not pretend to be: no transport, no
// authentication, no persistence. The scope argument stands in for whatever an
// authenticated connection would establish, which is exactly the boundary a
// networked version must implement properly — and the reason that version is not
// being rushed into main.

import {
  MAX_PAGE,
  PRIVATE_SYNC_MODEL,
  ScopeError,
  assertWritable,
  exportEnvelope,
  newRecordId,
  validateRecord,
} from './privateSync.js'

export function createMemoryPrivateSync() {
  /** @type {Map<string, Map<string, object>>} scope → id → record */
  const scopes = new Map()
  let clock = 0

  const bucket = (scope) => {
    if (typeof scope !== 'string' || !scope) throw new ScopeError()
    if (!scopes.has(scope)) scopes.set(scope, new Map())
    return scopes.get(scope)
  }

  // A revision only has to change on every write and be comparable for equality.
  // A counter is enough here; a networked implementation would more likely use
  // an ETag or a row version, which is why nothing outside this file parses it.
  const nextRevision = () => `r${++clock}`

  return {
    model: PRIVATE_SYNC_MODEL,
    id: 'memory',

    /**
     * Records in this scope, newest revision first.
     *
     * Tombstones are included by default: a sync client needs to learn that
     * something was deleted, and filtering them here would make deletion
     * indistinguishable from "never synced".
     */
    async list(scope, { type = null, includeDeleted = true, limit = MAX_PAGE } = {}) {
      const all = [...bucket(scope).values()]
        .filter((r) => (type ? r.type === type : true))
        .filter((r) => (includeDeleted ? true : !r.deleted))
        .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
      return all.slice(0, Math.min(limit, MAX_PAGE)).map((r) => ({ ...r }))
    },

    async read(scope, id) {
      const record = bucket(scope).get(id)
      // Absent and belongs-to-someone-else are the same answer on purpose:
      // distinguishing them would confirm the record exists.
      if (!record) throw new ScopeError()
      return { ...record }
    },

    /** Current revision, or null when the record does not exist in this scope. */
    async revisionOf(scope, id) {
      return bucket(scope).get(id)?.revision ?? null
    },

    /**
     * Create or replace a record.
     *
     * @param {string} scope
     * @param {object} record
     * @param {string|null} expectedRevision null to create; the current revision to update.
     */
    async write(scope, record, expectedRevision = null) {
      const store = bucket(scope)
      const clean = validateRecord(record, { scope })
      assertWritable(store.get(clean.id) ?? null, expectedRevision, clean.id)

      const saved = { ...clean, revision: nextRevision(), updatedAt: ++clock }
      store.set(saved.id, saved)
      return { ...saved }
    },

    /**
     * Tombstone a record.
     *
     * The body is dropped — a deleted record should not keep holding someone's
     * notes — while the id and type remain so other devices can reconcile.
     */
    async remove(scope, id, expectedRevision = null) {
      const store = bucket(scope)
      const stored = store.get(id)
      if (!stored) throw new ScopeError()
      assertWritable(stored, expectedRevision, id)

      const tombstone = {
        model: PRIVATE_SYNC_MODEL,
        id,
        type: stored.type,
        body: {},
        deleted: true,
        revision: nextRevision(),
        updatedAt: ++clock,
      }
      store.set(id, tombstone)
      return { ...tombstone }
    },

    /** Everything in this scope, in the shape a file export also takes. */
    async exportAll(scope) {
      const records = [...bucket(scope).values()].sort((a, b) => a.id.localeCompare(b.id))
      return exportEnvelope(records.map((r) => ({ ...r })), { scope })
    },

    /**
     * Erase the scope entirely.
     *
     * No tombstones: this is account deletion, not a sync operation, and leaving
     * markers behind would mean the account was not actually deleted.
     */
    async deleteAll(scope) {
      const count = bucket(scope).size
      scopes.delete(scope)
      return { deleted: count }
    },

    /** Test helper: how many scopes exist. Not part of the protocol. */
    _scopeCount: () => scopes.size,
  }
}

export { newRecordId }
