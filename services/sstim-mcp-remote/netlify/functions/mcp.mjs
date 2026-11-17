// Public read-only SSTIM reference: no account, write tool, or ontology mutation.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createConceptClient } from '@sstim/mcp/client'
import { z } from 'zod'

const serverInfo = { name: 'sstim-reference', version: '0.3.0' }
const source = createConceptClient()
const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
  idempotentHint: true,
}
function register(server, name, description, inputSchema, run) {
  server.registerTool(name, {
    description,
    inputSchema,
    annotations: readAnnotations,
  }, async (args) => {
    try {
      const data = await run(args)
      return { content: [{ type: 'text', text: JSON.stringify(data) }],
        structuredContent: data }
    } catch (error) {
      // Tool errors are not protocol errors; do not disclose stack traces.
      return { isError: true,
        content: [{ type: 'text', text: String(error?.message ?? 'SSTIM lookup failed') }] }
    }
  })
}
export function buildServer(client = source) {
  const server = new McpServer(serverInfo)
  register(server, 'sstim_list_releases',
    'Read-only: list frozen SSTIM ontology releases and their provenance. Queries the public Concept Reference API; never modifies data.',
    {}, () => client.listReleases())
  register(server, 'sstim_search_concepts',
    'Read-only: search released SSTIM sensory stimulation terminology by label, identifier or definition. Returns release-qualified source terms; not proof of clinical efficacy.',
    {
      query: z.string().min(2).max(160).describe('Search phrase, minimum 2 characters'),
      release: z.string().regex(/^\\d+\\.\\d+\\.\\d+$/).optional().describe('Optional frozen release, e.g. 0.19.0'),
      kind: z.enum(['class', 'property', 'concept']).optional(),
      limit: z.number().int().min(1).max(20).default(10),
      includeDeprecated: z.boolean().default(false),
    }, (args) => client.searchConcepts(args))
  register(server, 'sstim_get_concept',
    'Read-only: retrieve an exact released term with definitions, mappings, declared relations and source provenance. Use a CURIE or IRI obtained from search.',
    {
      identifier: z.string().min(1).max(1024).describe('Exact SSTIM CURIE or IRI'),
      release: z.string().regex(/^\\d+\\.\\d+\\.\\d+$/).optional(),
    }, (args) => client.getConcept(args))
  register(server, 'sstim_prepare_feedback',
    'Read-only: construct a reviewable contribution-page URL for a term or missing-knowledge suggestion. Nothing is saved or submitted; user reviews any public issue.',
    {
      identifier: z.string().min(1).max(1024).optional(),
      release: z.string().regex(/^\\d+\\.\\d+\\.\\d+$/).optional(),
    }, (args) => client.prepareFeedback(args))
  return server
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Use MCP Streamable HTTP POST', {
      status: 405, headers: { Allow: 'POST' },
    })
  }
  // Block cross-origin browser requests; normal server-to-server clients have no Origin.
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return new Response('Origin not permitted', { status: 403 })
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > 1_048_576) {
    return new Response('MCP request too large', { status: 413 })
  }
  const server = buildServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  try {
    await server.connect(transport)
    return await transport.handleRequest(request)
  } finally {
    // Do not close before handleRequest finishes; transport owns response framing.
    await transport.close()
    await server.close()
  }
}

export const config = {
  path: '/mcp',
  rateLimit: { windowSize: 60, windowLimit: 60, aggregateBy: ['ip', 'domain'] },
}
