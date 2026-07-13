# docs — BSC Lab Reference Documents

Narrative and technical specification documents. The ontology's machine-
readable form lives in [`../static/ontology/`](../static/ontology/); this directory holds
the prose that justifies and explains it.

Every document here is a BSC Lab canonical reference: assume a future AI
agent or new contributor will read the document end-to-end before editing
anything adjacent to it. Keep them self-contained.

---

Each technical document is marked as **as-built** (describes shipped code) or
**target** (a design the code is growing toward). When the two disagree, the
code and the as-built docs win; target specs carry an "implementation status"
banner pointing to the as-built reference.

## `concept/` — what the domain is and what we claim

- [`SENSORY_STIMULATION.md`](concept/SENSORY_STIMULATION.md) — defines the
  "sensory stimulation" term and grounds the first ontology classes.
- [`SCOPE.md`](concept/SCOPE.md) — what BSC Lab claims and explicitly does
  not claim. Load-bearing for every user-facing string; see `CLAUDE.md` §3.5.
- [`NON_SCOPE.md`](concept/NON_SCOPE.md) — what is explicitly out of scope for
  the project and the W3C Community Group.
- [`EVIDENCE_FRAMEWORK.md`](concept/EVIDENCE_FRAMEWORK.md) — the six-tier
  evidence system used throughout the ontology.
- [`FACILITATING_DEDICATION.md`](concept/FACILITATING_DEDICATION.md) — the
  primary validated use case narrative.
- [`SSTIM_LLM_COMPLEMENTARITY.md`](concept/SSTIM_LLM_COMPLEMENTARITY.md) —
  how SSTIM (symbolic) and LLMs complement each other: grounding, validation, and
  the example workflow. Public-wording guidance lives in
  [`ecosystem/SSTIM_LLM_MESSAGING.md`](ecosystem/SSTIM_LLM_MESSAGING.md).

## `technical/` — specifications

- [`PATCH_STUDIO.md`](technical/PATCH_STUDIO.md) — **as-built** authoring model
  for the live audiovisual designer (track types, parameters, tremolo, mixing,
  controls, tempo, `patch-studio-model-1` export).
- [`SENSORY_FIELD.md`](technical/SENSORY_FIELD.md) — **as-built** Sensory Field
  instrument (`/field/`): the per-channel matrix, static→blink→beat steps, the
  runtime flash-rate cap, and per-configuration `sstim-ex:ExposureProfile`
  emission. Step 3 (stereoscopy) outlined.
- [`PHOTOSENSITIVITY_SAFETY.md`](technical/PHOTOSENSITIVITY_SAFETY.md) —
  **as-built** photosensitivity advisory, visual-stimulation policy, and the
  flash-rate cap.
- [`PWA_SERVICE_WORKER.md`](technical/PWA_SERVICE_WORKER.md) — **as-built** PWA
  layer: web manifest, service worker, caching strategy, the three traps
  (session-safe updates, Firebase/cross-origin bypass, cache budget), the
  update flow, and the **PWA compliance matrix** (§8 — what is met, deferred,
  or excluded by design).
- [`PRESET_FORMAT.md`](technical/PRESET_FORMAT.md) — canonical preset **catalog
  JSON** format (shared with BioSynCare). Source for `schemas/preset.schema.json`
  (planned). Distinct from the Patch Studio model above.
- [`SESSION_MODEL.md`](technical/SESSION_MODEL.md) — preset vs. session
  instance distinction. Source for `schemas/session.schema.json` (planned).
- [`KNOWLEDGE_BROWSER_UX.md`](technical/KNOWLEDGE_BROWSER_UX.md) — UX design for
  the ontology graph, SPARQL, preset browser, and annotation surfaces.
- [`PUBLIC_ENTRANCE.md`](technical/PUBLIC_ENTRANCE.md) — **target** audience-first
  landing IA: 7 personas → 4 doors (Experience / Understand / Build / Join), per-door
  copy + route map, safety routing, and the two conversion actions. Source for a
  future `/` landing.
- [`OPENCLAW_AGENT_AUTOMATION_PROPOSAL.md`](technical/OPENCLAW_AGENT_AUTOMATION_PROPOSAL.md) —
  **exploratory proposal (Phase 3, not built)** for using OpenClaw as a future
  conversational agent-automation layer around SSTIM intake, routing, review
  packets, and maintainer commands. Assumes a server backend BSC Lab does not yet run.
- [`AUDIO_ENGINE_ARCHITECTURE.md`](technical/AUDIO_ENGINE_ARCHITECTURE.md) —
  **target** pluggable audio engine design (three-clock model, orchestrator).
  As-built engines: [`../src/engines/README.md`](../src/engines/README.md).
- [`VISUAL_ENGINE_ARCHITECTURE.md`](technical/VISUAL_ENGINE_ARCHITECTURE.md) —
  **target** visual engine design (PixiJS v8 default, CSS fallback). As-built
  visuals: `PATCH_STUDIO.md` §5.
- [`BREATHING_MODEL.md`](technical/BREATHING_MODEL.md) — Martigli breathing
  system specification. **Defensive publication — do not modify** after
  first commit (see `CLAUDE.md` §3.4).
- [`SYMMETRY_SYSTEM.md`](technical/SYMMETRY_SYSTEM.md) — Symmetry permutation
  system. **Defensive publication.**
- [`MARTIGLI_BINAURAL.md`](technical/MARTIGLI_BINAURAL.md) — hybrid voice
  type specification. **Defensive publication.**

