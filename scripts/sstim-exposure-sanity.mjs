// Executable SSTIM competency queries over the same named graphs loaded by the
// browser. The filename is retained for compatibility with the existing build.

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
  ].filter(source => !source.external)

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
PREFIX dct:      <http://purl.org/dc/terms/>
PREFIX owl:      <http://www.w3.org/2002/07/owl#>
PREFIX prov:     <http://www.w3.org/ns/prov#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>
PREFIX sstim:    <https://w3id.org/sstim#>
PREFIX sstim-v:  <https://w3id.org/sstim/vocab#>
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

await assertRows(store, 'exposure hypotheses and knowledge status', `${prefixes}
SELECT ?claim ?status WHERE {
  GRAPH ?g {
    ?claim a sstim-ex:ExposureHypothesis ;
      sstim-ex:hasKnowledgeStatus ?status .
  }
}
ORDER BY ?claim ?status
`, 7)

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

await assertAsk(store, 'laterality placements are declared and narrower than a bilateral parent', `${prefixes}
ASK {
  GRAPH <https://w3id.org/sstim/graph/exposure> {
    sstim-ex:placementEarLeft a sstim-ex:BodyPlacement ; skos:broader sstim-ex:placementEars .
    sstim-ex:placementEarRight a sstim-ex:BodyPlacement ; skos:broader sstim-ex:placementEars .
    sstim-ex:placementEyeLeft a sstim-ex:BodyPlacement ; skos:broader sstim-ex:placementEyes .
    sstim-ex:placementEyeRight a sstim-ex:BodyPlacement ; skos:broader sstim-ex:placementEyes .
  }
}
`)

// Body placement was once the only hierarchy in this module, so this check used
// to hard-code BodyPlacement as the required type of every skos:broader target.
// ADR 0034 gives delivery media a hierarchy too, so the check is generalized
// rather than relaxed: a broader target must be a declared concept that shares
// a value class with its narrower concept. That still catches a dangling or
// cross-scheme broader link, which is what the original was protecting against.
await assertAsk(store, 'every skos:broader target is a declared concept sharing its child value class', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH <https://w3id.org/sstim/graph/exposure> {
      ?narrow skos:broader ?broad .
    }
    FILTER NOT EXISTS {
      GRAPH <https://w3id.org/sstim/graph/exposure> {
        ?broad a skos:Concept, ?valueClass .
        ?narrow a ?valueClass .
        FILTER(?valueClass != skos:Concept && ?valueClass != owl:NamedIndividual)
      }
    }
  }
}
`)

await assertAsk(store, 'every ExposureLimit cites an external standard', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH <https://w3id.org/sstim/graph/exposure> {
      ?limit a sstim-ex:ExposureLimit .
    }
    FILTER NOT EXISTS {
      GRAPH <https://w3id.org/sstim/graph/exposure> {
        ?limit sstim-ex:conformsToStandard ?std .
      }
    }
  }
}
`)

await assertAsk(store, 'optical-radiation boundary carries an exposure limit', `${prefixes}
ASK {
  GRAPH <https://w3id.org/sstim/graph/exposure> {
    sstim-ex:boundaryOpticalRadiation sstim-ex:hasExposureLimit ?l .
    ?l a sstim-ex:ExposureLimit .
  }
}
`)

await assertRows(store, 'stimulus channels carry quantitative frequency/flicker properties', `${prefixes}
SELECT ?channel ?value WHERE {
  GRAPH ?g {
    ?channel a sstim-ex:StimulusChannel .
    { ?channel sstim-ex:hasFrequencyHz ?value . }
    UNION { ?channel sstim-ex:hasFlickerRateHz ?value . }
    UNION { ?channel sstim-ex:hasBeatFrequencyHz ?value . }
  }
}
ORDER BY ?channel
`, 3)

await assertRows(store, 'framework to protocol to preset chain', `${prefixes}
SELECT DISTINCT ?framework ?protocol ?preset WHERE {
  GRAPH ?protocolGraph {
    ?protocol sstim:definedByFramework ?framework .
  }
  GRAPH ?presetGraph {
    ?preset a sstim:Preset ;
      sstim:followsProtocol ?protocol ;
      sstim:forImplementation ?implementation .
  }
}
ORDER BY ?protocol ?preset
`, 2)

await assertRows(store, 'cited evidence trails with responsible agent', `${prefixes}
SELECT DISTINCT ?claim ?subject ?tier ?reference ?agent WHERE {
  GRAPH ?claimGraph {
    ?claim a sstim:EvidenceClaim ;
      sstim:supportsRelation ?subject ;
      sstim:hasEvidenceTier ?tier ;
      sstim:citesReference ?reference ;
      prov:wasAttributedTo ?agent ;
      dct:modified ?modified .
  }
  GRAPH ?referenceGraph {
    ?reference a sstim:PublicSafeReference ; dct:identifier ?identifier .
  }
}
ORDER BY ?claim
`, 7)

await assertAsk(store, 'no preliminary-or-stronger evidence claim is uncited', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH ?claimGraph {
      ?claim a sstim:EvidenceClaim ; sstim:hasEvidenceTier ?tier .
    }
    GRAPH <https://w3id.org/sstim/graph/vocab> {
      ?tier sstim:tierRank ?rank .
      FILTER(?rank >= 3)
    }
    FILTER NOT EXISTS {
      GRAPH ?citationGraph { ?claim sstim:citesReference ?reference . }
    }
  }
}
`)

await assertRows(store, 'actionable caution metadata ordered by severity', `${prefixes}
SELECT ?caution ?severity ?rank ?action WHERE {
  GRAPH <https://w3id.org/sstim/graph/vocab> {
    ?caution a sstim:CautionTag ;
      sstim:hasCautionSeverity ?severity ;
      sstim:recommendedAction ?action .
    ?severity sstim:cautionSeverityRank ?rank .
  }
}
ORDER BY DESC(?rank) ?caution
`, 11)

await assertRows(store, 'phase-qualified synthetic session reports', `${prefixes}
SELECT ?session ?report ?phase ?collected WHERE {
  GRAPH <https://w3id.org/sstim/implementation/bsclab/session/> {
    ?session a sstim:SessionInstance ; sstim:hasSelfReport ?report .
    ?report a sstim:SelfReport ;
      sstim:hasReportPhase ?phase ;
      prov:generatedAtTime ?collected .
  }
}
ORDER BY ?collected
`, 2)

await assertAsk(store, 'SKOS inverse links are materialized', `${prefixes}
ASK {
  FILTER NOT EXISTS {
    GRAPH ?g { ?scheme skos:hasTopConcept ?concept . }
    FILTER NOT EXISTS { GRAPH ?g { ?concept skos:topConceptOf ?scheme . } }
  }
  FILTER NOT EXISTS {
    GRAPH ?g { ?narrow skos:broader ?broad . }
    FILTER NOT EXISTS { GRAPH ?g { ?broad skos:narrower ?narrow . } }
  }
}
`)
