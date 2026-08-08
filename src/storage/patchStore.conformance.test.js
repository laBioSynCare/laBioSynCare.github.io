// One suite, every implementation.
//
// This is what makes the storage seam an interface rather than a swap: "works
// on device" and "works in the account" are the same assertions run twice. A
// new backend — a self-hosted endpoint, say — is only finished when it passes
// this file unchanged.
//
// The Firestore implementation runs against an in-memory fake rather than a
// live project. That is deliberate: this suite fixes the *contract* both sides
// must honour. It does not prove Firebase is reachable, and it is not a
// substitute for exercising the real backend.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PATCH_STUDIO_MODEL,
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  cleanPatchExport,
  sortNewestFirst,
} from './PatchStore.js'
import { LOCAL_PATCH_KEY, createLocalPatchStore } from './localPatchStore.js'
import { createFirestorePatchStore } from './firestorePatchStore.js'
import { availablePatchStores, defaultPatchStore } from './patchStores.js'

const patch = (name = 'Test Patch', extra = {}) => ({
  model: PATCH_STUDIO_MODEL,
  patchName: name,
  timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
  controlTracks: [],
  audioTracks: [],
  visualTracks: [],
  hapticTracks: [],
  ...extra,
})

function memoryStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

// ── An in-memory stand-in for the Firestore document API ─────────────────────
// Only the surface firestorePatchStore actually uses.
function fakeFirestore() {
  const docs = new Map()
  let seq = 0
  const now = () => new Date(Date.UTC(2026, 6, 30, 12, 0, seq)).toISOString()

  const api = {
    collection: (_db, name) => ({ __collection: name }),
    doc: (_db, name, id) => ({ __collection: name, __id: id }),
    query: (ref, ...clauses) => ({ ...ref, __clauses: clauses }),
    where: (field, op, value) => ({ field, op, value }),
    serverTimestamp: () => now(),
    getDocs: async (q) => {
      const clause = q.__clauses?.[0]
      const matching = [...docs.entries()].filter(([, data]) =>
        !clause || data[clause.field] === clause.value,
      )
      return { docs: matching.map(([id, data]) => ({ id, data: () => data })) }
    },
    addDoc: async (_ref, data) => {
      const id = `fs-${++seq}`
      docs.set(id, { ...data })
      return { id }
    },
    updateDoc: async (ref, data) => {
      if (!docs.has(ref.__id)) throw new Error('That patch no longer exists.')
      docs.set(ref.__id, { ...docs.get(ref.__id), ...data })
    },
    deleteDoc: async (ref) => { docs.delete(ref.__id) },
  }
  return { api, docs }
}

/** Builds both implementations behind one factory shape. */
function implementations() {
  return [
    {
      name: 'local (this device)',
      create: () => createLocalPatchStore(memoryStorage()),
      expectedId: 'local',
    },
    {
      name: 'firestore (account)',
      create: () => {
        const { api } = fakeFirestore()
        vi.doMock('firebase/firestore', () => api)
        return createFirestorePatchStore('uid-1', async () => ({ db: {} }))
      },
      expectedId: 'firestore',
    },
  ]
}

