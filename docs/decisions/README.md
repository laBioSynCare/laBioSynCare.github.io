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

| # | Decision | Status |
|---|---|---|
| [0001](0001-namespace-split.md) | SSTIM-Scoped Instance Paths | Accepted |
| [0002](0002-dual-typing-owl-skos.md) | Dual-typing of SKOS concepts and OWL classes (Pattern 2) | Accepted |
| [0003](0003-named-graphs-for-modules.md) | Named graphs for runtime module isolation | Accepted |
| [0004](0004-protected-ontology-files.md) | Protected ontology files policy | Accepted |
| [0005](0005-binaural-carrier-pair-only.md) | Binaural beat parameterized as carrier pair only | Accepted |
| [0006](0006-one-class-per-technique.md) | One class per technique; voice classes named `*Voice` | Accepted |
| [0007](0007-framework-protocol-implementation.md) | Framework, Technique, Protocol, Implementation, Preset, Session | Accepted |
| [0008](0008-activitypub.md) | ActivityPub federation | Accepted |
| [0009](0009-pwa.md) | Progressive Web App (installable, offline-capable) | Accepted |
| [0010](0010-exposure-delivery-modality.md) | Exposure delivery, perceived modality, and evidence status | Accepted |
| [0011](0011-sensory-field-and-flash-safety.md) | Sensory Field interface, runtime flash-rate safety, and exposure ontology 0.4.0 | Accepted |
| [0012](0012-martigli-voice-parameters.md) | Where Martigli voice parameters live in RDF | Accepted |
| [0013](0013-evidence-support-relation-range.md) | Evidence `supportsRelation` range | Accepted · property renamed by 0027 |
| [0014](0014-preset-is-not-a-protocol.md) | A Preset is an information content entity, not a protocol | Accepted |
| [0015](0015-visual-and-cross-modal-techniques.md) | Visual and cross-modal technique vocabulary | Accepted |
| [0016](0016-publication-obo-posture-and-registries.md) | External publication, OBO posture, and registry strategy | Accepted |
| [0017](0017-reference-pitch-retuning.md) | Reference-pitch retuning (432 Hz) modeling | Accepted |
| [0018](0018-evidence-integrity-and-public-claim-governance.md) | Evidence integrity and public-claim governance | Accepted · amended by 0027 |
| [0019](0019-modality-nomenclature-cleanup.md) | Modality nomenclature cleanup (somatosensory / haptic / tactile / vibrotactile) | Accepted |
| [0020](0020-whole-set-snapshot-versioning.md) | Whole-set snapshot is the citable versioning unit | Accepted |
| [0021](0021-controlled-value-semantics.md) | Controlled values describe categories, not their real-world referents | Accepted |
| [0022](0022-0.6-release-review-posture.md) | Maintainer acceptance is sufficient for the 0.6 release | Accepted |
| [0023](0023-ontology-docs-publication-path.md) | WIDOCO docs: CI-generated Pages subpath; the app keeps the browser-facing IRI | Accepted · amended by 0043 |
| [0024](0024-stakeholder-ecosystem-modeling.md) | Modeling the sensory-stimulation ecosystem (agents) | Accepted |
| [0025](0025-hed-bids-interoperability-crosswalk.md) | SSTIM ↔ HED event semantics with optional BIDS research bindings | Proposed |
| [0026](0026-patch-studio-catalog-bridge.md) | Patch Studio → catalog/RDF: a gated one-way converter over a mappable subset, not a native catalog authoring model | Accepted · RDF half built |
| [0027](0027-evidence-claim-family-and-public-claim-gate.md) | Separate evidence assessments from non-evidence statements | Accepted |
| [0028](0028-atomic-claim-propositions-and-public-expressions.md) | Atomic claim propositions and public expressions | Proposed |
| [0029](0029-bsc-lab-public-claim-publication-profile.md) | BSC Lab public-claim publication and authorization profile | Proposed |
| [0030](0030-named-methods-and-schools.md) | Recording recognized named sensory-stimulation methods and schools | Proposed |
| [0031](0031-qualified-ecosystem-records.md) | Qualified ecosystem relationships and public engagement records | Accepted |
| [0032](0032-visible-pending-status-ecosystem-records.md) | Visible pending-status ecosystem records | Accepted |
| [0033](0033-framework-scope-and-generic-technique-deduplication.md) | BSC framework scope and generic-technique deduplication | Accepted |
| [0034](0034-neuromodulation-relation-and-neural-target-axis.md) | Stimulation and neuromodulation: overlap, delivery, route, and neural-target axes | Accepted |
| [0035](0035-participant-engagement-mode-and-endogenous-self-regulation.md) | Participant engagement mode, ECT, and endogenous self-regulation | Accepted |
| [0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md) | Neurostimulation, the two senses of neuromodulation, and the self-directed split | Accepted · amended by 0037 |
| [0037](0037-self-regulation-genus-and-sensory-neurostimulation-branch.md) | Self-regulation genus, the sensory-neurostimulation branch, and the primary-band property | Accepted |
| [0038](0038-identity-providers-and-the-two-seam-adapter.md) | Identity providers: Fediverse-first, behind a two-seam adapter | Accepted · seams built, providers not |
| [0039](0039-sharing-model-and-the-shared-backend-question.md) | How data is shared, and why there is no shared backend | Accepted · tiers 1–2 built |
| [0040](0040-patch-studio-native-session-and-track-classes.md) | A patch is a first-class SSTIM object | Superseded by [0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md) |
| [0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md) | Four description layers, and the two things SSTIM does not yet have | Accepted |
| [0042](0042-stimulus-specification.md) | `sstim:StimulusSpecification`: describing the stimulation, not the engine | Accepted |
| [0043](0043-sstim-core-profile-and-module-boundaries.md) | SSTIM Kernel, Core, Core Plus, concern modules, and Full Profile | Accepted |
| [0044](0044-stimulus-channel-core-ownership.md) | `StimulusChannel` ownership and profile-sensitive target domain | Accepted |
| [0045](0045-shapeless-profiles-are-discovery-entry-points.md) | A profile with no shape closure is a discovery entry point, not a conformance target | Accepted |

