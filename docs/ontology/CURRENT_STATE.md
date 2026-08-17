# SSTIM Current State and Next Steps

**Status:** maintained current-state summary, reviewed 2026-08-17. This is the
starting point for ontology work. Dated audits remain evidence for individual
decisions, but they describe the repository state on their stated dates rather
than the state summarized here.

## Authoritative facts

SSTIM separates its mutable development sources from its immutable citable
releases. Do not infer one from the other.

| Question | Current answer | Authority |
|---|---|---|
| What is being edited? | `0.16.0-dev`, synchronized development suite | [`manifest.json`](../../static/ontology/manifest.json) |
| What can be cited? | `0.15.0`, released 2026-08-17 | [`void.ttl`](../../static/ontology/void.ttl) and [`CITATION.cff`](../../CITATION.cff) |
| Which DOI identifies that release? | pending Zenodo archival of the `v0.15.0` tag | [`void.ttl`](../../static/ontology/void.ttl) |
| Which DOI identifies SSTIM across releases? | `10.5281/zenodo.21286974` | [`CITATION.cff`](../../CITATION.cff) |
| What changed? | The signal layer, neural oscillations, the public-claim contract and the preset contract | [`CHANGELOG.md`](../../CHANGELOG.md) |
| Where is the model going? | Waveforms, panning/modulation, protocol namespacing, all-senses coverage | [`SSTIM_DIRECTIONS.md`](SSTIM_DIRECTIONS.md) |
| Which modules and profiles exist? | 18 manifest-owned modules and four profile entry points | [`manifest.json`](../../static/ontology/manifest.json) |

The live line is mutable, carries no `owl:versionIRI`, and is not a citable
release. The frozen [`0.15.0/`](../../static/ontology/0.15.0/) directory is the
latest immutable whole-set snapshot. Its version IRI resolves to the frozen
namespace catalogue rather than to `sstim-core.ttl`, which is now only the
two-class Kernel.

The mutable line was reopened the same day the snapshot was cut, which is the
rule rather than a convenience. Between the two, the live sources *are* the
release — carrying `mod:status "released"` and byte-identical to the frozen
directory — so any ontology edit in that window would make a released line
differ from the snapshot carrying its name. That is the defect the 2026-07-24
audit found in three earlier snapshots, and every gate passes while it holds,
because the line is internally consistent and merely mislabelled.

## Architecture as built

The manifest owns 16 semantic modules and two validation modules. Their direct
dependencies form an acyclic graph, every public term has one authoritative
source, and all modules advance on one synchronized version line. The readable
dependency table is in the [module architecture guide](MODULE_ARCHITECTURE.md);
the manifest remains normative.

The four profile entry points serve different adoption needs:

| Profile | Semantic closure | Validation meaning |
|---|---|---|
| Kernel | `Stimulation` and `SensoryStimulation` | Discovery entry point only; intentionally no SHACL package |
| Core | Kernel plus engine-independent stimulus descriptions | Weak reusable Core SHACL contract |
| Core Plus | Core plus shared quantities and descriptors | Reuses the Core shape package; no separate Common package yet |
| Full | All 16 semantic modules | Full SHACL and SHACL-SPARQL contract |

Kernel is therefore a profile, but not a conformance target. Core, Core Plus,
and Full have executable positive, out-of-scope, adversarial, and competency
contracts appropriate to their declared shape closures. A consumer should
select the smallest profile that answers its use case and should select SHACL
explicitly; OWL imports do not silently import validation policy.

The persistent publication routes preserve the distinction between namespace
catalogues and exact modules:

- `https://w3id.org/sstim` identifies the suite and negotiates the generated
  Full namespace catalogue;
- `https://w3id.org/sstim/kernel` retrieves the exact Kernel;
- `https://w3id.org/sstim/exposure` negotiates the Stimulus + Exposure
  namespace catalogue; and
- `https://w3id.org/sstim/module/exposure` retrieves the exact Exposure module
  and is the mutable import endpoint.

## Semantic coverage

SSTIM currently distinguishes four description layers:

1. the stimulation process;
2. an engine-independent `StimulusSpecification` describing what reaches a
   target;
3. an engine-dependent `Preset` configuration; and
4. a `SessionSpecification` plan plus the executed `SessionInstance` activity.

The Full profile also represents techniques, frameworks, protocols,
implementations, delivery and perception, calibrated descriptors, safety
advisories, evidence assessments, research hypotheses, neuromodulation,
Patch Studio parameters, sessions and self-reports, and qualified ecosystem
relationships.

