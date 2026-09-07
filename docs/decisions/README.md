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
| [0005](0005-binaural-carrier-pair-only.md) | Binaural beat parameterized as carrier pair only | Accepted · renamed in build |
| [0006](0006-one-class-per-technique.md) | One class per technique; voice classes named `*Voice` | Accepted |
| [0007](0007-framework-protocol-implementation.md) | Framework, Technique, Protocol, Implementation, Preset, Session | Accepted |
| [0008](0008-activitypub.md) | ActivityPub federation | Accepted |
| [0009](0009-pwa.md) | Progressive Web App (installable, offline-capable) | Accepted |
| [0010](0010-exposure-delivery-modality.md) | Exposure delivery, perceived modality, and evidence status | Accepted |
| [0011](0011-sensory-field-and-flash-safety.md) | Sensory Field interface, runtime flash-rate safety, and exposure ontology 0.4.0 | Accepted · interface separation superseded by 0046 |
| [0012](0012-martigli-voice-parameters.md) | Where Martigli voice parameters live in RDF | Accepted |
| [0013](0013-evidence-support-relation-range.md) | Evidence `supportsRelation` range | Accepted · property renamed by 0027 |
| [0014](0014-preset-is-not-a-protocol.md) | A Preset is an information content entity, not a protocol | Accepted |
| [0015](0015-visual-and-cross-modal-techniques.md) | Visual and cross-modal technique vocabulary | Accepted |
| [0016](0016-publication-obo-posture-and-registries.md) | External publication, OBO posture, and registry strategy | Accepted · amended by [0056](0056-readable-iris-accepted-costs-and-the-obo-idspace-prerequisite.md) |
| [0017](0017-reference-pitch-retuning.md) | Reference-pitch retuning (432 Hz) modeling | Accepted |
| [0018](0018-evidence-integrity-and-public-claim-governance.md) | Evidence integrity and public-claim governance | Accepted · amended by 0027 |
| [0019](0019-modality-nomenclature-cleanup.md) | Modality nomenclature cleanup (somatosensory / haptic / tactile / vibrotactile) | Accepted |
| [0020](0020-whole-set-snapshot-versioning.md) | Whole-set snapshot is the citable versioning unit | Accepted |
| [0021](0021-controlled-value-semantics.md) | Controlled values describe categories, not their real-world referents | Accepted |
| [0022](0022-0.6-release-review-posture.md) | Maintainer acceptance is sufficient for the 0.6 release | Accepted |
| [0023](0023-ontology-docs-publication-path.md) | WIDOCO docs: CI-generated Pages subpath; the app keeps the browser-facing IRI | Accepted · amended by 0043 |
| [0024](0024-stakeholder-ecosystem-modeling.md) | Modeling the sensory-stimulation ecosystem (agents) | Accepted |
| [0025](0025-hed-bids-interoperability-crosswalk.md) | SSTIM ↔ HED event semantics with optional BIDS research bindings | Accepted |
| [0026](0026-patch-studio-catalog-bridge.md) | Patch Studio → catalog/RDF: a gated one-way converter over a mappable subset, not a native catalog authoring model | Accepted · RDF half built; catalog half conditional |
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
| [0046](0046-one-studio-two-authoring-modes.md) | One Studio, first-class spatial visual tracks, and separate semantic products | Accepted · revised before implementation; partially implemented 2026-08-08 |
| [0047](0047-programme-identity-path.md) | Programme identity: `/sstim/ecosystem/{id}`, adding a seventh canonical path to ADR 0007 | Accepted |
| [0048](0048-session-events-and-qualified-observations.md) | Session events on the engine clock, and qualified participant observations where absence carries its reason — closes KR-02/KR-03 | Accepted |
| [0049](0049-neural-oscillations-and-frequency-ambits.md) | Neural oscillations are the missing term; frequency bands were always ambits — closes KR-08 and KR-09 | Accepted |
| [0050](0050-public-claim-applicability-contract.md) | Public claims need an applicability contract, not just a tier — closes KR-04 | Accepted |
| [0051](0051-sstim-preset-contract.md) | SSTIM's own preset contract: modality-neutral components, inspired by the BioSynCare catalog and bound to none — closes KR-07 | Accepted |
| [0052](0052-abstract-signals-and-sensory-renderings.md) | One signal, several sensory renderings: carrier and modulator are an audio rendering, not the universal structure | Accepted |
| [0053](0053-wildcard-snapshot-routes.md) | Snapshot routes are patterns, not an enumeration — a release no longer costs the w3id maintainer a pull request | Accepted |
| [0054](0054-owl-dl-conformance-and-the-duration-datatype.md) | OWL 2 DL conformance: declare every external term, declare `xsd:date`, and remove `xsd:duration` because declaring it does not work | Accepted |
| [0055](0055-namespace-iri-resolves-to-a-release.md) | `https://w3id.org/sstim` resolves to the latest release rather than the working tree, and tells a person in a browser what they just dereferenced | Accepted |
| [0056](0056-readable-iris-accepted-costs-and-the-obo-idspace-prerequisite.md) | What readable IRIs cost, and why the OBO-ID bridge cannot be built before an IDSPACE is allocated | Accepted |
| [0057](0057-external-mapping-predicates-and-verification.md) | How an external mapping predicate is chosen, and how its target is proved | Accepted |

