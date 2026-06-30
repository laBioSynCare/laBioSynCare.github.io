# SSTIM Ontology Improvement Plan

Status: active planning document
Baseline reviewed: SSTIM ontology `0.3.0`
Last reviewed: 2026-06-30

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
- SHACL node shapes: 17 (+ exposure 0.4.0 shapes for `ExposureLimit`, the
  `hasExposureLimit` link, and quantitative-property ranges) + 1 SHACL-SPARQL
  constraint on `PresetShape` (breathing invariant)
- Current validation command: `make validate PYSHACL='python3 -m pyshacl'`

> Counts above are the `0.3.0` baseline plus the 2026-06 SHACL work; the class
> and property counts grow as the P0/P3 tasks below add terms. Re-snapshot at the
> next tagged release rather than per-commit.

### 0.4.0 follow-up (exposure module / Sensory Field — ADR 0011)

Delivered: per-ear / per-eye laterality placements (`skos:broader` children of
the bilateral parents); quantitative stimulus datatype properties
(`hasFrequencyHz`, `hasFlickerRateHz`, `hasBeatFrequencyHz`, `hasDutyCycle`,
`hasGainLevel`, `hasPhaseOffset`); the `sstim-ex:ExposureLimit` class with
quantified flicker/hearing/optical limits citing external standards, linked from
comfort boundaries; `affordsDeliveryMedium`; and corrected UV/IR definitions.
This substantially advances P3 item 3 (device capability vs modality) and part of
P3 item 2 (safety metadata).

**Done — 2026-06-21:** the **conditional** check that a `StimulusChannel`
delivering UV or IR (or carrying a flicker rate) must declare the matching comfort
boundary is now enforced by `StimulusChannelShape` (two `sh:SPARQLConstraint`s:
UV/IR → `boundaryOpticalRadiation`, flicker → `boundaryPhotosensitivity`). The one
affected committed instance (`wearable-light-audio-channel`) was reconciled.
Runtime flicker enforcement also exists in `src/ui/safety/flashSafety.js`.

### SHACL quick-wins (2026-06-20)

Delivered the low-risk subset of P1 (Strengthen Validation):

- `VoiceShape` now enforces subtype membership with `sh:xone` over the four
  disjoint voice subtypes, replacing the weak `rdf:type sh:minCount 2` check.
  pyshacl runs without OWL inference, so the `owl:AllDisjointClasses` axiom alone
  was not validated at the data level.
- `FrequencyBandShape` now checks `hzMin <= hzMax` via `sh:lessThanOrEquals`
  (equality allowed for the single-point bands `alpha-10` and `gamma-40`).
- `SelfReportShape` (P1 item 3) — 1–5 rating ranges and `goalAchieved` boolean
  typing, all optional/consent-dependent.
- `FrameworkShape` / `ProtocolShape` / `ImplementationShape` (P1 item 4) —
  minimal `rdfs:label` requirement, matching the Preset label rule.
- `sstim-exposure.ttl` version header reconciled to `0.4.0` with `owl:versionIRI`;
  removed unused `eco:`/`rdf:` prefixes from core and shapes.

Still open in P1: `TechniqueShape` (item 1), Martigli / Martigli-Binaural voice
shapes (item 2), and SKOS integrity shapes (item 5).

### SHACL P1 shapes — Technique + SKOS integrity (2026-06-20)

Delivered the next tranche of P1, scoped to what the committed data supports at
Violation severity (so `make validate` stays green without repo-wide
`--allow-warnings`):

- `TechniqueShape` (P1 item 1, partial) — every `sstim:SensoryStimulationTechnique`
  must declare a `sstim:proposedMechanism`, **or** be flagged non-evidence-bearing
  with a `skos:editorialNote` (`sh:or` admits either; the two folk techniques
  `techSolfeggioTuning` / `techSubliminalAudio` take the editorial-note branch).
  Temporal-structure and delivery-modality requirements are **deferred to P2 item
  4**: the BSC framework technique instances (and `sstim-v:techUltrasoundNeuromod`)
  lack that metadata, so enforcing it now would either fail validation or need
  `--allow-warnings`. Align the instances first, then promote those to Violation.
