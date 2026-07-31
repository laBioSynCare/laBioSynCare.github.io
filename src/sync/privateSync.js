// `bsc-lab-private-sync-1` — the contract for keeping one person's own records
// on a service they control.
//
// This is deliberately *not* a backend for publishing. ADR 0039 split the two
// jobs a hosted service usually conflates: keeping my own data across my devices
// is bounded work with no moderation surface, while hosting one person's content
// for others to read is a permanent obligation. This protocol is only the first.
// Nothing here has a concept of another reader, a visibility flag, or a feed —
// and that absence is the design, not an omission to fill in later.
//
// ## What a conforming implementation must guarantee
//
// 1. **Scope isolation.** Every operation is against exactly one owner's scope.
//    An implementation that can return another scope's record is not conforming,
//    and the conformance suite tries.
// 2. **Conflicts are detected, never silently resolved.** A write carrying a
//    stale revision fails and returns the current record, so the caller decides.
//    A sync layer that last-writer-wins loses a person's notes without telling
//    them.
// 3. **Deletion propagates.** Deletes leave a tombstone, because a record that
//    simply vanishes is indistinguishable from one that never synced, and the
//    next device would resurrect it.
// 4. **The provider identifier never becomes a record identifier.** A Firebase
//    uid as a record id would make the data unportable and leak the identifier
//    into every export — the invariant the identity seam exists to hold.
// 5. **Unknown versions fail closed.** A record written by a newer protocol is
//    refused, not partially interpreted.
//
// The network service is deliberately absent. A specification plus a reference
// implementation plus a conformance suite is an honest claim; a hurried
// internet-facing server with an unreviewed authentication boundary is not.

import { PRIVATE_IDENTITY_FIELDS } from '../identity/IdentityProvider.js'

export const PRIVATE_SYNC_MODEL = 'bsc-lab-private-sync-1'

/** Record kinds this protocol version carries. */
export const RECORD_TYPES = ['logbookEntry', 'annotation', 'patch', 'profile', 'preference']

/** Largest single record an implementation must accept, in bytes. */
export const MAX_RECORD_BYTES = 1024 * 1024

/** Largest number of records a single list call returns without paging. */
export const MAX_PAGE = 500

/** Thrown when a write carries a revision that is no longer current. */
export class ConflictError extends Error {
  /**
   * @param {string} id
   * @param {object|null} current The record as it now stands, so a caller can merge.
   */
  constructor(id, current) {
    super(`Record ${id} was modified elsewhere.`)
    this.name = 'ConflictError'
    this.code = 'conflict'
    // The HTTP status a network binding must use. Named here so every transport
    // agrees rather than each choosing.
    this.status = 409
    this.id = id
    this.current = current
  }
}

/** Thrown when input does not satisfy the protocol. */
export class ProtocolError extends Error {
  constructor(message, code = 'invalid') {
    super(message)
    this.name = 'ProtocolError'
    this.code = code
    this.status = code === 'unsupported-version' ? 400 : 422
  }
}

/** Thrown when a scope tries to reach a record that is not its own. */
export class ScopeError extends Error {
  constructor() {
    super('That record belongs to another account.')
    this.name = 'ScopeError'
    this.code = 'forbidden'
    // Deliberately 404, not 403: telling a caller that a record exists but is
    // someone else's is itself a disclosure.
    this.status = 404
  }
}

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * A stable, portable record identifier.
 *
 * Random rather than derived from anything about the person. Deriving an id
 * from an account — `${uid}:${n}` is the obvious temptation — makes every record
 * carry the provider's identifier, so the data stops being portable the moment
 * the account changes and the identifier leaks into every export.
 */
export function newRecordId() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate a record for storage, returning a normalised copy.
 *
 * @param {object} record
 * @param {{ scope: string }} options
 */
export function validateRecord(record, { scope } = {}) {
  if (!isPlainObject(record)) throw new ProtocolError('A record must be an object.')
  if (record.model !== undefined && record.model !== PRIVATE_SYNC_MODEL) {
    throw new ProtocolError(
      `Unsupported record model "${record.model}"; this service speaks ${PRIVATE_SYNC_MODEL}.`,
      'unsupported-version',
    )
  }
  if (typeof record.id !== 'string' || !record.id) throw new ProtocolError('A record needs a string id.')
  if (!RECORD_TYPES.includes(record.type)) {
    throw new ProtocolError(`Unknown record type "${record.type}".`)
  }
  if (!isPlainObject(record.body)) throw new ProtocolError('A record needs an object body.')

  const size = new TextEncoder().encode(JSON.stringify(record.body)).length
  if (size > MAX_RECORD_BYTES) {
    throw new ProtocolError(`Record body is ${size} bytes; the limit is ${MAX_RECORD_BYTES}.`)
  }

  // The record must not carry the account it belongs to. Scope is a property of
  // the connection, not of the data — otherwise the same record cannot be
  // restored under a different account, which is the whole point of portability.
  const serialized = JSON.stringify(record)
  for (const field of PRIVATE_IDENTITY_FIELDS) {
    if (new RegExp(`"${field}"\\s*:`).test(serialized)) {
      throw new ProtocolError(`A record must not carry "${field}"; scope is not data.`)
    }
  }
  if (scope && record.id.includes(scope)) {
    throw new ProtocolError('A record id must not be derived from the account it belongs to.')
  }

  return {
    model: PRIVATE_SYNC_MODEL,
    id: record.id,
    type: record.type,
    body: JSON.parse(JSON.stringify(record.body)),
    deleted: false,
  }
}

/**
 * Whether a write may proceed.
 *
 * `expectedRevision` is null for a create, and must equal the stored revision
 * for an update. Returns nothing and throws on conflict, so a caller cannot
 * forget to check a boolean.
 */
export function assertWritable(stored, expectedRevision, id) {
  if (!stored) {
    // Creating something that already exists is a conflict too, otherwise two
    // devices creating the same id silently clobber one another.
    if (expectedRevision != null) throw new ConflictError(id, null)
    return
  }
  if (expectedRevision == null || expectedRevision !== stored.revision) {
    throw new ConflictError(id, stored)
  }
}

/** The shape an export takes, so file and service exports agree. */
export function exportEnvelope(records, { scope } = {}) {
  return {
    model: PRIVATE_SYNC_MODEL,
    exportedAt: null, // filled by the caller; kept out so exports stay comparable
    // Deliberately no scope, account or subject: an export must restore under a
    // different account than it left.
    recordCount: records.length,
    records: records.map((r) => ({ ...r })),
  }
}
