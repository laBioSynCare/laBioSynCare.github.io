# ADR 0025 — SSTIM ↔ HED/BIDS: align as a crosswalk, do not subordinate

**Status:** Proposed — 2026-07-12 *(awaiting review; drafted from the ecosystem-integration analysis, see [`../ecosystem/ECOSYSTEM_INTEGRATION.md`](../ecosystem/ECOSYSTEM_INTEGRATION.md) Workstream 2)*

## Context

SSTIM has technical readiness but not yet ecosystem legitimacy: nobody adopts a
vocabulary merely because it exists — they adopt it when it solves a concrete
problem (reproducibility, protocol comparison, machine-actionable methods,
exposure/safety recording, evidence-to-implementation links). The strongest
adjacent structures in neuroscience data standards are already mature and
INCF-endorsed:

- **BIDS** (Brain Imaging Data Structure) — folder + metadata standard for
  neuroscience datasets (MRI/EEG/MEG/PET/behavioral); models onset, duration,
  and run structure via `events.tsv`.
- **HED** (Hierarchical Event Descriptors) — controlled vocabulary for *what
  occurred* during an experiment (a flash, a tone, a button press). INCF-endorsed,
  with an open schema-development process for community library vocabularies.
- **INCF** — standards-review / adoption body; endorses HED and BIDS.

None of these deeply models the **stimulation** itself: technique, signal
construction, modulation, device, exposure boundaries, evidence claims, cautions,
protocol, and session-level relationships. That is exactly SSTIM's layer, and
BSC Lab can *execute* the stimulus and *export* the metadata. The question this
ADR settles is the **posture**: does SSTIM replace HED, subordinate itself to
HED, or align alongside it — and through which channel does adoption happen?

This mirrors the OBO-posture reasoning already recorded in
[ADR 0016](0016-publication-obo-posture-and-registries.md) (interoperate first,
seek membership only after demonstrated external use).

## Decision

1. **Align as a crosswalk, do not subordinate.** Build a
   **SSTIM ↔ HED/BIDS interoperability profile**: a documented mapping plus one
   end-to-end worked example. SSTIM keeps its own IRIs, governance (the W3C CG,
   [ADR 0007](0007-framework-protocol-implementation.md)), and layer. HED/BIDS/INCF
   are **alignment partners, recruitment pools, and adoption channels — not
   SSTIM's governing home.**
2. **Do not replace HED and do not fork a competing HED library now.** A
   dedicated HED library vocabulary is a *later*, evidence-of-adoption-gated move
   (same discipline as ADR 0016 decision 2/3 for OBO). Lead with the crosswalk.
3. **Division of labor (the demonstrator).** Export one session as four
   coordinated representations:

   | Function | Representation | Owner |
   |---|---|---|
   | Onset, duration, run structure | BIDS `events.tsv` | BIDS |
   | Experimental event meaning | HED annotations | HED |
   | Technique, waveform, modulation, device, exposure, evidence, safety | SSTIM RDF / JSON-LD | **SSTIM** |
   | Executable stimulus | BSC Lab patch / protocol | **BSC Lab** |

4. **Build on what exists, mint nothing new in the term space yet.** The
   demonstrator reuses the [Sensory Field](../technical/SENSORY_FIELD.md)
   `sstim-ex:ExposureProfile` export and the [Patch Studio](../technical/PATCH_STUDIO.md)
   patch export. The mapping is expressed as a **crosswalk artifact** (a
   documented field map, and where RDF is warranted `skos:closeMatch` /
   `skos:exactMatch` links), **not** by minting HED/BIDS-shaped SSTIM classes.
   Any `.ttl` expression of the mapping is a follow-up gated by `CLAUDE.md`
   §3.4/§8 (no auto-authoring of ontology modules).
5. **Adoption channel: the HED schema-development process (INCF-endorsed),** not
   OBO. Publish one reviewed SSTIM–HED/BIDS example and request review from the
   HED Working Group. OBO/BioPortal/FAIRsharing remain publication/discovery
   infrastructure (ADR 0016), not the social/scientific home.
6. **The ask is "encode/reproduce," never "endorse."** External labs are asked to
   nominate one protocol each to encode across the four representations — not to
   validate BSC or endorse any health claim (consistent with
   [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md), ADR 0024,
   and `CLAUDE.md` §3.5).

## Alternatives considered

- **Replace HED with SSTIM.** Rejected — HED is mature, INCF-endorsed, and models
  a different thing (experimental events, not stimulation technique). Competing
  head-on wastes credibility.
- **Subordinate SSTIM as a HED sub-library.** Rejected — collapses SSTIM's
  technique/protocol/evidence/exposure layer and surrenders governance neutrality
  (the W3C CG, ADR 0007). Interoperate, do not merge.
- **Fork a competing HED library vocabulary immediately.** Rejected *now* — do it
  only after demonstrated external use, exactly as ADR 0016 gates OBO membership.
- **Publish to OBO/BioPortal first as the adoption move.** Rejected — those are
  discovery infrastructure; adoption comes from solving one lab's reproducibility
  problem via the crosswalk, then routing through the HED process.

## Consequences

- Produces two concrete artifacts: the crosswalk mapping
  ([`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md)) and one
  worked example dataset (one BSC Lab session → BIDS + HED + SSTIM + patch).
- Gives HED researchers, neuroimaging labs, and ontology reviewers a concrete
  reason to engage; becomes the invitation into the W3C CG rather than a reason to
  subordinate SSTIM.
- Any published example must carry no medical/therapeutic claims and must not
  hard-code drifting live figures (`CLAUDE.md` §3.5; ADR 0018).
- An RDF form of the mapping (SKOS mapping properties, a JSON-LD context) is a
  follow-up requiring explicit go-ahead per the protected-file policy
  ([ADR 0004](0004-protected-ontology-files.md), `CLAUDE.md` §3.4).

## See also

- [`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) — the crosswalk strategy + field map.
- [`../ecosystem/ECOSYSTEM_INTEGRATION.md`](../ecosystem/ECOSYSTEM_INTEGRATION.md) — Workstream 2 tracker.
- [ADR 0007](0007-framework-protocol-implementation.md) — framework / implementation separation and governance.
- [ADR 0016](0016-publication-obo-posture-and-registries.md) — the parallel "interoperate first, membership later" posture.
- [ADR 0024](0024-stakeholder-ecosystem-modeling.md) — recording the labs/people engaged through this channel.
