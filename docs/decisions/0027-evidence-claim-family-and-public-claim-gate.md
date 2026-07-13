# ADR 0027 — Separate evidence assessments from non-evidence statements

**Status:** Proposed — 2026-07-13

Amends P7.1 and P7.3 of
[ADR 0018](0018-evidence-integrity-and-public-claim-governance.md): evidence
constraints apply to evidence assessments, not hypotheses, questions, or
observations, and every assessment has an identified evidence basis. It does
not replace ADR 0018 P7.2; that preset-level claim check remains provisional
until [ADR 0028](0028-atomic-claim-propositions-and-public-expressions.md) and
[ADR 0029](0029-bsc-lab-public-claim-publication-profile.md) are accepted and
their replacement is implemented for a named release surface.

Supersedes only the property name chosen in
[ADR 0013](0013-evidence-support-relation-range.md), preserving its
`Preset ∪ SensoryStimulationTechnique` range. Implements KR-06 and the
evidence-role/provenance part of KR-11 from the
[RDF audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md).
KR-04, exact public-copy authorization, remains open under ADRs 0028–0029.

## Context

The live graph has 38 explicit `sstim:EvidenceClaim` nodes:

- 10 literature-assessment candidates in `instances/evidence/`;
- one preset-local assessment candidate; and
- 27 experiment statements dual-typed as
  `sstim-ex:ExposureEffectClaim` and `sstim:EvidenceClaim`.

The 27 experiment statements are heterogeneous. They include hypotheses,
questions, boundary applicability, protocol requirements, design concepts,
and capability-status declarations. Treating all of them as evidence gives
tiers and review metadata to statements that have no evidence basis.

The overload also makes `ExposureProfileShape` require `hasEffectClaim ≥ 1`.
The Sensory Field exporter therefore fabricates a generic calm/arousal
“evidence claim” for a profile that may only describe delivery. Meanwhile,
`supportsRelation` encodes a supporting direction in the property name even
when the assessment is refuting or inconclusive, and the current modality
scheme mixes sensory modality with study model and synthesis type.

The reviewed migration disposition for every affected node is normative input
to this decision:
[ADR 0027 migration ledger](../ontology/ADR_0027_MIGRATION_LEDGER.md).

## Decision

### 1. Classify by epistemic role

Introduce or retain distinct information-artifact classes:

| Class | Meaning | Evidence-bearing? |
|---|---|---|
| `sstim:EvidenceAssessmentClaim` | A versioned assessment of an identified evidence basis, including literature or a governed study/analysis output | yes |
| `sstim-ex:ExposureHypothesis` | A testable proposition asserting an expected relation, difference, or direction | no |
| `sstim-ex:ResearchQuestion` | An open question that asserts no expected result | no |
| `sstim-ex:BoundaryApplicabilityStatement` | A reasoned statement that a named comfort or safety boundary applies to a profile or channel | no |
| `sstim-ex:ProtocolRequirement` | A reproducibility, measurement, context, or study-design requirement | no |
| `sstim-ex:ExposureDesignObjective` | A desired delivery capability or experience that does not predict an observed effect | no |
| `sstim-ex:PlannedOutcomeSpecification` | A dimension and collection/comparison plan, not an observation result | no |
| `sstim-ex:KnowledgeStatusAssertion` | A scoped, dated assertion that assigns an existing controlled `KnowledgeStatus` value to an identified subject | no |

Existing `ExperimentContext`, `DeviceCapability`, `KnowledgeStatus`,
`ComfortBoundary`, and `ExposureLimit` structures are reused for declarations
that do not need a new statement node. `KnowledgeStatus` remains the class of
controlled values; it is not used as the class of a status record. A
`KnowledgeStatusAssertion` has exactly one incoming
`sstim-ex:hasKnowledgeStatusAssertion` subject link, exactly one existing value
through `sstim-ex:hasKnowledgeStatus`, exactly one
`sstim-ex:knowledgeAsOfDate` (`xsd:date`), and at least one of:

- `sstim-ex:knowledgeScope`, an object property naming the corpus or scope; or
- `sstim-ex:knowledgeScopeNote`, a datatype property with a language-tagged
  literal.

