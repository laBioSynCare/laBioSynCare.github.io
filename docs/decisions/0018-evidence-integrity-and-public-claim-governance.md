# ADR 0018 — Evidence integrity and public-claim governance

**Status:** Accepted - 2026-06-30; strengthened 2026-07-10

## Context

External review (2026-06) identified over-claiming as the project's dominant risk
and found two concrete openings in SSTIM that let it pass unnoticed:

1. **`EvidenceClaimShape` required no citation.** It enforced a tier and a modality
   tag but not a `citesReference`, so a claim could assert *any* tier with zero
   backing — exactly what lets unsupported claims validate.
2. **No machine-checked public-claim ceiling.** Nothing expressed that a
   public-facing claim (descriptive → wellness → structure/function → medical →
   quantified) may not exceed what its evidence supports. The two regulatory
   vectors are independent: medical-device intended-purpose (EU MDR Art. 2) and
   misleading advertising (UCPD/FTC); a claim must clear both.

SSTIM cannot give legal sign-off, but it *can* make over-claiming a **validation
failure**. The governing invariant already holds in the model: evidence attaches
to *technique × modality × outcome × population × protocol* (`supportsRelation` +
`hasModalityTag` + `studyPopulation` + `comparator` + `evidenceOutcome`), never to
"sensory stimulation" globally.

## Decision

**P7.1 — Conditional citation requirement.** Add a `sh:SPARQLConstraint` to
`EvidenceClaimShape`: a claim whose tier has `tierRank ≥ 3` (preliminary or
stronger) must declare at least one `sstim:citesReference`. A blanket requirement
was rejected — the ~30 `ExposureEffectClaim` hypotheses are legitimately uncited at
`tierSpeculative`. Speculative/anecdotal (rank 1–2) stay citation-free; the
empirical tiers do not. Verified to pass against all current data and to fire on a
tier-preliminary uncited claim.

**P7.2 — Public-claim-level taxonomy + legality.**

- Add `sstim:PublicClaimLevel` (class) and the `sstim-v:PublicClaimLevelScheme`
  SKOS scheme with six dual-typed levels: **C0** descriptive, **C1**
  experiential-hedged, **C2** wellness-general, **C3** structure/function, **C4**
  medical/condition, **C5** quantified/superiority.
- Each level carries `sstim:claimLevelRank` (0–5) and `sstim:requiresEvidenceTierRank`
  — the minimum supporting `tierRank` to assert publicly. Default mapping:
  C0/C1/C2 = 0 (no evidence needed); C3 = 4 (moderate); C5 = 5 (strong/RCT);
  **C4 = 7**, an intentional sentinel above the maximum tier (6) meaning *no
  evidence tier makes it publicly assertable*.
- Add `sstim:hasPublicClaimLevel` (functional, `Preset → PublicClaimLevel`).
- Add a `sh:SPARQLConstraint` to `PresetShape`: a preset whose declared level has
  `requiresEvidenceTierRank ≥ 1` must have a supporting `EvidenceClaim`
  (`supportsRelation`) at a tier meeting that rank. C4 therefore always fails;
  C5 needs strong evidence; C0–C2 need none. Verified to fire on a C4 preset.

The mapping is a **provisional risk-reduction default**, not legal sign-off. It is
flagged in the RDF (`requiresEvidenceTierRank` definition, the scheme header) for
**reconciliation with the BioSynCare Reference's `publicClaimLevel` /
`clinicalScope` / `marketScope` enum** and a qualified EU MDR adviser before
launch. The SSTIM-canonical scheme lands first; the Reference aligns to it.

**P7.3 - Required review and provenance record (0.6.0).** Every
`EvidenceClaim` now requires an explicit claim direction, review status, evidence
review date, `dct:modified`, and an IRI-valued `prov:wasAttributedTo` agent. A
claim must identify its subject through `supportsRelation`, or, for an
`ExposureEffectClaim`, through `concernsEffectDimension`. This separates a
claim's content from responsibility for its current editorial assessment and
makes stale or anonymous tier assignments fail validation.

## Alternatives considered

- **Blanket `citesReference minCount 1`** (the reviewers' one-liner). Rejected: it
  breaks every legitimately-uncited speculative hypothesis. The conditional
  tier-gated form is the correct hardening.
- **Put claim governance only in the (closed) BioSynCare Reference.** Rejected: the
  C0–C5 ladder is vendor-neutral and reusable; it belongs in the open ontology so
  any implementation can validate against it. The Reference reconciles to it.
- **A boolean "publicly assertable" flag for C4** instead of the sentinel 7.
  Rejected: a single numeric `requiresEvidenceTierRank` keeps one comparison in the
  SHACL and lets the sentinel express "unreachable" uniformly.
- **Domain `EvidenceClaim` for `hasPublicClaimLevel`.** Rejected: the public-claim
  ceiling is a property of the *product/preset's* user-facing copy, gated by the
  evidence that supports it; `Preset` is the right subject.

## Consequences

- Published measurable-response claims cite public-safe references; exploratory
  exposure claims remain speculative, inconclusive, and provisional. Every
  claim now carries an accountable agent and review date.
- Over-claiming is now a CI failure: a tier-3+ claim without a citation, or a
  preset promising above its evidence (C4 ever, C5 without strong evidence), fails
  `make validate` and cannot merge.
- The provisional level↔tier mapping is the one piece needing maintainer/legal
  input; everything else is settled and enforced.
- Out of SSTIM scope (product/legal): crisis-routing/duty-of-care copy, the
  condition-claim (suicidality/migraine/pain) quarantine, removing
  "neuromodulation"/"device" from marketing, GDPR/pilot documents.

## See also

- [ADR 0013](0013-evidence-support-relation-range.md) — the `supportsRelation`
  range this builds on.
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P7.
- [`docs/concept/EVIDENCE_FRAMEWORK.md`](../concept/EVIDENCE_FRAMEWORK.md) — the six evidence tiers the mapping uses.
