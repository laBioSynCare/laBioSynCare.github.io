# SSTIM Ontology Improvement Plan

Status: active maturity and release-planning document

Current release: SSTIM `0.6.0`

Next development line: not yet opened

Last reviewed: 2026-07-11

This document records the current ontology assessment, the work completed on
the live development line, and the remaining gates for the next release. It is
not a release note or an architecture decision record (ADR). Semantic changes
must be explained in an ADR and summarized in `CHANGELOG.md`.

## Current Assessment

SSTIM is an application ontology and controlled vocabulary for describing
sensory-stimulation techniques, delivery configurations, protocols, presets,
evidence claims, cautions, sessions, and consent-dependent self-reports. It is
intended for research, education, interoperability, and conservative wellness
applications. It does not encode diagnoses, prescriptions, or treatment claims.

The citable `0.6.0` release is frozen under `static/ontology/0.6.0/`. The six
term-space modules are:

1. `sstim-core.ttl`: OWL classes, properties, and evidence/safety contracts.
2. `sstim-vocab.ttl`: SKOS controlled vocabularies.
3. `sstim-exposure.ttl`: delivery, perception, device, placement, safety, and
   experiment-context terms.
4. `sstim-patch-studio.ttl`: authoring and voice-parameter model.
5. `sstim-shapes.ttl`: SHACL validation contracts.
6. `sstim-alignments.ttl`: conservative external mappings.

The repository quality audit currently measures the live graph as:

| Measure | Count |
|---|---:|
| Named OWL classes | 56 |
| Anonymous union-class expressions | 6 |
| RDF/OWL properties | 124 |
| SKOS concepts | 295 |
| SKOS concept schemes | 30 |
| BSC framework techniques | 7 |
| Public protocols | 12 |
| Public reference presets | 2 |
| Evidence claims | 38 |
| Bibliographic references | 7 |
| Exposure profiles | 10 |
| Synthetic sessions / self-reports | 1 / 2 |

Counts are regression thresholds, not quality targets. New terms should be
added only when they answer a competency question or support a real data need.

## 0.6 Release Work

### Conceptual consistency

- Reclassified controlled-value categories such as sensory modality,
  stimulation mechanism, and intended effect as information-content
  categories rather than biological processes, roles, or dispositions.
- Distinguished protocol plans, preset specifications, implementation
  resources, and executed sessions. Sessions are PROV activities; session
  specifications are PROV plans; implementations are PROV entities.
- Kept physical delivery, perceived modality, required device capability, body
  placement, and experimental context separate in the exposure module.
- Recorded the controlled-value decision and migration rationale in
  [ADR 0021](../decisions/0021-controlled-value-semantics.md).

### OWL and SKOS quality

- Added ontology metadata and dependency declarations to every module while
  preserving the whole-set snapshot policy from ADR 0020.
- Added definitions to all public classes, properties, concept schemes, and
  exposure concepts that previously lacked documentation.
- Added functional-property semantics only to genuinely scalar values and
  added validation against conflicting values.
- Materialized `skos:topConceptOf` / `skos:hasTopConcept` and
  `skos:broader` / `skos:narrower` inverse navigation.
- Enforced one English preferred label, one notation per concept, scheme
  membership, concept documentation, hierarchy acyclicity, and notation
  uniqueness through SHACL and the repository audit.

### Safety and evidence integrity

- Added a caution-severity vocabulary with ordered ranks and structured
  trigger, affected-population, recommended-action, and display-priority data.
- Enriched every public caution tag with conservative operational guidance.
- Required evidence claims to identify their tier, modality, direction, review
  status/date, subject, modification date, and responsible PROV agent.
- Retained the rule that stronger public claims require public-safe citations.
- Added reviewed references and claim records for paced breathing, steady-state
  visual evoked potentials, steady-state somatosensory evoked potentials, and
  multisensory integration.
- Kept exploratory exposure-effect records explicitly speculative,
  inconclusive, provisional, and provenance-qualified.

### Protocol and observation data

- Expanded the BSC Lab framework to seven represented techniques.
- Added two non-clinical reference protocols and linked both public presets to
  protocols, implementation resources, caution tags, and claim levels.
- Added one explicitly synthetic session example with pre-session and immediate
  post-session reports. No personal or participant data is included.
- Added self-report phases so observations are not implicitly post-session.
- Added framework/protocol metadata or explicit baseline/boundary exceptions to
  every public experiment record.

### Alignment corrections

- Retained external mappings only where equivalence or relatedness was checked.
- Removed obsolete `OBI_0000011` from live planned-process axioms and retained
  active `COB_0000082` for sensory stimulation interventions.
- Resolved the technique-alignment question from ADR 0014: a reusable technique
  category is an IAO information content entity, while only the detailed SSTIM
  protocol class aligns to OBI protocol.
- Replaced over-broad whole-domain mappings with term-level mappings.
- Added a related mapping for multisensory integration and narrowed the voice
  mapping for binaural beats.
- Removed an unverified Music Ontology association.
- Rejected MeSH `D012910` as a sensory-stimulation mapping because the official
  NLM record identifies it as *Snake Venoms*. No replacement MeSH identifier is
  asserted without verification.
