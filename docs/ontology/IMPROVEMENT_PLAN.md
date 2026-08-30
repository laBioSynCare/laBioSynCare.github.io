# SSTIM RDF Knowledge-Representation Improvement Plan

**Status:** standing plan for internal ontology maturity. It owns the semantic
work sequence and release gates; [PUBLICATION_AND_INTERLINKING_PLAN.md](PUBLICATION_AND_INTERLINKING_PLAN.md)
owns outward-facing publication. What actually shipped per release is in
[`CHANGELOG.md`](../../CHANGELOG.md) — this document is not a completion ledger,
and phase numbering below is dependency order, not a version.

**Primary audit:** [RDF knowledge-representation audit, 2026-07-13](reviews/2026-07-13-rdf-knowledge-representation-audit.md)

For the implemented baseline and the ordered work that remains after the
`0.16.0` release, start with the maintained
[current-state summary](CURRENT_STATE.md). This plan preserves the dependency
logic and acceptance gates; it is not a claim that every bullet is still open.

## Objective

Make SSTIM's OWL, SKOS, SHACL, JSON-LD, instance data, application serializers,
and external profiles express one testable contract. The next milestone is not
the largest possible vocabulary. It is a trustworthy path from an executable
stimulus specification to an actual session, an event timeline, qualified user
observations, and optional standards-based research exports.

The graph audited on 2026-07-13 had a sound base: stable IRIs, seven live files,
immutable release snapshots, claim-scoped evidence, conservative safety
language, useful modeling levels, and substantial automated validation. The
current suite has since become the manifest-owned modular architecture
summarized in `CURRENT_STATE.md`. The audit found that runtime serializers and
documentation did not yet obey all of those contracts; the unresolved contract
repairs still precede term growth.

## Planning principles

1. **SSTIM is the source semantic model.** HED, BIDS, NWB, JSON-LD, and other
   formats are validated projections or bindings, never accidental sources of
   SSTIM meaning.
2. **Observation is not evidence, and temporal association is not causation.**
   A participant report remains a report until a separate, governed assessment
   produces an evidence claim.
3. **OWL is used for inference; SHACL and JSON Schema are used for data
   contracts.** Domains and ranges must not be written as if they were form
   validation rules.
4. **Runtime RDF is a product surface.** Every downloadable or publishable graph
   must be tested, not just the hand-curated fixture that resembles it.
5. **Synthetic fixtures come first.** No real participant observation enters the
   repository or a public graph before the privacy profile is approved.
6. **Each semantic change is reviewed as a synchronized set.** OWL/SKOS, SHACL,
   context, fixtures, competency questions, migration notes, and application
   mappings change together.

## Audit-finding coverage

Every finding in the primary audit maps to at least one phase below. A phase is
not complete until the dispositions of its findings are implemented or
explicitly re-scoped with a recorded reason.

| Finding | Short name | Resolved in |
|---|---|---|
| KR-01 | Sensory Field export not SHACL-conformant | 0.1 |
| KR-02 | Three incompatible session contracts | 0.2 |
| KR-03 | Self-report model unsafe for stated use | 2.1–2.3 |
| KR-04 | Public-claim gate approves wrong evidence | 1.2d (closed); ladder redesign remains 1.2b–1.2c |
| KR-05 | OWL domains contradict definitions | 1.1 |
| KR-06 | `EvidenceClaim` overloaded | 1.2a |
| KR-07 | Patch/preset validation weaker than claim | 1.3 (closed) |
| KR-08 | Outcome prose inside physical categories | 1.4 |
| KR-09 | Overstated `exactMatch` alignments | 1.4 |
| KR-10 | Ordered/controlled values collapse to literals | 1.3, 1.4 |
| KR-11 | Weak evidence review/provenance model | 1.2a |
| KR-12 | Web Annotation RDF and privacy defaults | 1.5 |
| KR-13 | Flattened ecosystem relationships/consent | 1.5 |
| KR-14 | Release status and validation-coverage gaps | 0.3, 1.1 |
| KR-15 | Ambiguous parallel technique identifiers | 1.4 |
| KR-16 | Uneven language and fixture coverage | 1.4, 2.3, 4 |
| KR-17 | Runtime mapping mints undeclared IRIs | 0.1, 0.3 |

## Work sequence

### Phase 0 — restore truth across existing contracts

