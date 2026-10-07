// Firestore-backed annotations, and the factory that picks an implementation.
//
// Validation, pseudonymisation and RDF projection live in annotationRdf.js so
// this store and the local one cannot drift on them — a disagreement about
// visibility handling would be a privacy bug, not a formatting difference.

import { isFirebaseConfigured, requireFirebaseClient } from '../../firebase/client.js'
import { createLocalAnnotationStore } from './localAnnotationStore.js'
import {
  annotationsToQuads,
  authorKeyFor,
  normalizeAnnotationInput,
  normalizeTargetIri,
  ownRecordFields,
  publicCopyFields,
  serializeAnnotations,
} from './annotationRdf.js'

export { normalizeTargetIri }

// Where a note lives (GB-03). The author's own record, which holds everything
// about it including whether it is public, sits under their account and only
// they can read it. A public note also has a public copy under the same id,
// holding what a reader sees: its text, target and dates, and the author's name
// only if they chose to sign. The copy never holds the account ID. It holds an
// author key instead (authorKeyFor), which the rules recompute from the signed-in
// account, so only the author can change or withdraw it.
//
// Until 2026-10-07 one collection held both, with the account ID and a display
// name (possibly the email's local part) in every document, public ones
// included. Those legacy documents are now readable by their owner only, and
// this store moves an owner's legacy documents into the new shape the first
// time it opens for them.
export const PUBLIC_ANNOTATION_COLLECTION = 'publicAnnotations'
export const LEGACY_ANNOTATION_COLLECTION = 'rdfAnnotations'
export const OWN_ANNOTATION_SUBCOLLECTION = 'annotations'

function timestampToIso(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000).toISOString()
  return ''
}

