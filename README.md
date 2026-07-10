# BSC Lab

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21286974.svg)](https://doi.org/10.5281/zenodo.21286974)

BSC Lab is an open sensory-stimulation research and engineering platform paired
with **SSTIM**, a public RDF knowledge graph for describing techniques,
modalities, stimulus parameters, exposure boundaries, evidence claims,
protocols, presets, and sessions. The repository contains both the reusable
ontology and a SvelteKit reference implementation that exercises it.

The work is non-clinical. It does not prescribe treatment, certify efficacy, or
claim that a protocol treats, prevents, cures, or diagnoses a condition. Start
with [Scope](docs/concept/SCOPE.md), [Non-Scope](docs/concept/NON_SCOPE.md), and
the [Evidence Framework](docs/concept/EVIDENCE_FRAMEWORK.md).

## Project Status

As of 2026-07-10:

- **Latest immutable release:** SSTIM `v0.5.0`, archived at
  [10.5281/zenodo.21286975](https://doi.org/10.5281/zenodo.21286975).
- **All-version DOI:**
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- **Live ontology sources:** `0.6.0-dev`. Development sources deliberately do
  not claim an `owl:versionIRI`; only frozen release snapshots do.
- **Persistent namespace:** `https://w3id.org/sstim` is registered and live.
- **Ontology graph:** six Turtle modules, 56 named OWL classes, six anonymous
  union-class expressions, 124 properties, and 295 SKOS concepts in 30 concept
  schemes, plus VoID/DCAT and a JSON-LD context.
- **Public example data:** 18 Turtle files containing the BSC framework, seven
  framework techniques, two implementations, 12 protocols, two reference
  presets, 38 evidence claims, seven DOI-identified references, ten exposure
  profiles, and one explicitly synthetic session with pre/post reports.
- **Validation:** SHACL Core and SHACL-SPARQL, HermiT via ROBOT, repository-wide
  semantic integrity checks, and executable SPARQL competency queries run under
  the pinned Nix toolchain.
- **Web app:** ontology graph, SPARQL workbench, preset browser, Patch Studio,
  Sensory Field, logbook, profile, settings, and optional Firebase-backed user
  data are implemented as a static SvelteKit application.

The deployed HTML ontology documentation is still the application/browser;
WIDOCO publication remains open. Real participant session data, the private
BioSynCare catalog, clinical protocols, and clinical claims are not published
here.

## SSTIM Modules

| Source | Role |
|---|---|
| [`sstim-core.ttl`](static/ontology/sstim-core.ttl) | OWL classes, properties, axioms, evidence governance, caution metadata, and session model |
| [`sstim-vocab.ttl`](static/ontology/sstim-vocab.ttl) | Multilingual SKOS values for bands, modalities, mechanisms, techniques, evidence, cautions, and report phases |
| [`sstim-shapes.ttl`](static/ontology/sstim-shapes.ttl) | SHACL constraints for modules, SKOS integrity, evidence, protocols, presets, safety, exposure, and sessions |
| [`sstim-alignments.ttl`](static/ontology/sstim-alignments.ttl) | Conservatively scoped, verified Wikidata and OBO Foundry links |
| [`sstim-patch-studio.ttl`](static/ontology/sstim-patch-studio.ttl) | Reproducible voice and authoring parameter properties |
| [`sstim-exposure.ttl`](static/ontology/sstim-exposure.ttl) | Delivery media, perceived modalities, devices, placement, stimulus patterns, limits, effects, and knowledge status |
| [`context.jsonld`](static/ontology/context.jsonld) | Public JSON-LD compaction context |
| [`void.ttl`](static/ontology/void.ttl) | VoID/DCAT publication metadata and checked graph counts |
| [`instances/`](static/ontology/instances) | Public BSC Lab framework, protocol, preset, evidence, experiment, reference, and synthetic session data |

Every module is an `owl:Ontology` with creator, dates, license, description, and
version metadata. Controlled values are dual-typed OWL individuals and SKOS
concepts; their SKOS hierarchy inverses are materialized for clients that do not
run inference. See the [ontology guide](static/ontology/README.md) and
[ADR index](docs/decisions/README.md).

## Application

The first screen is the working application, not a marketing site. Its main
surfaces are:

- **Knowledge browser:** Cytoscape graph navigation over named RDF graphs.
- **SPARQL workbench:** Comunica queries over ontology and public instance data.
- **Presets:** public BSC Lab reference presets and their evidence links.
- **Patch Studio:** real-time audio/visual authoring with Web Audio,
  AudioWorklet/WASM options, modulation, and photosensitivity safeguards.
- **Sensory Field:** bounded visual/audio exposure prototyping that emits the
  exposure vocabulary used by the knowledge graph.
- **Logbook and profile:** optional user-owned records when Firebase is
  configured.

Architecture details are in [src/README.md](src/README.md),
[Patch Studio](docs/technical/PATCH_STUDIO.md), and the
[Session Model](docs/technical/SESSION_MODEL.md).

## Quick Start

The canonical environment is the pinned Nix flake:

```bash
nix develop
npm ci
make dev
```

The default development URL is `http://127.0.0.1:4173`. `direnv allow` can load
the dev shell automatically. Without Nix, provide compatible Node 24, Python
3.12 with `rdflib` and `pyshacl`, ROBOT/HermiT, WABT, and GNU Make yourself.

Firebase is optional. Copy `.env.example` to `.env` and provide the
`VITE_FIREBASE_*` values only when testing authentication, annotations,
profiles, or cloud patches.

## Verification

Run the same gates used by CI:

```bash
make validate   # SHACL + audit + HermiT + SPARQL + serialization round trips
make test       # Vitest unit tests
make check      # SvelteKit sync and svelte-check
make build      # Static production bundle in dist/
make export     # JSON-LD and RDF/XML serializations of all six modules
```

`make validate` checks more than RDF syntax:

1. SHACL validates each primary graph, all six merged modules, and all public
   instances.
2. `scripts/sstim-quality-audit.py` checks module metadata, JSON-LD context and
   loader completeness, SKOS uniqueness/inverses/cycles, local IRI resolution,
   functional properties, evidence provenance, and competency thresholds.
3. ROBOT with HermiT checks OWL DL consistency across the module set.
4. Comunica runs named-graph competency queries for delivery media, protocol
   chains, evidence trails, actionable cautions, and phase-qualified reports.
5. Generated JSON-LD and RDF/XML are parsed back and checked for graph
   isomorphism with each Turtle source module.

The immutable [`static/ontology/0.5.0/`](static/ontology/0.5.0) snapshot is not
edited while live sources evolve. A future release is cut only after validation,
version metadata, snapshot generation, tag creation, and Zenodo archival agree.

## Repository Map

```text
CLAUDE.md                 Repository invariants and agent instructions
README.md                 Project status and entry point
ROADMAP.md / TODO.md      Strategic phases and tracked work
docs/
  concept/                Domain definition, scope, non-scope, evidence policy
  technical/              Preset, session, engine, safety, and UI specifications
  ontology/               Ontology review and publication planning
  decisions/              Architecture decision records
  ecosystem/              W3C proposal, governance, identifiers, and outreach
static/
  ontology/               Live modules, context, VoID, frozen releases, instances
  worklets/               AudioWorklet processors and oscillator WASM
  audio/                  Synthetic CC0 reference audio
src/
  rdf/                    N3 loader, named graphs, queries, and validation
  engines/                Audio implementation and planned engine boundaries
  ui/                     Knowledge browser, Patch Studio, field, safety, account UI
  routes/                 SvelteKit application routes
scripts/                  Export, snapshot, semantic audit, and competency tooling
.github/workflows/        RDF validation, app checks, and Pages deployment
```

The full documentation map is [docs/README.md](docs/README.md).

## Identifiers And Data Boundaries

- `https://w3id.org/sstim#` - reusable core terms.
- `https://w3id.org/sstim/vocab#` - controlled vocabulary concepts.
- `https://w3id.org/sstim/exposure#` - exposure and experiment terms.
- `https://w3id.org/sstim/framework/bsc` - the BSC framework.
- `https://w3id.org/sstim/implementation/bsclab/` - public BSC Lab data.
- `https://w3id.org/sstim/implementation/biosyncare/` - reserved public-safe
  BioSynCare implementation metadata, not its private catalog.
- `https://w3id.org/sstim/ref/` - reusable public-safe references.

Ontology terms, public reference data, user annotations, and session records
belong in separate named graphs. The repository includes only a clearly marked
synthetic session fixture; real user records remain user-owned and are not
committed.

## Relationship To BioSynCare

BSC Lab is the open research and reference implementation. BioSynCare is a
separate closed-source commercial application. They may coordinate on the
preset format and SSTIM vocabulary, but neither repository imports the other's
private data. BSC is a framework; BSC Lab and BioSynCare are implementations;
protocols, presets, and session executions are separate modeled levels.

## W3C Community Group Proposal

This repository is the technical anchor for a proposed vendor-neutral Sensory
Stimulation Vocabulary Community Group. The proposal covers shared terms,
semantic models, JSON-LD contexts, SHACL profiles, safety metadata, evidence
annotations, and implementation guidance. It does not define clinical practice
or certify products.

- [Charter](CHARTER.md)
- [Community Group Proposal](docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md)
- [Ontology publication plan](docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md)
- [Contributing](CONTRIBUTING.md)

## Citation And License

For the released ontology, cite SSTIM `v0.5.0` using
[10.5281/zenodo.21286975](https://doi.org/10.5281/zenodo.21286975). Use the
[concept DOI](https://doi.org/10.5281/zenodo.21286974) when referring to SSTIM
across releases. Do not cite `0.6.0-dev` as an immutable release.

- Software: [Apache License 2.0](LICENSE).
- Ontology, vocabulary, documentation, and public reference data:
  [CC BY 4.0](LICENSE-ontology).
- Maintainer: Renato Fabbri,
  [ORCID 0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X).
