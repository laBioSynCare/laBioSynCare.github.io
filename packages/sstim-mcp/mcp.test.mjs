import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { describe, expect, it } from 'vitest'
import { createConceptClient, resolveApiBase } from './client.mjs'
import { makeDispatcher } from './server.mjs'

const root = 'https://w3c-cg.github.io/sstim/api/v1/'
const iri = 'https://w3id.org/sstim#Stimulation'
const digest = createHash('sha256').update(iri).digest('hex')
const path = 'terms/' + digest + '.json'
const terms = [
  { iri, curie: 'sstim:Stimulation', kind: 'class', label: 'Stimulation',
    definition: 'Applying a stimulus.', module: 'core', deprecated: false, path },
  { iri: 'https://w3id.org/sstim/vocab#alpha', curie: 'sstim-v:alpha',
    kind: 'concept', label: 'Alpha band', definition: 'Frequency interval.',
    module: 'vocab', deprecated: false, path: 'terms/' + 'f'.repeat(64) + '.json' },
  { iri: 'https://w3id.org/sstim#Old', curie: 'sstim:Old',
    kind: 'class', label: 'Old', deprecated: true,
    module: 'core', path: 'terms/' + 'a'.repeat(64) + '.json' },
]
const releases = ['0.18.0', '0.19.0'].map(version => ({
  version, path: 'releases/' + version + '/index.json', count: terms.length,
}))
const discovery = {
  model: 'sstim-concept-reference-discovery-v1',
  latestRelease: '0.19.0', releases,
}
const makeCatalog = release => ({
  model: 'sstim-concept-reference-v1', release, terms,
})
const makeDetail = version => ({
  iri, curie: 'sstim:Stimulation', label: 'Stimulation', kind: 'class', version,
  definitions: [{ value: 'Applying a stimulus.', language: 'en' }],
  sources: [{ module: 'core', source: 'ontology/' + version + '/sstim-core.ttl' }],
})
function fixtureFetch() {
  const calls = []
  const fetchImpl = async url => {
    const relative = url.href.slice(root.length)
    calls.push(relative)
    let object
    if (relative === 'index.json') object = discovery
    else if (/^releases\/0\.(18|19)\.0\/index\.json$/.test(relative)) {
      object = makeCatalog(relative.split('/')[1])
    } else if (/^releases\/0\.(18|19)\.0\/terms\//.test(relative) &&
      relative.endsWith(digest + '.json')) {
      object = makeDetail(relative.split('/')[1])
    }
    return object ? new Response(JSON.stringify(object), { status: 200,
      headers: { 'content-type': 'application/json' } }) :
      new Response('Not found', { status: 404 })
  }
  return { calls, fetchImpl }
}

describe('SSTIM MCP Concept Reference client', () => {
  it('enforces secure API base and allows loopback fixtures only', () => {
    expect(resolveApiBase(root).href).toBe(root)
    expect(resolveApiBase('http://127.0.0.1:8080/api/v1/').protocol).toBe('http:')
    for (const url of ['http://example.org/api/v1/', 'https://example.org/random/',
      'https://test:secret@example.org/api/v1/', 'https://example.org/api/v1/?x=1']) {
      expect(() => resolveApiBase(url)).toThrow()
    }
  })
  it('discovers release 0.19, searches and retrieves exact term records', async () => {
    const { calls, fetchImpl } = fixtureFetch()
    const c = createConceptClient({ apiBase: root, fetchImpl })
    const info = await c.listReleases()
    expect(info.latestRelease).toBe('0.19.0')
    const found = await c.searchConcepts({ query: 'stimula' })
    expect(found.release).toBe('0.19.0')
    expect(found.results).toHaveLength(1)
    expect(found.results[0].curie).toBe('sstim:Stimulation')
    expect((await c.getConcept({ identifier: iri })).term.version).toBe('0.19.0')
    expect((await c.getConcept({ identifier: 'sstim:Stimulation', release: '0.18.0' })).term.version).toBe('0.18.0')
    const feedback = await c.prepareFeedback({ identifier: 'sstim:Stimulation' })
    expect(new URL(feedback.url).searchParams.get('term')).toBe(iri)
    expect(feedback.notice).toContain('not')
    expect((await c.prepareFeedback()).url).toBe('https://w3c-cg.github.io/sstim/contribute/')
    expect(calls.filter(x => x === 'index.json')).toHaveLength(1)
  })
  it('reports expected errors without confusing released and dev versions', async () => {
    const c = createConceptClient({ apiBase: root, fetchImpl: fixtureFetch().fetchImpl })
    await expect(c.searchConcepts({ query: '' })).rejects.toThrow(/nonempty/)
    await expect(c.searchConcepts({ query: 'a' })).rejects.toThrow(/two/)
    await expect(c.searchConcepts({ query: 'alpha', limit: 21 })).rejects.toThrow(/limit/)
    await expect(c.getConcept({ identifier: 'Stimulation' })).rejects.toThrow(/exact IRI or CURIE/)
    await expect(c.searchConcepts({ query: 'alpha', release: '0.20.0-dev' })).rejects.toThrow(/Unsupported/)
    expect((await c.searchConcepts({ query: 'old' })).results).toHaveLength(0)
    expect((await c.searchConcepts({ query: 'old', includeDeprecated: true })).results).toHaveLength(1)
  })
})