This phase changes no public meaning unless a separate semantic change set is
approved. It makes existing claims testable and stops non-conformant output.

#### 0.1 Runtime RDF conformance

**`[~]` Substantially done; one bullet blocked on 1.5 — see the gate status
below.** Carrying no marker at all is what let a compression pass skip this
section while a finding inside it was recorded as closed.

- Add golden-output tests for Sensory Field, Patch Studio semantic links, Web
  Annotations, and future session exports. `[~]` — Sensory Field, the Patch
  Studio/Field semantic registries and the session projection are done; Web
  Annotations wait on shapes that do not exist (KR-12, phase 1.5).
- Run SSTIM SHACL and unresolved-local-IRI checks on generated graphs in CI.
- Cover a state matrix: visual only, audio only, depth, blinking, monaural,
  binaural, and mixed fields.
- Keep the now-conformant Sensory Field generator and its committed fixture in
  lockstep. Extend its state matrix without weakening the applicable SHACL or
  unresolved-local-IRI checks.
- Never add placeholder `EvidenceClaim` metadata simply to make validation
  green. A delivery record with no hypothesis should have no effect claim.

**Gate P0-A:** every public/downloadable runtime graph passes its applicable
SHACL profile, local-IRI resolution, and graph-specific golden assertions.

**Gate P0-A status, 2026-08-17: two of three emitters, third blocked by design.**
The repository contains exactly three files that construct RDF for output —
`src/session/sessionProjection.js`, `src/ui/field/exposureProfile.js`, and
`src/rdf/annotations/annotationRdf.js`. The first two have SHACL conformance
suites over a state matrix (`*.shacl.test.js`, run by `make test`). The third has
no SHACL test because **SSTIM declares no Web Annotation shapes at all**: there is
no `oa:` prefix in `sstim-shapes.ttl`, so there is nothing to validate against.
Writing them means first settling the annotation shape and privacy defaults,
which is KR-12 in 1.5 and depends on ADR 0031's public/private split. It is
tracked there rather than here, and minting shapes to turn this gate green ahead
of that decision would invert the order. Local-IRI resolution is covered for both
lookup registries by the KR-17 test in `src/ui/creator/semantic.test.js`.

The [fourth-pass review](reviews/2026-08-17-fourth-pass.md) reported this gate as
two of five emitters with three cheap fixes outstanding. That count included two
display lookup tables that emit no RDF and missed an existing test in a
neighbouring directory; the review carries the correction and the evidence.

#### 0.2 Establish one native session contract

**`[x]` Done 2026-08-13, with the ontology half of KR-03 explicitly deferred —
see below.**

The five deliverables — versioned schema, derivable stable ids, execution record
on the engine clock, a declared output guarantee, and a corrected
`SESSION_MODEL.md` — all shipped; the schema and
[ADR 0048](../decisions/0048-session-events-and-qualified-observations.md) are
the record of what they became.

**Gate P0-B: passing.** `make session-contract` checks that every golden bundle
validates, that the projection accounts for every leaf field, that only
synthetic/public-safe bundles are committed, and that the round trip preserves
ids, event order and declared hashes.
`src/session/sessionProjection.shacl.test.js` validates every projected graph
against the Full shape closure under `make test`.

**The term gap this opened is now closed.** The projection was partial by
construction — SSTIM declared no term for an event, instrument provenance, the
six response states, a qualified unwanted experience, or a privacy profile — and
rather than mint undeclared IRIs (the KR-17 failure) it withheld those fields and
named the term each needed. `make session-contract` printed 18. ADR 0048 added
them the same day, taking the generated list from 18 to 5, and what remains is
mostly deliberate: the privacy profile travels beside the graph rather than in
it, and free text stays out of exports by default.

#### 0.3 Repair contexts, namespaces, and release controls

- Remove unsafe global JSON-LD coercions for DCTERMS properties whose values
  legitimately vary (`date`, `dateTime`, `gYear`, IRI, and literal).
- Add JSON-LD expand/compact/isomorphism fixtures for ontology metadata,
  references, sessions, reports, exposures, and Web Annotations.
- Generate or validate JavaScript namespace factories, JSON-LD prefixes, graph
  IRIs, and documentation from one registry.
- Reject undeclared Patch Studio semantic targets and unknown parameters rather
  than minting arbitrary SSTIM IRIs.
