# ADR 0027 — Evidence-claim family split, review provenance, and a strict public-claim gate

**Status:** Proposed — 2026-07-13

Amends [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md)
(evidence integrity and public-claim governance). Supersedes the property
naming of [ADR 0013](0013-evidence-support-relation-range.md) while keeping
its range decision. Implements the semantic core of change set D in the
[RDF improvement plan](../ontology/IMPROVEMENT_PLAN.md), resolving audit
findings [KR-04, KR-06, and KR-11](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md).

## Context

`sstim:EvidenceClaim` is currently one class family carrying four different
kinds of statement:

1. **Literature assessments** — the 38 curated claims in
   `instances/evidence/` with tier, direction, review status, and dates.
2. **Hypotheses / research questions** — `sstim-ex:ExposureEffectClaim`
   (⊑ `EvidenceClaim`) instances that record only "how does this delivery
   relate to calm/arousal?", typed as tier-speculative claims.
3. **Safety-boundary statements** — the photosensitivity flash-rate boundary
   exported as a "speculative evidence claim" although it is an applicability
   statement about a limit, not an evidential finding.
4. **(Planned) participant observations** — phase 2 of the improvement plan
   adds session reports, which must never read as evidence.

This overload produces concrete defects:

- `sstim-sh:ExposureProfileShape` requires `hasEffectClaim ≥ 1`, so the
  Sensory Field exporter **manufactures** a generic calm/arousal claim for
  every profile, even a pure delivery description (KR-01/KR-06).
- The public-claim authorization gate (`sstim-shapes.ttl:210-226`) accepts
  *any* claim at a sufficient tier: a **refuting** high-tier claim, a claim
  about an irrelevant modality, a provisional or stale review, or an uncited
  universal-absence claim can all authorize public copy (KR-04).
- `sstim:supportsRelation` names a direction ("supports") while carrying
  refuting and inconclusive claims — the subject link and the direction are
  conflated in the name (KR-04, KR-11).
- `sstim-v:EvidenceModalityScheme` mixes sensory modalities (AUD, VIS, AV,
  TACTILE) with study/source types (PRECLINICAL, REVIEW), so one tag slot
  answers two different questions (KR-11).
- `sstim-v:reviewReviewed` is defined as "independently reviewed" while every
  current assessment names "BSC Lab editorial" / the maintainer — the data
  cannot satisfy the definition (KR-11).

## Decision

1. **Split the family by epistemic role.** Four distinct kinds, only the
   first of which is evidence:

   | Class | Superclass | Role | Can authorize public copy? |
   |---|---|---|---|
   | `sstim:EvidenceAssessment` | `sstim:EvidenceClaim` | Reviewed assessment of external evidence about a subject | yes, under the gate below |
   | `sstim:ExposureHypothesis` | `iao:0000030` (not `EvidenceClaim`) | Stated, testable expectation or research question about a delivery configuration | never |
   | `sstim:SafetyBoundaryApplicability` | `iao:0000030` (not `EvidenceClaim`) | Statement that a comfort boundary / exposure limit applies to a configuration, with rationale | never |
   | `sstim:Observation` (phase 2) | `iao:0000030` (not `EvidenceClaim`) | A participant- or instrument-reported value from a session | never |

   `sstim:EvidenceClaim` remains only as the deprecated abstract superclass
   of `EvidenceAssessment` so existing consumer queries keep resolving for
   literature assessments; direct instantiation is deprecated. The 38
   curated instances retype to `EvidenceAssessment` in the same change set.
   `sstim-ex:ExposureEffectClaim` is deprecated; its runtime uses migrate to
   `ExposureHypothesis`, and the photosensitivity boundary statement becomes
   a `SafetyBoundaryApplicability`.

2. **Stop requiring an effect claim on every exposure profile.**
   `ExposureProfileShape` drops `hasEffectClaim minCount 1`. A delivery
   record with no hypothesis carries no hypothesis. New optional links:
   `sstim-ex:hasHypothesis` (profile/protocol → `ExposureHypothesis`) and
   `sstim-ex:hasSafetyApplicability` (profile/channel →
   `SafetyBoundaryApplicability`). The Sensory Field exporter stops
   manufacturing the calm/arousal claim; its golden SHACL suite then moves
   toward strict conformance.

3. **Neutral subject relation.** `sstim:aboutSubject` replaces
   `sstim:supportsRelation` as the subject link on all four kinds, keeping
   ADR 0013's range (Preset ∪ Technique, SHACL-enforced). Direction stays
   exclusively in `sstim:hasClaimDirection`. `supportsRelation` is kept for
   one release as a deprecated subproperty of `aboutSubject`; curated
   instances migrate immediately.

4. **Separate modality from study design.** `PRECLINICAL` and `REVIEW`
   leave `EvidenceModalityScheme`, which becomes purely a delivery/sensory
   axis. A new `sstim:StudyDesign` SKOS scheme (e.g. preclinical,
   case-report, observational, small-controlled-trial, rct,
   systematic-review) attaches to assessments via `sstim:hasStudyDesign`.
   Claims currently tagged `PRECLINICAL`/`REVIEW` migrate their tag to the
   new axis and keep (or gain) a genuine sensory modality tag.