describe('editor MCP configuration examples', () => {
  const sample = name => readFileSync(new URL('./examples/' + name, import.meta.url), 'utf8')

  it('gives a runnable local-stdio shape to VS Code, Cursor and Gemini', () => {
    const vscode = JSON.parse(sample('vscode.mcp.json'))
    const cursor = JSON.parse(sample('cursor.mcp.json'))
    const gemini = JSON.parse(sample('gemini.settings.json'))
    expect(Object.keys(vscode.servers)).toEqual(['sstim'])
    expect(vscode.servers.sstim.type).toBe('stdio')
    for (const config of [vscode.servers.sstim, cursor.mcpServers.sstim,
      gemini.mcpServers.sstim]) {
      expect(config.command).toBe('node')
      expect(config.args).toHaveLength(1)
      expect(config.args[0]).toMatch(/^\/absolute\/path\/to\/sstim\/packages\/sstim-mcp\/server\.mjs$/)
    }
  })

  it('documents distinct Codex TOML and Neovim Lua settings', () => {
    const codex = sample('codex.config.toml')
    const neovim = sample('neovim-codecompanion.lua')
    expect(codex).toContain('[mcp_servers.sstim]')
    expect(codex).toContain('command = "node"')
    expect(neovim).toContain('require("codecompanion").setup')
    expect(neovim).toContain('default_servers = { "sstim" }')
    expect(neovim).toContain('cmd = { "node"')
  })
})

describe('SSTIM MCP protocol dispatcher', () => {
  const mock = {
    listReleases: async () => ({ latestRelease: '0.19.0', releases }),
    searchConcepts: async () => ({ results: [terms[0]], totalMatches: 1 }),
    getConcept: async () => ({ term: makeDetail('0.19.0') }),
    prepareFeedback: async () => ({ url: 'https://w3c-cg.github.io/sstim/contribute/' }),
  }
  it('requires initialization and advertises only read-only tools', async () => {
    const dispatch = makeDispatcher(mock)
    const send = (id, method, params) => dispatch({ jsonrpc: '2.0', id, method, params })
    expect((await send(1, 'tools/list')).error.code).toBe(-32000)
    const init = await send(2, 'initialize', {
      protocolVersion: '2025-11-25', clientInfo: { name: 'test', version: '1' }, capabilities: {},
    })
    expect(init.result.protocolVersion).toBe('2025-11-25')
    expect(init.result.capabilities.tools.listChanged).toBe(false)
    expect(await dispatch({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBe(null)
    const list = await send(3, 'tools/list')
    expect(list.result.tools.map(t => t.name)).toEqual([
      'sstim_list_releases', 'sstim_search_concepts', 'sstim_get_concept', 'sstim_prepare_feedback',
    ])
    expect(list.result.tools.every(x => x.annotations.readOnlyHint)).toBe(true)
    const result = await send(4, 'tools/call', { name: 'sstim_search_concepts',
      arguments: { query: 'stimulation' } })
    expect(result.result.structuredContent.totalMatches).toBe(1)
    expect(result.result.isError).toBe(false)
    const bad = await send(5, 'tools/call', { name: 'sstim_get_concept',
      arguments: { identifier: ['bad'] } })
    expect(bad.error.code).toBe(-32602)
    expect((await send(6, 'tools/call', { name: 'not_a_tool' })).error.code).toBe(-32602)
    expect((await send(7, 'server/discover')).error.code).toBe(-32601)
  })
  it('responds over actual newline-delimited stdio without diagnostic stdout', async () => {
    const child = spawn(process.execPath, [new URL('./server.mjs', import.meta.url).pathname], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const reader = createInterface({ input: child.stdout, crlfDelay: Infinity })
    const responses = []
    reader.on('line', line => responses.push(JSON.parse(line)))
    const send = value => child.stdin.write(JSON.stringify(value) + '\n')
    try {
      send({ jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-11-25', capabilities: {},
          clientInfo: { name: 'test', version: '1' } } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
      child.stdin.end()
      await Promise.race([
        once(child, 'close'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('stdio server timeout')), 5000)),
      ])
      expect(responses.map(x => x.id)).toEqual([1, 2])
      expect(responses[1].result.tools.length).toBe(4)
    } finally {
      if (child.exitCode === null) child.kill()
      reader.close()
    }
  })
})