- Require all live modules to carry the same development version. Reject `-dev`
  snapshots, require release metadata/version IRI at snapshot time, and ensure
  development sources are not marked released.

**Gate P0-C:** context fixtures preserve datatypes and node kinds; namespace
parity and whole-set version checks run in CI; snapshot dry-run failures are
covered by tests.

### Phase 1 — repair core semantics and validation

#### 1.1 OWL domain/range and category audit

> **Status 2026-08-14 — KR-05 closed.** The domain contradictions the audit named
> were repaired in 0.11.0: `hasExposureProfile`, `hasBodyPlacement`,
> `hasPerceptualGain`/`Loss` and `hasExposureLimit` carry union domains, and
> `hasKnowledgeStatus` carries none, which is the disposition's "no domain plus
> SHACL target rules" option. What was missing is the other half of the
> disposition — the entailment fixtures — now `make entailment-check`: HermiT
> materializes class assertions over the Full closure plus every committed
> instance, and three queries fail the build if a union domain ever infers a
> named type.
>
> This is not theoretical. Three committed exploratory protocols — the
> silence/darkness baseline, the wifi EM field hypothesis, and the smell/taste
> device boundary — use `hasExposureProfile` while deliberately *not* being
> sensory-typed, because ADR 0034 reparented `ExploratoryProtocol` so that a
> baseline defined by the absence of stimulation stops being a stimulation by
> inheritance. Narrowing that domain back to one class re-infers
> `sstim:Stimulation` on all three; the gate was verified by doing exactly that.

Closed with KR-05: the domain mismatches, the entailment tests that detect an
unintended inferred type (`make entailment-check`), the physical-medium versus
cue-arrangement split (`sstim-ex:deliveryMedium` beside
`sstim-ex:hasStimulusPattern`), and single-module ownership of the upper-model
axioms (`make module-boundaries`).

**Still open.** Add a pinned minimal BFO/OBI/IAO/PROV import closure for CI
reasoning, or narrow the documentation explicitly to the local-graph consistency
claim that `make reason` actually makes.

#### 1.2 Refactor evidence and public-claim governance

**1.2a — Evidence roles and provenance
([ADR 0027](../decisions/0027-evidence-claim-family-and-public-claim-gate.md))**

> **`[x]` Implemented 2026-07-14 (ADR 0027 accepted).** Term layer, all 38
> ledger nodes migrated (8 assessment revisions, 3 knowledge-status assertions,
> 24 role statements, 3 retired), rewritten SHACL, a conformant Sensory Field
> exporter (KR-01 closed), and positive/negative fixtures all landed and pass
> `make validate`. Resolves KR-06 and the evidence-role/provenance half of KR-11.
> Deferred as documented: the generated 0.7 compatibility view (a dist-only
> build artifact) and re-assessment of migrated tiers under a dedicated rubric.
> KR-04 was then closed by [ADR 0050](../decisions/0050-public-claim-applicability-contract.md)
> (phase 1.2d), which hardened the existing gate rather than waiting for the
> ladder redesign; the facet-based redesign in ADRs 0028–0029 remains open and
> is unaffected.

Closed by ADR 0027: the claim-family split, `evaluatesSubject` replacing the
directionally misleading `supportsRelation`, one atomic bounded proposition and
explicit outcome per assessment, the overloaded legacy tags deprecated,
assessment/search/review modelled as PROV activities generating immutable
records, and scoped search findings permitted only from a reproducible search
record.

**Still open.** Recalculate migrated evidence tier and claim direction under the
versioned rubric — the migration carried the legacy editorial rating forward
under `method/adr-0027-migration/1` rather than inventing a re-assessment, and
that re-assessment has not been done.

**1.2b — Policy-neutral claim semantics
([ADR 0028](../decisions/0028-atomic-claim-propositions-and-public-expressions.md))**

- Separate atomic claim propositions from exact rendered/translated public
  expressions and their revisions.
- Replace the scalar C0–C5 authorization ladder with non-exclusive facets for
  subject-matter domain, attribution/generalization, epistemic force,
  expression form, and communicative role/polarity. Keep legacy C labels only
  as reviewed migration hints.
- Represent policy-scoped authorization decisions without embedding product
  thresholds or legal conclusions in SSTIM core semantics.

