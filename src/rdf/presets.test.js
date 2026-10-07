import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mergeStores, parseIntoStore } from './loader.js'
import { listPresets } from './presets.js'

const PRESET_GRAPH = 'https://w3id.org/sstim/implementation/bsclab/preset/'
const VOCAB_GRAPH = 'https://w3id.org/sstim/graph/vocab'
const REFERENCE_GRAPH = 'https://w3id.org/sstim/ref/'
const FRAMEWORK_GRAPH = 'https://w3id.org/sstim/graph/frameworks'

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
      await parseFixture('../../static/ontology/frameworks/bsc/bsc-vocab.ttl', FRAMEWORK_GRAPH),
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
      modified: '2026-10-06',
      version: '0.1.0',
      hasBreathGuide: false,
    })
    // The group and the voice type now come from the BSC framework vocabulary
    // (ADR 0061), and still reach the page unchanged.
    expect(preset.groups).toEqual([expect.objectContaining({ label: 'Perform' })])
    expect(preset.voiceTypes).toEqual([expect.objectContaining({ label: 'Binaural' })])
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

describe('a preset outside the BSC catalog (GB-10)', () => {
  // Visual and haptic only: no version, no frequency band, no group, no voice.
  const NEUTRAL = `
    @prefix ex:    <https://example.org/presets/> .
    @prefix sstim: <https://w3id.org/sstim#> .
    @prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
    ex:calm-field a sstim:Preset ;
        rdfs:label "Calm colour field with a soft pulse" ;
        sstim:composedOfTrack ex:calm-field-light, ex:calm-field-touch .
    ex:calm-field-light a sstim:VisualTrack ; rdfs:label "Colour field" .
    ex:calm-field-touch a sstim:HapticTrack ; rdfs:label "Soft pulse" .
  `

  it('satisfies sstim-sh:PresetShape, which asks for nothing the catalog adds', async () => {
    const { Parser, Store, DataFactory } = await import('n3')
    const SHACLValidator = (await import('rdf-validate-shacl')).default
    const root = new URL('../../', import.meta.url)
    const manifest = JSON.parse(readFileSync(new URL('static/ontology/manifest.json', root), 'utf8'))
    const parse = (path) => new Parser().parse(readFileSync(new URL(path, root), 'utf8'))
    const shapes = new Store(parse(manifest.modules.find(m => m.id === 'shapes').source.path))
    // rdf-validate-shacl has no SPARQL constraints; pySHACL runs those in make validate.
    for (const q of shapes.getQuads(null, DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql'), null, null)) shapes.delete(q)
    const full = manifest.profiles.find(p => p.id === 'full')
    const data = new Store([
      ...full.modules.flatMap(id => parse(manifest.modules.find(m => m.id === id).source.path)),
      ...new Parser().parse(NEUTRAL),
    ])
    const report = new SHACLValidator(shapes).validate(data)
    expect(report.results.map(r => `${r.focusNode?.value}: ${r.message?.[0]?.value}`)).toEqual([])
  })

  it('is listed, with its track kinds where a catalog preset has voice types', async () => {
    const store = await parseIntoStore(NEUTRAL, 'text/turtle', 'https://example.org/presets/')
    const presets = await listPresets(store)
    expect(presets).toHaveLength(1)
    expect(presets[0]).toMatchObject({
      label: 'Calm colour field with a soft pulse',
      version: '',
      hasBreathGuide: false,
      bands: [],
      groups: [],
      voiceTypes: [],
    })
    expect(presets[0].trackKinds.map(kind => kind.label).sort()).toEqual(['Haptic', 'Visual'])
  })
})
