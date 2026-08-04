# Changelog

All notable changes to the **SSTIM ontology** — the versioned, citable artifact at
`https://w3id.org/sstim` — are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/). Release tags are `vX.Y.Z`; each tagged
version is frozen byte-identical under `static/ontology/X.Y.Z/`.

**Scope.** This tracks the reusable ontology term-space — every module listed in
[`static/ontology/manifest.json`](static/ontology/manifest.json), which is the
authoritative bill of materials, together with the profile entry points that
name their closures.
BSC Lab application and infrastructure work is tracked in [ROADMAP.md](ROADMAP.md)
and [TODO.md](TODO.md). The rationale for each change lives in the
[ADRs](docs/decisions/) and the `skos:historyNote`s on the ontology nodes; this
file is the human-readable summary.

## [Unreleased]

## [0.13.0] - 2026-08-04

Published under version DOI `10.5281/zenodo.21792692`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

The modular release. Everything below was previously listed as unreleased; the
architecture is now frozen, citable, and served from the persistent namespace.

### Changed

- **The ontology is now a set of modules behind named profiles, not one root
  file.** `sstim-core.ttl` was a catch-all mixing stimulation, techniques,
  protocols, neuromodulation, evidence, configuration, sessions, caution
  metadata, and BSC voice terms. Its 385 declared terms are redistributed across
  18 manifest-owned modules, each with one authoritative source, one ontology
  IRI, and a declared direct dependency set. **No term was added, removed, or
  renamed** — 385 declared terms before and after — and the Full union preserves
  0.12.0 semantics at 9,977 normalized triples, verified by
  `make full-equivalence`. `sstim-core.ttl` is now the dependency-free Kernel:
  `sstim:Stimulation` and `sstim:SensoryStimulation`, and nothing else. See
  [ADR 0043](docs/decisions/0043-sstim-core-profile-and-module-boundaries.md)
  and the [module architecture guide](docs/ontology/MODULE_ARCHITECTURE.md).
- **`sstim-ex:StimulusChannel` keeps its IRI but changes owner and definition.**
  Its authoritative declaration moves from Exposure to Stimulus so the Core
  Profile does not depend on the optional Exposure concern, and its definition
  broadens from "a channel within an exposure profile" to cover a stimulus
  specification as well. Existing exposure channels retain their meaning; the
  public IRI is unchanged, and `https://w3id.org/sstim/exposure` now serves a
  Stimulus + Exposure namespace catalogue so the IRI still dereferences to its
  declaration. See [ADR 0044](docs/decisions/0044-stimulus-channel-core-ownership.md).
- **`sstim:hasStimulationTarget` declares no domain in Core.** Its
  `StimulusSpecification`/`SessionSpecification` union domain moves intact to
  the Session module, so Core does not depend on Session. Session and Full
  restore exactly the 0.12.0 inference. The union stays one RDF list: several
  `rdfs:domain` statements would intersect rather than union.

### Added

- **Four profile entry points** — Kernel, Core, Core Plus, and Full — each a
  W3C Profiles Vocabulary `prof:Profile` with an exact semantic closure, an
  explicitly associated SHACL closure, and a declared inference mode. A
  consumer can now implement a bounded contract instead of the whole graph.
- **`manifest.json` and `manifest.schema.json`** as the authoritative bill of
  materials. The Makefile, loader, exporter, snapshotter, and release checks
  derive their inventories from it rather than repeating hand-maintained lists.
- **Distinct retrieval endpoints** where a namespace IRI is not a single
  module: `https://w3id.org/sstim/kernel` for the Kernel and
  `https://w3id.org/sstim/module/exposure` for Exposure. `/sstim` and
  `/sstim/exposure` serve generated namespace catalogues for hash-term
  dereference and are not import endpoints.
- **A reusable weak Core SHACL package** (`sstim-core-shapes.ttl`) alongside the
  retained Full aggregate, with a positive fixture and an executable contract
  proving Core accepts a determinate stimulus without Full delivery, placement,
  modality, or safety policy leaking into its validation.
- Two Full property shapes, `sstim-sh:StimulusSpecificationChannelLinkShape` and
  `sstim-sh:StimulusSpecificationTargetLinkShape`, hardening the optional
  channel and target links under inference mode `none` (ADR 0044).

### Release engineering

- **The version IRI resolves to the whole release, not to one file.** `make
  snapshot` now freezes a namespace catalogue beside the modules, because
  `sstim-core.ttl` stopped being the whole ontology when it became the Kernel.
  The route generator refuses to emit a bare-version route for a modular
  snapshot that lacks one.
- **Every profile carries an executed conformance contract** — a positive
  fixture and a SPARQL competency query, plus out-of-scope and adversarial
  fixtures wherever a SHACL closure exists to give those categories meaning
  ([ADR 0045](docs/decisions/0045-shapeless-profiles-are-discovery-entry-points.md)).
