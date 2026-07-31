import { beforeEach, describe, expect, it } from 'vitest'
import {
  INSTANCE_EXPORT_MAX_BYTES,
  INSTANCE_EXPORT_MODEL,
  applyInstanceExport,
  buildInstanceExport,
  collectInstanceData,
  instanceExportFilename,
  logbookStorageKey,
  parseInstanceExport,
  payloadChecksum,
  summarizeInstanceExport,
} from './instanceExport.js'

/** Minimal Storage stand-in; the real one is not available under vitest's node env. */
function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get size() { return map.size },
    keys: () => [...map.keys()],
  }
}

const UID = 'firebase-uid-abc123'

const bookState = (name, entryCount) => JSON.stringify({
  version: 2,
  logbooks: [{ id: 'lb-1', name }],
  entries: Array.from({ length: entryCount }, (_, i) => ({
    id: `e-${i}`, logbookId: 'lb-1', date: '2026-07-30', text: `entry ${i}`, tags: [],
  })),
  activeBook: 'lb-1',
})

describe('instance export — collection', () => {
  it('collects anonymous logbook, account logbook and preferences', () => {
    const storage = memoryStorage({
      'bsclab_logbook_v2': bookState('Anon', 2),
      [`bsclab_logbook_v2:${encodeURIComponent(UID)}`]: bookState('Mine', 3),
      'bsclab.skin': 'dusk',
    })

    const data = collectInstanceData(storage, { uid: UID })

    expect(data.logbooks).toHaveLength(2)
    expect(data.logbooks.map(b => b.scope).sort()).toEqual(['account', 'anonymous'])
    expect(data.preferences).toEqual({ skin: 'dusk' })
  })

  it('never carries the authentication id into the payload', () => {
    const storage = memoryStorage({
      [`bsclab_logbook_v2:${encodeURIComponent(UID)}`]: bookState('Mine', 1),
    })

    const serialized = JSON.stringify(collectInstanceData(storage, { uid: UID }))

    // The whole point of exporting by scope rather than by storage key.
    expect(serialized).not.toContain(UID)
    expect(serialized).toContain('account')
  })

  it('includes unmigrated v1 entries so an old browser export is not lossy', () => {
    const storage = memoryStorage({
      'bsclab_logbook_v1': JSON.stringify([{ id: 'old-1', text: 'legacy note' }]),
    })

    expect(collectInstanceData(storage).legacyLogbookEntries).toHaveLength(1)
  })

  it('omits absent sections rather than emitting empty ones', () => {
    const data = collectInstanceData(memoryStorage())

    expect(data.logbooks).toEqual([])
    expect(data.legacyLogbookEntries).toBeUndefined()
    expect(data.preferences).toEqual({})
  })

  it('ignores malformed stored JSON instead of throwing', () => {
    const storage = memoryStorage({ 'bsclab_logbook_v2': '{ not json' })

    expect(collectInstanceData(storage).logbooks).toEqual([])
  })
})

describe('instance export — envelope and integrity', () => {
  it('builds a verifiable envelope', async () => {
    const storage = memoryStorage({ 'bsclab_logbook_v2': bookState('Anon', 1) })
    const envelope = await buildInstanceExport(storage, { appVersion: 'abc1234' })

    expect(envelope.model).toBe(INSTANCE_EXPORT_MODEL)
    expect(envelope.appVersion).toBe('abc1234')
    expect(envelope.checksum).toMatch(/^[0-9a-f]{64}$/)
    expect(Date.parse(envelope.exportedAt)).not.toBeNaN()
    expect(await payloadChecksum(envelope.payload)).toBe(envelope.checksum)
  })

  it('produces the same checksum regardless of key order', async () => {
    const a = { logbooks: [], preferences: { skin: 'dusk' } }
    const b = { preferences: { skin: 'dusk' }, logbooks: [] }

    expect(await payloadChecksum(a)).toBe(await payloadChecksum(b))
  })

  it('detects an edited payload', async () => {
    const storage = memoryStorage({ 'bsclab_logbook_v2': bookState('Anon', 1) })
    const envelope = await buildInstanceExport(storage)
    envelope.payload.preferences.skin = 'tampered'

    await expect(parseInstanceExport(JSON.stringify(envelope)))
      .rejects.toThrow(/integrity check/i)
  })
})