## Implementation notes (alongside the code)

- [`../src/README.md`](../src/README.md) — software architecture and directory map.
- [`../src/engines/README.md`](../src/engines/README.md) — the four audio engines.
- [`../src/ui/README.md`](../src/ui/README.md), [`../src/rdf/README.md`](../src/rdf/README.md),
  [`../src/core/README.md`](../src/core/README.md) — layer-specific docs.
- [`../static/ontology/README.md`](../static/ontology/README.md) — ontology design.
- [`ontology/README.md`](ontology/README.md) — vocabulary / `sstim` notes.
- [`ontology/IMPROVEMENT_PLAN.md`](ontology/IMPROVEMENT_PLAN.md) — canonical
  ontology maturity backlog after SSTIM `0.3.0`.
- [`credentials/firebase.md`](credentials/firebase.md) — optional Firebase setup.

## `decisions/` — architecture decision records

Lightweight ADRs capturing non-obvious architectural choices with context,
alternatives, and consequences. See
[`decisions/README.md`](decisions/README.md) for the index and format.

- [0001](decisions/0001-namespace-split.md) — SSTIM-scoped instance paths.
- [0002](decisions/0002-dual-typing-owl-skos.md) — dual-typing of SKOS
  concepts and OWL classes (Pattern 2).
- [0003](decisions/0003-named-graphs-for-modules.md) — named graphs for
  runtime module isolation.
- [0004](decisions/0004-protected-ontology-files.md) — protected ontology
  files policy.
- [0005](decisions/0005-binaural-carrier-pair-only.md) — binaural beat
  parameterized as carrier pair only.
- [0006](decisions/0006-one-class-per-technique.md) — one class per
  technique; voice classes named `*Voice` (not `*VoiceSpec`).
- [0007](decisions/0007-framework-protocol-implementation.md) — framework,
  technique, protocol, implementation, preset, and session distinctions.
- [0008](decisions/0008-activitypub.md) — ActivityPub federation (no full
  federation now; phased, bridge-preferred).
- [0009](decisions/0009-pwa.md) — Progressive Web App: installable,
  offline-capable, SvelteKit-native service worker, three binding constraints.
- [0010](decisions/0010-exposure-delivery-modality.md) — exposure delivery
  medium, perceived modality, device capability, and evidence status.
- [0011](decisions/0011-sensory-field-and-flash-safety.md) — Sensory Field
  interface, runtime flash-rate safety, and exposure ontology 0.4.0.

## `ecosystem/` — IP, governance, outreach

- [`ECOSYSTEM_INTEGRATION.md`](ecosystem/ECOSYSTEM_INTEGRATION.md) — **living
  tracker** for ecosystem integration: the five workstreams (group-status
  reconciliation, HED/BIDS/INCF interoperability, outreach targets + 90-day
  sequence + KPIs, the expanded public-entrance / audience model, and the
  [ADR 0024](decisions/0024-stakeholder-ecosystem-modeling.md) stakeholder RDF
  module). Start here for outreach and positioning work.
- [`OUTREACH_TARGETS.md`](ecosystem/OUTREACH_TARGETS.md) — working registry of
  prospective labs, orgs, standards bodies, and events to engage, with the ask
  per target, the 90-day sequence, KPIs, and an outreach log (consent per
  [ADR 0024](decisions/0024-stakeholder-ecosystem-modeling.md)).
- [`HED_BIDS_INTEROP.md`](ecosystem/HED_BIDS_INTEROP.md) — SSTIM ↔ HED/BIDS
  interoperability strategy and draft field crosswalk ("align, don't subordinate";
  the four-representation demonstrator). Companion to [ADR 0025](decisions/0025-hed-bids-interoperability-crosswalk.md).
- [`IP_STRATEGY.md`](ecosystem/IP_STRATEGY.md) — defensive-publication-first
  approach over patents; trademark plan.
- [`SSTIM_LLM_MESSAGING.md`](ecosystem/SSTIM_LLM_MESSAGING.md) — recommended
  terminology and public wording for SSTIM's relationship to AI/LLMs (avoids
  overclaiming). Pairs with [`concept/SSTIM_LLM_COMPLEMENTARITY.md`](concept/SSTIM_LLM_COMPLEMENTARITY.md).
- [`DEFENSIVE_PUBLICATIONS.md`](ecosystem/DEFENSIVE_PUBLICATIONS.md) —
  filing tracker for the three technical defensive publications.
- [`w3id/README.md`](ecosystem/w3id/README.md) — staged instructions and
  redirect rules for the `https://w3id.org/sstim` persistent namespace.
- [`CHARTER.md`](../CHARTER.md) (repo root) — draft charter for the W3C Sensory
  Stimulation Vocabulary Community Group (launched; charter not yet ratified).
- [`W3C_COMMUNITY_GROUP_PROPOSAL.md`](ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md) —
  full proposal description, problem statement, deliverables, and submission
  checklist.
- [`INVITATION_TEMPLATE.md`](ecosystem/INVITATION_TEMPLATE.md) — outreach
  template for inviting supporters of the Community Group proposal.
- [`ADVISORY_BOARD.md`](ecosystem/ADVISORY_BOARD.md) — named members and
  roles.
- [`PARTNERS.md`](ecosystem/PARTNERS.md) — named partners with interest
  letters.
- [`CONSORTIUM_INVITATION.md`](ecosystem/CONSORTIUM_INVITATION.md) — outreach
  template for academic and industry partners.
