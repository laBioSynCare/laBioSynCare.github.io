# SSTIM RDF Knowledge-Representation Improvement Plan

**Status:** standing plan for internal ontology maturity. It owns the semantic
work sequence and release gates; [PUBLICATION_AND_INTERLINKING_PLAN.md](PUBLICATION_AND_INTERLINKING_PLAN.md)
owns outward-facing publication. What actually shipped per release is in
[`CHANGELOG.md`](../../CHANGELOG.md) — this document is not a completion ledger,
and phase numbering below is dependency order, not a version.

**Primary audit:** [RDF knowledge-representation audit, 2026-07-13](reviews/2026-07-13-rdf-knowledge-representation-audit.md)

For the implemented baseline and the ordered work that remains after the
modular `0.13.0` release, start with the maintained
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
| KR-04 | Public-claim gate approves wrong evidence | 1.2b–1.2c |
| KR-05 | OWL domains contradict definitions | 1.1 |
| KR-06 | `EvidenceClaim` overloaded | 1.2a |
| KR-07 | Patch/preset validation weaker than claim | 1.3 |
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

- Add golden-output tests for Sensory Field, Patch Studio semantic links, Web
  Annotations, and future session exports.
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

#### 0.2 Establish one native session contract

**`[x]` Done 2026-08-13, with the ontology half of KR-03 explicitly deferred —
see below.**

- `[x]` Create a versioned JSON Schema for the native BSC session bundle.
  [`static/schemas/session.schema.json`](../../static/schemas/session.schema.json),
  model tag `bsc-lab-session-bundle-1`. It lives under `static/` so its `$id`
  dereferences, as `manifest.schema.json` does.
- `[x]` Define stable IDs for the session specification, session instance, event,
  report, and observation item. All derived from the instance id by
  `sessionIds()`; the recorder rejects a specification whose id is not derivable.
- `[x]` Record the exact source preset/patch/configuration and content hashes,
  engine and application versions, clock origin, monotonic event offsets,
  wall-clock timestamps where appropriate, interruption/resume events, and actual
  outcome of execution. Offsets come from the engine timing context only; a test
  spies on `Date.now`/`performance.now` and fails if either is consulted.
  `deliveredSeconds` is separated from `actualDurationSeconds`, so a paused
  session is not recorded as a short one.
- `[x]` Decide and document which output guarantee is supported: `outputGuarantee`
  is a required enum of `bit-exact` / `signal-equivalent` /
  `perceptually-equivalent`. Web Audio sessions declare the third unless a
  deterministic offline render proves otherwise.
- `[x]` Correct `SESSION_MODEL.md` to the same contract. The document now states
  that it is not the contract and that the schema wins where they disagree.
  `userMp0`/`userMp1`/`userMd` and `headphoneMode` — names that existed nowhere
  but that document — are gone.

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

- Resolve every definition/domain mismatch identified in exposure properties.
  Choose a true common domain, an explicit union, domain-specific
  subproperties, or no OWL domain plus SHACL constraints.
- Add domain/range entailment tests to detect unintended inferred types.
- Separate physical delivery medium from presentation/cue arrangement.
- Assign a single owning module to upper-model axioms and remove duplicated
  sources of truth.
- Add a pinned minimal BFO/OBI/IAO/PROV import closure for CI reasoning, or
  explicitly narrow documentation to the local-graph consistency claim.

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
> KR-04 (exact public-copy authorization) stays open under ADRs 0028–0029.

- Separate literature evidence assessments, hypotheses/research questions,
  observations, boundary applicability, requirements, design objectives, and
  planned outcomes. Do not require an effect hypothesis on every exposure
  profile. Migrate every existing pseudo-claim through the reviewed ledger.
- Replace the directionally misleading subject relation `supportsRelation` with
  the evidence-specific neutral `evaluatesSubject`, retaining a materialized
  deprecated alias during the compatibility window.