## ADR lifecycle and revision policy

Git preserves earlier text; ADRs preserve decisions that affected reality. An
ADR becomes historically fixed when its decision is implemented, released, or
externally relied upon—not merely when its status first changes to `Accepted`.
The aim is to keep the current decision clear without silently rewriting the
architecture that software, RDF, releases, or collaborators already used.

| Lifecycle | Revision rule |
|---|---|
| **Proposed** | Freely edit, rename, split, replace, or consolidate it. Keep the index and direct links current. |
| **Accepted · implementation pending** | The maintainer may revise it in place while no code, RDF/schema contract, release, or external citation relies on the accepted choice. Keep the original acceptance date, add `revised before implementation YYYY-MM-DD`, and add a short revision note naming the former choice and why it changed. Update direct cross-links and implementation plans in the same change. If the replacement is not yet accepted, return the ADR to `Proposed`. |
| **Implemented, released, or cited** | The decision and its rationale are historical. They may be edited for clarity, brevity, typos, links, and accurate implementation status, but an edit must not silently change the architectural choice. Add a dated note when condensation could obscure history. Record a substantive change in a new ADR, and mark the earlier record `Amended by NNNN` or `Superseded by NNNN`. |
| **Consolidation** | Proposed or accepted-but-unimplemented records may be consolidated when the result remains one coherent decision. Keep one canonical number. A record already committed or linked becomes a short `Consolidated into NNNN` tombstone; an unpublished draft may be removed. Never reuse ADR numbers or rewrite shared Git history. Implemented, released, or cited ADRs may be summarized by later current guidance but are not consolidated away. |

Status is one of `Proposed`, `Accepted`, `Deprecated`, `Consolidated into NNNN`,
or `Superseded by NNNN`. An accepted ADR may add lifecycle detail such as
`implementation pending`, `revised before implementation YYYY-MM-DD`,
`implemented`, or `released in X.Y.Z`. Use `Amended by NNNN` when the original
decision remains partly active; use `Superseded by NNNN` when it no longer does.

The filename and ADR number should remain stable once another document, RDF
resource, release, or external reader links to them. Editing an ADR never means
amending or rebasing already shared Git commits: the new commit records the
revision.

## Adding an ADR

1. Copy the structure of an existing file.
2. Give it the next sequential number and a short descriptive slug.
3. Set and maintain status under the lifecycle policy above. Status must
   describe reality precisely, including partial implementation. An ADR marked
   `Proposed` while the code ships it is worse than no record.
4. Add or update the index row. If another ADR amends, supersedes, or
   consolidates this one, update both records and their index rows. Preserve a
   historical row when the record has already been committed or linked.
5. The Decision cell is the file's own H1, minus the
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
