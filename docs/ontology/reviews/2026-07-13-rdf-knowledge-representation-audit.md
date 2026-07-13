# RDF Knowledge-Representation Audit — 2026-07-13

**Status:** maintainer-facing technical audit; no protected ontology or instance
source was changed during this review.

## Executive assessment

SSTIM has a stronger foundation than its small release number suggests. The
live modules parse, the curated graph is covered by substantial SKOS,
provenance, SHACL, reasoning, and round-trip checks, identifiers are stable, evidence is
claim-scoped, and the framework/protocol/preset/session distinction is useful.
The current baseline is not, however, ready to support ADR 0025's claimed
interoperability bridge or real user-contributed session observations.

The main problem is not a lack of terms. It is a break between four contracts:

1. what the OWL and SKOS terms say;
2. what SHACL requires;
3. what the browser and session documentation emit; and
4. what validation actually exercises.

The highest-value work is therefore contract repair, observation/provenance
design, and executable conformance fixtures—not vocabulary growth.

## Scope and method

The review covered the live `0.7.0-dev` files:

- OWL modules: `sstim-core.ttl`, `sstim-exposure.ttl`,
  `sstim-patch-studio.ttl`, and `sstim-ecosystem.ttl`;
- SKOS: `sstim-vocab.ttl` and controlled concepts in the other modules;
- validation and publication: `sstim-shapes.ttl`, `sstim-alignments.ttl`,
  `context.jsonld`, `void.ttl`, the quality audit, competency queries, snapshot
  script, and Make targets;
- all committed public instances; and
- RDF-producing runtime code for Sensory Field and Web Annotations, plus the
  documented session model.

The repository quality audit passes with 58 named OWL classes, 6 anonymous
class expressions, 141 properties, 306 SKOS concepts, 31 schemes, 38 evidence
claims, 10 exposure profiles, 1 synthetic session, and 2 self-reports. The
SPARQL sanity suite and focused runtime serialization tests also pass. These are
meaningful controls, but the findings below show important cases outside their
current coverage.

The full pinned `nix develop --command make validate` run could not start in the
review sandbox because access to the external Nix cache lock was denied. The
quality audit, SPARQL sanity suite, graph-isomorphic export check, focused tests,
local-link check, and diff check were run successfully. This audit does not
represent those partial results as a fresh HermiT/pySHACL run.

## Findings

### P0 — current outputs and asserted contracts disagree

#### KR-01 — the live Sensory Field RDF export is not SHACL-conformant

`src/ui/field/exposureProfile.js:95-105` and `147-171` create
`sstim:EvidenceClaim` nodes without claim direction, review status, evidence
date, modification date, or responsible agent. All five are mandatory in
`sstim-shapes.ttl:517-539`. The same exporter creates an exploratory protocol at
`exposureProfile.js:173-181` without a defining framework, a technique, or the
documented baseline exception required by `sstim-shapes.ttl:848-874`.

This is a production truthfulness defect: a UI labelled as exporting SSTIM RDF
emits data rejected by SSTIM. The committed example is manually richer than the
runtime output, so validation of committed instances does not catch the drift.

**Disposition:** block or clearly mark public RDF export until the serializer has
a golden-output SHACL test. Do not manufacture literature evidence merely to
satisfy the shape; remove generic claims when no claim exists or represent the
right kind of research question/safety applicability after KR-06 is resolved.

#### KR-02 — the session contract has three incompatible versions

The live ontology and fixture use a named `SessionSpecification`, string-valued
`completionStatus`, and exact `xsd:dateTime` timestamps. In contrast,
`docs/technical/SESSION_MODEL.md:394-416` uses a blank specification,
`sstim:presetVersion` on the wrong domain, an undeclared `headphoneMode`, an IRI
for a datatype property, and `xsd:dateTimeStamp`. Meanwhile the generic JSON-LD
term `created` is coerced to `xsd:date` in `context.jsonld:151`, although the
session shape requires `dct:created` as `xsd:dateTime` at
`sstim-shapes.ttl:591-593`.

No committed JSON Schema or recorder implementation establishes which contract
is authoritative. The ontology's assertion that a session specification fully
determines output (`sstim-core.ttl:185-189`) is therefore ahead of the as-built
system.

