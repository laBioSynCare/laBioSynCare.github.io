# ADR 0043 — SSTIM Core Profile, concern modules, and one release manifest

**Status:** Proposed — 2026-08-01

Proposes the implementation of the architectural direction recorded in
[ADR 0041 §6](0041-stimulus-description-layers-and-the-canonical-schema-gap.md#6-a-small-core-with-adjunctive-modules).
This is not the “split” in
[ADR 0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md),
which separates meanings and kinds of neuromodulation inside the domain model.
The evidence for this proposal is the
[2026-08-01 core and module boundary audit](../ontology/reviews/2026-08-01-sstim-core-and-module-boundary-audit.md).

## Context

SSTIM 0.12.0 is a coherent full graph, but it is not a small reusable contract.
The merged public-module graph has 10,462 triples, 140 named classes, 245
properties, and 445 SKOS concepts. Raw size is not the deciding problem. The
problem is that `sstim-core.ttl` owns 90 of the 140 classes and 128 of the 245
properties while mixing stimulation, neuromodulation, techniques, protocols,
presets, sessions, evidence governance, caution metadata, and BSC voice terms.

The existing files are useful source and named-graph boundaries, but not yet
reliable consumer modules:

- core refers to exposure terms while exposure requires core;
- stimulus declares only core as a dependency but refers to exposure and Patch
  Studio terms;
- the single shapes file validates every concern together;
- `dct:requires` declarations are incomplete and do not provide an immutable
  logical closure;
- module inventories are duplicated across loaders, release scripts, VoID,
  routes, tests, and prose; and
- the 0.12.0 stimulus module was snapshotted and exported but omitted from the
  runtime ontology source set and staged persistent-identifier routes.

Making more files without first defining dependency, ownership, and profile
contracts would amplify those failures. Conversely, retaining one broad
minimum contract makes independent reuse and standards work unnecessarily hard.

## Proposed decision

### 1. Separate the suite, the Core Profile, and physical files

**SSTIM** remains the whole ontology suite. No accepted domain is removed merely
because it is optional.

The **SSTIM Core Profile** becomes the smallest normative consumer contract. A
profile is a versioned, machine-discoverable closure; it need not be exactly one
Turtle file. `sstim-core.ttl` is its dependency-free kernel, while the focused
stimulus-description source may remain physically separate.

The **SSTIM Full Profile** preserves the current all-module experience for the
knowledge browser, registries, and existing consumers. It is a compatibility
aggregate, not the definition of what every SSTIM adopter must implement.

Physical file, term namespace, runtime named graph, and conformance profile are
four different concerns. Existing term IRIs do not move when their authoritative
triples move between files.

### 2. Apply a strict core necessity test

A term belongs in the Core Profile only when it is needed to answer a basic
question about describing a sensory stimulation without assuming a technique
catalogue, engine, study, evidence system, person, or organization:

1. What stimulation process is being described?
2. What engine-independent specification describes it?
3. What channel or component, regime, and duration does it have?
4. What material entity or site is targeted, if any?
5. Which artifact and version made the assertion, and with what provenance?

The initial candidate surface is therefore deliberately small:

- `Stimulation`, `SensoryStimulation`, `StimulusSpecification`, and a minimal
  stimulus-channel abstraction;
- `describesStimulation`, `hasStimulusChannel`, `hasStimulationTarget`, the
  stimulus regime, and generic timing/composition relations; and
- DCTERMS/PROV identity, version, and provenance terms reused rather than
  SSTIM-specific replacements.

Modality-specific quantities can live in delivery/exposure. Techniques,
protocols, frameworks, neuromodulation, evidence, safety limits, presets,
sessions, self-reports, implementation profiles, and ecosystem records are not
core by this test.

The final term inventory is set by competency questions and examples, not an
arbitrary triple or line limit.

### 3. Split by independently adoptable concern, not taxonomy branch

The target concerns are:

| Concern | Owns | Requires |
|---|---|---|
| Core | Stimulation process and minimal stimulus-description contract | No optional SSTIM concern |
| Delivery/exposure | Channels, media, perception, device, placement, quantities, and exposure limits | Core |
| Technique | Framework, technique, and protocol semantics | Core |
| Neuromodulation | ADR 0034–0037 process branches, neural facets, engagement, neuroplasticity, and technique/protocol specializations | Core + Technique |
| Evidence/research | Assessments, propositions, scope, basis, references, search/review governance, hypotheses, and knowledge status | Core |
| Configuration | Implementation, preset, generic track/voice, and the configuration-to-stimulus bridge | Core + Technique |
| Session | Planned and actual execution, timing, completion, self-report, and session overrides | Core + Configuration |
| Ecosystem | Agents, qualified relationships, purpose, consent, and publication lifecycle | The smallest relevant domain closure |
| Implementation profiles | BSC catalogue and Patch Studio constraints and parameters | Configuration and selected domain modules |

Alignments remain optional leaves. Controlled-value schemes follow their owning
concern; the current `sstim-vocab.ttl` can remain as a compatibility aggregate.
SHACL is split into profile-specific shape modules; `sstim-shapes.ttl` can remain
the Full Profile bundle. Shapes are not silently added to an OWL import closure.

Do not split by sensory modality or one class per file. SSTIM's cross-modal,
orthogonal axes are a strength. A module earns its existence only when a
consumer can meaningfully omit it.

Cross-concern axioms live in the most-specific dependent module. When neither
direction is natural, use an explicit leaf bridge module. Core never refers
back upward to an optional concern.

### 4. Make one manifest the release bill of materials

Before moving terms, add one machine-readable, versioned manifest that records:

- every module and profile;
- its ontology IRI, source distribution, runtime graph IRI, and role;
- direct dependencies and profile membership;
- version and checksum; and
- whether it is semantic OWL, controlled vocabulary, SHACL, alignments, or an
  implementation profile.

The loader, exporter, snapshotter, VoID/DCAT metadata, documentation, quality
audit, and route checks must derive from or be verified against this manifest.
Adding a source file in only one of those places must fail CI.

Runtime named graphs from [ADR 0003](0003-named-graphs-for-modules.md) remain the
provenance mechanism. A manifest or import ontology is the dependency-discovery
mechanism. They are complementary; ADR 0003 rejected `owl:imports` as a
substitute for runtime provenance, not as a reusable profile mechanism.

### 5. Preserve compatibility and one release train first

- Keep every public term IRI unless a separate semantic ADR authorizes a change.
- Keep all frozen release directories immutable.
- Publish `sstim-all` (or an equivalently explicit Full Profile aggregate) for
  consumers that currently merge every module.
- Prove the pre/post full semantic graph is isomorphic after excluding ontology
  header and intentional `rdfs:isDefinedBy` ownership changes.
- Keep synchronized suite releases under [ADR 0020](0020-whole-set-snapshot-versioning.md)
  initially. Independent module version lines are justified only by demonstrated
  standalone consumers, not by the existence of multiple files.
- Treat the modular line as a pre-1.0 compatibility preview. Core/Profile
  contracts, independent review, and stable publication routes are gates to
  1.0; the refactor alone does not make SSTIM a standard.

## Implementation order

1. Add the manifest and make every inventory consumer check it.
2. Repair the current 0.12 stimulus loader, persistent route, documentation,
   competency-query, and example gaps.
3. Record one authoritative owner and direct dependency closure for every term
   and cross-module axiom.
4. Extract evidence first; this removes core's current reverse dependency on
   exposure.
5. Extract technique/neuromodulation, then configuration/session and BSC voice
   terms, without changing their meanings.
6. Move session liberties and the preset bridge out of the foundational
   stimulus-description source.
7. Separate delivery/safety from experiment/research statements where that
   produces independently useful closures.
8. Split controlled vocabularies and SHACL shapes by the same concerns, retaining
   generated compatibility aggregates.
9. Publish and test Core, selected module, Full, and BSC implementation profiles.

Each extraction is a mechanical ownership change unless a separate ADR names a
semantic change. Do not combine the modular refactor with unresolved taxonomy or
evidence redesign.

## Acceptance criteria

The split is complete only when:

- core has no dependency on an optional SSTIM module and the dependency graph is
  acyclic;
- a consumer starting at any profile IRI can discover an immutable, checksummed
  dependency closure;
- every module plus its declared closure parses, reasons, and SHACL-validates
  independently, and the full union passes the existing gates;
- every module has scope/non-scope, competency questions, a positive example,
  and adversarial fixtures appropriate to its claims;
- manifest, filesystem, loader, exports, snapshots, VoID, routes, generated
  documentation, and runtime named graphs have exact membership parity;
- all existing term IRIs, supported instance data, queries, and JSON-LD/RDF/XML
  round trips remain compatible;
- a minimal example describes a determinate sensory stimulus, channel, duration,
  regime, and optional target using only the Core Profile; and
- examples prove that evidence, neuromodulation, configuration/session,
  ecosystem, alignments, and BSC profiles are genuinely optional.

## Alternatives considered

**Keep the current whole-set-only contract.** Rejected: it preserves a working
internal aggregate but makes every adopter inherit unrelated evidence,
configuration, and ecosystem commitments.

**Move Turtle blocks immediately.** Rejected: the 0.12 stimulus integration gap
shows that a new file can pass aggregate checks while being absent at runtime and
from persistent routes. Manifest and closure tests come first.

**Make ADR 0036 the modularization decision.** Rejected: its split is semantic,
not architectural. Reusing it would obscure both decisions and encourage module
boundaries that mirror a class hierarchy rather than adoption concerns.

**Give every module an independent version now.** Rejected: it introduces a
second compatibility matrix before the module contracts have consumers or a
stable dependency DAG.

## Consequences if accepted

SSTIM gains a small conformance target, explicit optionality, discoverable
dependencies, and a compatibility aggregate. Existing ontology scope and term
identities remain available. The cost is a staged extraction, more release
artifacts, per-profile tests and documentation, and an explicit migration for
consumers that treated the current `sstim-core.ttl` file as the entire ontology.
