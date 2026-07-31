import { describe, it, expect, beforeEach } from 'vitest'
import {
  FORBIDDEN_RECORD_FIELDS,
  MAX_RECORD_BYTES,
  PRIVATE_SYNC_MODEL,
  RECORD_ID_PATTERN,
  RECORD_TYPES,
  newRecordId,
} from './privateSync.js'
import { createMemoryPrivateSync } from './memoryPrivateSync.js'

// The suite a private-sync implementation must pass. Written against the
// interface, not against the in-memory store, so a future networked
// implementation inherits it unchanged — that is the point of specifying the
// protocol before building the service.
const IMPLEMENTATIONS = [['memory', () => createMemoryPrivateSync()]]

const ALICE = 'scope-alice'
const BOB = 'scope-bob'

const entry = (overrides = {}) => ({
  id: newRecordId(),
  type: 'logbookEntry',
  body: { text: 'First session', at: '2026-07-31T00:00:00Z' },
  ...overrides,
})

describe.each(IMPLEMENTATIONS)('private-sync conformance: %s', (_name, make) => {
  let sync
  beforeEach(() => { sync = make() })

  // ── identity of the protocol ──────────────────────────────────────────────

  it('declares the protocol it speaks', () => {
    expect(sync.model).toBe(PRIVATE_SYNC_MODEL)
  })

  // ── scope isolation ───────────────────────────────────────────────────────

  describe('one scope cannot reach another', () => {
    it('does not list another scope records', async () => {
      await sync.write(ALICE, entry())
      expect(await sync.list(BOB)).toEqual([])
    })

    it('refuses to read another scope record', async () => {
      const saved = await sync.write(ALICE, entry())
      // 'not-found', not 'forbidden': the code itself must not disclose that
      // the record exists somewhere else.
      await expect(sync.read(BOB, saved.id)).rejects.toMatchObject({ code: 'not-found', status: 404 })
    })

    it('answers identically for absent and for another scope record', async () => {
      const saved = await sync.write(ALICE, entry())
      const other = await sync.read(BOB, saved.id).catch((e) => e)
      const absent = await sync.read(BOB, newRecordId()).catch((e) => e)
      // The *whole* public response, not just the status. Two 404s with
      // different codes or messages still disclose that the record exists —
      // an earlier version of this test compared only `status` and would have
      // passed against a body saying "belongs to another account".
      expect(other.publicShape()).toEqual(absent.publicShape())
      expect(other.publicShape()).toEqual({ code: 'not-found', message: 'Record not found.', status: 404 })
      // And the message must not hint at the alternative.
      expect(other.message).not.toMatch(/another|account|forbidden|permission/i)
    })

    it('does not delete another scope records', async () => {
      const saved = await sync.write(ALICE, entry())
      await expect(sync.remove(BOB, saved.id, saved.revision)).rejects.toMatchObject({ code: 'not-found' })
      expect((await sync.read(ALICE, saved.id)).id).toBe(saved.id)
    })

    it('deleting one scope leaves the other intact', async () => {
      await sync.write(ALICE, entry())
      const bobRecord = await sync.write(BOB, entry())
      await sync.deleteAll(ALICE)
      expect((await sync.read(BOB, bobRecord.id)).id).toBe(bobRecord.id)
    })

    it('rejects a missing or empty scope outright', async () => {
      await expect(sync.list('')).rejects.toMatchObject({ code: 'not-found' })
      await expect(sync.list(null)).rejects.toMatchObject({ code: 'not-found' })
    })
  })

  // ── conflicts are reported, never resolved ────────────────────────────────

  describe('conflict detection', () => {
    it('accepts a create with no expected revision', async () => {
      const saved = await sync.write(ALICE, entry())
      expect(saved.revision).toBeTruthy()
      expect(saved.deleted).toBe(false)
    })

    it('rejects a create for an id that already exists', async () => {
      const record = entry()
      await sync.write(ALICE, record)
      // Two devices creating the same id must not silently clobber one another.
      await expect(sync.write(ALICE, record, 'r-stale')).rejects.toMatchObject({ code: 'conflict' })
    })

    it('accepts an update carrying the current revision', async () => {
      const saved = await sync.write(ALICE, entry())
      const updated = await sync.write(ALICE,
        { ...saved, body: { text: 'edited' } }, saved.revision)
      expect(updated.body.text).toBe('edited')
      expect(updated.revision).not.toBe(saved.revision)
    })

    it('rejects an update carrying a stale revision', async () => {
      const saved = await sync.write(ALICE, entry())
      await sync.write(ALICE, { ...saved, body: { text: 'first' } }, saved.revision)
      await expect(
        sync.write(ALICE, { ...saved, body: { text: 'second' } }, saved.revision),
      ).rejects.toMatchObject({ code: 'conflict', status: 409 })
    })

    it('returns the current record with the conflict, so a caller can merge', async () => {
      const saved = await sync.write(ALICE, entry())
      const winner = await sync.write(ALICE, { ...saved, body: { text: 'winner' } }, saved.revision)
      const error = await sync.write(ALICE, { ...saved, body: { text: 'loser' } }, saved.revision)
        .catch((e) => e)
      expect(error.current.revision).toBe(winner.revision)
      expect(error.current.body.text).toBe('winner')
    })

    it('rejects an update with no expected revision rather than overwriting', async () => {
      const saved = await sync.write(ALICE, entry())
      await expect(sync.write(ALICE, { ...saved, body: { text: 'x' } }, null))
        .rejects.toMatchObject({ code: 'conflict' })
    })

    it('changes the revision on every write', async () => {
      let record = await sync.write(ALICE, entry())
      const seen = new Set([record.revision])
      for (let i = 0; i < 3; i += 1) {
        record = await sync.write(ALICE, { ...record, body: { text: `v${i}` } }, record.revision)
        expect(seen.has(record.revision)).toBe(false)
        seen.add(record.revision)
      }
    })
  })

  // ── deletion propagates ───────────────────────────────────────────────────

  describe('deletion', () => {
    it('leaves a tombstone rather than vanishing', async () => {
      const saved = await sync.write(ALICE, entry())
      const tombstone = await sync.remove(ALICE, saved.id, saved.revision)
      expect(tombstone.deleted).toBe(true)
      // Still listed: another device must be able to learn it was deleted, or it
      // would resurrect the record on next sync.
      expect((await sync.list(ALICE)).map((r) => r.id)).toContain(saved.id)
    })

    it('drops the body from a tombstone', async () => {
      const saved = await sync.write(ALICE, entry())
      const tombstone = await sync.remove(ALICE, saved.id, saved.revision)
      expect(tombstone.body).toEqual({})
      expect(JSON.stringify(tombstone)).not.toContain('First session')
    })

    it('can be filtered out for callers that only want live records', async () => {
      const saved = await sync.write(ALICE, entry())
      await sync.remove(ALICE, saved.id, saved.revision)
      expect(await sync.list(ALICE, { includeDeleted: false })).toEqual([])
    })

    it('detects conflicts on delete too', async () => {
      const saved = await sync.write(ALICE, entry())
      await expect(sync.remove(ALICE, saved.id, 'r-stale')).rejects.toMatchObject({ code: 'conflict' })
    })

    it('deleteAll leaves nothing, not even tombstones', async () => {
      await sync.write(ALICE, entry())
      await sync.write(ALICE, entry())
      const result = await sync.deleteAll(ALICE)
      expect(result.deleted).toBe(2)
      // Account deletion, not a sync operation: markers would mean the account
      // was not actually deleted.
      expect(await sync.list(ALICE)).toEqual([])
    })
  })

  // ── export is complete and portable ───────────────────────────────────────

  describe('export', () => {
    it('carries every record in the scope', async () => {
      await sync.write(ALICE, entry())
      await sync.write(ALICE, entry({ type: 'patch', body: { patchName: 'p' } }))
      const dump = await sync.exportAll(ALICE)
      expect(dump.model).toBe(PRIVATE_SYNC_MODEL)
      expect(dump.recordCount).toBe(2)
      expect(dump.records).toHaveLength(2)
    })

    it('names no account, so it can restore under a different one', async () => {
      await sync.write(ALICE, entry())
      const serialized = JSON.stringify(await sync.exportAll(ALICE))
      expect(serialized).not.toContain(ALICE)
      expect(serialized).not.toMatch(/"(subject|email|uid)"\s*:/)
    })

    it('is deterministic in ordering', async () => {
      for (let i = 0; i < 5; i += 1) await sync.write(ALICE, entry())
      const a = await sync.exportAll(ALICE)
      const b = await sync.exportAll(ALICE)
      expect(a.records.map((r) => r.id)).toEqual(b.records.map((r) => r.id))
    })
  })

  // ── record validation ─────────────────────────────────────────────────────

  describe('records are validated before storage', () => {
    it('accepts every declared record type', async () => {
      for (const type of RECORD_TYPES) {
        const saved = await sync.write(ALICE, entry({ type, body: { x: 1 } }))
        expect(saved.type).toBe(type)
      }
    })

    it('rejects an unknown record type', async () => {
      await expect(sync.write(ALICE, entry({ type: 'somethingElse' })))
        .rejects.toMatchObject({ code: 'invalid' })
    })

    it('fails closed on an unknown protocol version', async () => {
      await expect(sync.write(ALICE, { ...entry(), model: 'bsc-lab-private-sync-9' }))
        .rejects.toMatchObject({ code: 'unsupported-version', status: 400 })
    })

    it('rejects a malformed record', async () => {
      await expect(sync.write(ALICE, null)).rejects.toMatchObject({ code: 'invalid' })
      await expect(sync.write(ALICE, entry({ id: '' }))).rejects.toMatchObject({ code: 'invalid' })
      await expect(sync.write(ALICE, entry({ body: 'not-an-object' }))).rejects.toMatchObject({ code: 'invalid' })
    })

    it('enforces a size limit', async () => {
      const huge = { text: 'x'.repeat(MAX_RECORD_BYTES + 1) }
      await expect(sync.write(ALICE, entry({ body: huge }))).rejects.toMatchObject({ code: 'invalid' })
    })
  })

  // ── the privacy invariant this protocol exists to hold ────────────────────

  describe('the account never becomes data', () => {
    it('refuses a record carrying a provider subject', async () => {
      await expect(sync.write(ALICE, entry({ body: { subject: 'firebase-uid-1' } })))
        .rejects.toMatchObject({ code: 'invalid' })
    })

    it('refuses a record carrying an email', async () => {
      await expect(sync.write(ALICE, entry({ body: { email: 'a@b.c' } })))
        .rejects.toMatchObject({ code: 'invalid' })
    })

    it('refuses a record id derived from the account', async () => {
      // `${uid}:1` is the obvious temptation, and it makes every record
      // unportable the moment the account changes.
      await expect(sync.write(ALICE, entry({ id: `${ALICE}:1` })))
        .rejects.toMatchObject({ code: 'invalid' })
    })

    it('mints ids that are unique and account-independent', () => {
      const ids = new Set(Array.from({ length: 500 }, () => newRecordId()))
      expect(ids.size).toBe(500)
      for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/)
    })
  })

  // ── round trip ────────────────────────────────────────────────────────────

  it('survives write → read → update → delete → export', async () => {
    const saved = await sync.write(ALICE, entry())
    expect((await sync.read(ALICE, saved.id)).body.text).toBe('First session')

    const updated = await sync.write(ALICE, { ...saved, body: { text: 'revised' } }, saved.revision)
    expect(await sync.revisionOf(ALICE, saved.id)).toBe(updated.revision)

    await sync.remove(ALICE, saved.id, updated.revision)
    const dump = await sync.exportAll(ALICE)
    expect(dump.records).toHaveLength(1)
    expect(dump.records[0].deleted).toBe(true)
  })
})