**Disposition:** define one native versioned session schema; give specifications,
instances, events, and reports stable IDs; align JSON Schema, RDF projection,
JSON-LD context, examples, and SHACL; add expand/compact and round-trip tests.

#### KR-03 — the self-report model cannot represent the stated use safely

The current five values—affect, focus, sleepiness, subjective quality, and a
goal-achieved boolean (`sstim-core.ttl:876-913`)—do not capture a declared goal,
helpfulness magnitude, prompt/instrument version, missingness, or repeatable
unwanted experiences. The class definition says optional free text is supported,
but no such property exists. Free text alone would in any event be neither
comparable nor sufficient for a safety-relevant history.

A property named `sideEffect` would be worse: it would imply a causal medical
conclusion that a participant report cannot establish.

**Disposition:** model observations with instrument/prompt provenance. Add a
direct perceived-helpfulness item and zero-or-more qualified unwanted-experience
records with category, participant-reported severity, onset/phase, duration or
persistence, action taken, resolution, optional text, and perceived relatedness.
Represent `none reported`, `not asked`, `declined`, and `unknown` distinctly.
Keep every individual report outside `EvidenceClaim` unless a separate governed
aggregation and assessment process creates an evidence claim. Replace the prose
claim that reports are “consent-governed” with a privacy profile that records the
reporting role or pseudonym, purpose/consent basis, policy version, visibility,
retention, and de-identification state. Make synthetic/public-safe status
machine-testable rather than leaving it only in comments.

#### KR-04 — the public-claim authorization query can approve the wrong evidence

The SPARQL constraint at `sstim-shapes.ttl:210-226` accepts any claim at a high
enough tier. It does not require a supporting direction, compatible modality,
population or outcome, current/reviewed status, or a valid citation. A strong
refuting or mismatched claim can therefore satisfy the public-copy gate.

**Disposition:** define an explicit applicability contract and require all of
direction, subject, modality, population/context compatibility, review state,
currency, and citation integrity before evidence can authorize a public claim.
Add adversarial negative fixtures.

### P1 — semantic repairs before adding more data

#### KR-05 — several OWL domains contradict their property definitions

Examples in `sstim-exposure.ttl` include:

- `hasExposureProfile` describes experiment instances but omits them from its
  domain (`184-189`);
- `hasBodyPlacement` describes profiles/channels/capabilities but has only the
  channel domain (`219-224`);
- perceptual gain/loss and effect-claim properties describe profiles or
  protocols but type only profiles (`233-252`);
- `hasKnowledgeStatus` omits device capability (`261-266`); and
- `hasExposureLimit` describes a boundary or capability but types only a
  comfort boundary (`282-287`).

Because an OWL domain is an inference rule rather than an input-validation
hint, using these properties on the documented subjects infers unintended
types.

**Disposition:** for each property, choose a real union domain, a broader common
domain, domain-specific subproperties, or no domain plus SHACL target rules.
Add a domain/range lint and entailment fixtures.

#### KR-06 — `EvidenceClaim` is overloaded

The model currently uses the same class family for literature assessment,
research hypotheses/questions, risk-boundary applicability, and effect claims.
Every exposure profile is required to have one (`sstim-shapes.ttl:1110-1131`),
which causes the runtime exporter to invent a generic calm/arousal claim even
when the profile only describes delivery. A photosensitivity boundary is also
represented as a speculative evidence claim.

**Disposition:** distinguish at least literature `EvidenceAssessmentClaim`,
`ExposureHypothesis` or `ResearchQuestion`, participant/measurement
`Observation`, and `SafetyBoundaryApplicability`. Make effect hypotheses
optional on a delivery profile. Preserve explicit links between these layers
without treating one as another.

#### KR-07 — patch and preset validation is weaker than the reproducibility claim

Examples include no six-voice maximum despite the class definition, incomplete
binaural difference/target checks, incomplete Symmetry constraints, and an
`initialVolume` shape that allows values far above the documented conservative
limit (`sstim-shapes.ttl:154-159`, `268-319`, and `448-453`). Many output-affecting
parameters are optional or not captured with engine/build hashes.

**Disposition:** derive a parameter matrix from the executable schema, then make
JSON Schema, SHACL, application validation, and documentation agree. Define
whether the guarantee is bit-exact, signal-equivalent, or perceptually
equivalent and record the engine, patch/spec, asset, random-seed, and binary
hashes needed for that level.

