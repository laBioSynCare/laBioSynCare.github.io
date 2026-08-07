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

Version numbers, DOIs, module and term counts are **derived, not restated
here** — `make truth-audit` fails when prose disagrees with the sources:

| Fact | Source |
|---|---|
| Latest citable release, its version DOI, graph counts | [`void.ttl`](static/ontology/void.ttl) |
| Live development version, modules, profile closures | [`manifest.json`](static/ontology/manifest.json) |
| How to cite | [`CITATION.cff`](CITATION.cff) |
| What changed in each release | [`CHANGELOG.md`](CHANGELOG.md) |

- **Persistent namespace:** `https://w3id.org/sstim` is registered and live.
  All-version concept DOI:
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- **Ontology shape:** manifest-owned Turtle modules behind four conformance
  profiles — Kernel, Core, Core Plus, Full — plus VoID/DCAT and a JSON-LD
  context. The development line is mutable and not an immutable release; use the
  manifest and explicit profile entry points rather than treating
  `sstim-core.ttl` as the whole suite.
- **Public example data:** the BSC framework, nine framework techniques (three
  originated by BSC, six vendor-neutral ones it incorporates — ADR 0033), two
  implementations, protocols, reference presets, evidence assessments,
  knowledge-status assertions, exposure hypotheses and profiles, DOI-identified
  references, one explicitly synthetic session with pre/post reports, and one
  synthetic ecosystem contract graph. No real ecosystem-agent record ships here.
- **Validation:** SHACL Core and SHACL-SPARQL, HermiT via ROBOT, repository-wide
  semantic integrity checks, and executable SPARQL competency queries run under
  the pinned Nix toolchain.
- **External review:** the 2026-07-10
  [automated OOPS/FOOPS review](docs/ontology/reviews/2026-07-10-external-automated-review.md)
  is resolved, and the maintainer guided and accepted the ontology changes.
  Releases are accepted once the automated OWL, SHACL, quality, round-trip,
  runtime, and build gates pass; **independent human ontology review is not
  claimed.** The deployed canonical FOOPS score is 87.5%, with the remaining
  failures registry-dependent.
- **Registry discoverability:** the `sstim` prefix resolves at prefix.cc and the
  ontology is parsed and browsable in
  [BioPortal](https://bioportal.bioontology.org/ontologies/SSTIM); LOV,
  [BARTOC](https://github.com/gbv/bartoc.org/issues/319), and FAIRsharing
  (record 8494) await curator review, and a DBpedia Archivo submission passed
  RDF validation but is blocked by a Databus outage. Tracked in
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

The live source set is manifest-driven. The
[`manifest.json`](static/ontology/manifest.json) file is the authoritative list
of modules, direct dependencies, runtime named graphs, checksums, and profile
closures. The main adoption choices are:

| Profile | Semantic closure | Validation |
|---|---|---|
| [Kernel](static/ontology/sstim-kernel-profile.ttl) | [`sstim-core.ttl`](static/ontology/sstim-core.ttl): the two process anchors | No published Kernel shapes |
| [Core](static/ontology/sstim-core-profile.ttl) | Kernel + engine-independent stimulus description | [`sstim-core-shapes.ttl`](static/ontology/sstim-core-shapes.ttl) |
| [Core Plus](static/ontology/sstim-core-plus-profile.ttl) | Core + reusable common descriptors and calibrated quantities | Core shapes; Common-specific shapes are deferred |
| [Full](static/ontology/sstim-full-profile.ttl) | All semantic, bridge, vocabulary, alignment, ecosystem, and Patch Studio modules | [`sstim-shapes.ttl`](static/ontology/sstim-shapes.ttl) |

Consumers that previously merged the eight pre-modular sources should select
the Full profile. New reusable integrations should start with Core or Core Plus and
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
immutable versioned sibling file. A development line's artifacts and routes stay
staged until the Pages deployment and corresponding perma-id update; they are
never citable release endpoints.

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

The identity and storage seams both exist, with conformance suites
([ADR 0038](docs/decisions/0038-identity-providers-and-the-two-seam-adapter.md)).
What remains open is a private cross-device sync service, and a second real
identity provider to prove the seam is an interface rather than a swap
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
   normalized Full-union parity gate checks the live redistribution against the
   frozen pre-modular baseline.
5. Comunica runs named-graph competency queries for delivery media, protocol
   chains, evidence trails, actionable cautions, and phase-qualified reports.
6. Generated JSON-LD and RDF/XML are parsed back and checked for graph
   isomorphism with each Turtle source module.
7. `make truth-audit` checks the prose: no superseded version, development line
   or DOI advertised as current, no shipped capability described as future work,
   and every relative link in every tracked document resolves.
8. `make release-dryrun` rehearses the next release against the current sources,
   so a gate that has been wrong for weeks surfaces before a release, not during.

Each frozen [`static/ontology/<version>/`](static/ontology) snapshot is immutable
and is not edited after publication. Future releases are cut only after validation,
version metadata, snapshot generation, tag creation, and Zenodo archival agree.
The release gate additionally requires every snapshotted artifact to advertise
its immutable versioned URL, every profile to import the exact versioned sibling
closure, every PROF descriptor to identify immutable entrypoint, constraint,
and manifest artifacts, and every profile to have existing nonempty positive,
out-of-scope, and adversarial fixtures plus a competency query. The released
manifest and schema are themselves frozen sibling artifacts. `make release-dryrun`
rehearses all of this against the current sources on every `make validate`, so a
gate that has been wrong for weeks surfaces before a release is attempted rather
than during one.

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

## W3C Community Group

This repository is the technical anchor for the vendor-neutral Sensory
Stimulation Vocabulary Community Group. The group is **launched**; its charter is
not yet ratified, and until it is, editorial control of the SSTIM namespace stays
with the maintainer. Its work covers shared terms, semantic models, JSON-LD
contexts, SHACL profiles, safety metadata, evidence annotations, and
implementation guidance. It does not define clinical practice or certify
products, and Community Group work is not a W3C Standard.

- [Charter](CHARTER.md) — the live instrument
- [Original proposal](docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md) — the
  submitted text, kept as a record
- [Ontology publication plan](docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md)
- [Contributing](CONTRIBUTING.md)

## Citation And License

To cite a specific release, use [`CITATION.cff`](CITATION.cff) — it names the
current immutable version and version DOI, and GitHub renders it as *Cite this
repository*. Use the
[concept DOI](https://doi.org/10.5281/zenodo.21286974) when referring to SSTIM
across releases.

- Software: [Apache License 2.0](LICENSE).
- Ontology, vocabulary, documentation, and public reference data:
  [CC BY 4.0](LICENSE-ontology).
- Maintainer: Renato Fabbri,
  [ORCID 0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X).