/** A note as its author sees it, from their own record. */
export function ownAnnotationFromData(id, data, userId) {
  return {
    id,
    userId,
    targetIri: data.targetIri,
    annotationType: data.annotationType ?? 'commenting',
    annotationText: data.annotationText ?? '',
    visibility: data.visibility ?? 'private',
    showName: data.showName === true,
    authorName: '',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

/** A note as any reader sees it, from its public copy. No account ID exists here. */
export function publicAnnotationFromData(id, data) {
  return {
    id,
    userId: null,
    targetIri: data.targetIri,
    annotationType: data.annotationType ?? 'commenting',
    annotationText: data.annotationText ?? '',
    visibility: 'public',
    authorName: typeof data.authorName === 'string' ? data.authorName : '',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

// Each signed-in account's legacy documents are moved once per page load.
const migratedThisSession = new Map()

export class AnnotationStore {
  constructor(userId, db) {
    this.userId = userId ?? null
    this.db = db
  }

  static async forUser(userId) {
    if (!userId) throw new Error('AnnotationStore.forUser requires a uid; use forReader for unauthenticated access.')
    const { db } = await requireFirebaseClient()
    return new AnnotationStore(userId, db)
  }

  static async forReader() {
    const { db } = await requireFirebaseClient()
    return new AnnotationStore(null, db)
  }

  get id() { return 'firestore' }
  get label() { return 'Your account' }

  get isAuthenticated() {
    return Boolean(this.userId)
  }

  async #firestore() {
    return import('firebase/firestore')
  }

  #ownRef(firestore, id) {
    return firestore.doc(this.db, 'users', this.userId, OWN_ANNOTATION_SUBCOLLECTION, id)
  }

  #publicRef(firestore, id) {
    return firestore.doc(this.db, PUBLIC_ANNOTATION_COLLECTION, id)
  }

  // The rules accept a signed copy only under the name the ID token carries,
  // and a token minted before a profile change still carries the old one.
  async #freshTokenFor(normalized) {
    if (!normalized.showName) return
    const { auth } = await requireFirebaseClient()
    await auth.currentUser?.getIdToken(true)
  }

  async add(input) {
    if (!this.userId) throw new Error('Sign in to add annotations.')
    const normalized = normalizeAnnotationInput(input)
    await this.#freshTokenFor(normalized)

    const firestore = await this.#firestore()
    const { collection, doc, serverTimestamp, writeBatch } = firestore
    const id = doc(collection(this.db, 'users', this.userId, OWN_ANNOTATION_SUBCOLLECTION)).id
    const batch = writeBatch(this.db)
    batch.set(this.#ownRef(firestore, id), {
      ...ownRecordFields(normalized),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    if (normalized.visibility === 'public') {
      batch.set(this.#publicRef(firestore, id), {
        ...publicCopyFields(normalized),
        authorKey: await authorKeyFor(this.userId, id),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
    return id
  }

  /**
   * Move this account's legacy documents into the new shape: an own record for
   * every one, a public copy for a public one, and the legacy document deleted.
   * A moved public note is unsigned, because its author never chose to sign it.
   */
  async migrateLegacy() {
    if (!this.userId) return 0
    if (!migratedThisSession.has(this.userId)) {
      migratedThisSession.set(this.userId, this.#migrateLegacyNow().catch((error) => {
        migratedThisSession.delete(this.userId)
        throw error
      }))
    }
    return migratedThisSession.get(this.userId)
  }

  async #migrateLegacyNow() {
    const firestore = await this.#firestore()
    const { collection, getDocs, query, serverTimestamp, where, writeBatch } = firestore
    const legacy = await getDocs(query(
      collection(this.db, LEGACY_ANNOTATION_COLLECTION),
      where('userId', '==', this.userId),
    ))
    let moved = 0
    for (const legacyDoc of legacy.docs) {
      const data = legacyDoc.data()
      const normalized = normalizeAnnotationInput({
        annotatesNode: data.targetIri,
        annotationText: data.annotationText,
        annotationType: data.annotationType,
        visibility: data.visibility ?? 'private',
      })
      const createdAt = data.createdAt ?? serverTimestamp()
      const updatedAt = data.updatedAt ?? createdAt
      const batch = writeBatch(this.db)
      batch.set(this.#ownRef(firestore, legacyDoc.id), { ...ownRecordFields(normalized), createdAt, updatedAt })
      if (normalized.visibility === 'public') {
        batch.set(this.#publicRef(firestore, legacyDoc.id), {
          ...publicCopyFields(normalized),
          authorKey: await authorKeyFor(this.userId, legacyDoc.id),
          createdAt,
          updatedAt,
        })
      }
      batch.delete(legacyDoc.ref)
      await batch.commit()
      moved += 1
    }
    return moved
  }

  subscribeForTarget(annotatesNode, onValue, onError = () => {}) {
    const targetIri = normalizeTargetIri(annotatesNode)
    let stopped = false
    const unsubs = []

    let publicResults = []
    let ownResults = []
    let publicReady = false
    let ownReady = !this.userId   // no own-query when anonymous

    // The author's own record wins over the public copy of the same note.
    const emit = () => {
      if (!publicReady || !ownReady) return
      const seen = new Map()
      for (const annotation of publicResults) seen.set(annotation.id, annotation)
      for (const annotation of ownResults) seen.set(annotation.id, annotation)
      const merged = [...seen.values()].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      )
      onValue(merged)
    }

    // A failed move must not hide the notes that are already in place.
    const migrated = this.userId ? this.migrateLegacy().catch(onError) : Promise.resolve()

    Promise.all([this.#firestore(), migrated])
      .then(([{ collection, onSnapshot, query, where }]) => {
        if (stopped) return

        unsubs.push(onSnapshot(
          query(collection(this.db, PUBLIC_ANNOTATION_COLLECTION), where('targetIri', '==', targetIri)),
          (snapshot) => {
            publicResults = snapshot.docs.map((d) => publicAnnotationFromData(d.id, d.data()))
            publicReady = true
            emit()
          },
          onError,
        ))

        if (this.userId) {
          unsubs.push(onSnapshot(
            query(
              collection(this.db, 'users', this.userId, OWN_ANNOTATION_SUBCOLLECTION),
              where('targetIri', '==', targetIri),
            ),
            (snapshot) => {
              ownResults = snapshot.docs.map((d) => ownAnnotationFromData(d.id, d.data(), this.userId))
              ownReady = true
              emit()
            },
            onError,
          ))
        }
      })
      .catch(onError)

    return () => {
      stopped = true
      for (const unsubscribe of unsubs) unsubscribe()
    }
  }

  async update(id, { annotationText, visibility, showName = false, authorName = '' }) {
    if (!this.userId) throw new Error('Sign in to edit annotations.')
    const firestore = await this.#firestore()
    const { getDoc, serverTimestamp, writeBatch } = firestore
    const own = await getDoc(this.#ownRef(firestore, id))
    if (!own.exists()) throw new Error('That annotation no longer exists.')
    const record = own.data()
    const normalized = normalizeAnnotationInput({
      annotatesNode: record.targetIri,
      annotationText,
      annotationType: record.annotationType,
      visibility,
      showName,
      authorName,
    })
    await this.#freshTokenFor(normalized)

    const batch = writeBatch(this.db)
    batch.update(this.#ownRef(firestore, id), {
      annotationText: normalized.annotationText,
      visibility: normalized.visibility,
      showName: normalized.showName,
      updatedAt: serverTimestamp(),
    })
    if (normalized.visibility === 'public') {
      batch.set(this.#publicRef(firestore, id), {
        ...publicCopyFields(normalized),
        authorKey: await authorKeyFor(this.userId, id),
        createdAt: record.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Made private, so the public copy goes. Deleting one that never existed
      // is not an error.
      batch.delete(this.#publicRef(firestore, id))
    }
    await batch.commit()
  }

  async remove(id) {
    if (!this.userId) throw new Error('Sign in to delete annotations.')
    const firestore = await this.#firestore()
    const batch = firestore.writeBatch(this.db)
    // One atomic write. The public copy's rule checks the author's record as it
    // was before the batch, so deleting both together is allowed.
    batch.delete(this.#publicRef(firestore, id))
    batch.delete(this.#ownRef(firestore, id))
    await batch.commit()
  }

  async toQuads(annotations) { return annotationsToQuads(annotations) }
  async serialize(annotations) { return serializeAnnotations(annotations) }
}

/**
 * The annotation store for the current context.
 *
 * Local-first: with no Firebase configured, annotations are kept on the device
 * and the knowledge browser stays writable rather than read-only. Where
 * Firebase *is* configured, behaviour is unchanged — signed in writes to the
 * account, signed out reads public annotations others have shared.
 *
 * @param {string|null} userId
 */
export async function createAnnotationStore(userId) {
  if (isFirebaseConfigured()) {
    return userId ? AnnotationStore.forUser(userId) : AnnotationStore.forReader()
  }
  if (typeof localStorage === 'undefined') {
    throw new Error('No annotation storage is available in this browser.')
  }
  return createLocalAnnotationStore(localStorage)
}

/** The local store regardless of sign-in state, for the instance export. */
export function localAnnotationStore() {
  if (typeof localStorage === 'undefined') return null
  return createLocalAnnotationStore(localStorage)
}