- `ConceptIntegrityShape` (P1 item 5, partial) — every `skos:Concept` must declare
  at least one `skos:inScheme` and carry an English (`@en`) `skos:prefLabel`
  (verified: 260/260 concepts already satisfy both). Top-concept structure for the
  remaining flat schemes is **deferred to P2 item 1** (several schemes still have
  no `skos:hasTopConcept`).

### SHACL P1 shapes — Martigli voice shapes (2026-06-20)

Resolved the last open P1 validation item (item 2) by first taking the modeling
decision in [ADR 0012](../decisions/0012-martigli-voice-parameters.md) (Accepted,
Option A):

- Added six per-voice Martigli parameter properties to `sstim-patch-studio.ttl`
  (`martigliCenterFreq`, `martigliAmplitude`, `martigliPeriodInitial`,
  `martigliPeriodFinal`, `martigliTransitionDuration`, `isBreathReference`), each
  with `rdfs:domain sstim:Voice` and `rdfs:seeAlso` to the ADR — distinct from the
  session-level `breathingPeriod*` override properties.
- `MartigliVoiceShape` requires `martigliCenterFreq` + the arc params and forbids
  the carrier pair; `MartigliBinauralVoiceShape` requires the `carrierFreqLeft` /
  `carrierFreqRight` pair + the arc params and forbids `martigliCenterFreq`. Both
  enforce the CLAUDE.md §4.5 `mp0 ≥ 3 when isOn` rule via `sh:or`.
- Added a breathing-enabled seed preset
  (`instances/presets/heal-theta-breathing-seed.ttl`) with a Martigli-Binaural
  breathing-reference voice and a non-reference Martigli textural voice, so both
  shapes are exercised by `make validate` (negative-tested: deliberate violations
  are caught).

The preset-level breathing invariant (`hasBreathGuide` true iff exactly one voice
has `isOn` = true; ≤ 1 breathing reference per preset) is now enforced too: a
`sh:SPARQLConstraint` on `PresetShape` counts the breathing-reference voices and
compares to `hasBreathGuide` (the first SHACL-SPARQL rule in the shapes graph;
pyshacl runs it without extra flags). Negative-tested for both the wrong-count and
wrong-flag cases.

## Primary Design Improvement

Separate physical delivery from perceived sensory modality.

The current `sstim:techniqueModality` property links techniques directly to
`sstim:SensoryModality`. That is adequate for simple audio cases, but it
overloads at least three distinct questions:

- what physical energy or medium is delivered;
- what sensory or perceptual channel is engaged;
- what device or hardware capability is required.

Raw Portuguese/English maintainer notes that motivated the exposure model are
preserved in
[`raw-notes/2026-06-18-exposure-maintainer-notes.md`](raw-notes/2026-06-18-exposure-maintainer-notes.md).
The normalized design question is: what can SSTIM represent about biohacking,
sensory stimulation, delivery media, device capabilities, perceived modalities,
body placement, evidence status, and BSC Lab's current delivery limits?

This matters for cross-modal and non-consumer cases:

- vibroacoustic stimulation is acoustic plus somatosensory;
- focused ultrasound is physical acoustic energy but not ordinary auditory
  perception;
- visual flicker and photic stimulation need luminance/display constraints;
- haptic stimulation needs actuator capability and body contact;
- high-volume or low-frequency audio can become tactile or body-perceived, so
  audio delivery should not be treated as purely auditory without body-contact,
  amplitude, frequency, distance, and comfort context;
- breath pacing is interoceptive/behavioral guidance rather than simply an
  output modality;
- stereoscopy, free-view 3D, phone-in-front-of-eye usage, VR headsets, AR
  glasses, and hand-separated phone viewing require visual capability and
  perceptual-loss modeling, not only a `visual` tag;
- social-graph sensory protocols can combine visualized social structure,
  conversation, sound, and collective aesthetic experience, so experiment
  context must remain separate from the core exposure channel;
- Wi-Fi, screen light, power cables, and other electromagnetic exposures are
  modelable physical delivery media, but SSTIM should mark their stimulation
  or physiological-effect status as unknown, speculative, or unsupported unless
  an explicit reviewed evidence claim exists;
