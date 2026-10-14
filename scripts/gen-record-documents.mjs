#!/usr/bin/env node
// Generate one Turtle document per committed record whose family shares files
// (ADR 0065), so that its w3id.org identifier resolves to a document that
// describes that record and nothing else.
//
// References share references.ttl, and evidence records share the evidence
// files and the presets and experiments they belong to. Routing those
// identifiers to the shared files would let a name that is not there land on a
// file that seems to describe it, which is the failure the exact route
// inventory existed to prevent. A record document exists only for a committed
// record, so a wrong name ends at a 404 instead.
//
// The documents are build output, written beside the published /ontology/
// tree and never committed (as ADR 0023 does for the reference docs). Each is
// the record's own triples, its `#` parts and the blank nodes they reach,
// sorted so that a build reproduces it byte for byte.
//
// Usage: node scripts/gen-record-documents.mjs [dist-directory]

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser, Writer } from 'n3'

import { logicalApplicationPath } from '../src/config/applicationUrls.js'
import { INSTANCE_URLS } from '../src/rdf/loader.js'
import { PREFIXES, RDFS, DCT, SKOS } from '../src/rdf/namespaces.js'
import {
  RECORD_DOCUMENT_DIRECTORY,
  matchesRecordGrammar,
  recordDocumentPath,
  recordFamilyOf,
  recordIdentifier,
} from '../src/rdf/recordFamilies.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The committed instance sources the application loads, as paths under static/.
 * Under a mounted build (the Community Group site is served at /sstim/) the
 * loader's URLs carry the mount, which is not a directory in static/.
 */
export function committedInstanceSources() {
  return Object.values(INSTANCE_URLS).flat()
    .map(url => logicalApplicationPath(url))
    .filter(url => url.startsWith('/'))
    .map(url => url.slice(1))
}

const termKey = term => term.termType === 'Literal'
  ? `"${term.value}"@${term.language}^^${term.datatype?.value ?? ''}`
  : `${term.termType}:${term.value}`

// rdf:type first, as a person writes Turtle, then everything else in a stable order.
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
const predicateKey = term => term.value === RDF_TYPE ? '' : termKey(term)

const quadOrder = (a, b) =>
  termKey(a.subject).localeCompare(termKey(b.subject)) ||
  predicateKey(a.predicate).localeCompare(predicateKey(b.predicate)) ||
  termKey(a.object).localeCompare(termKey(b.object))

/** Every IRI a set of quads mentions, datatypes included. */
function iris(quads) {
  const found = new Set()
  const visit = term => {
    if (term.termType === 'NamedNode') found.add(term.value)
    if (term.termType === 'Literal' && term.datatype) found.add(term.datatype.value)
  }
  for (const quad of quads) [quad.subject, quad.predicate, quad.object].forEach(visit)
  return found
}

/** Only the prefixes a document uses, longest base first, as N3.Writer wants. */
function usedPrefixes(quads) {
  const table = Object.entries(PREFIXES).sort((a, b) => b[1].length - a[1].length)
  const used = {}
  for (const iri of iris(quads)) {
    const match = table.find(([, base]) => iri.startsWith(base) && iri.length > base.length)
    if (match) used[match[0]] = match[1]
  }
  return Object.fromEntries(Object.entries(used).sort(([a], [b]) => a.localeCompare(b)))
}

function labelOf(quads, identifier) {
  const literal = predicate => quads.find(quad =>
    quad.subject.value === identifier && quad.predicate.value === predicate &&
    quad.object.termType === 'Literal' && (!quad.object.language || quad.object.language === 'en'))
  return (literal(RDFS('label').value) ?? literal(SKOS('prefLabel').value) ??
    literal(DCT('title').value))?.object.value ?? null
}

/**
 * Every record document, without writing anything: what the build publishes
 * and what scripts/check-w3id-record-routes.mjs proves the routes against.
 *
 * @returns {Array<{identifier: string, family: string, path: string,
 *   sources: string[], quads: object[], turtle: string}>}
 */