describe('instance export — parsing rejects bad input', () => {
  const cases = [
    ['an empty file', '', /empty/i],
    ['whitespace only', '   ', /empty/i],
    ['malformed JSON', '{ nope', /not valid JSON/i],
    ['an array', '[1,2]', /export object/i],
    ['a bare string', '"hello"', /export object/i],
    ['a missing model', '{"payload":{}}', /model/i],
    ['a foreign model', '{"model":"something-else-1","payload":{}}', /Unsupported export model/i],
    ['no payload', `{"model":"${INSTANCE_EXPORT_MODEL}"}`, /no payload/i],
    ['no logbook section', `{"model":"${INSTANCE_EXPORT_MODEL}","payload":{}}`, /logbook section/i],
  ]

  for (const [name, text, pattern] of cases) {
    it(`rejects ${name}`, async () => {
      await expect(parseInstanceExport(text)).rejects.toThrow(pattern)
    })
  }

  it('rejects a file over the size ceiling', async () => {
    const huge = `{"model":"${INSTANCE_EXPORT_MODEL}","payload":{"logbooks":[]},"pad":"${'x'.repeat(INSTANCE_EXPORT_MAX_BYTES)}"}`
    await expect(parseInstanceExport(huge)).rejects.toThrow(/too large/i)
  })

  it('accepts an envelope with no checksum, for hand-written imports', async () => {
    const text = `{"model":"${INSTANCE_EXPORT_MODEL}","payload":{"logbooks":[]}}`
    await expect(parseInstanceExport(text)).resolves.toMatchObject({ model: INSTANCE_EXPORT_MODEL })
  })
})

describe('instance export — cross-instance round trip', () => {
  let source

  beforeEach(() => {
    source = memoryStorage({
      'bsclab_logbook_v2': bookState('Anon', 2),
      [`bsclab_logbook_v2:${encodeURIComponent(UID)}`]: bookState('Mine', 4),
      'bsclab.skin': 'dusk',
    })
  })

  it('restores identically into a second, empty instance', async () => {
    const envelope = await buildInstanceExport(source, { uid: UID })
    const fileText = JSON.stringify(envelope, null, 2)

    // Instance B: different browser, same account.
    const target = memoryStorage()
    const parsed = await parseInstanceExport(fileText)
    const result = applyInstanceExport(target, parsed, { uid: UID })

    expect(result.restoredLogbooks).toBe(2)
    expect(result.restoredPreferences).toBe(1)
    expect(target.getItem('bsclab.skin')).toBe('dusk')
    expect(JSON.parse(target.getItem('bsclab_logbook_v2')).entries).toHaveLength(2)
    expect(JSON.parse(target.getItem(logbookStorageKey(UID))).entries).toHaveLength(4)
  })

  it('re-exports to an identical payload — export is a fixed point', async () => {
    const first = await buildInstanceExport(source, { uid: UID })
    const target = memoryStorage()
    applyInstanceExport(target, await parseInstanceExport(JSON.stringify(first)), { uid: UID })
    const second = await buildInstanceExport(target, { uid: UID })

    // Round-tripping must not drift the data, or repeated migration would.
    expect(second.checksum).toBe(first.checksum)
  })

  it('re-keys account data to the importing account', async () => {
    const envelope = await buildInstanceExport(source, { uid: UID })
    const target = memoryStorage()
    const otherUid = 'a-different-account'

    applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)), { uid: otherUid })

    // Portability, not a raw storage dump: the data lands under whoever imports.
    expect(target.getItem(logbookStorageKey(otherUid))).not.toBeNull()
    expect(target.getItem(logbookStorageKey(UID))).toBeNull()
  })

  it('restores account-scoped data anonymously when nobody is signed in', async () => {
    const accountOnly = memoryStorage({
      [`bsclab_logbook_v2:${encodeURIComponent(UID)}`]: bookState('Mine', 3),
    })
    const envelope = await buildInstanceExport(accountOnly, { uid: UID })
    const target = memoryStorage()

    applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)), { uid: null })

    // A Firebase-free instance must still be able to receive the data.
    expect(JSON.parse(target.getItem('bsclab_logbook_v2')).entries).toHaveLength(3)
  })
})

describe('instance export — annotations', () => {
  const annotation = (id, text) => ({
    id, userId: 'local-device', targetIri: 'https://w3id.org/sstim#Preset',
    annotationType: 'commenting', annotationText: text, visibility: 'private',
    createdAt: '2026-07-31T10:00:00.000Z', updatedAt: '2026-07-31T10:00:00.000Z',
  })

  it('carries local annotations and restores them', async () => {
    const source = memoryStorage({
      'bsclab.annotations.v1': JSON.stringify([annotation('a1', 'one'), annotation('a2', 'two')]),
    })
    const envelope = await buildInstanceExport(source)

    expect(summarizeInstanceExport(envelope.payload).annotations).toBe(2)

    const target = memoryStorage()
    const result = applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)))

    expect(result.restoredAnnotations).toBe(2)
    expect(JSON.parse(target.getItem('bsclab.annotations.v1'))).toHaveLength(2)
  })

  it('carries and restores a local profile', async () => {
    const source = memoryStorage({
      'bsclab.profile.v1': JSON.stringify({ displayName: 'Ada', bio: 'Notes', affiliation: '', email: '' }),
    })
    const envelope = await buildInstanceExport(source)

    expect(summarizeInstanceExport(envelope.payload).hasProfile).toBe(true)

    const target = memoryStorage()
    applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)))

    expect(JSON.parse(target.getItem('bsclab.profile.v1')).displayName).toBe('Ada')
  })

  it('omits the section entirely when there are none', () => {
    expect(collectInstanceData(memoryStorage()).annotations).toBeUndefined()
  })

  it('ignores a corrupted annotation key rather than failing the export', () => {
    const storage = memoryStorage({ 'bsclab.annotations.v1': 'not json' })

    expect(collectInstanceData(storage).annotations).toBeUndefined()
  })

  it('keeps annotations inside the checksum', async () => {
    const storage = memoryStorage({
      'bsclab.annotations.v1': JSON.stringify([annotation('a1', 'one')]),
    })
    const envelope = await buildInstanceExport(storage)
    envelope.payload.annotations[0].annotationText = 'tampered'

    await expect(parseInstanceExport(JSON.stringify(envelope)))
      .rejects.toThrow(/integrity check/i)
  })
})