- Completed an [external automated OOPS/FOOPS review](reviews/2026-07-10-external-automated-review.md)
  with authoritative OLS, W3C, NIOSH, ICNIRP, and DCMI disposition checks.

### Executable quality controls

- Expanded SHACL from basic structural checks to module metadata, evidence
  provenance, protocol/preset relations, safety metadata, SKOS integrity,
  exposure profiles, sessions, and self-reports.
- Added `scripts/sstim-quality-audit.py` for repository-wide RDF, JSON-LD,
  loader-manifest, VoID-count, functional-value, dangling-IRI, provenance, and
  competency-threshold checks.
- Expanded `scripts/sstim-exposure-sanity.mjs` into executable competency
  queries spanning framework-to-preset paths, cited evidence, cautions, and
  session reports.
- Integrated parsing, SHACL, OWL reasoning, quality audit, SPARQL competency
  checks, and graph-isomorphic JSON-LD/RDF/XML round trips under `make validate`
  and CI.

## Remaining Priorities

### 0.6 release disposition

1. Maintainer Renato Fabbri guided the ontology revisions and accepted the
   release on 2026-07-11. Under
   [ADR 0022](../decisions/0022-0.6-release-review-posture.md), an independent
   named human review is deferred until a suitable reviewer is available and
   is not claimed as part of `0.6.0`.
2. New evidence summaries retain conservative, claim-scoped wording and carry
   source, review-date, and responsible-agent provenance.
3. The complete pinned-Nix validation suite passes, including SHACL,
   ROBOT/HermiT, repository audits, competency queries, and graph-isomorphic
   generated serializations.
4. All six modules share final `0.6.0` metadata; core carries the release
   `owl:versionIRI`, and the whole set is frozen, tagged, and archived through
   the GitHub-Zenodo release workflow.
5. WIDOCO output and registry submissions are post-release FAIR-publication
   priorities. They do not change or block the validated RDF artifact.

### P1: domain depth

1. Add evidence claim families only where a stable technique, measurable
   dimension, and auditable source can all be represented. Candidate areas are
   rhythmic auditory cueing, vibroacoustic stimulation, audiovisual temporal
   coordination, and additional sensory steady-state response literature.
2. Replace remaining free-text evidence facets with controlled population,
   comparator, outcome, and effect-polarity vocabularies when there are enough
   claims to validate the abstraction.
3. Add calibrated physical quantities and unit IRIs, preferably reusing QUDT,
   where normalized gain or string-valued settings are insufficient for
   reproducible protocols.
4. Expand reference protocols and synthetic examples to cover visual,
   vibrotactile, audiovisual, and accessibility-aware workflows.
5. Add competency queries for contraindication retrieval, device-capability
   matching, protocol comparison, and evidence changes across releases.

### P2: interoperability and publication

1. Publish WIDOCO documentation and make the stable HTML landing route part of
   the release process.
2. Complete the staged w3id routing update for VoID and all negotiated formats.
3. Submit the stable ontology URI to appropriate registries: DBpedia Archivo,
   LOV, BARTOC, BioPortal, OLS, and FAIRsharing.
4. Create an ontology-level Wikidata item and reciprocal mappings only after
   each identifier and equivalence claim is independently verified.
5. Consider SOSA/SSN for sensors and observations only when SSTIM gains actual
   measured-device data; do not import it speculatively.

## Deliberate Boundaries

The following are not growth targets for SSTIM:

- disease, diagnosis, prescription, or treatment taxonomies;
- claims that a stimulation setting causes a health or cognitive outcome
  without qualified evidence;
- extrasensory-perception or paranormal categories;
- detailed receptor, pathway, or neuroanatomy duplication better supplied by
  established biomedical ontologies;
- deep smell or taste technique trees without implementation data or reviewed
  evidence;
- device-vendor catalogs or private BioSynCare preset/session data;
- mappings selected by label similarity without checking the external record.

These boundaries keep SSTIM useful as an interoperability layer rather than an
unreviewed encyclopedia.

## Release Acceptance Criteria

The next release is ready only when:

- all editable Turtle parses and all SHACL targets conform;
- OWL reasoning reports no inconsistency;
- repository quality and competency-query audits pass;
- every public term has an English label and definition;
- SKOS hierarchy, notation, and inverse-navigation checks pass;
- every evidence claim has provenance and every high-tier claim has a
  public-safe citation;
- every public preset follows a protocol and carries conservative safety and
  public-claim metadata;
- VoID counts, JSON-LD context terms, and loader manifests match live RDF;
- no file under an earlier frozen snapshot changes;
- no obsolete external term occurs in a live logical axiom;
- changelog, citation metadata, exports, release snapshot, tag, and Zenodo
  record all describe the same version;
- release material accurately distinguishes maintainer-guided review from
  independent human sign-off.

## Change Discipline

- Turtle is the editable source of truth; JSON-LD and RDF/XML are generated.
- Existing IRIs are stable. Deprecate with an explicit replacement and history
  note instead of silently changing identity.
- Whole-set release snapshots are immutable.
- New semantics require an ADR when the choice affects interoperability,
  inference, evidence legality, or migration.
- External identifiers must be checked against their authoritative source.
- Real participant observations require a separate privacy and consent design;
  synthetic examples must be visibly identified as synthetic.