**1.2c — BSC Lab publication policy
([ADR 0029](../decisions/0029-bsc-lab-public-claim-publication-profile.md))**

- Define a versioned BSC policy/profile whose obligations accumulate across
  all claim facets and whose prohibitions override permissions.
- Bind authorization to exact expression/proposition revisions, an identified
  evidence corpus, explicit applicability, consent where relevant, and a
  controlled release surface.
- Build the trusted input and public-copy inventory outside RDF, then validate
  the selected dataset and policy/as-of date with BSC-specific SHACL and
  adversarial fixtures.

**1.2d — The public-claim applicability contract
([ADR 0050](../decisions/0050-public-claim-applicability-contract.md))**

> **`[x]` Implemented 2026-08-15 (ADR 0050 accepted). Closes KR-04.** The gate on
> `sstim-sh:BscCatalogPresetShape` asked one question — does some claim linked by
> the deprecated `supportsRelation` reach the required tier — and so accepted a
> well-evidenced refutation, a claim about another subject, evidence from another
> modality, unreviewed or withdrawn evidence, and a borrowed citation. It is now
> a conjunction of eight clauses covering direction, strength, subject, context,
> population, modality, citation integrity, and review/currency, all of which one
> assessment must satisfy.
>
> Because no `EvidenceReviewDecision` exists anywhere in SSTIM, **no claim can
> currently authorize C3 or C5**. That is intended: no evidence review has been
> run, so the honest count of presets entitled to a public structure/function
> claim is zero. Nothing breaks today because nothing claims above C1 — which is
> also why the gate has never fired on committed data, and why
> `scripts/public-claim-gate-negative.py` (16 adversarial cases, 10 clauses, 2
> positive controls, itself mutation-tested) is the only thing that can tell a
> working clause from a deleted one.
>
> This hardens the existing ladder. It does not adopt or pre-empt the facet-based
> redesign in 1.2b–1.2c; those clauses are about applicability, not about which
> ladder measures the claim, so they carry over. Population is checked for
> declaration rather than compatibility, since presets state no target
> population — that axis opens when they do.

#### 1.3 Complete the executable-parameter contract

**`[x]` Implemented 2026-08-15 ([ADR 0051](../decisions/0051-sstim-preset-contract.md)).
Closes KR-07.** SSTIM now has its own preset contract,
[`static/schemas/preset.schema.json`](../../static/schemas/preset.schema.json)
(`sstim-preset-1`): modality-declaring components rather than audio voices,
parameters named with their units, one breath pointer instead of two coupled
flags, and no application product envelope. It takes the numeric parameter
ranges from the BioSynCare catalog format and nothing else — that format is one
audio-only application's incremental history, not a standard, and SSTIM reads it
as an input rather than conforming to it.

The four SHACL gaps the audit named are closed: a six-voice ceiling, the 35 Hz
beat limit with its gamma-40 exception, the 50 Hz Symmetry pulse-rate limit, and
a rationale requirement above the 0.30 conservative volume. Two documented
ranges the shapes had drifted from (carriers, Symmetry base note) now match.

The matrix is executed rather than tabulated: `make preset-contract` reads every
bound out of the schema, the shapes and the format document and compares them —
12 parameters against SHACL, 11 against the documented ranges — so a bound
changed in one place fails until the others follow. The same gate carries the
application-validation leg (beat frequency, pulse rate, breath reference, unique
ids, level rationale) with 25 adversarial cases and 8 positive controls.

Open, with reasons recorded in the ADR: panning and waveform selection have no
SSTIM property at all and need a design pass rather than a transcription. A
multi-modal component does project to RDF today, through the generic
`sstim:composedOfTrack`; what remains is that it and the catalog-profile
`sstim:composedOf` share the domain `sstim:Preset` with nothing marking which
profile a preset follows. See
[SSTIM_DIRECTIONS.md](SSTIM_DIRECTIONS.md).

Closed by ADR 0051: the parameter matrix, executed rather than tabulated
(`make preset-contract` reads every bound from the schema, the shapes and the
format document and compares them); and the voice-count, binaural-difference,
target-frequency, Symmetry-rate and conservative-gain constraints. The
reproducibility metadata — generator and application version, assets, checksums,
declared level — shipped on the session side in
[ADR 0048](../decisions/0048-session-events-and-qualified-observations.md),
where execution actually happens.

