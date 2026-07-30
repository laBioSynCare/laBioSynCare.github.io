// Local-first annotations — annotate the knowledge graph with no account.
//
// Annotating was previously impossible without Firebase and a sign-in, which
// made the knowledge browser read-only on any self-hosted instance. This is the
// same seam as patches (ADR 0038): local storage is always available, and an
// account adds somewhere else to keep notes rather than being the price of
// keeping any.
//
// Two honest differences from the Firestore store, both inherent to being local
// rather than shortcomings to fix:
//
//   * There is no *other* user, so every local annotation is your own. Public
//     visibility is still recorded, because it decides which RDF graph the
//     annotation lands in on export — it just does not publish anything.
//   * "Subscription" is same-tab only. Firestore pushes changes from other
//     devices; localStorage has no such channel, so listeners are notified on
//     local writes and on the browser's `storage` event from other tabs.

import {
  annotationsToQuads,
  normalizeAnnotationInput,
  normalizeTargetIri,
  safeVisibility,
  serializeAnnotations,
} from './annotationRdf.js'

export const LOCAL_ANNOTATION_KEY = 'bsclab.annotations.v1'

/** Local records are attributed to this stable id, never a real account. */
export const LOCAL_USER_ID = 'local-device'

function newId() {
  const random = globalThis.crypto?.randomUUID?.()
  return random ? `local-${random}` : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_ANNOTATION_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r === 'object' && r.id) : []
  } catch {
    // A corrupted key must not make the browser unusable.
    return []
  }
}

function writeAll(storage, records) {
  storage.setItem(LOCAL_ANNOTATION_KEY, JSON.stringify(records))
}

export class LocalAnnotationStore {
  /** @param {Storage} storage */
  constructor(storage) {
    this.storage = storage
    this.userId = LOCAL_USER_ID
    /** @type {Set<() => void>} */
    this.listeners = new Set()

    // Other tabs of the same origin write the same key; mirror their changes.
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('storage', (event) => {
        if (event.key === LOCAL_ANNOTATION_KEY) this.#notify()
      })
    }
  }

  get id() { return 'local' }
  get label() { return 'On this device' }

  /** Local annotations are always editable — there is no other author. */
  get isAuthenticated() { return true }

  #notify() {
    for (const listener of this.listeners) listener()
  }

  async add(input) {
    const normalized = normalizeAnnotationInput(input)
    const records = readAll(this.storage)
    const now = new Date().toISOString()
    const id = newId()
    records.push({
      id,
      userId: LOCAL_USER_ID,
      userDisplayName: normalized.userDisplayName,
      targetIri: normalized.targetIri,
      annotationType: normalized.annotationType,
      annotationText: normalized.annotationText,
      visibility: normalized.visibility,
      createdAt: now,
      updatedAt: now,
    })
    writeAll(this.storage, records)
    this.#notify()
    return id
  }

  subscribeForTarget(annotatesNode, onValue, onError = () => {}) {
    const targetIri = normalizeTargetIri(annotatesNode)
    let stopped = false

    const emit = () => {
      if (stopped) return
      try {
        const matching = readAll(this.storage)
          .filter((record) => record.targetIri === targetIri)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        onValue(matching)
      } catch (e) {
        onError(e)
      }
    }

    this.listeners.add(emit)
    emit()   // deliver current state immediately, as a live query would

    return () => {
      stopped = true
      this.listeners.delete(emit)
    }
  }

  async update(id, { annotationText, visibility }) {
    const text = annotationText?.trim()
    if (!text) throw new Error('Annotation text cannot be empty.')
    const records = readAll(this.storage)
    const index = records.findIndex((r) => r.id === id)
    if (index === -1) throw new Error('That annotation no longer exists.')
    records[index] = {
      ...records[index],
      annotationText: text,
      visibility: safeVisibility(visibility),
      updatedAt: new Date().toISOString(),
    }
    writeAll(this.storage, records)
    this.#notify()
  }

  async remove(id) {
    const records = readAll(this.storage)
    const next = records.filter((r) => r.id !== id)
    if (next.length === records.length) throw new Error('That annotation no longer exists.')
    writeAll(this.storage, next)
    this.#notify()
  }

  /** Every local annotation, for the instance export. */
  async listAll() {
    return readAll(this.storage)
  }

  async toQuads(annotations) { return annotationsToQuads(annotations) }
  async serialize(annotations) { return serializeAnnotations(annotations) }
}

export function createLocalAnnotationStore(storage) {
  return new LocalAnnotationStore(storage)
}