Evidence is scoped and revisioned. An `EvidenceAssessmentClaim` evaluates one
subject, assesses one bounded proposition, has one or more qualified evidence
bases, and records direction, tier, provenance, and review state. Hypotheses,
requirements, observations, design objectives, planned outcomes, and
knowledge-status assertions are separate types and do not become evidence
claims merely because they are useful or adjacent. The deprecated scalar
modality and assessment-summary fields are compatibility terms, not the current
authoring contract.

The public C0-C5 claim-level check is a provisional reject-only compatibility
control. It reduces risk but does not authorize copy. Exact expression-level
authorization and the BSC Lab publication profile remain proposed in
[ADR 0028](../decisions/0028-atomic-claim-propositions-and-public-expressions.md)
and [ADR 0029](../decisions/0029-bsc-lab-public-claim-publication-profile.md).

## Data and privacy boundaries

Committed instance RDF is public reference data, not ontology term space and
not part of the immutable ontology snapshots. It currently includes the BSC
framework and implementations, two reference protocols, two reference presets,
seven DOI-identified references, ten exploratory exposure examples, evidence
assessments, and one explicitly synthetic session with phased self-reports.

The committed ecosystem graph is synthetic contract data. Real ecosystem
records live in a separately hosted mutable projection and pass a private-first
admission process. Private BioSynCare catalog data, authentication identifiers,
contact channels, raw consent evidence, private audit history, and real
participant observations are not committed to this repository.

The browser loads ontology modules from the manifest into canonical named
graphs. Its static instance inventory is still explicit in `src/rdf/loader.js`;
there is no generated instance manifest yet. Annotations and the optional live
ecosystem projection use separate graph and storage boundaries.

## Validation and publication state

The complete pinned gate passed on 2026-08-17, on the tree the `0.15.0`
snapshot was cut from (`make validate`, and 816 tests under `make test`):

```bash
nix develop --command make validate
nix develop --command make test
```

The gate covers manifest schema and checksums, module ownership and direct
dependencies, all profile contracts, Full-union compatibility, SHACL over
modules and public instances, ecosystem admission fixtures, repository-wide
quality and competency checks, HermiT consistency over the 16 local semantic
modules, Turtle/JSON-LD/RDF/XML round trips, the public JSON-LD context, frozen
snapshot checksums, w3id route targets, release rehearsal, and documentation
truth checks. The application suite also passes.

This is strong evidence that the graph satisfies its declared local contracts.
It is not an independent ontology review, a validation of every external upper
ontology, proof of a scientific effect, or evidence that proposed privacy and
publication models are implemented.

## Assessment and practical usefulness

### Bottom line: great

On the scale **bad → good → great → excellent → exceptional**, SSTIM is
**great overall in its current state**.

That rating is deliberately split from enthusiasm about individual parts:

| Dimension | Assessment | Reason |
|---|---|---|
| Repository and release engineering | Excellent | Immutable snapshots, persistent identifiers, manifest-driven modules, profile contracts, SHACL, reasoning, round-trip checks, release rehearsal, and truth audits form an unusually strong gate |
| Knowledge representation | Great | The process/stimulus/configuration/execution layers, scoped evidence model, controlled values, privacy boundaries, and explicit optional concerns are coherent and useful |
| Documentation and epistemic discipline | Great | Decisions and limitations are unusually explicit, effect language is conservative, and historical audits are preserved; active guidance has nevertheless drifted and still needs consolidation |
| Interoperability readiness | Great for bounded SSTIM exchange; good beyond it | Stable IRIs, profiles, RDF serializations, SHACL and SPARQL support reuse, but HED/BIDS/NWB adapters, concern-specific packages, mapping provenance and some semantic splits remain unfinished |
| Community maturity | Good | The W3C Community Group and publication infrastructure exist, but independent review, third-party implementations, external citations and shared maintainership are not yet demonstrated at the level expected of a mature standard |

It is more than **good** because it is not merely a plausible vocabulary: it has
implemented semantic boundaries, executable consumer profiles, public examples,
stable publication, migration history, and regression gates that catch changes
across OWL, SKOS, SHACL, JSON-LD, instances, documentation and release artifacts.

It is not yet **excellent overall** because several important contracts remain
incomplete: executed sessions, qualified participant observations,
expression-level public-claim governance, browser-side validation, frequency
semantics, concern-specific vocabulary and shape packages, and independent
review. It is not **exceptional** because that label should require demonstrated
external adoption and durable multi-party stewardship, not only strong work by
its originating project.

### Is SSTIM useful now?

