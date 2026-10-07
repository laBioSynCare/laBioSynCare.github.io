// The default graph a Workbench SPARQL query sees (GB-04), and the two standard
// queries CLAUDE.md §5.3 tells every agent to use.
//
// Until 2026-10-07 both returned nothing useful: the loader keeps every source
// in a named graph, so PRESET_QUERY found no preset and SUBBANDS_QUERY found
// only alpha. The queries are read out of CLAUDE.md itself, so the document and
// this test cannot drift apart, and their row counts are checked against counts
// taken straight from the store rather than from SPARQL.

import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory } from 'n3'
import { AUTHORITATIVE_GRAPH_IRIS, INSTANCE_SOURCES, ONTOLOGY_SOURCES, mergeStores, parseIntoStore } from './loader.js'
import { select } from './query.js'
import { ECOSYSTEM_AGENTS_GRAPH_IRI } from './namespaces.js'

const { namedNode, literal, quad } = DataFactory
const ROOT = new URL('../../', import.meta.url)
const RDF_TYPE = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
const RDFS_LABEL = namedNode('http://www.w3.org/2000/01/rdf-schema#label')
const SKOS_PREF = namedNode('http://www.w3.org/2004/02/skos/core#prefLabel')
const SKOS_NARROWER = namedNode('http://www.w3.org/2004/02/skos/core#narrower')
const SSTIM = (local) => namedNode(`https://w3id.org/sstim#${local}`)
const ANNOTATION_GRAPH = 'https://w3id.org/sstim/implementation/bsclab/annotation/public'

function claudeQuery(name) {
  const text = readFileSync(new URL('CLAUDE.md', ROOT), 'utf8')
  const match = text.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\``))
  if (!match) throw new Error(`CLAUDE.md no longer defines ${name}`)
  return match[1]
}

let store

beforeAll(async () => {
  // What the browser loads, from the repository rather than over the network.
  const sources = [
    ...Object.values(ONTOLOGY_SOURCES),
    ...Object.values(INSTANCE_SOURCES).flat().filter(source => !source.external),
  ]
  const parts = []
  for (const source of sources) {
    const path = new URL(`static/${source.url.replace(/^\/(sstim\/)?/, '')}`, ROOT)
    parts.push(await parseIntoStore(readFileSync(path, 'utf8'), 'text/turtle', source.graph))
  }
  store = mergeStores(...parts)
})

// Every triple once, over the authoritative graphs: the merge a default-graph
// pattern is meant to see.
function subjects(predicate, object) {
  const found = new Set()
  for (const graph of AUTHORITATIVE_GRAPH_IRIS) {
    for (const q of store.getQuads(null, predicate, object, namedNode(graph))) found.add(q.subject.value)
  }
  return [...found]
}
function objects(subject, predicate) {
  const found = new Map()
  for (const graph of AUTHORITATIVE_GRAPH_IRIS) {
    for (const q of store.getQuads(namedNode(subject), predicate, null, namedNode(graph))) found.set(`${q.object.termType}:${q.object.value}:${q.object.language ?? ''}`, q.object)
  }
  return [...found.values()]
}

describe('the default graph is the authoritative merge (GB-04)', () => {
  it('runs CLAUDE.md’s PRESET_QUERY to one row per preset, band and assessed tier', async () => {
    const rows = await select(store, claudeQuery('PRESET_QUERY'))
    let expected = 0
    for (const preset of subjects(RDF_TYPE, SSTIM('Preset'))) {
      const labels = objects(preset, RDFS_LABEL)
      const bands = objects(preset, SSTIM('targetsFrequencyBand'))
        .filter(band => objects(band.value, SKOS_PREF).some(label => label.language === 'en'))
      const claims = subjects(SSTIM('evaluatesSubject'), namedNode(preset))
        .filter(claim => objects(claim, RDF_TYPE).some(type => type.value === SSTIM('EvidenceAssessmentClaim').value))
      const tiers = claims.reduce((n, claim) => n + objects(claim, SSTIM('hasEvidenceTier')).length, 0)
      expected += labels.length * bands.length * Math.max(1, tiers)
    }
    expect(expected).toBeGreaterThan(0)
    expect(rows).toHaveLength(expected)
    expect(new Set(rows.map(row => row.preset.value)).size).toBe(subjects(RDF_TYPE, SSTIM('Preset')).length)
  })

  it('runs CLAUDE.md’s SUBBANDS_QUERY to alpha and every band below it', async () => {
    const rows = await select(store, claudeQuery('SUBBANDS_QUERY'))
    const closure = new Set()
    const pending = ['https://w3id.org/sstim/vocab#alpha']
    while (pending.length) {
      const band = pending.pop()
      if (closure.has(band)) continue
      closure.add(band)
      for (const narrower of objects(band, SKOS_NARROWER)) pending.push(narrower.value)
    }
    expect(closure.size).toBeGreaterThan(1)
    expect(new Set(rows.map(row => row.band.value))).toEqual(closure)
  })

  it('keeps annotations and the live ecosystem projection out of it, and GRAPH still reaches them', async () => {
    const extra = mergeStores(store)
    const intruder = namedNode('https://example.org/not-authoritative')
    extra.addQuad(quad(intruder, RDF_TYPE, SSTIM('Preset'), namedNode(ANNOTATION_GRAPH)))
    extra.addQuad(quad(intruder, RDFS_LABEL, literal('From an annotation graph'), namedNode(ANNOTATION_GRAPH)))
    extra.addQuad(quad(intruder, RDFS_LABEL, literal('From the live projection'), ECOSYSTEM_AGENTS_GRAPH_IRI))

    const plain = await select(extra, 'SELECT ?label WHERE { <https://example.org/not-authoritative> ?p ?label }')
    expect(plain).toEqual([])
    const named = await select(extra, 'SELECT ?label WHERE { GRAPH ?g { <https://example.org/not-authoritative> <http://www.w3.org/2000/01/rdf-schema#label> ?label } }')
    expect(named.map(row => row.label.value).sort()).toEqual(['From an annotation graph', 'From the live projection'])
  })

  it('states each triple once, however many graphs state it', async () => {
    const twice = mergeStores(store)
    const subject = namedNode('https://example.org/stated-twice')
    for (const graph of AUTHORITATIVE_GRAPH_IRIS.slice(0, 2)) {
      twice.addQuad(quad(subject, RDFS_LABEL, literal('Twice'), namedNode(graph)))
    }
    const rows = await select(twice, 'SELECT ?label WHERE { <https://example.org/stated-twice> <http://www.w3.org/2000/01/rdf-schema#label> ?label }')
    expect(rows).toHaveLength(1)
  })
})