**Still open.**

- Visual-flicker and haptic constraints. Both are named in this phase and
  neither has an SSTIM parameter to constrain; see
  [design directions](SSTIM_DIRECTIONS.md) §1, §2 and §5.
- Link RDF controlled values to their concept IRIs, keeping application numeric
  codes only as versioned adapter values. `sstim:permutationFunction` is still
  an ordinal where the schema uses a named enum.

#### 1.4 Repair SKOS and external mappings

> **Status 2026-08-15 — KR-08 and KR-09 both closed. Phase 1.4 complete.**
> The downgrades landed earlier: no `skos:exactMatch` assertion remains, and the
> eleven external mappings are `closeMatch` or `relatedMatch`. The missing half
> was provenance — the rationale lived only in Turtle comments, which no
> consumer can read. Each mapping now carries an `owl:Axiom` annotation with the
> source item, the date it was last verified, the reviewer where one is on
> record, and why it is not `exactMatch`. The plain triples are untouched, so
> nothing consuming them changes.
>
> `dct:date` is a verification date, not a source revision id: Wikidata
> revisions were not recorded at verification time, and inventing them would be
> worse than naming the date that was.
>
> **KR-08 closed 2026-08-15 by
> [ADR 0049](../decisions/0049-neural-oscillations-and-frequency-ambits.md)**, and
> not as the audit framed it. The scheme was never conflated: a band is a Hz
> interval throughout, and `alpha10` and `gamma40` sit in it naming no rhythm.
> What was missing was a term for the rhythm, now
> `sstim-v:NeuralOscillationScheme`. The outcome prose left the bands for the
> rhythms as evidence claims or dated `noKnownEvidenceInSSTIM` assertions —
> three sourced, seven not, none deleted — and `make band-scope-notes` checks
> both that no band claims an outcome and that no association silently vanished.
> With the rhythm as subject, four of the five Wikidata mappings reached
> `exactMatch`; beta stayed `closeMatch` because the item spans a range SSTIM
> splits.

Closed by ADR 0049: the target/oscillation separation, outcome prose removed
from the band definitions, explicit primary and secondary target roles
(`sstim:primaryFrequencyBand`, never triple order), both ends of every mapping
identified in a scheme, every `exactMatch` re-audited, and per-mapping
provenance as `owl:Axiom` annotations.

**Still open.**

- Clarify how vendor-neutral technique concepts relate to framework-specific
  techniques and implementation voice types using domain properties.
- Honest per-scheme language-coverage targets, translation review, aliases, and
  locale-aware label fallback — this is KR-16, which remains open here and in
  2.3 and Phase 4. Use hierarchy or SKOS Collections only where a genuine
  generic or grouping relation exists.

  *Measured, completed and gated 2026-08-18, in that order.* The metric came
  first — `make language-coverage` found 269 of 545 concepts carrying all four
  languages — and the remaining 276 were translated the same day, so the gate
  now reports 100% and guards against regression rather than tracking debt.

  What remains of KR-16 is narrower and should not be confused with coverage:
  the 276 new labels have had **no native review**, `skos:definition` is
  English-only for all 551 concepts by deliberate decision, and `skos:altLabel`
  coverage is 15 labels on 8 of the 551 concepts, all English — thin, but not the
  zero this said until it was measured. Locale-aware label fallback in the
  application is also untouched. So the *label-coverage* half of this item is
  closed and the *quality, alias and runtime* halves are not.

#### 1.5 Repair privacy-sensitive RDF surfaces

> **Ecosystem F1–F2 implemented 2026-07-15 ([ADR 0031](../decisions/0031-qualified-ecosystem-records.md)).**
> Qualified relationships/memberships, a retractable approved public
> projection, private append-only audit policy, closed artifact profile, and
> isolated synthetic/adversarial fixtures are implemented. F3 synthetic
> repository plumbing is staged, but the external mutable store and
> loader/dereferencing/admission path for real live-only records are not; the
> stable term release, F4 real data, and Web Annotation/KR-12 portion remain
> open.

- Model Web Annotation text with `oa:bodyValue` or `oa:TextualBody`, enumerate
  valid motivations, and validate target IRIs.
- Default annotations to private and fail closed on invalid visibility.
- Separate authentication IDs from public agent identifiers; public identity
  linkage requires explicit consent.