for (const impl of implementations()) {
  describe(`PatchStore conformance — ${impl.name}`, () => {
    let store

    beforeEach(async () => {
      vi.resetModules()
      const { api } = fakeFirestore()
      vi.doMock('firebase/firestore', () => api)
      store = impl.create()
    })

    it('reports a stable identifier and label', () => {
      expect(store.id).toBe(impl.expectedId)
      expect(typeof store.label).toBe('string')
      expect(store.label.length).toBeGreaterThan(0)
    })

    it('starts empty', async () => {
      expect(await store.list()).toEqual([])
    })

    it('saves a patch and returns an id', async () => {
      const id = await store.save(patch('First'))
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('lists a saved patch in the contract shape', async () => {
      await store.save(patch('Shape Check'))
      const [record] = await store.list()

      expect(record).toMatchObject({
        patchName: 'Shape Check',
        model: PATCH_STUDIO_MODEL,
      })
      expect(typeof record.id).toBe('string')
      expect(record.patch).toMatchObject({ model: PATCH_STUDIO_MODEL })
      expect(typeof record.createdAt).toBe('string')
      expect(typeof record.updatedAt).toBe('string')
    })

    it('round-trips the patch body unchanged', async () => {
      const original = patch('Body', { audioTracks: [{ id: 'a-1', trackType: 'Carrier' }] })
      await store.save(original)
      const [record] = await store.list()

      expect(record.patch.audioTracks).toEqual([{ id: 'a-1', trackType: 'Carrier' }])
    })

    it('retains a genuine model-1 patch so existing saved work remains readable', async () => {
      const legacy = patch('Legacy', { model: PATCH_STUDIO_MODEL_V1 })
      await store.save(legacy)

      const [record] = await store.list()
      expect(record.model).toBe(PATCH_STUDIO_MODEL_V1)
      expect(record.patch).toEqual(legacy)
    })

    it('updates in place when given an id, without creating a second record', async () => {
      const id = await store.save(patch('Before'))
      const same = await store.save(patch('After'), id)

      expect(same).toBe(id)
      const records = await store.list()
      expect(records).toHaveLength(1)
      expect(records[0].patchName).toBe('After')
    })

    it('keeps separate records for separate saves', async () => {
      await store.save(patch('One'))
      await store.save(patch('Two'))

      expect((await store.list()).map((r) => r.patchName).sort()).toEqual(['One', 'Two'])
    })

    it('removes a patch', async () => {
      const id = await store.save(patch('Doomed'))
      await store.remove(id)

      expect(await store.list()).toEqual([])
    })

    it('rejects a remove with no id', async () => {
      await expect(store.remove('')).rejects.toThrow(/choose a patch/i)
    })

    it('refuses anything that is not a Patch Studio patch', async () => {
      await expect(store.save({ model: 'something-else', patchName: 'Nope' }))
        .rejects.toThrow(/Only Patch Studio patches/i)
      await expect(store.save({})).rejects.toThrow(/Only Patch Studio patches/i)
    })

    it('refuses model-2 data mislabeled as model 1', async () => {
      await expect(store.save(patch('Mislabeled', {
        model: PATCH_STUDIO_MODEL_V1,
        visualStage: { presentationMode: 'mono' },
      }))).rejects.toThrow(/model-2 features.*model-1/i)
    })

    it('gives an unnamed patch a default name', async () => {
      await store.save(patch(''))
      expect((await store.list())[0].patchName).toBe('Untitled Patch')
    })

    it('truncates an overlong name rather than rejecting it', async () => {
      await store.save(patch('x'.repeat(500)))
      expect((await store.list())[0].patchName).toHaveLength(200)
    })

    it('does not alias stored data with the caller\'s object', async () => {
      const original = patch('Aliasing')
      await store.save(original)
      original.patchName = 'Mutated After Save'

      expect((await store.list())[0].patchName).toBe('Aliasing')
    })
  })
}

describe('PatchStore shared helpers', () => {
  it('uses model 2 for new saves while retaining model 1 as a readable format', () => {
    expect(PATCH_STUDIO_MODEL).toBe(PATCH_STUDIO_MODEL_V2)
    expect(PATCH_STUDIO_MODEL_V1).toBe('patch-studio-model-1')
  })

  it('sorts newest first, falling back to createdAt', () => {
    const sorted = sortNewestFirst([
      { id: 'a', createdAt: '2026-01-01T00:00:00Z', updatedAt: '' },
      { id: 'b', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      { id: 'c', createdAt: '2026-03-01T00:00:00Z', updatedAt: '' },
    ])
    expect(sorted.map((r) => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('deep-copies on clean, so later mutation cannot reach the store', () => {
    const source = patch('Copy', { audioTracks: [{ id: 'a-1' }] })
    const cleaned = cleanPatchExport(source)
    source.audioTracks[0].id = 'changed'

    expect(cleaned.audioTracks[0].id).toBe('a-1')
  })
})

describe('patch store selection', () => {
  it('offers local storage with no account and no Firebase', () => {
    const stores = availablePatchStores({ storage: memoryStorage() })

    expect(stores.map((s) => s.id)).toEqual(['local'])
    expect(defaultPatchStore({ storage: memoryStorage() }).id).toBe('local')
  })

  it('adds the account store only when Firebase is configured and signed in', () => {
    const base = { storage: memoryStorage(), requireClient: async () => ({ db: {} }) }

    expect(availablePatchStores({ ...base, uid: 'u1', firebaseConfigured: false })
      .map((s) => s.id)).toEqual(['local'])
    expect(availablePatchStores({ ...base, uid: null, firebaseConfigured: true })
      .map((s) => s.id)).toEqual(['local'])
    expect(availablePatchStores({ ...base, uid: 'u1', firebaseConfigured: true })
      .map((s) => s.id)).toEqual(['local', 'firestore'])
  })

  it('prefers the account when one is available, so patches follow the user', () => {
    const store = defaultPatchStore({
      storage: memoryStorage(),
      uid: 'u1',
      firebaseConfigured: true,
      requireClient: async () => ({ db: {} }),
    })

    expect(store.id).toBe('firestore')
  })

  it('never returns null when local storage exists', () => {
    expect(defaultPatchStore({ storage: memoryStorage() })).not.toBeNull()
  })
})