- **`void.ttl` describes the release it names.** The quality audit now derives
  its module set from the frozen manifest, so a catalogue is never counted as a
  module, and every frozen module must have a subset that distributes it.
- **New guards** for divided `rdfs:domain`/`rdfs:range` axioms, unpublishable
  w3id redirect targets, and Turtle prose being parsed as an axiom.

### Fixed

- **Release dates are now part of the release gate.** `make snapshot` refuses a
  snapshot unless every module header declares `dct:issued` = `dct:modified` =
  the release date (today, or `RELEASE_DATE=YYYY-MM-DD`), with `dct:created`
  no later. `dct:issued` had never been bumped past the ontology's first issue
  date, so registries that read it as the version release date reported every
  version as released on 2026-04-12 — visible as BioPortal's **Released** column
  across all eight SSTIM submissions, corrected there by hand on 2026-07-27.
  Metadata and tooling only; no term changed. See
  [`docs/ontology/README.md`](docs/ontology/README.md#release-gate-make-snapshot).

## [0.12.0] - 2026-07-31

Published under version DOI `10.5281/zenodo.21717988`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Description-layer release ([ADR 0041](docs/decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md),
[ADR 0042](docs/decisions/0042-stimulus-specification.md)).

### Added

- Added `sstim-stimulus.ttl`, the eighth release module, with
  `sstim:StimulusSpecification`, the determinate/stochastic/adaptive regime,
  engine-independent channel quantities, and the optional stimulation-target
  axis.
- Added session-level track disabling, master brightness, and scheduled-start
  properties pending the broader core/module extraction.

### Changed

- Redefined `sstim:Preset` as an engine-dependent configuration rather than the
  stimulation itself; stimulus specifications are the cross-engine comparison
  layer.
- Retained generic `Track` and its four subtypes, asserted `Voice` below
  `AudioTrack`, and renamed Patch Studio's control concepts to LFO and
  Permutation in its persisted model.

### Removed

- Withdrew the three-day-old `sstim:Patch` class before downstream adoption;
  `Preset` covers the generic engine-configuration role.

## [0.11.0] - 2026-07-24

Published under version DOI `10.5281/zenodo.21536124`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Gate A (release integrity) + Gate B (semantic stabilization) of the
[2026-07-24 RDF structure and publication audit](docs/ontology/reviews/2026-07-24-rdf-structure-and-publication-audit.md).
Additive and backward-compatible: no term removed; the only narrowing
(`sstim:SelfDirectedNeuromodulation`, see below) had zero instance-level blast
radius. Targets `0.11.0` — bumped from a MINOR, not a patch, because Gate B
adds real new classes and properties on top of Gate A's metadata-only fixes.

### Fixed (Gate A — release integrity)
- The frozen `0.8.0`-`0.10.0` snapshots each self-cite the `v0.7.0` Zenodo DOI
  (`10.5281/zenodo.21380171`) and citation string instead of their own version
  DOI (RDF-01). Removed the stale `dct:hasVersion` / `dct:bibliographicCitation`
  from `sstim-core.ttl` and `void.ttl` pending this version's Zenodo DOI
  reservation (the `0.5.0` release shipped under the same
  no-version-DOI-at-freeze-time precedent).
- Fixed the `v0.10.0` history entry's leftover "under development" qualifier
  against its own `mod:status "released"`.
- Synchronized every module's `owl:versionInfo` and header `# Version:` /
  `# Date:` comments (six modules still said `0.7.0`).
- Fixed `void.ttl`'s stale `dct:modified` date and `void:triples`/`void:classes`/
  `void:properties` counts (updated again after Gate B's new terms).
- Fixed the repository-root `README.md`'s stale ontology-graph counts
  (105/14/214/369/43 → 134/18/231/445/50) and protocol count (12 → 9).
- Removed the `"@type": "@id"` coercion on `dcat:distribution` in
  `context.jsonld` (RDF-02): it silently dropped all 96 triples describing
  `void.ttl`'s blank-node distributions when compacted with RDFLib.

### Fixed (Gate B — semantic stabilization, [ADR 0037](docs/decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md))
- `sstim:SelfDirectedNeuromodulation` contradicted its own inherited genus
  (`sstim:Stimulation` requires an applied input; the class's own definition
  included practices with none) (RDF-04). Added `sstim:DeliberateSelfRegulation`
  as the neutral genus above no-applied-stimulus practices (unguided
  meditation, volitional breathwork); narrowed `SelfDirectedNeuromodulation`
  to stimulus-mediated cases only (neurofeedback, biofeedback,
  paced-breathing guidance).
- The sensory branch of `sstim:Neurostimulation` was named in prose but never
  asserted in the class hierarchy, so neurostimulation-hierarchy queries
  silently excluded sensory examples (RDF-05). Added
  `sstim:SensoryNeurostimulation` / `sstim:SensoryNeurostimulationTechnique`
  as the intersection of `Neurostimulation` and `SensoryRouteNeuromodulation`
  (not a blanket subclass axiom, so self-directed sensory-route cases like
  sonification biofeedback correctly stay excluded); retyped
  `sstim-v:techGamma40Auditory` accordingly.
- Documented (not restructured) the decision to keep `sstim-v:techBiofeedback`
  a broad, neutral technique rather than split it into narrower
  neural/peripheral variants, since the neural-modulation objective is not
  equally definitional across its autonomic/muscular/electrodermal forms.
- Three `sstim-exposure.ttl` properties (`hasBodyPlacement`,
  `hasPerceptualGain`, `hasPerceptualLoss`, `hasExposureLimit`) had an RDFS
  domain narrower than their own definitions documented; widened to accurate
  union domains (RDF-09).
- Removed two duplicate scheme definitions (`StimulusTemporalStructureScheme`,
  `TechniqueScheme` — the latter's second definition was stale and
  sensory-only) and fixed the stale Sensory Field SHACL test preamble comment
  that still described the export as non-conformant (RDF-15).
- Completed the `EvidenceModalityScheme`/`EvidenceModalityTag` deprecation:
  the scheme and its nine concept values stayed active while the class and
  property were already deprecated (RDF-13); all now carry `owl:deprecated
  true` and point to the replacement basis-axis properties.
- `sstim:targetsFrequencyBand`'s "first entry is primary" claim doesn't hold —
  RDF property values are unordered (RDF-08, concrete sub-bug only). Added
  `sstim:primaryFrequencyBand`, a functional sub-property, with a SHACL-SPARQL
  constraint requiring it to be one of the preset's own `targetsFrequencyBand`
  values. The larger RDF-08 finding (oscillation-band vs. stimulus-target vs.
  outcome-hypothesis conflation) is deferred — see `FrequencyBandScheme`'s
  `skos:editorialNote`.
- Re-audited the five frequency-band-to-Wikidata `skos:exactMatch` mappings
  (RDF-17): downgraded to `skos:closeMatch`, since each Wikidata item is the
  observed-EEG-oscillation sense while SSTIM's bands are also used, unsplit,
  as stimulus-frequency targets — extensional identity can't be claimed at
  `exactMatch`'s confidence until RDF-08's split lands.
- Added the missing `bfo:0000016` ("disposition") display-label stub, used by
  `sstim:Neuroplasticity` (RDF-17).

### Added
- `sstim:DeliberateSelfRegulation`, `sstim:SensoryNeurostimulation`,
  `sstim:SensoryNeurostimulationTechnique`, `sstim:primaryFrequencyBand`.
- `scripts/context-roundtrip-check.py` + `make context-roundtrip`: round-trips
  every top-level and instance document through the *published*
  `context.jsonld` (not RDFLib's auto-generated one), wired into
  `make validate`.
- `scripts/verify-snapshot-checksums.mjs` + `make verify-snapshots`:
  checksums every recorded `static/ontology/<version>/` snapshot against
  `static/ontology/snapshot-checksums.json` and fails on drift; every future
  `make snapshot` records its own checksums automatically. Wired into
  `make validate`.
- The GitHub Pages workflow now runs `make test` (the full Vitest suite)
  before publishing, not only `make validate` (RDF-11): the runtime SHACL
  goldens and ecosystem-contract tests previously ran only in the independent
  lint workflow, so Pages could publish while one of them failed.

### Still open (this pass does not do this)
- An erratum still needs to be published against the already-archived
  `0.8.0`-`0.10.0` Zenodo records noting their self-citation defect; that
  content cannot be corrected in place.
- The whole-set version-manifest/checksums for a *dereferenceable* frozen
  closure (RDF-03, beyond the checksum ledger) and RDF-06/07/08 (full
  split)/10/14/16/18/19 are separate, larger gates and are not part of this
  pass.

## [0.10.0] - 2026-07-24

Published under version DOI `10.5281/zenodo.21528717`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Participant engagement and neurostimulation release
([ADR 0035](docs/decisions/0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](docs/decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)),
from the 2026-07-22 Dr. Theo Marins (University of Graz) interview on
neuromodulation. Additive; no term removed or renamed. Frozen `0.3.0`–`0.9.0`
snapshots are untouched.

### Added
- Participant-engagement-mode facet: `sstim:ParticipantEngagementMode` class,
  `sstim:participantEngagementMode` property, and a three-concept scheme
  (passive-receptive / guided-following / active-self-regulatory) — a sixth axis
  orthogonal to the five ADR 0034 facets.
- `sstim:Neurostimulation` (the stimulation-based branch of interventional
  neuromodulation) and the browsable `sstim:NeurostimulationTechnique`, with the
  seven energy techniques (rTMS, tDCS, tACS, DBS, VNS, ECT, focused-ultrasound)
  typed under it; the self-directed / interventional split
  (`sstim:SelfDirectedNeuromodulation`, `sstim:InterventionalNeuromodulation`);
  and `sstim:Neuroplasticity` as a `bfo:disposition` stub.
- `sstim-v:techElectroconvulsiveTherapy` in the non-sensory contrast set;
  `sstim-v:techNeurofeedback` and `sstim-v:techBiofeedback` as self-directed
  neuromodulation techniques.
- `sstim-v:NeuromodulatoryEffectCollection` naming the effect sense of
  neuromodulation over the outcome-phenomenon facet; invasive /
  minimally-invasive / non-invasive SKOS collections over the delivery-approach
  values.

### Changed
- `sstim:Neuromodulation` scope refined: pinned to the intervention sense
  (distinct from the physiological effect sense), excluding spontaneous
  physiological neurotransmitter-level modulation but admitting deliberate
  self-directed neuromodulation. `skos:note`s on `sstim:Neuromodulation` and
  `sstim:Neurostimulation` spell out the intervention-vs-effect and
  with-vs-without-participant-engagement axes.
- `sstim-v:techNeurofeedback` and `sstim-v:techBiofeedback` re-typed from the
  neutral `sstim:StimulationTechnique` layer to `sstim:NeuromodulationTechnique`.

## [0.9.0] - 2026-07-22

Published under version DOI `10.5281/zenodo.21493918`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Stimulation and neuromodulation release ([ADR 0034](docs/decisions/0034-neuromodulation-relation-and-neural-target-axis.md)).
SSTIM gains a neutral stimulation layer and formalizes how sensory stimulation
relates to neuromodulation: the two **overlap**, and neither subsumes the other.
Subsuming sensory stimulation under neuromodulation would assert neural
modulation for every delivery instance, smuggling a mechanism claim into a class
defined as delivery-only and bypassing the evidence layer.

**Breaking on mutable latest**, for consumers of the retyped focused-ultrasound
technique and the five deprecated response-as-mechanism IRIs. Frozen `0.3.0`–
`0.8.0` snapshots are untouched and retain their published entailments.

### Added
- Neutral `sstim:Stimulation` umbrella and `sstim:Neuromodulation` sibling at the
  process, intervention, technique, and protocol layers, with the overlap named
  at each layer as a defined `owl:intersectionOf` class requiring an intended
  canonical sensory-transduction route.
- Five orthogonal facet axes — neural access route, delivery approach, neural
  target site, neural system, and neural phenomenon — as 56 new multilingual SKOS
  concepts across five schemes, plus 13 facet properties. Kept separate because a
  route, a dynamic, a system, and an outcome domain are not values on one scale;
  one value set is reused across intended, proposed-mechanism, and
  observed-outcome roles by distinct properties.
- Six non-sensory neuromodulation techniques — rTMS, tDCS, tACS, DBS, vagus nerve
  stimulation, and targeted intrathecal delivery — populating three distinct
  routes so the route axis is exercised rather than single-valued. None is
  referenced by any BSC preset, framework, protocol, or implementation; inclusion
  asserts neither BSC Lab capability, nor efficacy, nor safety.
- `sstim-ex:characteristicDeliveryMedium`, a delivery-medium hierarchy including
  applied electric current, electric field, magnetic field, focused ultrasound,
  and chemical/pharmacological agents, and a stimulus channel-role facet that
  separates an intended causal channel from a concomitant one.
- Six stimulus temporal structures for continuous, single-event, pulse-train,
  scheduled, bolus, and infusion timing.
- "Stimulation" and "Neuromodulation" graph perspectives, driven by a general
  facet matcher in the navigator rather than by a `skos:Collection` minted in the
  vocabulary: a UI view is not a citable domain category.

### Changed
- `techUltrasoundNeuromod` is retyped onto `sstim:NeuromodulationTechnique`, off
  the sensory hierarchy, and defined by its intended focused neural target rather
  than by the categorical absence of an audible percept.
- `techGamma40Auditory` is narrowed so gamma-oscillation modulation is
  definitional, then dual-typed into the sensory-route overlap. Broad techniques
  such as `techPhoticDriving` deliberately stay sensory-only: a use-level
  intention is not promoted into a universal property.
- `TechniqueScheme` is relabelled "SSTIM Stimulation Technique Vocabulary". Its
  IRI was never sensory-scoped, so only the label had been narrower than its own
  identifier.
- Shared domains and ranges widen to the neutral parents so a non-sensory
  technique can be the subject of a conformant evidence assessment.
  `definedByFramework` moves to the general OBI protocol class so a
  capability-boundary or baseline protocol can be framework-authored without
  becoming stimulation.
- `sstim-ex:ExploratoryProtocol` no longer inherits a stimulation type. Seven
  exploratory protocols now declare `SensoryStimulationProtocol` explicitly;
  three — a silence/darkness baseline, a mere-exposure field hypothesis, and a
  capability-boundary document — deliberately do not.
- `make shacl-vocab` validates the core+vocabulary+exposure closure, since
  technique identity is vocabulary-owned while characteristic media are
  exposure-owned and a cycle would otherwise be required.

### Removed
- The SHACL escape hatch in which any `skos:editorialNote` suppressed a
  technique's mechanism, temporal-structure, and modality requirements. Free text
  must not control structural conformance. The five notes remain as annotations.
  `TechniqueShape` keeps its published IRI, retargeted to the neutral technique
  class and composed with six disjointly-targeted shapes.

### Deprecated
- `mechFFR`, `mechASSR`, `mechSSVEP`, `mechSSSEP`, and `mechStartle` denoted
  evoked responses and a reflex, not causal mechanisms. Each keeps its IRI as a
  tombstone with `dct:isReplacedBy` and is stripped of its
  `StimulationMechanism`/`skos:Concept` typing and scheme topology — deprecation
  alone would have preserved the false entailment. Seven replacement neural
  phenomenon concepts are minted.

## [0.8.0] - 2026-07-20

Framework-scope release. `sstim:definesTechnique` on the BSC framework is now
reserved for the three techniques BSC actually originated; four framework-scoped
duplicates of vendor-neutral vocabulary concepts are retired in favor of the
new `sstim:incorporatesTechnique` relation (ADR 0033). No previously released
term was removed from `sstim-core.ttl`, `sstim-vocab.ttl`, or `sstim-shapes.ttl`;
the retirements are confined to the `framework/bsc/technique/` instance IRIs,
which never resolved through w3id in any prior release.

### Added
- Published SSTIM `v0.8.0` under version DOI `10.5281/zenodo.21462727`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- `sstim:incorporatesTechnique` (ADR 0033): links a `SensoryStimulationFramework`
  to a pre-existing, vendor-neutral technique it applies without redefining.
  Additive — does not narrow or replace `sstim:definesTechnique`.
- w3id routes for all seven BSC framework technique IRIs (three originated, four
  retired), each an exact rule rather than a prefix wildcard, audited fail-closed
  by the quality-audit route checker. Previously no technique IRI under
  `framework/bsc/technique/` resolved at all.

### Changed
- `bsc-fw-tech:binaural-beat-stimulation`, `photic-rhythm-stimulation`,
  `audiovisual-rhythm-coordination`, and `vibrotactile-rhythm-stimulation` are
  retired from `sstim:definesTechnique` on the BSC framework and re-expressed as
  `sstim:incorporatesTechnique` over their existing vocabulary counterparts
  (`sstim-v:techBinauralBeats`, `techPhoticDriving`, `techAudiovisualEntrainment`,
  `techVibrotactileEntrainment`) — each already `skos:relatedMatch`-linked from
  the retired term, so no relation is newly asserted, only relocated onto the
  released IRI. `bsc-reference-protocols.ttl` follows the same substitution.

## [0.7.0] - 2026-07-15

Evidence- and ecosystem-governance release. No public term IRI was removed, but
legacy flattened evidence and ecosystem properties are deprecated and rejected
for newly authored conforming data. Consumers should follow the ADR 0027 and
ADR 0031 migration notes. All committed ecosystem agent records are synthetic;
the mutable external store required for real live-only records remains a
post-release F3 gate.

### Added
- Published SSTIM `v0.7.0` under version DOI `10.5281/zenodo.21380171`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- `rdfs:seeAlso` from the core ontology node to the generated WIDOCO reference
  documentation (`https://labiosyncare.github.io/ontology/docs/`), so
  harvesters that read ontology metadata (e.g. LOV) discover the documentation
  (ADR 0023).
- Evidence-assessment contract (ADR 0027): immutable assessment revisions,
  atomic bounded propositions, explicit scope axes, qualified evidence bases,
  source/search governance, PROV assessment and review activities, conflict and
  independence records, and orthogonal controlled values for modality, study
  design/model, synthesis type, outcomes, and scope missingness.
- `sstim-ecosystem` module (ADRs 0024 and 0031): neutral ecosystem agents,
  qualified agent-target relationships, ORG memberships, implementation
  responsibility, purpose-scoped engagement activities, and controlled
  relationship/purpose/outcome vocabularies.
- Closed SHACL publication profiles for evidence and ecosystem records,
  including the separate reusable private-audit shape file, public/private
  predicate boundaries, lifecycle ordering, terminal deletion, and
  current-state projection rules.
- Synthetic ecosystem fixtures demonstrating one person with multiple
  memberships and implementation relationships without cross-association,
  together with an executable admission harness, JSON-LD round-trip checks,
  46 adversarial SHACL fixtures, and 11 runtime loader/graph tests.
- Ecosystem named-graph, VoID, loader/context, quality-audit, Pages validation,
  and staged w3id plumbing. Real live-only records are expressly excluded from
  the Zenodo-tracked release repository.

### Changed
- Deprecated the overloaded `EvidenceModalityTag`, mutable review/status fields,
  directionally misleading `supportsRelation`, and other flattened evidence
  properties. A non-authoritative 0.7 compatibility export remains available;
  authorization and validation use only the new contract.
- Migrated the public evidence fixtures and runtime exporter to qualified bases,
  explicit propositions/scopes, immutable provenance, identified agents, and
  review decisions. Universal evidence-absence claims are forbidden; scoped
  search findings require a reproducible search record.
- Replaced the initial flat ecosystem surface with qualified relationship,
  membership, implementation-responsibility, and engagement records. Public
  data is an approved retractable current-state projection; negative,
  disputed, amended, removed, and consent-evidence history belongs to an
  access-controlled external ledger.
- Made runtime Web Annotation serialization valid and private by default, and
  tightened JSON-LD coercion, namespace parity, per-artifact validation,
  release-version consistency, and snapshot refusal checks.
- Clarified that `make snapshot` freezes only the seven ontology modules while
  a GitHub–Zenodo release archives the complete repository state at its tag.
  Real mutable ecosystem records must therefore be served outside this
  release repository.

### Fixed
- Prevented public/private RDF leakage through nested or untyped auxiliary
  nodes, ambiguous parallel consent/relationship values, orphan terminal
  records, and mismatched public/private activity mirrors.
- Removed unqualified universal-absence language and separated source-observed
  results from SSTIM's assessment direction and public wording decisions.

## [0.6.0] - 2026-07-11

Semantic-quality and FAIR-metadata release. No SSTIM term IRI was removed or
renamed, but corrected superclass axioms change some inferred types; consumers
that depend on the pre-0.6 upper model should review ADR 0021. The release was
accepted through maintainer-guided review and automated external validation;
independent human ontology review is explicitly deferred by ADR 0022.

### Added
- Complete module-level ontology metadata for all six editable SSTIM modules,
  including titles, descriptions, creators, licenses, dependencies, development
  version identifiers, and change-history notes.
- Structured caution governance: an ordered severity vocabulary plus trigger
  condition, affected population, recommended action, and display priority for
  every public caution tag.
- Self-report phases and an explicitly synthetic reference session with
  pre-session and immediate post-session observations; no personal data is
  included.
- Two non-clinical BSC Lab reference protocols, three additional framework
  technique records, and protocol/safety/public-claim links for both public
  reference presets.
- Reviewed evidence records and public-safe references for paced breathing,
  SSVEP, SSSEP, and multisensory integration, with claim-level PROV attribution
  and review dates.
- Repository-wide RDF quality and competency checks
  (`scripts/sstim-quality-audit.py` and the expanded
  `scripts/sstim-exposure-sanity.mjs`) covering metadata, SKOS integrity,
  functional-value collisions, evidence provenance, cautions, protocol/preset
  paths, sessions, loader coverage, dangling IRIs, and VoID counts.
- Graph-isomorphic export verification for every generated JSON-LD and RDF/XML
  module serialization, included in `make validate` and CI.
- SHACL contracts for module metadata, evidence provenance, protocols,
  implementations, caution severity, self-report phases, exposure profiles,
  unique SKOS notation, hierarchy inverses, and cycle prevention.
- VoID + DCAT dataset description (`static/ontology/void.ttl`) for FAIR
  publication: one `void:Dataset` with per-module subsets and Turtle/JSON-LD/
  RDF-XML distributions, checked whole-set counts, a public-instance subset,
  `void:uriSpace`, vocabularies used, and example resources. Added a
  `void:inDataset` back-link on the ontology node so registries discover it.
  Staged the `/sstim/void` w3id route. (PUBLICATION plan B3)
- Staged JSON-LD / RDF-XML content-negotiation for core and every module in the
  w3id `.htaccess` (`Accept: application/ld+json` → `.jsonld`, `application/rdf+xml`
  → `.rdf`, else Turtle). Goes live via the next `main` deploy plus a
  perma-id/w3id.org PR. (PUBLICATION plan B2)
- Expanded `static/ontology/context.jsonld` for the post-0.5.0/P6 public surface:
  evidence and public-claim governance terms, Patch Studio voice/session
  parameters, exposure-module predicates, implementation-data prefixes, and
  VoID/DCAT metadata aliases. (PUBLICATION plan B4)
- Added ROBOT/HermiT OWL DL consistency validation (`make reason`) over the
  merged ontology term-space modules, wired into `make validate` and the RDF CI
  workflow. (PUBLICATION plan B3)
- Enabled GitHub↔Zenodo release archiving and published SSTIM `v0.5.0` under
  version DOI `10.5281/zenodo.21286975` and all-versions concept DOI
  `10.5281/zenodo.21286974`. Added the DOI links to the ontology and VoID/DCAT
  metadata, citation guidance, and JSON-LD context. (PUBLICATION plan B5)
- Published SSTIM `v0.6.0` under version DOI `10.5281/zenodo.21302910`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- Reassessed the deployed canonical URI with FOOPS at 87.5%; all minimum
  metadata and version-IRI checks pass, leaving only registry-dependent checks.
- Added the 2026-07-10 external automated review disposition, covering OOPS,
  FOOPS, OLS/OBO identifier checks, and authoritative safety-source checks.
- Recorded the `0.6.0` review posture in
  [ADR 0022](docs/decisions/0022-0.6-release-review-posture.md): maintainer
  acceptance is sufficient for this release, with independent human review
  deferred and no claim of independent sign-off.

### Changed
- Finalized all six ontology modules as `0.6.0`; the core identifies the
  immutable whole-set release as `https://w3id.org/sstim/0.6.0`, while the
  other modules carry synchronized `owl:versionInfo` under ADR 0020.
- Reclassified sensory modality, stimulation mechanism, and intended effect as
  information-content categories rather than biological processes, roles, or
  dispositions. Session specifications are PROV plans, session executions are
  PROV activities, and implementations are PROV entities.
  ([ADR 0021](docs/decisions/0021-controlled-value-semantics.md))
- Added operational definitions to all previously undocumented public
  properties, concept schemes, and exposure concepts, including explicit
  measurement-dimension wording for exposure effects.
- Materialized SKOS `hasTopConcept`/`topConceptOf` and
  `broader`/`narrower` inverse navigation throughout the live vocabulary.
- Strengthened every evidence record with modality, direction, review status,
  review date, modification date, subject, and responsible-agent provenance;
  exploratory exposure claims are explicitly speculative, inconclusive, and
  provisional.
- Narrowed external alignment scope: whole-domain brainwave-entrainment and
  therapy mappings were removed, the binaural voice relation was weakened to
  `skos:relatedMatch`, and multisensory integration gained a verified related
  mapping.
- Expanded the RDF loader and JSON-LD context to cover protocols, both public
  presets, synthetic sessions, safety terms, and PROV metadata.
- Restricted the OBI protocol alignment to `SensoryStimulationProtocol`;
  `SensoryStimulationTechnique` is now an IAO information-content category.
- Clarified `derivedFrom` as an asymmetric, irreflexive immediate-predecessor
  relation rather than a symmetric or transitive preset relation.
- Completed publisher/issued metadata for every module and added citation,
  DOI, status, source, and logo metadata to the core ontology.

### Fixed
- Removed the stale MeSH `D012910` candidate mapping after authoritative NLM
  verification showed that the identifier denotes *Snake Venoms*, not sensory
  stimulation.
- Removed an unverified Music Ontology association and corrected overly broad
  upper-ontology assertions on controlled-value classes.
- Included the previously omitted theta breathing preset in the runtime RDF
  loader.
- Replaced hand-maintained/omitted VoID metrics with counts checked by the
  repository quality audit.
- Fixed the ROBOT reasoning Make target so a missing executable or failed
  reasoner command exits nonzero instead of printing a false success message.
- Removed obsolete `OBI_0000011` from live planned-process axioms; retained
  active `COB_0000082` for sensory stimulation interventions.
- Added the missing `dct:Standard` range on `conformsToStandard`, updated the
  WCAG and NIOSH references, and attributed the 30 J/m2 ultraviolet limit to
  ICNIRP while retaining IEC 62471 for lamp risk classification.
- Rewrote the core domain description and `SensoryStimulation` definition so
  delivery, proposed mechanisms, observed responses, and outcomes are not
  conflated.

## [0.5.0] — 2026-07-09

Domain-content coverage (IMPROVEMENT_PLAN P5) and evidence-integrity governance
(P7). Additive and backward-compatible — no terms removed or renamed. The exposure
module is released at 0.4.1 within this whole-set snapshot.

### Added
- Visual, tactile, and cross-modal technique concepts (photic/flicker driving,
  audiovisual entrainment, colour-field stimulation, vibrotactile and
  audio-tactile entrainment) and the steady-state evoked-potential mechanism
  family — SSVEP, SSSEP, and multisensory integration. ([ADR 0015](docs/decisions/0015-visual-and-cross-modal-techniques.md))
- Reference-pitch retuning (432 Hz etc.) as a `NonEntrainmentTechnique`, with
  carrier-pitch exposure properties and a carrier-vs-modulation evidence firewall.
  ([ADR 0017](docs/decisions/0017-reference-pitch-retuning.md))
- `VIS`, `TACTILE`, and `MULTISENSORY` evidence-modality tags (P5.6).
- `sstim:PublicClaimLevel` and the C0–C5 public-claim-level vocabulary, with a
  SHACL claim-legality constraint and a conditional-citation constraint
  (evidence tier ≥ 3 must cite a `PublicSafeReference`).
  ([ADR 0018](docs/decisions/0018-evidence-integrity-and-public-claim-governance.md))
- `owl:priorVersion` links on the core and exposure ontology nodes.
- First populated technique `EvidenceClaim` instances — ASSR and FFR as measurable
  responses, the mixed binaural-beat outcome, and the explicit chromotherapy /
  Solfeggio / 432 Hz negative assertions — plus two Crossref-audited references
  (`PICTON_2003`, `SKOE_KRAUS_2010`). (P5.4; instance data under
  `static/ontology/instances/`, not part of the versioned term-space.)

### Changed
- Modality nomenclature cleanup: narrowed the `modalitySomatosensory` label to
  "Somatosensory", adopted the convention **haptic = device / tactile = percept /
  somatosensory = superordinate channel / vibrotactile = mechanism**, and
  completed the `skos:closeMatch` bridge between the `sstim-v:` sensory-channel
  and `sstim-ex:` perceived-modality vocabularies for all six shared channels.
  ([ADR 0019](docs/decisions/0019-modality-nomenclature-cleanup.md))
- Corrected the `EvidenceModalityTag` definition string (it listed six values; the
  scheme has carried nine since the P5.6 additions).
- Exposure module 0.4.0 → 0.4.1 (additive: the closeMatch bridge and convention
  scope notes).
- Module versioning ([ADR 0020](docs/decisions/0020-whole-set-snapshot-versioning.md)):
  the whole-set snapshot (`static/ontology/<version>/`, identified by core
  `owl:versionIRI`) is the single citable unit. Removed the exposure module's
  independent `owl:versionIRI` / `owl:priorVersion` (they never dereferenced);
  modules now carry `owl:versionInfo` only, as a module-level change counter.

## [0.4.0] — 2026-06-18

The exposure & experiment module (`sstim-exposure.ttl`), separately versioned.

### Added
- Reusable exposure module separating physical delivery medium, perceived
  modality, device capability, body placement, comfort boundary, experiment
  context, effect claims, and knowledge status.
  ([ADR 0010](docs/decisions/0010-exposure-delivery-modality.md))
- Sensory Field quantitative stimulus properties (frequency, flicker rate, beat
  frequency, duty cycle, gain, phase), left/right laterality body placements, and
  the `ExposureLimit` class with optical/flicker/hearing safety boundaries citing
  external standards. ([ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md))

## [0.3.0] — 2026-06

### Added
- `sstim-v:TechniqueScheme` — a vendor-neutral controlled vocabulary of auditory
  and cross-modal sensory-stimulation techniques — with seven new
  `StimulationMechanism` concepts (ASSR, auditory-motor coupling, closed-loop
  phase reinforcement, masking, vibrotactile mechanoreception, acoustic startle,
  ultrasonic neuromodulation) and the `sstim:techniqueModality` property. Two
  non-evidence-bearing folk techniques catalogued with explicit editorial notes.

## [0.2.0] — 2026-06

### Added
- `sstim:CautionTag`, `sstim:VoiceType`, and `sstim:PermutationFunction`
  classification classes and the `sstim:hasCautionTag` property; the
  `StimulusTemporalStructure` concept scheme; dual-typed caution, voice-type,
  permutation, and temporal-structure concepts; full it/pt/es `prefLabel`
  coverage; and external upper-ontology label stubs.

### Fixed
- **0.2.0 erratum:** corrected external alignment IRIs wrong since 0.1.0 — every
  Wikidata QID (all resolved to unrelated entities), the `EvidenceClaim` parent
  (`iao:0000001` → `iao:0000030`), the obsolete OBI planned-process parent (added
  `cob:0000082`), a non-existent ORCID (→ the verified `0000-0002-9699-629X`), and
  a dead repository link. No vocabulary terms changed.

## [0.1.0] — 2026-04

### Added
- Initial public release: OWL 2 DL class hierarchy, SKOS vocabulary, SHACL shapes,
  and external alignments. Vocabulary seeded from the BSC preset catalog v0.9.1.
  "Sensory Stimulation" adopted as the umbrella term over the coined
  "Sensory Harnessing".

[Unreleased]: https://github.com/laBioSynCare/laBioSynCare.github.io/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.8.0
[0.7.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.7.0
[0.6.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.6.0
[0.5.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.5.0
