# SSTIM Ontology Improvement Plan

Status: active planning document
Baseline reviewed: SSTIM ontology `0.3.0`
Last reviewed: 2026-06-18

This document is the repo-truth backlog for ontology and vocabulary maturity
work after the `0.3.0` release. It records known modeling gaps, the main
design improvement to pursue next, and the priority order for follow-up tasks.

It is not a release note and not an ADR. When a task below becomes a concrete
modeling decision that changes semantics, create or update an ADR and link the
affected RDF terms with `rdfs:seeAlso`.

## Current Assessment

SSTIM `0.3.0` is publishable and useful as an application ontology for BSC Lab:
versioning, frozen snapshots, w3id publication, SKOS labels, external
alignment notes, and baseline SHACL validation are in place.

It is not yet optimal as a mature research-grade domain ontology. The next
phase should prioritize tighter validation contracts and cleaner conceptual
separation over adding many new terms.

Structured review snapshot:

- SSTIM classes: 31
- Object properties: 24
- Datatype properties: 40
- SKOS concept schemes: 11
- SKOS concepts: 102
- SHACL node shapes: 9
- Current validation command: `make validate PYSHACL='python3 -m pyshacl'`

## Primary Design Improvement

Separate physical delivery from perceived sensory modality.

The current `sstim:techniqueModality` property links techniques directly to
`sstim:SensoryModality`. That is adequate for simple audio cases, but it
overloads at least three distinct questions:

- what physical energy or medium is delivered;
- what sensory or perceptual channel is engaged;
- what device or hardware capability is required.

This matters for cross-modal and non-consumer cases:

- vibroacoustic stimulation is acoustic plus somatosensory;
- focused ultrasound is physical acoustic energy but not ordinary auditory
  perception;
- visual flicker and photic stimulation need luminance/display constraints;
- haptic stimulation needs actuator capability and body contact;
- breath pacing is interoceptive/behavioral guidance rather than simply an
  output modality.

Target model direction:

- Keep `sstim:SensoryModality` for perceived or engaged sensory channels.
- Add a separate delivery/energy vocabulary, for example
  `sstim:PhysicalDeliveryModality` or `sstim:DeliveryMedium`.
- Add properties such as:
  - `sstim:perceivedModality`
  - `sstim:deliveryMedium`
  - `sstim:requiresDeviceCapability`
- Keep `sstim:techniqueModality` only if it is narrowed and documented as a
  convenience property, or deprecate it after replacement properties exist.

This design change should be written as an ADR before RDF changes are made.

## Known Gaps

### Validation Coverage

SHACL currently covers the most immediate data paths, but not the ontology
surface evenly. Missing or weak areas:

- no technique shape;
- no Martigli voice shape;
- no Martigli-Binaural voice shape;
- no self-report shape;
- no framework/protocol/implementation shapes;
- no shape requiring technique metadata such as mechanism, temporal structure,
  and modality/delivery metadata;
- limited controlled-vocabulary integrity checks.

### Evidence Modeling

`sstim:EvidenceClaim` is useful but still shallow. It does not yet distinguish
outcome, population, comparator, claim direction, effect polarity, review date,
or provenance of the tier assignment. This limits systematic evidence review
and makes future claim updates harder to audit.

The property `sstim:supportsRelation` has a domain but no range. Its definition
says it links evidence claims to presets or techniques, but that target set is
not machine-constrained.

### Preset and Protocol Semantics

`sstim:Preset` is currently aligned as an OBI protocol while its definition
says a preset follows a protocol but is not itself the protocol. This tension
should be resolved before the ontology is used by external consumers who will
infer from upper-ontology alignments.

Preferred direction:

- keep `sstim:Preset` as an information content entity;
- express protocol relation with `sstim:followsProtocol`;
- reserve protocol alignment for `sstim:SensoryStimulationProtocol`.

### SKOS Scheme Structure

Several flat schemes are valid SKOS but have no `skos:hasTopConcept` values or
scheme root. This weakens generic SKOS navigation and makes browser behavior
more application-specific than it needs to be.

Affected flat schemes include:

- CautionTagScheme
- EvidenceModalityScheme
- PermutationFunctionScheme
- SensoryModalityScheme
- StimulationMechanismScheme
- TechniqueScheme
- VoiceTypeScheme