#### KR-08 — physical categories contain outcome/evidence prose

Frequency-band scope notes make unqualified associations with sleep,
relaxation, stress, pain, attention, and cognitive activation
(`sstim-vocab.ttl:75-132`). Several technique notes similarly state evidence
judgments. This bypasses the otherwise careful claim/evidence/provenance model.

The same scheme is also used both for observed neural oscillation categories and
for stimulus modulation/beat targets. A stimulus delivered at 10 Hz and an
observed alpha-band neural rhythm are not the same entity merely because their
numeric intervals overlap.

**Disposition:** keep band and technique definitions operational and physical.
Separate stimulus temporal-frequency targets from observed neural-band
classifications, connecting them through qualified hypotheses or observations.
Move response/outcome associations into scoped, dated evidence claims with
population, modality, direction, sources, and review provenance.

#### KR-09 — some external mappings overstate equivalence

The operational SSTIM frequency-band concepts are `skos:exactMatch` to Wikidata
items for observed wave/rhythm phenomena (`sstim-alignments.ttl:64-77`), and an
SSTIM stimulation technique exact-matches a beat/phenomenon item (`90-91`). The
intensions and boundaries are not demonstrably interchangeable. Mapping
assertions also lack per-mapping source version, reviewer, date, and rationale.

**Disposition:** downgrade to `closeMatch`/`relatedMatch` where appropriate and
represent mapping assertions as reviewed artifacts or an annotated mapping
graph. Use `exactMatch` only after an extension/intension test, not label
similarity.

#### KR-10 — ordered and controlled values sometimes collapse back to literals

`targetsFrequencyBand` says the “first entry” is primary
(`sstim-core.ttl:432-437`), but RDF property values are unordered.
`permutationFunction` stores an integer while a SKOS scheme exists for the same
values (`sstim-patch-studio.ttl:130-135`). These patterns discard the semantics
the vocabulary was created to provide.

**Disposition:** add explicit primary/secondary target roles or a qualified
target node. Link to controlled-value IRIs in RDF, retaining numeric codes only
as application serialization mappings with tested conversion.

#### KR-11 — evidence provenance needs a stronger review model

The evidence vocabulary combines sensory modalities with source/study types
such as `PRECLINICAL` and `REVIEW`. Uncited tier-1/2 refuting claims can state
that no evidence or mechanism exists. `reviewReviewed` is described as
independently reviewed, while current data names “BSC Lab editorial” and the
maintainer as the only accountable agent.

**Disposition:** split delivery modality, study design/evidence type,
population/model, and synthesis level. Require a citation or reproducible search
record for universal absence/refutation claims, otherwise say “not assessed” or
“no evidence recorded in SSTIM.” Model review as a PROV activity with assessor,
rubric/version, date, decision, and independence status.

#### KR-12 — runtime Web Annotation RDF and privacy defaults need repair

`src/rdf/annotations/AnnotationStore.js:180-205` places a literal behind
`oa:hasBody` rather than using `oa:bodyValue` or a `oa:TextualBody`, constructs a
motivation IRI from an unchecked string, and exports a stable Firebase-derived
user segment. New annotations default to public in both the store and UI, while
invalid visibility also falls back to public (`AnnotationStore.js:22-24,76-90`;
`AnnotationPanel.svelte:18-24`).

**Disposition:** use the Web Annotation model correctly, allow only enumerated
motivations, fail closed/default private, and separate authentication IDs from
public agent IRIs. A public identity link requires explicit consent.

#### KR-13 — ecosystem relationships and consent are flattened onto the agent

`sstim-ecosystem.ttl:79-184` places relationship types, targets, sources,
notification, response, and consent as parallel properties on an agent. With
multiple relationships or targets, the intended combinations are ambiguous;
consent also becomes global rather than purpose/record-specific. Scalar status
fields erase lifecycle history.

**Disposition:** reify an `EcosystemRelationship`/`EngagementRecord` with agent,
target, type, source, curator, purpose, and consent decision. Represent
notification, response, amendment, and withdrawal as append-only PROV
activities. Prefer IRI-valued sources where possible.

#### KR-14 — development/release and validation claims need tightening