SHACL expresses that alternative with `sh:or`; the object and datatype
properties remain distinct. The assertion is immutable and has exactly one
`prov:wasGeneratedBy` `sstim-ex:KnowledgeStatusActivity`, a subclass of
`prov:Activity`. That activity records time, method/corpus revision, and a
qualified responsible agent/role. The assertion carries no evidence tier,
claim direction, basis, or review metadata.

`sstim:EvidenceAssessmentClaim` is the sole concrete evidence-assessment class
introduced by this ADR. Every instance has exactly one `sstim:hasEvidenceTier`
and exactly one `sstim:hasClaimDirection`, plus the qualified basis and bounded
proposition defined below. No other role above may carry those evidence fields,
and only an `EvidenceAssessmentClaim` may be reviewed by an
`EvidenceReviewDecision`. It may become an input to a future authorization
decision, but it never authorizes public copy by itself.

`sstim:EvidenceClaim` remains a stable compatibility superclass and is not
marked deprecated while active subclasses use it. SHACL rejects a bare direct
instance that lacks a concrete evidence subtype. It also rejects a node typed
both `EvidenceAssessmentClaim` and any non-evidence role. Every migrated
top-level node governed by this split has exactly one epistemic role from the
table. The role families are declared pairwise disjoint with
`owl:AllDisjointClasses` and are exclusive in SHACL; intentional subclassing
such as `ExposureMeasurementRequirement ⊆ ProtocolRequirement` does not count
as a second role. These axioms reinforce, but do not replace, the operational
checks.

Session reports and participant- or instrument-attributed observations are
never `EvidenceClaim`. This ADR does not mint their final classes. ADR 0025,
change set C, and a dedicated observation/privacy decision will define them.
An observation can contribute to an assessment only through a separately
governed study/analysis output with provenance, consent, and access controls.

### 2. Make exposure statements optional and role-specific

Remove `hasEffectClaim minCount 1` from `ExposureProfileShape`. A delivery
profile with no hypothesis or question states neither. The runtime exporter
must not generate placeholder hypotheses, questions, boundary statements, or
evidence assessments.

Replace the overloaded link with the following role-specific properties. They
have the stated OWL ranges but no OWL domains; SHACL checks the allowed source
classes without creating types by inference.

| Property | Allowed source | Range |
|---|---|---|
| `sstim-ex:hasHypothesis` | `ExposureProfile` or `SensoryStimulationProtocol` | `ExposureHypothesis` |
| `sstim-ex:hasResearchQuestion` | `ExposureProfile` or `SensoryStimulationProtocol` | `ResearchQuestion` |
| `sstim-ex:hasBoundaryApplicability` | `ExposureProfile` or `StimulusChannel` | `BoundaryApplicabilityStatement` |
| `sstim-ex:hasProtocolRequirement` | `ExposureProfile`, `StimulusChannel`, or `SensoryStimulationProtocol` | `ProtocolRequirement` |
| `sstim-ex:hasDesignObjective` | `ExposureProfile` or `SensoryStimulationProtocol` | `ExposureDesignObjective` |
| `sstim-ex:hasPlannedOutcome` | `ExposureProfile` or `SensoryStimulationProtocol` | `PlannedOutcomeSpecification` |
| `sstim-ex:hasKnowledgeStatusAssertion` | `Preset`, `SensoryStimulationTechnique`, `SensoryStimulationProtocol`, `ExposureProfile`, or `StimulusChannel` | `KnowledgeStatusAssertion` |

Every boundary-applicability statement uses
`sstim-ex:appliesBoundary` at least once; its range is the union of
`ComfortBoundary` and `ExposureLimit`. The incoming profile/channel link
identifies the application target. Existing direct `hasComfortBoundary` and
`hasExposureLimit` links remain valid structural shortcuts but do not replace
the qualified applicability statement when a rationale is asserted.

Requirements identify the protocol, profile, or channel they constrain. An
`ExposureMeasurementRequirement` is a narrower `ProtocolRequirement`, not an
effect claim. Design objectives and planned outcomes stay distinct from
hypotheses and from observations actually collected during a session.

