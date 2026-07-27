# ROADMAP

> **For AI agents:** Read this before writing any code. It tells you what
> phase the project is in, what is being built next, and what must not be
> built yet. The granular task list is in `TODO.md`.
>
> **Current phase: Phase 1 public foundation, with much of Phase 2 software
> already shipped.** Phase 0 is complete. The BSC Lab v0.1 knowledge browser is
> substantially delivered; what remains in Phase 1 is non-software — defensive
> publication filings, trademarks, the first web article, and partner/advisory
> commitments. Evidence collection is Phase 3 and must still not be built now.
>
> **Checkbox legend:** `[x]` shipped · `[~]` partially shipped, qualifier in the
> item text · `[ ]` not started. A `[~]` means *do not assume this works
> end-to-end* — read the qualifier before building on it.
>
> **Implementation note (ahead of schedule).** Several Phase-2 artifacts already
> exist: the **Patch Studio** — a real-time audiovisual designer with four
> selectable audio engines and a photosensitivity safety layer
> ([`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md)) — the
> **Sensory Field** (`/field/`), a minimal stimulation instrument that emits an
> `sstim-ex:ExposureProfile` and adds a runtime flash-rate safety cap
> ([`docs/technical/SENSORY_FIELD.md`](docs/technical/SENSORY_FIELD.md),
> [ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md)) — the
> installable **PWA** layer, and a Phase-3 **WASM** audio path. The `core/`
> orchestration layer (three-clock scheduler, `StimulationOrchestrator`,
> `SessionRecorder`) and the GPU visual and haptic engines remain unbuilt. See
> [Delivered Outside the Original Plan](#delivered-outside-the-original-plan)
> for everything shipped that this roadmap never listed.

---

## Vision

BSC Lab is open scientific and technical infrastructure for sensory
stimulation: the intentional, measurable design and delivery of auditory,
visual, tactile, and cross-modal stimuli for research, education, and
conservative non-clinical use.

The long-term goal is a self-sustaining ecosystem with three mutually
reinforcing layers:

**Knowledge layer:** A published, open ontology (`w3id.org/sstim`) that
formalizes the vocabulary, evidence tiers, protocol types, and technique
taxonomy of sensory stimulation. The BSC framework lives under
`w3id.org/sstim/framework/bsc`; concrete implementations live under scoped
paths such as `w3id.org/sstim/implementation/bsclab/` and
`w3id.org/sstim/implementation/biosyncare/` when public-safe implementation
metadata is published. The private BioSynCare/BSC catalog is not a BSC Lab data
source. The ontology is machine-readable and citable, reuses OBO ecosystem
terms where semantically appropriate, and is prepared for conservative external
knowledge-graph links. It is a foundation for scientific discussion and
nomenclature standardization.

**Platform layer:** An open-source multi-engine stimulation platform (this
repository) that any researcher, developer, or institution can run, extend,
and build upon. Delivers the same core protocols as BioSynCare in a fully
transparent, auditable form.

**Community layer:** An international network of researchers, clinicians,
and institutions (anchored by a W3C Community Group) that uses the knowledge
and platform layers to advance evidence gathering, coordinate nomenclature,
and support responsible sensory-stimulation research and practice.

The commercial application **BioSynCare** (separate repository) funds the
work at Phase 1-2. Revenue growth funds Phase 3 and beyond. BSC Lab's
credibility amplifies BioSynCare's commercial position. They are coupled
but distinct.

---

## Strategic Logic

The phases are sequenced by dependency, not preference.

Community trust requires a precise artifact to discuss. The artifact is
the ontology. The ontology requires a published namespace and documentation.
The namespace requires a stable schema. The schema is being defined in
Phase 0. Therefore: Phase 0 (schema) → Phase 1 (ontology + browser) →
Phase 2 (stimulation platform) → Phase 3 (community + evidence) → Phase 4
(scale).

Skipping ahead — building evidence collection infrastructure before the
ontology is stable, or forming the W3C CG before five committed founding
members exist — produces either abandoned work or a group that closes for
inactivity. The sequence is designed to prevent this.

BioSynCare's revenue trajectory is a constraint on all phases. Financial
pressure is present but not critical for 6-18 months (as of April 2026).
Phase 1 is designed to be achievable by a team of one to two people working
primarily with AI-assisted development.

---

## Baseline State (April 2026)

- **BioSynCare** v2 just launched on App Store and Google Play with:
  Seraphony (AI on-demand session creation), Rooms (shared synchronous
  sessions), 40 curated presets (catalog v0.9.1), updated animations,
  improved navigation, and a new Learn screen.
- **Revenue:** Near-zero. Introductory subscription at €2/month. Launch
  phase begins now with friends, family, and partner network activation.
- **BSC Lab:** This repository is public. The Phase 0 documents and ontology
  skeleton exist, and an initial SvelteKit knowledge-browser scaffold runs
  locally. No public deployment yet.
- **Partners:** Marco Fracasso (MD, Italy), Rafael Reinhart (MD, Brazil),
  Theo Marins (neuroscience researcher, Austria), Prof. Olimpia Pino
  (University of Parma), IPRJ/UERJ (Brazil), Junto Innovation Hub — all
  with formal interest letters.
- **Scientific advisor:** Juliana Braga de Salles Andrade (PhD neuroimaging,
  Frontiers journals). Active collaborator and daily BSC user.
- **IP:** No trademarks filed yet. No patents. Defensive publication
  strategy chosen over patent filing.

### Repository update (July 2026)

- **SSTIM:** `0.11.0` is the validated, frozen release line, archived under
  version DOI `10.5281/zenodo.21536124`; the continuing project retains
  concept DOI `10.5281/zenodo.21286974`.
- **Ontology:** the seven release modules add qualified evidence governance and
  ecosystem relationships alongside the sensory-domain vocabulary, safety
  metadata, SHACL, OWL reasoning, and executable quality/competency checks.
- **Public data:** BSC Lab framework, implementation, protocols, reference
  presets, evidence, references, experiments, one synthetic session, and a
  synthetic ecosystem contract graph are public. Private catalog, real
  participant data, and real live-only ecosystem records remain excluded.
- **Publication work:** GitHub Pages, WIDOCO/pyLODE documentation, and the stable
  multi-format w3id namespace are live. Registry curation and independent human
  review remain Phase 1 work.

---

## Delivered Outside the Original Plan

This roadmap was written in April 2026, when the ontology had no tagged
releases and the repository had no release engineering. The work below was
delivered since and appears nowhere in the phase deliverables above. It is
recorded here so that the phase lists are not mistaken for the full scope of
what exists.

### Release engineering and citability

- Nine tagged releases, `v0.2.0` (2026-06-12) through `v0.11.0` (2026-07-24).
  No release tag existed when the phases below were written.
- Zenodo archiving enabled at `v0.5.0`: an all-versions concept DOI plus a
  distinct version DOI per release, carried into the ontology metadata,
  VoID/DCAT, citation guidance, and the JSON-LD context.
- Immutable whole-set snapshots under `static/ontology/0.1.0/` … `0.11.0/`
  ([ADR 0020](docs/decisions/0020-whole-set-snapshot-versioning.md)), with a
  `make verify-snapshots` checksum gate against silent edits.
- `CHANGELOG.md` as the release history of record.
- `make validate` as a single composite gate: six SHACL suites, ecosystem
  contract, quality audit, OWL DL reasoning, SPARQL sanity, export check,
  JSON-LD context round-trip, and snapshot verification — all mirrored in CI.

### Ontology modules and quality infrastructure

- Three release modules beyond the original four: `sstim-exposure.ttl`,
  `sstim-ecosystem.ttl`, `sstim-patch-studio.ttl`, plus
  `sstim-ecosystem-private-shapes.ttl`, `void.ttl`, and `context.jsonld`.
- ROBOT/HermiT OWL DL consistency reasoning over the merged term space
  (`make reason`).
- Executable competency and quality checks (`make sparql-sanity`,
  `make quality-audit`) rather than prose competency questions.
- Multi-format serialization export (`make export` → JSON-LD and RDF/XML) and a
  JSON-LD context round-trip test.
- pyLODE `vocpub` SKOS documentation alongside WIDOCO's OWL reference docs
  ([ADR 0023](docs/decisions/0023-ontology-docs-publication-path.md)).
- BioPortal ingest bundle (`make bioportal-bundle`) and submission; FOOPS
  reassessed at 87.5% with only registry-dependent checks outstanding.
- 37 accepted ADRs (0001–0037). Roughly a handful existed in April 2026.

### Ecosystem and stakeholder layer

Not in any phase list. Introduced by
[ADR 0024](docs/decisions/0024-stakeholder-ecosystem-modeling.md) and hardened
by [ADR 0031](docs/decisions/0031-qualified-ecosystem-records.md) and
[ADR 0032](docs/decisions/0032-visible-pending-status-ecosystem-records.md).

- Qualified ecosystem records for people and organizations with a visible
  consent lifecycle (notified → approved), a private ledger, a
  retention/removal runbook, and a private-first admission job.
- A live, mutable public projection (`current.ttl`) kept outside the citable
  releases and opt-in in the app, with source and provenance disclosure.
- `make ecosystem-contract` and `make ecosystem-publish` operational tooling.
- Supporting documents: `ECOSYSTEM_INTEGRATION.md`, `ECOSYSTEM_OPERATIONS.md`,
  `OUTREACH_TARGETS.md`, `HED_BIDS_INTEROP.md`, `SSTIM_LLM_MESSAGING.md`,
  `DEFENSIVE_PUBLICATIONS.md`.

### Application surfaces

- **Sensory Field** (`/field/`) with three scenes, `ExposureProfile` emission,
  and a runtime flash-rate cap ([ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md)).
- **Logbook**, **Profile**, **Settings**, and **About** routes.
- **Entrance/conversion layer**: citation modal, protocol-contribution modal,
  and conversion bar for the four-door entrance.
- **Graph navigator** far beyond "class hierarchy + SKOS scheme": legend
  spotlighting, subgraph guides, facet-based navigation across stimulation and
  neuromodulation, live-ecosystem overlay, provenance disclosure, and
  deep-linkable IRI targets.
- **PWA layer**: manifest, service worker, offline runtime caching, and a
  session-safe update banner ([ADR 0009](docs/decisions/0009-pwa.md)).
- Photosensitivity safety layer, theme/skin system, generated CC0 ambient
  samples (`scripts/gen-ambiences.mjs`) with a `Sample` track type, and vitest
  unit suites beside the source they cover.

### Toolchain and publication path

- A Nix flake pinning Node, Python + pySHACL, ROBOT/HermiT, WIDOCO, pyLODE,
  WABT, and Firebase tooling across Linux and macOS. CI runs every command
  inside it, so contributor and CI toolchains match exactly.
- GitHub Actions for build, check, validate, and Pages deploy.
- w3id.org routing merged upstream three times: PR #6337 (2026-07-11, full
  route × representation matrix), PR #6378 (2026-07-17, catalog and live
  ecosystem routes), and PR #6393 (2026-07-21, HTML-accept deep links into the
  graph browser). One identifier now serves both audiences: a browser hitting
  `w3id.org/sstim` lands in the live graph navigator, a machine gets Turtle.

---

## Phase 0 — Repository Bootstrap
**April 2026 — Ongoing now**

Goal: establish the conceptual and technical foundation before any
software is deployed. Every decision made here shapes what AI agents
build in subsequent phases.

### Deliverables

- [x] `CLAUDE.md` — AI agent directive, invariants, architecture constraints
- [x] `ROADMAP.md` — this file
- [x] `TODO.md` — full tracked task list
- [x] `docs/concept/SENSORY_STIMULATION.md` — term definition and first ontology classes
- [x] `docs/concept/SCOPE.md` — what we claim and what we do not
- [x] `docs/concept/EVIDENCE_FRAMEWORK.md` — six-tier evidence system
- [x] `docs/concept/FACILITATING_DEDICATION.md` — primary validated use case
- [x] `docs/technical/PRESET_FORMAT.md` — preset schema specification with gaps documented
- [x] `docs/technical/SESSION_MODEL.md` — preset vs. session instance distinction
- [x] `docs/technical/BREATHING_MODEL.md` — Martigli system spec (defensive publication)
- [x] `docs/technical/SYMMETRY_SYSTEM.md` — Symmetry permutation spec (defensive publication)
- [x] `docs/technical/MARTIGLI_BINAURAL.md` — hybrid voice type spec (defensive publication)
- [x] `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` — pluggable engine design
- [x] `docs/technical/VISUAL_ENGINE_ARCHITECTURE.md` — visual engine design
- [x] `docs/ecosystem/IP_STRATEGY.md` — defensive publication over patents, trademark plan
- [x] `docs/ecosystem/ADVISORY_BOARD.md` — named members and roles
- [x] `docs/ecosystem/PARTNERS.md` — named partners with interest letters
- [x] `CHARTER.md` (root) — draft W3C CG charter, ready to submit
- [x] `docs/ecosystem/CONSORTIUM_INVITATION.md` — outreach template
- [x] `static/ontology/README.md` — OWL/SKOS design decisions
- [x] `static/ontology/sstim-core.ttl` — OWL skeleton
- [x] `static/ontology/sstim-vocab.ttl` — SKOS vocabulary, multilingual
- [x] `static/ontology/sstim-shapes.ttl` — SHACL shapes
- [x] `static/ontology/sstim-alignments.ttl` — Wikidata/DBpedia links
- [x] `src/README.md` — full software architecture
- [x] `src/engines/README.md`, `src/core/README.md`, `src/rdf/README.md`, `src/ui/README.md`
- [x] `README.md`, [x] `CONTRIBUTING.md`

### Phase 0 is complete when

All 31 reference documents exist in the repository. The ontology skeleton
is valid Turtle and passes basic SHACL validation. The repo is public on
GitHub. Nothing is deployed yet.

**Status (updated 2026-07-10): complete.** All reference documents are
committed; the ontology, vocabulary, validation entrypoints, CI, namespace
policy, public repository, and initial knowledge-browser scaffold exist. Phase
1 now owns publication hardening, external review, and public discovery.

---

## Phase 1 — Public Foundation
**May – July 2026**

Goal: have something real and publicly visible to point at in every
outreach conversation. Establish the scientific credibility infrastructure
before the community formation effort.

### Software: BSC Lab v0.1 (Knowledge Browser)

The stimulation player is NOT part of this phase. Phase 1 builds only
the knowledge navigation layer.

- [x] SvelteKit 2 + Svelte 5 + Vite 6 project scaffold
- [x] RDF loader: fetch and parse ontology TTL files at runtime (N3.js)
- [x] SPARQL query interface (Comunica, lazy-loaded): editor, worked examples,
      results table, documented sources, opt-in live ecosystem graph
- [x] Preset browser: list public BSC Lab seed/reference presets, filter by
      group / frequency band / evidence tier, show full metadata
- [x] Evidence chain view: each preset resolves through
      `sstim:EvidenceAssessmentClaim` → ranked evidence tier →
      `sstim:citesReference` → reference title. The public-safe decision is now
      a publication gate applied before data is committed, not a per-preset UI
      flag — see [ADR 0027](docs/decisions/0027-evidence-claim-family-and-public-claim-gate.md)
      and [ADR 0029](docs/decisions/0029-bsc-lab-public-claim-publication-profile.md)
- [~] SHACL validation: six shape suites run in CI and in the vitest suites via
      `rdf-validate-shacl`/pySHACL (`make shacl`). On-demand in-browser
      validation of an arbitrary preset with a violations panel is not built
- [x] Ontology graph view: Cytoscape.js visualization of class hierarchy
      and SKOS concept scheme (lazy-loaded); since extended well past this
      scope — see [Delivered Outside the Original Plan](#delivered-outside-the-original-plan)
- [x] Basic annotation: add a text note to any ontology node, stored in
      per-user named graph metadata and Firestore when Firebase is configured
- [x] GitHub Pages deployment for the client-only static build and
      `/ontology/*.ttl` artifacts
- [ ] Custom-domain hosting deployment: `lab.biosyncare.com` (CNAME at Keliweb)
      when custom headers, WASM threading, or backend services justify it
      *(deliberately deferred — nothing shipped needs custom headers yet)*
- [x] WIDOCO-generated ontology HTML docs, generated by CI and published
      outside the `main` source tree

### Ontology and IP

- [x] Register `https://w3id.org/sstim` namespace for the ontology
- [x] Extend `https://w3id.org/sstim` namespace routing for BSC framework and
      implementation instances under `/framework/bsc`, `/implementation/bsclab`,
      and public-safe `/implementation/biosyncare` metadata if needed (PR to
      perma-id/w3id.org). Do not publish the private BioSynCare/BSC catalog
      through BSC Lab. *(three upstream merges into perma-id/w3id.org: #6337
      2026-07-11 route × representation matrix, #6378 2026-07-17 catalog and live
      ecosystem routes, #6393 2026-07-21 HTML-accept deep links into the graph
      browser. Verified live: `Accept: text/html` on `w3id.org/sstim` resolves to
      `/graph/`, `Accept: text/turtle` to `sstim-core.ttl`)*
- [ ] Submit defensive publications for Martigli, Symmetry, and
      Martigli-Binaural to IP.com and arXiv (cs.SD)
      *(submission material prepared in `docs/ecosystem/DEFENSIVE_PUBLICATIONS.md`;
      blocked on choosing a venue and securing an arXiv endorser. The repository
      commits already establish the disclosure date)*
- [x] Publish `static/ontology/sstim-core.ttl` and `sstim-vocab.ttl` at
      w3id.org/sstim with content negotiation
- [x] WIDOCO documentation generated by GitHub Actions and deployed without
      committing generated HTML into `main`

### Community and IP protection

- [ ] File trademarks in both jurisdictions — Brazil (INPI) first, then EU
      (EUIPO). Per-mark classes, costs, and priorities are tracked in
      `TODO.md` under "Trademark filings"; do not duplicate filing detail here
- [ ] Add scientific advisory board page to biosyncare.com with Juliana
      and other named advisors
- [ ] Publish first web article: "Facilitating dedication with sensory
      stimulation" on biosyncare.com (personal, phenomenological, honest
      about mechanism uncertainty)
- [~] Personal outreach to each named partner with the specific ask:
      join the BSC scientific advisory board and eventually co-found the
      W3C Community Group *(Theo Marins interviewed 2026-07-22; contributed
      terminology is now in ADRs 0035–0037 and published as an ecosystem record
      at notified status. Remaining partners not yet approached with this ask)*

### BioSynCare (commercial, parallel track)

- [ ] Friends and family activation: ratings, feedback, daily use
- [ ] Social presence: LinkedIn, Instagram, Reddit threads on sensory
      stimulation, meditation, productivity
- [ ] First paying subscriber cohort established
- [ ] Feedback loop: structured feedback from early users about what
      works and what does not

### Phase 1 is complete when

BSC Lab v0.1 is publicly deployed and accessible. The ontology is at
its persistent URI. Defensive publications are timestamped and filed.
Brazilian trademarks are in application. At least three of the named
partners have agreed to the advisory board ask. BioSynCare has its
first meaningful cohort of active users.

**Status (updated 2026-07-27): software done, non-software outstanding.** The
v0.1 browser is deployed and exceeded, and the namespace resolves in every
format. What still gates Phase 1 is all non-code: defensive publication
filings, INPI/EUIPO trademarks, the first web article, the advisory-board ask
to named partners, and the BioSynCare user cohort. Registry curation and
independent human ontology review are also still open.

---

## Phase 2 — Stimulation Platform
**July – November 2026**

Goal: BSC Lab becomes a working stimulation platform, not just a knowledge
browser. The W3C Community Group is launched. The open-source stimulation
player is the reference implementation that makes the consortium goal
concrete rather than abstract.

### Software: BSC Lab v0.2 (Stimulation Player)

- [x] Pluggable audio engine: `IAudioEngine` interface with four registered
      implementations — Vanilla Web Audio, AudioWorklet, AudioWorklet+WASM, and
      Null — selected through the registry/factory in
      `src/engines/audio/audioEngines.js`. Tone.js was dropped; the second
      comparison engine is the AudioWorklet path instead
- [~] AudioWorklet processors (in `static/worklets/`, never bundled): the unified
      `bsc-voice.worklet.js` renders `Carrier`, `IsochronicTone`, and
      `BinauralBeat` entirely on the audio thread. The catalog voice types
      `Martigli`, `Symmetry`, and `Martigli-Binaural` are not yet on the worklet
      path
- [ ] Three-clock architecture: AudioContext master, Worker scheduler,
      rAF renderer *(`src/core/` is still README-only; no Worker scheduler)*
- [~] PixiJS v8 visual engine: breathing animation, entrainment visuals
      synchronized to AudioContext.currentTime *(nine Patch Studio visual track
      types with blend modes and a fullscreen stage, plus 2D-canvas Sensory
      Field scenes, are shipped. `IVisualEngine` and the PixiJS/WebGPU renderer
      are not built)*
- [~] Haptic engine: VibrationApi + NullHapticEngine fallback *(the `Vibration`
      track type, its parameters, and modulation routing exist in the patch
      model; no `IHapticEngine` and no `navigator.vibrate` code path yet, so
      haptic tracks are authored but not emitted)*
- [ ] StimulationOrchestrator: wires all three engines via interface only
- [~] Session player UI: play/pause/stop, duration display, preset info
      *(Patch Studio transport and Sensory Field run controls exist; there is no
      player that takes a catalog preset and plays it)*
- [~] Engine selector UI: switch audio and visual engine mid-session
      (for comparison purposes — a key research feature) *(audio engines are
      selectable in Settings with capability gating, but the choice applies on
      next playback, not mid-session; there is no visual engine to select)*
- [x] Real-time designer with live audio preview — the **Patch Studio**
      (`patch-studio-model-1`); shipped ahead of schedule
- [ ] Bridge the Patch Studio to the catalog preset / RDF instance formats
      (mappable subset + metadata authoring, SHACL-gated) — see
      [ADR 0026](docs/decisions/0026-patch-studio-catalog-bridge.md)
- [ ] SessionRecorder: records preset + user-defined params → complete
      reproducible session specification
- [x] PWA: offline support for cached presets, service worker *(manifest,
      service worker, runtime caching of heavy ontology/audio assets, and a
      session-safe update banner — [ADR 0009](docs/decisions/0009-pwa.md),
      [`docs/technical/PWA_SERVICE_WORKER.md`](docs/technical/PWA_SERVICE_WORKER.md))*

### Software: BSC Lab v0.2 (RDF layer additions)

- [ ] Optional RDF export pipeline: public BSC Lab preset instances →
      runtime JSON for the BSC Lab player *(`make export` covers ontology
      serializations — JSON-LD and RDF/XML — not preset→runtime JSON.
      `src/rdf/export.js` does not exist)*
- [x] Public BSC Lab reference preset instances grow only from explicit,
      publishable examples; the private BioSynCare/BSC catalog remains outside
      this repository *(standing policy, held through every release)*
- [ ] SPARQL-driven preset routing: query by user need → ranked preset
      suggestions with evidence tier display
- [~] Enhanced annotation: named graph per user/session, export as Turtle
      *(per-user named graph and N3-Writer Turtle export shipped, with
      authentication IDs excluded from exports; per-session graphs not yet)*

### Community

- [x] W3C Community Group "Sensory Stimulation Vocabulary Community Group"
      submitted and **launched** (charter not yet ratified; grow participants
      4 → ≥12 as an ongoing KPI — see `docs/ecosystem/ECOSYSTEM_INTEGRATION.md`)
- [ ] BSC Lab GitHub Discussions enabled: initial threads on frequency
      band taxonomy, evidence tier definitions, Sensory Stimulation definition
      *(verified still disabled on the repository)*
- [x] First partner collaboration: ontology annotation session with at
      least one named partner (Theo Marins or Olimpia Pino most likely —
      both have neuroscience domain expertise) *(Theo Marins, University of
      Graz, interviewed 2026-07-22. Outcome: the engagement-mode facet and the
      neurostimulation/neuromodulation two-senses split —
      [ADR 0035](docs/decisions/0035-participant-engagement-mode-and-endogenous-self-regulation.md)
      and [ADR 0036](docs/decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md),
      released in SSTIM 0.10.0.
      [ADR 0037](docs/decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md)
      then corrected a genus defect this work exposed, in 0.11.0)*
- [ ] Add Wikidata items for concepts not yet present: Martigli oscillation,
      Symmetry permutation entrainment, BSC frequency band taxonomy

### BioSynCare (commercial, parallel track)

- [ ] Revenue from subscriptions is meaningful — enough to reduce
      financial pressure
- [ ] Seraphony usage data informs ontology refinements
- [ ] Rooms usage shows which use cases generate social adoption
- [ ] Introduce higher subscription tier if usage justifies it

### Phase 2 is complete when

The BSC Lab stimulation player works end-to-end with at least two
swappable audio engines. The W3C Community Group is active with ≥ 5
members. BioSynCare revenue has meaningfully reduced financial pressure.
Public BSC Lab reference presets are available as RDF, with runtime JSON
generated only for BSC Lab if the player needs it.

**Status (updated 2026-07-27): partially met, out of the planned order.** Four
swappable audio engines work end-to-end inside the Patch Studio, and public
reference presets are published as RDF. But the swappable engines drive
*patches*, not catalog presets: there is no preset player, no orchestrator, no
session recorder, and no preset→runtime JSON path. The CG is launched with 4
participants against a ≥ 5 target. BioSynCare revenue remains negligible.

---

## Phase 3 — Evidence Infrastructure
**November 2026 – April 2027**

Goal: build the infrastructure that makes BSC Lab useful for evidence
gathering. Produce the first citeable outputs. Reduce dependence on
Renato as sole maintainer by finding a dedicated ontology contributor
or group.

### Software: BSC Lab v0.3 (Evidence and Data Layer)

- [ ] Session data export: complete session record (preset + user params +
      session timestamp + self-report) in both JSON and RDF
- [ ] User feedback mechanism: post-session self-report (affect, focus,
      subjective state) with GDPR/LGPD-compliant consent flow
- [ ] Data download: users can export their own session history
- [~] WASM audio engine: Rust→WASM AudioWorklet processors for Martigli
      and Symmetry (better precision, fewer GC stalls) *(arrived early and by a
      different route: a hand-written WAT sine-LUT kernel — `bsc-osc.wat` →
      `bsc-osc.wasm`, rebuilt with `make wasm` — loaded by
      `bsc-voice-wasm.worklet.js` behind `WasmAudioWorkletEngine`. No Rust
      toolchain; Martigli and Symmetry are not ported yet)*
- [ ] Expanded SPARQL interface: query across session history, correlation
      views between preset type and self-report

### Scientific outputs

- [ ] Documented self-case series: Renato + Juliana structured log of
      BSC sessions for facilitating dedication (30-60 sessions minimum),
      published as a web article on biosyncare.com with methodology,
      raw data, and open research questions
- [ ] Juliana's mechanism hypothesis documented (ask pending from
      April 2026 conversation)
- [ ] First W3C CG report: vocabulary specification draft for sensory
      stimulation modalities and protocol types

### Community

- [ ] Find dedicated ontology contributor: a researcher or research group
      willing to take primary ownership of `static/ontology/` development
      (candidate sources: UNIMORE Modena, University of Bologna,
      IIT Genoa, partner institutions in Brazil)
- [ ] W3C CG producing regular meeting notes and discussion archives
- [ ] Wikidata alignment complete: all BSC frequency band concepts linked
      to Wikidata items with `skos:exactMatch`
- [ ] First external citation of BSC ontology in another project
      or publication

### Phase 3 is complete when

Session data infrastructure is live. The self-case series is published.
A dedicated ontology contributor or group is engaged. The W3C CG has
produced its first formal report. BioSynCare revenue is self-sustaining.

---

## Phase 4 — Scale and Sustainability
**2027 and beyond**

Goal: the ecosystem becomes self-sustaining and no longer depends on a
single maintainer. Evidence gathering reaches institutional scale.

### Indicators of success

- BSC Lab is maintained by a community, not only by Renato
- At least one institutional partnership for clinical or observational
  study design using BSC Lab protocols
- BioSynCare generating enough revenue to fund at least one additional
  full-time contributor
- W3C CG vocabulary recommendation used by at least one external platform
  or research project
- The `w3id.org/sstim` ontology is cited in at least one peer-reviewed
  publication
- BSC Lab's evidence tier framework is used or referenced by researchers
  outside the BSC ecosystem

### Possible Phase 4 milestones (not yet committed)

- Proposal for W3C Working Group on Sensory Stimulation standards
  (requires demonstrated CG traction and ≥ 3 W3C member organizations)
- Grant application for clinical study design using BSC protocols
  (candidate: EU Horizon, Brazilian FAPESP, Italian PRIN)
- Multi-language community expansion: Portuguese-language and
  Italian-language branches of the W3C CG
- Dedicated BSC Lab desktop application via Tauri (if offline use
  proves critical for clinical partners)

---

## What Is Intentionally Not in This Roadmap

**Native mobile BSC Lab app.** BSC Lab is a web application. BioSynCare
serves the mobile use case commercially. A BSC Lab mobile app is not
planned.

**AI-generated clinical claims.** Seraphony generates preset descriptions
with conservative wellness framing. It will never generate clinical claims.
This is a permanent constraint, not a roadmap item.

**Peer-reviewed journal publications in the near term.** Articles on
biosyncare.com and the W3C CG reports serve the credibility function
at Phase 1-3. Peer-reviewed publications are a Phase 4 consideration
that depends on having institutional partners and study data.

**Patent filings.** The IP strategy (see `docs/ecosystem/IP_STRATEGY.md`)
chose defensive publication over patents. This decision is not revisited
until BioSynCare reaches acquisition-relevant scale.

---

## For AI Agents: Phase-Gated Build Guidance

| Feature | Phase | Build now? |
|---|---|---|
| RDF loader + N3.js store | 1 | Shipped — extend, don't rebuild |
| SPARQL browser + evidence chain view | 1 | Shipped — extend, don't rebuild |
| Cytoscape.js ontology graph | 1 | Shipped — extend, don't rebuild |
| Basic annotation (Firebase-gated named graph records) | 1 | Shipped — extend, don't rebuild |
| On-demand in-browser SHACL validation UI | 1 | Yes |
| PWA / service worker | 2 | Shipped — see ADR 0009 before touching |
| AudioWorklet stimulation engine | 2 | Shipped for patch track types; Martigli/Symmetry ports: yes |
| Patch Studio (real-time designer) | 2 | Shipped — extend, don't rebuild |
| PixiJS visual engine + `IVisualEngine` | 2 | Not yet |
| Haptic engine (`IHapticEngine`, vibrate path) | 2 | Not yet |
| Three-clock architecture / Worker scheduler | 2 | Not yet |
| StimulationOrchestrator | 2 | Not yet |
| Catalog preset session player | 2 | Not yet |
| Patch Studio → catalog/RDF bridge | 2 | Not yet |
| Session recorder | 2 | Not yet |
| WASM audio processors | 3 | Shipped early (WAT kernel); further DSP ports: yes |
| User feedback / self-report collection | 3 | Not yet |
| Session data export pipeline | 3 | Not yet |
| Multi-user annotation (server-side) | 3 | Not yet |
| Conversational agent automation (OpenClaw intake) — *exploratory proposal* | 3 | Not yet |

If you are asked to build something in "Not yet" rows, flag the
phase conflict before proceeding. Building Phase 3 infrastructure
during Phase 1 wastes effort and creates maintenance burden on
APIs that are not yet stable.

---

## Maintenance

This file is updated at the start of each phase and whenever a
strategic decision changes the sequencing. Granular tasks (individual
issues, feature work, ecosystem events) are tracked in `TODO.md`.
Historical milestones are recorded in `CHANGELOG.md`.

When marking an item shipped, prefer `[~]` with a one-line qualifier over `[x]`
whenever the delivered thing differs from what the item describes. An
unqualified `[x]` that overstates reality is worse than an honest `[~]`.

*Last updated: 2026-07-27 — Renato Fabbri. Status reconciled against the
repository at `v0.11.0`; the phase lists above had drifted since April 2026.*
