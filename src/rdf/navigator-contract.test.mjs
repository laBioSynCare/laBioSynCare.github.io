import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  INSTANCE_SOURCES,
  LIVE_ECOSYSTEM_FETCH_OPTIONS,
  loadLiveEcosystem,
  navigatorSources,
  staticInstanceSources,
} from './loader.js'

const LIVE_URL = 'https://biosyncare-lab.web.app/current.ttl'
const LIVE_GRAPH = 'https://w3id.org/sstim/graph/ecosystem-agents'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('unified navigator source boundary', () => {
  it('loads only terms, catalog, and the current public ecosystem', () => {
    const sources = navigatorSources()
    expect(sources).toHaveLength(10)
    expect(sources).toContainEqual(INSTANCE_SOURCES.frameworks[0])
    expect(sources).toContainEqual(INSTANCE_SOURCES.implementations[0])
    expect(sources).toContainEqual(INSTANCE_SOURCES.ecosystem[0])

    const urls = sources.map(source => source.url)
    expect(urls.some(url => url.includes('/sessions/'))).toBe(false)
    expect(urls.some(url => url.includes('/experiments/'))).toBe(false)
    expect(urls.some(url => url.includes('/presets/'))).toBe(false)
    expect(urls.some(url => url.includes('/fixtures/'))).toBe(false)
  })

  it('keeps both mutable ecosystem data and synthetic fixtures out of static routes', () => {
    const sources = staticInstanceSources()
    expect(sources).not.toContainEqual(INSTANCE_SOURCES.ecosystem[0])
    expect(sources).not.toContainEqual(INSTANCE_SOURCES.ecosystemFixtures[0])
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
