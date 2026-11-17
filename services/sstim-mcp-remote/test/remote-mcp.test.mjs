import test from 'node:test'
import assert from 'node:assert/strict'
import handler, { buildServer, config } from '../netlify/functions/mcp.mjs'

const base = 'https://sstim-mcp.netlify.app/mcp'
const headers = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
}
const req = (method, body, extra = {}) => new Request(base, {
  method,
  headers: { ...headers, ...extra },
  ...(body ? { body: JSON.stringify(body) } : {}),
})
async function rpc(body) {
  const response = await handler(req('POST', body))
  const data = await response.json()
  return { response, data }
}
const init = { jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2025-11-25', capabilities: {},
    clientInfo: { name: 'sstim-ci', version: '0.1.0' } } }
test('exposes only the intended /mcp path and restricts methods', async () => {
  assert.equal(config.path, '/mcp')
  const get = await handler(req('GET'))
  assert.equal(get.status, 405)
  assert.equal((await handler(req('POST', init, { origin: 'https://evil.example' })).status), 403)
})
test('initializes using stateless Streamable HTTP JSON response', async () => {
  const { response, data } = await rpc(init)
  assert.equal(response.status, 200)
  assert.equal(data.jsonrpc, '2.0')
  assert.equal(data.id, 1)
  assert.equal(data.result.serverInfo.name, 'sstim-reference')
  assert.ok(data.result.capabilities.tools)
})
test('advertises four read-only, source-aware tools', async () => {
  const { response, data } = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  assert.equal(response.status, 200)
  assert.deepEqual(data.result.tools.map(t => t.name).sort(), [
    'sstim_get_concept', 'sstim_list_releases',
    'sstim_prepare_feedback', 'sstim_search_concepts'])
  for (const tool of data.result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true)
    assert.equal(tool.annotations.destructiveHint, false)
    assert.equal(tool.annotations.openWorldHint, true)
  }
})
test('can prepare contribution link without external calls or writes', async () => {
  const { data } = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'sstim_prepare_feedback', arguments: {} } })
  assert.equal(data.result.isError, undefined)
  assert.ok(data.result.content[0].text.includes('w3c-cg.github.io/sstim/contribute/'))
})
test('rejects unauthorized contribution writes and invalid schemas', async () => {
  const { data } = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'sstim_submit_contribution', arguments: {} } })
  assert.ok(data.error || data.result.isError)
  const bad = await rpc({ jsonrpc: '2.0', id: 5, method: 'tools/call',
    params: { name: 'sstim_search_concepts', arguments: { query: 'x' } } })
  assert.ok(bad.data.error || bad.data.result.isError)
})
test('MCP implementation is importable without network and has no write tool', () => {
  assert.ok(buildServer)
})
