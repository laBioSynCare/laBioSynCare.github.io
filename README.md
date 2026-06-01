# BSC Lab

**BSC Lab** is the open-source scientific and technical foundation for sensory
stimulation: a precision multi-engine audiovisual stimulation platform paired
with an open RDF knowledge graph (OWL ontology, SKOS vocabulary, SHACL shapes,
evidence chains) that describes what the platform does, why, and on what
evidence. It is maintained by Renato Fabbri (PhD physics; creator of the
`music` package on PyPI) with scientific advisor Juliana Braga de Salles
Andrade (PhD neuroscience).

BSC Lab is the research/infrastructure project. The related commercial
application **BioSynCare** (React Native, separate repo, closed source) shares
the preset JSON format and SSTIM vocabulary, but its curated catalog is private
and is not imported into or exported by BSC Lab. BSC Lab is not BioSynCare —
see [Relationship to BioSynCare](#relationship-to-biosyncare).

---

## W3C Community Group Proposal: Sensory Stimulation Vocabulary

This repository is the public technical anchor for a proposed **Sensory Stimulation Vocabulary Community Group**.

The proposed group would develop shared terminology, open vocabularies, ontology modules, semantic models, JSON-LD contexts, SHACL validation profiles, and implementation guidance for describing sensory stimulation sessions, stimuli, modalities, parameters, devices, safety metadata, evidence annotations, and related datasets on the Web.

The work is intended to be vendor-neutral and community-led. BioSynCare/BSC Lab may serve as an early implementation environment, but the vocabulary effort is not limited to BioSynCare and is not a BioSynCare product specification.

BSC Lab has two complementary roles in relation to `sstim`:

1. **Vocabulary navigation and annotation interface** — making the `sstim` vocabulary and ontology easier to browse, inspect, annotate, discuss, review, and evolve.
2. **Reference implementation** — providing an open implementation environment for sensory stimulation techniques and protocols described using `sstim`, so terms can be tested against real session structures, stimulus parameters, devices, safety metadata, evidence annotations, and user-facing workflows.

The proposed W3C Community Group would focus on developing shared terminology and semantic structures so that sensory stimulation research, software, hardware, datasets, safety metadata, and institutional communication can become more coherent and interoperable.

The proposed group does **not** define clinical practice guidelines, certify therapeutic efficacy, prescribe medical protocols, issue public-health recommendations, evaluate regulated-device claims, or claim that any specific sensory stimulation protocol treats, cures, prevents, or diagnoses medical conditions.

Initial namespace:

```text
https://w3id.org/sstim/
```

Key documents:

- [Charter](./CHARTER.md)
- [W3C Community Group Proposal](./docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md)
- [Scope](./docs/concept/SCOPE.md)
- [Non-Scope](./docs/concept/NON_SCOPE.md)
- [Ontology / Vocabulary Notes](./docs/ontology/README.md)

---

## Current Status

What exists today:

- A reference-document set (concept, technical, ecosystem, decisions, AI-agent
  directive) — see the [documentation index](docs/README.md)
- Four ontology Turtle files: `sstim-core.ttl` (OWL), `sstim-vocab.ttl`
  (multilingual SKOS), `sstim-shapes.ttl` (SHACL), `sstim-alignments.ttl`
  (external links to Wikidata, DBpedia, OBO)
- A SvelteKit/Svelte 5 app with two working subsystems:
  - **Knowledge browser** — Cytoscape ontology graph, SPARQL interface, preset
    browser, and optional Firebase-backed node annotations
  - **Patch Studio** — a real-time audiovisual designer with four selectable
    audio engines (Vanilla Web Audio, AudioWorklet, AudioWorklet+WASM, Silent),
    six audio voice types (incl. noise, drone, sample) with a universal
    tremolo, nine visual track types with blend/fullscreen mixing, breathing/
    Symmetry control modulation, and a photosensitivity safety layer.
    See [`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md).
- AudioWorklet processors and a hand-written WASM oscillator kernel in
  `static/worklets/`, with synthetic CC0 ambient clips in `static/audio/`
- A GitHub Pages deployment workflow for the client-only static build and
  `/ontology/*.ttl` artifacts

What does **not** yet exist or is explicitly out of scope:

- The `core/` orchestration layer (master clock, Worker scheduler, orchestrator)
  and the GPU visual / haptic engines described in the architecture specs
- Custom-domain hosting at `lab.biosyncare.com`; deferred until the app needs
  custom headers, WASM threading, or backend services
- Private BioSynCare/BSC catalog conversion; that catalog is outside BSC Lab
- A bridge from a Patch Studio draft to the preset catalog JSON / RDF instances
- JSON Schemas for preset/session validation (`schemas/`), the `tests/` subtree,
  pre-commit hooks (`hooks/`), and deployed WIDOCO documentation

See [`ROADMAP.md`](ROADMAP.md) for phase definitions and
[`TODO.md`](TODO.md) for the tracked task list.

---

## Repository map

```
CLAUDE.md               AI agent directive — read first before any edit
ROADMAP.md              Strategic phases (0 → 1 → 2 → 3)
TODO.md                 Tracked task list; current-focus section at top
CONTRIBUTING.md         Governance and contribution guide

docs/                   Reference documents — see docs/README.md (index)
  concept/              What the domain is, scope, evidence framework
  technical/            Preset format, Patch Studio, safety, engine architectures
  decisions/            Architecture decision records (ADRs)
  ecosystem/            IP strategy, W3C CG charter, advisory board, partners

static/
  ontology/             Turtle files served by Vite dev and GitHub Pages
    sstim-core.ttl        OWL classes and properties
    sstim-vocab.ttl       SKOS vocabulary (en/it/pt/es), dual-typed individuals
    sstim-shapes.ttl      SHACL validation shapes
    sstim-alignments.ttl  External ontology alignments (BFO, OBI, IAO, Wikidata)
    instances/            Public BSC Lab/reference RDF instances (seed data)
  worklets/             AudioWorklet processors + WASM oscillator kernel
  audio/                Synthetic CC0 ambient clips for the Sample voice

src/                    SvelteKit app — see src/README.md
  rdf/                  Loader, SPARQL wrapper, graph model, namespace IRI helpers
  engines/audio/        IAudioEngine + four engines + selection factory
  ui/                   Patch Studio, ontology graph, annotations, navigation,
                        theme, safety, auth
  firebase/             Optional auth + Firestore (annotations, profiles)
  routes/               SvelteKit pages (graph, creator, presets, sparql,
                        logbook, profile, settings)
  core/, engines/visual, engines/haptic  Planned modules (README placeholders)

scripts/                gen-ambiences.mjs (regenerates static/audio/*.wav)
schemas/                JSON Schemas (planned)
tests/                  Dedicated test subtree (planned; unit tests beside source)
```

---

## Start here

- **Documentation index:** [`docs/README.md`](docs/README.md) — the map of every
  reference document.
- **First-time readers:** [`docs/concept/SCOPE.md`](docs/concept/SCOPE.md) —
  what BSC Lab claims and explicitly does not claim.
- **Ontology / knowledge graph:** [`static/ontology/README.md`](static/ontology/README.md).
- **Software architecture:** [`src/README.md`](src/README.md).
- **Patch Studio (the audiovisual designer):**
  [`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md).
- **AI coding agents (Claude, Copilot, Cursor, Gemini):**
  [`CLAUDE.md`](CLAUDE.md) — absolute invariants and project conventions.
- **Preset catalog data format:**
  [`docs/technical/PRESET_FORMAT.md`](docs/technical/PRESET_FORMAT.md).

---

## Local Verification

The current runnable checks are:

```bash
make validate  # SHACL over core + vocabulary + RDF instances
make check     # SvelteKit sync + svelte-check
make build     # Static production build into dist/
```

The SHACL pass currently conforms for the core ontology, vocabulary, and seeded
RDF instances. A local `hooks/pre-commit` wrapper is planned for Phase 1.

## Firebase Annotations

RDF node annotations are optional. To enable them locally, copy
`.env.example` to `.env`, fill the `VITE_FIREBASE_*` values from a Firebase web
app, and enable Email/Password, Google, and Anonymous providers in Firebase
Auth. For GitHub Pages, add the same `VITE_FIREBASE_*` keys as repository
Actions variables so the static build receives them. Deploy `firestore.rules`
and `firestore.indexes.json` to keep annotation documents scoped to the signed-in
user.

---

## Namespace convention

SSTIM has one persistent registered namespace, with scoped paths for ontology
terms, frameworks, and concrete implementations:

- **`https://w3id.org/sstim`** — the ontology (OWL classes/properties, SKOS
  vocabulary, SHACL shapes). Reusable by other projects. The w3id redirect is
  live and should resolve to the GitHub Pages `/ontology/*.ttl` artifacts.
- **`https://w3id.org/sstim/framework/bsc`** — the BSC framework: techniques,
  composition rules, evidence rules, and design principles.
- **`https://w3id.org/sstim/implementation/biosyncare`** — reserved for
  public-safe BioSynCare implementation metadata if it is ever published; the
  private BioSynCare catalog is not loaded by BSC Lab.
- **`https://w3id.org/sstim/implementation/bsclab`** — the open BSC Lab
  reference implementation and public seed/reference data.

Implementation data uses implementation-scoped subpaths such as
`/preset/{id}`, `/session/{id}`, `/annotation/{id}`, and `/evidence/{id}`.
BSC itself is a framework, not a protocol, preset, or software app.

Full discussion in [`CLAUDE.md` §5.1](CLAUDE.md) and
[`ADR 0007`](docs/decisions/0007-framework-protocol-implementation.md).

---

## Relationship to BioSynCare

BioSynCare is the commercial application (React Native, separate repository,
closed source). BSC Lab is the open-source research and development platform.
The interface between them is the preset JSON format, SSTIM vocabulary, and
shared implementation standards. The BioSynCare/BSC catalog remains private in
the BioSynCare context and is not converted to Turtle in this repository.
Neither repo imports from the other. Changes to the preset schema require
coordination between both.

---

## License and contact

- **Software source code:** Apache License 2.0 — see [`LICENSE`](LICENSE).
- **Ontology, vocabulary, documentation, and public BSC Lab seed/reference
  data:** Creative Commons Attribution 4.0 International — see
  [`LICENSE-ontology`](LICENSE-ontology).
- **Maintainer:** Renato Fabbri — `renato.fabbri@gmail.com` —
  ORCID [0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X)
- **Contributions:** see [`CONTRIBUTING.md`](CONTRIBUTING.md). Bug reports
  and discussion: GitHub issues on this repository.
