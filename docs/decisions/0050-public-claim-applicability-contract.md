# ADR 0050 — The public-claim applicability contract

**Status:** Accepted — 2026-08-15 · implemented 2026-08-15

## Context

The [2026-07-13 audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
raised KR-04: *"the public-claim authorization query can approve the wrong
evidence."*

The constraint it names sits on `sstim-sh:BscCatalogPresetShape` and asked exactly one
question. Given a preset whose public claim level requires evidence
(`sstim:requiresEvidenceTierRank >= 1`), does *some* claim exist that points at
the preset through `sstim:supportsRelation` and carries a tier whose rank meets
the requirement?

That question has the right shape and almost none of the right content. Five
things satisfy it that must not:

1. **A refutation.** `sstim:supportsRelation` reads as though it encodes
   support, which is exactly why ADR 0027 deprecated it in favour of the neutral
   `sstim:evaluatesSubject` and moved direction to `sstim:hasClaimDirection`. The
   gate was never updated. A rigorous, well-powered trial concluding the preset
   does *nothing* is an `EvidenceAssessmentClaim` at a high tier pointing at the
   preset — it authorized the public claim it disproved.
2. **An assessment of something else.** Nothing tied the claim's bounded
   proposition or its assessment scope to the preset. A claim registered against
   preset A whose proposition was about oscillation B satisfied the gate for A.
3. **Evidence from another modality.** A somatosensory finding authorized an
   auditory preset, because modality never entered the query.
4. **Unreviewed or withdrawn evidence.** A claim drafted five minutes ago,
   rejected in review, or explicitly superseded counted the same as a confirmed
   current one.
5. **A borrowed citation.** `sstim:citesReference` was not consulted at all, so a
   claim could be decorated with a prestigious reference no basis of the
   assessment ever used.

The audit's disposition is explicit: *"define an explicit applicability contract
and require all of direction, subject, modality, population/context
compatibility, review state, currency, and citation integrity before evidence
can authorize a public claim. Add adversarial negative fixtures."*

Two facts about the current state shape what follows.

**The gate has never fired.** Both committed presets sit at `claimC1Experiential`,
whose `requiresEvidenceTierRank` is 0, so the `?req >= 1` guard excludes them.
Every version of this constraint — the weak one and the strong one — is vacuous
on today's data. Nothing that only checks committed instances can tell them
apart.

**Modality is derivable, but only indirectly.** A preset carries no modality
property. It does carry `sstim:followsProtocol`, protocols carry
`sstim:usesTechnique`, and techniques carry `sstim:techniqueModality`. That
three-hop path is populated for both seed presets and is the only honest answer
to "what does this preset deliver".

## Decision

Replace the single-clause gate with an explicit **applicability contract**: a
conjunction of eight clauses, all of which one assessment must satisfy for it to
authorize the preset's public claim level. Satisfaction by different assessments
in combination does not count — the query binds one `?claim`.

| Clause | Requirement |
|---|---|
| Direction | `sstim:hasClaimDirection` is `sstim-v:claimSupports`. Refuting, mixed and inconclusive assessments authorize nothing. |
| Strength | The claim's tier rank is at least the level's `requiresEvidenceTierRank`. Unchanged from the original gate. |
| Subject | The claim `sstim:evaluatesSubject` the preset **and** its bounded proposition's `sstim:propositionSubject` is the preset. |
| Context | The proposition's scope names the preset as its `sstim:scopeInterventionOrContext`. |
| Population | The scope declares a `sstim:scopePopulationOrModel`. |
| Modality | The scope's `sstim:scopeSensoryModality` is a modality the preset actually delivers, derived through `followsProtocol` → `usesTechnique` → `techniqueModality`. |
| Citation integrity | The claim cites a `sstim:PublicSafeReference` that is *also* the `sstim:basisSource` of one of its own `sstim:hasEvidenceBasis` records. |
| Review and currency | A `sstim:EvidenceReviewDecision` confirms the claim, no decision against the same revision rejects it or requests revision, and the claim is neither `owl:deprecated` nor superseded by `dct:isReplacedBy` / `dct:replaces`. |

Three details are decisions rather than transcriptions of the disposition.

**Review state is read from decision records, never from `sstim:hasReviewStatus`.**
ADR 0027 deprecated that property precisely because a mutable status is not
evidence of review; its own definition says it "is excluded from validation and
authorization". The gate honours that.

**Adverse decisions block regardless of order.** `EvidenceReviewDecision`
carries no date, so "the latest decision wins" is not computable. Rather than
invent a dating requirement here, any reject or revision-request against the
*same immutable revision* blocks it. Under ADR 0027 a revised assessment is a new
revision with a new IRI, so a confirm and a reject on one revision is a
contradiction, not a history — refusing to authorize it is right, not merely
conservative.

**Currency means withdrawn or superseded, not old.** A staleness window
("evidence older than N years expires") would be policy invented by an
implementer, and the number would be arbitrary. `dct:modified` is already
mandatory on every assessment, so age is auditable; expiry is left to whoever is
entitled to set the number.

### The consequence, stated plainly

No `sstim:EvidenceReviewDecision` instance exists anywhere in SSTIM. Under this
contract, **no claim can currently authorize C3 or C5**, and C4 remains
unauthorizable by construction (its sentinel requirement of 7 exceeds the maximum
tier rank of 6).

This is intended. SSTIM has never run an evidence review, so the honest number of
presets entitled to make a structure/function claim in public is zero. Nothing
breaks today because nothing claims above C1. The gate now blocks the first
attempt to do so, which is the moment it matters.

### Adversarial negative fixtures

`scripts/public-claim-gate-negative.py` builds one baseline that satisfies the
whole contract, then breaks exactly one thing at a time — sixteen cases across
ten clauses — and requires the gate to reject each one *by its own message*. Two
positive controls bracket them: the baseline must conform, and a C1 preset with
no evidence at all must conform, since a gate that rejected everything would pass
every negative case while making the ontology unusable.

A conjunction is only as good as its weakest untested clause, and a positive
suite cannot tell a working clause from a deleted one. The harness was itself
mutation-tested: removing the direction clause from the shape fails exactly the
two direction cases and nothing else. It runs in `make validate` via
`make shacl-public-claim-gate`.

Fixtures are inline and namespaced to `example.org`. They are deliberately
invalid, and nothing invalid belongs in the published term space.

## Consequences

- The gate reads `sstim:evaluatesSubject`, so the deprecated
  `sstim:supportsRelation` no longer has authorization power. It survives only as
  the 0.7.x compatibility alias `EvidenceAssessmentClaimShape` keeps pinned to
  `evaluatesSubject`.
- Authorizing a public claim at C3 or C5 now requires building the review
  workflow: an `EvidenceReviewActivity`, a reviewer relationship, an independence
  determination, and an immutable decision. That work is real and is not done.
- The modality clause makes `followsProtocol` load-bearing for authorization.
  A preset that follows no protocol, or one whose techniques declare no modality,
  cannot be authorized above C2 — correctly, since nothing then says what it
  delivers.
- Population is checked for *declaration*, not compatibility. A preset states no
  target population, so there is nothing to compare a scope against.
  `AssessmentScopeShape` already requires the declaration, so this clause is
  defence in depth rather than new power. Population *compatibility* stays open,
  and gets an axis to check the day presets declare an intended population.
- This ADR hardens the existing C0–C5 ladder; it does not adopt the facet-based
  authorization redesign proposed in ADRs 0028 and 0029, and does not pre-empt
  it. If that redesign lands, the contract's clauses carry over — they are
  about applicability, not about which ladder measures the claim.
- The tier-to-level mapping in `sstim-v:PublicClaimLevelScheme` remains the
  PROVISIONAL risk-reduction default. Reconcile it with the BioSynCare Reference
  enum and a qualified EU MDR adviser before launch, as before.

### Revision, 2026-08-15: the gate could be switched off by an omission

A later review found the one failure mode a safety gate must not have. The gate
opens with `?level requiresEvidenceTierRank ?req`, and **nothing made that
property mandatory**. A `sstim:PublicClaimLevel` without it matches nothing in
the WHERE clause, so the entire constraint passes vacuously for every preset
declaring that level. Adding a seventh claim level and forgetting one triple
would have disabled the gate silently — no error, no warning, every preset at
that level suddenly authorized.

All six committed levels carry it, so the gate has always worked in practice.
That is exactly why nothing caught it: correct data hides a fail-open contract.

`sstim-sh:PublicClaimLevelShape` now requires `requiresEvidenceTierRank` and
`claimLevelRank` on every level, and `sstim-sh:EvidenceTierValueShape` requires
`tierRank` on every tier. Two fixtures were added: a level with no requirement
and a tier with no rank must both be rejected. They are rejected by the
vocabulary shapes rather than by the gate, which is the point — the gate never
sees a level it cannot read.

The missing-tier case fails *closed* (no claim can reach an unstated
requirement), so only the level case was a hole; both are now invalid.

## Alternatives considered

**Split the gate into one constraint per clause, for better diagnostics.**
Rejected. Eight constraints would each fire on any preset missing evidence
entirely, burying the real failure in seven irrelevant ones. The conjunction
reports one failure and the message enumerates the contract; the fixtures supply
per-clause diagnosis where diagnosis belongs.

**Require an independent reviewer, not merely a review.** Tempting, and
`sstim:hasIndependenceDetermination` exists to express it. Rejected for now: the
independence policy it must cite does not exist yet, so requiring independence
would encode a policy nobody has written. The determination is already mandatory
on every decision, so the fact is recorded and the clause can tighten later.

**Check modality against the preset's voices rather than its protocol.** Voice
subtypes (`BinauralVoice`, `SymmetryVoice`) imply auditory delivery, but the
implication lives in prose, not in a `techniqueModality`-style assertion. Using
the protocol path keeps the derivation inside asserted triples.
