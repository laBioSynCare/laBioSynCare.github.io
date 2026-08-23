import { DataFactory, Store } from 'n3'
import { describe, expect, it } from 'vitest'
import { selectLimited } from './query.js'

const { namedNode, quad } = DataFactory

function threeRowStore() {
  return new Store([
    quad(namedNode('urn:item:1'), namedNode('urn:rank'), namedNode('urn:value:1')),
    quad(namedNode('urn:item:2'), namedNode('urn:rank'), namedNode('urn:value:2')),
    quad(namedNode('urn:item:3'), namedNode('urn:rank'), namedNode('urn:value:3')),
  ])
}

const QUERY = 'SELECT ?item WHERE { ?item <urn:rank> ?value } ORDER BY ?item'

describe('bounded SPARQL SELECT execution', () => {
  it('collects only the requested number of rows and reports truncation', async () => {
    const result = await selectLimited(threeRowStore(), QUERY, 2)

    expect(result.truncated).toBe(true)
    expect(result.columns).toEqual(['item'])
    expect(result.rows.map(row => row.item.value)).toEqual(['urn:item:1', 'urn:item:2'])
  })

  it('reports a complete result when it fits below the limit', async () => {
    const result = await selectLimited(threeRowStore(), QUERY, 5)

    expect(result.truncated).toBe(false)
    expect(result.rows).toHaveLength(3)
  })

  it('rejects invalid limits before loading the query engine', async () => {
    await expect(selectLimited(threeRowStore(), QUERY, 0)).rejects.toThrow('positive integer')
  })

  it('preserves SELECT projection order from engine result metadata', async () => {
    const result = await selectLimited(
      threeRowStore(),
      `SELECT ?value ?item ?optional WHERE {
        ?item <urn:rank> ?value .
        OPTIONAL { ?item <urn:missing> ?optional }
      } ORDER BY ?item`,
      5,
    )

    expect(result.columns).toEqual(['value', 'item', 'optional'])
  })

  it('allows standards-compliant Unicode PREFIX labels through Comunica', async () => {
    const result = await selectLimited(
      threeRowStore(),
      'PREFIX пример: <urn:> SELECT ?item WHERE { ?item пример:rank ?value } ORDER BY ?item',
      5,
    )

    expect(result.rows).toHaveLength(3)
  })

  it('honors a caller cancellation signal', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(selectLimited(threeRowStore(), QUERY, 5, { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
  })

  it('stops a broad result stream at the requested time limit', async () => {
    const store = new Store()
    for (let index = 0; index < 500; index += 1) {
      store.addQuad(quad(
        namedNode(`urn:large:${index}`),
        namedNode('urn:rank'),
        namedNode(`urn:value:${index}`),
      ))
    }

    await expect(selectLimited(
      store,
      'SELECT ?left ?right WHERE { ?left <urn:rank> ?x . ?right <urn:rank> ?y }',
      1_000_000,
      { timeoutMs: 5 },
    )).rejects.toMatchObject({ name: 'QueryTimeoutError' })
  })
})