`sstim-ex:concernsEffectDimension` loses its
`ExposureEffectClaim` OWL domain. Its allowed subjects are enforced with
role-specific SHACL so using it on a hypothesis or question cannot re-infer the
deprecated class.

`sstim-ex:hasKnowledgeStatus` also loses its incomplete OWL domain. SHACL
permits it on protocols, profiles, channels, capabilities, the new statement
roles, and `KnowledgeStatusAssertion` as appropriate. This both admits the
`DeviceCapability` use promised by its definition and prevents a migrated
non-evidence statement from being pushed back into `EvidenceClaim` semantics.

Deprecate `sstim-ex:ExposureEffectClaim` and `sstim-ex:hasEffectClaim`. The 27
active nodes migrate exactly as specified in the ledger. All lose evidence-only
tier, direction, review, and evidence-modality properties; no blanket retype is
permitted.

### 3. Use a neutral subject relation for assessments

Add `sstim:evaluatesSubject` with no OWL domain and the ADR 0013 range union of
`sstim:Preset` and `sstim:SensoryStimulationTechnique`. Every assessment has
exactly one value. Assessment direction remains exclusively in
`sstim:hasClaimDirection`.

Deprecate `sstim:supportsRelation` as a subproperty of
`sstim:evaluatesSubject`. For 0.7.x, curated assessments explicitly materialize
exactly one value for each predicate because raw-RDF clients do not necessarily
run RDFS inference. SHACL `sh:equals` requires both predicates to name the same
object before entailment. Remove the old OWL domain from `supportsRelation` as
well. Authoritative SHACL validation runs over the asserted source graph before
entailment and uses a SPARQL check for a direct
`rdf:type sstim:EvidenceAssessmentClaim` triple; a legacy predicate alone can
never create or validate an assessment.

Other roles do not use `evaluatesSubject`; their profile, protocol, boundary,
session, and dimension links remain role-specific.

### 4. Require an evidence basis and separate evidence axes

Introduce `sstim:BibliographicReference` as the general bibliographic-source
class and make the existing `sstim:PublicSafeReference` its subclass. The
latter remains a legacy metadata/venue-audit classification; neither class
implies permission to quote, reproduce, or display a source.

Every `EvidenceAssessmentClaim` has at least one qualified basis through
`sstim:hasEvidenceBasis`. Each `sstim:EvidenceBasis` has exactly one
`sstim:basisSource`, which is one of:

- a `sstim:BibliographicReference`;
- a `sstim:GovernedResearchOutput`; or
- an immutable `sstim:EvidenceSearchRecord` supporting a scoped search result.

`sstim:GovernedResearchOutput ⊑ prov:Entity` covers a versioned study record,
dataset revision, or analysis output admitted as evidence. It has exactly one
immutable `sstim:SourceGovernanceRecord` through
`sstim:hasSourceGovernanceRecord`. That record identifies the source version
and digest, custodian/owner, access classification, derivation provenance,
applicable consent/ethics basis or an explicit not-applicable determination,
and permitted use/release scope. It also records generation time and a
qualified responsible agent/role. A bare `prov:Entity` or ungoverned dataset
cannot satisfy `basisSource`.

`sstim:citesReference` ranges over the general bibliographic class. For every
bibliographic basis source, the assessment carries an explicit matching
`citesReference` triple for 0.7 compatibility; a citation that is not connected
to a qualified basis does not satisfy the assessment shape. Publication
clearance belongs to ADR 0029.

Because hypotheses no longer masquerade as evidence, ADR 0018's
rank-conditional citation exception is retired: every evidence assessment has
a basis, regardless of tier. A speculative hypothesis needs no basis because
it is not an evidence assessment.

Every assessment evaluates exactly one immutable, atomic
`sstim:AssessmentProposition` through `sstim:assessesProposition`. The
proposition has:

- exactly one `sstim:propositionSubject`, in the ADR 0013 preset/technique
  union, matching the assessment's materialized `evaluatesSubject` value;
- exactly one `sstim:propositionOutcome`, an identified
  `sstim:EvidenceOutcomeConcept`; existing exposure `EffectDimension` values
  may be reused where their meaning fits;
