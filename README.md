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

## Current Status — Phase 0 → 1 Boundary

The repository is at the **Phase 0 → Phase 1 boundary**. What exists today:

- 31 reference documents (concept, technical, ecosystem, AI-agent directive)
- Four ontology Turtle files: `sstim-core.ttl` (OWL), `sstim-vocab.ttl`
  (multilingual SKOS), `sstim-shapes.ttl` (SHACL), `sstim-alignments.ttl`
  (external links to Wikidata, DBpedia, OBO)
- A SvelteKit/Svelte 5 scaffold with initial ontology graph and SPARQL routes
- A GitHub Pages deployment workflow for the client-only static build and
  `/ontology/*.ttl` artifacts
- Architecture READMEs under `src/` describing the target software design

What does **not** yet exist or is explicitly out of scope:

- Custom-domain hosting at `lab.biosyncare.com`; this is deferred until the
  app needs custom headers, WASM threading, or backend services
- Private BioSynCare/BSC catalog conversion; that catalog is outside BSC Lab
- Full public reference preset set, evidence-chain view, or browser-side SHACL
  validation UI
- Production Firebase project credentials for the optional RDF annotation layer
- AudioWorklet processors (`static/worklets/`)
- JSON Schemas for preset/session validation (`schemas/`)
- Test suites (`tests/`)
- Pre-commit hooks (`hooks/`)
- Deployed WIDOCO documentation

See [`ROADMAP.md`](ROADMAP.md) for phase definitions and
[`TODO.md`](TODO.md) for the tracked task list and current Phase 1 backlog.

---

## Repository map

```
CLAUDE.md               AI agent directive — read first before any edit
ROADMAP.md              Strategic phases (0 → 1 → 2 → 3)
TODO.md                 Tracked task list; current-focus section at top
CONTRIBUTING.md         Governance and contribution guide

docs/
  concept/              What the domain is, scope, evidence framework
  technical/            Preset format, engine architectures, defensive pubs
  ecosystem/            IP strategy, W3C CG charter, advisory board, partners

static/
  ontology/             Turtle files served by Vite dev and GitHub Pages
    sstim-core.ttl        OWL classes and properties
    sstim-vocab.ttl       SKOS vocabulary (en/it/pt/es), dual-typed individuals
    sstim-shapes.ttl      SHACL validation shapes
    sstim-alignments.ttl  External ontology alignments (BFO, OBI, IAO, Wikidata)
    instances/            Public BSC Lab/reference RDF instances (Phase 1 seed data)
  worklets/             AudioWorklet processors (planned — Phase 2)

src/                    SvelteKit app scaffold (Phase 1 — in progress)
  rdf/                  Loader, SPARQL wrapper, namespace IRI helpers
  routes/               SvelteKit pages (ontology browser, presets, SPARQL)
  core/, engines/, ui/  Engine and UI modules (planned)

schemas/                JSON Schemas (planned — Phase 1)
tests/                  Test suites (planned — Phase 1)
```

---

## Start here

- **First-time readers:** [`docs/concept/SCOPE.md`](docs/concept/SCOPE.md) —
  what BSC Lab claims and explicitly does not claim.
- **Ontology / knowledge graph:** [`static/ontology/README.md`](static/ontology/README.md).
- **Software architecture:** [`src/README.md`](src/README.md) (targets only).
- **AI coding agents (Claude, Copilot, Cursor, Gemini):**
  [`CLAUDE.md`](CLAUDE.md) — absolute invariants and project conventions.
- **Preset data format:**
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
