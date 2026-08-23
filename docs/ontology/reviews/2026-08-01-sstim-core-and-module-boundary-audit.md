# SSTIM Core and Module Boundary Audit — 2026-08-01

**Status:** maintainer-facing audit of SSTIM 0.12.0 at repository commit
`d1b6893`. This review changes documentation only; it does not redistribute or
change ontology terms, shapes, instances, contexts, routes, or runtime code.

**Recommendation:** split SSTIM into a small Core Profile and optional concern
modules, but begin with a manifest and executable module contracts rather than
moving Turtle blocks. The current graph is not computationally too large. Its
minimum adoption surface, dependency topology, and publication contract are too
broad and too implicit for straightforward reuse.

The proposed architecture is recorded in
[ADR 0043](../../decisions/0043-sstim-core-profile-and-module-boundaries.md).

## Executive assessment

The concern behind this audit is correct, with one important correction:

- [ADR 0036](../../decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)
  is a **semantic** split between senses and kinds of neuromodulation. It is not
  a source-module or conformance-profile decision.
- [ADR 0041 §6](../../decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md#6-a-small-core-with-adjunctive-modules)
  is the existing architectural decision. It says that core should contain only
  stimulation, stimulus specification, target, time, and identity/versioning,
  and explicitly says the present core is too large.
- [ADR 0042](../../decisions/0042-stimulus-specification.md) created
  `sstim-stimulus.ttl` so the oversized core would not grow further, while
  deliberately deferring the extraction.

SSTIM has grown substantially: the merged term graph increased from 1,432
triples and 28 named classes in 0.1.0 to 10,462 triples and 140 named classes in
0.12.0. That is still a manageable ontology. The stronger evidence for a split
is architectural:

1. `sstim-core.ttl` owns about 64% of all named classes and 52% of all declared
   properties, across several independently adoptable concerns.
2. Core is not dependency-free: its evidence ranges refer to exposure classes,
   while exposure depends on core.
3. Actual cross-file references do not match several modules' declared
   `dct:requires` relations.
4. The only public SHACL file is a full-suite validation profile, not an
   independently selectable set of module contracts.
5. There is no single versioned manifest from which a consumer or the repository
   tooling can discover the exact module/profile closure.
6. The new 0.12 stimulus file is present in release and export inventories but
   absent from the normal runtime source set and staged w3id routes. Existing
   aggregate checks pass despite that omission.

The split should reduce the contract an adopter must accept, not reduce the
domain SSTIM can describe. Keep a Full Profile for current consumers.

## Scope and method

The audit covered:

- all eight live public term/shape modules under `static/ontology/`;
- the frozen 0.1.0–0.12.0 snapshots;
- module metadata, namespace ownership, and actual cross-module term references;
- SHACL, reasoning, export, snapshot, quality, and competency-query wiring;
- the browser loader and runtime named-graph inventory;
- VoID/DCAT and staged persistent-identifier routes; and
- ADRs 0001, 0003, 0004, 0020, 0034–0037, and 0041–0042.

Counts were computed by parsing Turtle with RDFLib and counting unique triples
in each merged release, named OWL classes/properties, and SKOS concepts/schemes.
Cross-module edges count distinct IRIs declared in one module and referenced by
another; they do not count repeated triples. `scripts/sstim-quality-audit.py`
and `scripts/truth-audit.mjs` both passed before documentation edits.

## Growth

| Release | Files | Triples | Named classes | Properties | Concepts | Schemes |
|---|---:|---:|---:|---:|---:|---:|
| 0.1.0 | 5 | 1,432 | 28 | 65 | 67 | 9 |
| 0.5.0 | 6 | 4,776 | 54 | 117 | 288 | 28 |
| 0.7.0 | 7 | 8,171 | 105 | 212 | 369 | 43 |
| 0.10.0 | 7 | 9,825 | 131 | 230 | 445 | 50 |
| 0.11.0 | 7 | 9,929 | 134 | 231 | 445 | 50 |
| 0.12.0 | 8 | 10,462 | 140 | 245 | 445 | 50 |

From 0.1.0 to 0.12.0, triples grew 7.3×, classes 5.0×, properties 3.8×,
concepts 6.6×, and schemes 5.6×. Growth alone is not a defect. It is a signal
that the original single-core adoption contract should be reconsidered.

### Live 0.12.0 files

| File | Lines | Triples | Classes | Properties | Concepts / schemes |
|---|---:|---:|---:|---:|---:|
| `sstim-core.ttl` | 1,971 | 1,601 | 90 | 128 | 0 / 0 |
| `sstim-vocab.ttl` | 3,036 | 3,354 | 0 | 0 | 239 / 33 |
| `sstim-shapes.ttl` | 2,824 | 2,149 | 0 | 0 | 68 named node shapes |
| `sstim-alignments.ttl` | 190 | 35 | 0 | 0 | 0 / 0 |
| `sstim-patch-studio.ttl` | 357 | 381 | 5 | 28 | 0 / 0 |
| `sstim-stimulus.ttl` | 227 | 128 | 1 | 13 | 0 / 0 |
| `sstim-exposure.ttl` | 2,243 | 2,237 | 29 | 46 | 172 / 14 |
| `sstim-ecosystem.ttl` | 641 | 582 | 15 | 30 | 34 / 3 |

Per-file triples sum to 10,467; the merged graph has 10,462 because five triples
are repeated across physical files. Core, vocabulary, shapes, and exposure hold
about 89% of the physical triples.

## Findings

### MB-01 — core is a catch-all, not a minimal contract

`sstim-core.ttl` is not the largest file by triples, but it owns most of SSTIM's
class and property surface. Its source sections contain:

- stimulation and neuromodulation processes and interventions
  (`sstim-core.ttl:98-307`);
- technique hierarchies (`308-416`);
- framework, protocol, implementation, preset, and session classes
  (`417-514`);
- controlled-value, neural-facet, caution, and report classes (`515-736`);
- evidence/reference and BSC voice classes (`737-835`);
- 80 object, datatype, and annotation properties (`836-1507`); and
- a second, qualified evidence model with 73 top-level terms
  (`1508-1969`).

The final evidence block alone occupies 463 lines and roughly one third of the
named terms in core. `Preset`, `Voice`, `PublicSafeReference`, review governance,
and neuromodulation are useful SSTIM terms, but none is required merely to
describe a stimulus. This confirms ADR 0041's existing diagnosis.

**Disposition:** accept the small-core direction. Do not delete these concerns;
make them opt-in modules and retain them in the Full Profile.

### MB-02 — current modules do not form an accurate dependency DAG

The table compares declared `dct:requires` with actual references to terms owned
by another file. Counts are distinct referenced terms.

| Source | Actual local dependencies | Declared dependencies | Assessment |
|---|---|---|---|
| Core | Exposure (2) | none | Reverse dependency; not standalone |
| Vocabulary | Core (70) | Core | Matches |
| Exposure | Core (7), Vocabulary (45) | Core, Vocabulary | Matches, but closes a Core ↔ Exposure cycle |
| Stimulus | Core (3), Exposure (1), Patch Studio (1) | Core | Incomplete |
| Patch Studio | Core (3) | Core | Matches |
| Ecosystem | Core (1) | Core, Vocabulary | Vocabulary is not required by declared-term references |
| Shapes | Core (111), Vocabulary (1), Exposure (45), Patch Studio (26), Stimulus (10), Ecosystem (62) | Core, Vocabulary, Exposure, Ecosystem | Incomplete |
| Alignments | Core (6), Vocabulary (10) | Core, Vocabulary | Matches |

Core's two exposure references are the ranges of
`scopeInterventionOrContext` and `basisIntervention`
(`sstim-core.ttl:1742-1772`). Both belong to the evidence concern. Extracting
evidence removes the direct Core ↔ Exposure cycle without changing their
semantics.

Stimulus's dependency on Patch Studio comes from `disablesTrack`; its dependencies
on preset and session concepts come from `specifiedBy`, the target relation's
domain, `masterBrightness`, and `scheduledStart`
(`sstim-stimulus.ttl:85-91,187-226`). Those are configuration/session bridges,
not foundational stimulus-description terms.

**Disposition:** establish term and cross-module-axiom ownership first. Require
an acyclic graph. Put a cross-concern axiom in the most-specific dependent
module, or in an explicit leaf bridge when neither direction is natural.

### MB-03 — “module” currently means file/graph, not reusable closure

No public module declares `owl:imports`. `dct:requires` uses mutable unversioned
IRIs and, as MB-02 shows, is not complete. This is compatible with
[ADR 0003](../../decisions/0003-named-graphs-for-modules.md), which chose named
graphs for runtime provenance, but it does not solve dependency discovery for an
external ontology consumer.

Validation mainly proves the union:

- `make shacl-modules` concatenates every public module;
- `make reason` merges the same full list;
- vocabulary validation explicitly loads core + vocabulary + exposure because
  vocabulary identity and exposure-owned assertions cannot validate alone; and
- there are no equivalent per-closure gates for stimulus, Patch Studio, or the
  semantic part of ecosystem.

The version IRI resolves to `sstim-core.ttl`, not to a machine-readable release
closure. The earlier
[2026-07-24 RDF audit, RDF-03](2026-07-24-rdf-structure-and-publication-audit.md#rdf-03--the-version-iri-does-not-expose-a-discoverable-seven-module-closure)
already identified this; checksums were added, but a discoverable immutable
manifest or aggregate remains open.

**Disposition:** define Core, Full, and implementation profiles explicitly. Use
named graphs for provenance and a versioned manifest/import profile for
dependency discovery. They solve different problems.

### MB-04 — module inventory drift is already observable

SSTIM 0.12.0 added `sstim-stimulus.ttl`. It appears in the snapshot, export,
quality-audit, VoID, and URL inventories, but not everywhere:

- `src/rdf/loader.js:113-121` defines `ONTOLOGY_URLS.stimulus`, while
  `ONTOLOGY_SOURCES` at lines 124-153 omits it. `loadOntology()` and navigator
  loading use `Object.values(ONTOLOGY_SOURCES)`, so the normal runtime graph does
  not contain the flagship 0.12 terms.
- `scripts/sstim-exposure-sanity.mjs` uses that incomplete runtime source set and
  has no `StimulusSpecification` competency query, so its green result cannot
  detect the omission.
- `static/ontology/void.ttl:168-177` advertises
  `https://w3id.org/sstim/stimulus`, but the staged
  `docs/ecosystem/w3id/sstim/.htaccess` has no stimulus-module route.
- At audit start, both ontology guides still described 0.11.0 and seven modules;
  those documentation inventories are corrected alongside this report.

There are also 47 terms in the root `sstim:` namespace whose definitions are in
other files: 33 in Patch Studio and 14 in stimulus. The root fragment route
serves only core, so a consumer cannot discover those definitions by
dereferencing their namespace document.

These are not arguments against modules. They are evidence that a file is not a
module contract until inventory parity is generated or checked from one source.

**Disposition:** the first implementation step is a single versioned manifest or
bill of materials. Loader, export, snapshot, VoID, routes, docs, contexts, tests,
and named graphs must match it exactly. Fix the existing stimulus integration
gaps before adding another module.

### MB-05 — support artifacts need the same boundaries

`sstim-shapes.ttl` has 2,149 triples and 68 named node shapes spanning core,
catalog, evidence, sessions, exposure, ecosystem, Patch Studio, and stimulus.
An adopter cannot currently select the ontology concern without inheriting the
Full Profile validation policy. In particular, the ecosystem section contains
publication and consent rules that are valuable but unrelated to a minimal
stimulus description.

The main vocabulary similarly combines 33 concept schemes for frequency bands,
preset groups, evidence, voice types, modalities, mechanisms, cautions,
techniques, neural facets, review provenance, and participant engagement.

**Disposition:** after semantic ownership is stable, split shapes by profile and
let domain vocabularies follow their owning concern. Keep `sstim-shapes.ttl` and
`sstim-vocab.ttl` as generated or maintained compatibility aggregates until
consumers have migrated. Alignments remain optional.

### MB-06 — use concerns and profiles, not the class tree, as boundaries

ADR 0036's self-directed/interventional and neurostimulation/neuromodulation
distinctions should move together, unchanged, into a neuromodulation concern.
They should not become separate source modules simply because they are separate
classes. Likewise, auditory, visual, haptic, and other modalities should remain
orthogonal values rather than separate ontologies.

Useful module boundaries correspond to plausible adoption choices:

- describe a stimulus without a technique catalogue;
- add delivery, perception, devices, placement, and exposure limits;
- add technique/framework/protocol semantics;
- add the neuromodulation extension;
- add evidence/research assertions;
- add engine configuration and session execution;
- add ecosystem/publication governance; or
- add a specific implementation profile such as Patch Studio/BSC.

**Disposition:** do not over-fragment. A module exists only if an adopter can
meaningfully omit it and its dependency direction stays clear.

## Candidate Core Profile

Apply a necessity test rather than a file-size quota. An initial surface of
roughly 10–15 SSTIM terms is defensible:

| Kind | Candidate terms/responsibility |
|---|---|
| Process | `Stimulation`, `SensoryStimulation` |
| Description | `StimulusSpecification`, `describesStimulation` |
| Composition | Minimal `StimulusChannel` abstraction and `hasStimulusChannel` |
| Scope | `hasStimulationTarget`, with absence allowed |
| Form/time | `stimulusRegime`, generic channel frequency/duration or reused standard time terms |
| Metadata | Reused DCTERMS and PROV identity, version, and provenance |

This is a candidate to test with competency questions, not a final mechanical
list. Modality-specific quantities such as sound-pressure level and luminance
can live in delivery/exposure. `StimulusChannel` currently has an `sstim-ex:` IRI;
preserve it. File/namespace symmetry is less important than public IRI stability.

The Core Profile may be a manifest closure over a dependency-free kernel and the
focused stimulus source. That reconciles ADR 0041's logical core with ADR 0042's
decision not to grow the old catch-all `sstim-core.ttl`.

## Recommended target concerns

| Module/profile | Main content | Direct dependency posture |
|---|---|---|
| Core Profile | Minimal process + engine-independent stimulus description | No optional concern |
| Delivery/exposure | Channels, media, perception, device, placement, quantities, limits | Core |
| Technique | Framework, technique, protocol, generic facets | Core |
| Neuromodulation | ADR 0034–0037 neural and engagement model | Core + Technique |
| Evidence/research | Claims, propositions, basis, scope, references, review/search governance, hypotheses/status | Core; optional bridges to studied concerns |
| Configuration | Implementation, preset, generic track/voice, stimulus bridge | Core + Technique |
| Session | Plans, executions, completion, self-report, overrides | Core + Configuration |
| Ecosystem | Agents, relationships, purpose, consent/publication lifecycle | Smallest relevant closure |
| Patch Studio/BSC profile | Implementation-specific parameters and stricter shapes | Configuration + selected modules |
| Full Profile | All supported semantic modules | Compatibility aggregate |

This is intentionally a concern map, not a command to create every named file at
once. Delivery/exposure may be split from experiment/research statements, and
configuration from sessions, only when the resulting closures are independently
useful and testable.

## Migration plan

1. **Manifest first.** Establish one machine-readable module/profile bill of
   materials with ontology IRIs, files, graph IRIs, roles, dependencies,
   versions, distributions, and checksums. Make all inventories derive from or
   validate against it.
2. **Repair the current module contract.** Add stimulus to runtime loading,
   persistent routes, competency queries, and a positive example; remove stale
   claims that `StimulusSpecification` does not exist.
3. **Inventory ownership.** Require exactly one authoritative owner for each
   term and cross-module axiom. Generate the actual dependency graph and compare
   it with the manifest in CI.
4. **Extract evidence first.** It is the largest cohesive optional block and its
   extraction removes core's current exposure dependency.
5. **Extract technique and neuromodulation without redesign.** Preserve the ADR
   0034–0037 semantics and all term IRIs.
6. **Extract configuration/session and BSC terms.** Move stimulus's preset,
   track, brightness, and scheduled-start bridges to the appropriate dependent
   concern.
7. **Refine exposure and research boundaries.** Put technique-to-medium and
   evidence-to-exposure assertions in dependent or explicit bridge modules.
8. **Split vocabularies and shapes.** Keep Full Profile aggregates for
   compatibility.
9. **Publish profiles.** Make Core, selected modules, Full, and BSC profiles
   immutable, dereferenceable, documented, and independently testable.
10. **Stabilize before 1.0.** Keep synchronized suite releases initially. Use a
    pre-1.0 modular preview and seek external ontology/domain review before
    declaring the Core Profile stable or describing it as a standard.

## Acceptance gates

The work is complete when:

- the dependency graph is explicit and acyclic, and core has no optional local
  dependency;
- each module/profile plus its declared closure parses, reasons, and validates
  independently;
- the full post-split graph is isomorphic to the pre-split semantic graph except
  for reviewed ontology-header/ownership metadata or separately authorized ADR
  changes;
- no public term IRI changes merely to align a namespace and file;
- every profile has scope/non-scope, competency questions, positive examples,
  and adversarial fixtures;
- starting from a version/profile IRI, a consumer can discover an immutable,
  checksummed closure and all terms it owns;
- manifest, files, loader, exporter, snapshotter, VoID, routes, docs, contexts,
  and named graphs have exact parity;
- legacy instances, queries, full-graph consumers, and serialization round trips
  remain compatible; and
- Core-only examples work while evidence, neuromodulation, configuration,
  sessions, ecosystem, alignments, and BSC constraints are demonstrably opt-in.

## Bottom line

Split SSTIM. Do not split it because a triple count crossed an arbitrary line,
and do not split it along every branch in its taxonomy. Split it because the
current “core” is not the minimum reusable description contract and the current
files do not expose dependable consumer closures.

The first deliverable is the manifest and module contract. The first large
extraction is evidence. ADR 0036's model then moves intact into an optional
neuromodulation module; it is not redesigned as part of this refactor.