// ── corrections after review ────────────────────────────────────────────────

describe.each(IMPLEMENTATIONS)('nothing crosses the boundary by reference: %s', (_name, make) => {
  let sync
  beforeEach(() => { sync = make() })

  // A shallow spread leaves `body` shared with the store, so a caller could
  // change stored data without a write, without the expected revision, without
  // a new revision and without any conflict check — silently defeating the
  // concurrency control this protocol exists to provide.
  it('mutating a read result does not change stored state', async () => {
    const saved = await sync.write(ALICE, entry())
    const first = await sync.read(ALICE, saved.id)
    first.body.text = 'mutated'
    expect((await sync.read(ALICE, saved.id)).body.text).toBe('First session')
  })

  it('mutating a write result does not change stored state', async () => {
    const saved = await sync.write(ALICE, entry())
    saved.body.text = 'mutated'
    expect((await sync.read(ALICE, saved.id)).body.text).toBe('First session')
  })

  it('mutating a list result does not change stored state', async () => {
    await sync.write(ALICE, entry())
    const [listed] = await sync.list(ALICE)
    listed.body.text = 'mutated'
    expect((await sync.list(ALICE))[0].body.text).toBe('First session')
  })

  it('mutating an export does not change stored state', async () => {
    await sync.write(ALICE, entry())
    const dump = await sync.exportAll(ALICE)
    dump.records[0].body.text = 'mutated'
    expect((await sync.exportAll(ALICE)).records[0].body.text).toBe('First session')
  })

  it('mutating the record handed back with a conflict does not change stored state', async () => {
    const saved = await sync.write(ALICE, entry())
    await sync.write(ALICE, { ...saved, body: { text: 'winner' } }, saved.revision)
    const err = await sync.write(ALICE, { ...saved, body: { text: 'loser' } }, saved.revision).catch((e) => e)
    err.current.body.text = 'mutated'
    expect((await sync.read(ALICE, saved.id)).body.text).toBe('winner')
  })

  it('the caller keeps no reference into the store after writing', async () => {
    const record = entry()
    await sync.write(ALICE, record)
    record.body.text = 'mutated after write'
    expect((await sync.read(ALICE, record.id)).body.text).toBe('First session')
  })
})