export function buildRecordDocuments({ root = ROOT, sources = committedInstanceSources() } = {}) {
  const records = new Map()
  for (const source of sources) {
    const quads = new Parser().parse(readFileSync(join(root, 'static', source), 'utf8'))
    // Blank nodes are scoped to the file they were parsed from.
    const blankQuads = new Map()
    for (const quad of quads) {
      if (quad.subject.termType !== 'BlankNode') continue
      blankQuads.set(quad.subject.value, [...(blankQuads.get(quad.subject.value) ?? []), quad])
    }
    for (const quad of quads) {
      if (quad.subject.termType !== 'NamedNode') continue
      const owner = recordFamilyOf(quad.subject.value)
      if (!owner?.recordDocuments) continue
      const identifier = recordIdentifier(quad.subject.value)
      const record = records.get(identifier) ?? { identifier, family: owner.id, sources: new Set(), own: [], blank: new Set() }
      record.sources.add(source)
      record.own.push(quad)
      const pending = quad.object.termType === 'BlankNode' ? [quad.object.value] : []
      const seen = new Set()
      while (pending.length) {
        const id = pending.pop()
        if (seen.has(id)) continue
        seen.add(id)
        for (const inner of blankQuads.get(id) ?? []) {
          record.blank.add(inner)
          if (inner.object.termType === 'BlankNode') pending.push(inner.object.value)
        }
      }
      records.set(identifier, record)
    }
  }

  return [...records.values()]
    .sort((a, b) => a.identifier.localeCompare(b.identifier))
    .map(record => {
      if (!matchesRecordGrammar(record.identifier)) {
        throw new Error(`${record.identifier} falls outside its family's w3id.org grammar and could never resolve`)
      }
      const quads = record.own.sort(quadOrder)
      const sourceList = [...record.sources].sort()
      return {
        identifier: record.identifier,
        family: record.family,
        path: recordDocumentPath(record.identifier),
        sources: sourceList,
        quads: [...quads, ...record.blank],
        turtle: serialize(record.identifier, quads, [...record.blank], sourceList),
      }
    })
}

function serialize(identifier, quads, blankQuads, sources) {
  const writer = new Writer({ prefixes: usedPrefixes([...quads, ...blankQuads]) })
  const byBlank = new Map()
  for (const quad of blankQuads) {
    byBlank.set(quad.subject.value, [...(byBlank.get(quad.subject.value) ?? []), quad])
  }
  // Blank nodes are written inline, in a stable order, rather than with the
  // parser's generated labels, which would make two builds differ.
  const inline = (term, depth = 0) => {
    if (term.termType !== 'BlankNode' || depth > 16) return term
    return writer.blank((byBlank.get(term.value) ?? []).sort(quadOrder)
      .map(quad => ({ predicate: quad.predicate, object: inline(quad.object, depth + 1) })))
  }
  for (const quad of quads) writer.addQuad(quad.subject, quad.predicate, inline(quad.object))

  let body = ''
  writer.end((error, result) => {
    if (error) throw error
    body = result
  })
  const label = labelOf(quads, identifier)
  const header = [
    ...(label ? [`# ${label}`] : []),
    `# ${identifier}`,
    '#',
    `# Generated from static/${sources.join(' and static/')} when the site is built,`,
    '# so that the identifier above resolves to a document describing this record',
    '# alone (ADR 0065). The record is maintained in that file; do not edit this copy.',
    '',
  ].join('\n')
  return `${header}\n${body}`
}

function main() {
  const dist = resolve(ROOT, process.argv[2] ?? 'dist')
  const target = join(dist, 'ontology', RECORD_DOCUMENT_DIRECTORY)
  rmSync(target, { recursive: true, force: true })
  const documents = buildRecordDocuments()
  for (const document of documents) {
    const path = join(dist, 'ontology', document.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, document.turtle)
  }
  const families = Object.entries(Object.groupBy(documents, document => document.family))
    .map(([family, members]) => `${members.length} ${family}`).join(', ')
  console.log(`gen-record-documents: ${documents.length} record documents (${families}) in ${target}`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (error) {
    console.error(`gen-record-documents: FAIL: ${error.message}`)
    process.exit(1)
  }
}
