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
model, `patch-studio-model-1`) · [`SENSORY_FIELD.md`](technical/SENSORY_FIELD.md)
(the `/field/` instrument) ·
[`PHOTOSENSITIVITY_SAFETY.md`](technical/PHOTOSENSITIVITY_SAFETY.md) (advisory,
policy, flash-rate cap) · [`PWA_SERVICE_WORKER.md`](technical/PWA_SERVICE_WORKER.md)
(caching, the three traps, compliance matrix) ·
[`SESSION_PACKAGE.md`](technical/SESSION_PACKAGE.md) (a patch as a portable
scientific object) · [`PRIVATE_SYNC.md`](technical/PRIVATE_SYNC.md)
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
ADR 0011 while the series ran past 0045.

## `ontology/` — plans and reviews

[`ontology/CURRENT_STATE.md`](ontology/CURRENT_STATE.md) is the maintained
current-state and next-steps summary. [`ontology/README.md`](ontology/README.md)
indexes the module architecture, improvement and publication plans, registry
submissions, and the dated audits.
Ontology design itself is documented at
[`../static/ontology/README.md`](../static/ontology/README.md).

## `ecosystem/` — IP, governance, outreach

- [`ECOSYSTEM_INTEGRATION.md`](ecosystem/ECOSYSTEM_INTEGRATION.md) — **living
  tracker** across the five workstreams. Start here for outreach and positioning.
- [`OUTREACH_TARGETS.md`](ecosystem/OUTREACH_TARGETS.md) — prospective labs, orgs,
  standards bodies and events, with the ask per target, the 90-day sequence, KPIs,
  and a consent-governed log
  ([ADR 0024](decisions/0024-stakeholder-ecosystem-modeling.md)).
- [`ECOSYSTEM_OPERATIONS.md`](ecosystem/ECOSYSTEM_OPERATIONS.md) — running the
  consent-gated publication pipeline.
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