### Technique Metadata Consistency

The `0.3.0` technique vocabulary is rich, but not all technique individuals
carry the same key metadata. Known gaps:

- BSC framework technique instances lack delivery/perceived modality and
  temporal-structure metadata.
- `techUltrasoundNeuromod` lacks modality metadata under the current model.
- Folk-technique entries intentionally lack proposed mechanisms, but that
  exception should be validated explicitly rather than left implicit.

### Safety Modeling

Caution tags are useful as labels, but they do not yet model severity,
triggering condition, affected population, recommended action, contraindication
style warnings, display language, or device thresholds.

Safety metadata should remain conservative: advisory wellness metadata, not
medical contraindication claims.

### External Alignments

The verified external-reference layer is much stronger after the `0.2.0`
erratum, but several alignments remain pending:

- SNOMED CT sensory-stimulation procedure alignment;
- MeSH sensory-stimulation alignment;
- additional Wikidata technique items;
- Music Ontology `mo:Score`, pending reliable host verification.

## Priority Tasks

### P0: Correct Semantic Ambiguities

1. Resolve `sstim:supportsRelation`.
   Choose either a constrained union range or split properties such as
   `sstim:supportsPreset` and `sstim:supportsTechnique`.

2. Resolve `sstim:Preset` versus protocol semantics.
   Remove or replace the misleading OBI protocol alignment if the preset is
   not intended to be inferred as a protocol.

3. Create an ADR for physical delivery versus perceived sensory modality.
   Do this before changing `sstim:techniqueModality`.

### P1: Strengthen Validation

1. Add `TechniqueShape`.
   Require mechanism, temporal structure, and modality/delivery metadata, with
   explicit exceptions for catalogued non-evidence-bearing techniques.

2. Add Martigli and Martigli-Binaural voice shapes.
   Validate breathing-period, transition, amplitude, carrier-pair, and hybrid
   constraints from the technical docs.

3. Add `SelfReportShape`.
   Validate 1-5 rating ranges, optional consent-dependent fields, and
   `goalAchieved` boolean typing.

4. Add framework/protocol/implementation shapes.
   Require labels, definitions/descriptions, and the core relation fields that
   make those resources navigable.

5. Add SKOS integrity shapes.
   Validate `skos:inScheme`, notation presence where expected, preferred-label
   language coverage for public vocabulary concepts, and top-concept structure.

### P2: Improve Vocabulary Structure

1. Add top concepts or explicit scheme-root concepts to flat schemes.
2. Complete definitions or scope notes for remaining lightly documented
   concepts such as frequency sub-bands and basic sensory modalities.
3. Add notation policy per scheme, including whether root concepts like
   `allFrequencyBands` require notation.
4. Align BSC framework technique instances with the technique vocabulary
   metadata model.

### P3: Deepen Evidence and Safety Semantics

1. Add evidence claim dimensions:
   outcome, population, comparator, claim direction, effect polarity, evidence
   date, reviewer, and review status.

2. Add safety metadata dimensions:
   severity, trigger condition, affected population, recommended action,
   display priority, and device constraints.

3. Model device capability separately from modality:
   headphones, stereo separation, display flicker, haptic actuator, sensor,
   wearable, ultrasound hardware, and closed-loop EEG/sleep sensing.

### P4: External Alignment and Interoperability

1. Verify and add pending SNOMED CT and MeSH alignments.
2. Re-check Music Ontology availability before re-enabling `mo:Score`.
3. Add JSON-LD context or examples if external consumers begin using SSTIM
   outside the BSC Lab runtime.
4. Add competency questions and SPARQL query tests for the ontology use cases.

## Acceptance Criteria for Next Maturity Step

The next maturity step should be considered complete when:

- all P0 tasks are resolved or explicitly rejected with ADR rationale;
- `make validate PYSHACL='python3 -m pyshacl'` covers techniques, self-reports,
  framework/protocol/implementation resources, and key SKOS integrity rules;
- every technique individual either has mechanism, temporal, and modality or
  delivery metadata, or is explicitly marked as a non-evidence-bearing
  catalogued entry;
- flat SKOS schemes are navigable through top concepts or documented as
  intentionally flat;
- evidence and safety backlog items are represented in issues, ADRs, or RDF
  tasks before the next ontology release.
