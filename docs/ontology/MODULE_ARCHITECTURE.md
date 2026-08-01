# SSTIM module architecture

This document is the consumer guide to the SSTIM `0.13.0-dev` modular line.
The decision and rationale are in
[ADR 0043](../decisions/0043-sstim-core-profile-and-module-boundaries.md);
[ADR 0044](../decisions/0044-stimulus-channel-core-ownership.md) records the
one intentional term-definition clarification made during redistribution.

## Release status

Two distributions must not be confused:

- **`0.12.0` is the latest immutable and citable release.** Its version IRI is
  `https://w3id.org/sstim/0.12.0`, its DOI is
  [10.5281/zenodo.21717988](https://doi.org/10.5281/zenodo.21717988), and its
  frozen eight-file source set remains under
  [`static/ontology/0.12.0/`](../../static/ontology/0.12.0/).
- **`0.13.0-dev` is the live modular development line.** It is mutable, is not
  a released version, and must not be cited as an immutable artifact. Its
  authoritative bill of materials is
  [`static/ontology/manifest.json`](../../static/ontology/manifest.json).

The manifest, not a prose file list, defines the live module inventory,
dependency edges, runtime graph IRIs, profile closures, checksums, and
publication locations. This document explains that contract; if it and the
manifest diverge during development, the manifest is authoritative.

## What the split means

SSTIM remains one ontology suite with a synchronized release version. The split
does not create unrelated ontologies or remove evidence, exposure, sessions, or
the BSC implementation profile from SSTIM. It separates four concepts that the
old eight-file distribution did not make dependable:

- a **module** owns terms or axioms for one concern and declares its direct
  local dependencies;
- a **profile** names an exact, transitively closed consumer contract;
- a **source** is the editable Turtle distribution for a module or profile
  entry point; and
- a **runtime named graph** records where statements came from when the suite
  is loaded.

A module IRI, a term namespace, a filename, a profile IRI, and a runtime graph
IRI are therefore not interchangeable. In particular, a term can retain an old
namespace while moving to a more appropriate authoritative source.

This distinction is visible at the root. The RDF negotiated from
`https://w3id.org/sstim` is a generated Full namespace catalogue used to
dereference `https://w3id.org/sstim#...` hash terms; it is not the two-class
Kernel import graph. The dependency-free Kernel remains authored in
[`sstim-core.ttl`](../../static/ontology/sstim-core.ttl), but its exact
import/distribution endpoint is `https://w3id.org/sstim/kernel`; its logical
ontology IRI remains `https://w3id.org/sstim`.

Exposure has a second deliberate namespace/distribution split. RDF negotiated
from `https://w3id.org/sstim/exposure` is the combined Stimulus + Exposure
namespace catalogue needed to dereference established `sstim-ex:` hash IRIs.
The exact Exposure semantic module and OWL import endpoint is
`https://w3id.org/sstim/module/exposure`.

## Modules and direct dependencies

The following is the implemented `0.13.0-dev` dependency graph. Entries in the
last column are **direct** requirements. Their transitive closures are supplied
by the manifest and must not be copied into every header.

| Module ID and source | Role | Direct local requirements |
|---|---|---|
| `core` — [`sstim-core.ttl`](../../static/ontology/sstim-core.ttl), exact distribution endpoint `/kernel` | Dependency-free Kernel: `Stimulation` and `SensoryStimulation` | None |
| `stimulus` — [`sstim-stimulus.ttl`](../../static/ontology/sstim-stimulus.ttl) | Engine-independent stimulus specifications, channels, regime, duration, and optional target | `core` |
| `common` — [`sstim-common.ttl`](../../static/ontology/sstim-common.ttl) | Shared modalities, bands, mechanisms, temporal and delivery descriptors, cautions, provenance helpers, and calibrated channel quantities | `stimulus` |
| `technique` — [`sstim-technique.ttl`](../../static/ontology/sstim-technique.ttl) | Techniques, frameworks, protocols, and implementations | `common` |
| `configuration` — [`sstim-configuration.ttl`](../../static/ontology/sstim-configuration.ttl) | Presets, generic tracks, defaults, and configuration bridges | `stimulus`, `common`, `technique` |
| `session` — [`sstim-session.ttl`](../../static/ontology/sstim-session.ttl) | Interventions, session plans and executions, overrides, and self-reports | `core`, `stimulus`, `common`, `configuration` |
| `neuromodulation` — [`sstim-neuromodulation.ttl`](../../static/ontology/sstim-neuromodulation.ttl) | Neuromodulation, neurostimulation, self-regulation, neural facets, and neuroplasticity | `core`, `common`, `technique`, `session` |
| `evidence` — [`sstim-evidence.ttl`](../../static/ontology/sstim-evidence.ttl) | Assessments, propositions, scope, basis, sources, reviews, and public-claim governance | `common`, `technique`, `configuration` |
| `exposure` — [`sstim-exposure.ttl`](../../static/ontology/sstim-exposure.ttl), exact distribution endpoint `/module/exposure` | Delivery, perception, limits, experiment context, hypotheses, and knowledge status | `core`, `stimulus`, `technique`, `configuration`, `evidence`, `vocab` |
| `ecosystem` — [`sstim-ecosystem.ttl`](../../static/ontology/sstim-ecosystem.ttl) | Agents, qualified relationships, purposes, and publication/consent lifecycle | `technique` |
| `patch-studio` — [`sstim-patch-studio.ttl`](../../static/ontology/sstim-patch-studio.ttl) | BSC catalogue and Patch Studio voice/parameter implementation profile | `configuration`, `session` |
| `technique-exposure` — [`sstim-technique-exposure.ttl`](../../static/ontology/sstim-technique-exposure.ttl) | Characteristic delivery media for vocabulary-owned techniques | `exposure`, `vocab` |
| `evidence-exposure` — [`sstim-evidence-exposure.ttl`](../../static/ontology/sstim-evidence-exposure.ttl) | Evidence scope and basis ranges involving exposures and experiments | `evidence`, `exposure`, `configuration`, `technique`, `session` |
| `neuromodulation-evidence` — [`sstim-neuromodulation-evidence.ttl`](../../static/ontology/sstim-neuromodulation-evidence.ttl) | Evidence outcome relations involving neural facets | `neuromodulation`, `evidence` |
| `vocab` — [`sstim-vocab.ttl`](../../static/ontology/sstim-vocab.ttl) | Full-compatibility aggregate of controlled values across concerns | `common`, `technique`, `neuromodulation`, `evidence`, `session`, `patch-studio` |
| `alignments` — [`sstim-alignments.ttl`](../../static/ontology/sstim-alignments.ttl) | Conservative external mappings and upper-ontology alignments | `common`, `technique`, `session`, `evidence`, `vocab` |
| `core-shapes` — [`sstim-core-shapes.ttl`](../../static/ontology/sstim-core-shapes.ttl) | Weak reusable Core SHACL contract | `core`, `stimulus` |
| `shapes` — [`sstim-shapes.ttl`](../../static/ontology/sstim-shapes.ttl) | Full validation-policy compatibility aggregate | Every concern module referenced by its shapes: `core`, `stimulus`, `common`, `technique`, `configuration`, `session`, `neuromodulation`, `evidence`, `exposure`, `ecosystem`, `patch-studio`, `vocab` |

The graph is deliberately acyclic. Some dependencies that look absent are
already transitive: for example, `common` reaches the Kernel through
`stimulus`, and `technique-exposure` reaches Technique and Neuromodulation
through Exposure and Vocabulary. Bridge modules own axioms that genuinely span
otherwise optional concerns. This avoids either making the base depend upward
or weakening an intact `owl:unionOf` into several intersection-producing
domain or range statements.

`make module-boundaries` enforces that last point directly: no SSTIM property
may carry more than one `rdfs:domain` or more than one `rdfs:range` statement
across the whole module set. Redistribution makes the mistake easy to reach,
because a property's declaration and its domain now sit in different modules by
design — `sstim:hasStimulationTarget` is declared in Stimulus and receives its
`StimulusSpecification`/`SessionSpecification` union domain in Session (ADR
0044 §3). Adding a second domain there would silently narrow the property to the
intersection instead of widening it, and no reasoner would report an error.

The main vocabulary remains a Full compatibility aggregate in `0.13.0-dev`.
Loading it is not a shortcut to a small controlled-value package: its own
dependency closure reaches several optional concerns.

## Profiles

Profiles are consumer-facing closures. The entry-point ontologies contain
`owl:imports`; validation shapes are selected separately. Profile metadata uses
the W3C Profiles Vocabulary: each entry point is a `prof:Profile`, identifies
SSTIM with `prof:isProfileOf`, and provides `prof:hasResource` descriptors from
which consumers can discover the import artifact, associated shape graph where
present, and authoritative manifest.

| Profile | Profile IRI / entry point | Exact semantic closure | Shape selection |
|---|---|---|---|
| Kernel | `https://w3id.org/sstim/profile/kernel`; [`sstim-kernel-profile.ttl`](../../static/ontology/sstim-kernel-profile.ttl) | `core` | None published in `0.13.0-dev` |
| Core | `https://w3id.org/sstim/profile/core`; [`sstim-core-profile.ttl`](../../static/ontology/sstim-core-profile.ttl) | `core`, `stimulus` | `core-shapes` |
| Core Plus | `https://w3id.org/sstim/profile/core-plus`; [`sstim-core-plus-profile.ttl`](../../static/ontology/sstim-core-plus-profile.ttl) | `core`, `stimulus`, `common` | `core-shapes`; no Common-specific shapes yet |
| Full | `https://w3id.org/sstim/profile/full`; [`sstim-full-profile.ttl`](../../static/ontology/sstim-full-profile.ttl) | All 16 term-space modules above, including bridges, Vocabulary, Alignments, Ecosystem, and Patch Studio | `shapes` |

For avoidance of doubt, the exact Full semantic module list is `core`,
`stimulus`, `common`, `technique`, `configuration`, `session`, `evidence`,
`neuromodulation`, `patch-studio`, `vocab`, `exposure`, `ecosystem`,
`neuromodulation-evidence`, `evidence-exposure`, `technique-exposure`, and
`alignments`. `shapes` is associated separately and is not an OWL import.

Kernel is the process anchor, not the practical description profile. Core is
the smallest profile that can describe a determinate or adaptive stimulus with
channels, duration, regime, and an optional target. Core Plus adds reusable
descriptors and calibrated quantities; it does not silently add techniques,
evidence, exposure, configuration, sessions, vocabulary, or BSC terms.

The Full profile is the migration target for consumers that previously treated
the physical `sstim-core.ttl` file or the old eight-file set as “all of SSTIM.”
Consumers selecting a concern module directly must resolve its complete
transitive closure from the manifest rather than guessing an upstream file
list.

All four development profiles currently declare inference mode `none`: their
closures supply asserted ontology statements but do not promise that consumers
run a particular entailment regime.

In profile metadata, `dct:requires` names stable logical module IRIs and is the
dependency declaration. `owl:imports` is the retrieval contract. Development
entry points import the physical module distributions directly rather than the
negotiated namespace catalogues. Release-prepared entry points import exact
versioned sibling files under that release's immutable base. This distinction
prevents an import from expanding merely because a namespace catalogue gains a
new authoritative source. Thus the Full profile records the logical Exposure
dependency as `https://w3id.org/sstim/exposure` in `dct:requires`, but its
development `owl:imports` target is the exact
`https://w3id.org/sstim/module/exposure` distribution.

An import target therefore need not be an ontology IRI or a version IRI of the
module it retrieves, and `/kernel` and `/module/exposure` are neither. This is
conformant, not a workaround: an OWL 2 import names an *ontology document* —
the structural specification models `owl:imports` as `directlyImportsDocuments`
(§3.4) and resolves the retrieved document to an ontology afterwards. Do not
"repair" the apparent mismatch by giving a module an `owl:versionIRI` pointing
at its retrieval endpoint. A version IRI must denote a version, ADR 0020 gives
the whole set exactly one, and only the released umbrella declares it.

## Semantic compatibility and graph ownership

The `0.13.0-dev` extraction is a redistribution, not a broad redesign. The
compatibility gate compares the union of the frozen `0.12.0` eight-file
distribution with the union of the live Full term space and Full shapes. The
normalized graphs must be isomorphic after excluding:

- ontology metadata subjects;
- `rdfs:isDefinedBy` statements whose value changes with ownership;
- the `StimulusChannel` definition clarification and named optional-link SHACL
  hardening authorized by ADR 0044; and
- the exact old and new `sstim:Track` scope-note literals for the annotation
  erratum recorded by ADR 0043.

That erratum fixes inherited prose which called `sstim:Voice` parallel to Track
and its `sstim:AudioTrack` subsumption unresolved even though the 0.12 graph
already asserted the subsumption and its history note recorded the decision.
No class axiom changes: the equivalence gate excludes only those two exact
annotation literals, not annotation properties generally.

This is **RDF graph-union compatibility**, not RDF Dataset compatibility.
Public class, property, concept, scheme, and existing Full shape IRIs remain
stable, but the named graph containing a statement may change. For example,
`https://w3id.org/sstim/exposure#StimulusChannel` keeps its public IRI while its
definition moves to the Core stimulus source. The session module owns the
Full-only union-domain axiom involving `SessionSpecification`, so Core does not
acquire a Session dependency while Full preserves the old inference.

At runtime, each source is loaded into the `runtime.graphIri` recorded by the
manifest. Named graphs are authoritative-source and runtime-provenance
boundaries. They are useful for provenance-aware queries, but they are not term
namespaces, import closures, or statements that a term is meaningful only in
that graph. A query that relies on an old statement's exact graph membership
must migrate to the new manifest mapping; a query over the Full union should
retain its semantic result.

The executable gate is
[`scripts/check-sstim-full-equivalence.py`](../../scripts/check-sstim-full-equivalence.py).
Frozen release files are never rewritten to resemble the new layout.

Namespace dereference is a separate generated-publication concern. RDF from
`https://w3id.org/sstim` contains the Full namespace catalogue so every
`sstim:` hash term remains discoverable after redistribution. RDF from
`https://w3id.org/sstim/exposure` contains both Stimulus and Exposure: a client
dereferencing the preserved
`https://w3id.org/sstim/exposure#StimulusChannel` IRI must still receive its
definition after Stimulus becomes its authoritative source. These catalogues
must not be substituted for exact module imports: the Exposure import endpoint
is `https://w3id.org/sstim/module/exposure`. The reason is concrete rather than
stylistic — a catalogue is a concatenation of its modules, so it carries one
`owl:Ontology` header per module (sixteen in the Full catalogue). It is a
namespace-dereference document, not an ontology document: it has no single OWL
identity to import, and importing it would also pull in every other module
sharing that namespace. Every negotiated HTML/RDF namespace
or profile route must return `Vary: Accept` to keep representation caches
correct.

OWL tooling must resolve a module's manifest closure before translating its RDF
to OWL axioms. In particular, Session supplies union-domain axioms for
properties authoritatively declared in Stimulus or Configuration. OWLAPI-based
tools cannot necessarily classify those supplemental triples when each Turtle
file is translated independently before merge. The `make reason` gate therefore
forms the manifest-defined Full RDF union first, submits that one graph to
ROBOT/HermiT, and fails if ROBOT reports any discarded input triple.

## Selecting SHACL

OWL imports and SHACL policy answer different questions. Profile entry points
therefore do not import shape graphs.

- Select [`sstim-core-shapes.ttl`](../../static/ontology/sstim-core-shapes.ttl)
  with Core. These deliberately weak shapes do not demand technique, delivery,
  safety, evidence, configuration, session, or publication data. Optional
  channel links must identify explicitly typed channels, and optional target
  links must identify RDF resources; neither link gains a minimum count.
- Core Plus currently reuses Core shapes. That validates the Core contract but
  does not claim comprehensive validation of every Common descriptor.
- Select [`sstim-shapes.ttl`](../../static/ontology/sstim-shapes.ttl) with Full.
  It retains the existing comprehensive/publication policy and SHACL-SPARQL
  checks.
- In `0.13.0-dev`, concern-specific profiles and shape packages beyond Core have
  not yet been extracted. A consumer selecting one concern may add local shapes,
  or use Full shapes only with the Full semantic closure; Full shapes must not be
  mislabeled as an independently reusable concern contract.

This is deliberate 0.13 staging under ADR 0043. Concern-specific and bridge
shape packages are introduced together with named concern conformance profiles;
the semantic module split alone does not claim that those validation contracts
already exist.

Conformance always names both the semantic profile and its applicable shape
closure. Full conformance entails the applicable included base constraints;
Core conformance does not imply the Full publication policy.

## Adoption patterns

### A portable stimulus description

Import the Core entry point and validate instance data with Core shapes:

```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .

<https://example.org/my-stimulus-model> a owl:Ontology ;
    owl:imports <https://w3id.org/sstim/profile/core> .
```

This is the preferred starting point for reuse or a standards profile that
needs stimulus specifications but no evidence, experiment, application, or
publication model.

### Shared descriptors without the domain suite

Import `https://w3id.org/sstim/profile/core-plus` when modality, band,
mechanism, intended effect, temporal structure, delivery approach, cautions, or
calibrated channel quantities are needed. Use Core shapes plus local validation
for any Common terms until a dedicated Common shape graph is published. Do not
load `sstim-vocab.ttl` unless its larger closure is acceptable.

### One optional concern

Choose the concern module, then recursively include every module named in its
manifest `requires` closure. For example, Technique is a small extension over
Common, whereas Evidence also needs Technique and Configuration. Do not copy a
dependency list into application code; resolve or verify it against the
manifest so bridge and checksum changes are visible.

The repository helper exposes the same resolution used by validation tooling:

```bash
node scripts/sstim-manifest.mjs check
node scripts/sstim-manifest.mjs files core --with-shapes
node scripts/sstim-manifest.mjs files full --with-shapes
```

### Existing whole-suite consumers

Import `https://w3id.org/sstim/profile/full` and select Full shapes. This is the
compatibility path for the BSC Lab application and for consumers that merged all
`0.12.0` modules. Loading only the now-small `sstim-core.ttl` no longer loads the
whole suite.

### Reproducible released work

Use `https://w3id.org/sstim/0.12.0` or the frozen `0.12.0` distributions until a
`0.13.0` release exists. Local `0.13.0-dev` manifest paths and profile entry
points are for evaluation and integration work, not immutable citation.

A future snapshot copies the release-prepared artifacts byte-for-byte; the
snapshotter does not repair imports or rewrite its manifest. Consequently, the
profile files must already use exact versioned sibling import URLs and the
manifest must already publish immutable artifact URLs, checksums, exact import
closures, shape selections, and the fixture/query release contracts before the
snapshot is made. Snapshot checksums prove that those bytes are the bytes that
were released.

The release manifest's `$schema` and `immutableRelease.schemaUrl` must both point
to the frozen versioned `manifest.schema.json`. Every profile's PROF entry-point,
constraints, and manifest `prof:hasArtifact` targets must likewise identify the
versioned profile, shape, and manifest artifacts, and every declared fixture or
competency-query path must exist. Snapshot creation fails closed when Git cannot
prove the ontology inputs clean, the target version is already registered in the
immutable checksum ledger, or ledger recording fails; such an incomplete copy
must not be published.

## Deferred gaps

The split makes optionality and ownership explicit; it intentionally does not
solve every semantic or packaging issue. Follow-up work still includes:

- concern-specific controlled-vocabulary distributions instead of the current
  Full-only compatibility aggregate;
- reusable validation packages beyond Core and Full, including bridge shapes;
- nonempty positive, out-of-scope, adversarial, and competency-query contracts
  for every published profile; Kernel, Core Plus, and Full still lack complete
  manifest-owned fixture/query sets in the current development line;
- separating delivery/safety semantics from the experiment, hypothesis, and
  knowledge-status parts of Exposure;
- generalizing evidence subjects before Evidence can become a smaller,
  Core-oriented extension;
- replacing the audio-shaped session `masterVolume` contract and the inherited
  `SessionSpecification` wording that promises only a fully determined
  "acoustic output" with a modality-neutral design;
- reconciling duplicate stimulus/exposure frequency and flicker quantities;
- deciding whether frequency bands describe observed oscillation, stimulus
  targets, or distinct concepts;
- **a whole-ontology artifact for the version IRI to resolve to.** Until 0.12
  `sstim-core.ttl` *was* the whole ontology, so the bare version route could
  serve it. It is now the two-class Kernel, and a frozen snapshot contains
  modules and profile entry points but no single document representing the
  release. Left alone, `owl:versionIRI <https://w3id.org/sstim/0.13.0>` would
  resolve to two classes — a mis-resolving version IRI, which is worse than the
  non-resolving one ADR 0020 set out to prevent.
  `scripts/sstim-w3id-snapshot-routes.mjs` now refuses to emit a bare-version
  route for a snapshot carrying a manifest unless that snapshot also freezes
  `sstim-namespace.ttl`, so this cannot ship silently. Producing it needs a
  decision: the namespace catalogues are generated by `make export` into
  `dist/` only, while `snapshot-ontology.mjs` copies manifest-declared sources,
  so the release path must either generate and freeze the catalogue or record a
  different whole-ontology release artifact;
- **a manifest-derived VoID/DCAT record** (ADR 0043 rollout step 5, still
  unmet). `void.ttl` is internally consistent today because the quality audit
  counts it against the frozen directory its `dcat:version` names, so it
  correctly describes the 9 subsets of 0.12.0. At 0.13.0 it must describe all
  18 modules, and the Kernel and Exposure `dcat:accessURL` values must move to
  `https://w3id.org/sstim/kernel` and `https://w3id.org/sstim/module/exposure`
  — `/sstim` and `/sstim/exposure` now serve namespace catalogues rather than
  those modules, so pairing them with a module `dcat:downloadURL` would
  describe one distribution with two different documents. Nothing yet checks
  the subset inventory against the manifest;
- deployed persistent-route verification for HTML/RDF negotiation, immutable
  artifact and closure discovery, and the required `Vary: Accept` response for
  the eventual `0.13.0` release; and
- independent module versions, which are deliberately deferred while SSTIM
  keeps a synchronized suite release train.

Those changes need their own semantic decisions and compatibility evidence.
They are not reasons to keep the old catch-all root source, and they must not be
smuggled into what is currently a graph-redistribution change.
