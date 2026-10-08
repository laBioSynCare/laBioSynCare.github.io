import { Parser } from 'n3'
import { LIVE_ECOSYSTEM_URL } from '../../rdf/liveEcosystem.js'
import {
  DCT,
  RDF,
  RDFS,
  SCHEMA,
  SSTIM_ECO,
  SSTIM_ORGANIZATION,
  SSTIM_SPECIALIST,
} from '../../rdf/namespaces.js'

const ORGANIZATION_BASE = SSTIM_ORGANIZATION('').value
const SPECIALIST_BASE = SSTIM_SPECIALIST('').value
const AGENT_BASE = ORGANIZATION_BASE.slice(0, ORGANIZATION_BASE.length - 'organization/'.length)

/**
 * The ecosystem agents the live store holds, keyed by their path under
 * https://w3id.org/sstim/ (`organization/…` or `specialist/…`), which is the
 * key a directory entry's `agent` uses and the graph's deep link is built from.
 *
 * A label is chosen in English when one is tagged, so an agent with both
 * spellings of its name (Æterni Anima, Aeterni Anima) shows one.
 */
export function parseLiveAgents(turtle) {
  const quads = new Parser().parse(turtle)
  const agentType = SSTIM_ECO('EcosystemAgent').value
  const agents = new Map()
  for (const quad of quads) {
    if (quad.predicate.value === RDF('type').value && quad.object.value === agentType) {
      const iri = quad.subject.value
      if (!iri.startsWith(ORGANIZATION_BASE) && !iri.startsWith(SPECIALIST_BASE)) continue
      agents.set(iri, {
        iri,
        path: iri.slice(AGENT_BASE.length),
        kind: iri.startsWith(SPECIALIST_BASE) ? 'person' : 'organization',
        name: '',
        description: '',
        url: '',
        relationships: 0,
      })
    }
  }
  for (const quad of quads) {
    const agent = agents.get(quad.subject.value)
    if (!agent) continue
    const predicate = quad.predicate.value
    if (predicate === RDFS('label').value && (!agent.name || quad.object.language === 'en')) {
      agent.name = quad.object.value
    } else if (predicate === DCT('description').value) {
      agent.description = quad.object.value
    } else if (predicate === SCHEMA('url').value) {
      agent.url = quad.object.value
    } else if (predicate === SSTIM_ECO('hasEcosystemRelationship').value) {
      agent.relationships += 1
    }
  }
  return new Map([...agents.values()].map(agent => [agent.path, agent]))
}

/** Fetch and parse the live store; rejects when it cannot be read. */
export async function fetchLiveAgents(fetchImpl = fetch) {
  const response = await fetchImpl(LIVE_ECOSYSTEM_URL, {
    headers: { Accept: 'text/turtle' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`live ecosystem store answered ${response.status}`)
  return parseLiveAgents(await response.text())
}