5. **Review provenance becomes a PROV activity.** New
   `sstim:ReviewActivity ⊑ prov:Activity` with: the assessing agent as an
   IRI (`prov:wasAssociatedWith`), rubric and rubric version, end time,
   decision, and an explicit `sstim:independentReview xsd:boolean`.
   Assessments link via `sstim:reviewedIn`. The `reviewedBy` string literal
   is deprecated in favour of agent IRIs. `sstim-v:reviewReviewed` is
   redefined as "reviewed under a recorded review activity" — independence
   is a property of the activity, not implied by the status value, so the
   current editorial reviews become accurately representable
   (`independentReview false`) instead of quietly overclaiming.

6. **Absence and refutation discipline.** An assessment asserting that no
   evidence or mechanism exists must carry at least one `citesReference` or
   a reproducible `sstim:searchRecord` (sources, query, date). Without one,
   the statement must be recorded as "not assessed in SSTIM" (a knowledge
   status), not as a refuting assessment.

7. **Strict public-claim gate.** The SPARQL constraint is rewritten so a
   claim level with `requiresEvidenceTierRank ≥ 1` is satisfiable only by a
   node that is **all** of:

   - an `sstim:EvidenceAssessment` (hypotheses, observations, and safety
     statements never match, regardless of tier);
   - `aboutSubject` the preset under validation;
   - `hasClaimDirection sstim-v:claimSupports`;
   - at or above the required `tierRank`;
   - `hasReviewStatus sstim-v:reviewReviewed` (a `reviewNeedsUpdate`
     assessment never authorizes);
   - modality-compatible: its modality tag is `GENERAL` or matches one of
     the preset's delivery modalities; and
   - backed by at least one `citesReference` resolving to a
     `PublicSafeReference` present in the graph.

   Population/context compatibility cannot yet be formalized; it remains
   recorded (`studyPopulation`) and manually reviewed, and is named as an
   explicit residual risk until phase 4 adds a population/context model.
   The change set must include adversarial negative fixtures: a high-tier
   refuting assessment, a mismatched modality, a provisional review, a
   dangling citation, and a hypothesis typed at high tier — none may
   authorize public copy.

8. **One synchronized change set.** OWL terms, SKOS values, SHACL shapes,
   JSON-LD context, curated instance migration, exporter changes, browser
   labels, quality-audit count updates, `CLAUDE.md` §5.3 example queries
   (which use `supportsRelation` today), `EVIDENCE_FRAMEWORK.md`, and
   migration notes land together under change set D, gated by the existing
   validation suite plus the new negative fixtures. Protected files are
   edited only after this ADR is accepted.

## Alternatives considered

- **Keep one class and add a "claim kind" property.** Rejected: gates and
  queries must fail closed on `rdf:type`; a flag invites the same silent
  misclassification this ADR removes.
- **Keep requiring an effect claim per exposure profile.** Rejected: it is
  the direct cause of manufactured evidence in the runtime exporter.
- **Adopt SEPIO/OBI evidence modeling wholesale.** Deferred: it would pull a
  heavy import closure into a browser-loaded graph; instead the new classes
  stay locally defined with external alignment left to the mapping layer.
- **Rename `sstim:EvidenceClaim` away entirely.** Rejected for citability:
  0.6.0 consumers keep a working (deprecated) superclass; churn is limited
  to one release of dual-reading.
- **Reuse `dct:subject` instead of minting `sstim:aboutSubject`.** Rejected:
  the subject link carries a SHACL-enforced domain-specific range
  (ADR 0013) that general DCTERMS reuse would blur.

## Consequences

- The Sensory Field exporter can finally be made truthful *and* conformant:
  delivery-only profiles validate without invented claims, and the KR-01
  golden suite flips to a strict conformance assertion.
- Public-claim authorization becomes evidence-shaped instead of
  tier-shaped; several currently latent misauthorization paths close.
- Consumers filtering on `EvidenceClaim` keep finding literature
  assessments during the deprecation window but must migrate to
  `EvidenceAssessment` / `aboutSubject` before the aliases are dropped.
- The review model admits what the project actually has today — accountable
  editorial review — without overclaiming independence, and gives external
  reviewers a first-class place to appear.
- Modality queries stop returning study-design tags; downstream code using
  `PRECLINICAL`/`REVIEW` notations must switch to `hasStudyDesign`.

## Acceptance gates

Move to **Accepted** when the maintainer confirms:

1. the four-way split and the rule that only `EvidenceAssessment` can ever
   authorize public copy;
2. the `aboutSubject` rename with a one-release deprecated alias;
3. the gate conditions in decision 7, including the residual
   population-compatibility risk; and
4. the review-provenance model, including recording current reviews as
   non-independent editorial activities.

## See also

- [ADR 0013](0013-evidence-support-relation-range.md) — original subject-relation range.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — evidence integrity and public-claim posture.
- [ADR 0025](0025-hed-bids-interoperability-crosswalk.md) — observations-not-conclusions session posture this ADR protects.
- [RDF audit 2026-07-13](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md) — findings KR-04, KR-06, KR-11.
- [Improvement plan](../ontology/IMPROVEMENT_PLAN.md) — change set D and phase 1.2.
