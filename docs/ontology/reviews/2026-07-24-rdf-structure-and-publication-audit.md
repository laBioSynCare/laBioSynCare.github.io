# SSTIM RDF Structure and Publication Audit — 2026-07-24

**Status:** maintainer-facing audit of the released `0.10.0` repository state.
This review added only this document; it did not alter ontology, shape, context,
instance, or release files.

**Verification (2026-07-24):** every statistic, file/line citation, and quotation
below was independently re-checked against the repository at the same commit —
`make validate` (SHACL, ecosystem contract, quality audit, HermiT, SPARQL
sanity, export round-trip), the full Vitest suite (19 files, 151 tests), and
standalone scripts for the two claims neither target covers: a triple count
over the seven public modules, and a compact/expand round trip of all 28
top-level and instance Turtle documents through the published `context.jsonld`
(confirming the 308-to-212, 96-triple loss on `void.ttl` and a clean pass on
the other 27). All counts, citations, and quotations held; none required
correction.

**Implementation status (2026-07-24, same day):** Gate A and Gate B are
implemented for everything a same-session pass could responsibly close, and
**`0.11.0` has shipped**: tagged, frozen under `static/ontology/0.11.0/`, and
archived by Zenodo at `10.5281/zenodo.21536124` (RDF-01, RDF-02, RDF-11 fixed;
RDF-03, RDF-12 partially fixed; RDF-04, RDF-05, RDF-17 fixed; RDF-08, RDF-09,
RDF-13, RDF-15 partially fixed where the remainder is either a maintainer
policy decision (ADR 0020/RDF-12) or a separate, larger modeling project — the
full oscillation-band/stimulus-target split of RDF-08 — rather than a
mechanical fix). See [ADR 0037](../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md),
the "Status" note under each finding, and the checked-off Gate A/B lists for
specifics. `make validate` and the full Vitest suite (19 files, 151 tests)
pass with all of these changes in place. The version bumped to `0.11.0` — a
MINOR, not a patch, because Gate B adds real new terms. One item remains
outside what a repository edit can do: the visible erratum against the
already-archived `0.8.0`-`0.10.0` Zenodo records. RDF-06, RDF-07, RDF-10,
RDF-14, RDF-16, RDF-18, and RDF-19 (Gates C/D/E) are
untouched.

## Executive assessment

SSTIM is structurally strong and unusually well tested for a young ontology.
The seven public modules parse, the committed data conforms to the current
SHACL profiles, local OWL reasoning reports no inconsistency, the SKOS graph is
regular, generated module serializations round-trip, and the evidence and
ecosystem models show careful attention to provenance and privacy.

The repository nevertheless has three release-level defects that should be
corrected before the next ordinary feature release:

1. the frozen `0.10.0` RDF identifies itself as `0.10.0` while citing the
   `0.7.0` version DOI and citation — **fixed and released as `0.11.0`**
   (`10.5281/zenodo.21536124`); still needs a visible erratum against the
   already-archived `0.8.0`-`0.10.0` records, which cannot be corrected in
   place (see RDF-01's status);
2. the public JSON-LD context loses the 96 blank-node distribution-description
   triples in `void.ttl` in the repository's RDFLib compact/parse path —
   **fixed and gated** (see RDF-02's status); and
3. the whole-set version IRI returns only the core file and provides no
   version-specific, machine-discoverable representation of the seven-module
   release closure — **partially fixed**: existing snapshots now have
   CI-checked checksums, but no discoverable manifest/aggregate exists yet at
   the version IRI (see RDF-03's status).

There are also substantive semantic defects that automated reasoning cannot
see because they are contradictions between prose definitions and asserted
class relations. Most notably, `SelfDirectedNeuromodulation` inherited from
`Stimulation`, whose definition requires an applied controlled input, while
the subclass explicitly included practices with no applied stimulus — **fixed**
via a new neutral genus, `sstim:DeliberateSelfRegulation` (RDF-04's status).
The sensory branch of `Neurostimulation` was described in prose but not
represented in the class hierarchy — **fixed** via
`sstim:SensoryNeurostimulation` / `sstim:SensoryNeurostimulationTechnique`,
defined as an intersection rather than a blanket subclass axiom so
self-directed sensory-route cases correctly stay excluded (RDF-05's status).
See [ADR 0037](../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md).

The right conclusion is not that the RDF is broken. It is that the syntactic
and conformance engineering is ahead of release-integrity checks, semantic
review, and contract integration. Gate A and the closeable half of Gate B are
now done (2026-07-24); the remaining P1/P2 findings and the full RDF-08 split
are the next stabilization work, still ahead of any scope-expansion release.

### Readiness by use

| Use | Assessment |
|---|---|
| Vocabulary browsing, competency queries, and synthetic examples | Ready, with the documented semantic caveats |
| Reuse of individual public modules | Usable, but consumers need a version-specific immutable dependency manifest (checksums for existing snapshots now exist; a discoverable manifest/aggregate at the version IRI does not yet) |
| Citation of `0.10.0` RDF metadata | Superseded: cite `0.11.0` (`10.5281/zenodo.21536124`) instead. `0.8.0`-`0.10.0` still self-cite the wrong DOI internally; still needs a visible erratum pointing at the archived records |
| RDFLib compact export with `context.jsonld` | Fixed — all 28 top-level and instance documents now round-trip isomorphically; gated by `make context-roundtrip` in `make validate` |
| Public-copy authorization | Not implemented; the legacy gate is reject-only |
| Acoustically identical session reproduction | Not supported by the captured contract |
| Real participant/session data | Not ready; observation, consent, privacy, and unwanted-experience modeling are incomplete |
| Mutable real ecosystem publication | Promising, but production validation, state transitions, and failure recovery need repair |

## Scope and method

The audit covered:

- the seven current public modules in `static/ontology/`;
- the separate private ecosystem SHACL profile;
- all committed public instances;
- `context.jsonld`, `void.ttl`, immutable snapshots, and staged w3id rules;
- ontology export, snapshot, quality, SHACL, reasoning, and SPARQL tooling;
- CI and Pages publication gates;
- RDF loader, named-graph, query, Sensory Field, annotation, and ecosystem
  publication code; and
- ontology ADRs and the session, preset, publication, and improvement
  documentation that define intended contracts.

The current graph contains 9,825 public-module triples, 131 named OWL classes,
18 anonymous class expressions, 230 declared properties, 445 SKOS concepts,
and 50 concept schemes. The public validation profile has 59 node shapes and
52 distinct SPARQL constraint nodes; the private ecosystem profile has 8 node
shapes and 16 SPARQL constraint nodes.

The following verification passed:

- `nix develop --command make validate`;
- all public and private pySHACL validation targets;
- local merged-graph HermiT consistency;
- repository quality and SPARQL competency audits;
- 14 generated module JSON-LD/RDF/XML isomorphism checks;
- the ecosystem contract, including 34 public SHACL negatives, 6 file-profile
  negatives, 6 private-ledger negatives, a positive scenario, and runtime
  named-graph checks; and
- `npm test -- --run`: 19 test files and 151 tests.

All seven live public modules are byte-identical to their `0.10.0` snapshot
copies. A separate ad hoc public-context audit check covered all 28 top-level
and instance Turtle documents; 27 round-tripped isomorphically and `void.ttl`
did not. No committed test currently performs that complete check.

### Limits of the green baseline

- HermiT reasons over the local merged module set, not a pinned external
  BFO/OBI/IAO import closure.
- General instance SHACL validation concatenates all instance documents, so
  one file can complete a resource defined in another.
- JavaScript SHACL tests remove `sh:sparql` constraints because their browser
  validator does not implement that component.
- Repository CI validates synthetic ecosystem fixtures but no mutable
  production ecosystem artifact.
- Automated consistency cannot detect contradictions expressed only through
  `skos:definition`, comments, and documentation.
- Independent human ontology review is explicitly not claimed.

## What is already good

### 1. The model has useful layer boundaries

The distinction among framework, technique, protocol, implementation, preset,
session specification, and session execution is conceptually valuable. The
separation of physical delivery, perceived modality, device capability, body
placement, exposure boundary, and outcome/evidence roles avoids many common
category errors.

The newer stimulation model also correctly tries to keep delivery, access
route, anatomical target, neural system, neural phenomenon, and participant
engagement on separate axes instead of forcing them into one hierarchy. The
remaining findings concern two incomplete placements within that otherwise
sound design.

### 2. Evidence representation is a major strength

ADR 0027 substantially improved the graph. Evidence assessments, hypotheses,
research questions, boundary-applicability statements, design objectives, and
knowledge-status assertions are distinct roles. Assessments have explicit
subjects, directions, atomic propositions, scope axes, evidence bases,
provenance, and review activities. Universal-absence propositions and several
role conflations have negative fixtures.

This is much better than a generic `EvidenceClaim` node or a technique-wide
evidence score. The model also correctly keeps participant reports from
becoming evidence merely because they are represented in RDF.

### 3. SKOS hygiene is strong

Every current concept is a named individual, belongs to a scheme, has an
English preferred label, and has a notation. The audit found no scheme-local
preferred-label or notation collisions, no SKOS broader cycles, no subclass
cycles, and no property-kind collisions. Inverse navigation links are
materialized for clients that do not reason.

External identity assertions are generally conservative: the graph does not
use broad `owl:sameAs`, external `owl:equivalentClass`, or
`owl:equivalentProperty` assertions.

### 4. Safety and epistemic language are usually careful

The ontology normally distinguishes delivery from response, response from
benefit, and an intended mechanism from an observed outcome. Comfort and
exposure boundaries are not presented as proof of safety. Synthetic fixtures
are clearly marked, evidence references use DOI identifiers, and the project
states that it does not define clinical practice or certify products.

### 5. The ecosystem boundary is exceptionally well exercised

The public and access-controlled profiles are separated. The synthetic
ecosystem contract tests lifecycle ordering, qualified relationships,
admission, leakage, withdrawal, replacement, named-graph isolation, and
public/private projections with many adversarial fixtures. Runtime fetches omit
credentials and referrers and distinguish empty, unavailable, and disabled
states.

### 6. Validation and publication foundations are substantial

The Nix environment, lockfiles, SHACL, HermiT, competency queries, graph
isomorphism checks, loader manifest checks, VoID counts, context coverage, and
snapshot refusal rules form a serious engineering baseline. The repository is
also commendably transparent about synthetic data, deferred review, and the
limits of its clinical scope.

## Findings

### P0 — correct before the next release

#### RDF-01 — released RDF cites the wrong version DOI

`static/ontology/sstim-core.ttl:53-55` declares version `0.10.0`, but
`dct:hasVersion` and `dct:bibliographicCitation` at lines 68-69 still identify
version `0.7.0` and DOI `10.5281/zenodo.21380171`. The repository's current
release DOI is `10.5281/zenodo.21528717`, recorded in `README.md`,
`CITATION.cff`, and `CHANGELOG.md`.

The same problem exists in the `0.8.0`, `0.9.0`, and `0.10.0` frozen core files:
all three cite the `0.7.0` DOI rather than their respective version DOI.
`static/ontology/void.ttl:48-55` combines a stale modification date and the
`0.7.0` DOI with `dcat:version "0.10.0"`.

Earlier snapshots have a related but distinct policy gap: `0.5.0` has no DOI
metadata, while `0.6.0` and `0.7.0` cite the all-versions concept DOI rather
than their eventual version DOI. They do not falsely cite a different release
as `0.8.0`-`0.10.0` do. A release policy should state whether a frozen artifact
must embed its version DOI or whether a post-release sidecar is authoritative.

Other release text has drifted in the same direction:

- all seven module headers still say version `0.7.0`;
- `sstim-core.ttl:73` says `released`, while its `0.10.0` history note at line
  89 says `under development`;
- `README.md:29-38` reports 105 classes, 14 anonymous expressions, 214
  properties, 369 concepts, 43 schemes, and 12 protocols, while the passing
  audit reports 131, 18, 230, 445, 50, and 9; and
- WIDOCO is configured to extract version and DOI metadata from the core, so
  generated reference documentation can reproduce the wrong citation.

Because the live modules and `0.10.0` snapshot are byte-identical, silently
editing the frozen files would violate the stated immutability policy.

**What to do:** publish a visible erratum for affected releases and cut a
corrective patch or next release with coherent RDF metadata. Do not silently
rewrite published snapshots. Add a release gate that cross-checks header
version/date, `owl:versionInfo`, `owl:versionIRI`, prior version, status,
history text, version DOI, citation, VoID, changelog, citation file, and
generated counts. Reserve the Zenodo DOI before freezing, or publish a
version-specific metadata sidecar whose lifecycle is explicitly separate from
the immutable Turtle snapshot.

**Status (2026-07-24): fixed and released.** `0.11.0` is tagged, frozen under
`static/ontology/0.11.0/`, and archived by Zenodo at
`10.5281/zenodo.21536124` (GitHub release → Zenodo auto-archival; recorded in
`CITATION.cff`, `CHANGELOG.md`, and all three READMEs). `owl:versionIRI` /
`owl:versionInfo` bumped to `0.11.0` (a MINOR bump — Gate B adds real terms,
so this outgrew a patch); the `v0.10.0` history note's "under development"
vs. `released` contradiction fixed; all seven module header comments and
`void.ttl`'s `dct:modified` / `void:triples` synced; the stale README counts
corrected.

**Resolved policy question:** the frozen, snapshotted `sstim-core.ttl` never
carries the version-specific DOI, on any release — Zenodo can only mint a DOI
from a GitHub release cut off an already-frozen tag, so a snapshotted file
can never truthfully self-cite its own DOI without drifting from what was
actually archived after the fact. `void.ttl`, the designated non-snapshotted
sidecar (per its own file header), carries `dct:hasVersion` instead, and is
authoritative for it. This matches the historical pattern (confirmed in
`fc59098`, the `0.10.0` "record DOI" commit, which touched only docs, never
the ontology Turtle) and the `0.5.0` precedent, made explicit rather than
silently repeated. Two items remain, outside what a repository edit can do:
publish a visible erratum against the already-archived `0.8.0`-`0.10.0`
Zenodo records (their content cannot be corrected in place, and now that
`0.11.0` exists, there is somewhere for it to point). The cross-checking
release gate is not yet built as a single manifest — see RDF-11's status.

#### RDF-02 — RDFLib compact serialization with the public context loses VoID distribution details

`static/ontology/context.jsonld:272` defines `dcat:distribution` with
`"@type": "@id"`. The objects in `void.ttl` are blank nodes with their own
titles, media types, access URLs, and download URLs. Compacting the VoID graph
with the public context using the repository's installed RDFLib and parsing it
back produced:

```text
source graph:       308 triples
round-tripped graph: 212 triples
isomorphic:         false
```

All 96 triples describing the blank-node distributions were lost. Removing
only that coercion in memory restored a 308-to-308 isomorphic round trip. The
other 27 checked documents round-tripped with the context.

The `@id` coercion is valid JSON-LD. This result demonstrates a lossy
interaction with the repository's RDFLib serialization path, not by itself a
violation of the JSON-LD standard or proof that every conformant processor
loses the data.

The current `export-ontology.py` check does not expose this because it exports
only the seven modules and uses RDFLib's generated compact context, not the
published `context.jsonld`. It does not test VoID or instances.

**What to do:** repair the context/serializer interaction, then add
compact/expand isomorphism tests using the actual public context for every
module, VoID, and instance artifact. Removing the coercion is one confirmed
RDFLib workaround; stable IRIs for distributions or a different serializer
may be preferable. Keep the existing object-type compatibility audit, but do
not treat it as a substitute for a real JSON-LD round trip.

**Status (2026-07-24): fixed.** `context.jsonld`'s `distribution` term dropped
the `"@type": "@id"` coercion (the confirmed RDFLib workaround). All 28
top-level and instance documents now round-trip isomorphically, including
`void.ttl` (308-to-308). `scripts/context-roundtrip-check.py` performs this
check against the published context for every such document and is wired into
`make validate` as `make context-roundtrip`, so this can't regress silently.

#### RDF-03 — the version IRI does not expose a discoverable seven-module closure

The project says the seven modules are one citable versioned set. In the staged
w3id rules, however, `https://w3id.org/sstim/0.10.0` redirects to only
`0.10.0/sstim-core.ttl`
(`docs/ecosystem/w3id/sstim/.htaccess:20-26`). The module files use
`dct:requires` with mutable unversioned IRIs and do not form an OWL import
closure. The core itself refers to classes in the exposure namespace in the
ranges of `scopeInterventionOrContext` and `basisIntervention`
(`sstim-core.ttl:1651-1681`), so it is not semantically standalone.

This also affects term dereferenceability. Patch Studio properties such as
`sstim:carrierFreqLeft` use the root `https://w3id.org/sstim#` namespace but
are defined only in `sstim-patch-studio.ttl`. Dereferencing the root serves the
core file, which contains no definition for those terms.

VoID does enumerate module subsets, which is helpful, but the versioned
directory contains only the seven Turtle files and a README. It has no
machine-readable version manifest, versioned context, VoID record, aggregate
distribution, checksums, or explicit version-specific dependency list.

**What to do:** make the version IRI return either an immutable merged
aggregate or an immutable manifest/import ontology that enumerates
version-specific module distributions and checksums. Keep SHACL separate from
the OWL logical import if appropriate. Serve the root namespace in a way that
allows every root term to be discovered, and add a persistent route for the
public context.

**Status (2026-07-24): partially fixed.** `static/ontology/snapshot-checksums.json`
now records a sha256 per file for all nine existing frozen snapshots (bootstrapped
from their current on-disk content), and `make verify-snapshots` (wired into
`make validate`) fails if any recorded snapshot's checksum drifts — this closes
the "no CI check that historical directories still match release-tag
checksums" half of the finding (shared with RDF-12) and gives every future
snapshot the same protection automatically (`snapshot-ontology.mjs` now records
a new version's checksums right after writing it). What remains open: the
version IRI itself still redirects to only `sstim-core.ttl`; there is still no
single discoverable manifest/aggregate enumerating the seven-module closure at
`https://w3id.org/sstim/<version>`; `dct:requires` still doesn't form an OWL
import closure; and the root-namespace/Patch-Studio term dereferenceability gap
is untouched.

### P1 — semantic and contract repair

#### RDF-04 — `SelfDirectedNeuromodulation` contradicts its inherited genus

`sstim:Stimulation` requires a controlled physical, mechanical, chemical, or
other input to be applied (`sstim-core.ttl:96-103`).
`sstim:Neuromodulation` subclasses it (`121-132`), and
`sstim:SelfDirectedNeuromodulation` subclasses `Neuromodulation` (`173-180`).
The latter definition explicitly includes unguided meditation and volitional
breathwork with “no applied stimulus.”

This is a real intensional contradiction, although it creates no HermiT
inconsistency because the conflicting statements are natural-language
annotations rather than logical restrictions.

**What to do:** introduce a neutral deliberate neural-self-regulation process
above the cases with no applied input. Keep cue-, device-, or feedback-mediated
cases under stimulation when an actual stimulus is part of the process. An
alternative is to broaden `Stimulation`, but that would weaken the useful
applied-input boundary throughout the ontology.

**Status (2026-07-24): fixed** ([ADR 0037](../../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md)).
Added `sstim:DeliberateSelfRegulation` as the neutral genus, not a subclass of
`Stimulation`. Narrowed `SelfDirectedNeuromodulation` to the stimulus-mediated
cases only (neurofeedback, biofeedback, paced-breathing guidance); pure
practices with no applied stimulus are now `DeliberateSelfRegulation` only. No
individual in the graph was typed `SelfDirectedNeuromodulation` directly, so
the narrowing has zero instance-level blast radius. `make validate` and the
full Vitest suite stay green.

#### RDF-05 — the stated sensory branch of neurostimulation is absent

The definitions of `Neurostimulation` and `NeurostimulationTechnique` say that
their sensory branch is the corresponding sensory-route-neuromodulation class
(`sstim-core.ttl:185-201,299-313`). Neither
`SensoryRouteNeuromodulation` nor
`SensoryRouteNeuromodulationTechnique` is actually asserted below the
neurostimulation class (`138-146,316-324`).

As a result, queries over the neurostimulation hierarchy omit sensory
neurostimulation examples such as the gamma-40 auditory technique, despite the
prose saying they belong. A blanket subclass axiom would also be risky because
some sensory-route feedback cases are self-directed rather than passive
interventions.

Separately, generic biofeedback may be overclassified:
`sstim-v:techBiofeedback` is asserted broadly as a
`NeuromodulationTechnique` even though its definition includes respiration,
muscle tension, and skin-conductance feedback and acknowledges peripheral
cases (`sstim-vocab.ttl:2990-3005`). Its intended self-directed status is
represented through the participant-engagement facet and annotations, not a
named technique subclass, so queries must combine those signals rather than
infer a process-branch membership from the broad type alone.

**What to do:** decide the intended necessary and sufficient conditions in a
focused ADR. Add a narrower sensory-neurostimulation class for passive/applied
cases, or revise the prose and query expectations. Keep generic biofeedback
neutral and type narrower neural/autonomic variants where the neural-modulation
objective is definitional.

**Status (2026-07-24): fixed** ([ADR 0037](../../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md)).
Added `sstim:SensoryNeurostimulation` / `sstim:SensoryNeurostimulationTechnique`
as the intersection of `Neurostimulation` and `SensoryRouteNeuromodulation` —
not a blanket subclass axiom, so the flagged risk (self-directed sensory-route
cases like sonification biofeedback) correctly stays excluded, since
`Neurostimulation` already excludes self-directed cases by its own
definition. `sstim-v:techGamma40Auditory` is now explicitly retyped
`NeuromodulationTechnique`, `NeurostimulationTechnique`, and
`SensoryNeurostimulationTechnique`, so it is discoverable by
neurostimulation-hierarchy queries. Generic biofeedback was kept neutral per
this finding's own recommendation; a `skos:editorialNote` on
`sstim-v:techBiofeedback` now records that as a deliberate decision.

#### RDF-06 — the session contract and reproducibility promise disagree

`docs/technical/SESSION_MODEL.md:8-9` points to
`schemas/session.schema.json`, but no such project schema exists. Its RDF
example at lines 394-416:

- embeds an anonymous specification, while the conforming fixture uses a stable
  named IRI;
- applies `sstim:presetVersion` to a specification even though the property's
  domain is `Preset`;
- uses undeclared `sstim:headphoneMode`;
- uses `xsd:dateTimeStamp` where the shape requires `xsd:dateTime`; and
- uses an IRI completion status where the shape requires a string enum.

The document and `SessionSpecification` class promise an acoustically identical
or fully determined execution (`SESSION_MODEL.md:56-60,296-326`;
`sstim-core.ttl:422-426`) while admitting that engine version and WASM checksum
are future fields. The shapes require only a preset, duration, and master
volume on a specification. They do not establish the engine build, algorithms,
assets, seeds, or every output-affecting override.

Preset and voice constraints are also weaker than the prose:

- a preset is defined as containing 1-6 voices, but its shape has no maximum;
- binaural shapes require left and right carriers but do not validate `beatHz`
  against their difference or a declared target band; and
- several cross-field and engine-specific parameter relations are not
  represented.

**What to do:** define one versioned native session schema and a deterministic
RDF projection. Give specifications, instances, events, and reports stable
identifiers. Decide whether the guarantee is configuration-level,
signal-equivalent, perceptually equivalent, or bit-exact, then capture the
engine/build/assets/seeds/checksums needed for that level. Align JSON Schema,
RDF, JSON-LD, SHACL, examples, and runtime code with round-trip and negative
fixtures. Until then, weaken the acoustic reproducibility claim.

#### RDF-07 — the legacy public-claim gate is not an authorization system

The preset SPARQL constraint at `sstim-shapes.ttl:207-230` searches for the
deprecated, directionally misleading `supportsRelation` and compares only
evidence-tier rank. It does not require:

- a supporting rather than refuting, mixed, or inconclusive direction;
- the same atomic proposition or outcome;
- compatible modality, population/model, intervention/context, or comparator;
- a current accepted review decision; or
- a trusted corpus and exact public-expression revision.

The preset fixture at
`instances/presets/perform-alpha-10-seed.ttl:40-54` illustrates the danger:
it materializes `supportsRelation` while explicitly declaring the assessment
inconclusive and “not an authorized public outcome claim.”

Proposed ADRs 0028 and 0029 correctly state that the current check is
reject-only and that passing it never authorizes publication. The SHACL
comments and `static/ontology/README.md:208-211` still describe it more
strongly as public-claim legality or an evidence ceiling.

**What to do:** fail closed for authorization until ADRs 0028 and 0029 are
accepted and implemented for named release surfaces. Bind decisions to exact
expression and proposition revisions, every applicable claim facet, a named
policy and corpus, applicability, direction, current review, consent where
needed, and a trusted-input boundary outside submitted RDF. Add adversarial
fixtures for refuting, inconclusive, wrong-outcome, wrong-modality,
wrong-population, stale, revoked, and injected approvals.

#### RDF-08 — frequency-band concepts mix three different meanings

`FrequencyBandScheme` is described as EEG-derived neural oscillation bands used
for protocol design (`sstim-vocab.ttl:55-72`). The same concepts are then used
as preset stimulus targets through `targetsFrequencyBand`. Their scope notes
also contain outcome language: deep sleep, memory, chronic-pain support, stress
reduction, attention, cognition, calming, meditation, and neuroimmune research
lineages (`sstim-vocab.ttl:76-133,195-243`).

This conflates:

1. an observed neural oscillation range;
2. a temporal frequency applied or targeted by a stimulus; and
3. an evidence-qualified outcome hypothesis.

The outcome prose bypasses the otherwise careful evidence model. Exact SKOS
matches from the local operational bands to external wave/rhythm concepts also
need a documented equivalence rationale; `exactMatch` is stronger than
similarity of labels.

Finally, `targetsFrequencyBand` says the “first” of one or two values is primary
(`sstim-core.ttl:762-767`), but RDF property values are unordered.

**What to do:** separate stimulus temporal-frequency targets from observed
neural oscillation bands and connect them only through explicit hypotheses,
observations, or evidence. Keep SKOS definitions physical and operational;
move outcome language to qualified evidence records. Represent primary and
secondary targets with distinct properties or a ranked association. Re-audit
each `skos:exactMatch` and attach mapping provenance, rationale, reviewer, and
date.

**Status (2026-07-24): partially fixed** ([ADR 0037](../../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md)).
The concrete, unambiguous sub-bug is fixed: `sstim:primaryFrequencyBand`, a
functional sub-property of `targetsFrequencyBand`, replaces the "first entry
is primary" claim, with a SHACL-SPARQL constraint requiring it to be one of
the preset's own targeted bands; both existing seed presets are migrated. The
five frequency-band `skos:exactMatch` mappings to Wikidata were re-audited and
downgraded to `skos:closeMatch`, with a dated, attributed rationale: each
Wikidata item is the observed-oscillation sense only, while SSTIM's bands are
also used, unsplit, as stimulus targets. The larger finding — splitting
oscillation-band and stimulus-target senses into distinct classes and moving
outcome language into qualified evidence records — remains open and is now
tracked by a `skos:editorialNote` on `FrequencyBandScheme` pointing back to
this finding and the ADR: it is a separate, larger modeling project that a
same-session pass alongside RDF-04/05/09/13/15/17 could not responsibly also
complete.

#### RDF-09 — several OWL domains and operational constraints remain unsafe

Some exposure property definitions permit subjects that their RDFS domains do
not:

- `hasBodyPlacement` has domain `StimulusChannel` but says it also applies to
  profiles and capabilities (`sstim-exposure.ttl:263-268`);
- `hasPerceptualGain` and `hasPerceptualLoss` have domain `ExposureProfile` but
  say they also apply to protocols (`277-289`); and
- `hasExposureLimit` has domain `ComfortBoundary` but says it also applies to
  device capabilities (`325-330`).

An RDFS domain is an inference rule, not an input-validation hint. Using these
properties as documented can therefore infer the wrong type. Current fixtures
do not exercise those uses, so all validation remains green.

The evidence basis definition says its axes distinguish modality,
intervention, study design/model, population, synthesis type, and result.
`EvidenceBasisShape` requires a source plus only a modality or explicit
modality-applicability value (`sstim-shapes.ttl:613-626`). That is a reasonable
minimum storage shape, but it is insufficient wherever basis qualification is
used for claim authorization.

**What to do:** use accurate union domains, broader common domains, narrower
subproperties, or no domain plus SHACL subject rules. Add entailment fixtures.
Define a stricter evidence/publication profile in which every relevant axis has
either a concrete value or an explicit unknown/not-applicable marker.

**Status (2026-07-24): the domain half is fixed;** the evidence-basis half is
not. `hasBodyPlacement`, `hasPerceptualGain`, `hasPerceptualLoss`, and
`hasExposureLimit` now use `owl:unionOf` domains matching their own
definitions exactly (the same pattern `hasComfortBoundary` already used).
Entailment fixtures were not added. `EvidenceBasisShape`'s minimum
requirements are unchanged: strengthening them is tied to accepting ADRs
0028/0029 (RDF-07), which remain proposed, not a mechanical fix available on
its own.

#### RDF-10 — self-report RDF is not ready for real participant data

`SelfReport` is described as consent-governed and optionally free-text, but no
SSTIM-defined or SHACL-profiled self-report free-text property exists. The
open shape still permits generic properties such as `dct:description`. The
current five SSTIM values cover affect, focus, sleepiness, subjective quality,
and a goal-achieved boolean
(`sstim-core.ttl:1353-1382`; `sstim-shapes.ttl:875-941`).

The model does not identify the declared goal, prompt or instrument revision,
helpfulness magnitude, missing/refused/not-asked state, repeatable unwanted
experiences, perceived relatedness, or consent/privacy/retention and
de-identification policy. The only session data is a deliberately synthetic
happy-path fixture.

**What to do:** do not ingest real participant reports under the present
contract. Introduce instrument/prompt/response provenance, explicit missing
states, qualified unwanted-experience records, and a versioned privacy profile
covering purpose, consent basis, visibility, retention, withdrawal, and
de-identification. Preserve the rule that individual reports are observations,
not evidence assessments.

### P1 — validation, release, and runtime boundaries

#### RDF-11 — validation is broad, but the deployment gate has blind spots

`make validate` runs SHACL, the ecosystem runtime contract, quality audit,
HermiT, SPARQL, and export checks, but it does not depend on the full
`make test` suite (`Makefile:160-171`). Navigator, general graph,
generated-field, and other runtime/unit tests run only in the independent lint
workflow. The Pages workflow publishes after `make validate` without depending
on that lint result, so it can advance while one of those omitted tests fails.

Other important topology gaps are:

- JavaScript SHACL tests strip every SPARQL constraint; current generated field
  graphs are not passed through authoritative pySHACL in CI.
- General instance validation concatenates all instance files into one default
  graph, allowing cross-file completion and not testing document-level
  publication boundaries.
- The quality audit has broad count floors—55 classes, 120 properties, 295
  concepts, and 30 schemes—far below the current 131/230/445/50, and the
  1,119-line procedural audit has no mutation suite.
- `export-ontology.py` silently skips a missing expected module, and module
  inventories are duplicated across Makefile, export, snapshot, and audit code.
- The RDF-specific workflow path filter omits runtime serializer locations and
  `package.json`/`package-lock.json`, although those dependencies participate in
  validation.
- A new local instance namespace fails open until manually added to the
  resolver prefix allowlist.

These gaps explain how the wrong DOI, stale counts, duplicate definitions, and
public-context data loss can coexist with a completely green validation run.

**What to do:** create one release manifest as the source of module and artifact
inventory. Make runtime RDF tests and authoritative pySHACL over serialized
runtime output part of the Pages gate. Validate each independently published
artifact with an explicit dependency closure, then validate the union. Replace
loose floors with a checked inventory and reviewed expected deltas. Add
mutation tests for the quality audit and fail on a missing manifest member.

**Status (2026-07-24): the Pages/`make test` gap is fixed;** everything else in
this finding is still open. `.github/workflows/pages.yml` now runs `make test`
(the full Vitest suite) before publishing, in the same job as `make validate`,
so Pages can no longer advance while a runtime RDF test fails. The JS-SHACL
`sh:sparql`-stripping, the concatenated instance-validation graph, the loose
quality-audit count floors (55/120/295/30), the duplicated module inventories,
the RDF workflow's missing `src/ui/field/` and `package.json` path-filter
coverage, and the fails-open resolver-prefix allowlist are all unchanged.

#### RDF-12 — immutable snapshot enforcement is mostly procedural

The snapshot tool refuses an existing directory by default and refuses dirty
live module sources, which is good. It also offers `--force`, does not remove
unexpected stale files when overwriting, and has no CI check that historical
directories still match release-tag checksums. Current tests primarily exercise
the pure release-metadata predicate rather than end-to-end filesystem behavior.

The accepted ADR 0020 also conflicts with current tooling. The ADR says each
module keeps an independent module-level `owl:versionInfo`; the `0.5.0`
snapshot demonstrates core `0.5.0` with exposure `0.4.1`. Current quality and
snapshot tooling require every module to share one value, while the README
attributes that synchronization to ADR 0020.

**What to do:** supersede or amend ADR 0020 and state when synchronized module
versions became policy. Publish a checksum manifest bound to the release tag,
and make CI reject any historical snapshot drift. Restrict overwrite to an
explicit unpublished staging location rather than a released version path.

**Status (2026-07-24): the checksum/CI half is fixed;** the ADR 0020 policy
conflict and the `--force`/overwrite-location gap are not addressed by this
pass, since resolving them is a maintainer policy decision (whether
synchronized versionInfo supersedes ADR 0020, or ADR 0020 gets amended to
match current tooling), not a mechanical fix. See RDF-03's status for the new
`snapshot-checksums.json` / `make verify-snapshots` mechanism, which is the
concrete answer to "no CI check that historical directories still match
release-tag checksums."

#### RDF-13 — support artifacts and compatibility terms lack a clear lifecycle

The separate private ecosystem shape file remains at `0.7.0`, lacks creator
and publisher metadata, and is excluded from the seven-module audit, snapshot,
and exports even though `make validate` depends on it. This contradicts
`static/ontology/README.md:66-69`, which says it carries the same metadata.

The public context exposes 29 compact aliases for terms marked
`owl:deprecated true`, including `supportsRelation`, evidence compatibility
fields, `hasEffectClaim`, and flattened ecosystem fields. Compatibility can be
necessary, but exposing these in the primary authoring context makes legacy
terms look current.

Deprecation metadata is also incomplete. The `EvidenceModalityTag` class and
property are deprecated, while their scheme and values remain active. Some
deprecated ecosystem fields have no explicit replacement.

**What to do:** give the private profile a documented independent or
synchronized version policy and validate its metadata. Publish a current
authoring context and, if needed, a separately versioned legacy context.
Require replacement, migration, and removal-window annotations for every
deprecated term.

**Status (2026-07-24): the deprecation-completeness sub-item is fixed;**
everything else in this finding is unchanged. `EvidenceModalityScheme` and its
nine concept values now all carry `owl:deprecated true` (matching the class
and property, which were already deprecated), with `dct:isReplacedBy` pointing
to the five basis-axis properties collectively — a many-to-many
restructuring, not a 1:1 successor, so no single replacement is claimed per
concept. The private shape file's version/metadata policy, the 29 exposed
deprecated-term context aliases, and the other deprecated ecosystem fields
with no explicit replacement are untouched.

#### RDF-14 — mutable ecosystem publication is not failure-safe or continuously checked

The private-first ecosystem publisher has valuable controls, but it writes a
Firestore audit record in `active` state before the Hosting release is
deployed. A failed deployment can leave an active orphan audit; a failed
post-release verification leaves the new public version live with no rollback.
Existing-audit reuse checks the private hash but not the stored public hash and
state (`scripts/sstim-ecosystem-publish.py:136-179,321-326`).

Repository CI validates no real mutable artifact: the public and private input
variables are empty by default, and the successful contract reports zero real
public artifacts. A production `current.ttl` can change independently of the
repository after CI passes.

At consumption time, the optional live fetch has no abort timeout, content
size/type limit, digest/signature check, or client-side SHACL validation.
`loadNavigatorGraph` waits for static and live loads together, so a hanging
external origin can delay the already available static graph
(`src/rdf/loader.js:284-355`).

**What to do:** use pending-to-active audit transitions, compare both hashes,
record the Hosting version, and add rollback/reconciliation with mocked
failure-path tests. Run a scheduled read-only production conformance and
metadata check. Render static RDF first, merge the live graph asynchronously,
and enforce a timeout, size/type policy, publication digest, and visible source
status.

### P2 — quality and maintainability improvements

#### RDF-15 — duplicate definitions and stale documentation create semantic ambiguity

Two concept schemes have two different English definitions in the same graph:

- `StimulusTemporalStructureScheme` at
  `sstim-vocab.ttl:1097-1104,1656`; and
- `TechniqueScheme` at `sstim-vocab.ttl:1149-1155,1657`.

The second `TechniqueScheme` definition is stale and sensory-only even though
the current scheme includes interventional neuromodulation. The stale
Sensory Field SHACL test preamble likewise says the export is non-conformant,
while the assertions below it require and achieve conformance
(`src/ui/field/exposureProfile.shacl.test.js:8-22,69-110`).

Publication and registry documents also contain earlier-version language, and
the top README statistics are stale. These are not cosmetic when AI agents and
external consumers use the documents as contracts.

**What to do:** require exactly one definition per term unless multiple
language-tagged definitions are intentionally used. Generate counts and release
identity from one manifest. Add a documentation drift checklist to release
review.

**Status (2026-07-24): the two duplicate definitions and the stale test
comment are fixed;** the one-manifest and drift-checklist recommendations are
not. Both stale duplicate `skos:definition` triples were removed —
`StimulusTemporalStructureScheme` and `TechniqueScheme` each now have exactly
one definition, verified via `rdflib`. The `exposureProfile.shacl.test.js`
preamble comment was rewritten to state the true current condition (KR-01
closed, every state must and does conform) instead of describing a
"non-conformant, pinned-violation-set" state that no longer existed.

#### RDF-16 — quantities and controlled implementation values are weakly represented

Patch numeric properties encode units in labels and prose. Exposure limits use
free strings for both unit and quantity (`sstim-exposure.ttl:429-448`).
`PermutationFunction` is a controlled concept scheme, but Patch Studio records
the selector as an integer whose meaning is explained in prose
(`sstim-patch-studio.ttl:130-135`).

**What to do:** use QUDT/OM unit IRIs or explicit quantity-value nodes where
interchange matters. Link voices to a controlled permutation individual and
retain any integer only as an implementation code. Add unit and code mapping
fixtures.

#### RDF-17 — logical category guards and mappings need another review pass

Disjointness is sparse, so several process/artifact/implementation category
errors remain satisfiable, especially because external upper ontologies are not
imported for the released local reasoning closure. Add only well-justified
disjointness or SHACL anti-co-typing constraints; indiscriminate disjointness
would be worse.

External SKOS mappings have file-level comments but no per-mapping provenance,
rationale, confidence, or review date. The operational band definitions and
some external wave concepts are not obviously extensionally identical, making
`skos:exactMatch` a high bar.

The new `Neuroplasticity` class uses BFO disposition
`bfo:0000016`, but the alignment module supplies display labels for other
external upper terms and omits that one. This leaves an opaque numeric node in
non-reasoning browsers.

**What to do:** add targeted category fixtures, re-audit exact mappings, qualify
mapping assertions, and keep the external display-stub inventory complete.

**Status (2026-07-24): the display-stub gap and the frequency-band mapping
re-audit are fixed;** category fixtures and disjointness are untouched. The
missing `bfo:0000016` ("disposition") label stub was added, matching the
existing pattern for `bfo:0000015`. The five frequency-band `exactMatch`
mappings were re-audited and downgraded to `closeMatch` with a dated,
attributed rationale — see RDF-08's status. `techBinauralBeats`'s `exactMatch`
was left as-is (a technique-to-technique match, not the flagged operational-band
case). No targeted category fixtures or new disjointness/anti-co-typing
constraints were added.

#### RDF-18 — language coverage, reference documentation, and external review lag growth

Of 445 concepts, 189 have English, Italian, Portuguese, and Spanish preferred
labels; 256 are English-only. The label “multilingual” is accurate but does not
describe the uneven coverage. Generated WIDOCO documentation centers on core
and pyLODE centers on vocabulary, leaving exposure, ecosystem, and Patch Studio
less visible as reference modules.

Versions `0.7.0`, `0.8.0`, `0.9.0`, and `0.10.0` were released between July 15
and July 24 while the model expanded to 131 classes, 230 properties, and 445
concepts. The repository transparently says that no independent human ontology
review has occurred. The semantic contradictions introduced in `0.10.0` show
why a stabilization window would now be valuable.

**What to do:** publish per-scheme translation completeness, generate merged
and per-module documentation, pause scope growth, and seek independent ontology,
domain, privacy, and linked-data publication review before claiming 1.0
maturity.

#### RDF-19 — instance discovery and named-graph provenance are incomplete

The staged w3id documentation acknowledges that deep protocol, preset, session,
evidence, and reference IRIs still need routes
(`docs/ecosystem/w3id/README.md:130-146`). VoID advertises example instance
IRIs but does not enumerate distributions for every committed instance file.
The JavaScript loader is the only explicit browser-load manifest; the quality
audit independently discovers committed files and verifies loader parity.

The loader groups documents by family graph, such as all presets or all
experiments, rather than preserving document-level source graphs. This is a
valid design, but it loses source-document provenance and should not be
described elsewhere as one graph per source.

The SPARQL workbench also overstates its runtime surface. Although
`src/rdf/query.js` implements SELECT, ASK, and CONSTRUCT, the page always calls
`select()` while describing itself as a full SPARQL 1.1 engine
(`src/routes/sparql/+page.svelte:83-110`). SELECT results are fully materialized
and rendered without timeout, cancellation, row limit, pagination, or worker
isolation.

**What to do:** add stable deep-IRI routing and an instance distribution
manifest. Use dedicated `/graph/...` identifiers, preserve document provenance
or state that graphs are family-level, and offer a union-default query mode for
consumers that do not expect a named-graph-only dataset. Dispatch the workbench
by query type or label its supported subset accurately, and bound query
execution and result rendering.

## Progress since the 2026-07-13 audit

Several earlier high-priority issues are materially improved:

- the Sensory Field exporter now emits conformant role-specific RDF rather than
  manufacturing evidence claims;
- evidence assessments, hypotheses, questions, knowledge status, and boundary
  applicability are separated;
- assessment scope, basis, proposition, source governance, and review
  provenance are much stronger;
- ecosystem relationships and consent lifecycle are qualified and heavily
  tested;
- annotations use `oa:bodyValue`, controlled motivations, pseudonymous
  attribution, and private-by-default graph selection;
- framework-originated and incorporated techniques are distinguished; and
- generic `dct:created` JSON-LD coercion no longer corrupts session timestamps.

The main earlier issues still open are the session contract, participant
observation/privacy model, public-copy authorization, reproducibility
boundaries, neural-versus-stimulus frequency semantics, ordered primary targets,
mapping provenance, and full runtime/publication-boundary validation.

## Recommended sequence

### Gate A — release integrity

Complete before publishing more ontology scope:

1. ☐ publish an erratum for the incorrect `0.8.0`-`0.10.0` RDF citations —
   **open; requires the maintainer's Zenodo access**;
2. ☑ fix the public-context/RDFLib export interaction and test all 28 top-level
   and committed instance Turtle documents with it — **done**
   (`make context-roundtrip`);
3. ☑ cut a corrective release with coherent version, DOI, status, dates,
   citation, VoID, history, counts, and generated documentation — **done**:
   `0.11.0` is tagged, frozen, and archived at `10.5281/zenodo.21536124`;
4. ☑ publish a versioned whole-set manifest or aggregate with checksums —
   **checksums done for existing snapshots (`snapshot-checksums.json`,
   `make verify-snapshots`); a discoverable manifest/aggregate at the version
   IRI itself is still open**;
5. ☑ make historical snapshot checksums immutable in CI — **done**
   (`make verify-snapshots`, wired into `make validate`); and
6. ☑ make Pages depend on the runtime RDF tests as well as `make validate` —
   **done** (`pages.yml` runs `make test`).

**Exit criterion:** a consumer can start from the version IRI, discover the
entire frozen set, verify it, use the public context without graph loss, and
obtain one unambiguous citation. **Not yet met** — item 1 remains (needs the
maintainer's Zenodo access, not an in-repository edit), and the manifest half
of item 4 is a separate, not-yet-done implementation task.

### Gate B — semantic stabilization

1. ☑ repair the self-directed-neuromodulation genus — **done**
   (`sstim:DeliberateSelfRegulation`, ADR 0037);
2. ☑ decide and encode the sensory-neurostimulation branch — **done**
   (`sstim:SensoryNeurostimulation`/`-Technique`, ADR 0037);
3. ☑ narrow generic biofeedback classification — **decided and documented,
   not restructured**: kept neutral per this gate's own recommendation, with
   the reasoning recorded so it reads as deliberate, not an oversight;
4. ☑ repair exposure domains — **done** for the three flagged properties;
   the `EvidenceBasisShape` strengthening is separately gated on RDF-07/ADR
   0028-0029 acceptance;
5. ☑ remove duplicate definitions and complete deprecations — **done**
   (`StimulusTemporalStructureScheme`/`TechniqueScheme` duplicates,
   `EvidenceModalityScheme`/`EvidenceModalityTag` deprecation); the private
   shape file's version policy (RDF-13) and the 29 exposed deprecated-term
   context aliases are untouched;
6. ☐ split neural oscillation bands from stimulus frequency targets —
   **open**: only the concrete ordering sub-bug is fixed
   (`sstim:primaryFrequencyBand`); the class/scheme split and outcome-language
   migration to evidence records is a separate, larger project, now tracked
   by a `skos:editorialNote` on `FrequencyBandScheme`; and
7. ☑ re-audit exact external mappings — **done** for the five frequency-band
   mappings (downgraded to `closeMatch` with dated, attributed rationale) and
   the missing `bfo:0000016` display-label stub; broader disjointness/category
   fixtures (RDF-17) are untouched.

**Exit criterion:** prose definitions, class axioms, SHACL usage, expected
queries, and examples express the same model. **Not yet fully met** — item 6
(the full RDF-08 split) remains, and RDF-13's private-shape-file policy and
context-alias exposure are outside this gate's scope as originally listed.

### Gate C — executable contracts

1. create the versioned session schema and deterministic RDF projection;
2. define the actual reproducibility level and required engine metadata;
3. accept and implement the exact-expression public-claim model and BSC policy,
   or keep publication explicitly fail-closed;
4. validate each artifact independently and validate generated runtime graphs
   with full pySHACL; and
5. replace duplicated file lists and loose count floors with a release manifest
   and reviewed deltas.

**Exit criterion:** every claimed contract has a positive fixture, adversarial
negative fixtures, and a deployment-blocking runtime test.

### Gate D — real-data readiness

1. design instrumented observations and qualified self-reports;
2. model unwanted experiences and explicit missing/refused states;
3. approve consent, privacy, retention, withdrawal, and de-identification
   profiles;
4. make ecosystem publication transaction-like with pending-to-active states,
   compensation/rollback, reconciliation, and failure-path tests; and
5. continuously validate the mutable production projection.

**Exit criterion:** no real participant or ecosystem record is published solely
because a synthetic fixture and repository-local static graph conform.

### Gate E — maturity

1. schedule a stabilization period;
2. obtain independent ontology, domain, privacy, and linked-data review;
3. publish per-scheme language-coverage metrics; and
4. generate complete per-module and whole-set reference documentation.

## Bottom line

SSTIM's strongest qualities are its modular intent, evidence separation, SKOS
discipline, privacy-aware ecosystem contract, and reproducible validation
toolchain. Its main weakness is contract drift: release metadata, version
resolution, natural-language definitions, SHACL, runtime serialization, and
human documentation are not always governed as one artifact.

Fixing the three P0 publication defects and stabilizing the new
neuromodulation/session semantics will produce more value than adding new
classes or concepts. The repository has enough machinery to make those repairs
durable; the next step is to aim that machinery at release coherence and
semantic regression, not only graph conformance.
