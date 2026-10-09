# SSTIM Concept Reference API v1

**Status:** deterministic, read-only JSON derived from frozen *released* SSTIM semantic modules during the static build. It is an accessibility layer over the published ontology, not an independent authority, live dataset, write API, or MCP server.

## Endpoints

Paths are relative to the deployed application mount. On the W3C Community Group's GitHub Pages site, the base is `https://w3c-cg.github.io/sstim/`. On a root-hosted copy the base may be `/`.

| Resource | Path |
|---|---|
| Discovery, latest supported release and release list | `api/v1/index.json` |
| One immutable release's concept catalog | `api/v1/releases/{version}/index.json` |
| Details for one class, property or SKOS concept | `api/v1/releases/{version}/terms/{sha256-iri}.json` |

The 64-character lowercase identifier in a term filename is SHA-256 of the *entire canonical term IRI*, not of its label or CURIE. Use the catalog's `terms[].path` rather than constructing guesses. Relative `path` values resolve against that release catalog URL; `catalog` in the discovery response resolves against the discovery index URL.

Only published releases beginning with **0.18.0** are supported by JSON API v1. Earlier releases remain available through their original RDF files. Subsequent builds regenerate each supported frozen snapshot so older release-qualified API paths remain available.

## Client example

```js
const base = 'https://w3c-cg.github.io/sstim/api/v1/'
const discovery = await (await fetch(new URL('index.json', base))).json()
const catalogUrl = new URL(discovery.catalog, base)
const catalog = await (await fetch(catalogUrl)).json()
const matches = catalog.terms.filter(term =>
  [term.label, term.curie, term.iri, term.definition ?? '']
    .some(text => text.toLowerCase().includes('binaural')))
for (const term of matches) {
  const details = await (await fetch(new URL(term.path, catalogUrl))).json()
  console.log(details.iri, details.definitions, details.relationships)
}
```

This is **client-side search**, not a server search API. The static host does not implement `?q=`, query ranking, authentication, or writes. External clients must handle their hosting environment's cross-origin access policy.

## Data contracts

- Discovery: `model`, `latestRelease`, `catalog`, `releases`, `schema` and stated limitations.
- Released catalog: `model`, `release`, `status`, `manifest`, `ontology`, `count` and indexed `terms`. Index entries include exact IRI, CURIE, type (`class`, `property`, `concept`), preferred label, module, deprecation status, optional definition and alternative labels, and the detail path.
- Individual record: those identities plus multilingual literal values (retaining language and datatype), asserted relations, mappings, and `sources` with module ID, frozen module relative path, source graph IRI, and frozen manifest SHA-256.

Definitions and relationships reproduce source assertions. External SKOS mappings do **not** indicate clinical evidence or universal synonymy. No inferences or AI-authored facts are added. Mapping predicates remain distinct (`exactMatch`, `closeMatch`, `broadMatch`, etc.).

The generator includes only OWL/RDFS classes, RDF/OWL properties and SKOS concepts owned by SSTIM released semantic modules. It does **not** import mutable development modules, SHACL validation shape nodes, committed protocol instances, real/live ecosystem records, personal annotations, proposal inbox contents, or private BioSynCare catalogs.

The underlying SSTIM term content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Give appropriate attribution and preserve canonical IRIs and release context.

## Building and verifying

```bash
npm test -- --run scripts/gen-concept-reference.test.mjs
npm run build
```

`npm run build` generates the API into `dist/api/v1/` **before** machine discovery files. The generator reads each frozen manifest and module, checks all source hashes, and fails closed on missing, modified or unreleased inputs. Nothing is written under `static/ontology/`, and no generated API JSON is committed.

Changes to the JSON API contract require explicit v1 compatibility consideration. Release numbers (`0.18.0`, etc.) identify *ontology versions*, not changes to the API model.

To submit corrections, use the existing [Contribution Bridge](../../src/routes/contribute/+page.svelte), which opens a reviewed GitHub issue draft and does not modify canonical ontology terms.