**Yes, within its stated scope.** SSTIM is useful when two systems or people need
to exchange, validate, query, compare, or publish structured knowledge about
sensory stimulation without collapsing the stimulation itself, an engine's
settings, an intended session, an executed session, and an evidence claim into
one object.

Its most practical uses today are:

1. **Portable stimulus descriptions.** A researcher or developer can use Core
   to describe a determinate, stochastic or adaptive stimulus and its channels
   independently of the engine that produced it. This makes cross-tool
   comparison more defensible than exchanging opaque gain and waveform fields.
2. **Validated knowledge graphs.** A project can use Core, Core Plus or Full as
   an explicit contract, validate instance RDF with the associated SHACL
   package, and use the competency queries as executable examples of what the
   selected profile promises.
3. **Protocols, configurations and provenance.** Full can connect techniques,
   protocols, implementations, presets, stimulus specifications, exposures and
   session plans while preserving their different roles. This is useful for
   catalogues, reproducible examples and research metadata.
4. **Evidence curation without global efficacy claims.** Curators can attach an
   immutable, scoped assessment to one preset or technique, keep proposition,
   direction, tier, source-level basis and review provenance separate, and
   represent mixed or refuting evidence without changing the subject's identity.
5. **Conservative safety and hypothesis metadata.** Projects can describe
   cautions, exposure hypotheses, requirements and knowledge-status assertions
   without promoting them to observed effects or evidence claims.
6. **Citable linked data.** Stable w3id routes, frozen version IRIs, a concept
   DOI, version DOIs, VoID/DCAT metadata and generated serializations make SSTIM
   suitable for a paper supplement, public dataset or reusable semantic layer.
7. **Ontology-aware applications.** The BSC Lab graph browser and SPARQL surface
   demonstrate how a client can derive module inventory from the manifest,
   load named graphs, navigate SKOS/OWL terms and query evidence trails.

### How to use it

1. **Choose the smallest profile.** Use Kernel only for discovery, Core for an
   engine-independent stimulus description, Core Plus when shared calibrated
   descriptors are needed, and Full for techniques, configurations, sessions,
   evidence, exposure, ecosystem, vocabulary or alignment concerns. The stable
   entry points are `/sstim/profile/kernel`, `/sstim/profile/core`,
   `/sstim/profile/core-plus`, and `/sstim/profile/full`.
2. **Pin a release for published work.** Use the immutable `0.15.0` profile and
   module URLs for a paper or dataset. Use the `-dev` line only when
   intentionally testing mutable development sources.
3. **Keep data out of the term namespace.** Reuse SSTIM classes, properties and
   controlled concepts, but mint protocols, presets, sessions, assessments and
   other records under the adopter's own stable namespace.
4. **Load the declared closure.** Read modules, direct dependencies, graph IRIs,
   profile membership and applicable shape modules from `manifest.json`; do not
   reconstruct them from a directory listing or assume `sstim-core.ttl` is the
   whole ontology.
5. **Validate and query.** Run the selected SHACL contract with its declared
   inference mode, exercise the corresponding competency query, and keep
   ontology conformance distinct from scientific validation of the represented
   protocol or claim.
6. **Record version and provenance.** Publish the profile/version IRI, source
   and generated-artifact hashes, creation and modification dates, responsible
   agents, and any local mapping or policy version needed to reproduce the
   graph.

For a local SSTIM checkout, the quickest complete verification is:

```bash
nix develop --command make validate
nix develop --command make test
```

An adopter who only needs a small private audio preset object, has no RDF
consumers, and does not need cross-engine meaning may find SSTIM unnecessary.
SSTIM should also not yet be used as a clinical decision system, proof that a
stimulation has an effect, a production schema for identifiable participant
observations, or a claim of turnkey HED/BIDS/NWB interoperability.

## Phase 1 of the improvement plan is complete

Every audit finding scheduled for Phase 1 is closed, most of them in the week to
2026-08-15:

| Finding | Closed by |
|---|---|
| KR-02, KR-03 | [ADR 0048](../decisions/0048-session-events-and-qualified-observations.md) — session events on the engine clock, qualified observations where absence carries its reason. Released in `0.14.0` |
| KR-05 | Union domains repaired, with entailment fixtures (`make entailment-check`) proving no unintended type is inferred |
| KR-08, KR-09 | [ADR 0049](../decisions/0049-neural-oscillations-and-frequency-ambits.md) — neural oscillations as their own terms; outcome prose left the frequency bands without being deleted; alignments re-pointed and provenance-annotated |
| KR-04 | [ADR 0050](../decisions/0050-public-claim-applicability-contract.md) — an eight-clause applicability contract replaced a single tier test. No claim can currently authorize C3 or C5, because no evidence review has ever been run |
| KR-07 | [ADR 0051](../decisions/0051-sstim-preset-contract.md) — SSTIM's own preset contract, and the four named SHACL gaps closed |

