# Changelog

All notable changes to the **SSTIM ontology** — the versioned, citable artifact at
`https://w3id.org/sstim` — are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/). Release tags are `vX.Y.Z`; each tagged
version is frozen byte-identical under `static/ontology/X.Y.Z/`.

**Scope.** This tracks the reusable ontology term-space — core, vocabulary, SHACL
shapes, external alignments, the exposure module, and the patch-studio model.
BSC Lab application and infrastructure work is tracked in [ROADMAP.md](ROADMAP.md)
and [TODO.md](TODO.md). The rationale for each change lives in the
[ADRs](docs/decisions/) and the `skos:historyNote`s on the ontology nodes; this
file is the human-readable summary.

## [Unreleased]

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

### Changed
- Advanced editable module sources to `0.6.0-dev` while keeping `0.5.0` as the
  latest citable, immutable whole-set snapshot. Only core release snapshots
  carry `owl:versionIRI`; live module files carry development `owl:versionInfo`.
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

[Unreleased]: https://github.com/laBioSynCare/laBioSynCare.github.io/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.5.0
