import { describe, expect, it } from 'vitest'
import { Parser } from 'n3'
import { AnnotationStore } from './AnnotationStore.js'

// Golden serialization tests for the Web Annotation RDF projection
// (improvement plan phases 0.1 and 1.5; audit finding KR-12).
// The projection must use the OA model correctly (oa:bodyValue, enumerated
// motivations), fail closed on visibility, and never leak the Firebase
// authentication ID into any exported IRI.

const RAW_UID = 'FirebaseUid1234567890abcdefg'
const PUBLIC_GRAPH = 'https://w3id.org/sstim/implementation/bsclab/annotation/public'
const OA = 'http://www.w3.org/ns/oa#'

const annotation = (over = {}) => ({
  id: 'doc-001',
  userId: RAW_UID,
  targetIri: 'https://w3id.org/sstim#Preset',
  annotationType: 'commenting',
  annotationText: 'A note.',
  visibility: 'public',
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
  ...over,
})

const store = new AnnotationStore(RAW_UID, null)

describe('AnnotationStore RDF projection (KR-12)', () => {
  it('uses oa:bodyValue with a literal body and a whitelisted motivation', async () => {
    const quads = await store.toQuads([annotation()])
    const body = quads.find((q) => q.predicate.value === `${OA}bodyValue`)
    expect(body.object.termType).toBe('Literal')
    expect(body.object.value).toBe('A note.')
    expect(quads.some((q) => q.predicate.value === `${OA}hasBody`)).toBe(false)
    const motivation = quads.find((q) => q.predicate.value === `${OA}motivatedBy`)
    expect(motivation.object.value).toBe(`${OA}commenting`)
  })

  it('never mints a motivation IRI from an unchecked string', async () => {
    const quads = await store.toQuads([annotation({ annotationType: 'totally/../bogus' })])
    const motivation = quads.find((q) => q.predicate.value === `${OA}motivatedBy`)
    expect(motivation.object.value).toBe(`${OA}commenting`)
    expect(quads.some((q) => q.object.value.includes('bogus'))).toBe(false)
  })

  it('places only explicitly public annotations in the public graph', async () => {
    const [pub] = await store.toQuads([annotation()])
    expect(pub.graph.value).toBe(PUBLIC_GRAPH)

    for (const visibility of ['private', 'friends', undefined, null, 'PUBLIC']) {
      const quads = await store.toQuads([annotation({ visibility })])
      expect(quads.every((q) => q.graph.value !== PUBLIC_GRAPH)).toBe(true)
    }
  })

  it('exposes no Firebase-derived identifier in any term', async () => {
    const quads = await store.toQuads([annotation(), annotation({ visibility: 'private', id: 'doc-002' })])
    for (const q of quads) {
      for (const term of [q.subject, q.predicate, q.object, q.graph]) {
        expect(term.value.includes(RAW_UID)).toBe(false)
      }
    }
  })

  it('attributes annotations to a stable per-user pseudonymous agent', async () => {
    const attributed = (quads) =>
      quads.find((q) => q.predicate.value === 'http://www.w3.org/ns/prov#wasAttributedTo').object.value
    const a = attributed(await store.toQuads([annotation()]))
    const b = attributed(await store.toQuads([annotation({ id: 'doc-002' })]))
    const other = attributed(await store.toQuads([annotation({ userId: 'AnotherUid000000000000000000' })]))
    expect(a).toBe(b)
    expect(a).not.toBe(other)
    expect(a).toMatch(/\/user\/[0-9a-f]{24}$/)
  })

  it('rejects targets that are not absolute http(s) IRIs', async () => {
    const { normalizeTargetIri } = await import('./AnnotationStore.js')
    expect(normalizeTargetIri('https://w3id.org/sstim#Preset')).toBe('https://w3id.org/sstim#Preset')
    for (const bad of ['not an iri', 'javascript:alert(1)', 'urn:x:y', '', null]) {
      expect(() => normalizeTargetIri(bad)).toThrow()
    }
  })

  it('serializes to parseable Turtle with dateTime provenance', async () => {
    const ttl = await store.serialize([annotation()])
    const quads = new Parser().parse(ttl)
    expect(quads.length).toBeGreaterThan(4)
    expect(ttl).toContain('dateTime')
  })
})