- smell and taste are SSTIM-relevant modalities, but ordinary phone smell,
  taste, perfumes on devices, or device-contact taste should be separated from
  current BSC Lab delivery capability;
- ideal tactile/VR immersion needs vocabulary for clothing contact, liquid or
  gel immersion, rigid surfaces, moving/static textures, temperature, airflow or
  fluid motion, pull/push on body points, joint force, gravity-like effects, and
  wearable arrays of speakers or light emitters;
- volumetric or room-scale immersion needs modeling for walking, movement,
  body/position tracking, spatial presence, proprioception, vestibular cues,
  scale, and environmental boundaries.

Target model direction:

- Keep `sstim:SensoryModality` for coarse perceived or engaged sensory
  channels.
- Keep `sstim:techniqueModality` unchanged for compatibility, but document it
  as a coarse legacy/convenience relation.
- Add the `sstim-ex:` exposure module with separate classes and properties for
  exposure profile, stimulus channel, physical delivery medium, perceived
  modality, device capability, body placement, comfort boundary, effect claim,
  experiment context, and knowledge status.
- Represent physiological, wellness, comfort, or risk statements as
  `ExposureEffectClaim` resources with evidence/knowledge status, not as direct
  unqualified health-benefit properties such as `usageForHealth` or
  `healthImpact`.
- Include explicit knowledge statuses for local certainty and local capability:
  known in SSTIM, hypothesis in SSTIM, unknown to SSTIM, no known evidence in
  SSTIM, not currently used in BSC Lab, not currently deliverable by BSC Lab,
  and outside BSC Lab scope.
- Maintain exploratory examples for Wi-Fi/EM exposure, haptic audio, blinking
  visual fields, colored noise, darkness/silence, social-graph protocols,
  smell/taste boundaries, and ideal tactile immersion.

## Known Gaps

### Validation Coverage

SHACL now covers the major data paths evenly: presets, all four voice types,
evidence claims (with `supportsRelation` range), techniques (mechanism + temporal +
modality), self-reports, framework/protocol/implementation resources, frequency
bands, exposure quantitative properties and limits, the preset breathing invariant
(SHACL-SPARQL), and SKOS concept/scheme integrity (`inScheme`, `@en` label,
`notation`, top-concept navigability). Remaining validation gaps:

- evidence- and safety-dimension shapes, which depend on first adding those
  dimensions (P3 items 1–2).

(The conditional exposure check — UV/IR or flicker channels must declare the
matching comfort boundary — was added 2026-06-21 as `StimulusChannelShape`.)

(Self-report and framework/protocol/implementation shapes were added in the
2026-06-20 SHACL quick-wins; `TechniqueShape` and `ConceptIntegrityShape` in the
2026-06-20 P1 follow-up; `MartigliVoiceShape`/`MartigliBinauralVoiceShape` in the
2026-06-20 Martigli work (ADR 0012); `TechniqueShape` was promoted to full
metadata and `ConceptSchemeShape` added in the 2026-06-21 P2 work.)

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
- Folk-technique entries intentionally lack proposed mechanisms; this exception
  is now validated explicitly — `TechniqueShape` requires `proposedMechanism`
  **or** a `skos:editorialNote` (`sh:or`), so the carve-out is machine-checked.

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

The outward-facing publication and interlinking strategy (DBpedia Archivo,
Wikidata, Wikimedia, OBO posture, LOV/BioPortal/OLS/FAIRsharing/Zenodo, FAIR
packaging) is owned by a companion document,
[`PUBLICATION_AND_INTERLINKING_PLAN.md`](PUBLICATION_AND_INTERLINKING_PLAN.md),
and tracked here as **P6**.

### Domain Content Coverage

`0.3.0` is structurally sound but **auditory-skewed** in domain content. The
technique vocabulary is explicitly "auditory and cross-modal"; visual and tactile
stimulation are under-represented relative to the platform's audiovisual + haptic
ambition. Known coverage gaps (tracked as **P5** below):

- **Visual entrainment** exists only as example strings (`photic driving`) and the
  `mechGamma40` note — no visual technique concepts (photic/flicker driving, SSVEP,
  audiovisual entrainment, neutral color/chromatic stimulation).
