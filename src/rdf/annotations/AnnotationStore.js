// Firestore-backed annotations, and the factory that picks an implementation.
//
// Validation, pseudonymisation and RDF projection live in annotationRdf.js so
// this store and the local one cannot drift on them — a disagreement about
// visibility handling would be a privacy bug, not a formatting difference.

import { isFirebaseConfigured, requireFirebaseClient } from '../../firebase/client.js'
import { createLocalAnnotationStore } from './localAnnotationStore.js'
import {
  annotationsToQuads,
  normalizeAnnotationInput,
  normalizeTargetIri,
  safeVisibility,
  serializeAnnotations,
} from './annotationRdf.js'

export { normalizeTargetIri }

export const ANNOTATION_COLLECTION = 'rdfAnnotations'

function timestampToIso(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000).toISOString()
  return ''
}

function annotationFromDoc(docSnapshot) {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    userId: data.userId,
    userDisplayName: data.userDisplayName ?? '',
    targetIri: data.targetIri,
    annotationType: data.annotationType ?? 'commenting',
    annotationText: data.annotationText ?? '',
    // Legacy docs without visibility default to private (their original behavior).
    visibility: data.visibility ?? 'private',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

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

  async add(input) {
    if (!this.userId) throw new Error('Sign in to add annotations.')
    const normalized = normalizeAnnotationInput(input)

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
    const docRef = await addDoc(collection(this.db, ANNOTATION_COLLECTION), {
      userId: this.userId,
      userDisplayName: normalized.userDisplayName,
      targetIri: normalized.targetIri,
      annotationType: normalized.annotationType,
      annotationText: normalized.annotationText,
      visibility: normalized.visibility,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  }

  subscribeForTarget(annotatesNode, onValue, onError = () => {}) {
    const targetIri = normalizeTargetIri(annotatesNode)
    let stopped = false
    const unsubs = []

    let publicResults = []
    let ownResults = []
    let publicReady = false
    let ownReady = !this.userId   // no own-query when anonymous

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

    import('firebase/firestore')
      .then(({ collection, onSnapshot, query, where }) => {
        if (stopped) return

        const publicQuery = query(
          collection(this.db, ANNOTATION_COLLECTION),
          where('targetIri', '==', targetIri),
          where('visibility', '==', 'public'),
        )
        unsubs.push(onSnapshot(
          publicQuery,
          (snapshot) => {
            publicResults = snapshot.docs.map(annotationFromDoc)
            publicReady = true
            emit()
          },
          onError,
        ))

        if (this.userId) {
          const ownQuery = query(
            collection(this.db, ANNOTATION_COLLECTION),
            where('targetIri', '==', targetIri),
            where('userId', '==', this.userId),
          )
          unsubs.push(onSnapshot(
            ownQuery,
            (snapshot) => {
              ownResults = snapshot.docs.map(annotationFromDoc)
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

  async update(id, { annotationText, visibility }) {
    if (!this.userId) throw new Error('Sign in to edit annotations.')
    const text = annotationText?.trim()
    if (!text) throw new Error('Annotation text cannot be empty.')

    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(this.db, ANNOTATION_COLLECTION, id), {
      annotationText: text,
      visibility: safeVisibility(visibility),
      updatedAt: serverTimestamp(),
    })
  }

  async remove(id) {
    if (!this.userId) throw new Error('Sign in to delete annotations.')
    const { deleteDoc, doc } = await import('firebase/firestore')
    await deleteDoc(doc(this.db, ANNOTATION_COLLECTION, id))
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