- Reify ecosystem relationships/engagements so agent, target, type, source,
  purpose, curator, and consent decision remain associated.
- Represent notification, response, amendment, and withdrawal as append-only
  PROV activities in the private operational audit rather than overwritten
  strings; publish only the retractable approved current-state projection.

**Phase 1 gate:** OWL reasoning and domain/range lint pass; negative SHACL
fixtures fail for the intended reasons; no public-claim authorization succeeds
with refuting, mismatched, provisional, or uncited evidence; runtime annotation
serialization is valid and private by default.

### Phase 2 — session observations and unwanted experiences

This phase implements the ordinary BSC Lab history use case that motivated the
ADR 0025 review.

> **Status 2026-08-13 — 2.1 and 2.3 are done; 2.2 is half done.**
> The qualified observation pattern, the six response states, the
> unwanted-experience record and the instrument provenance exist in both
> representations: natively in
> [`session.schema.json`](../../static/schemas/session.schema.json), and in RDF
> under [ADR 0048](../decisions/0048-session-events-and-qualified-observations.md)
> (`sstim:ParticipantObservation`, `sstim:UnwantedExperienceObservation`,
> `sstim:ObservationInstrument`, and their controlled schemes). The golden
> fixtures 2.3 asks for exist and are gated by `make session-contract`;
> `make shacl-session-negative` proves the contradiction guards actually reject.
>
> **2.2's privacy profile is native-only, deliberately.** The classification,
> consent basis, visibility, retention, de-identification and withdrawal states
> are required on every bundle and machine-checked by the public-repository lint,
> but no SSTIM terms were minted for them: how consent is represented is
> entangled with [ADR 0031](../decisions/0031-qualified-ecosystem-records.md)'s
> public/private split and deserves its own ADR rather than a side effect of the
> session work. The projection withholds the profile in full and says why.

#### 2.1 Qualified observation pattern

Model a report as a collection event and each answer/experience as a qualified
observation item. The design must support:

- the user's stated session goal without converting it into a clinical target;
- perceived helpfulness on a declared scale, with neutral prompt and confidence
  where collected;
- prompt, question, instrument, language, and version;
- collection time and phase, including during-session reporting;
- zero-or-more unwanted experiences with controlled category plus optional
  text, participant-reported severity, onset/phase, duration/persistence,
  action taken, resolution/ongoing state, and participant-perceived relatedness;
- explicit response states: value supplied, none reported, not asked, declined,
  unknown, and not applicable; and
- legacy scalar properties as documented simple projections where backward
  compatibility warrants them.

The vocabulary should prefer neutral names such as `UnwantedExperienceObservation`
or a controlled observation role. It must not use a bare `sideEffect` predicate
or imply diagnosis, injury, clinical adverse-event classification, or causal
attribution.

#### 2.2 Privacy and provenance profile

- Define private, shared-research, de-identified, synthetic, and public-safe data
  classifications.
- Record reporting role/pseudonym, purpose and consent basis, policy/instrument
  version, collection provenance, visibility, retention policy, withdrawal
  state, and de-identification transform.
- Keep free text out of research exports by default because it can contain
  identifiers.
- Add a public-repository lint that permits only machine-marked synthetic or
  explicitly public-safe session/report fixtures.
- Keep consent decisions and identity data in separate access-controlled named
  graphs from reusable term space and public fixtures.

#### 2.3 Competency questions and fixtures

The model is not accepted until it answers and tests at least:

1. What exact configuration and engine generated this session?
2. What happened, in what order, on which clock, and was execution interrupted?
3. What goal and helpfulness did the user report, with which prompt version?
4. Were unwanted experiences absent, not asked about, declined, or reported?
5. For each reported experience, when did it begin, how severe did the user say
   it was, what action followed, and was it resolved?
6. Can a query return these observations without inferring that the stimulus
   caused them or that they are evidence of efficacy?

Golden synthetic cases must cover: helpful/no unwanted experience; unhelpful
with one experience; multiple experiences; declined/not asked; pre/during/post
reports; follow-up; and an interrupted session.

**`[x]` The cases exist** in
[`src/session/fixtures/goldenSessions.js`](../../src/session/fixtures/goldenSessions.js)
— four bundles covering all eight requirements — and answer competency questions
1, 2, 4, 5 and 6 natively. Question 3 (goal and helpfulness with prompt version)
is answered natively and unanswerable in RDF until the terms exist. Question 6 is
answered structurally rather than by convention: an observation has no path to
`EvidenceClaim` in either the schema or the projection.

