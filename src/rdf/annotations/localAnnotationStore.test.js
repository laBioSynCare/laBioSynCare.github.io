import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Parser } from 'n3'
import {
  LOCAL_ANNOTATION_KEY,
  LOCAL_USER_ID,
  createLocalAnnotationStore,
} from './localAnnotationStore.js'

function memoryStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

const TARGET = 'https://w3id.org/sstim#Preset'
const OTHER = 'https://w3id.org/sstim#Protocol'

describe('local annotation store', () => {
  let storage
  let store

  beforeEach(() => {
    storage = memoryStorage()
    store = createLocalAnnotationStore(storage)
  })

  it('annotates with no account and no Firebase', async () => {
    const id = await store.add({ annotatesNode: TARGET, annotationText: 'A local note' })

    expect(typeof id).toBe('string')
    expect(store.isAuthenticated).toBe(true)
    expect(store.id).toBe('local')
  })

  it('attributes records to a device id, never a real account', async () => {
    await store.add({ annotatesNode: TARGET, annotationText: 'Mine' })
    const [record] = await store.listAll()

    expect(record.userId).toBe(LOCAL_USER_ID)
    expect(LOCAL_USER_ID).not.toMatch(/uid|firebase/i)
  })

  it('defaults to private, and only an explicit public is public', async () => {
    await store.add({ annotatesNode: TARGET, annotationText: 'default' })
    await store.add({ annotatesNode: TARGET, annotationText: 'odd', visibility: 'sort-of' })
    await store.add({ annotatesNode: TARGET, annotationText: 'shared', visibility: 'public' })

    const visibilities = (await store.listAll()).map((r) => r.visibility).sort()
    expect(visibilities).toEqual(['private', 'private', 'public'])
  })

  it('rejects empty text and non-IRI targets', async () => {
    await expect(store.add({ annotatesNode: TARGET, annotationText: '   ' }))
      .rejects.toThrow(/cannot be empty/i)
    await expect(store.add({ annotatesNode: 'not-an-iri', annotationText: 'x' }))
      .rejects.toThrow(/absolute http/i)
  })

  it('delivers current state to a new subscriber immediately', async () => {
    await store.add({ annotatesNode: TARGET, annotationText: 'Existing' })

    const seen = vi.fn()
    const stop = store.subscribeForTarget(TARGET, seen)

    expect(seen).toHaveBeenCalledTimes(1)
    expect(seen.mock.calls[0][0]).toHaveLength(1)
    stop()
  })

  it('pushes updates to subscribers on write', async () => {
    const seen = vi.fn()
    const stop = store.subscribeForTarget(TARGET, seen)
    await store.add({ annotatesNode: TARGET, annotationText: 'New' })

    expect(seen).toHaveBeenCalledTimes(2)
    expect(seen.mock.calls.at(-1)[0][0].annotationText).toBe('New')
    stop()
  })

  it('only delivers annotations for the subscribed target', async () => {
    await store.add({ annotatesNode: OTHER, annotationText: 'Elsewhere' })
    const seen = vi.fn()
    const stop = store.subscribeForTarget(TARGET, seen)

    expect(seen.mock.calls[0][0]).toEqual([])
    stop()
  })

  it('stops delivering after unsubscribe', async () => {
    const seen = vi.fn()
    const stop = store.subscribeForTarget(TARGET, seen)
    stop()
    await store.add({ annotatesNode: TARGET, annotationText: 'After stop' })

    expect(seen).toHaveBeenCalledTimes(1)   // only the initial emit
  })

  it('updates text and visibility in place', async () => {
    const id = await store.add({ annotatesNode: TARGET, annotationText: 'Before' })
    await store.update(id, { annotationText: 'After', visibility: 'public' })
    const [record] = await store.listAll()

    expect(record.annotationText).toBe('After')
    expect(record.visibility).toBe('public')
    expect(record.updatedAt >= record.createdAt).toBe(true)
  })

  it('refuses to update or remove something that is gone', async () => {
    await expect(store.update('missing', { annotationText: 'x' })).rejects.toThrow(/no longer exists/i)
    await expect(store.remove('missing')).rejects.toThrow(/no longer exists/i)
  })

  it('removes', async () => {
    const id = await store.add({ annotatesNode: TARGET, annotationText: 'Doomed' })
    await store.remove(id)

    expect(await store.listAll()).toEqual([])
  })

  it('survives a corrupted storage key', async () => {
    storage.setItem(LOCAL_ANNOTATION_KEY, 'not json at all')

    expect(await store.listAll()).toEqual([])
  })

  it('serializes to parseable Turtle without any account identifier', async () => {
    await store.add({ annotatesNode: TARGET, annotationText: 'Exported', visibility: 'public' })
    const turtle = await store.serialize(await store.listAll())

    // Parses, so the local path produces valid RDF like the Firestore one.
    expect(() => new Parser().parse(turtle)).not.toThrow()
    expect(turtle).toContain('oa:Annotation')
    // The device id is a local constant, but it must not appear as an IRI
    // segment either — attribution goes through the shared pseudonym.
    expect(turtle).not.toContain(LOCAL_USER_ID)
  })
})
