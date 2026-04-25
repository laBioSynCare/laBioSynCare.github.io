# ROADMAP

> **For AI agents:** Read this before writing any code. It tells you what
> phase the project is in, what is being built next, and what must not be
> built yet. The granular task list is in `TODO.md`.
>
> **Current phase: 0 → 1 boundary.** The repository is being established.
> BSC Lab v0.1 (knowledge browser) is the nearest software milestone.
> The stimulation player is Phase 2. Evidence collection is Phase 3.
> Do not build Phase 3 infrastructure during Phase 1 work.

---

## Vision

BSC Lab is the open scientific and technical infrastructure for sensory stimulation — the intentional design and delivery of auditory, visual, and
haptic stimulation to induce desired changes in physiological, psychological,
or cognitive state.

The long-term goal is a self-sustaining ecosystem with three mutually
reinforcing layers:

**Knowledge layer:** A published, open ontology (`w3id.org/sstim`) that
formalizes the vocabulary, evidence tiers, protocol types, and technique
taxonomy of sensory stimulation. BSC-specific instances (presets, sessions,
annotations) live under the product namespace `w3id.org/bsc/`. Machine-readable, citable, linked to
Wikidata and OBO Foundry. The foundation for scientific discussion and
nomenclature standardization.

**Platform layer:** An open-source multi-engine stimulation platform (this
repository) that any researcher, developer, or institution can run, extend,
and build upon. Delivers the same core protocols as BioSynCare in a fully
transparent, auditable form.

**Community layer:** An international network of researchers, clinicians,
and institutions (anchored by a W3C Community Group) that uses the knowledge
and platform layers to advance evidence gathering, coordinate nomenclature,
and advocate for sensory stimulation as a legitimate wellness and performance
intervention.

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

## Current State (April 2026)

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
- [x] `docs/ecosystem/W3C_CG_CHARTER.md` — draft charter, ready to submit
- [x] `docs/ecosystem/CONSORTIUM_INVITATION.md` — outreach template
- [x] `static/ontology/README.md` — OWL/SKOS design decisions
- [x] `static/ontology/sstim-core.ttl` — OWL skeleton
- [x] `static/ontology/sstim-vocab.ttl` — SKOS vocabulary, multilingual
- [x] `static/ontology/sstim-shapes.ttl` — SHACL shapes
- [x] `static/ontology/sstim-alignments.ttl` — Wikidata/DBpedia links
- [x] `src/README.md` — full software architecture
- [x] `src/engines/README.md`, `src/core/README.md`, `src/rdf/README.md`, `src/ui/README.md`
- [~] `README.md`, [x] `CONTRIBUTING.md`

### Phase 0 is complete when

All 31 reference documents exist in the repository. The ontology skeleton
is valid Turtle and passes basic SHACL validation. The repo is public on
GitHub. Nothing is deployed yet.

**Status (2026-04-25):** all 31 reference documents are committed. The core
ontology and vocabulary conform against `sstim-shapes.ttl`; the earlier
`sstim-v:allFrequencyBands` SHACL issue is resolved. The repo is public on
GitHub. A "Public Foundation Pass" has added the root README rewrite, docs
index, instance-layout index, namespace convention lock-in, initial SvelteKit
knowledge-browser scaffold, and local validation entrypoints. CI and final
task-tracker reality sync close out the boundary into Phase 1.

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
- [~] SPARQL query interface (Comunica, lazy-loaded)
- [ ] Preset browser: list all presets, filter by group / frequency band /
      evidence tier, show full metadata
- [ ] Evidence chain view: for each preset, show evidence claims →
      references → public-safe flag
- [ ] SHACL validation: validate any preset on demand, display violations
- [x] Ontology graph view: Cytoscape.js visualization of class hierarchy
      and SKOS concept scheme (lazy-loaded)
- [ ] Basic annotation: add a text note to any ontology node, stored in
      named graph in IndexedDB
- [x] GitHub Pages deployment for the client-only static build and
      `/ontology/*.ttl` artifacts
- [ ] Custom-domain hosting deployment: `lab.biosyncare.com` (CNAME at Keliweb)
      when custom headers, WASM threading, or backend services justify it
- [ ] WIDOCO-generated ontology HTML docs, generated by CI and published
      outside the `main` source tree

### Ontology and IP

- [~] Register `https://w3id.org/sstim` namespace for the ontology
      (redirect is live; verify final Pages targets and WIDOCO browser path)