- exactly one `sstim:hasAssessmentScope` value;
- exactly one `sstim:hasPropositionForm`; and
- at least one exact `sstim:propositionText` language literal or immutable
  `sstim:propositionDigest`.

This ADR introduces `sstim:EvidenceOutcomeConcept` as a controlled endpoint,
response, or mechanism category, not an observed result or benefit. The
exposure class `sstim-ex:EffectDimension` becomes its subclass so existing
dimension values can be reused without ad hoc dual typing. Multiple subjects or
outcomes require separate propositions and assessments.
An `sstim:AssessmentScope` records identified modality,
population/study-model, protocol/context, and comparator values through
`sstim:scopeSensoryModality`, `sstim:scopePopulationOrModel`,
`sstim:scopeInterventionOrContext`, and `sstim:scopeComparator`. Each dimension has
at least one named resource or an explicit controlled unknown, not-reported, or
not-applicable value; omission never means universal applicability. Introduce
`sstim:EvidencePropositionForm` as the controlled range of
`hasPropositionForm`, with bounded relation, bounded null result, scoped search
finding, and universal absence values. Universal-absence propositions never
conform. A scoped search finding requires an `EvidenceSearchRecord` basis.

The four scope properties are object properties:

| Property | Allowed range |
|---|---|
| `sstim:scopeSensoryModality` | `sstim:SensoryModality` or `sstim:ScopeMarker` |
| `sstim:scopePopulationOrModel` | `sstim:PopulationDescriptor`, `sstim:StudyModel`, or `sstim:ScopeMarker` |
| `sstim:scopeInterventionOrContext` | `sstim:Preset`, `sstim:SensoryStimulationTechnique`, `sstim:SensoryStimulationProtocol`, `sstim:SensoryStimulationIntervention`, `sstim-ex:ExperimentContext`, `sstim-ex:ExposureProfile`, or `sstim:ScopeMarker` |
| `sstim:scopeComparator` | `sstim:ComparatorDescriptor` or `sstim:ScopeMarker` |

This ADR introduces `sstim:PopulationDescriptor`,
`sstim:ComparatorDescriptor`, and `sstim:ScopeMarker` as identified
information/controlled-value classes. Human explanation uses separate
language-note properties, not mixed object/literal ranges. On each axis, one or
more concrete values are mutually exclusive with the unknown, not-reported,
and not-applicable markers; a shape rejects their co-occurrence.

`hasClaimDirection` now means whether the qualified bases support, are mixed
on, are inconclusive about, or refute that exact proposition. `hasEvidenceTier`
rates that assessment, not the underlying source or public-copy permission.
This bounded proposition/scope is the input later policy profiles use to test
outcome, modality, population, and protocol applicability. If ADR 0028 is later
accepted, it may align this assessment-specific proposition with the generic
claim-proposition model without changing this ADR's evidence semantics.

Each basis records orthogonal metadata rather than one overloaded modality tag:

1. `sstim:basisSensoryModality`, using canonical `SensoryModality` values;
2. `sstim:basisModalityApplicability`, with distinct controlled values for
   mixed modalities, unknown/not reported, and not applicable;
3. `sstim:basisIntervention`, identifying the studied technique, protocol,
   intervention, or exposure profile;
4. `sstim:basisStudyDesign`;
5. `sstim:basisStudyModel` and `sstim:basisStudyPopulation`; and
6. `sstim:basisSynthesisType`.

Introduce controlled-value classes `sstim:ModalityApplicability`,
`sstim:StudyDesign`, `sstim:StudyModel`, and `sstim:EvidenceSynthesisType` as
the ranges of the corresponding properties. `basisSensoryModality` ranges over
the existing `sstim:SensoryModality` class. `basisIntervention` ranges over the
union of `sstim:SensoryStimulationTechnique`,
`sstim:SensoryStimulationProtocol`, `sstim:SensoryStimulationIntervention`, and
`sstim-ex:ExposureProfile`.