What that leaves open is in [`SSTIM_DIRECTIONS.md`](SSTIM_DIRECTIONS.md) (where
the model is going) and Phases 1.2b–1.2c, 1.5 and beyond in the
[improvement plan](IMPROVEMENT_PLAN.md).

## Known limitations

The main gaps are design and coverage gaps, not current parser failures:

- **Waveform and spatialisation have no SSTIM terms at all.** Both are
  output-affecting, so KR-07's "many output-affecting parameters are not
  captured" is only partly closed. Directions §1 and §2.
- **The modality scheme names six senses and disagrees with the channel list.**
  `sstim-ex:StimulusChannel` recognises gustatory and electromagnetic paths that
  no modality concept backs. Direction §4a.
- **Martigli and Symmetry parameters sit in the core namespace.** They are named
  specific techniques, not universal primitives, and belong in protocol-scoped
  namespaces. Direction §3.

- `SessionSpecification` and `masterVolume` remain audio-shaped, but the
  executed-session gap closed on 2026-08-13. The native contract
  ([`session.schema.json`](../../static/schemas/session.schema.json),
  `src/session/`) and its SSTIM terms
  ([ADR 0048](../decisions/0048-session-events-and-qualified-observations.md))
  landed together: event timeline on the engine clock, clock origin and timing
  authority, delivered versus elapsed duration, declared reproducibility level,
  and a configuration digest. The portable Patch Studio package solves object
  interchange; this solves executed-session recording.
- Qualified participant observations, structured unwanted experiences and
  missing/declined states are now representable in both forms —
  `sstim:ParticipantObservation` with a required six-value response state,
  `sstim:UnwantedExperienceObservation`, and `sstim:ObservationInstrument`.
  Their **privacy and provenance profile is native-only by choice**: it is
  required on every bundle and lint-enforced, but no SSTIM terms were minted for
  consent, because that is entangled with ADR 0031's public/private split and
  needs its own decision. Real participant data therefore still does not enter
  the committed graph, though the record is now structured enough to hold it
  safely elsewhere. Run `make session-contract` for what the projection
  withholds and why.
- Browser-side SHACL validation and the public preset-to-runtime export path are
  planned; repository and runtime-generator tests are the present validation
  surfaces.
- Core Plus has no distinct Common validation distribution, and optional
  concern and bridge modules do not yet have reusable shape packages.
- The controlled vocabulary remains coupled to the Full compatibility closure;
  concern-specific vocabulary distributions do not exist.
- Exposure still combines delivery/safety with experiment, hypothesis, and
  knowledge-status concerns. Evidence subjects also need generalization before
  Evidence can become a smaller Core-oriented extension.
- Stimulus and Exposure expose overlapping frequency/flicker quantities, and
  frequency-band concepts still conflate observed neural oscillations with
  stimulus targets.
- External mappings need per-mapping provenance and continued conservative
  review. Multilingual preferred labels are substantial, but alias coverage and
  measured per-scheme language coverage remain weak.
- VoID subsets are checked against the frozen release manifest but are not
  generated from the live manifest, leaving an avoidable maintenance seam.
- Independent ontology, domain, privacy, and linked-data review remains
  desirable.

## What to do next

This document says what exists; it deliberately does not carry a second copy of
the work queue. Three documents own that, at three granularities:

| For | Read |
|---|---|
| The audit-driven ontology sequence and its release gates | [Improvement plan](IMPROVEMENT_PLAN.md) |
| Where the model is going, and why | [Design directions](SSTIM_DIRECTIONS.md) |
| Operational tasks across the whole project | [`TODO.md`](../../TODO.md) |

The six recommendations that used to sit here were written before `0.14`. Three
of them — bounding that change set, establishing the native session contract,
and adding qualified observations — shipped in it, and a fourth was overtaken by
[ADR 0050](../decisions/0050-public-claim-applicability-contract.md), which
replaced the reject-only posture with an actual authorization contract. A
next-steps list that recommends finished work is worse than none, and keeping
one here meant maintaining it in four places instead of three.

## Release acceptance

The release gate is one list, and the improvement plan owns it:
[next-release acceptance criteria](IMPROVEMENT_PLAN.md#next-release-acceptance-criteria).
It was stated twice, in slightly different words, which is the way two lists
start disagreeing about what "ready" means.
