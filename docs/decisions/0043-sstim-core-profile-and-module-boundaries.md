# ADR 0043 — SSTIM Kernel, Core, Core Plus, concern modules, and Full Profile

**Status:** Accepted — 2026-08-01 · implemented and released in SSTIM 0.13.0

Implements the architectural direction recorded in
[ADR 0041 §6](0041-stimulus-description-layers-and-the-canonical-schema-gap.md#6-a-small-core-with-adjunctive-modules).
This is not the semantic “split” in
[ADR 0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md),
which distinguishes kinds and senses of neuromodulation inside the domain model.
The evidence for this decision is the
[2026-08-01 core and module boundary audit](../ontology/reviews/2026-08-01-sstim-core-and-module-boundary-audit.md).

## Context

SSTIM 0.12.0 is a coherent Full graph, but its root source is not a small
reusable contract. `sstim-core.ttl` mixes stimulation, techniques, protocols,
neuromodulation, evidence, configurations, sessions, caution metadata, and BSC
voice terms. Existing source files are useful publication and named-graph
boundaries, but they are not complete consumer modules: dependencies are
cyclic or undeclared, validation policy is aggregated, and inventories are
repeated across loader, release, VoID, route, test, and documentation code.

The problem is not a line or triple limit. It is the absence of a dependable
small conformance target and machine-discoverable optional closures. Adding
more files without defining profiles, dependencies, ownership, validation, and
compatibility would preserve that problem under more filenames.

## Decision

### 1. Distinguish suite, module, profile, source, and graph

**SSTIM** remains the whole ontology suite. A concern becoming optional does not
remove it from SSTIM's accepted scope.

A **module** is an ontology with one authoritative source, ontology IRI, direct
dependency declaration, and term or axiom ownership. A **profile** is a
versioned, checksummed closure of semantic modules plus an explicitly associated
SHACL closure. A physical file, term namespace, module IRI, runtime named graph,
and conformance profile are different things.

The stable profile entry points are:

| Profile | IRI | Exact 0.13 semantic closure |
|---|---|---|
| Kernel | `https://w3id.org/sstim/profile/kernel` | `sstim-core.ttl` |
| Core | `https://w3id.org/sstim/profile/core` | Kernel + `sstim-stimulus.ttl` |
| Core Plus | `https://w3id.org/sstim/profile/core-plus` | Core + `sstim-common.ttl` |
| Full | `https://w3id.org/sstim/profile/full` | Every 0.13 term-space module listed below: semantic concerns, bridges, vocabulary, alignments, ecosystem, and the Patch Studio implementation profile |

`https://w3id.org/sstim` remains the established suite/root IRI and the base of
the `https://w3id.org/sstim#` term namespace. Its negotiated RDF representation
is a generated Full namespace catalogue so that a client dereferencing any
`sstim:` hash term can retrieve that term's definition even when its
authoritative triples moved out of `sstim-core.ttl`. It is not the Kernel import
artifact. The small Kernel source retains the logical ontology IRI
`https://w3id.org/sstim`, remains `sstim-core.ttl`, and has the distinct exact
import/distribution endpoint `https://w3id.org/sstim/kernel`. Profile IRIs
remove the ambiguity that would result from treating either the namespace
catalogue or that physical source as “Core” or “all of SSTIM.”

### 2. Fix the Kernel, Core, and Core Plus boundaries

The **Kernel** is the dependency-free SSTIM process anchor. In 0.13 it owns only:

- `sstim:Stimulation`; and
- `sstim:SensoryStimulation`.

“Dependency-free” means no dependency on another SSTIM module. Reuse of stable
BFO and other standard IRIs does not imply importing their complete ontologies.

The **Core Profile** adds the engine-independent description contract from
`https://w3id.org/sstim/stimulus`:

- `sstim:StimulusSpecification` and `sstim:describesStimulation`;
- the stable `sstim-ex:StimulusChannel` IRI and
  `sstim:hasStimulusChannel`;
- `sstim:stimulusRegime` and generic channel duration; and
- optional `sstim:hasStimulationTarget`.

The channel ownership and definition change, and the profile-sensitive target
domain, are the one semantic clarification authorized for the refactor; they
are specified separately in [ADR 0044](0044-stimulus-channel-core-ownership.md).

The **Core Plus Profile** adds `https://w3id.org/sstim/common`, an optional
shared-descriptor module used by several larger concerns. It owns the shared
classes and relations for frequency bands, sensory modality, stimulation
mechanism, intended effect, temporal structure, delivery approach, cautions,
provenance helpers, and calibrated channel quantities such as frequency, SPL,
luminance, and flash rate.

Core Plus is not “more mandatory Core.” A consumer that needs only process,
specification, channel, regime, duration, and optional target implements Core.
The still-unsplit `sstim-vocab.ttl` is a Full/compatibility distribution in
0.13; it is not a hidden Core Plus dependency.

### 3. Adopt these concern and bridge dependencies

The following table is normative for the 0.13 module graph. “Requires” lists
direct local dependencies; their transitive dependencies are part of the
consumer closure.

| Logical module IRI | Responsibility | Direct local requirements |
|---|---|---|
| `https://w3id.org/sstim` | Kernel process classes; exact distribution at `/kernel` | None |
| `/stimulus` | Core stimulus descriptions and channels | Kernel |
| `/core-shapes` | Weak reusable SHACL contract associated with Core and Core Plus | Kernel + Stimulus; selected as validation, never an OWL dependency |
| `/common` | Optional descriptors and calibrated quantities | Stimulus |
| `/technique` | Techniques, frameworks, protocols, and implementations | Common |
| `/configuration` | Presets, generic tracks, defaults, and configuration-to-stimulus/technique bridges | Stimulus + Common + Technique |
| `/session` | Interventions, session plans/executions, overrides, and self-reports | Kernel + Stimulus + Common + Configuration |
| `/neuromodulation` | ADR 0034–0037 neuromodulation, neurostimulation, self-regulation, neural facets, and neuroplasticity | Kernel + Common + Technique + Session |
| `/evidence` | Assessments, propositions, scope, basis, sources, search/review governance, and public-claim metadata | Common + Technique + Configuration |
| `/exposure` (exact import/distribution endpoint: `/module/exposure`) | The existing combined delivery, perception, limit, experiment, hypothesis, and knowledge-status concern | Kernel + Stimulus + Technique + Configuration + Evidence + compatibility vocabulary |
| `/ecosystem` | Agents, qualified relationships, purposes, and publication/consent lifecycle | Technique for implementation-separation semantics; standard PROV/Schema.org/ORG reuse is external |
| `/patch-studio` | BSC catalogue and Patch Studio voice/parameter profile | Configuration + Session |
| `/technique-exposure` | Characteristic delivery media for vocabulary-owned techniques | Exposure + Vocabulary |
| `/evidence-exposure` | The intact evidence scope/basis ranges that include exposure and experiment types | Evidence + Exposure + Configuration + Technique + Session |
| `/neuromodulation-evidence` | Evidence outcome relations over neural route/site/system/phenomenon facets | Neuromodulation + Evidence |
| `/vocab` | The 0.13 compatibility aggregate of controlled values from every concern | Common + Technique + Neuromodulation + Evidence + Session + Patch Studio |
| `/alignments` | External mappings and upper-ontology alignment assertions | Common + Technique + Session + Evidence + Vocabulary |
| `/shapes` | Full validation-policy compatibility aggregate | Every concern module referenced by its shapes: Kernel, Stimulus, Common, Technique, Configuration, Session, Neuromodulation, Evidence, Exposure, Ecosystem, Patch Studio, and Vocabulary; associated as a shape graph, never an OWL dependency |

These dependencies are intentionally honest rather than aspirational:

- Evidence is not Core-only in 0.13. Its existing assessment subjects include
  configurations and techniques. Generalizing the evidence subject is separate
  semantic work.
- Configuration depends on Technique because implementations, protocols, and
  technique-facing relations are part of the existing configuration contract.
- Session depends on Configuration and owns the cross-layer union-domain axioms
  involving `SessionSpecification`.
- Neuromodulation depends on Session because its intervention specializations
  reuse the intervention layer; Configuration is therefore a transitive
  dependency.
- Exposure still combines delivery and research semantics. It must not be
  advertised as a small independent Delivery module until those concerns are
  separated by a later decision.

Cross-concern axioms live in the most-specific dependent module. When neither
direction is natural, they live in an explicit leaf bridge. A property may be
declared in a reusable base while a range, domain, mapping, or assertion that
mentions optional types lives in a bridge.

An `owl:unionOf` is kept as one intact RDF list in one dependent module. It must
never be replaced by several `rdfs:domain` or `rdfs:range` statements: multiple
domains or ranges have intersection semantics.

### 4. Define the Full compatibility closure exactly

The 0.13 **Full semantic closure** is the union of:

1. Kernel, Stimulus, Common, Technique, Configuration, Session,
   Neuromodulation, Evidence, Exposure, and Ecosystem;
2. the Patch Studio/BSC implementation profile;
3. Technique–Exposure, Evidence–Exposure, and
   Neuromodulation–Evidence bridges;
4. the compatibility `sstim-vocab.ttl` controlled-value aggregate; and
5. the optional-leaf `sstim-alignments.ttl` alignment aggregate.

The Full validation distribution additionally associates
`sstim-shapes.ttl`. Shapes are not semantic OWL dependencies and are never
silently introduced by `owl:imports`.

Alignments are optional in every smaller profile. They remain in Full because
the 0.12 application and registry aggregate included them. The main vocabulary
also remains Full-only in 0.13 because it still spans every concern. Later
concern-specific vocabulary distributions may be extracted without changing
concept or scheme IRIs.

Do not split by sensory modality, mirror every taxonomy branch with a source
file, or create one class per module. A concern earns a module boundary only
when a consumer can meaningfully omit it.

### 5. Make one manifest the bill of materials

One versioned machine-readable manifest is authoritative for modules and
profiles. For every module it records:

- ontology IRI, source distribution, content role, and runtime graph IRI;
- direct dependencies and profile membership;
- synchronized suite version and checksum; and
- whether the artifact is semantic OWL, controlled vocabulary, bridge,
  alignment, SHACL, or implementation profile.

For every profile it records:

- exact semantic, vocabulary, alignment, and shape closures;
- inference mode;
- positive, out-of-scope, and adversarial fixture sets; and
- competency-query set.

Profile entry points also use the W3C Profiles Vocabulary. Each is both an OWL
entry-point ontology and a `prof:Profile`, relates to SSTIM with
`prof:isProfileOf`, and exposes resource descriptors for its import artifact,
associated SHACL graph where one exists, and authoritative manifest. This
makes shape selection and the bill of materials discoverable without making a
shape graph an OWL dependency.

Those descriptors follow the same mutable-versus-immutable distinction as OWL
imports. Development entry points may advertise the stable profile, shape, and
manifest endpoints. Before snapshotting a release, their entry-point,
constraints, and manifest `prof:hasArtifact` targets must be the exact versioned
profile, shape, and manifest URLs. The released manifest's `$schema` and
`immutableRelease.schemaUrl` must both identify the frozen versioned
`manifest.schema.json` sibling; a mutable schema URL is not a reproducible
release contract. Every manifest-owned fixture and competency-query path must
also resolve to a repository file.

Logical dependency and network retrieval are deliberately separate. A profile
uses `dct:requires` for the stable logical module IRIs. On the mutable
development line its `owl:imports` use the physical module distribution
endpoints, not namespace-catalogue responses. Before a release is snapshotted,
those imports are made exact versioned sibling artifact URLs under the release
base. A released profile can therefore neither acquire a later module revision
nor accidentally import the broader RDF returned for hash-term discovery.
In particular, a profile names `https://w3id.org/sstim/exposure` in
`dct:requires`, but imports the exact Exposure distribution from
`https://w3id.org/sstim/module/exposure`; it never imports the combined
namespace catalogue from `/sstim/exposure`.

Loader, exporter, snapshotter, VoID/DCAT, routes, contexts, generated
documentation, quality audit, and release checks must derive from or verify
against the manifest. Adding a source in only one inventory must fail CI.

Named graphs from [ADR 0003](0003-named-graphs-for-modules.md) remain runtime
provenance. The manifest provides dependency discovery. They are complementary:
a named graph is not an import closure, and an import closure is not runtime
provenance.

### 5.1 Keep namespace discovery separate from imports

Content negotiation at `https://w3id.org/sstim` serves the generated Full RDF
namespace catalogue for `https://w3id.org/sstim#` terms and the corresponding
human documentation. Because `StimulusChannel` preserves its established
`https://w3id.org/sstim/exposure#StimulusChannel` IRI while its authoritative
declaration moves to Stimulus, the RDF namespace catalogue negotiated at
`https://w3id.org/sstim/exposure` contains both the Stimulus and Exposure
graphs. This namespace route is therefore not the exact Exposure module
distribution or an OWL import endpoint. The exact Exposure module is obtained
from `https://w3id.org/sstim/module/exposure`; the exact Kernel distribution is
obtained from `https://w3id.org/sstim/kernel`.

These catalogues exist for namespace and hash-term dereference; they are not
module identity or profile-closure boundaries. Negotiated namespace and profile
routes must emit `Vary: Accept` so HTML and RDF representations are not
incorrectly shared by caches.

### 6. Package SHACL by profile and bridge

SHACL has an independent dependency graph. SSTIM 0.13 publishes the reusable
Core shape package and retains the existing Full compatibility package. It does
not yet claim independently reusable Technique, Evidence, Exposure, or other
concern conformance profiles. When those profiles are introduced, their base
and bridge shape packages follow these rules:

- each concern package owns base shapes that refer only to its declared semantic
  closure;
- constraints connecting optional concerns live wholly in an explicit bridge
  shape graph;
- a base constraint must not forbid a subject or value that an optional bridge
  is expected to admit, because SHACL constraints combine conjunctively and an
  extension cannot relax an already-loaded `sh:not`, `sh:or`, or closed shape;
- ontology-metadata and SKOS-publication lint targets manifest-owned SSTIM
  nodes, not every `owl:Ontology`, `skos:Concept`, or `skos:ConceptScheme` in a
  consumer graph; and
- one authoritative graph owns each shape. Authored fragments of the same shape
  node are not distributed across files.

`sstim-shapes.ttl` remains the 0.13 Full compatibility bundle and preserves
the behavior of existing published shape IRIs except for the optional-link
hardening recorded by ADR 0044. Weaker reusable base shapes use new shape IRIs.
The manifest selects shape graphs explicitly; loading a semantic module never
silently opts a consumer into Full validation policy.

Concern-specific and bridge shape extraction beyond Core is therefore a staged
follow-up coupled to publishing the corresponding conformance profiles, not an
unimplemented requirement for the 0.13 graph redistribution itself. Full shapes
must not be presented as a standalone concern contract in the meantime.

Every profile is validated with its own closure and authoritative pySHACL run,
including SHACL-SPARQL constraints. A Full-only green result is not evidence that
a smaller profile is independently usable.

### 7. Define conformance direction

A dataset conforms to a named profile only when it is validated against that
profile's versioned semantic and SHACL closures.

Full conformance entails conformance to the applicable base constraints of its
included profiles. The converse is deliberately false: a Core-conformant graph
need not provide delivery media, technique metadata, evidence governance,
configuration, session, or publication fields demanded by Full.

The absence of an optional module means “not asserted under this profile,” not
“rejected by SSTIM.” Profile documentation must distinguish out-of-scope data
from invalid data. Each profile therefore requires an out-of-scope positive
fixture proving that omitted concern policy does not leak into its validation.

### 8. Preserve Full semantics and public identities

All public class, property, concept, scheme, and shape IRIs remain stable unless
a separate semantic ADR says otherwise. Frozen version directories remain
immutable, and synchronized suite releases continue under
[ADR 0020](0020-whole-set-snapshot-versioning.md).

The redistribution contract is **union-graph equivalence**, not RDF Dataset or
named-graph equivalence. Merge the frozen 0.12 public distribution and the 0.13
Full distribution—including vocabulary, alignments, and its associated SHACL
graph—separately, then compare RDF graph isomorphism after excluding:

- ontology-header triples;
- intentional `rdfs:isDefinedBy` ownership changes;
- the `StimulusChannel` definition clarification and named optional-link SHACL
  hardening authorized by ADR 0044; and
- the exact old and new `sstim:Track` `skos:scopeNote` literals for the annotation
  erratum below.

The 0.12 Full graph asserted `sstim:Voice rdfs:subClassOf sstim:AudioTrack`, and
its own 0.12 history note says ADR 0041 reinstated that subsumption, but
`sstim:Track` retained an older scope note calling Voice parallel and the
subsumption an open question. SSTIM 0.13 corrects only that contradictory
annotation; it neither adds nor removes a logical axiom. The equivalence gate
normalizes the two exact scope-note literals rather than excluding scope notes
or annotation changes generally.

Named-graph membership is expected to change as ownership changes; it is checked
against the new manifest instead of the 0.12 dataset layout. No line-based or
blank-node-identifier comparison is sufficient for this gate.

The root `sstim-core.ttl` distribution becomes much smaller, so a consumer that
mistook that physical file for the whole ontology must migrate to the explicit
Full distribution/profile. That distribution change is intentional; the Full
semantic graph, public IRIs, supported instances, queries, and serialization
round trips remain compatible.

Independent module version trains are not introduced in 0.13. Existence of
several files is not evidence that independent release cadence is safe.

## 0.13 rollout and release gates

**All eight rollout steps completed in SSTIM 0.13.0**: ADR 0044 accepted and the
channel declaration moved with its IRI preserved; terms and cross-axioms
redistributed with one authoritative owner each; the manifest added and every
inventory consumer wired through it; normalized 0.12-to-0.13 Full union-graph
equivalence proved; the weak Core SHACL closure published alongside the Full
aggregate; per-profile fixtures and competency queries added; and the full gate
suite run for each profile. The recurring per-release procedure now lives in
[`static/ontology/README.md`](../../static/ontology/README.md#versioning-and-publication).

The rules below outlived the rollout and bind every future release.

For OWLAPI-based reasoning, a profile's RDF closure is unioned before RDF-to-OWL
translation. Loading every physical module as an independent OWL ontology and
only then merging can silently discard supplemental domain or range axioms whose
property declaration lives in a required module. The gate must treat any ROBOT
"could not be parsed" diagnostic as failure even when ROBOT returns status 0.

The split is not release-complete until a consumer starting from each profile
IRI can discover an immutable checksummed closure and every referenced local
term is declared in that closure. OWL's tolerance for undeclared IRIs means
successful parse/reasoning alone does not satisfy this test.

Snapshot creation is a byte-for-byte copy operation over release-prepared
artifacts, not a place to rewrite Turtle or JSON. Before that copy, profile
entry points must already import exact versioned sibling artifacts and the
release manifest must already expose their immutable public URLs, checksums,
exact import closures, shape selections, fixtures, competency queries, and
other release contracts. Its `$schema` and `immutableRelease.schemaUrl` must
already point to the frozen versioned schema sibling, and each PROF entry-point,
constraints, and manifest artifact must already be versioned. Snapshotting fails
closed if a referenced fixture/query is missing, if the ontology source set
cannot be proved clean by Git, if the version is already present in the immutable
checksum ledger, or if checksum registration fails. The copied files and their
checksums must then remain immutable.

This ADR originally blocked publication on three conditions. Two were met:
every published profile now carries nonempty profile-owned fixtures and a
competency query, and the deployed persistent routes passed content-negotiation
testing on 2026-08-04 across 19 route/`Accept` combinations — repository-local
route files were necessary but never sufficient, and that distinction held.

The third, `Vary: Accept`, **was unsatisfiable and is withdrawn as a gate.** No
w3id.org `303` emits the header, including namespaces that request it explicitly;
the directive is present and correct if the server ever permits it. The risk it
guarded against does not arise regardless: these `303`s carry no cache directives
and `303` is not heuristically cacheable under RFC 9111, so a conformant shared
cache should not store them at all. Reasoning in
[`../ecosystem/w3id/sstim/README.md`](../ecosystem/w3id/sstim/README.md).

Both were satisfied by 2026-08-04, with one qualification recorded rather than
waived. Every profile now declares fixtures and a competency query, executed
against its own closure; ADR 0045 governs the shapeless case. The deployed
routes were verified against w3id.org after
[perma-id/w3id.org#6480](https://github.com/perma-id/w3id.org/pull/6480) merged,
across 19 route/`Accept` combinations, all matching the model. `Vary: Accept` is
the qualification: no w3id.org `303` emits it, whatever the `.htaccess` asks,
and it is therefore not achievable at this registry. The requirement existed to
stop a shared cache serving one representation to a client that asked for
another; those `303`s carry no cache directives and `303` is not heuristically
cacheable under RFC 9111, so the hazard does not arise. Should SSTIM ever move
to a host that emits it, the directive is already in place.

Two consequences of demoting `sstim-core.ttl` from "the ontology" to "the
Kernel module" are also release blockers, because artifacts that stood for the
whole ontology still name that file:

- the bare version route. `owl:versionIRI <https://w3id.org/sstim/<version>>`
  must resolve to the release, not to two classes, and a frozen snapshot
  currently holds no whole-ontology document. Rollout step 5 is unmet here
  until the release path freezes a namespace catalogue or another artifact is
  chosen; `scripts/sstim-w3id-snapshot-routes.mjs` fails closed meanwhile.
- the VoID/DCAT record. It must describe the released module set and stop
  pairing a module `dcat:downloadURL` with a `dcat:accessURL` that now returns
  a multi-module namespace catalogue.

## Follow-up decisions kept out of this refactor

The 0.13 redistribution does not decide:

- a generalized Core-only evidence subject or the current neutral-technique
  OWL versus sensory-technique SHACL mismatch;
- modality-neutral replacements for the current audio-shaped session
  `masterVolume` contract and the inherited `SessionSpecification` definition's
  claim that a conforming engine determines only "the acoustic output";
- a Delivery module separated from exposure experiments, hypotheses, and
  knowledge-status assertions;
- concern-specific controlled-vocabulary distributions;
- concern-specific and bridge SHACL packages, introduced only with corresponding
  named conformance profiles;
- the stimulus/exposure frequency and flicker quantity duplication;
- the frequency-band observed-oscillation versus stimulus-target distinction;
- public-claim authorization, self-report privacy readiness, unit modeling,
  or mapping provenance; or
- independent module versioning and external-standard governance.

Those changes require their own evidence, compatibility analysis, and ADRs.
They must not be smuggled into a graph-redistribution change.

## Alternatives considered

**Keep the whole-set-only contract.** Rejected: every adopter would continue to
inherit unrelated evidence, configuration, ecosystem, and publication policy.

**Call `sstim-core.ttl` the Core Profile.** Rejected: Kernel and Core answer
different competency questions, and a profile is a closure rather than a file.

**Put all shared descriptors in Core.** Rejected: bands, mechanisms, cautions,
modal quantities, and similar terms are useful across modules but are not
necessary to identify a stimulation and its engine-independent specification.
Core Plus names this reusable optional layer honestly.

**Claim Evidence and Delivery are Core-only leaves immediately.** Rejected:
their current OWL ranges, specializations, and validation constraints refer to
Technique, Configuration, Session, or each other. Aspirational dependency
labels would recreate the undeclared-closure problem.

**Use ADR 0036 as the modularization decision.** Rejected: ADR 0036 is a semantic
taxonomy decision, not an adoption-profile decision.

**Give every module an independent version now.** Rejected: it creates a
compatibility matrix before stable standalone consumers exist.

## Consequences

SSTIM gains a genuinely small Kernel, a practical Core, an explicitly optional
Core Plus, concern modules with honest closures, and a Full compatibility
profile. Standards-oriented adopters can implement a bounded contract without
accepting BSC implementation or publication policy.

The costs are more release artifacts, a manifest and profile documentation,
bridge ownership, per-profile validation and examples, and a visible migration
for consumers of the former catch-all `sstim-core.ttl` distribution. Full graph
compatibility remains a hard gate; modularity is not permission to redesign
unrelated semantics.