Zero canonical sensory modalities is allowed only with an explicit
modality-applicability value. Known combined modalities list every supported
canonical modality and may additionally state mixed applicability.
`PRECLINICAL` maps to model/stage, `REVIEW` to synthesis type, and `BREATH` to
an explicit `basisIntervention`; `GENERAL` is not mapped as a wildcard because
mixed, unknown, and not applicable are different states.

Source-specific results use distinct basis properties:
`sstim:basisObservedOutcome`, `sstim:basisStudyPopulation`,
`sstim:basisComparator`, and `sstim:basisObservedEffectDirection`. Their values
are IRIs in `sstim:EvidenceOutcomeConcept`, `sstim:PopulationDescriptor`,
`sstim:ComparatorDescriptor`, and the existing `sstim:EffectDirection` class,
respectively. Supplementary text uses distinct `sstim:basisOutcomeNote`,
`sstim:basisPopulationNote`, and `sstim:basisComparatorNote` language-literal
properties; it does not replace the assessment proposition. The legacy
assessment-summary properties `sstim:evidenceOutcome`, `sstim:studyPopulation`,
`sstim:comparator`, and `sstim:hasEffectDirection` are deprecated in
authoritative data. A non-
authoritative 0.7 compatibility view may derive them only when a single
unambiguous basis makes the mapping lossless.

When an assessment combines heterogeneous sources, metadata stays on the
individual basis/source contribution rather than being flattened onto the
assessment. The assessment proposition and scope state the narrower conclusion
actually reached across those bases.

Deprecate `sstim:hasModalityTag`, `sstim:EvidenceModalityTag`, and
`sstim-v:EvidenceModalityScheme` for new authoritative data. A generated 0.7
compatibility view may dual-publish only mappings the ledger marks lossless;
the old property, class, scheme, and values are removed no earlier than 1.0.

### 5. Record assessment, search, and review provenance without imposing policy

An evidence assessment is an immutable revision. A correction creates a new
IRI linked with `prov:wasRevisionOf`; the previous revision is explicitly
superseded or invalidated. `dct:modified`, when present on a revision, is frozen
at creation and is never advanced in place.

An `sstim:EvidenceAssessmentActivity ⊑ prov:Activity` generates the revision:
the assessment points to it with `prov:wasGeneratedBy`; the activity
`prov:used` every qualified basis, its source, and the immutable rubric/method
revision actually applied. Responsible agent and role use
`prov:qualifiedAssociation` with `prov:agent` and `prov:hadRole`; activity times
and rationale describe the assessment event. The rubric IRI/version,
assessment date, and association are mandatory for new assessments.

An `sstim:EvidenceReviewActivity ⊑ prov:Activity` `prov:used` exactly one
assessment revision plus the review rubric/policy revision and generates an
immutable `sstim:EvidenceReviewDecision`. Its qualified association identifies
reviewer and role. The decision has `prov:wasGeneratedBy` that activity,
identifies the same assessment through exactly one
`sstim:reviewsAssessment`, identifies the rubric/policy through
`sstim:reviewRubric`, records `prov:generatedAtTime`, and carries a matching
`prov:qualifiedAttribution` for reviewer and role. It keeps three independent
controlled properties/axes:

- `sstim:hasReviewerRelationship`: self, same organization, external, or
  unknown;
- `sstim:hasIndependenceDetermination`: independent, not independent, or
  undetermined. An independent/not-independent determination has exactly one
  `sstim:independencePolicy` and at least one `sstim:conflictDisclosure`
  record, including an explicit no-conflict-declared record where applicable;
  and
- `sstim:hasReviewDecision`: confirm, request revision, or reject.

External relationship never implies independence. A later decision explicitly
supersedes or invalidates the earlier decision; there is at most one
non-invalidated decision per assessment revision and rubric/policy. No mutable
“effective review” pointer is stored on the assessment.

SHACL/SPARQL requires the decision's assessment, rubric/policy, reviewer/role,
and generation time to equal the corresponding `prov:used`, qualified
association, and activity-time values on its generating review activity. Merely
co-occurring in the same graph is insufficient.

