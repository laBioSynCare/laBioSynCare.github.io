# docs — BSC Lab Reference Documents

Narrative and technical specifications. The ontology's machine-readable form
lives in [`../static/ontology/`](../static/ontology/); this directory holds the
prose that justifies and explains it.

Each technical document is **as-built** (describes shipped code) or **target**
(a design the code is growing toward), stated in its own opening banner. When
the two disagree, the code and the as-built docs win.

## `concept/` — what the domain is and what we claim

- [`SENSORY_STIMULATION.md`](concept/SENSORY_STIMULATION.md) — defines the term
  and grounds the first ontology classes.
- [`SCOPE.md`](concept/SCOPE.md) — what BSC Lab claims and does not. Load-bearing
  for every user-facing string; see `CLAUDE.md` §3.5.
- [`NON_SCOPE.md`](concept/NON_SCOPE.md) — what is out of scope for the project
  and the W3C Community Group.
- [`EVIDENCE_FRAMEWORK.md`](concept/EVIDENCE_FRAMEWORK.md) — the six-tier
  evidence system.
- [`FACILITATING_DEDICATION.md`](concept/FACILITATING_DEDICATION.md) — the
  primary validated use case.
- [`SSTIM_LLM_COMPLEMENTARITY.md`](concept/SSTIM_LLM_COMPLEMENTARITY.md) — how
  symbolic SSTIM and LLMs complement each other, and the recommended public
  wording for saying so without overclaiming.

## `technical/` — specifications

**As-built.** [`PATCH_STUDIO.md`](technical/PATCH_STUDIO.md) (the live authoring
model, `patch-studio-model-3`, with model-1 and model-2 import) · [`SENSORY_FIELD.md`](technical/SENSORY_FIELD.md)
(legacy Field contracts, adapters, starters, and `/field/*` redirects) ·
[`PHOTOSENSITIVITY_SAFETY.md`](technical/PHOTOSENSITIVITY_SAFETY.md) (advisory,
policy, flash-rate cap) · [`PWA_SERVICE_WORKER.md`](technical/PWA_SERVICE_WORKER.md)
(caching, the three traps, compliance matrix) ·
[`SESSION_PACKAGE.md`](technical/SESSION_PACKAGE.md) (a patch as a portable
scientific object) · [`EQUIPMENT_CHECK.md`](technical/EQUIPMENT_CHECK.md)
(design: what the delivery chain can reproduce, asserted as
`sstim-ex:DeviceCapability`) · [`PRIVATE_SYNC.md`](technical/PRIVATE_SYNC.md)
(`bsc-lab-private-sync-1`) · [`PORTABLE_DEPLOYMENT.md`](technical/PORTABLE_DEPLOYMENT.md)
(deployment, migration, and the remaining gaps) ·
[`PUBLIC_ENTRANCE.md`](technical/PUBLIC_ENTRANCE.md) (the landing IA, shipped
2026-07-18) · [`KNOWLEDGE_BROWSER_UX.md`](technical/KNOWLEDGE_BROWSER_UX.md)
(browser UX and its backlog).

**Contracts.** [`PRESET_FORMAT.md`](technical/PRESET_FORMAT.md) — the preset
**catalog JSON** shared with BioSynCare, distinct from the Patch Studio model
above. [`SESSION_MODEL.md`](technical/SESSION_MODEL.md) — preset vs. session
instance. Both are the source for their planned JSON Schemas.

**Target.** [`AUDIO_ENGINE_ARCHITECTURE.md`](technical/AUDIO_ENGINE_ARCHITECTURE.md)
(three-clock model, scheduler, orchestrator; as-built engines in
[`../src/engines/README.md`](../src/engines/README.md)) and
[`VISUAL_ENGINE_ARCHITECTURE.md`](technical/VISUAL_ENGINE_ARCHITECTURE.md)
(PixiJS v8 design; as-built visuals in `PATCH_STUDIO.md` §5).
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](technical/PATCH_STUDIO_FIELD_INTEGRATION.md)
tracks the partially implemented Sensory Field cutover: ordinary first-class
colour-field and spatial visual tracks, starters, compatibility routes, and the
shared visual projection stage are in place; runtime extraction, unified
exposure validation, final acceptance gates, and legacy retirement remain.
[`AGENT_AUTOMATION_BOUNDARY.md`](technical/AGENT_AUTOMATION_BOUNDARY.md) records
what a conversational agent-automation layer would have to respect if one were
ever added — nothing in it is built or on the roadmap.

**Defensive publications — do not modify** after first commit (`CLAUDE.md` §3.4):
[`BREATHING_MODEL.md`](technical/BREATHING_MODEL.md),
[`SYMMETRY_SYSTEM.md`](technical/SYMMETRY_SYSTEM.md),
[`MARTIGLI_BINAURAL.md`](technical/MARTIGLI_BINAURAL.md).

## `decisions/` — architecture decision records

Lightweight ADRs (Context, Decision, Alternatives, Consequences) capturing
non-obvious choices. **[`decisions/README.md`](decisions/README.md) holds the
index** — it is not duplicated here, because the copy that was went stale at
ADR 0011 while the series continued to grow.

