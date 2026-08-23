import { DataFactory } from 'n3'
import { describe, expect, it } from 'vitest'
import {
  datasetStats,
  detectQueryKind,
  createQueryRunContext,
  externalHttpUrl,
  friendlyQueryError,
  queryRunIsStale,
  rowsToTsv,
  shortDatatype,
  stripSparqlComments,
  termToSparqlTsv,
  termQualifier,
} from './workbench.js'

const { blankNode, literal, namedNode } = DataFactory

describe('SPARQL workbench helpers', () => {
  it('recognizes a SELECT after comments and a multi-prefix prologue', () => {
    expect(detectQueryKind(`# a verified query
      PREFIX sstim: <https://w3id.org/sstim#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?term WHERE { GRAPH ?g { ?term a sstim:Preset } }`)).toBe('SELECT')
  })

  it('recognizes non-table query forms without confusing an IRI fragment', () => {
    expect(detectQueryKind('PREFIX ex: <https://example.test/#SELECT> ASK { ?s ?p ?o }')).toBe('ASK')
    expect(detectQueryKind('not a query')).toBe('Unknown')
  })

  it('accepts inline prologue comments and dotted prefix names', () => {
    expect(detectQueryKind(`
      BASE <https://example.test/#base> # base comment
      PREFIX # why this vocabulary is used
        vocab.core: <https://example.test/vocab#>
      SELECT ?term WHERE { ?term a vocab.core:Term }
    `)).toBe('SELECT')
  })

  it('does not exclude legal Unicode prefix labels', () => {
    expect(detectQueryKind(`
      PREFIX música: <https://example.test/music#>
      PREFIX пример: <https://example.test/example#>
      SELECT ?term WHERE { ?term a música:Track }
    `)).toBe('SELECT')
  })

  it('preserves hash characters inside strings and IRI references when stripping comments', () => {
    expect(stripSparqlComments('SELECT * WHERE { <urn:item#one> ?p "value # one" } # remove me'))
      .toBe('SELECT * WHERE { <urn:item#one> ?p "value # one" } ')
  })

  it('explains the SELECT-only page boundary without exposing it as an engine failure', () => {
    const result = friendlyQueryError(new Error('queryBindings does not support ASK'), 'ASK { ?s ?p ?o }')
    expect(result.summary).toContain('SELECT')
    expect(result.summary).toContain('ASK')
    expect(result.guidance).toContain('application code')
  })

  it('counts only named graphs', () => {
    const store = [
      { graph: { termType: 'NamedNode', value: 'urn:g:one' } },
      { graph: { termType: 'NamedNode', value: 'urn:g:one' } },
      { graph: { termType: 'NamedNode', value: 'urn:g:two' } },
      { graph: { termType: 'DefaultGraph', value: '' } },
    ]
    store.size = store.length
    expect(datasetStats(store)).toEqual({ quadCount: 4, namedGraphCount: 2 })
  })

  it('formats literal qualifiers and copy-safe TSV', () => {
    expect(shortDatatype('http://www.w3.org/2001/XMLSchema#decimal')).toBe('xsd:decimal')
    expect(termQualifier({ termType: 'Literal', language: 'en' })).toBe('@en')
    expect(rowsToTsv(['label'], [{ label: literal('one\ttwo\nthree') }]))
      .toBe('?label\n"one\\ttwo\\nthree"')
  })

  it('serializes RDF term identity in SPARQL Results TSV syntax', () => {
    const typed = literal('42', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
    const rows = [{
      iri: namedNode('https://example.test/item'),
      blank: blankNode('result1'),
      language: literal('ciao', 'it'),
      typed,
    }]

    expect(rowsToTsv(['iri', 'blank', 'language', 'typed', 'unbound'], rows)).toBe(
      '?iri\t?blank\t?language\t?typed\t?unbound\n' +
      '<https://example.test/item>\t_:result1\t"ciao"@it\t' +
      '"42"^^<http://www.w3.org/2001/XMLSchema#integer>\t',
    )
    expect(termToSparqlTsv(namedNode('urn:with space'))).toBe('<urn:with\\u0020space>')
  })

  it('distinguishes timeout and user cancellation from query errors', () => {
    const timeout = new Error('Query stopped after 15000 ms.')
    timeout.name = 'QueryTimeoutError'
    expect(friendlyQueryError(timeout, 'SELECT * WHERE { ?s ?p ?o }').summary).toContain('time limit')

    const cancelled = new Error('Query cancelled by the user.')
    cancelled.name = 'AbortError'
    expect(friendlyQueryError(cancelled, 'SELECT * WHERE { ?s ?p ?o }').summary).toContain('cancelled')
  })

  it('links only ordinary web IRIs', () => {
    expect(externalHttpUrl('https://example.test/item')).toBe('https://example.test/item')
    expect(externalHttpUrl('http://example.test/item')).toBe('http://example.test/item')
    for (const value of [
      'javascript:alert(document.domain)',
      'data:text/html,hello',
      'file:///etc/passwd',
      'urn:sstim:result',
      'not an iri',
    ]) {
      expect(externalHttpUrl(value)).toBeNull()
    }
  })

  it('attributes asynchronous results to the query and dataset that actually ran', () => {
    const context = createQueryRunContext('SELECT ?s WHERE { ?s ?p ?o }', 7, 'Static repository dataset')
    expect(queryRunIsStale(context, context.query, 7)).toBe(false)
    expect(queryRunIsStale(context, 'SELECT ?o WHERE { ?s ?p ?o }', 7)).toBe(true)
    expect(queryRunIsStale(context, context.query, 8)).toBe(true)
    expect(context.datasetLabel).toBe('Static repository dataset')
  })
})
