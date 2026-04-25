# Contributing to BSC Lab

BSC Lab is an open-source Sensory Stimulation platform maintained by
Renato Fabbri. Contributions are welcome across four layers: software,
preset design, ontology, and scientific evidence. Each layer has different
standards because the consequences of errors are different.

---

## Table of contents

1. [Before you contribute](#1-before-you-contribute)
2. [Layer 1 — Software](#2-layer-1--software)
3. [Layer 2 — Preset design](#3-layer-2--preset-design)
4. [Layer 3 — Ontology and vocabulary](#4-layer-3--ontology-and-vocabulary)
5. [Layer 4 — Scientific evidence](#5-layer-4--scientific-evidence)
6. [Pull request process](#6-pull-request-process)
7. [Issue reporting](#7-issue-reporting)
8. [Governance](#8-governance)
9. [License](#9-license)

---

## 1. Before you contribute

**Read `CLAUDE.md` completely.** It contains absolute invariants about the
audio engine, ontology protection rules, and prohibited code patterns. Violating
these invariants will cause your PR to be rejected regardless of code quality.

**Read the relevant domain document.** For preset work: `docs/technical/PRESET_FORMAT.md`.
For evidence claims: `docs/concept/EVIDENCE_FRAMEWORK.md`. For ontology work:
`static/ontology/README.md`. For the domain concept: `docs/concept/SENSORY_STIMULATION.md`.

**Run the local checks before submitting.** A `hooks/` wrapper is planned, but
CI now mirrors the core local checks:
```bash
npm install
make validate
make check
make build
```

The future hook should wrap the same commands plus JSON Schema checks once the
schemas exist.

---

## 2. Layer 1 — Software

### Accepted contributions

- Bug fixes in the audio, visual, or haptic engines
- New `IAudioEngine` or `IVisualEngine` implementations
- UI components for the session player, preset browser, graph view, or
  annotation editor
- RDF pipeline improvements (loader, exporter, query helpers)
- Test coverage for any of the above

### Rejected without review

- Alternative audio scheduling architectures that collapse the three-clock system
- Anything that calls `Date.now()` or `setTimeout()` for AV synchronization
- Svelte 4 syntax (`export let`, `$:`, `on:click`, `<slot />`) — this repo
  uses Svelte 5 runes exclusively
- Bundled AudioWorklet files — `static/worklets/` files must remain unbundled
- Imports inside `AudioWorkletProcessor.process()` — no allocation, no imports
- User-facing strings that contain health, treatment, or medical claims

### Code standards

- Svelte 5 runes syntax throughout: `$state()`, `$derived()`, `$props()`,
  `onclick`, `{@render children()}`
- Engine implementations must implement the full `IAudioEngine` /
  `IVisualEngine` interface, including `getCapabilities()` and all optional
  methods
- AudioWorklet processors: pre-allocate all state in `constructor()`, zero
  allocation in `process()`, return `true`
- Namespaces: never hardcode IRI strings; import from `src/rdf/namespaces.js`
- Tests: new engine implementations must pass `tests/engines/IAudioEngineCompliance.test.js`
- PixiJS: use v8 API only — `app.canvas`, `graphics.circle()`, async `app.init()`

### Setup

```bash
npm install
make dev             # Preferred local entrypoint (http://127.0.0.1:4173/)
npm run dev          # Underlying Vite script if you need custom flags
make build           # Production build
make preview         # Preview production build (http://127.0.0.1:4174/)
make test            # Vitest
make check           # SvelteKit sync + svelte-check
make validate        # SHACL validation (current ontology suite)
```

---

## 3. Layer 2 — Preset design

### Who can contribute presets

Anyone. Preset contributions are the most accessible entry point. A preset
is a JSON object; no code changes are required. The design reference is
`docs/technical/PRESET_FORMAT.md`.

### Preset contribution checklist

Before submitting a new or revised preset:

- [ ] `_id` format: `"Group - English Name"` (exact spacing, correct group capitalization)
- [ ] All four multilingual `desc*` and `med2*` fields populated
- [ ] `techDescEng` (and ideally all four `techDesc*`) present
- [ ] `hasBreathGuide` is `true` iff exactly one voice has `isOn: true`
- [ ] `voiceTypes` lists unique voice types in first-appearance order
- [ ] All waveform fields are numeric `0` — never `"sine"` or `"0"`
- [ ] At most one voice has `isOn: true`; if present, `mp0 ≥ 3`
- [ ] All `iniVolume` values ≤ 0.30 (or rationale documented)
- [ ] All Symmetry voices: `noteSep = d / nnotes ≥ 0.020 s`
- [ ] Frequency sweep bounds: `center ± ma` within [50, 450] Hz for MB/Martigli
- [ ] `evidenceTier` assigned using criteria in `docs/concept/EVIDENCE_FRAMEWORK.md`
- [ ] `cautionTags` complete and accurate
- [ ] `techDesc*` contains no fabricated citations, numeric effect sizes without references, or treatment claims
- [ ] JSON Schema validation passes: `npx ajv validate -s schemas/preset.schema.json -d your-preset.json`

### Evidence tier requirements by group

| Group | Minimum tier | Notes |
|---|---|---|
| Heal | 3 (preliminary) | Conservative wellness framing required |
| Support | 2 (anecdotal) | Explicit evidence limitation statement in techDesc |
| Perform | 2 (anecdotal) | Performance framing; no cognitive enhancement claims |
| Indulge | 1 (speculative) | No mechanism claim required |
| Transcend | 1 (speculative) | Phenomenological framing acceptable |

### Language requirements for claims

All four language descriptions must be semantically consistent — no language
may be stronger than any other. If the English description says "may support,"
Italian, Portuguese, and Spanish must use equivalent hedged language. The
evidence tier constrains what can be said in any language.

Prohibited in any language in any user-facing field:
- Treatment, cure, diagnosis, prevention claims
- Specific effect sizes ("increases alpha by 30%")
- Unqualified mechanism assertions ("synchronizes your brainwaves to 10 Hz")
- Any language that implies BioSynCare is a medical device

---

## 4. Layer 3 — Ontology and vocabulary

### Protected files

These files are protected from modification without maintainer approval:

```
static/ontology/sstim-core.ttl
static/ontology/sstim-vocab.ttl
static/ontology/sstim-shapes.ttl
static/ontology/sstim-alignments.ttl
docs/technical/BREATHING_MODEL.md   ← defensive publication, do not modify
docs/technical/SYMMETRY_SYSTEM.md   ← defensive publication, do not modify
docs/technical/MARTIGLI_BINAURAL.md ← defensive publication, do not modify
```

### Adding a vocabulary term (frequency band, mechanism, modality, etc.)

Open a GitHub Issue using the template `issue_templates/vocab_addition.md`.
The issue must include:

1. The proposed concept IRI (`sstim-v:proposedName`)
2. English, Italian, Portuguese, and Spanish `skos:prefLabel` values
3. `hzMin` and `hzMax` for frequency band additions
4. The SKOS hierarchy position (`skos:broader` parent)
5. At least one existing preset that would use this concept
6. Rationale for why existing concepts are insufficient

Vocabulary additions to `sstim-vocab.ttl` require maintainer approval. Terms
are permanent — IRIs cannot be deleted once published. Deprecated terms receive
`owl:deprecated true` and a `skos:historyNote`.

### Evidence tier challenges

If you believe an evidence tier assignment is incorrect for a specific preset
or technique:

1. Open an Issue with: the specific IRI, the current tier, your proposed tier,
   and the specific evidence (with DOI/citation) that supports the change
2. Tier upgrades require at least one peer-reviewed study not already considered
   in the current assignment
3. Tier downgrades require identification of a methodological flaw or a
   contradicting meta-analysis
4. Tier changes affecting Tier 4+ require concurrence from the scientific
   advisory board

### SHACL shapes

New SHACL shapes that add constraints must be accompanied by:
- At least one valid test instance that passes the new shape
- At least one invalid test instance that fails it
- A comment in the shape explaining the constraint's rationale

---

## 5. Layer 4 — Scientific evidence

### Adding a new public-safe reference

Public-safe references (citable in user-facing `techDesc` fields) are managed
in the BSC Reference Agent document (`referenceDocuments/BSC_Reference_Agent_*.md`)
and in `static/ontology/instances/references/references.ttl`.

To add a reference:

1. Confirm the paper is: (a) peer-reviewed, (b) publicly accessible, (c) not
   retracted, (d) relevant to a BSC technique's proposed mechanism or outcome
2. Open a PR adding the reference to `static/ontology/instances/references/references.ttl`
   using the `sstim:PublicSafeReference` class with `sstim:referenceKey`,
   `dct:title`, `dct:creator`, `dct:date`, `dct:identifier` (DOI)
3. Note which modality tags apply (AUD, AV, BREATH, GENERAL, PRECLINICAL, REVIEW)
   using `sstim:hasModalityTag`
4. Do not add references that are: preprints without peer review, self-published
   studies, studies where the lead author has a commercial conflict of interest
   not disclosed in the paper, or studies with fewer than 20 participants
   without strong effect size qualification

### Defensive publications

The three defensive publications (`BREATHING_MODEL.md`, `SYMMETRY_SYSTEM.md`,
`MARTIGLI_BINAURAL.md`) are prior art records. Do not modify them after their
first public commit. Extensions or corrections must be added as new documents
that reference and supersede the originals, preserving the originals unchanged.

If you believe a technique described in those documents deserves a formal
arXiv submission, open an Issue. The arXiv submission should cite the GitHub
first-commit hash as the prior disclosure date.

---

## 6. Pull request process

### PR requirements

Every PR must:

1. Pass all pre-commit hook checks (SHACL, JSON Schema, Turtle syntax)
2. Include a summary of what changed and why
3. Reference the Issue it addresses (or explain why no Issue exists)
4. Not modify protected files without explicit maintainer approval in the Issue
5. Not include health or treatment claims in any user-facing string
6. Not introduce dependencies not approved in `CLAUDE.md` section 2

### PR size guidelines

- Software PRs: prefer small, focused changes. A PR that changes 10 files
  is harder to review than 3 PRs of 3–4 files each.
- Preset PRs: a PR may add up to 5 presets or revise up to 10 at once.
- Ontology PRs: one vocabulary term addition per PR is preferred. Schema
  changes (SHACL shapes) should be separate from vocabulary additions.

### Review timeline

PRs are reviewed by Renato Fabbri typically within 5–10 business days.
High-priority bug fixes are reviewed within 2 business days. Ontology changes
affecting published IRIs may take longer as they require more careful review.

---

## 7. Issue reporting

### Bug reports

Include: browser/OS, steps to reproduce, expected behavior, actual behavior,
and (for audio issues) whether the problem occurs with headphones vs. speakers.

For audio timing issues, include `audioContext.sampleRate` and
`audioContext.outputLatency` if accessible.

### Feature requests

Before requesting a feature, check:
- `ROADMAP.md` (may already be planned)
- `TODO.md` (may already be tracked)
- Existing open Issues (may be duplicate)

Feature requests related to the ontology vocabulary (new frequency bands,
mechanisms, etc.) should follow the vocabulary term process in Section 4.

### Security issues

Do not open public Issues for security vulnerabilities. Email
`renato@biosyncare.com` directly. BSC Lab does not store user health data
(session data is local by default; cloud sync is opt-in). The primary
security surface is the preset catalog export pipeline.

---

## 8. Governance

### Decision authority

| Decision type | Authority |
|---|---|
| Bug fixes and minor features | Renato Fabbri (sole maintainer) |
| Ontology class additions | Renato Fabbri + advisory board input |
| Evidence tier changes (Tier 4+) | Renato Fabbri + Juliana Braga de Salles Andrade |
| Vocabulary term additions | Renato Fabbri |
| Defensive publication modifications | Cannot be modified after first commit |
| Preset catalog additions | Renato Fabbri |
| W3C CG charter | CG chair + CG participants |
| SSTIM namespace governance | W3C CG (when constituted) |

### W3C Sensory Stimulation Community Group

The SSTIM namespace (`https://w3id.org/sstim`) is intended to be governed
by the W3C Sensory Stimulation Community Group once constituted. BSC Lab will
transfer editorial control of the vocabulary files to the CG. Until the CG is
constituted, Renato Fabbri maintains editorial control.

CG participation is open to anyone. The CG will focus on:
- Maintaining and extending the SSTIM vocabulary and ontology
- Developing interoperability standards for sensory stimulation protocols
- Organizing evidence review for vocabulary claims
- Coordinating with adjacent communities (OT, neuroscience, music therapy)

To express interest in the CG, open an Issue with the label `w3c-cg`.

### Code of conduct

BSC Lab applies the [Contributor Covenant](https://www.contributor-covenant.org/)
v2.1. In brief: be kind, be constructive, assume good faith. Maintainer
decisions about evidence claims and vocabulary terms are made in good faith
based on scientific evidence and regulatory caution; disagreement should be
expressed through the Issue process, not through social pressure.

---

## 9. License

**Software source code, build configuration, and application runtime code:**
Apache License 2.0. See `LICENSE`.

**Ontology, vocabulary, documentation, and preset data:** Creative Commons
Attribution 4.0 International. See `LICENSE-ontology`.

**Defensive publications** (`docs/technical/BREATHING_MODEL.md`,
`docs/technical/SYMMETRY_SYSTEM.md`, `docs/technical/MARTIGLI_BINAURAL.md`):
CC BY 4.0, with the additional constraint that the files must not be modified
after their first public commit (the modification constraint protects their
function as prior art records, not their copyright status).

By contributing to BSC Lab you agree that your contributions are licensed
under the applicable license for the layer you are contributing to.

---

*Maintained by: Renato Fabbri — renato.fabbri@gmail.com — ORCID [0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X)*
*Last updated: April 2026*