[`DELIVERED.md`](DELIVERED.md) is an archive of completed `TODO.md` items —
history, not tasks. Nothing reads it during work.

## `ontology/` — plans and reviews

[`ontology/CURRENT_STATE.md`](ontology/CURRENT_STATE.md) is the maintained
current-state and next-steps summary, and
[`ontology/SSTIM_DIRECTIONS.md`](ontology/SSTIM_DIRECTIONS.md) records where the
model is going and why — waveforms, panning and modulation, protocol
namespacing, and coverage of all known senses. [`ontology/README.md`](ontology/README.md)
indexes the module architecture, improvement and publication plans, registry
submissions, and the dated audits.
Ontology design itself is documented at
[`../static/ontology/README.md`](../static/ontology/README.md).

## `gallery/` — selected captures

[`gallery/README.md`](gallery/README.md) collects original captures of BSC Lab
instruments and authored patches. Images stay beside their captions in the
gallery rather than entering the PWA's precached `static/` asset set.

## `brand/` — the isotype, and how it was derived

[`brand/README.md`](brand/README.md) holds the BSC Lab isotype exploration: the
parent mark measured off its artwork, the generator that builds every candidate
from those constants, a WCAG audit of the BSC colour system, and a link to the
full development history. The adopted mark (`marks/merge-d.svg`) is the source
of `static/favicon.svg` and `static/icons/`.

## `ecosystem/` — IP, governance, outreach

- [`ECOSYSTEM_INTEGRATION.md`](ecosystem/ECOSYSTEM_INTEGRATION.md) — **living
  tracker** across the five workstreams. Start here for outreach and positioning.
- [`OUTREACH_TARGETS.md`](ecosystem/OUTREACH_TARGETS.md) — prospective labs, orgs,
  standards bodies and events, with the ask per target, the 90-day sequence, KPIs,
  and a consent-governed log
  ([ADR 0024](decisions/0024-stakeholder-ecosystem-modeling.md)).
- [`INTERVIEW_TARGETS.md`](ecosystem/INTERVIEW_TARGETS.md) — who to interview and
  why, scored on two axes (ontology gap, scientific/strategic), with the measured
  modality-coverage baseline that ranks them and the Track A / Track B boundary
  that keeps SSTIM contribution separate from BioSynCare product discovery.
- [`INTERVIEW_PROTOCOL.md`](ecosystem/INTERVIEW_PROTOCOL.md) — the five separate
  consents, the relationship types, review-before-publication, and withdrawal
  handling, written against the controlled values in `sstim-ecosystem.ttl`
  ([ADR 0024](decisions/0024-stakeholder-ecosystem-modeling.md),
  [ADR 0031](decisions/0031-qualified-ecosystem-records.md)).
- [`ECOSYSTEM_OPERATIONS.md`](ecosystem/ECOSYSTEM_OPERATIONS.md) — running the
  consent-gated publication pipeline.
- [`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md)
  — separates public SSTIM conformance from optional, version-pinned BSC catalog
  compatibility and gives the coalition decision gates.
- [`HED_BIDS_INTEROP.md`](ecosystem/HED_BIDS_INTEROP.md) — SSTIM ↔ HED event
  profile and optional BIDS/NWB bindings
  ([ADR 0025](decisions/0025-hed-bids-interoperability-crosswalk.md)).
- [`IP_STRATEGY.md`](ecosystem/IP_STRATEGY.md) and
  [`DEFENSIVE_PUBLICATIONS.md`](ecosystem/DEFENSIVE_PUBLICATIONS.md) —
  publication-first over patents, plus the filing tracker.
- [`w3id/README.md`](ecosystem/w3id/README.md) — how the persistent-namespace
  targets are generated and guarded; the route contract itself is in
  [`w3id/sstim/README.md`](ecosystem/w3id/sstim/README.md).
- W3C Community Group — **launched, charter not yet ratified**.
  [`CHARTER.md`](../CHARTER.md) is the live instrument and owns the
  status-discipline wording;
  [`W3C_COMMUNITY_GROUP_PROPOSAL.md`](ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md)
  is the submitted proposal, kept as a record and not updated.
  Outreach: [`INVITATION_TEMPLATE.md`](ecosystem/INVITATION_TEMPLATE.md),
  [`CONSORTIUM_INVITATION.md`](ecosystem/CONSORTIUM_INVITATION.md).
  People: [`ADVISORY_BOARD.md`](ecosystem/ADVISORY_BOARD.md) (**the source of
  truth for advisory consent state**), [`PARTNERS.md`](ecosystem/PARTNERS.md).

## Alongside the code

[`../src/README.md`](../src/README.md) (architecture) ·
[`../src/engines/README.md`](../src/engines/README.md) (the four audio engines) ·
[`../src/rdf/README.md`](../src/rdf/README.md) ·
[`../src/ui/README.md`](../src/ui/README.md) ·
[`../src/core/README.md`](../src/core/README.md) (planned).

`docs/credentials/` and `docs/funding/` are gitignored working directories and
are not part of the published documentation.
