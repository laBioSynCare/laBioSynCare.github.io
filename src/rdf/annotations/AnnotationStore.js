import { DataFactory, Writer } from 'n3'
import { requireFirebaseClient } from '../../firebase/client.js'
import { BSCLAB_ANNOTATION, DCT, OA, PREFIXES, PROV, RDF, XSD } from '../namespaces.js'

const { literal, namedNode, quad } = DataFactory

export const ANNOTATION_COLLECTION = 'rdfAnnotations'

export function normalizeTargetIri(target) {
  if (typeof target === 'string') return target
  if (target?.value) return target.value
  throw new Error('Annotation target must be an IRI string or RDF named node.')
}

export function annotationGraphIri(userId) {
  return BSCLAB_ANNOTATION(encodeURIComponent(userId)).value
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
    graphIri: data.graphIri,
    targetIri: data.targetIri,
    annotationType: data.annotationType ?? 'commenting',
    annotationText: data.annotationText ?? '',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function dateTimeLiteral(value) {
  return literal(value, XSD('dateTime'))
}

export class AnnotationStore {
  constructor(userId, db) {
    if (!userId) throw new Error('AnnotationStore requires an authenticated user.')
    this.userId = userId
    this.db = db
    this.graphIri = annotationGraphIri(userId)
  }

  static async forUser(userId) {
    const { db } = await requireFirebaseClient()
    return new AnnotationStore(userId, db)
  }

  async add({ annotatesNode, annotationText, annotationType = 'commenting' }) {
    const text = annotationText?.trim()
    if (!text) throw new Error('Annotation text cannot be empty.')

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
    const docRef = await addDoc(collection(this.db, ANNOTATION_COLLECTION), {
      userId: this.userId,
      graphIri: this.graphIri,
      targetIri: normalizeTargetIri(annotatesNode),
      annotationType,
      annotationText: text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  }

  subscribeForTarget(annotatesNode, onValue, onError = () => {}) {
    const targetIri = normalizeTargetIri(annotatesNode)
    let stopped = false
    let unsubscribe = () => {}

    import('firebase/firestore')
      .then(({ collection, onSnapshot, query, where }) => {
        if (stopped) return
        const userAnnotations = query(
          collection(this.db, ANNOTATION_COLLECTION),
          where('userId', '==', this.userId),
        )

        unsubscribe = onSnapshot(
          userAnnotations,
          (snapshot) => {
            const annotations = snapshot.docs
              .map(annotationFromDoc)
              .filter((annotation) => annotation.targetIri === targetIri)
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            onValue(annotations)
          },
          onError,
        )
      })
      .catch(onError)

    return () => {
      stopped = true
      unsubscribe()
    }
  }

  async update(id, annotationText) {
    const text = annotationText?.trim()
    if (!text) throw new Error('Annotation text cannot be empty.')

    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(this.db, ANNOTATION_COLLECTION, id), {
      annotationText: text,
      updatedAt: serverTimestamp(),
    })
  }

  async remove(id) {
    const { deleteDoc, doc } = await import('firebase/firestore')
    await deleteDoc(doc(this.db, ANNOTATION_COLLECTION, id))
  }

  toQuads(annotations) {
    const graph = namedNode(this.graphIri)
    const actor = namedNode(`https://w3id.org/sstim/implementation/bsclab/user/${encodeURIComponent(this.userId)}`)

    return annotations.flatMap((annotation) => {
      const annotationNode = BSCLAB_ANNOTATION(`${encodeURIComponent(this.userId)}/${annotation.id}`)
      const quads = [
        quad(annotationNode, RDF('type'), OA('Annotation'), graph),
        quad(annotationNode, OA('hasTarget'), namedNode(annotation.targetIri), graph),
        quad(annotationNode, OA('hasBody'), literal(annotation.annotationText), graph),
        quad(annotationNode, OA('motivatedBy'), OA(annotation.annotationType), graph),
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

  serialize(annotations) {
    const writer = new Writer({ prefixes: PREFIXES })
    writer.addQuads(this.toQuads(annotations))
    return new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })
  }
}

export function createAnnotationStore(userId) {
  return AnnotationStore.forUser(userId)
}