The legacy `ReviewStatus` scheme becomes a derived workflow summary only:
`reviewProvisional` means no current decision under the named rubric,
`reviewReviewed` means a current recorded decision exists regardless of its
outcome or independence, and `reviewNeedsUpdate` means the prior decision was
invalidated or an explicit re-review trigger exists without a replacement.
`reviewedBy`, `evidenceDate`, and `hasReviewStatus` are deprecated in
authoritative data. A labeled, non-authoritative 0.7 compatibility view may
derive them from the current decision and assessment generation date; it is
excluded from validation and authorization.

An `sstim:EvidenceSearchActivity ⊑ prov:Activity` generates an immutable
`sstim:EvidenceSearchRecord`. The activity carries execution times and a
qualified responsible agent/role. The record carries sources/databases, exact
query, coverage dates, eligibility criteria, result count, and a content
digest. A search basis points to that record through `basisSource`.

A finite search supports only “no eligible evidence found within this scope as
of this date.” It can never support the universal assertion that no evidence or
mechanism exists. Empirical refutation must target a bounded proposition and
have an evidence basis. Otherwise create a `KnowledgeStatusAssertion` such as
`unknownToSSTIM` (“not assessed”) or `noKnownEvidenceInSSTIM` (“no evidence
recorded in the named SSTIM corpus”), with its repository scope and as-of date.

The migration does not invent historical review events, rubrics, searches, or
dates. Each retained legacy candidate produces a new versioned assessment IRI
through a migration-dated assessment activity. The new revision has
`prov:wasDerivedFrom` the legacy record, and the activity has an honest
qualified association. A review decision is added only if its provenance can
be established. The legacy IRI becomes a deprecated tombstone linked to its
replacement; it is not silently redefined as the first immutable revision.

### 6. Preserve compatibility without preserving the semantic error

For 0.7.x active data:

- assessment nodes explicitly carry both `EvidenceAssessmentClaim` and
  `EvidenceClaim`; this correct superclass typing may remain indefinitely;
- assessment subject links carry both `evaluatesSubject` and deprecated
  `supportsRelation`;
- legacy evidence-modality tags occur only in the generated compatibility view
  and only where the migration ledger defines a lossless mapping;
- legacy outcome/population/comparator/effect-direction summaries occur only
  in that view and only when a single basis makes them unambiguous; and
- raw-RDF and RDFS-entailing compatibility queries are both tested.

Deprecated `supportsRelation`, `ExposureEffectClaim`, `hasEffectClaim`, legacy
review and evidence-summary properties, and obsolete modality terms are removed
no earlier than 1.0. Active non-evidence nodes do not retain false
`EvidenceClaim` typing for compatibility. The generated legacy view is labeled
non-authoritative and excluded from validation and any authorization input.

Implementation may land in reviewable internal patches, but the 0.7 release
activates the new classes, shapes, context, migrated data, exporter, browser
queries, documentation, and fixtures together. Protected ontology sources are
changed only after this ADR is accepted.

## Effect on public-claim governance

This ADR deliberately does not redesign public claims. ADR 0018 P7.2 remains
the live provisional preset-metadata check and must not be weakened while its
replacement is Proposed or unimplemented. It is not an exact-copy authorization
gate and must not be described as one. If ADR 0028 is accepted before an
applicable profile is implemented, P7.2 becomes reject-only: passing it never
authorizes publication, and publication fails closed.

ADR 0028 will model atomic claim propositions, rendered expressions, and
non-exclusive claim facets. ADR 0029 will own BSC-specific thresholds,
prohibitions, consent, evidence applicability, trusted release inputs, and the
publisher gate. Consequently, this ADR does not claim to resolve KR-04.

## Required implementation fixtures

Positive fixtures cover a literature assessment with its atomic proposition,
scope, qualified basis, and assessment activity; a governed-research-output
basis with its governance record; a scoped search finding and its search
record/activity; an attributed scoped knowledge-status assertion; a review
decision with all three review axes; a hypothesis; a research question; a
boundary-applicability statement; a protocol requirement; a design objective;
a planned-outcome specification; and a delivery-only profile.

Negative fixtures prove that none of the following conforms:

- a bare `EvidenceClaim`;
- an assessment with no evidence basis;
- an assessment missing or repeating its evidence tier or claim direction;
- an assessment with no atomic proposition, outcome, complete explicit scope,
  or exact proposition text/digest;
