# src/rdf — Knowledge Graph Layer

> **Status: Phase 1 partial.** `namespaces.js`, `loader.js`, `query.js`,
> `presets.js`, and graph-query helpers exist. Browser-side SHACL validation,
> RDF export, a generated instance manifest, and annotation storage are still
> planned.

The RDF subsystem loads the SSTIM ontology and BSC preset instances into an
in-browser N3.js triple store, executes SPARQL queries via Comunica, validates
data with SHACL, and exports the preset catalog to JSON for BioSynCare.

---

## Files

```
rdf/
├── namespaces.js        All IRI prefix declarations — single source of truth
├── loader.js            Turtle/TriG/N-Quads → N3.Store
├── graph.js             Ontology graph projection queries for Cytoscape
├── query.js             Comunica SPARQL execution wrapper (lazy-loaded)
├── validate.js          SHACL validation via rdf-validate-shacl (planned)
├── export.js            N3.Store → dist/presets.json for BioSynCare (planned)
└── annotations/
    └── AnnotationStore.js   Named-graph annotation CRUD
```

---

## `namespaces.js` — single source of truth

**All IRI strings in the codebase are imported from this file.** Never
hardcode namespace strings. Never construct IRIs by string concatenation.

```javascript
import {
  SSTIM,     // https://w3id.org/sstim# (OWL classes + properties)
  SSTIM_V,   // https://w3id.org/sstim/vocab# (SKOS vocabulary)
  SSTIM_SH,  // https://w3id.org/sstim/shapes# (SHACL)
  SSTIM_I,   // https://w3id.org/sstim/inst/ (SSTIM instances)
  BSC_FRAMEWORK_IRI, // https://w3id.org/sstim/framework/bsc
  BSCLAB_IRI, // https://w3id.org/sstim/implementation/bsclab
  BIOSYNCARE_IRI, // https://w3id.org/sstim/implementation/biosyncare
  BSC_FRAMEWORK, // https://w3id.org/sstim/framework/bsc/ (BSC framework)
  BSCLAB_PRESET, // https://w3id.org/sstim/implementation/bsclab/preset/
  BIOSYNCARE_PRESET, // https://w3id.org/sstim/implementation/biosyncare/preset/
  OWL, RDF, RDFS, XSD, SKOS, PROV, DCT, FOAF, SH
} from '../rdf/namespaces.js'

// Usage
const FrequencyBand = SSTIM('FrequencyBand')   // → NamedNode
const alpha = SSTIM_V('alpha')                  // → NamedNode
const alphaPreLabel = n3Store.getQuads(alpha, SKOS('prefLabel'), null)
```

Each exported namespace is a factory function returning `N3.DataFactory.namedNode()`.
Never pass raw strings to N3 store operations.

**Turtle prefix alignment** — the prefix strings in `namespaces.js` match the
`@prefix` declarations in all `static/ontology/*.ttl` files. When adding a new namespace
to a TTL file, add the corresponding factory function to `namespaces.js` in the
same commit.

---

## `loader.js`

Parses Turtle files into an N3.Store. The current implementation supports
single-file loading, a fixed canonical ontology merge, and a committed instance
manifest for browser loading.

```javascript
import { loadOntology, loadKnowledgeGraph, loadTurtle, loadMerged } from './loader.js'

// Load the four canonical ontology files
const ontologyStore = await loadOntology()

// Load ontology plus committed preset/reference instances
const knowledgeStore = await loadKnowledgeGraph()

// Load one Turtle file
const coreStore = await loadTurtle('/ontology/sstim-core.ttl')

// Merge
const combinedStore = await loadMerged([
  '/ontology/sstim-core.ttl',
  '/ontology/sstim-vocab.ttl'
])
```

In the browser, files are fetched via the Fetch API from the Vite static asset
server. Node.js filesystem loading is deferred to the export/test pipeline.

**Named graphs:** `loadOntology()` and `loadKnowledgeGraph()` assign canonical
graph IRIs at load time. Ontology modules use `https://w3id.org/sstim/graph/*`;
committed instance files use their SSTIM-scoped graph IRIs. Browser queries that
need loaded data should use `GRAPH ?g { ... }`. Future annotations remain
separate named graphs (see planned `AnnotationStore.js`).

---

## `query.js`

Wraps Comunica SPARQL execution. **Comunica is lazy-loaded** (~500 KB gzipped)
to avoid blocking the initial app load.

```javascript
import { select, construct } from './query.js'

// SELECT query — returns array of binding objects
const results = await select(store, `
  PREFIX sstim: <https://w3id.org/sstim#>
  PREFIX skos:  <http://www.w3.org/2004/02/skos/core#>

  SELECT ?preset ?label ?tier WHERE {
    ?preset a sstim:Preset ;
            rdfs:label ?label ;
            sstim:hasEvidenceTier [ sstim:tierRank ?tier ] .
    FILTER(LANG(?label) = "en")
  }
  ORDER BY DESC(?tier)