## Adding an ADR

1. Copy the structure of an existing file.
2. Give it the next sequential number and a short descriptive slug.
3. Status is one of: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
   **Update it when reality moves.** An ADR marked `Proposed` while the code
   ships it is worse than no record — ADR 0038 said "no implementation exists
   yet" for seams that had shipped, and its own successor contradicted it. Where
   implementation is partial, say which part.
4. If an ADR supersedes a prior one, edit the prior one's status line and link
   to the new one — never delete or rewrite past decisions.
5. Add a row to the index. The Decision cell is the file's own H1, minus the
   `ADR NNNN —` prefix. Keep it a title: the cells here once grew to 450
   characters, which is an abstract, and an index of abstracts is not an index.
6. If the decision affects `.ttl` classes or properties, add
   `rdfs:seeAlso <…/docs/decisions/NNNN-slug.md>` to the relevant terms.

## What belongs in an ADR, and what does not

Target length is one page. Context, Decision, Alternatives, Consequences.

**Do not paste term records.** Once a decision ships, the `.ttl` is authoritative
and already links back via `rdfs:seeAlso`; a copy in the ADR is a second source
that silently drifts. State the *semantic commitment* and name the owning module.
ADR 0034 reached 1,299 lines this way — four Turtle instantiations of one overlap
pattern, plus a per-module edit checklist and a build sequence for a release that
had already happened. None of it was the decision.

**Do not keep a completed implementation plan.** Migration steps, file lists, and
release mechanics expire on merge. Keep only an ordering constraint that is
normative for future work, and say why.