- Give every assessment one atomic bounded proposition and explicit outcome,
  modality, population/model, protocol/context, and comparator scope. Require a
  qualified evidence basis, a governance record for research outputs, and
  separate source-level modality, intervention, study design, population/model,
  synthesis, and observed-result metadata.
- Deprecate the overloaded legacy modality-tag and assessment-summary fields;
  expose only lossless mappings in the 0.7 compatibility view.
- Model assessment, search, and review as PROV activities that generate
  immutable assessment revisions, search records, and review decisions. Keep
  reviewer relationship, independence determination, and decision as separate
  axes without making external review a core validity requirement.
- Recalculate migrated evidence tier and claim direction under the versioned
  assessment method; legacy editorial ratings are inputs, not approved results.
- Permit only scoped search findings from a reproducible search record. Use a
  scoped, dated, attributed status assertion when SSTIM has not assessed or
  recorded evidence; never assert that evidence or a mechanism universally
  does not exist.

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

#### 1.3 Complete the executable-parameter contract

- Build a single matrix mapping each executable parameter to JSON field,
  datatype/unit, range, cross-field rules, RDF property, and SHACL path.
- Reconcile voice count, binaural-difference, target-frequency, Symmetry-rate,
  conservative-gain, visual-flicker, haptic, and breathing constraints.
- Link RDF controlled values to their concept IRIs. Keep application numeric
  codes only as versioned adapter values.
- Add generator/app/model version, random seed where relevant, assets, and
  checksums needed for the selected reproducibility level.

#### 1.4 Repair SKOS and external mappings

> **Status 2026-08-14 — KR-09 closed; KR-08 still open.**
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
> **KR-08 remains open and is the larger half of 1.4.** Band scope notes still
> carry unqualified outcome prose, and the scheme still conflates the observed
> neural-oscillation sense with the stimulus-frequency-target sense. Splitting
> them changes what `sstim-v:alpha` means, so it needs its own ADR — the
> vocabulary already says so in a `skos:editorialNote`. The mapping annotations
> above name that split as the precondition for revisiting `exactMatch`.

- Separate stimulus temporal-frequency targets from observed neural-band
  classifications; relate them only through a qualified hypothesis,
  observation, or evidence assessment.
- Remove sleep, pain, stress, relaxation, cognition, and other outcome
  implications from physical band definitions/scope notes.
- Represent primary and secondary target roles explicitly; never depend on RDF
  triple order.
- Clarify how vendor-neutral technique concepts relate to framework-specific
  techniques and implementation voice types using domain properties.
- Require both ends of a SKOS mapping to be identified concepts in schemes.
- Re-audit every `exactMatch`; downgrade when extension and intension are not
  demonstrably interchangeable.
- Add mapping provenance: target version/date, source, reviewer, rationale, and
  confidence. Store structural/field transformations outside SKOS.
- Add honest per-scheme language-coverage targets, translation review, aliases,
  and locale-aware label fallback. Use hierarchy or SKOS Collections only where
  a genuine generic or grouping relation exists.

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

- Map stable native event types—not ad hoc strings—to a pinned released HED
  schema. Initial events include session start/end, stimulus block start/end,
  parameter/configuration change, pause/resume/interruption, report prompt and
  capture, participant action, and unwanted-experience report.
- Generate HED annotations from a versioned mapping; do not make HED strings a
  runtime storage dependency.
- Preserve event IDs, definition IDs, temporal scope, units, and mapping version.
- Validate every generated HED annotation and sidecar. Seek HED Working Group
  review before claiming interoperability.
- Do not create a HED library until standard-schema gaps recur across external
  use cases and a partnered design is justified.

#### 3.2 Native demonstrator

Publish a synthetic, non-personal ordinary session containing:

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

**Phase 3 gate:** the native+HED demonstrator is validator-clean and reviewed.
Each optional binding has its own conformance test and never becomes the
round-trip authority.

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