- **Tactile / cross-modal** entrainment is limited to the single
  `techVibroacoustic` cross-modal entry; no first-class audiovisual or
  audio-tactile technique concepts.
- **No neutral tuning vocabulary.** A=432 vs A=440 can only be filed under the
  mystical `techSolfeggioTuning`; there is no neutral `tuningReferenceHz` parameter
  and no musical-interval/consonance terms.
- **Evidence lives in prose, not data.** The richest evidence content sits in
  `skos:definition`/`scopeNote` strings rather than queryable `EvidenceClaim`
  instances citing cleared references — the new P3 claim dimensions are still
  scaffolding without populated claims.
- **Modality nomenclature drift.** The `modalitySomatosensory` label
  "Somatosensory / Haptic" mixes a device word into a perceptual-channel concept,
  and the two parallel modality vocabularies (`sstim-v:modality*` vs
  `sstim-ex:modality*`) risk diverging.

## Remaining Work — Execution Order (2026-06-30)

P1 validation is essentially complete (see the dated notes above): voice,
technique, self-report, framework/protocol/implementation, and SKOS-integrity
shapes are in place, plus the first SHACL-SPARQL constraint. The remaining
backlog is sequenced below by dependency — later phases assume earlier ones.

1. **P0 — semantic ambiguities** (foundational; external consumers infer from
   these upper-ontology alignments). Resolve `supportsRelation` range and the
   `Preset`-vs-protocol OBI alignment. Each is an ADR-bearing decision
   (ADR 0013, ADR 0014).
2. **P2 — vocabulary structure** (unblocks the P1 partials). Top concepts (P2.1)
   let `ConceptIntegrityShape` require scheme navigability; aligning technique
   instances (P2.4) lets `TechniqueShape` promote temporal/modality from absent
   to required. Then definitions/scope notes (P2.2) and notation policy (P2.3).
3. **Exposure conditional check** — **(Done — 2026-06-21)** `StimulusChannelShape`
   (SHACL-SPARQL): a `StimulusChannel` delivering UV/IR or carrying a flicker rate
   must declare the matching comfort boundary.
4. **P3 — evidence & safety semantics**: evidence-claim dimensions (P3.1),
   safety-metadata dimensions (P3.2), device capability vs modality (P3.3).
5. **P4 — external alignment & interop**: SNOMED CT / MeSH / Wikidata (P4.1 —
   every external identifier verified before it is added, never fabricated),
   Music Ontology re-check (P4.2), JSON-LD context (P4.3), competency questions
   and SPARQL query tests (P4.4).
6. **P5 — domain content coverage**: visual + tactile/cross-modal technique
   vocabulary, neutral tuning vocabulary, populated evidence-claim instances, and
   modality-nomenclature cleanup. Targets the `0.5.0` release. These are additive
   vocabulary decisions (ADR-bearing), sequenced after the P0–P3 structural work
   they depend on.
7. **P6 — first-class publication & interlinking**: FAIR packaging, registries,
   and external linkage, owned by
   [`PUBLICATION_AND_INTERLINKING_PLAN.md`](PUBLICATION_AND_INTERLINKING_PLAN.md).
   Its FAIR-packaging phase (Phase 0) is semantics-free and may start immediately;
   its registry/Wikidata/Archivo phases gate on P5 reaching `0.5.0` so the
   published scope is not misleadingly auditory-only.

Each phase ships as its own validated PR. As items land, their Priority-Task
entry below is marked Done with the date and the delivering artifact.

## Priority Tasks

### P0: Correct Semantic Ambiguities

1. Resolve `sstim:supportsRelation`. **(Done — 2026-06-21, [ADR 0013](../decisions/0013-evidence-support-relation-range.md))**
   Constrained union range `Preset ∪ SensoryStimulationTechnique` (single property
   kept), enforced at the data level by `EvidenceClaimShape`.

2. Resolve `sstim:Preset` versus protocol semantics. **(Done — 2026-06-21, [ADR 0014](../decisions/0014-preset-is-not-a-protocol.md))**
   `Preset` is `iao:0000030` only (OBI protocol alignment removed); the protocol
   alignment now lives on `SensoryStimulationProtocol`, and `followsProtocol`
   carries the preset→protocol relation. (Open: whether `SensoryStimulationTechnique`
   should also drop `obi:0000272` — flagged in ADR 0014, tracked under P4.)

