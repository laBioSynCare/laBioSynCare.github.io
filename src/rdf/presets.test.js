import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mergeStores, parseIntoStore } from './loader.js'
import { listPresets } from './presets.js'

const PRESET_GRAPH = 'https://w3id.org/sstim/implementation/bsclab/preset/'
const VOCAB_GRAPH = 'https://w3id.org/sstim/graph/vocab'
const REFERENCE_GRAPH = 'https://w3id.org/sstim/ref/'

async function parseFixture(relativePath, graphIri) {
  const turtle = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  return parseIntoStore(turtle, 'text/turtle', graphIri)
}

function expectUniqueIris(items) {
  const iris = items.map(item => item.iri)
  expect(new Set(iris).size).toBe(iris.length)
}

describe('listPresets', () => {
  it('preserves public catalog provenance, safety, and evidence metadata without duplicates', async () => {
    const store = mergeStores(
      await parseFixture(
        '../../static/ontology/instances/presets/perform-alpha-10-seed.ttl',
        PRESET_GRAPH,
      ),
      await parseFixture('../../static/ontology/sstim-vocab.ttl', VOCAB_GRAPH),
      await parseFixture(
        '../../static/ontology/instances/references/references.ttl',
        REFERENCE_GRAPH,
      ),
    )

    const presets = await listPresets(store)
    const preset = presets.find(item => item.id === 'perform-alpha-10-seed')

    expect(preset).toBeDefined()
    expect(preset).toMatchObject({
      graphIri: PRESET_GRAPH,
      created: '2026-06-17',
      modified: '2026-07-10',
      version: '0.1.0',
    })
    expect(preset.cautions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Driving Unsafe',
        recommendedAction: expect.stringContaining('Do not start the preset'),
      }),
    ]))
    expect(preset.tiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Speculative', rank: 1 }),
    ]))
    expect(preset.claimDirections).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Inconclusive' }),
    ]))
    expect(preset.evidenceClaims).toHaveLength(1)
    expect(preset.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        iri: 'https://w3id.org/sstim/ref/INGENDOH_2023',
        title: expect.any(String),
        source: 'https://doi.org/10.1371/journal.pone.0286023',
      }),
    ]))

    for (const items of [
      preset.groups,
      preset.bands,
      preset.voiceTypes,
      preset.protocols,
      preset.implementations,
      preset.publicClaimLevels,
      preset.cautions,
      preset.evidenceClaims,
      preset.claimDirections,
      preset.tiers,
      preset.references,
    ]) {
      expectUniqueIris(items)
    }
  })
})