**Phase 2 gate:** JSON Schema, RDF/JSON-LD, SHACL, privacy profile, user-facing
wording, and all golden cases agree. A self-report cannot satisfy an
`EvidenceClaim` or public-copy gate by type inference or convenience mapping.

### Phase 3 — HED event profile and optional research bindings

[ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md) governs
this phase.

#### 3.1 HED event-semantic profile

- **Bounded profile complete, 2026-08-30.** Mapping 0.5.0 projects all eleven
  current native event types to pinned HED 8.4.0. Three synthetic bundles cover
  fixed, explicitly segmented and continuously modulated stimuli. Their sidecars
  assemble HED from categorical `event_id` levels and native parameter columns;
  `sstim_event_id` preserves the source occurrence join. `make hed-crosswalk`,
  `make hed-bundle-check` and `make hed-roundtrip` gate exact coverage, HED
  validation, identifiers and declared loss.
- **Open prerequisite for the complete profile.** Measured 2026-08-22: the
  shipped `SessionEventTypeScheme` is system, transport and session-lifecycle
  only, and `sstim:SessionEvent` cannot reference a stimulus, a channel or a
  specification. Stimulus-presentation, participant-response and contextual
  events therefore have nothing native to map from. Close the minimum bridge
  described in [`HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) under a
  separate ADR before claiming the fuller bridge; do not hold the bounded
  projection hostage to concepts it does not claim to cover.
- Continue to map stable native event types—not ad hoc strings—to a pinned
  released HED schema, and keep HED generated rather than a runtime storage
  dependency.
- Preserve categorical type codes, source occurrence IDs, definition IDs,
  temporal scope, units and mapping version.
- Keep every generated annotation and sidecar under validator gates. Working
  Group review began publicly in August 2026 and included the 2026-08-25 meeting;
  remaining questions are recorded in ADR 0025.
- Do not create a HED library until standard-schema gaps recur across external
  use cases and a partnered design is justified. The meeting explicitly advised
  against an SSTIM HED schema at the present scale.

#### 3.2 Native demonstrator

The three bounded, synthetic, non-personal HED demonstrators are published and
gated. A fuller end-to-end demonstrator should contain:

- the native versioned session bundle and event table;
- SSTIM RDF/JSON-LD for specification, execution, exposure, reports, and
  provenance;
- validated HED annotations; and
- the exact executable patch/configuration with hashes.

A manifest joins artifacts by stable IDs and records standards/application
versions, file hashes, clock/time-base assumptions, generation provenance,
privacy classification, and declared information loss.

#### 3.3 Optional BIDS Behavioral binding

- Emit a complete valid behavioral dataset when a research use case requests
  it—not a bare `events.tsv` presented as BIDS.
- Pin BIDS and HED versions in dataset metadata, include the corresponding
  behavioral data file, document SSTIM-specific columns in JSON sidecars, and
  use pseudonymous subject labels.
- Map reports to the appropriate behavioral or phenotype/assessment structure
  according to study design. Exclude or separately govern free text.
- Pass the BIDS Validator and HED validation, and verify IDs, times, values, and
  declared loss against the native fixture.

#### 3.4 Optional NWB binding

Add NWB only for a partner use case with synchronized neurophysiology,
continuous behavior, or stimulus streams. Use NWB tables/time series and the
supported HED extension; pass NWB Inspector and HED checks. NWB is not an
ordinary-session storage requirement.

**Phase 3 gate:** the bounded native+HED demonstrators are validator-clean and
implement the sidecar design reviewed on 2026-08-25. The regenerated artifacts
have not yet been returned for follow-up review: the revised message remains
drafted and unsent. The complete profile remains partial until the native event
bridge and an end-to-end demonstrator exist. Each optional binding has its own
conformance test and never becomes the round-trip authority.

### Phase 4 — domain depth, quantities, and publication maturity

- Adopt QUDT quantity/unit IRIs for calibrated physical values while retaining
  plain display values where useful. Distinguish commanded, nominal, and
  measured delivery.
- Add new evidence families only where a stable technique, measurable dimension,
  auditable source, and maintained review record exist.
- Expand synthetic examples across visual, vibrotactile, audiovisual,
  accessibility-aware, and device-capability workflows.
- Add competency queries for capability matching, exposure-limit applicability,
  protocol comparison, evidence changes across releases, and observation export.
- Publish truthful per-scheme language coverage and add reviewed translations
  according to actual user-facing priority.
- Continue WIDOCO, w3id, VoID/DCAT, registry, and DOI work only from a validated
  released graph. Registry visibility is not a substitute for semantic review.

## Proposed change sets

| Change set | Contents | Depends on |
|---|---|---|
| A — Contract harness | Runtime golden RDF, per-artifact SHACL, context and namespace parity, negative fixtures | none |
| B — Session v2 | Native schema, event timeline, hashes, RDF projection, corrected docs | A |
| C — Observation/privacy | Qualified reports, helpfulness, unwanted experiences, missingness, consent/data classification | B; privacy review |
| D — Exposure/evidence repair | Domain fixes, role split, bounded assessment propositions, qualified bases/source governance, review provenance | A; [ADR 0027](../decisions/0027-evidence-claim-family-and-public-claim-gate.md) |
| D2 — Public-claim semantics | Atomic propositions/expressions, non-exclusive facets, generic decision record | D; [ADR 0028](../decisions/0028-atomic-claim-propositions-and-public-expressions.md) |
| D3 — BSC publication profile | Versioned policy, applicability/consent rules, trusted input and publisher gate | C for testimonials; D2; [ADR 0029](../decisions/0029-bsc-lab-public-claim-publication-profile.md) |
| E — SKOS/alignment repair | Neural/stimulus frequency split, roles, controlled-value plumbing, mapping provenance | D where evidence links migrate |
| F — Ecosystem/annotation repair | Ecosystem F1–F2 implemented and synthetic F3 repository plumbing staged under ADR 0031; stable term/live namespace routes, an external mutable public store with loader/admission plumbing, access-controlled ledger readiness, real F4 records, and valid OA/private annotation defaults remain open. Current synthetic fixture subjects reserve a `synthetic-*` slug excluded by the live rules and require no fixture-specific registry routes. ADR 0031 resolves the ecosystem publication-policy decision; the separate OA/annotation privacy review remains open. Operational sequence: [Ecosystem Integration, Workstream 5](../ecosystem/ECOSYSTEM_INTEGRATION.md#workstream-5--stakeholder-ecosystem-rdf-module-adr-0024-implementation) | A; external-store and private-ledger readiness for ecosystem F4; privacy review for annotation surfaces |
| G — HED profile | Native event mapping, validator, synthetic demonstrator | B, C, D |
| H — BIDS binding | Complete optional Behavioral dataset and adapter tests | G |
| I — NWB binding | Optional synchronized neurophysiology/behavior adapter | G; external use case |

Each semantic change set needs its own migration notes and explicit approval to
edit the protected ontology, vocabulary, shapes, context, alignment, or instance
files. This plan itself does not authorize those source changes.

## Next-release acceptance criteria

The next release is ready only when:

- all live modules have consistent release metadata and a valid whole-set
  snapshot/version IRI;
- Turtle parses, HermiT (with the documented closure) is consistent, and every
  applicable SHACL target conforms;
- runtime-produced graphs, not only curated fixtures, pass conformance tests;
- JSON-LD compact/expand round trips preserve graph meaning and datatypes;
- domain/range lint and negative/mutation fixtures pass;
- every evidence-based public claim has applicable, supporting, current,
  provenance-complete evidence;
- observations, evidence assessments, safety applicability, and hypotheses are
  distinct and cannot authorize one another accidentally;
- all public session/report fixtures are machine-marked synthetic/public-safe;
- the session specification's stated reproducibility level is supported by the
  actual parameters, versions, and hashes it records;
- language-coverage claims match measured scheme coverage; and
- changelog, ADRs, documentation, context, VoID counts, exports, tag, DOI, and
  snapshot describe the same model.

## Deliberate boundaries

SSTIM should not grow into disease, diagnosis, prescription, treatment,
unqualified adverse-event causality, detailed neuroanatomy, device-vendor
catalogs, or an unreviewed encyclopedia of effects. It should remain a precise
interoperability layer for stimulus specification, execution, exposure,
qualified observation, evidence assessment, and conservative safety metadata.