`)
// results: [{ preset: NamedNode, label: Literal, tier: Literal }, ...]

// CONSTRUCT query — returns RDF quads
const subgraph = await construct(store, `
  PREFIX sstim: <https://w3id.org/sstim#>
  CONSTRUCT { ?s ?p ?o }
  WHERE { ?s a sstim:Preset ; ?p ?o }
`)
```

**SPARQL property paths work** with the dual-typed SKOS/OWL individuals:
```sparql
-- All presets targeting alpha or any narrower sub-band
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
SELECT ?preset WHERE {
  sstim-v:alpha skos:narrower* ?band .
  ?preset sstim:targetsFrequencyBand ?band .
}
```

---

## `validate.js`

Runs SHACL validation against `/ontology/sstim-shapes.ttl`. Called by the
export pipeline before generating `dist/presets.json`, and exposed as a
UI affordance in the annotation editor.

```javascript
import { validate, ValidationReport } from './validate.js'

const report = await validate(dataStore, shapesStore)

if (!report.conforms) {
  report.results.forEach(r => {
    console.error(
      `SHACL violation: ${r.message}`,
      `  Focus node: ${r.focusNode.value}`,
      `  Path:       ${r.resultPath?.value ?? '—'}`,
      `  Severity:   ${r.severity.value}`
    )
  })
  return null  // do not export invalid data
}
```

SHACL validation is required before any preset export. No preset that fails
validation is included in `dist/presets.json`.

---

## `export.js`

Generates `dist/presets.json` — the preset catalog consumed by BioSynCare.
This is the single data exchange point between BSC Lab and BioSynCare.

```javascript
// Run from command line or CI pipeline:
// node src/rdf/export.js

import { exportPresets } from './export.js'

const exported = await exportPresets({
  ontologyPaths: [
    '/ontology/sstim-core.ttl',
    '/ontology/sstim-vocab.ttl'
  ],
  instancePaths: ['/ontology/instances/presets/perform-alpha-10-seed.ttl'],
  shapesPaths:   ['/ontology/sstim-shapes.ttl'],
  outputPath:    'dist/presets.json'
})

console.log(`Exported ${exported.count} presets`)
```

The export pipeline:
1. Loads all ontology and instance files into N3.Store
2. Runs SHACL validation — aborts if any violation
3. Executes a SPARQL CONSTRUCT query that materializes each preset as a
   JSON object matching `schemas/preset.schema.json`
4. Runs JSON Schema validation on each exported preset — aborts if invalid
5. Writes `dist/presets.json`

The output format is the canonical BSC preset JSON (see
`docs/technical/PRESET_FORMAT.md`). The export is deterministic — given
the same input files, the output is always the same (sorted by `isShownIndex`).

---

## `annotations/AnnotationStore.js`

Manages user annotations as RDF in named graphs. Never writes to the
default graph. See `CLAUDE.md` section 5.5 for the constraint rationale.

```javascript
import { AnnotationStore } from './annotations/AnnotationStore.js'

const store = new AnnotationStore(userId)

// Add annotation on a specific ontology node
await store.add({
  annotatesNode: SSTIM_V('alpha'),
  annotationType: 'comment',
  annotationText: 'The alpha-10 subset is what this preset actually targets',
})

// Query annotations for a node
const annotations = await store.getFor(SSTIM_V('alpha'))
// returns: [{ uuid, annotationType, annotationText, createdAt }]

// Named graph IRI: https://w3id.org/sstim/implementation/bsclab/annotation/{userId}
```

Annotations are stored in IndexedDB locally. Optional server-side sync
is deferred to Phase 3; the backend technology is TBD at that point.
The default graph is never modified.

---

## Namespace quick reference

| Prefix | IRI | Content |
|---|---|---|
| `sstim:` | `https://w3id.org/sstim#` | OWL classes + properties |
| `sstim-v:` | `https://w3id.org/sstim/vocab#` | SKOS vocabulary individuals |
| `sstim-sh:` | `https://w3id.org/sstim/shapes#` | SHACL shapes |
| `sstim-i:` | `https://w3id.org/sstim/inst/` | Generic SSTIM instances |
| `sstim-ref:` | `https://w3id.org/sstim/ref/` | Public-safe references |
| `bsc-fw:` | `https://w3id.org/sstim/framework/bsc/` | BSC framework |
| `bsclab:` | `https://w3id.org/sstim/implementation/bsclab/` | BSC Lab implementation scope |
| `bsclab-preset:` | `https://w3id.org/sstim/implementation/bsclab/preset/` | BSC Lab preset instances |
| `bsclab-evidence:` | `https://w3id.org/sstim/implementation/bsclab/evidence/` | BSC Lab evidence-chain instances |
| `biosyncare:` | `https://w3id.org/sstim/implementation/biosyncare/` | BioSynCare implementation scope |
| `biosyncare-preset:` | `https://w3id.org/sstim/implementation/biosyncare/preset/` | BioSynCare catalog preset instances |
