import { DataFactory, Writer } from 'n3'
import { requireFirebaseClient } from '../../firebase/client.js'
import { BSCLAB_ANNOTATION, DCT, OA, PREFIXES, PROV, RDF, XSD } from '../namespaces.js'

const { literal, namedNode, quad } = DataFactory

export const ANNOTATION_COLLECTION = 'rdfAnnotations'

const VISIBILITY_VALUES = new Set(['public', 'private'])

export function normalizeTargetIri(target) {
  const value = typeof target === 'string' ? target : target?.value
  if (typeof value === 'string' && /^https?:\/\/\S+$/.test(value)) return value
  throw new Error('Annotation target must be an absolute http(s) IRI or RDF named node.')
}

// Anything not explicitly 'public' is treated as private (fail closed).
function safeVisibility(value) {
  return VISIBILITY_VALUES.has(value) ? value : 'private'
}

// The Web Annotation motivation vocabulary (https://www.w3.org/TR/annotation-vocab/).
// Only these may become oa:motivatedBy IRIs; anything else falls back to
// oa:commenting instead of minting an IRI from an unchecked string.
const OA_MOTIVATIONS = new Set([
  'assessing', 'bookmarking', 'classifying', 'commenting', 'describing',
  'editing', 'highlighting', 'identifying', 'linking', 'moderating',
  'questioning', 'replying', 'tagging',
])

function safeMotivation(value) {
  return OA_MOTIVATIONS.has(value) ? value : 'commenting'
}

// RDF exports never carry the Firebase authentication ID. Agent and graph
// IRIs use a deterministic SHA-256-derived pseudonym instead: stable enough
// for attribution across exports, but not an authentication identifier.
// Linking a pseudonym to a public identity requires explicit consent and is
// deliberately not implemented here.
const pseudonymCache = new Map()

async function pseudonymFor(userId) {
  if (!userId) return 'anonymous'
  if (pseudonymCache.has(userId)) return pseudonymCache.get(userId)
  const bytes = new TextEncoder().encode(`bsclab-annotation-agent:${userId}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  pseudonymCache.set(userId, hex)
  return hex
}

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

function dateTimeLiteral(value) {
  return literal(value, XSD('dateTime'))
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

  get isAuthenticated() {
    return Boolean(this.userId)
  }

  async add({ annotatesNode, annotationText, annotationType = 'commenting', visibility = 'private', userDisplayName = '' }) {
    if (!this.userId) throw new Error('Sign in to add annotations.')
    const text = annotationText?.trim()
    if (!text) throw new Error('Annotation text cannot be empty.')

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
    const docRef = await addDoc(collection(this.db, ANNOTATION_COLLECTION), {
      userId: this.userId,
      userDisplayName: typeof userDisplayName === 'string' ? userDisplayName.slice(0, 200) : '',
      targetIri: normalizeTargetIri(annotatesNode),
      annotationType,
      annotationText: text,
      visibility: safeVisibility(visibility),
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

  async toQuads(annotations) {
    const publicGraph = namedNode('https://w3id.org/sstim/implementation/bsclab/annotation/public')
    const pseudonyms = new Map()
    for (const annotation of annotations) {
      if (!pseudonyms.has(annotation.userId)) {
        pseudonyms.set(annotation.userId, await pseudonymFor(annotation.userId))
      }
    }

    return annotations.flatMap((annotation) => {
      const ownerSegment = pseudonyms.get(annotation.userId)
      const annotationNode = BSCLAB_ANNOTATION(`${ownerSegment}/${annotation.id}`)
      const actor = namedNode(`https://w3id.org/sstim/implementation/bsclab/user/${ownerSegment}`)
      // Fail closed: only an explicit 'public' reaches the public graph.
      const graph = safeVisibility(annotation.visibility) === 'public'
        ? publicGraph
        : BSCLAB_ANNOTATION(ownerSegment)
      const quads = [
        quad(annotationNode, RDF('type'), OA('Annotation'), graph),
        quad(annotationNode, OA('hasTarget'), namedNode(annotation.targetIri), graph),
        quad(annotationNode, OA('bodyValue'), literal(annotation.annotationText), graph),
        quad(annotationNode, OA('motivatedBy'), OA(safeMotivation(annotation.annotationType)), graph),
        quad(annotationNode, PROV('wasAttributedTo'), actor, graph),
      ]

      if (annotation.createdAt) {
        quads.push(quad(annotationNode, DCT('created'), dateTimeLiteral(annotation.createdAt), graph))
      }
      if (annotation.updatedAt) {
        quads.push(quad(annotationNode, DCT('modified'), dateTimeLiteral(annotation.updatedAt), graph))
      }

      return quads
    })
  }

  async serialize(annotations) {
    const writer = new Writer({ prefixes: PREFIXES })
    writer.addQuads(await this.toQuads(annotations))
    return new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })
  }
}

export function createAnnotationStore(userId) {
  return userId ? AnnotationStore.forUser(userId) : AnnotationStore.forReader()
}