- an assessment with no explicit `evaluatesSubject`, or a node that has only
  deprecated `supportsRelation` and no direct assessment type;
- an assessment whose `evaluatesSubject` and compatibility `supportsRelation`
  values differ;
- a bibliographic citation not represented by a matching qualified basis;
- a governed research output with no complete source-governance record;
- a basis with zero canonical modalities and no explicit applicability value;
- a knowledge-status assertion missing its single subject/value, scope, or
  as-of date, or lacking its attributed generating activity;
- a review decision missing any review axis, or two non-invalidated decisions
  for the same assessment and rubric/policy;
- an independent/not-independent determination with no independence policy or
  conflict-disclosure record;
- a review decision whose assessment, rubric, attribution, or time disagrees
  with its generating activity;
- a hypothesis, question, requirement, design objective, planned outcome,
  boundary statement, or observation with evidence-only tier/review metadata;
- a node combining an assessment and non-evidence role;
- a node assigned two top-level epistemic roles;
- a boundary-applicability statement with no `appliesBoundary` value;
- a proposition marked as universal absence/nonexistence even when a finite
  search exists;
- a scoped “no eligible evidence found” assessment without an
  `EvidenceSearchRecord` basis;
- `PRECLINICAL` or `REVIEW` used as sensory modality;
- a generated delivery profile containing a fabricated placeholder statement;
  or
- a session observation satisfying an evidence-assessment shape.

The migrated runtime artifact must be Turtle-parseable, SHACL-conformant, and
semantically equivalent to its committed golden fixture. Compatibility tests
must query 0.7.x assessment data through both old and new types/predicates
without relying on inference.

## Alternatives considered

- **Keep one class and add a role flag.** Rejected: a missing or forged flag
  would let a non-evidence artifact satisfy evidence shapes again.
- **Retype all 27 nodes as hypotheses.** Rejected: the reviewed ledger contains
  questions, boundaries, requirements, design concepts, and status statements.
- **Use one generic `aboutSubject` on all roles.** Rejected: sessions, profiles,
  channels, limits, presets, and techniques do not share the ADR 0013 range.
- **Keep rank-conditional evidence bases.** Rejected: the old exception exists
  only because hypotheses were incorrectly typed as evidence.
- **Require external-independent review in the core ontology.** Rejected:
  review relationship is provenance; authorization requirements belong to a
  named policy profile.
- **Adopt SEPIO/OBI wholesale.** Deferred until the local operational model is
  stable and the browser import cost is justified.

## Consequences

- Runtime delivery descriptions no longer invent evidence.
- Literature and governed-study assessments remain queryable through the
  compatibility superclass while non-evidence roles cannot enter evidence
  workflows accidentally.
- Existing experiment data requires deliberate migration, including removal of
  misleading tier/review metadata.
- Evidence provenance becomes more verbose but separates source characteristics
  from the assessment made about them.
- Public-claim authorization remains unresolved but is no longer falsely
  claimed as part of this semantic repair.

## Approval decision

The class boundary, per-instance migration, neutral subject relation, bounded
assessment proposition/scope, evidence basis and axes, source governance,
qualified provenance, compatibility window, observation firewall, and deferred
public-claim scope are settled by this text and its ledger.

**Recommended disposition: Accept.** The status remains Proposed until the
maintainer explicitly accepts this final text. Acceptance authorizes the
ontology implementation described here; it does not accept ADR 0028 or 0029.

## See also

- [ADR 0013](0013-evidence-support-relation-range.md) — original assessment-subject range.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — evidence constraints and provisional preset-level claim check.
- [ADR 0022](0022-0.6-release-review-posture.md) — maintainer review posture.
- [ADR 0025](0025-hed-bids-interoperability-crosswalk.md) — observations-not-conclusions and privacy posture.
- [ADR 0028](0028-atomic-claim-propositions-and-public-expressions.md) — policy-neutral public-claim semantics.
- [ADR 0029](0029-bsc-lab-public-claim-publication-profile.md) — BSC Lab publication policy and release gate.