The live core is `0.7.0-dev` but says `mod:status "released"`
(`sstim-core.ttl:50-71`). The snapshot script accepts prerelease versions and
does not verify a single version across all seven modules. The quality audit
checks context term presence but not datatype compatibility or general
domain/range use. Consequently it misses that `created`/`modified` are globally
forced to `xsd:date` although sessions and annotations use `xsd:dateTime`, that
`issued` is forced to `xsd:date` although references also use `xsd:gYear`, and
that `creator` is forced to an IRI although bibliographic authors are literals
(`context.jsonld:144-153`). Instance SHACL concatenates files into one default
graph, so one file can satisfy another and named-graph boundaries are not tested.
HermiT checks the locally merged modules but not a pinned external import closure.

**Disposition:** distinguish live-development and released status; enforce
cross-module version equality and release-only snapshot rules; add per-artifact
and per-named-graph validation, context coercion tests, domain/range lint,
negative/mutation fixtures, and a pinned minimal external closure—or narrow the
published reasoner claim explicitly.

### P2 — maturity and coverage

#### KR-15 — parallel technique identifiers need an explicit relation

The vendor-neutral technique concepts and BSC-framework technique resources are
both instances of `SensoryStimulationTechnique`, while `skos:relatedMatch` is
used to connect some framework techniques to vocabulary concepts or even voice
types (`instances/frameworks/bsc.ttl:25-80`). It is unclear whether these are
specializations, realizations, classifications, or simply related resources.

**Disposition:** answer the competency question explicitly and introduce a
domain relation such as a qualified specialization/classification link. Reserve
SKOS mapping properties for mappings between concepts in concept schemes.

#### KR-16 — multilingual and example coverage is uneven

All 306 concepts have English labels, but only 127 currently have Italian,
Portuguese, and Spanish labels; 179 are English-only. Yet repository prose calls
the vocabularies multilingual without stating the coverage boundary. The data
graph has useful examples but only one session and two reports, both on a single
happy path.

**Disposition:** publish language coverage metrics and a translation/review
policy rather than implying completeness. Add synthetic fixtures for
interrupted sessions, report refusal/missingness, multiple reports, helpful and
unhelpful outcomes, zero/multiple unwanted experiences, and adapter round trips.

#### KR-17 — runtime semantic mappings can mint undeclared ontology IRIs

Patch Studio's `src/ui/creator/semantic.js:114-165` maps several parameters to
undeclared terms such as `sstim:filterCutoffHz`, `sstim:detuneCents`, and
`sstim:flickerRateHz`; an unknown parameter is converted to an arbitrary
`sstim:{paramName}` IRI. Visual and haptic track types also point mostly to broad
modality concepts rather than the relevant pattern/capability terms. Namespace
registries have drifted between `context.jsonld`, `src/rdf/namespaces.js`, and
hard-coded bases in graph/UI code.

The Sensory Field export is additionally lossy: it omits visual colors and
several depth/grid parameters, gives monaural and binaural per-ear channels the
same beat-frequency predicate, and records no application/model version or
configuration checksum.

**Disposition:** generate contexts, JS factories, graph IRIs, and documentation
from one reviewed namespace registry. Make semantic mappings a closed, tested
registry of declared IRIs and treat unknown mappings as explicitly unmapped.
Either label the Sensory Field RDF as a lossy exposure summary or link it to a
complete, versioned configuration artifact with a checksum.

## What is already good and should be preserved

- Stable IRIs, immutable release snapshots, and separation of term space from
  implementation data.
- The framework → protocol → implementation → preset → specification → instance
  distinction.
- Dual OWL/SKOS typing for controlled values when the OWL class genuinely
  classifies the concept.
- Claim-scoped evidence with direction, tier, dates, provenance, and public-safe
  references.
- Conservative non-clinical language and an explicit boundary between
  participant reports and evidence.
- Materialized SKOS navigation, local context coverage, loader-manifest checks,
  VoID count checks, and graph-isomorphic serialization tests.

The next plan should strengthen these choices rather than replace the model.
See the [RDF improvement plan](../IMPROVEMENT_PLAN.md) for ordered change sets and
[ADR 0025](../../decisions/0025-hed-bids-interoperability-crosswalk.md) for the
session/HED/BIDS consequences.