describe.each(IMPLEMENTATIONS)('identifier rejection is exhaustive: %s', (_name, make) => {
  let sync
  beforeEach(() => { sync = make() })

  // The earlier validator rejected `subject` and `email` while accepting a plain
  // `uid` — the same leak under a different name — and the export test that was
  // meant to catch it never submitted one.
  it.each(FORBIDDEN_RECORD_FIELDS)('rejects a record carrying "%s"', async (field) => {
    await expect(sync.write(ALICE, entry({ body: { [field]: 'value' } })))
      .rejects.toMatchObject({ code: 'invalid' })
  })

  it('rejects a forbidden field nested deep in the body', async () => {
    await expect(sync.write(ALICE, entry({ body: { a: { b: { uid: 'x' } } } })))
      .rejects.toMatchObject({ code: 'invalid' })
  })

  it('rejects the authenticated scope value anywhere in the record', async () => {
    await expect(sync.write(ALICE, entry({ body: { note: ALICE } })))
      .rejects.toMatchObject({ code: 'invalid' })
  })

  it('does not false-positive on a scope that is a substring of a hex id', async () => {
    // `id.includes(scope)` rejected almost any hex id for a short scope,
    // because "a" is a substring of nearly everything.
    const shortScope = 'a'
    await expect(sync.write(shortScope, entry())).resolves.toBeTruthy()
  })

  it('enforces the documented record-id format', async () => {
    for (const bad of ['not-hex', 'ABCDEF0123456789abcdef0123456789', 'abc', '']) {
      await expect(sync.write(ALICE, entry({ id: bad }))).rejects.toMatchObject({ code: 'invalid' })
    }
    expect(newRecordId()).toMatch(RECORD_ID_PATTERN)
  })
})
