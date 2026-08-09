import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  INSTANCE_SOURCES,
  ONTOLOGY_SOURCES,
  mergeStores,
  parseIntoStore,
  staticInstanceSources,
} from '../../rdf/loader.js'
import { selectLimited } from '../../rdf/query.js'
import { EXAMPLE_QUERIES } from './exampleQueries.js'

const STATIC_ROOT = fileURLToPath(new URL('../../../static/', import.meta.url))
const staticExamples = EXAMPLE_QUERIES.filter(example => !example.requiresLive)
const liveExamples = EXAMPLE_QUERIES.filter(example => example.requiresLive)

async function loadRepositorySource(source) {
  const path = join(STATIC_ROOT, source.url.replace(/^\/+/, ''))
  const text = await readFile(path, 'utf8')
  return parseIntoStore(text, source.format ?? 'text/turtle', source.graph)
}

describe('curated SPARQL example contract', () => {
  let store
  let syntheticLiveStore

  beforeAll(async () => {
    const sources = [
      ...Object.values(ONTOLOGY_SOURCES),
      ...staticInstanceSources(),
    ]
    store = mergeStores(...await Promise.all(sources.map(loadRepositorySource)))
    syntheticLiveStore = mergeStores(
      store,
      ...await Promise.all(INSTANCE_SOURCES.ecosystemFixtures.map(loadRepositorySource)),
    )
  }, 30_000)

  for (const example of staticExamples) {
    it(`executes “${example.title}” against the current static graph`, async () => {
      const result = await selectLimited(store, example.sparql, 10_000, { timeoutMs: 20_000 })

      expect(result.truncated, `${example.id} unexpectedly exceeded the regression-test cap`).toBe(false)
      expect(result.rows.length, `${example.id} no longer demonstrates a matching result`).toBeGreaterThan(0)
      expect(result.columns.length, `${example.id} no longer projects variables`).toBeGreaterThan(0)
    }, 30_000)
  }

  for (const example of liveExamples) {
    it(`executes live example “${example.title}” against the synthetic ecosystem contract`, async () => {
      // The real projection is intentionally mutable and is never copied into
      // a citable test snapshot. Its public-safe synthetic contract exercises
      // the same graph vocabulary and query shape without pinning real people.
      const result = await selectLimited(
        syntheticLiveStore,
        example.sparql,
        10_000,
        { timeoutMs: 20_000 },
      )

      expect(result.truncated).toBe(false)
      expect(result.rows.length).toBeGreaterThan(0)
      expect(result.columns).toEqual(['agentLabel', 'type'])
    }, 30_000)
  }
})
