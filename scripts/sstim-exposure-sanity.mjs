// SPARQL sanity checks for the SSTIM exposure module and exploratory BSC Lab
// experiment instances. This mirrors the runtime loader's named-graph mapping
// while reading files directly from static/ for local validation.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Store } from 'n3'
import { QueryEngine } from '@comunica/query-sparql-rdfjs'
import {
  INSTANCE_SOURCES,
  ONTOLOGY_SOURCES,
  parseIntoStore,
} from '../src/rdf/loader.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const engine = new QueryEngine()

function localPathForUrl(url) {
  if (!url.startsWith('/')) throw new Error(`Expected root-relative URL, got ${url}`)
  return join(repoRoot, 'static', url.slice(1))
}

async function sourceToStore(source) {
  const text = readFileSync(localPathForUrl(source.url), 'utf8')
  return parseIntoStore(text, source.format ?? 'text/turtle', source.graph)
}

async function loadRepoKnowledgeGraph() {
  const merged = new Store()
  const sources = [
    ...Object.values(ONTOLOGY_SOURCES),
    ...Object.values(INSTANCE_SOURCES).flat(),
  ]

  for (const source of sources) {
    const store = await sourceToStore(source)
    for (const quad of store) merged.addQuad(quad)
  }

  return merged
}

async function assertAsk(store, label, sparql) {
  const ok = await engine.queryBoolean(sparql, { sources: [store] })
  if (!ok) throw new Error(`SPARQL sanity check failed: ${label}`)
  console.log(`sparql-sanity: ${label}`)
}

async function assertRows(store, label, sparql, minRows = 1) {
  const bindings = await engine.queryBindings(sparql, { sources: [store] })
  const rows = await bindings.toArray()
  if (rows.length < minRows) {
    throw new Error(`SPARQL sanity check failed: ${label} returned ${rows.length} rows`)
  }
  console.log(`sparql-sanity: ${label} (${rows.length} rows)`)
}

const prefixes = `
PREFIX owl:      <http://www.w3.org/2002/07/owl#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>
PREFIX sstim-ex: <https://w3id.org/sstim/exposure#>
`

const store = await loadRepoKnowledgeGraph()

await assertAsk(store, 'exposure module loaded in named graph', `${prefixes}
ASK {
  GRAPH <https://w3id.org/sstim/graph/exposure> {
    sstim-ex:ExposureProfile a owl:Class .
  }
}
`)

await assertRows(store, 'exposure profiles by delivery medium', `${prefixes}
SELECT ?profile ?medium WHERE {
  GRAPH ?g {
    ?profile a sstim-ex:ExposureProfile ;
      sstim-ex:usesStimulusChannel ?channel .
    ?channel sstim-ex:deliveryMedium ?medium .
  }
}
ORDER BY ?profile ?medium
`, 9)

await assertRows(store, 'perceived modalities by protocol', `${prefixes}
SELECT ?protocol ?modality WHERE {
  GRAPH ?g {
    ?protocol a sstim-ex:ExploratoryProtocol ;
      sstim-ex:hasExposureProfile ?profile .
    ?profile sstim-ex:usesStimulusChannel ?channel .
    ?channel sstim-ex:perceivedModality ?modality .
  }
}
ORDER BY ?protocol ?modality
`, 9)

await assertRows(store, 'device capabilities required by each experiment', `${prefixes}
SELECT ?experiment ?capability WHERE {
  GRAPH ?g {
    ?experiment a sstim-ex:ExploratoryProtocol ;
      sstim-ex:hasExposureProfile ?profile .
    {
      ?experiment sstim-ex:requiresDeviceCapability ?capability .
    } UNION {
      ?profile sstim-ex:requiresDeviceCapability ?capability .
    } UNION {
      ?profile sstim-ex:usesStimulusChannel ?channel .
      ?channel sstim-ex:requiresDeviceCapability ?capability .
    }
  }
}
ORDER BY ?experiment ?capability
`, 9)

await assertRows(store, 'effect claims and knowledge status', `${prefixes}
SELECT ?claim ?status WHERE {
  GRAPH ?g {
    ?claim a sstim-ex:ExposureEffectClaim ;
      sstim-ex:hasKnowledgeStatus ?status .
  }
}
ORDER BY ?claim ?status
`, 9)

await assertRows(store, 'not currently deliverable by BSC Lab', `${prefixes}
SELECT ?resource WHERE {
  GRAPH ?g {
    ?resource sstim-ex:hasKnowledgeStatus sstim-ex:notCurrentlyDeliverableByBSCLab .
  }
}
ORDER BY ?resource
`, 1)

await assertAsk(store, 'exposure vocabulary references are declared', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH ?g {
      ?resource ?property ?object .
      VALUES (?property ?expectedClass) {
        (sstim-ex:deliveryMedium sstim-ex:PhysicalDeliveryMedium)
        (sstim-ex:perceivedModality sstim-ex:PerceivedModality)
        (sstim-ex:requiresDeviceCapability sstim-ex:DeviceCapability)
        (sstim-ex:hasBodyPlacement sstim-ex:BodyPlacement)
        (sstim-ex:hasComfortBoundary sstim-ex:ComfortBoundary)
        (sstim-ex:hasPerceptualGain sstim-ex:PerceptualGain)
        (sstim-ex:hasPerceptualLoss sstim-ex:PerceptualLoss)
        (sstim-ex:hasKnowledgeStatus sstim-ex:KnowledgeStatus)
        (sstim-ex:concernsEffectDimension sstim-ex:EffectDimension)
      }
    }
    FILTER NOT EXISTS {
      GRAPH <https://w3id.org/sstim/graph/exposure> {
        ?object a ?expectedClass .
      }
    }
  }
}
`)

await assertAsk(store, 'exposure SKOS top concepts are declared', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH <https://w3id.org/sstim/graph/exposure> {
      ?scheme skos:hasTopConcept ?concept .
    }
    FILTER NOT EXISTS {
      GRAPH <https://w3id.org/sstim/graph/exposure> {
        ?concept a skos:Concept .
      }
    }
  }
}
`)
