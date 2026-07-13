# SSTIM RDF Knowledge-Representation Improvement Plan

**Status:** active plan for the live `0.7.0-dev` line

**Citable baseline:** `0.6.0`

**Last reviewed:** 2026-07-13

**Primary audit:** [RDF knowledge-representation audit, 2026-07-13](reviews/2026-07-13-rdf-knowledge-representation-audit.md)

## Objective

Make SSTIM's OWL, SKOS, SHACL, JSON-LD, instance data, application serializers,
and external profiles express one testable contract. The next milestone is not
the largest possible vocabulary. It is a trustworthy path from an executable
stimulus specification to an actual session, an event timeline, qualified user
observations, and optional standards-based research exports.

The current graph has a sound base: stable IRIs, seven live modules, immutable
release snapshots, claim-scoped evidence, conservative safety language, useful
modeling levels, and substantial automated validation. The audit found that
runtime serializers and documentation do not yet obey all of those contracts.
Contract repair therefore precedes term growth.

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
- Reconcile the Sensory Field generator with its committed fixture. Until then,
  mark the download as a lossy exposure summary or disable it as a conformant
  SSTIM export.
- Never add placeholder `EvidenceClaim` metadata simply to make validation
  green. A delivery record with no hypothesis should have no effect claim.

**Gate P0-A:** every public/downloadable runtime graph passes its applicable
SHACL profile, local-IRI resolution, and graph-specific golden assertions.

#### 0.2 Establish one native session contract

- Create a versioned JSON Schema for the native BSC session bundle.
- Define stable IDs for the session specification, session instance, event,
  report, and observation item.
- Record the exact source preset/patch/configuration and content hashes, engine
  and application versions, clock origin, monotonic event offsets, wall-clock
  timestamps where appropriate, interruption/resume events, and actual outcome
  of execution.
- Decide and document which output guarantee is supported: bit-exact,
  signal-equivalent, or perceptually equivalent.
- Correct `SESSION_MODEL.md`, JSON examples, RDF examples, JSON-LD projection,
  and SHACL to the same contract. Use named immutable specifications when they
  are referenced, hashed, shared, or exported.

**Gate P0-B:** native JSON validates; its RDF projection validates; a round trip
preserves IDs, datatypes, values, event order, and declared hashes.

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

- Resolve every definition/domain mismatch identified in exposure properties.
  Choose a true common domain, an explicit union, domain-specific
  subproperties, or no OWL domain plus SHACL constraints.
- Add domain/range entailment tests to detect unintended inferred types.
- Separate physical delivery medium from presentation/cue arrangement.
- Assign a single owning module to upper-model axioms and remove duplicated
  sources of truth.
- Add a pinned minimal BFO/OBI/IAO/PROV import closure for CI reasoning, or
  explicitly narrow documentation to the local-graph consistency claim.

#### 1.2 Refactor evidence and public-claim authorization

- Separate literature evidence assessments, hypotheses/research questions,
  observations, and safety-boundary applicability. Do not require an effect
  hypothesis on every exposure profile.
- Replace the directionally misleading subject relation `supportsRelation` with
  a neutral evaluated/about-subject relation, retaining a deprecated alias if
  needed for compatibility.
- Split evidence modality, study design/source type, population/model, and
  synthesis level.
- Model assessment and review as PROV activities with inputs, assessor IRI,
  rubric/version, date, decision, and independence status.
- Require sources or a reproducible search record for universal refutation or
  absence-of-evidence claims. Otherwise state only that SSTIM has not assessed
  or recorded evidence.
- Rewrite the public-claim gate so a claim authorizes copy only when subject,
  supporting direction, modality, population/context, review/currency, and
  citation requirements all match.
- Add adversarial fixtures: a high-tier refuting claim, an irrelevant modality,
  an expired/provisional review, a dangling citation, and a population mismatch
  must not authorize public copy.

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

- Model Web Annotation text with `oa:bodyValue` or `oa:TextualBody`, enumerate
  valid motivations, and validate target IRIs.
- Default annotations to private and fail closed on invalid visibility.
- Separate authentication IDs from public agent identifiers; public identity
  linkage requires explicit consent.
- Reify ecosystem relationships/engagements so agent, target, type, source,
  purpose, curator, and consent decision remain associated.
- Represent notification, response, amendment, and withdrawal as append-only
  PROV activities rather than overwritten strings.

**Phase 1 gate:** OWL reasoning and domain/range lint pass; negative SHACL
fixtures fail for the intended reasons; no public-claim authorization succeeds
with refuting, mismatched, provisional, or uncited evidence; runtime annotation
serialization is valid and private by default.

### Phase 2 — session observations and unwanted experiences

This phase implements the ordinary BSC Lab history use case that motivated the
ADR 0025 review.

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
| D — Exposure/evidence repair | Domain fixes, claim split, review provenance, public-copy authorization | A; semantic ADR |
| E — SKOS/alignment repair | Neural/stimulus frequency split, roles, controlled-value plumbing, mapping provenance | D where evidence links migrate |
| F — Ecosystem/annotation repair | Reified engagements, consent history, valid OA, private defaults | A; privacy review |
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