- [ ] Register `https://w3id.org/bsc` namespace for BSC product instances
      (presets, sessions, annotations) (PR to perma-id/w3id.org)
- [ ] Submit defensive publications for Martigli, Symmetry, and
      Martigli-Binaural to IP.com and arXiv (cs.SD)
- [~] Publish `static/ontology/sstim-core.ttl` and `sstim-vocab.ttl` at
      w3id.org/sstim with content negotiation
- [ ] WIDOCO documentation generated by GitHub Actions and deployed without
      committing generated HTML into `main`

### Community and IP protection

- [ ] File Brazilian INPI trademarks: BioSynCare, Sensory Stimulation /
      Captação Sensorial, BSC Lab (Classes 9, 41, 44)
- [ ] Add scientific advisory board page to biosyncare.com with Juliana
      and other named advisors
- [ ] Publish first web article: "Facilitating dedication with sensory
      stimulation" on biosyncare.com (personal, phenomenological, honest
      about mechanism uncertainty)
- [ ] Personal outreach to each named partner with the specific ask:
      join the BSC scientific advisory board and eventually co-found the
      W3C Community Group

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

---

## Phase 2 — Stimulation Platform
**July – November 2026**

Goal: BSC Lab becomes a working stimulation platform, not just a knowledge
browser. The W3C Community Group is launched. The open-source stimulation
player is the reference implementation that makes the consortium goal
concrete rather than abstract.

### Software: BSC Lab v0.2 (Stimulation Player)

- [ ] Pluggable audio engine: IAudioEngine interface with VanillaWebAudio
      and ToneJs implementations
- [ ] AudioWorklet processors: binaural, Martigli, Symmetry (in
      `static/worklets/`, never bundled)
- [ ] Three-clock architecture: AudioContext master, Worker scheduler,
      rAF renderer
- [ ] PixiJS v8 visual engine: breathing animation, entrainment visuals
      synchronized to AudioContext.currentTime
- [ ] Haptic engine: VibrationApi + NullHapticEngine fallback
- [ ] StimulationOrchestrator: wires all three engines via interface only
- [ ] Session player UI: play/pause/stop, duration display, preset info
- [ ] Engine selector UI: switch audio and visual engine mid-session
      (for comparison purposes — a key research feature)
- [ ] Real-time preset creator: voice editor, live audio preview, save
      to JSON and RDF
- [ ] SessionRecorder: records preset + user-defined params → complete
      reproducible session specification
- [ ] PWA: offline support for cached presets, service worker

### Software: BSC Lab v0.2 (RDF layer additions)

- [ ] RDF export pipeline: ontology instances → `dist/presets.json` for
      BioSynCare consumption
- [ ] Preset instances: current catalog v0.9.1 represented as RDF in
      `static/ontology/instances/presets/`
- [ ] SPARQL-driven preset routing: query by user need → ranked preset
      suggestions with evidence tier display
- [ ] Enhanced annotation: named graph per user/session, export as Turtle

### Community

- [ ] W3C Community Group "Sensory Stimulation Community Group" proposal
      submitted with ≥ 5 named founding members
- [ ] BSC Lab GitHub Discussions enabled: initial threads on frequency
      band taxonomy, evidence tier definitions, Sensory Stimulation definition
- [ ] First partner collaboration: ontology annotation session with at
      least one named partner (Theo Marins or Olimpia Pino most likely —
      both have neuroscience domain expertise)
- [ ] File EU trademark: BioSynCare at EUIPO (Class 9 minimum)
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
The preset catalog is available as both JSON and RDF at the public URI.

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
- [ ] WASM audio engine: Rust→WASM AudioWorklet processors for Martigli
      and Symmetry (better precision, fewer GC stalls)
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
| RDF loader + N3.js store | 1 | Yes |
| SPARQL browser + evidence chain view | 1 | Yes |
| Cytoscape.js ontology graph | 1 | Yes |
| Basic annotation (IndexedDB) | 1 | Yes |
| AudioWorklet stimulation engine | 2 | Not yet |
| PixiJS visual engine | 2 | Not yet |
| Real-time preset creator | 2 | Not yet |
| Session recorder | 2 | Not yet |
| WASM audio processors | 3 | Not yet |
| User feedback / self-report collection | 3 | Not yet |
| Session data export pipeline | 3 | Not yet |
| Multi-user annotation (server-side) | 3 | Not yet |

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

*Last updated: April 2026 — Renato Fabbri*
