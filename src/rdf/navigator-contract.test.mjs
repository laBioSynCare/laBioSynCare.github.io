import { afterEach, describe, expect, it, vi } from 'vitest'
import ontologyManifest from '../../static/ontology/manifest.json' with { type: 'json' }
import { applicationAsset } from '../config/applicationUrls.js'
import {
  INSTANCE_SOURCES,
  LIVE_ECOSYSTEM_FETCH_OPTIONS,
  MODULE_ID_BY_GRAPH_IRI,
  ONTOLOGY_MODULES,
  ONTOLOGY_PROFILES,
  ONTOLOGY_SOURCES,
  ONTOLOGY_URLS,
  loadLiveEcosystem,
  navigatorSources,
  staticInstanceSources,
} from './loader.js'

const LIVE_URL = 'https://biosyncare-lab.web.app/current.ttl'
const LIVE_GRAPH = 'https://w3id.org/sstim/graph/ecosystem-agents'
const fullProfile = ontologyManifest.profiles.find(profile => profile.id === 'full')
const fullProfileModuleIds = [...fullProfile.modules, ...fullProfile.shapeModules]
const fullProfileModules = fullProfileModuleIds.map(id =>
  ontologyManifest.modules.find(module => module.id === id),
)
const sourceKey = id => id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('unified navigator source boundary', () => {
  it('matches the manifest Full profile and its associated shapes exactly', () => {
    const expectedKeys = fullProfileModuleIds.map(sourceKey)

    expect(Object.keys(ONTOLOGY_URLS)).toEqual(expectedKeys)
    expect(Object.keys(ONTOLOGY_SOURCES)).toEqual(expectedKeys)
    expect(ONTOLOGY_URLS).toEqual(Object.fromEntries(
      fullProfileModules.map(module => [sourceKey(module.id), applicationAsset(`/ontology/${module.runtime.url}`)]),
    ))

    expect(Object.values(ONTOLOGY_SOURCES).map(source => ({
      id: source.id,
      title: source.title,
      roles: source.roles,
      url: source.url,
      graph: source.graph,
      persistentUrl: source.persistentUrl,
    }))).toEqual(fullProfileModules.map(module => ({
      id: module.id,
      title: module.title,
      roles: module.roles,
      url: applicationAsset(`/ontology/${module.runtime.url}`),
      graph: module.runtime.graphIri,
      persistentUrl: module.publication.persistentUrl,
    })))
  })

  it('loads terms, browser-addressable catalog records, and the current public ecosystem', () => {
    const sources = navigatorSources()
    expect(sources).toEqual([
      ...Object.values(ONTOLOGY_SOURCES),
      INSTANCE_SOURCES.programmes[0],
      INSTANCE_SOURCES.frameworks[0],
      INSTANCE_SOURCES.implementations[0],
      ...INSTANCE_SOURCES.presets,
      INSTANCE_SOURCES.references[0],
      INSTANCE_SOURCES.ecosystem[0],
    ])

    const urls = sources.map(source => source.url)
    expect(urls.some(url => url.includes('/sessions/'))).toBe(false)
    expect(urls.some(url => url.includes('/experiments/'))).toBe(false)
    expect(urls.filter(url => url.includes('/presets/'))).toHaveLength(2)
    expect(urls.filter(url => url.includes('/references/'))).toHaveLength(1)
    expect(urls.some(url => url.includes('/fixtures/'))).toBe(false)
  })

  it('keeps both mutable ecosystem data and synthetic fixtures out of static routes', () => {
    const sources = staticInstanceSources()
    expect(sources).not.toContainEqual(INSTANCE_SOURCES.ecosystem[0])
    expect(sources).not.toContainEqual(INSTANCE_SOURCES.ecosystemFixtures[0])
  })
})

