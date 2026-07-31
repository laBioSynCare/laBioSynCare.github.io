# Architecture Decision Records

This directory captures the non-obvious architectural decisions that shape the
BSC Lab ontology and software. Each ADR explains one decision: what forced it,
what was chosen, what was rejected, and what the choice locks in or enables.

The format is **lightweight ADR** (Michael Nygard style): Context, Decision,
Alternatives, Consequences. Target length: one page.

## Why ADRs and not RDF

Design rationale is meta-discourse about the ontology — statements about *why*
the modeling chose a particular shape — not statements in the ontology's
domain. It exists to be read by humans, so it lives in prose. Where an ADR is
load-bearing for an RDF class or property, the `.ttl` file should link to it
via `rdfs:seeAlso`.

Facts about the ontology's own evolution (deprecation, versioning, history
notes) remain in RDF: `owl:deprecated`, `owl:versionInfo`,
`skos:historyNote`, `prov:wasRevisionOf`. The rationale behind those
annotations lives here.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-namespace-split.md) | SSTIM-scoped instance paths | Accepted |
| [0002](0002-dual-typing-owl-skos.md) | Dual-typing of SKOS concepts and OWL classes (Pattern 2) | Accepted |
| [0003](0003-named-graphs-for-modules.md) | Named graphs for runtime module isolation | Accepted |
| [0004](0004-protected-ontology-files.md) | Protected ontology files policy | Accepted |
| [0005](0005-binaural-carrier-pair-only.md) | Binaural beat parameterized as carrier pair only | Accepted |
| [0006](0006-one-class-per-technique.md) | One class per technique; voice classes named `*Voice` | Accepted |
| [0007](0007-framework-protocol-implementation.md) | Framework, technique, protocol, implementation, preset, session | Accepted |
| [0008](0008-activitypub.md) | ActivityPub federation | Accepted |
| [0009](0009-pwa.md) | Progressive Web App (installable, offline-capable) | Accepted |
| [0010](0010-exposure-delivery-modality.md) | Exposure delivery, perceived modality, and evidence status | Accepted |
| [0011](0011-sensory-field-and-flash-safety.md) | Sensory Field interface, runtime flash-rate safety, exposure ontology 0.4.0 | Accepted |
| [0012](0012-martigli-voice-parameters.md) | Where Martigli voice parameters live in RDF | Accepted |
| [0013](0013-evidence-support-relation-range.md) | Evidence `supportsRelation` range (Preset ∪ Technique) | Accepted |
| [0014](0014-preset-is-not-a-protocol.md) | A Preset is an information content entity, not a protocol | Accepted |
| [0015](0015-visual-and-cross-modal-techniques.md) | Visual and cross-modal technique vocabulary | Accepted |
| [0016](0016-publication-obo-posture-and-registries.md) | External publication, OBO posture, and registry strategy | Accepted |
| [0017](0017-reference-pitch-retuning.md) | Reference-pitch retuning (432 Hz) modeling | Accepted |
| [0018](0018-evidence-integrity-and-public-claim-governance.md) | Evidence integrity and public-claim governance | Accepted |
| [0019](0019-modality-nomenclature-cleanup.md) | Modality nomenclature cleanup (somatosensory / haptic / tactile / vibrotactile) | Accepted |
| [0020](0020-whole-set-snapshot-versioning.md) | Whole-set snapshot is the citable versioning unit (modules carry versionInfo only) | Accepted |
| [0021](0021-controlled-value-semantics.md) | Controlled values describe categories, not their real-world referents | Accepted |
| [0022](0022-0.6-release-review-posture.md) | Maintainer acceptance is sufficient for the 0.6 release | Accepted |
| [0023](0023-ontology-docs-publication-path.md) | WIDOCO docs: CI-generated Pages subpath; the app keeps the browser-facing IRI | Accepted |
| [0024](0024-stakeholder-ecosystem-modeling.md) | Model the ecosystem as neutral agents (`EcosystemAgent` ⊑ `prov:Agent`; reuse schema.org/ORG); mutable external live-data tier plus consent-gated archival tier | Accepted |
| [0025](0025-hed-bids-interoperability-crosswalk.md) | SSTIM-native sessions with a generated HED event profile and optional BIDS/NWB research bindings | Proposed |
| [0026](0026-patch-studio-catalog-bridge.md) | Patch Studio → catalog/RDF: a gated one-way converter over a mappable subset, not native catalog authoring | Proposed |
| [0027](0027-evidence-claim-family-and-public-claim-gate.md) | Separate evidence assessments from non-evidence statements | Accepted |
| [0028](0028-atomic-claim-propositions-and-public-expressions.md) | Atomic claim propositions, rendered public expressions, and non-exclusive facets | Proposed |
| [0029](0029-bsc-lab-public-claim-publication-profile.md) | BSC Lab public-claim publication and authorization profile | Proposed |
| [0030](0030-named-methods-and-schools.md) | Record recognized named methods/schools (Snoezelen, Tomatis, …) as a neutral, evidence-scoped catalogue | Proposed |
| [0031](0031-qualified-ecosystem-records.md) | Qualified ecosystem relationships, externally stored approved public current state, and a private append-only engagement audit | Accepted |
| [0032](0032-visible-pending-status-ecosystem-records.md) | Visible pending-status ecosystem records: `publicationStatus` as a second, consent-scoped public admission basis | Accepted |
| [0033](0033-framework-scope-and-generic-technique-deduplication.md) | BSC framework scope; `incorporatesTechnique` for non-originated techniques; retire four generic-technique duplicates | Accepted |
| [0034](0034-neuromodulation-relation-and-neural-target-axis.md) | Add neutral stimulation context; model sensory-route neuromodulation as an overlap; separate medium, route, approach, target, perception, and evidence; retire the SHACL editorialNote escape hatch | Accepted |
| [0035](0035-participant-engagement-mode-and-endogenous-self-regulation.md) | Add participant-engagement-mode facet; catalogue ECT and neutral-typed neurofeedback/biofeedback; invasive/non-invasive rollup; defer neurostim⊂neuromod and endogenous-self-regulation-as-neuromodulation (Theo Marins interview) | Accepted |
| [0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md) | Disambiguate neuromodulation's intervention vs effect senses; add Neurostimulation (delivery), self-directed/interventional split, Neuroplasticity disposition; bring neurofeedback/biofeedback under neuromodulation; effect sense stays a facet collection (resolves ADR 0035 notes 4 & 5) | Accepted |
| [0037](0037-self-regulation-genus-and-sensory-neurostimulation-branch.md) | Add DeliberateSelfRegulation as the neutral genus above no-applied-stimulus self-directed practices; assert SensoryNeurostimulation/-Technique below Neurostimulation as an intersection class; keep generic biofeedback neutral; add primaryFrequencyBand (resolves audit RDF-04, RDF-05, and the ordering sub-bug of RDF-08) | Accepted |
| [0038](0038-identity-providers-and-the-two-seam-adapter.md) | Split the backend adapter into identity and storage seams; local-first storage as the default; Mastodon OAuth as the first identity provider and IndieAuth as the second, with both implemented to prove the seam is an interface rather than a swap | Proposed |
| [0039](0039-sharing-model-and-the-shared-backend-question.md) | Decline a multi-user hosted backend (the same commitment ADR 0008 declined for federation); share through publication instead — URL fragment, file, static/RDF publication with one-click Zenodo and Mastodon targets, and curated contribution — with WebRTC retained as a synchronous transfer channel for co-located use | Proposed |

## Adding an ADR

1. Copy the structure of an existing file.
2. Give it the next sequential number and a short descriptive slug.
3. Status is one of: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
4. If an ADR supersedes a prior one, edit the prior one's status line and link
   to the new one — never delete or rewrite past decisions.
5. Add a row to the index above.
6. If the decision affects `.ttl` classes or properties, add
   `rdfs:seeAlso <…/docs/decisions/NNNN-slug.md>` to the relevant terms.