3. Implement the exposure/delivery/modality separation.
   ADR 0010 records the decision. The active work item is the `sstim-ex:`
   exposure module plus exploratory BSC Lab experiment instances. Keep
   `sstim:techniqueModality` as a coarse compatibility property.

### P1: Strengthen Validation

1. Add `TechniqueShape`. **(Done — 2026-06-21)**
   Requires `proposedMechanism`, `hasStimulusTemporalStructure`, and
   `techniqueModality` at Violation severity — or a `skos:editorialNote` marking a
   deliberately catalogued entry (non-evidence-bearing folk technique, or a
   no-perceived-modality entry such as `techUltrasoundNeuromod`). Enabled by the
   P2 item 4 metadata alignment below.

2. Add Martigli and Martigli-Binaural voice shapes. **(Done — 2026-06-20, via [ADR 0012](../decisions/0012-martigli-voice-parameters.md))**
   `MartigliVoiceShape` and `MartigliBinauralVoiceShape` validate the amplitude,
   breathing-period trio, carrier-pair (MB) / center-frequency (Martigli), and the
   §4.5 `mp0 ≥ 3 when isOn` constraint, backed by the six new `martigli*` voice
   properties (ADR 0012, Option A) and a breathing-enabled seed preset. The
   preset-level `hasBreathGuide`/single-`isOn` invariant is also enforced now, via a
   `sh:SPARQLConstraint` on `PresetShape`.

3. Add `SelfReportShape`. **(Done — 2026-06-20)**
   Validate 1-5 rating ranges, optional consent-dependent fields, and
   `goalAchieved` boolean typing.

4. Add framework/protocol/implementation shapes. **(Done — 2026-06-20, minimal)**
   Require labels, definitions/descriptions, and the core relation fields that
   make those resources navigable. Initial pass requires `rdfs:label` only;
   definitions and relation-field coverage remain open.

5. Add SKOS integrity shapes. **(Done — 2026-06-21)**
   `ConceptIntegrityShape` requires `skos:inScheme`, an `@en` preferred label, and
   `skos:notation` for every concept; `ConceptSchemeShape` requires every scheme to
   declare at least one `skos:hasTopConcept` (navigability).

### P2: Improve Vocabulary Structure

1. Add top concepts or explicit scheme-root concepts to flat schemes. **(Done — 2026-06-21)**
   All 7 previously-flat schemes (EvidenceModality, VoiceType, SensoryModality,
   StimulationMechanism, PermutationFunction, CautionTag, Technique) now declare
   `skos:hasTopConcept`; all 11 schemes are navigable and `ConceptSchemeShape`
   enforces it.
2. Complete definitions or scope notes for remaining lightly documented
   concepts such as frequency sub-bands and basic sensory modalities. **(Done — 2026-06-21)**
   Added `skos:scopeNote` to the 9 EEG sub-bands, a definition + notation to
   `allFrequencyBands`, and definitions to `modalityAuditory`/`modalityVisual`.
   Every concept now carries a definition or scope note.
3. Add notation policy per scheme, including whether root concepts like
   `allFrequencyBands` require notation. **(Done — 2026-06-21)**
   Policy: every concept — including structural roots (`allFrequencyBands`,
   notation `all`) — carries `skos:notation`. Coverage is 100% (260/260) and
   `ConceptIntegrityShape` enforces it.
4. Align BSC framework technique instances with the technique vocabulary
   metadata model. **(Done — 2026-06-21)**
   The four `bsc-fw-tech:*` techniques now declare `hasStimulusTemporalStructure`
   and `techniqueModality`; `techUltrasoundNeuromod` is marked with an
   `editorialNote` (no perceived modality). This unblocked the P1 item 1 promotion.

### P3: Deepen Evidence and Safety Semantics

1. Add evidence claim dimensions:
   outcome, population, comparator, claim direction, effect polarity, evidence
   date, reviewer, and review status.

2. Add safety metadata dimensions:
   severity, trigger condition, affected population, recommended action,
   display priority, and device constraints.

