# src/rdf — Knowledge Graph Layer

> **Status: Phase 1 partial.** `namespaces.js`, `loader.js`, `query.js`,
> `presets.js`, and graph-query helpers exist. Browser-side SHACL validation,
> optional public BSC Lab preset export, and a generated instance manifest are
> still planned. Annotation storage now has an env-gated Firebase Auth/Firestore
> backend.

The RDF subsystem loads the SSTIM ontology, versioned public catalog, approved
live ecosystem projection, and public BSC Lab reference instances into scoped
in-browser N3.js stores; executes SPARQL via Comunica; and validates data with
SHACL. It must not import, convert, or export the private BioSynCare/BSC catalog.

---

## Files

```
rdf/
├── namespaces.js        All IRI prefix declarations — single source of truth
├── loader.js            Turtle/TriG/N-Quads → N3.Store (+ ontology/instance URLs)
├── graph.js             Ontology → Cytoscape graph projection (buildGraphElements)
├── presets.js           SPARQL-driven preset listing (listPresets)
├── query.js             Comunica SPARQL wrapper (lazy-loaded): select/ask/construct
├── validate.js          SHACL validation via rdf-validate-shacl — (planned)
├── export.js            N3.Store → optional public BSC Lab preset JSON — (planned)
└── annotations/
    └── AnnotationStore.js   Named-graph annotation CRUD via Firestore
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
  BSC_FRAMEWORK, // https://w3id.org/sstim/framework/bsc/ (BSC framework)
  BSC_FRAMEWORK_TECHNIQUE, // https://w3id.org/sstim/framework/bsc/technique/
  BSCLAB_PRESET, // https://w3id.org/sstim/implementation/bsclab/preset/
  OWL, RDF, RDFS, XSD, SKOS, PROV, DCT, FOAF, SH, OA
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
import {
  loadOntology,
  loadNavigatorGraph,
  loadStaticKnowledgeGraph,
  loadLiveEcosystem,
  loadTurtle,
  loadMerged,
} from './loader.js'

// Load the seven canonical ontology files
const ontologyStore = await loadOntology()

// Graph navigator: terms + versioned catalog + mutable public ecosystem
const { store: navigatorStore, liveStatus } = await loadNavigatorGraph()

// General static queries: ontology + committed non-fixture instances
const knowledgeStore = await loadStaticKnowledgeGraph()

// Explicit live-only opt-in (used by SPARQL)
const { store: liveStore, status } = await loadLiveEcosystem()

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

**Named graphs:** all scoped loaders assign canonical
graph IRIs at load time. Ontology modules use `https://w3id.org/sstim/graph/*`;
committed instance files use their SSTIM-scoped graph IRIs. Browser queries that
need loaded data should use `GRAPH ?g { ... }`. Annotations remain separate
named graph records managed by `AnnotationStore.js`.

**Source boundaries:** `loadNavigatorGraph()` deliberately loads only ontology
and vocabulary terms, the versioned framework/implementation catalog, and the
external approved current-state ecosystem. It excludes presets, experiments,
sessions, evidence, references, and synthetic ecosystem fixtures. The live fetch
uses `cache: 'no-store'`, omits credentials/referrer information, and returns an
explicit `available`, `empty`, or `unavailable` status. `loadStaticKnowledgeGraph()`
never fetches live agents or synthetic ecosystem fixtures; SPARQL users must opt
in to the live source.

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

## `validate.js` (planned)

> Not yet implemented. SHACL validation currently runs in CI / locally via
> `make validate` (pySHACL); this module is the planned in-browser equivalent.
> The API below is the target.

Runs SHACL validation against `/ontology/sstim-shapes.ttl`. Called before any
public BSC Lab preset export, and exposed as a UI affordance in the annotation
editor.

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

SHACL validation is required before any public BSC Lab preset export. No public
preset that fails validation is included in runtime JSON.

---

## `export.js` (planned)

> Not yet implemented. The API and pipeline below are the target. Note this is
> the **catalog** export path; the live Patch Studio uses its own
> `patch-studio-model-1` export (see `docs/technical/PATCH_STUDIO.md`).

Optionally generates runtime JSON for public BSC Lab reference presets. This is
not a BioSynCare catalog export; the private BioSynCare/BSC catalog remains
outside this repository.

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

The output format follows the BSC preset JSON format (see
`docs/technical/PRESET_FORMAT.md`). The export is deterministic — given the
same public input files, the output is always the same.

---

## `annotations/AnnotationStore.js`

Manages user annotations as RDF-compatible records in per-user named graphs.
The backing store is Firebase Auth + Firestore, enabled only when
`VITE_FIREBASE_*` values are present. The authoritative ontology store is never
modified.

```javascript
import { AnnotationStore } from './annotations/AnnotationStore.js'

const store = await AnnotationStore.forUser(userId)

// Add annotation on a specific ontology node
await store.add({
  annotatesNode: SSTIM_V('alpha'),
  annotationType: 'commenting',
  annotationText: 'The alpha-10 subset is what this preset actually targets',
})

// Subscribe to annotations for a node
const unsubscribe = store.subscribeForTarget(SSTIM_V('alpha'), (annotations) => {
  console.log(annotations)
})

// Named graph IRI: https://w3id.org/sstim/implementation/bsclab/annotation/{userId}
```

Firestore documents carry `targetIri`, `annotationText`, timestamps, and the
authenticated `userId`. The annotation graph IRI is derived from `userId` during
RDF export rather than stored redundantly in every document.
`AnnotationStore.serialize()` can materialize those records as Turtle using the
W3C Web Annotation vocabulary. The default graph is never modified.

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
| `bsc-fw-tech:` | `https://w3id.org/sstim/framework/bsc/technique/` | BSC framework technique instances |
| `bsclab:` | `https://w3id.org/sstim/implementation/bsclab/` | BSC Lab implementation scope |
| `bsclab-preset:` | `https://w3id.org/sstim/implementation/bsclab/preset/` | BSC Lab preset instances |
| `bsclab-evidence:` | `https://w3id.org/sstim/implementation/bsclab/evidence/` | BSC Lab evidence-chain instances |
| `biosyncare:` | `https://w3id.org/sstim/implementation/biosyncare/` | Reserved public-safe BioSynCare implementation scope |
| `biosyncare-preset:` | `https://w3id.org/sstim/implementation/biosyncare/preset/` | Reserved only; private BioSynCare catalog presets are not loaded by BSC Lab |
