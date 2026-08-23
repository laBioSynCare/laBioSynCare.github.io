// Annotation validation and RDF projection — deliberately backend-independent.
//
// Extracted so every annotation store shares one definition of what an
// annotation may contain and how it becomes RDF. A local store and a Firestore
// store that disagreed on visibility handling or pseudonymisation would be a
// privacy bug, not a formatting difference, so the rules live in one place and
// the implementations only decide *where* records are kept.

import { DataFactory, Writer } from 'n3'
import { BSCLAB_ANNOTATION, DCT, OA, PREFIXES, PROV, RDF, XSD } from '../namespaces.js'

const { literal, namedNode, quad } = DataFactory

const VISIBILITY_VALUES = new Set(['public', 'private'])

export function normalizeTargetIri(target) {
  const value = typeof target === 'string' ? target : target?.value
  if (typeof value === 'string' && /^https?:\/\/\S+$/.test(value)) return value
  throw new Error('Annotation target must be an absolute http(s) IRI or RDF named node.')
}

/** Anything not explicitly 'public' is private. Fail closed. */
export function safeVisibility(value) {
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

export function safeMotivation(value) {
  return OA_MOTIVATIONS.has(value) ? value : 'commenting'
}

// RDF exports never carry the Firebase authentication ID. Agent and graph
// IRIs use a deterministic SHA-256-derived pseudonym instead: stable enough
// for attribution across exports, but not an authentication identifier.
// Linking a pseudonym to a public identity requires explicit consent and is
// deliberately not implemented here.
const pseudonymCache = new Map()

export async function pseudonymFor(userId) {
  if (!userId) return 'anonymous'
  if (pseudonymCache.has(userId)) return pseudonymCache.get(userId)
  const bytes = new TextEncoder().encode(`bsclab-annotation-agent:${userId}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  pseudonymCache.set(userId, hex)
  return hex
}

function dateTimeLiteral(value) {
  return literal(value, XSD('dateTime'))
}

/** Project annotation records into quads, public ones into the shared graph. */
export async function annotationsToQuads(annotations) {
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

/** Serialize annotation records to Turtle with the project prefix map. */
export async function serializeAnnotations(annotations) {
  const writer = new Writer({ prefixes: PREFIXES })
  writer.addQuads(await annotationsToQuads(annotations))
  return new Promise((resolve, reject) => {
    writer.end((error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}

/** Shape validation shared by every implementation's `add`. */
export function normalizeAnnotationInput({
  annotatesNode,
  annotationText,
  annotationType = 'commenting',
  visibility = 'private',
  userDisplayName = '',
}) {
  const text = annotationText?.trim()
  if (!text) throw new Error('Annotation text cannot be empty.')
  return {
    targetIri: normalizeTargetIri(annotatesNode),
    annotationText: text,
    annotationType,
    visibility: safeVisibility(visibility),
    userDisplayName: typeof userDisplayName === 'string' ? userDisplayName.slice(0, 200) : '',
  }
}