// ADR 0043 §5 makes the manifest the one bill of materials, and every
// inventory consumer must derive from or verify against it. The graph
// navigator's module filter is such a consumer: before these, its scope list
// was a hand-kept parallel inventory of scheme IRIs and class local names that
// nothing checked. Adding a module to the manifest and not to the picker — or
// renaming one — has to fail here rather than silently drop it from the UI.
describe('navigator module axis', () => {
  it('matches the manifest Full profile module set, in manifest order', () => {
    expect(ONTOLOGY_MODULES.map(module => module.id)).toEqual(fullProfileModuleIds)
  })

  it('carries each module dependency declaration verbatim', () => {
    expect(ONTOLOGY_MODULES.map(module => ({
      id: module.id,
      title: module.title,
      roles: module.roles,
      graph: module.graph,
      requires: module.requires,
    }))).toEqual(fullProfileModules.map(module => ({
      id: module.id,
      title: module.title,
      roles: module.roles,
      graph: module.runtime.graphIri,
      requires: module.requires,
    })))
  })

  it('resolves every loaded named graph back to exactly one module', () => {
    expect(Object.keys(MODULE_ID_BY_GRAPH_IRI)).toHaveLength(fullProfileModuleIds.length)
    expect(new Set(Object.values(MODULE_ID_BY_GRAPH_IRI)))
      .toEqual(new Set(fullProfileModuleIds))
    for (const module of fullProfileModules) {
      expect(MODULE_ID_BY_GRAPH_IRI[module.runtime.graphIri]).toBe(module.id)
    }
  })

  it('publishes every declared profile closure unfiltered', () => {
    expect(ONTOLOGY_PROFILES.map(profile => ({
      id: profile.id,
      modules: profile.modules,
    }))).toEqual(ontologyManifest.profiles.map(profile => ({
      id: profile.id,
      modules: [...profile.modules, ...profile.shapeModules],
    })))
  })

  it('keeps the Kernel/Core/Core Plus closures nested and Full the widest', () => {
    const closure = id => new Set(
      ONTOLOGY_PROFILES.find(profile => profile.id === id).modules,
    )
    const kernel = closure('kernel')
    const core = closure('core')
    const corePlus = closure('core-plus')
    const full = closure('full')

    for (const [narrower, wider] of [[kernel, core], [core, corePlus]]) {
      for (const id of narrower) expect(wider).toContain(id)
    }
    // Full is the widest *semantic* closure, but it deliberately does not
    // contain the smaller profiles' `core-shapes`: a shape graph is a
    // validation selection, never an OWL dependency (ADR 0043 §6). Assert the
    // semantic containment only, so this documents the exception rather than
    // pretending it is not there.
    for (const id of corePlus) {
      if (id === 'core-shapes') continue
      expect(full).toContain(id)
    }
    expect(full.has('core-shapes')).toBe(false)
    expect(corePlus.has('core-shapes')).toBe(true)
  })
})

describe('live ecosystem status contract', () => {
  it('uses privacy-minimizing no-cache fetch options and a dedicated named graph', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<https://example.org/agent> <https://example.org/p> "public" .',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loadLiveEcosystem()

    expect(fetchMock).toHaveBeenCalledWith(LIVE_URL, LIVE_ECOSYSTEM_FETCH_OPTIONS)
    expect(result.status.state).toBe('available')
    expect(result.status.quadCount).toBe(1)
    expect(result.store.getQuads(null, null, null, null)[0].graph.value).toBe(LIVE_GRAPH)
  })

  it('distinguishes a valid empty publication from an unavailable endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '',
    }))
    const empty = await loadLiveEcosystem()
    expect(empty.status.state).toBe('empty')
    expect(empty.store.size).toBe(0)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network offline')))
    const unavailable = await loadLiveEcosystem()
    expect(unavailable.status.state).toBe('unavailable')
    expect(unavailable.status.message).toBe('network offline')
    expect(unavailable.store.size).toBe(0)
    expect(warn).toHaveBeenCalledOnce()
  })
})
