# ADR 0030 — Recording recognized named sensory-stimulation methods and schools

**Status:** Proposed — 2026-07-14

Records a **content and modeling gap**, not yet a ratified decision. It exists so
the gap is tracked and the modeling question is framed before anyone adds the
first named method. Implementation touches the protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4) and therefore
needs explicit maintainer approval, exactly like [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md).

## Context

SSTIM catalogues **mechanistic techniques** — 30 vendor-neutral
`sstim-v:tech…` concepts (binaural/monaural beats, isochronic tones, photic
driving, vibrotactile/audiovisual entrainment, broadband noise, notched sound,
vibroacoustic, spatial auditory, ASMR, …) — and one governing **framework**
(`bsc`). It does **not** record the recognized, externally **named methods or
schools** that practitioners, the public, and the literature actually refer to:

- **Snoezelen / multisensory environment (MSE)** — controlled multisensory rooms;
- **Tomatis Method** and **Bérard Auditory Integration Training** — filtered/gated
  "listening" methods;
- **Ayres Sensory Integration therapy**;
- **audiovisual entrainment / "mind machines"** (partly covered by
  `techAudiovisualEntrainment`, but the tradition is broader);
- **vibroacoustic therapy (VAT)** as a method (distinct from the `techVibroacoustic`
  building block);
- **sound baths / gong baths**, structured **music therapy**, and consumer
  **"brainwave" / Solfeggio** programs (some techniques exist; the branded
  methods do not).

A search of the ontology, instances, and docs on 2026-07-14 confirmed none of
these named methods are present. This matters because:

1. **Discoverability / interoperability.** External partners and users search by
   method name ("does SSTIM cover Snoezelen?"), not by mechanism. Named methods
   are the natural bridge to Wikidata, clinical literature, and outreach.
2. **Evidence hygiene.** Several of these carry strong marketing claims and
   contested or absent controlled evidence (Tomatis and AIT especially). Having
   a neutral, evidence-scoped home for them lets SSTIM represent them *honestly*
   rather than leaving the vacuum to be filled by promotional framing.

## The modeling question (the thing to decide)

A named method/school is **not** a single mechanistic technique (it composes
several), and it is broader than a parametrized `SensoryStimulationProtocol`
(which requires a `definedByFramework` and encodes specific timing/parameters).
The candidate homes:

- **Option A — reuse `SensoryStimulationFramework`.** Snoezelen/Tomatis become
  peer framework instances alongside `bsc`. *Pro:* no new class; the framework
  definition ("a family of principles, techniques, protocols, evidence rules,
  design constraints") genuinely fits. *Con:* the class currently connotes
  "BSC's governing framework" (the `bsc-fw:` namespace); external schools would
  need a neutral instance path and would dilute that connotation.
- **Option B — model each as a `SensoryStimulationProtocol`.** *Con:* a school is
  a tradition, not one method spec, and protocols require a defining framework —
  a school is not "under" BSC.
- **Option C (recommended) — a dedicated catalogue of named methods.** Introduce
  a `sstim:NamedStimulationMethod` information-artifact class and a SKOS scheme
  of recognized externally-named approaches, each: (a) linked to the vendor-
  neutral techniques it employs via a new `sstim:employsTechnique` relation;
  (b) linked to evidence via `sstim:EvidenceAssessmentClaim` and, where SSTIM has
  not assessed the literature, a corpus-scoped `KnowledgeStatusAssertion`
  (ADR 0027); (c) aligned to Wikidata only when a verified item exists
  (ADR 0016/0021 mapping discipline). *Pro:* a "recognized named tradition" is a
  distinct thing from BSC's governing framework and from a parametrized protocol;
  it gives clean, honest provenance and keeps the framework layer for governance.
  *Con:* one new class + one relation + one scheme.

## Recommendation

Adopt **Option C**. Whichever option is chosen, these invariants hold:

1. **Neutral and non-promotional.** A method is a *recognized named artifact*, not
   an endorsement. Definitions describe what the method *is* and *does*
   operationally; they carry no efficacy or health claim (CLAUDE.md §3.5,
   `SCOPE.md`).
2. **Decompose into existing techniques** where possible (`techNotchedSound`,
   `techMusicStructural`, `techVibroacoustic`, `techPhoticDriving`,
   `techSpatialAuditory`, … already exist); mint a new technique only for a
   genuinely missing mechanism (e.g. a Tomatis "electronic gating" technique).
3. **All effect claims are evidence-scoped (ADR 0027).** Expect several to sit at
   low tiers or as `unknownToSSTIM` / `noKnownEvidenceInSSTIM` corpus-scoped
   status assertions. No method definition asserts benefit.
4. **Instances are implementation/reference data**, never in the reusable term
   space beyond the class/scheme skeleton, and never in Zenodo snapshots of
   personal data (there is none here, but keep the boundary).

## Deferred

This ADR does **not** add any method yet, does not finalize the class/relation
IRIs, and does not decide the instance path. Those are settled when the ADR is
accepted and the first batch is implemented under maintainer review, together
with SHACL, context, fixtures, and Wikidata alignments — one synchronized change
set, like ADR 0027.

## Seed inventory (so we don't forget)

Snoezelen / MSE · Tomatis Method · Bérard AIT · Ayres Sensory Integration ·
audiovisual entrainment / mind-machine tradition · vibroacoustic therapy (as a
method) · sound/gong baths · structured music therapy · consumer brainwave /
Solfeggio programs. Prioritize the ones with a verified Wikidata item and real
literature (Snoezelen, Tomatis, AIT, VAT) for the first batch.

## See also

- [ADR 0007](0007-framework-protocol-implementation.md) — framework / technique / protocol / implementation / preset / session layers.
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — evidence assessments vs. non-evidence statements; corpus-scoped status assertions.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — evidence integrity and public-claim posture.
- [ADR 0016](0016-publication-obo-posture-and-registries.md) / [ADR 0021](0021-controlled-value-semantics.md) — external-alignment and controlled-value discipline.
- [`../ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — Phase 4 domain-depth backlog.
