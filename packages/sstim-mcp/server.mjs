#!/usr/bin/env node
// Read-only SSTIM MCP adapter over stdio, compatible with MCP 2025-11-25.
// One JSON-RPC message per line; no server, authentication or persistence.
// Newer 2026-07-28 hosts must enable their SDK's legacy MCP fallback.
import { createInterface } from 'node:readline'
import { createConceptClient, DEFAULT_API_BASE } from './client.mjs'

const info = { name: 'sstim-reference', version: '0.1.0' }
const supported = new Set(['2025-11-25', '2025-06-18', '2024-11-05'])
const client = createConceptClient({
  apiBase: process.env.SSTIM_MCP_API_BASE || DEFAULT_API_BASE,
})

const tools = [
  {
    name: 'sstim_list_releases',
    description: 'List supported frozen SSTIM ontology releases and the latest published release. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sstim_search_concepts',
    description: 'Search the versioned SSTIM reference catalog by CURIE, IRI, label, alternate label, or definition. Returns exact canonical IRIs with source release; not scientific evidence.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: {
        query: { type: 'string', description: 'Search phrase, at least 2 characters' },
        release: { type: 'string', description: 'Frozen release, for example 0.19.0; defaults to latest' },
        kind: { type: 'string', enum: ['class', 'property', 'concept'] },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
        includeDeprecated: { type: 'boolean', default: false },
      },
      required: ['query'],
    },
  },
  {
    name: 'sstim_get_concept',
    description: 'Return a complete, exact released SSTIM term record with multilingual definitions, related IRIs, mappings and source provenance. Identifier must be IRI or CURIE from SSTIM catalog.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: {
        identifier: { type: 'string', description: 'Exact term IRI or CURIE, e.g. sstim:Stimulation' },
        release: { type: 'string', description: 'Optional frozen release; defaults to latest' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'sstim_prepare_feedback',
    description: 'Create an SSTIM Contribution Bridge link for a user to review and voluntarily submit feedback. Does NOT submit, save or change anything. Never insert private chat text.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: {
        identifier: { type: 'string', description: 'Optional exact term IRI or CURIE; leave empty for a missing-concept idea' },
        release: { type: 'string', description: 'Optional frozen release for term identity' },
      },
    },
  },
].map(tool => ({ ...tool, annotations: { readOnlyHint: true, openWorldHint: true } }))

const commands = {
  sstim_list_releases: (_, c) => c.listReleases(),
  sstim_search_concepts: (args, c) => c.searchConcepts(args),
  sstim_get_concept: (args, c) => c.getConcept(args),
  sstim_prepare_feedback: (args, c) => c.prepareFeedback(args),
}

function validArguments(tool, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return false
  if (Object.keys(args).some(name => !Object.hasOwn(tool.inputSchema.properties, name))) return false
  for (const field of tool.inputSchema.required ?? []) {
    if (!Object.hasOwn(args, field)) return false
  }
  for (const [key, value] of Object.entries(args)) {
    const schema = tool.inputSchema.properties[key]
    if (schema.type === 'integer' && !Number.isInteger(value)) return false
    if (schema.type === 'string' && typeof value !== 'string') return false
    if (schema.type === 'boolean' && typeof value !== 'boolean') return false
    if (schema.enum && !schema.enum.includes(value)) return false
    if (schema.minimum !== undefined && value < schema.minimum) return false
    if (schema.maximum !== undefined && value > schema.maximum) return false
  }
  return true
}

/** Request dispatcher can be unit-tested without a spawned process or network. */
export function makeDispatcher(referenceClient = client) {
  let ready = false
  let initialized = false

  return async function dispatch(input) {
    if (!input || input.jsonrpc !== '2.0' || typeof input.method !== 'string' ||
        (Object.hasOwn(input, 'id') &&
          !(typeof input.id === 'string' || Number.isSafeInteger(input.id)))) {
      return { jsonrpc: '2.0', id: input?.id ?? null,
        error: { code: -32600, message: 'Invalid JSON-RPC request' } }
    }
    const hasId = Object.hasOwn(input, 'id')
    if (!hasId) {
      if (input.method === 'notifications/initialized' && ready) initialized = true
      return null
    }
    const reply = result => ({ jsonrpc: '2.0', id: input.id, result })
    const fail = (code, message) => ({ jsonrpc: '2.0', id: input.id,
      error: { code, message } })
    if (input.method === 'initialize') {
      const offered = input.params?.protocolVersion
      if (typeof offered !== 'string') return fail(-32602, 'protocolVersion is required')
      ready = true
      initialized = false
      return reply({
        protocolVersion: supported.has(offered) ? offered : '2025-11-25',
        capabilities: { tools: { listChanged: false } },
        serverInfo: info,
      })
    }
    if (input.method === 'ping') return reply({})
    if (!ready || !initialized) return fail(-32000, 'Initialize the MCP session first')
    if (input.method === 'tools/list') {
      return reply({ tools })
    }
    if (input.method === 'tools/call') {
      const name = input.params?.name
      const tool = tools.find(t => t.name === name)
      if (!tool) return fail(-32602, 'Unknown MCP tool')
      const args = input.params?.arguments ?? {}
      if (!validArguments(tool, args)) return fail(-32602, 'Invalid MCP tool arguments')
      try {
        const data = await commands[name](args, referenceClient)
        return reply({
          content: [{ type: 'text', text: JSON.stringify(data) }],
          structuredContent: data,
          isError: false,
        })
      } catch (error) {
        return reply({ content: [{ type: 'text', text: String(error?.message ?? 'Tool failed') }],
          isError: true })
      }
    }
    return fail(-32601, 'Method not found')
  }
}

export function serveStdio({ input = process.stdin, output = process.stdout } = {}) {
  const dispatch = makeDispatcher()
  const lines = createInterface({ input, crlfDelay: Infinity })
  lines.on('line', line => {
    if (!line.trim()) return
    if (Buffer.byteLength(line, 'utf8') > 1_048_576) {
      output.write(JSON.stringify({ jsonrpc: '2.0', id: null,
        error: { code: -32600, message: 'Message exceeds maximum length' } }) + '\n')
      return
    }
    let payload
    try { payload = JSON.parse(line) } catch {
      output.write(JSON.stringify({ jsonrpc: '2.0', id: null,
        error: { code: -32700, message: 'Parse error' } }) + '\n')
      return
    }
    dispatch(payload).then(response => {
      if (response !== null) output.write(JSON.stringify(response) + '\n')
    }).catch(() => {
      if (Object.hasOwn(payload ?? {}, 'id')) {
        output.write(JSON.stringify({ jsonrpc: '2.0', id: payload.id ?? null,
          error: { code: -32603, message: 'Internal error' } }) + '\n')
      }
    })
  })
  return lines
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  serveStdio()
}
