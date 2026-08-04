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

As of 2026-08-04:

- **Latest immutable release:** SSTIM `v0.13.0`, identified by
  `https://w3id.org/sstim/0.13.0`. The modular release (ADR 0043, ADR 0044,
  ADR 0045): the former catch-all root file becomes 18 manifest-owned modules
  behind four conformance profiles — Kernel, Core, Core Plus, Full — with no
  term added, removed, or renamed and the Full union preserving `0.12.0`
  semantics exactly. Archived under version DOI
  [10.5281/zenodo.21792692](https://doi.org/10.5281/zenodo.21792692).
- **Previous release:** SSTIM `v0.12.0`, archived at [10.5281/zenodo.21717988](https://doi.org/10.5281/zenodo.21717988).
  The description-layer release
  (ADR 0041, ADR 0042): separates the stimulation process, an engine-independent
  description of it, the engine configuration that produces it, and the
  execution of that configuration. Adds `sstim:StimulusSpecification` in a new
  module, redefines `sstim:Preset` as the engine-configuration layer, and admits
  non-human, object and unoccupied-space stimulation targets.
- **All-version DOI:**
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- **Live ontology development:** `0.13.0-dev`, the modular preview accepted in
  ADR 0043. It has small Kernel, Core, and Core Plus closures plus optional
  concern and bridge modules. It is mutable and not an immutable release; use
  the [manifest](static/ontology/manifest.json) and explicit profile entry
  points rather than treating `sstim-core.ttl` as the whole suite.
- **Persistent namespace:** `https://w3id.org/sstim` is registered and live.
- **`0.13.0` release graph:** 18 Turtle modules and four profile entry points, 140 named OWL classes, 50 anonymous
  class expressions, 245 properties, and 445 SKOS concepts in 50 concept
  schemes, plus VoID/DCAT and a JSON-LD context. These counts are checked
  against the frozen distribution by `scripts/sstim-quality-audit.py` during
  `make validate`, not maintained by hand.
- **Public example data:** 19 Turtle files containing the BSC framework, nine
  framework techniques (three originated by BSC, six vendor-neutral techniques
  it incorporates from the SSTIM vocabulary — ADR 0033), two implementations,
  nine protocols, two reference presets, eight evidence assessments, three
  knowledge-status assertions, seven exposure hypotheses, seven DOI-identified
  references, ten exposure profiles, one explicitly synthetic session with
  pre/post reports, and one synthetic ecosystem contract graph. No real
  ecosystem-agent record is included in the release repository.
- **Validation:** SHACL Core and SHACL-SPARQL, HermiT via ROBOT, repository-wide
  semantic integrity checks, and executable SPARQL competency queries run under
  the pinned Nix toolchain.
- **External review:** the 2026-07-10
  [automated OOPS/FOOPS review](docs/ontology/reviews/2026-07-10-external-automated-review.md)
  is resolved for release, and the maintainer guided and accepted the ontology
  changes. The maintainer accepted `0.10.0` after the automated OWL, SHACL,
  quality, round-trip, runtime, and build gates passed; independent human
  ontology review is not claimed. The deployed canonical FOOPS score is 87.5%; the
  remaining failures are registry-dependent.
- **Registry discoverability:** the `sstim` prefix resolves at prefix.cc and the
  ontology is parsed and browsable in
  [BioPortal](https://bioportal.bioontology.org/ontologies/SSTIM); LOV,
  [BARTOC](https://github.com/gbv/bartoc.org/issues/319), and FAIRsharing
  (record 8494) submissions await curator review, and a DBpedia Archivo
  submission passed RDF validation but is blocked by a Databus outage. Tracked in
  [registry submissions](docs/ontology/REGISTRY_SUBMISSIONS.md).
- **Web app:** ontology graph, SPARQL workbench, preset browser, Patch Studio,
  Sensory Field, logbook, profile and settings are implemented as a static
  SvelteKit application, usable with no account; Firebase-backed sync is optional.

Browsers at the ontology IRI get the interactive application; reference
documentation is regenerated on every deploy (ADRs 0023 and 0043) —
[WIDOCO](https://labiosyncare.github.io/ontology/docs/) for the Full OWL profile and
[pyLODE](https://labiosyncare.github.io/ontology/docs/vocab/) for the SKOS
vocabulary. Real participant session data, the private BioSynCare catalog,
clinical protocols, and clinical claims are not published here.

## SSTIM Modules And Profiles

The live `0.13.0-dev` source set is manifest-driven. The
[`manifest.json`](static/ontology/manifest.json) file is the authoritative list
of modules, direct dependencies, runtime named graphs, checksums, and profile
closures. The main adoption choices are:

| Profile | Semantic closure | Validation |
|---|---|---|
| [Kernel](static/ontology/sstim-kernel-profile.ttl) | [`sstim-core.ttl`](static/ontology/sstim-core.ttl): the two process anchors | No published Kernel shapes |
| [Core](static/ontology/sstim-core-profile.ttl) | Kernel + engine-independent stimulus description | [`sstim-core-shapes.ttl`](static/ontology/sstim-core-shapes.ttl) |
| [Core Plus](static/ontology/sstim-core-plus-profile.ttl) | Core + reusable common descriptors and calibrated quantities | Core shapes; Common-specific shapes are deferred |
| [Full](static/ontology/sstim-full-profile.ttl) | All semantic, bridge, vocabulary, alignment, ecosystem, and Patch Studio modules | [`sstim-shapes.ttl`](static/ontology/sstim-shapes.ttl) |

Consumers that previously merged the eight `0.12.0` sources should select the
Full profile. New reusable integrations should start with Core or Core Plus and
add concern modules through their manifest-resolved dependency closure. Shapes
are selected separately from OWL imports. Core validation deliberately leaves
channels and targets optional, but hardens either link when it is present: a
channel object must be typed `sstim-ex:StimulusChannel`, and a stimulation
target must be an IRI or blank node rather than a literal.

Each entry point is also a W3C Profiles Vocabulary (`prof:Profile`) resource
with discoverable specification, constraints (where available), and manifest
artifacts. The manifest declares its schema by the persistent identifier
`https://w3id.org/sstim/manifest-schema/1` while it is mutable. A released
manifest points `$schema` at its frozen versioned sibling instead.

For the modular publication contract, machine-readable requests to
`https://w3id.org/sstim` return a generated catalog of the Full semantic
namespace, while `https://w3id.org/sstim/kernel` is the exact two-class Kernel
endpoint. `https://w3id.org/sstim/exposure` returns a generated Stimulus +
Exposure namespace catalog because the exposure namespace contains terms owned
by both modules. The exact Exposure semantic module and its mutable
distribution/import endpoint are instead
`https://w3id.org/sstim/module/exposure`; the live Full profile's `owl:imports`
uses that endpoint, never the namespace catalog. Its `dct:requires` may still
identify the logical Exposure ontology as `https://w3id.org/sstim/exposure`.
Release preparation replaces the mutable import endpoint with the exact
immutable versioned sibling file. These `0.13.0-dev` artifacts and routes are
staged until the Pages deployment and corresponding perma-id update; they are
not citable release endpoints yet.

Every module is an `owl:Ontology` with creator, publisher, dates, license,
description, version metadata, and explicit ownership. Controlled values remain
dual-typed OWL individuals and SKOS concepts. See the
[module architecture](docs/ontology/MODULE_ARCHITECTURE.md),
[ontology source guide](static/ontology/README.md), and
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
- **Logbook, annotations, patches and profile:** kept in your browser by
  default, with no account required. Signing in (when Firebase is configured)
  keeps them with your account instead so they follow you between devices.

Architecture details are in [src/README.md](src/README.md),
[Patch Studio](docs/technical/PATCH_STUDIO.md), and the
[Session Model](docs/technical/SESSION_MODEL.md).

## Deployment And Portability

BSC Lab builds as a static SvelteKit application. The knowledge browser, SPARQL
workbench, Patch Studio, Sensory Field and reference data all operate client-side,
so the core application is hostable on any static file server. Firebase is
optional: configuration comes from build-time `VITE_FIREBASE_*` variables, and a
build without them produces a working instance with no embedded credentials. Only
**sign-in** becomes unavailable — annotations, saved patches, the logbook and the
profile are kept on the device instead of an account.

The pinned Nix flake reproduces the **development, build and validation**
toolchain, and CI runs inside it. `nix build` (or `make package`) additionally
produces the static site as an immutable, **bit-reproducible** package at
`result/share/bsc-lab`, servable by any static web server — `nix build --rebuild`
yields an identical output, and `nix flake check` builds it.

That same package deploys three ways from one source: a **NixOS module**
(`nixosModules.default`) that configures a hardened nginx with the required MIME
types and headers, an **OCI container image** (`nix build .#oci`) running unprivileged,
and any plain static host. All three are held to a single deployment-conformance
contract, `scripts/smoke-http.sh`, exercised in CI against both a NixOS VM and the
container.

Local user data is fully portable: a **versioned instance export** covers patches,
annotations, logbook, profile and skin with SHA-256 integrity, and `make migrate-test`
proves it across two genuinely separate origins — export from instance A, import into
instance B, re-export, byte-identical.

The package is **configured at deployment, not at build**: a `runtime-config.json`
beside the site names the instance and selects identity and storage providers, so
one byte-identical artifact serves many operators. The NixOS module generates it
from `services.bsc-lab.settings`; the container takes it as a read-only mount.
Absence changes nothing, and invalid configuration degrades to local-only and
says why in Settings.

Every build publishes **`build-info.json`** naming the commit it came from, and CI
fetches it back from the deployed URL after publishing — so "the live site is the
commit we built" is checked rather than assumed.

What remains open is a private cross-device sync service and the identity seam
that must precede it
([ADR 0039](docs/decisions/0039-sharing-model-and-the-shared-backend-question.md)).

Every commit is also verified as a **credential-free static deployment**:
`make smoke-static` rebuilds with no Firebase configuration, serves the result over
plain HTTP, and asserts that all primary routes, the ontology Turtle and the PWA
assets are served, that an unknown path 404s, and that no API key was inlined.

Existing portability foundations:

- versioned, checksum-verified ontology releases ([ADR 0020](docs/decisions/0020-whole-set-snapshot-versioning.md));
- JSON-LD and RDF/XML ontology export via `make export`;
- RDF serialization of annotations with authentication identifiers excluded;
- the portable `patch-studio-model-1` representation;
- separation of public reference data, per-user annotation graphs and private records.

The next portability layer — reproducible institutional deployment, explicit
service adapters, complete export/import packages and independently tested
migration between instances — is specified with acceptance criteria in
[Portable Deployment and Migration](docs/technical/PORTABLE_DEPLOYMENT.md).

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

Firebase is optional and the application is fully usable without it —
annotating, saving patches, the logbook and the profile all work on-device.
Copy `.env.example` to `.env` and provide the `VITE_FIREBASE_*` values only
when testing sign-in or account-backed sync.

## Verification

Run the same gates used by CI:

```bash
make validate   # SHACL + audit + HermiT + SPARQL + serialization round trips
make test       # Vitest unit tests
make check      # SvelteKit sync and svelte-check
make build      # Static production bundle in dist/
make export     # JSON-LD and RDF/XML serializations of manifest-owned sources
```

`make validate` checks more than RDF syntax:

1. SHACL validates the applicable profile and Full closures plus all public
   instances; Core uses its deliberately weaker profile shapes.
2. The manifest contract checks the module dependency DAG, profile closures,
   source metadata, runtime/publication mappings, and file checksums.
3. `scripts/sstim-quality-audit.py` checks JSON-LD context and loader
   completeness, SKOS integrity, local IRI resolution, evidence provenance, and
   competency thresholds.
4. ROBOT with HermiT checks OWL DL consistency across the module set, and the
   normalized Full-union parity gate checks the `0.13.0-dev` redistribution
   against frozen `0.12.0`.
5. Comunica runs named-graph competency queries for delivery media, protocol
   chains, evidence trails, actionable cautions, and phase-qualified reports.
6. Generated JSON-LD and RDF/XML are parsed back and checked for graph
   isomorphism with each Turtle source module.

The immutable [`static/ontology/0.12.0/`](static/ontology/0.12.0) snapshot is not
edited after publication. Future releases are cut only after validation,
version metadata, snapshot generation, tag creation, and Zenodo archival agree.
The release gate additionally requires every snapshotted artifact to advertise
its immutable versioned URL, every profile to import the exact versioned sibling
closure, every PROF descriptor to identify immutable entrypoint, constraint,
and manifest artifacts, and every profile to have existing nonempty positive,
out-of-scope, and adversarial fixtures plus a competency query. The released
manifest and schema are themselves frozen sibling artifacts. Those profile
contracts and the staged route deployment remain work before `0.13.0-dev` can
become a release.

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

- `https://w3id.org/sstim#` - reusable suite terms owned across semantic
  modules.
- `https://w3id.org/sstim/vocab#` - controlled vocabulary concepts.
- `https://w3id.org/sstim/exposure#` - exposure identifiers owned across the
  Stimulus and Exposure modules.
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

For the released ontology, cite SSTIM `v0.13.0`. Its stable version IRI is
`https://w3id.org/sstim/0.13.0` and its version DOI is
[10.5281/zenodo.21792692](https://doi.org/10.5281/zenodo.21792692). Use the
[concept DOI](https://doi.org/10.5281/zenodo.21286974) when referring to SSTIM
across releases.

- Software: [Apache License 2.0](LICENSE).
- Ontology, vocabulary, documentation, and public reference data:
  [CC BY 4.0](LICENSE-ontology).
- Maintainer: Renato Fabbri,
  [ORCID 0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X).
