# BSC Lab

**BSC Lab** is the open-source scientific and technical foundation for sensory
stimulation: a precision multi-engine audiovisual stimulation platform paired
with an open RDF knowledge graph (OWL ontology, SKOS vocabulary, SHACL shapes,
evidence chains) that describes what the platform does, why, and on what
evidence. It is maintained by Renato Fabbri (PhD physics; creator of the
`music` package on PyPI) with scientific advisor Juliana Braga de Salles
Andrade (PhD neuroscience).

BSC Lab is the research/infrastructure project. The related commercial
application **BioSynCare** (React Native, separate repo, closed source)
consumes BSC Lab's exported preset catalog. BSC Lab is not BioSynCare — see
[Relationship to BioSynCare](#relationship-to-biosyncare).

---

## Current Status — Phase 0 → 1 Boundary

The repository is at the **Phase 0 → Phase 1 boundary**. What exists today:

- 31 reference documents (concept, technical, ecosystem, AI-agent directive)
- Four ontology Turtle files: `sstim-core.ttl` (OWL), `sstim-vocab.ttl`
  (multilingual SKOS), `sstim-shapes.ttl` (SHACL), `sstim-alignments.ttl`
  (external links to Wikidata, DBpedia, OBO)
- A SvelteKit/Svelte 5 scaffold with initial ontology graph and SPARQL routes
- Architecture READMEs under `src/` describing the target software design

What does **not** yet exist (planned — Phase 1 and later):

- A public deployment at `lab.biosyncare.com`
- Preset browser, evidence-chain view, annotation storage, or browser-side
  SHACL validation UI
- AudioWorklet processors (`static/worklets/`)
- JSON Schemas for preset/session validation (`schemas/`)
- Test suites (`tests/`)
- Pre-commit hooks (`hooks/`)
- Deployed WIDOCO documentation or published `w3id.org/sstim` namespace

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
  ontology/             Turtle files served same-origin by Netlify / Vite dev
    sstim-core.ttl        OWL classes and properties
    sstim-vocab.ttl       SKOS vocabulary (en/it/pt/es), dual-typed individuals
    sstim-shapes.ttl      SHACL validation shapes
    sstim-alignments.ttl  External ontology alignments (BFO, OBI, IAO, Wikidata)
    instances/            Preset/session/evidence RDF instances (planned)
  worklets/             AudioWorklet processors (planned — Phase 2)

src/                    SvelteKit app scaffold (Phase 1 — in progress)
  rdf/                  Loader, SPARQL wrapper, namespace IRI helpers
  routes/               SvelteKit pages (ontology browser, SPARQL interface)
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
make validate  # SHACL over core + vocabulary; skips empty instance dirs
make check     # SvelteKit sync + svelte-check
make build     # Static production build into dist/
```

The SHACL pass currently conforms for both the core ontology and vocabulary.
A local `hooks/pre-commit` wrapper is planned for Phase 1.

---

## Namespace convention

Two persistent IRI roots, one rule each:

- **`https://w3id.org/sstim`** — the ontology (OWL classes/properties, SKOS
  vocabulary, SHACL shapes). Reusable by other projects. Planned for
  registration at [w3id.org](https://w3id.org) in Phase 1.
- **`https://w3id.org/bsc/{preset,session,annotation,evidence}/...`** — BSC
  product instances. Preset IRIs and user-generated data live here so the
  ontology stays reusable.

Full discussion in [`CLAUDE.md` §5.1](CLAUDE.md) and
[`static/ontology/README.md`](static/ontology/README.md).

---

## Relationship to BioSynCare

BioSynCare is the commercial application (React Native, separate repository,
closed source). BSC Lab is the open-source research and development platform.
The single interface between them is the preset JSON format: BSC Lab's RDF
pipeline will export `dist/presets.json` (planned — Phase 2) which BioSynCare
consumes. Neither repo imports from the other. Changes to the preset schema
require coordination between both.

---

## License and contact

- **Software source code:** Apache License 2.0 — see [`LICENSE`](LICENSE).
- **Ontology, vocabulary, documentation, and preset data:** Creative Commons
  Attribution 4.0 International — see [`LICENSE-ontology`](LICENSE-ontology).
- **Maintainer:** Renato Fabbri — `renato.fabbri@gmail.com` —
  ORCID [0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X)
- **Contributions:** see [`CONTRIBUTING.md`](CONTRIBUTING.md). Bug reports
  and discussion: GitHub issues on this repository.