describe('instance export — local patches', () => {
  const patchRecord = (id, name) => ({
    id, patchName: name, model: 'patch-studio-model-1',
    patch: { model: 'patch-studio-model-1', patchName: name, audioTracks: [], visualTracks: [] },
    createdAt: '2026-07-31T10:00:00.000Z', updatedAt: '2026-07-31T10:00:00.000Z',
  })

  it('carries locally saved patches and restores them', async () => {
    const source = memoryStorage({
      'bsclab.patchStudio.patches.v1': JSON.stringify([patchRecord('p1', 'Alpha'), patchRecord('p2', 'Beta')]),
    })
    const envelope = await buildInstanceExport(source)

    expect(summarizeInstanceExport(envelope.payload).patches).toBe(2)

    const target = memoryStorage()
    const result = applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)))

    expect(result.restoredPatches).toBe(2)
    expect(JSON.parse(target.getItem('bsclab.patchStudio.patches.v1'))).toHaveLength(2)
  })

  it('preserves the patch body so it still loads after migration', async () => {
    const source = memoryStorage({
      'bsclab.patchStudio.patches.v1': JSON.stringify([patchRecord('p1', 'Alpha')]),
    })
    const envelope = await buildInstanceExport(source)
    const target = memoryStorage()
    applyInstanceExport(target, await parseInstanceExport(JSON.stringify(envelope)))

    const [restored] = JSON.parse(target.getItem('bsclab.patchStudio.patches.v1'))
    expect(restored.patch.model).toBe('patch-studio-model-1')
    expect(restored.patchName).toBe('Alpha')
  })

  it('omits the section when there are none', () => {
    expect(collectInstanceData(memoryStorage()).patches).toBeUndefined()
  })

  it('keeps patches inside the checksum', async () => {
    const storage = memoryStorage({
      'bsclab.patchStudio.patches.v1': JSON.stringify([patchRecord('p1', 'Alpha')]),
    })
    const envelope = await buildInstanceExport(storage)
    envelope.payload.patches[0].patchName = 'tampered'

    await expect(parseInstanceExport(JSON.stringify(envelope)))
      .rejects.toThrow(/integrity check/i)
  })
})

describe('instance export — helpers', () => {
  it('summarizes what an import would restore', () => {
    const storage = memoryStorage({
      'bsclab_logbook_v2': bookState('Anon', 2),
      'bsclab.skin': 'dusk',
    })

    expect(summarizeInstanceExport(collectInstanceData(storage)))
      .toMatchObject({ logbooks: 1, entries: 2, annotations: 0, patches: 0, hasProfile: false, legacyEntries: 0, hasPreferences: true })
  })

  it('dates the download filename', () => {
    expect(instanceExportFilename(new Date('2026-07-30T12:00:00Z')))
      .toBe('bsc-lab-export-2026-07-30.json')
  })

  it('keys account storage exactly as the logbook route does', () => {
    expect(logbookStorageKey(null)).toBe('bsclab_logbook_v2')
    expect(logbookStorageKey('a b')).toBe('bsclab_logbook_v2:a%20b')
  })
})

describe('a portable export carries no personal identifier', () => {
  // The profile is saved with whatever the identity provider supplied. An email
  // names a person as directly as a uid does, and the export travels.
  it('strips email and uid from the local profile', async () => {
    const storage = memoryStorage({
      'bsclab.profile.v1': JSON.stringify({
        displayName: 'Ada Lovelace',
        bio: 'Analytical engines',
        email: 'ada@example.org',
        uid: 'firebase-uid-must-not-travel',
      }),
    })
    const envelope = await buildInstanceExport(storage, { uid: 'firebase-uid-must-not-travel' })
    const serialized = JSON.stringify(envelope)
    expect(serialized).not.toContain('ada@example.org')
    expect(serialized).not.toContain('firebase-uid-must-not-travel')
    // and keeps what is legitimately the person's own content
    expect(serialized).toContain('Ada Lovelace')
    expect(serialized).toContain('Analytical engines')
  })
})