3. Model device capability separately from modality:
   headphones, stereo separation, display flicker, haptic actuator, sensor,
   wearable, ultrasound hardware, closed-loop EEG/sleep sensing, VR/AR
   headsets, free-view stereoscopy, scent/taste delivery, temperature, airflow
   or fluid-motion delivery, full-body tactile immersion, and wearable audio or
   light arrays, tactile displays/cameras, infrared or ultraviolet output,
   room-scale tracking, locomotion interfaces, and spatial presence support.

### P4: External Alignment and Interoperability

1. Verify and add pending SNOMED CT and MeSH alignments.
2. Re-check Music Ontology availability before re-enabling `mo:Score`.
3. Add JSON-LD context or examples if external consumers begin using SSTIM
   outside the BSC Lab runtime.
4. Add competency questions and SPARQL query tests for the ontology use cases.

### P5: Domain Content Coverage

Targets the `0.5.0` release. Each item is an additive, ADR-bearing vocabulary
decision; none renames or removes existing terms (minor version).

1. **Visual-entrainment technique vocabulary.** Add first-class technique
   concepts for photic/flicker driving, SSVEP-evoking stimulation, audiovisual
   entrainment (AVE), and a *neutral* color/chromatic stimulation concept — with
   an explicit `skos:editorialNote` negative assertion where "chromotherapy"
   claims appear, mirroring the `techSolfeggioTuning` pattern. *(Proposed ADR 0015.)*
2. **Tactile / cross-modal technique vocabulary.** Promote tactile rhythmic
   entrainment beyond `techVibroacoustic`, and add genuinely cross-modal
   technique concepts (audiovisual, audio-tactile) instead of single-modality
   tagging. *(Proposed ADR 0015.)*
3. **Neutral tuning vocabulary.** Add a `tuningReferenceHz` datatype property so
   A=432 vs A=440 is a neutral aesthetic parameter, distinct from the mystical
   `techSolfeggioTuning`. Decide (ADR) whether to add a minimal musical-interval /
   consonance vocabulary or to scope it out. *(Proposed ADR 0017.)*
4. **Populate evidence-claim instances.** Move evidence from prose
   (`skos:definition`/`scopeNote`) into queryable `EvidenceClaim` individuals
   citing `PublicSafeReference`s, starting with the best-supported auditory claims
   (FFR/ASSR) and the explicit negative assertions. Turns the P3.1 claim-dimension
   machinery into data.
5. **Modality nomenclature cleanup.** Resolve the `modalitySomatosensory`
   "Somatosensory / Haptic" label conflation and reduce drift between
   `sstim-v:modality*` and `sstim-ex:modality*` by adopting the convention
   **haptic = device/actuator, tactile = percept, somatosensory = superordinate
   channel, vibrotactile = mechanism** consistently.

### P6: First-Class Publication and External Interlinking

Owned by [`PUBLICATION_AND_INTERLINKING_PLAN.md`](PUBLICATION_AND_INTERLINKING_PLAN.md).
Summary of the recommended posture:

1. **FAIR packaging (semantics-free; may start now):** multi-format
   content-negotiation (Turtle/RDF-XML/JSON-LD/HTML via WIDOCO), `vann:`/VoID
   metadata, DL-consistency check in CI, JSON-LD context, and Zenodo DOIs.
2. **DBpedia — via DBpedia Archivo** (not direct): submit the dereferenceable URI,
   iterate to a 4-star rating.
3. **Wikidata — incremental:** one ontology item; conservative two-way `exact
   match` (P2888) links for already-aligned notable concepts; defer the "SSTIM ID"
   property and new concept items until adoption/notability.
4. **Wikimedia/Wikipedia — defer** on notability; Commons diagrams optional (CC BY).
5. **OBO — already linked by reference; deepen interoperability (BFO/IAO/OBI/RO),
   do not seek full membership** in the current human-readable-IRI form; reserve a
   dual-published OBO-ID bridge as a future ADR-gated option.
6. **Registries:** prefix.cc, LOV, BARTOC, BioPortal, OLS, OntoBee, FAIRsharing.

*(Proposed ADR 0016 records the publication/OBO posture.)*

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
