#!/usr/bin/env node
// Run on a GitHub-hosted runner after the Netlify site is deployed.
// Tests the actual remote HTTP endpoint, not an in-process handler.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const url = process.env.SSTIM_MCP_ENDPOINT || 'https://sstim-mcp.netlify.app/mcp'
const headers = {
  accept: 'application/json, text/event-stream',
  'content-type': 'application/json',
  'mcp-protocol-version': '2025-11-25',
}
async function invoke(method, params, id) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  })
  assert.equal(response.status, 200, method + ' returned HTTP ' + response.status)
  assert.match(response.headers.get('content-type') || '', /application\/json/, 'Expected stateless JSON response')
  const data = await response.json()
  assert.equal(data.id, id)
  assert.equal(data.jsonrpc, '2.0')
  assert.ok(!data.error, method + ' JSON-RPC failure: ' + JSON.stringify(data.error))
  return data.result
}
function jsonText(result) {
  assert.ok(!result.isError, 'Tool returned error: ' + result.content?.[0]?.text)
  assert.ok(result.content?.some(x => x.type === 'text'))
  return JSON.parse(result.content.find(x => x.type === 'text').text)
}
// OpenAI requires the raw token (not HTML) at the hostname root.
const expectedChallenge = await readFile(new URL('../public/.well-known/openai-apps-challenge', import.meta.url), 'utf8')
const challengeUrl = new URL('/.well-known/openai-apps-challenge', url)
const challengeResponse = await fetch(challengeUrl, { signal: AbortSignal.timeout(20000) })
assert.equal(challengeResponse.status, 200, 'Challenge URL returned HTTP ' + challengeResponse.status)
const actualChallenge = await challengeResponse.text()
assert.equal(actualChallenge.trim(), expectedChallenge.trim(),
  'OpenAI domain challenge payload differs from the published source')
assert.ok(!actualChallenge.includes('<html'), 'Expected raw token, not an HTML page')
console.log('SSTIM OpenAI domain challenge PASS:', challengeUrl.href)
const get = await fetch(url, { signal: AbortSignal.timeout(20000) })
assert.equal(get.status, 405, 'GET should not open a serverless SSE stream')
const initialized = await invoke('initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: { name: 'sstim-live-smoke', version: '1.0.0' },
}, 1)
assert.equal(initialized.serverInfo.name, 'sstim-reference')
const listed = await invoke('tools/list', {}, 2)
const names = listed.tools.map(x => x.name).sort()
assert.deepEqual(names, ['sstim_get_concept', 'sstim_list_releases', 'sstim_prepare_feedback', 'sstim_search_concepts'])
assert.ok(listed.tools.every(x => x.annotations?.readOnlyHint === true && x.annotations?.destructiveHint === false))
assert.ok(listed.tools.every(x => typeof x.title === 'string' && x.title.length > 5 &&
  x.annotations?.title === x.title), 'Anthropic requires a readable title for every tool')

const releases = jsonText(await invoke('tools/call', { name:'sstim_list_releases', arguments:{} }, 3))
assert.match(releases.latestRelease, /^\d+\.\d+\.\d+$/)
assert.ok(Array.isArray(releases.releases) && releases.releases.length)
const search = jsonText(await invoke('tools/call', {
  name:'sstim_search_concepts', arguments:{ query:'stimulat', limit:3 },
}, 4))
assert.ok(Array.isArray(search.results))
assert.ok(search.results.length > 0, 'Search produced no results')
assert.ok(search.results.every(x => /^https:\/\//.test(x.iri)))
const first = search.results[0]
const concept = jsonText(await invoke('tools/call', {
  name:'sstim_get_concept', arguments:{ identifier:first.curie || first.iri, release:search.release },
}, 5))
assert.equal(concept.term.iri, first.iri)
assert.equal(concept.release, search.release)
const feedback = jsonText(await invoke('tools/call', {
  name:'sstim_prepare_feedback', arguments:{},
}, 6))
assert.match(feedback.url, /^https:\/\/w3c-cg\.github\.io\/sstim\/contribute\//)

const rejected = await fetch(url, {
  method:'POST', headers, signal:AbortSignal.timeout(20000),
  body:JSON.stringify({ jsonrpc:'2.0', id:7, method:'tools/call',
    params:{name:'sstim_submit_contribution',arguments:{}} }),
})
assert.equal(rejected.status, 200)
const noWrite = await rejected.json()
assert.ok(noWrite.error || noWrite.result?.isError, 'Write tool should not be callable')
console.log('SSTIM remote MCP live smoke PASS: HTTP, initialization, read-only inventory, API lookups, term provenance, feedback, and no-write boundary')
console.log('Latest release:', releases.latestRelease, 'Concept:', first.curie || first.iri)
