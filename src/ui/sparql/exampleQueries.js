// Curated, verified-working example SPARQL queries for the /sparql/ playground.
//
// Every source (core, vocab, shapes, alignments, each catalog instance file,
// the live ecosystem projection) is loaded into its own named graph — see
// src/rdf/loader.js's ONTOLOGY_SOURCES / INSTANCE_SOURCES. A query joining
// across sources therefore needs one independently wildcarded `GRAPH ?g { }`
// block per source (the pattern already used in src/rdf/presets.js's
// PRESET_QUERY), not a single shared graph variable — reusing one `?g` across
// a cross-source join silently returns zero rows. Every query below was run
// against the real running app before being added here.

export const EXAMPLE_QUERIES = [
  {
    id: 'vocab-modality-domains',
    category: 'Vocabulary',
    title: 'Auditory & visual technique vocabulary',
    description:
      'Every technique concept tagged with the auditory or visual sensory modality (sstim:techniqueModality), grouped by domain. Swap the two modality IRIs in the FILTER for somatosensory, interoceptive, or vestibular.',
    requiresLive: false,
    sparql: `PREFIX sstim: <https://w3id.org/sstim#>
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?modalityLabel ?techLabel WHERE {
  GRAPH ?g {
    ?tech sstim:techniqueModality ?modality ;
          skos:prefLabel ?techLabel .
    ?modality skos:prefLabel ?modalityLabel .
    FILTER(?modality IN (sstim-v:modalityAuditory, sstim-v:modalityVisual))
    FILTER(LANG(?techLabel) = "en")
    FILTER(LANG(?modalityLabel) = "en")
  }
}
ORDER BY ?modalityLabel ?techLabel`,
  },
  {
    id: 'concept-neighbors',
    category: 'Ontology structure',
    title: 'A class and its immediate neighbors',
    description:
      'sstim:SensoryStimulationTechnique — its declared superclass(es) and direct subclasses (one hop up, one hop down). Change the BIND line to explore any other class, e.g. sstim:Preset or sstim:EvidenceClaim.',
    requiresLive: false,
    sparql: `PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?relation ?neighbor ?neighborLabel WHERE {
  GRAPH ?g {
    BIND(sstim:SensoryStimulationTechnique AS ?focus)
    {
      ?focus rdfs:subClassOf ?neighbor .
      BIND("broader (superclass)" AS ?relation)
    } UNION {
      ?neighbor rdfs:subClassOf ?focus .
      BIND("narrower (subclass)" AS ?relation)
    }
    OPTIONAL { ?neighbor rdfs:label ?neighborLabel . FILTER(LANG(?neighborLabel) = "en") }
  }
}
ORDER BY ?relation ?neighborLabel`,
  },
  {
    id: 'catalog-presets',
    category: 'Catalog',
    title: 'Versioned catalog — presets, band, and group',
    description:
      'sstim:Preset instances from the versioned catalog joined to their frequency band and preset group labels — three different named graphs, joined via three independent GRAPH blocks.',
    requiresLive: false,
    sparql: `PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?presetLabel ?bandLabel ?groupLabel WHERE {
  GRAPH ?presetGraph {
    ?preset a sstim:Preset ;
            rdfs:label ?presetLabel ;
            sstim:targetsFrequencyBand ?band ;
            sstim:inGroup ?group .
  }
  GRAPH ?bandGraph { ?band skos:prefLabel ?bandLabel . FILTER(LANG(?bandLabel) = "en") }
  GRAPH ?groupGraph { ?group skos:prefLabel ?groupLabel . FILTER(LANG(?groupLabel) = "en") }
}
ORDER BY ?presetLabel`,
  },
  {
    id: 'ecosystem-live',
    category: 'Ecosystem',
    title: 'Live ecosystem — people & organizations',
    description:
      'The current public ecosystem projection (people, organizations, and their relationships) — mutable, fetched at runtime from biosyncare-lab.web.app, and excluded from citable releases. Requires "Include live public ecosystem" below; selecting this example turns it on for you.',
    requiresLive: true,
    sparql: `PREFIX sstim-eco: <https://w3id.org/sstim/ecosystem#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?agentLabel ?type WHERE {
  GRAPH ?g {
    ?agent a sstim-eco:EcosystemAgent ; rdfs:label ?agentLabel ; a ?type .
    FILTER(STRSTARTS(STR(?type), "http://xmlns.com/foaf/0.1/") || STRSTARTS(STR(?type), "https://schema.org/"))
  }
}
ORDER BY ?agentLabel`,
  },
  {
    id: 'evidence-claims',
    category: 'Evidence & claims',
    title: 'Evidence assessment claims — tier & direction',
    description:
      'sstim:EvidenceAssessmentClaim records (ADR 0027 — the only concrete evidence-bearing class) with the preset they evaluate, evidence tier, and claim direction.',
    requiresLive: false,
    sparql: `PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?claimLabel ?subjectLabel ?tierLabel ?directionLabel WHERE {
  GRAPH ?evGraph {
    ?claim a sstim:EvidenceAssessmentClaim ;
           rdfs:label ?claimLabel ;
           sstim:evaluatesSubject ?subject ;
           sstim:hasEvidenceTier ?tier ;
           sstim:hasClaimDirection ?direction .
  }
  GRAPH ?subjGraph { ?subject rdfs:label ?subjectLabel }
  GRAPH ?tierGraph { ?tier skos:prefLabel ?tierLabel . FILTER(LANG(?tierLabel) = "en") }
  GRAPH ?dirGraph { ?direction skos:prefLabel ?directionLabel . FILTER(LANG(?directionLabel) = "en") }
}
ORDER BY ?claimLabel`,
  },
  {
    id: 'exposure-channels',
    category: 'Exposure & delivery',
    title: 'Exposure profiles — stimulus channels',
    description:
      'sstim-ex:ExposureProfile instances (from BSC Lab experiments, including the Sensory Field reference profile) and their stimulus channels — delivery medium and perceived modality per channel.',
    requiresLive: false,
    sparql: `PREFIX sstim-ex: <https://w3id.org/sstim/exposure#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?profileLabel ?channelLabel ?mediumLabel ?perceivedLabel WHERE {
  GRAPH ?g1 {
    ?profile a sstim-ex:ExposureProfile ; rdfs:label ?profileLabel ;
             sstim-ex:usesStimulusChannel ?channel .
    ?channel rdfs:label ?channelLabel ;
             sstim-ex:deliveryMedium ?medium ;
             sstim-ex:perceivedModality ?perceived .
  }
  GRAPH ?g2 { ?medium skos:prefLabel ?mediumLabel . FILTER(LANG(?mediumLabel) = "en") }
  GRAPH ?g3 { ?perceived skos:prefLabel ?perceivedLabel . FILTER(LANG(?perceivedLabel) = "en") }
}
ORDER BY ?channelLabel`,
  },
  {
    id: 'alignment-obo',
    category: 'External alignments',
    title: 'Integrating with BFO / OBI / IAO',
    description:
      'Every SSTIM OWL class declared as a subclass of an OBO Foundry upper-ontology term (BFO, OBI, IAO, COB) — the alignment that gives SSTIM classes a place in the broader biomedical/scientific ontology landscape.',
    requiresLive: false,
    sparql: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?classLabel ?upperClass WHERE {
  GRAPH ?g {
    ?class a <http://www.w3.org/2002/07/owl#Class> ;
           rdfs:label ?classLabel ;
           rdfs:subClassOf ?upperClass .
    FILTER(LANG(?classLabel) = "en")
    FILTER(STRSTARTS(STR(?upperClass), "http://purl.obolibrary.org/obo/"))
  }
}
ORDER BY ?classLabel`,
  },
  {
    id: 'alignment-wikidata',
    category: 'External alignments',
    title: 'Integrating with Wikidata',
    description:
      'SSTIM terms with a skos:exactMatch/closeMatch into Wikidata. This app cannot federate a live SPARQL SERVICE call to an external endpoint (Comunica\'s lean in-browser build omits that actor bus) — use the "Open in Wikidata Query Service" link below a result to actually query Wikidata itself.',
    requiresLive: false,
    sparql: `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?sstimLabel ?wikidataId WHERE {
  GRAPH ?g1 {
    { ?sstimTerm skos:exactMatch ?match } UNION { ?sstimTerm skos:closeMatch ?match }
    FILTER(STRSTARTS(STR(?match), "http://www.wikidata.org/entity/"))
    BIND(STRAFTER(STR(?match), "entity/") AS ?wikidataId)
  }
  GRAPH ?g2 { ?sstimTerm skos:prefLabel ?sstimLabel . FILTER(LANG(?sstimLabel) = "en") }
}
ORDER BY ?sstimLabel`,
  },
]

export const EXAMPLE_QUERY_CATEGORIES = [...new Set(EXAMPLE_QUERIES.map(q => q.category))]

export function wikidataQueryServiceUrl(qid) {
  const sparql =
    `SELECT ?item ?itemLabel WHERE {\n` +
    `  VALUES ?item { wd:${qid} }\n` +
    `  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }\n` +
    `}`
  return `https://query.wikidata.org/#${encodeURIComponent(sparql)}`
}

export function bioportalSearchUrl(term) {
  return `https://bioportal.bioontology.org/search?q=${encodeURIComponent(term)}`
}
