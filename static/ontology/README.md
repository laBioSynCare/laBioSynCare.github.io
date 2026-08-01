# Sensory Stimulation Ontology (SSTIM)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21286974.svg)](https://doi.org/10.5281/zenodo.21286974)

SSTIM is the reusable semantic layer of BSC Lab. It represents
parameter-specified sensory stimulation techniques, protocols, implementations,
presets, exposure channels, evidence claims, safety metadata, session plans,
and recorded executions using OWL 2, SKOS, SHACL, PROV-O, VoID, and DCAT.

This is a non-clinical vocabulary. A mechanism, intended effect, preset name,
or evidence link does not establish treatment efficacy. Read
[Scope](../../docs/concept/SCOPE.md),
[Non-Scope](../../docs/concept/NON_SCOPE.md), and the
[Evidence Framework](../../docs/concept/EVIDENCE_FRAMEWORK.md) before extending
the graph.

## Status

- Latest immutable release: `v0.12.0`, DOI
  [10.5281/zenodo.21717988](https://doi.org/10.5281/zenodo.21717988), version
  IRI `https://w3id.org/sstim/0.12.0`.
- All-version DOI:
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- Live sources: the mutable `0.13.0-dev` modular preview accepted by ADR 0043.
  Its source inventory and closures are defined by [`manifest.json`](manifest.json),
  and every module carries synchronized `owl:versionInfo`. This development line
  is not an immutable release.
- Immutable-release term-graph counts are checked by
  `scripts/sstim-quality-audit.py` and published in `void.ttl` rather than
  duplicated here.
- Public instance and synthetic-fixture graph counts are published in
  `void.ttl` and verified by the quality audit rather than duplicated here.
- Persistent namespace: `https://w3id.org/sstim`.
- License: CC BY 4.0.

The frozen [`0.12.0/`](0.12.0) directory is immutable and is the current citable
whole-set release.

## Files

```text
static/ontology/
|-- manifest.json           Authoritative live module/profile bill of materials
|-- manifest.schema.json    Manifest contract at /sstim/manifest-schema/1
|-- sstim-core.ttl          Dependency-free process Kernel
|-- sstim-stimulus.ttl      Engine-independent Core stimulus descriptions
|-- sstim-common.ttl        Optional reusable descriptors and quantities
|-- sstim-*-profile.ttl     Kernel, Core, Core Plus, and Full OWL import entry points
|-- sstim-core-shapes.ttl   Weak reusable Core SHACL contract
|-- sstim-shapes.ttl        Full SHACL Core and SHACL-SPARQL policy
|-- sstim-*.ttl             Concern, bridge, vocabulary, and alignment modules
|-- sstim-ecosystem-private-shapes.ttl  Separate access-controlled audit profile (rules only)
|-- context.jsonld          Public JSON-LD compaction context
|-- void.ttl                VoID/DCAT publication metadata and checked counts
|-- 0.1.0/ ... 0.12.0/     Immutable whole-set snapshots
`-- instances/
    |-- frameworks/         BSC framework and framework techniques
    |-- implementations/    BSC Lab and public-safe BioSynCare identities
    |-- protocols/          Public BSC Lab reference protocols
    |-- presets/            Public reference preset fixtures
    |-- evidence/           Technique and preset evidence assessments
    |-- references/         DOI-identified public-safe references
    |-- experiments/        Exploratory exposure protocols and profiles
    |-- sessions/           Explicitly synthetic session fixture only
    `-- ecosystem/
        |-- fixtures/      Synthetic ecosystem contract graph only
        `-- agents/        Reserved contract graph; no committed real data
```

The live manifest-owned modules, profile entry points, and separate private-audit
shape file declare an `owl:Ontology` node with title, description, creator,
creation/modification dates, license, and version metadata. Modules carry
`owl:versionInfo` only. The root Kernel receives a version IRI only when the
whole set is frozen for release; see
[ADR 0020](../../docs/decisions/0020-whole-set-snapshot-versioning.md).

### Module maturity

The frozen `0.12.0` suite remains an eight-file whole-set release. The live
`0.13.0-dev` line implements an acyclic Kernel/Core/Core Plus architecture with
optional concern and bridge modules and an explicit Full compatibility profile.
[`manifest.json`](manifest.json) is authoritative for direct dependencies,
transitive profile closures, runtime graphs, publication URLs, and checksums;
do not reconstruct that inventory from this directory listing.

Read the [module architecture and adoption guide](../../docs/ontology/MODULE_ARCHITECTURE.md)
for the exact dependency table, profile and SHACL selection, Full-union
compatibility contract, named-graph ownership rules, and current deferred gaps.
The evidence is in the
[2026-08-01 boundary audit](../../docs/ontology/reviews/2026-08-01-sstim-core-and-module-boundary-audit.md),
and the accepted decisions are
[ADR 0043](../../docs/decisions/0043-sstim-core-profile-and-module-boundaries.md)
and [ADR 0044](../../docs/decisions/0044-stimulus-channel-core-ownership.md).

### Publication and profile discovery

The live manifest identifies its schema with the persistent IRI
`https://w3id.org/sstim/manifest-schema/1`. Each Kernel, Core, Core Plus, and
Full entry point is both an `owl:Ontology` and a `prof:Profile`; its
`prof:hasResource` descriptors expose the specification, the applicable SHACL
constraints where one is published, and the manifest. This discovery metadata
does not make the mutable `0.13.0-dev` sources a citable release.

For a release, `$schema` and `immutableRelease.schemaUrl` identify the frozen
`<version>/manifest.schema.json` sibling. The entrypoint, constraints, and
manifest `prof:hasArtifact` values likewise change from mutable discovery IRIs
to the profile, shape, and manifest immutable URLs before checksums are taken.

The modular publication contract deliberately separates a namespace document
from the smallest ontology file:

- machine RDF at `https://w3id.org/sstim` is a generated catalog of the Full
  semantic namespace;
- `https://w3id.org/sstim/kernel` returns exactly `sstim-core.ttl`, the
  dependency-free two-class Kernel; and
- machine RDF at `https://w3id.org/sstim/exposure` is a generated Stimulus +
  Exposure namespace catalog, because `sstim-ex:StimulusChannel` is owned by
  the Stimulus module while retaining its stable exposure-namespace IRI; and
- `https://w3id.org/sstim/module/exposure` returns only
  `sstim-exposure.ttl` (or its negotiated serialization) and is the exact
  mutable distribution/import endpoint for the Exposure semantic module.

The two Exposure URLs are not interchangeable. The live Full profile's
`dct:requires` may identify the logical Exposure ontology as `/sstim/exposure`,
but its retrieval-bearing `owl:imports` uses `/sstim/module/exposure` so
importing Exposure does not silently import the Stimulus + Exposure namespace
catalog. During release preparation that endpoint, like every other mutable
module endpoint, is replaced by the exact immutable versioned sibling Turtle
URL.

The source manifest, generators, and mirrored w3id rules encode this behavior,
but the `0.13.0-dev` catalogs, profile routes, and schema PID remain staged until
the generated Pages artifacts are deployed and the perma-id update is merged
and verified.

The Core SHACL contract keeps `hasStimulusChannel` and
`hasStimulationTarget` optional. If present, however, a channel link must point
to a resource typed `sstim-ex:StimulusChannel`, and a target link must point to
an IRI or blank node rather than a literal. This weak-but-typed contract avoids
silently accepting malformed optional links without importing delivery,
evidence, safety, configuration, or session policy.

## Namespaces

| Prefix | IRI | Purpose |
|---|---|---|
| `sstim:` | `https://w3id.org/sstim#` | Reusable suite classes and properties owned across semantic modules |
| `sstim-v:` | `https://w3id.org/sstim/vocab#` | Controlled SKOS values |
| `sstim-sh:` | `https://w3id.org/sstim/shapes#` | SHACL shapes |
| `sstim-ex:` | `https://w3id.org/sstim/exposure#` | Exposure identifiers owned across Stimulus and Exposure modules |
| `sstim-eco:` | `https://w3id.org/sstim/ecosystem#` | Ecosystem relationship and consent terms |
| `bsc-fw-tech:` | `https://w3id.org/sstim/framework/bsc/technique/` | BSC framework techniques |
| `bsclab-protocol:` | `https://w3id.org/sstim/implementation/bsclab/protocol/` | Public BSC Lab protocols |
| `bsclab-preset:` | `https://w3id.org/sstim/implementation/bsclab/preset/` | Public BSC Lab presets |
| `bsclab-evidence:` | `https://w3id.org/sstim/implementation/bsclab/evidence/` | BSC Lab editorial claims |
| `bsclab-session:` | `https://w3id.org/sstim/implementation/bsclab/session/` | Session data |
| `sstim-ref:` | `https://w3id.org/sstim/ref/` | Reusable public references |
| `sstim-organization:` | `https://w3id.org/sstim/organization/` | Public ecosystem organizations |
| `sstim-specialist:` | `https://w3id.org/sstim/specialist/` | Public professional person records |
| `sstim-ecosystem-record:` | `https://w3id.org/sstim/ecosystem-record/` | Qualified ecosystem relationships and engagement activities |

The ontology, public implementation data, user annotations, and sessions are
separate named graphs. Private BioSynCare catalog data is never converted into
or loaded by this repository.

## Modeling Levels

SSTIM keeps these levels distinct:

| Level | Meaning |
|---|---|
| `SensoryStimulationFramework` | Broad principles, evidence rules, techniques, and constraints |
| `SensoryStimulationTechnique` | Reusable information category for a parameterizable method |
| `SensoryStimulationProtocol` | Structured use specification combining techniques and constraints |
| `SensoryStimulationImplementation` | Software, hardware, manual, or hybrid realization |
| `Preset` | Versioned parameter configuration for one implementation |
| `SessionSpecification` | Immutable `prov:Plan` for one intended execution |
| `SessionInstance` | Actual `prov:Activity` and sensory stimulation intervention |
| `SelfReport` | Consent-governed, phase-qualified subjective observation |
| `EcosystemAgent` | Neutral person-or-organization umbrella, separate from implementations |
| `EcosystemRelationship` | Sourced, purpose-specific qualified agent-to-resource record |
| `EngagementActivity` | Purpose-scoped lifecycle event; only approved positive state is public |

BSC is a framework. BSC Lab and BioSynCare are implementations. A preset is not
a protocol, and a recorded session is not a preset. See
[ADR 0007](../../docs/decisions/0007-framework-protocol-implementation.md) and
[ADR 0014](../../docs/decisions/0014-preset-is-not-a-protocol.md).

## OWL And SKOS Pattern

Controlled values use the dual-typing pattern from
[ADR 0002](../../docs/decisions/0002-dual-typing-owl-skos.md):

```turtle
sstim-v:modalityAuditory
    a owl:NamedIndividual, sstim:SensoryModality, skos:Concept ;
    skos:inScheme sstim-v:SensoryModalityScheme ;
    skos:topConceptOf sstim-v:SensoryModalityScheme ;
    skos:prefLabel "Auditory"@en ;
    skos:notation "auditory" ;
    skos:definition "..."@en .
```

This supports SKOS browsing and OWL/SHACL range checks with one stable IRI.
Value classes such as `SensoryModality`, `StimulationMechanism`, and
`IntendedEffect` are information content entities: their concepts classify
real-world channels, processes, or design intents but are not themselves those
material entities. See
[ADR 0021](../../docs/decisions/0021-controlled-value-semantics.md).

SSTIM materializes both directions of every `hasTopConcept`/`topConceptOf` and
`broader`/`narrower` pair because the web application does not run OWL inference
for basic navigation. CI also checks one preferred label per language, one
notation per concept, notation uniqueness within a scheme, documentation
coverage, and absence of broader cycles.

## Upper Model

The selected upper-model placements are deliberately small:

| SSTIM class | Parent |
|---|---|
| `SensoryStimulation` | BFO process (`bfo:0000015`) |
| `SensoryStimulationIntervention` | COB planned process (`cob:0000082`) |
| `SensoryStimulationTechnique` | IAO information content entity (`iao:0000030`) |
| `SensoryStimulationFramework`, `Preset` | IAO information content entity |
| `SensoryStimulationProtocol` | IAO information content entity and OBI protocol (`obi:0000272`) |
| `SessionSpecification` | IAO information content entity and `prov:Plan` |
| `SessionInstance` | `prov:Activity` and `SensoryStimulationIntervention` |
| `SensoryStimulationImplementation` | `prov:Entity` |
| `EcosystemAgent` | `prov:Agent` |
| `EcosystemRelationship` | IAO information content entity and `prov:Entity` |
| `EngagementActivity` | `prov:Activity` |
| controlled-value classes | IAO information content entity |

SSTIM references selected OBO IRIs instead of importing entire external
ontologies. Alignments are conservative. The 0.6 audit removed obsolete
`obi:0000011` from live axioms and rejected OBI protocol as an over-specific
parent for a technique category. In addition, no MeSH mapping is asserted for
a supposed `D012910` Sensory Stimulation term: that identifier is Snake Venoms.
See the [external review disposition](../../docs/ontology/reviews/2026-07-10-external-automated-review.md).

## Evidence Governance

Evidence attaches to a scoped assessment, never globally to "sensory
stimulation". Since ADR 0027 an `sstim:EvidenceAssessmentClaim` is an immutable
revision carrying an atomic bounded proposition, an explicit scope, and a
qualified evidence basis (source-level modality, design, model, and synthesis
kept separate). It evaluates its subject through the neutral
`sstim:evaluatesSubject`; direction lives only in `hasClaimDirection`:

```turtle
bsclab-evidence:ssvep-photic-response/revision/1
    a sstim:EvidenceAssessmentClaim, sstim:EvidenceClaim ;
    sstim:evaluatesSubject sstim-v:techPhoticDriving ;
    sstim:hasEvidenceTier sstim-v:tierStrong ;
    sstim:hasClaimDirection sstim-v:claimSupports ;
    sstim:assessesProposition bsclab-evidence:ssvep-photic-response/revision/1/proposition ;
    sstim:hasEvidenceBasis bsclab-evidence:ssvep-photic-response/revision/1/basis-1 ;
    sstim:citesReference sstim-ref:VIALATTE_2010 ;
    prov:wasGeneratedBy bsclab-evidence:ssvep-photic-response/revision/1/activity ;
    dct:modified "2026-07-13"^^xsd:date ;
    prov:wasAttributedTo <https://orcid.org/0000-0002-9699-629X> .
```

Non-evidence statements (hypotheses, research questions, boundary
applicability, requirements, design objectives, planned outcomes, and
corpus-scoped knowledge-status assertions) are deliberately **not**
`EvidenceClaim`s and never carry a tier — see
[ADR 0027](../../docs/decisions/0027-evidence-claim-family-and-public-claim-gate.md).

Every claim requires a tier, modality tag, direction, review status, review
date, modification date, accountable agent, and explicit subject. Claims at
`tierRank >= 3` must cite a declared public-safe reference. Exploratory exposure
claims remain speculative, inconclusive, and provisional unless audited
evidence supports promotion.

Public preset copy uses the C0-C5 claim-level scheme. SHACL rejects a public
claim level above its evidence ceiling and always rejects medical/condition
claims under the current policy. This is risk-reduction metadata, not legal
advice; see [ADR 0018](../../docs/decisions/0018-evidence-integrity-and-public-claim-governance.md).

## Safety Metadata

`CautionTag` concepts now carry:

- exactly one `CautionSeverity` with rank 1-4;
- a trigger condition;
- affected-user/context guidance;
- a concrete recommended action;
- a display priority.

These are interface and validation instructions, not diagnoses. Exposure
limits separately record a quantity, unit, placement, numeric threshold, and
source standard. They do not assert that a particular delivery is safe. Runtime
flicker enforcement remains in `src/ui/safety/flashSafety.js`. The published
threshold records distinguish WCAG's flash criterion, NIOSH's occupational
noise recommendation, and ICNIRP's spectrally weighted ultraviolet limit.

## Exposure Model

The exposure module separates concerns that a single `techniqueModality` tag
cannot represent:

```text
Protocol / Technique / Preset
  -> ExposureProfile
      -> StimulusChannel
          -> PhysicalDeliveryMedium
          -> PerceivedModality
          -> DeviceCapability
          -> BodyPlacement
          -> StimulusPattern
          -> ComfortBoundary -> ExposureLimit -> external standard
      -> ExposureEffectClaim -> EffectDimension + KnowledgeStatus
```

This supports auditory, visual, somatosensory, interoceptive, vestibular,
olfactory, gustatory, environmental, and explicitly non-perceived physical
exposure descriptions without equating the delivery medium with perception.
The haptic/tactile/somatosensory/vibrotactile convention is fixed in
[ADR 0019](../../docs/decisions/0019-modality-nomenclature-cleanup.md).

## Ecosystem Data

The ecosystem module keeps people, organizations, implementations, and the
records connecting them distinct. An `EcosystemAgent` is explicitly typed as a
Schema.org person or organization. Each relationship is a named
`EcosystemRelationship` that binds one agent to one target, controlled type,
purpose, source set, curator, and review date. `OrganizationMembership` reuses
W3C ORG membership, member, organization, and role terms;
`ImplementationResponsibility` identifies who develops, publishes, maintains,
provides, operates, hosts, or funds an implementation without equating that
agent with the implementation itself.

The public graph is an approved current-state projection. Every relationship
ends in a final publication approval by its curator; a person self-publishes or
has an earlier scoped consent grant. Only notification-sent, acknowledged,
consent-granted, and publication-approved outcomes may be public. Complete
append-only history—including failure, dispute, correction, removal,
correspondence, authentication IDs, and raw consent evidence—belongs only to
the access-controlled private audit and must never appear in committed RDF.

The current `instances/ecosystem/fixtures/` data is entirely synthetic and exists to
exercise memberships, implementation responsibility, lifecycle ordering, and
the public/private boundary. Real organizations and people require the ADR 0031
readiness gate and remain live-only/non-archival by default. Because Zenodo
archives the repository state associated with a published GitHub release—not
only the output of `make snapshot`—real live-only ecosystem records must be
served from the designated external mutable store and must not be committed to
this repository. See the [publication plan](../../docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md#ontology-snapshot-versus-release-archive).

## Session Data

The committed session is a synthetic, non-personal fixture. It demonstrates:

- an immutable `SessionSpecification`/`prov:Plan` referencing one preset;
- an executed `SessionInstance` with start/end time and completion status;
- multiple `SelfReport` nodes rather than one overwritten report;
- explicit pre-session and immediate-post collection phases;
- collection timestamps and a statement that the values are not evidence.

Real participant records are not committed. A follow-up report is a separate
node with its own phase and timestamp.

## Validation

From the repository root, inside the Nix dev shell:

```bash
make validate
```

That command runs:

1. the machine-readable manifest and ownership contracts: dependency
   acyclicity, exact profile closures, one authoritative source for each named
   OWL term, SKOS value, and SHACL shape, ontology-header parity,
   runtime/publication mappings, and source checksums;
2. pySHACL over the Core profile with Core shapes, the Full closure with Full
   shapes, and all public instances;
3. the isolated ecosystem contract: JSON-LD graph isomorphism, 34 adversarial
   public SHACL overlays, six file-profile leakage overlays, six private-ledger
   adversarial cases, a self-publication positive scenario, complete-history
   mirroring and private-terminal deletion proofs, exact qualified
   bindings, and runtime named-graph isolation;
4. `scripts/sstim-quality-audit.py` for module/context/loader completeness,
   SKOS integrity, functional values, local IRI resolution, evidence provenance,
   ecosystem namespace ownership, VoID counts, and competency thresholds;
5. normalized Full-union equivalence against the frozen `0.12.0` distribution,
   plus ROBOT with HermiT over the merged OWL module set;
6. named-graph SPARQL competency queries through Comunica; and
7. graph-isomorphic JSON-LD and RDF/XML export round trips for every
   manifest-owned Turtle source.

Useful narrower targets:

```bash
make shacl
make shacl-private-ecosystem
make ecosystem-contract
# Required once a real aggregate exists; the ledger path must be outside the repo:
make ecosystem-contract PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl
make quality-audit
make reason
make sparql-sanity
make export-check
make export EXPORT_DIR=/tmp/sstim-export
```

CI runs the same pinned toolchain for any change to ontology data, the loader,
or validation scripts.

## Named Graphs

Every live ontology module has a runtime named graph. The exact source-to-graph
mapping is the module's `runtime.graphIri` in [`manifest.json`](manifest.json),
including the new Common, Technique, Configuration, Session, Neuromodulation,
Evidence, and bridge graphs. Named graphs record authoritative source/runtime
provenance; they are not import closures or term namespaces, and graph ownership
may differ from the frozen `0.12.0` dataset layout.

Public instance data uses these additional graph families:

```text
https://w3id.org/sstim/graph/frameworks
https://w3id.org/sstim/graph/implementations
https://w3id.org/sstim/graph/ecosystem-fixture
https://w3id.org/sstim/graph/ecosystem-agents
https://w3id.org/sstim/implementation/bsclab/protocol/
https://w3id.org/sstim/implementation/bsclab/preset/
https://w3id.org/sstim/implementation/bsclab/evidence/
https://w3id.org/sstim/implementation/bsclab/experiment/
https://w3id.org/sstim/implementation/bsclab/session/
https://w3id.org/sstim/ref/
```

The semantic-module inventory comes from `manifest.json`.
`src/rdf/loader.js` separately inventories public instance files and assigns
their graphs; adding an instance without wiring that loader inventory fails the
quality audit.

## Query Examples

```sparql
PREFIX sstim: <https://w3id.org/sstim#>
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX sstim-eco: <https://w3id.org/sstim/ecosystem#>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

# Presets targeting alpha or a narrower alpha band.
SELECT DISTINCT ?preset ?band WHERE {
  ?band skos:broader* sstim-v:alpha .
  ?preset a sstim:Preset ; sstim:targetsFrequencyBand ?band .
}

# Fully attributable cited evidence trails.
SELECT ?claim ?subject ?tier ?reference ?agent WHERE {
  ?claim a sstim:EvidenceAssessmentClaim ;
    sstim:evaluatesSubject ?subject ;
    sstim:hasEvidenceTier ?tier ;
    sstim:citesReference ?reference ;
    <http://www.w3.org/ns/prov#wasAttributedTo> ?agent .
}

# Framework -> protocol -> preset chain.
SELECT ?framework ?protocol ?preset WHERE {
  ?protocol sstim:definedByFramework ?framework .
  ?preset sstim:followsProtocol ?protocol .
}

# Sourced person-to-organization memberships without role/source mixing.
SELECT ?person ?organization ?role ?source WHERE {
  ?membership a sstim-eco:OrganizationMembership ;
    org:member ?person ;
    org:organization ?organization ;
    org:role ?role ;
    <http://purl.org/dc/terms/source> ?source .
}
```

## Versioning And Publication

SSTIM versions the manifest-owned modules as one synchronized citable set:

1. Develop in top-level modules with a `-dev` `owl:versionInfo`, no
   `owl:versionIRI`, and `mod:status "under development"` in the core. The
   quality audit enforces that all modules carry the same version and that a
   `-dev` line never claims released status.
2. Run the complete validation suite and review semantic diffs.
3. Set the release version in **every manifest-owned module and profile entry
   point**, synchronize manifest checksums, and set the `owl:versionIRI` and
   `mod:status "released"` in the root Kernel. Populate every profile's
   positive, out-of-scope, and adversarial fixture sets and at least one
   competency query. Every listed contract path must already name an existing
   repository file.
4. Give every snapshotted module and profile its exact immutable
   `publication.versionedUrl`; add the manifest's immutable base, manifest, and
   schema URLs; point the released `$schema` at the frozen schema sibling; and
   change every profile `owl:imports` list to the exact versioned sibling files
   in its declared closure. Change each profile's specification, constraints,
   and manifest `prof:hasArtifact` values to those immutable artifacts too.
   Release preparation must do this before hashing; the snapshot command does
   not rewrite imports or discovery metadata.
5. Commit, then run `make snapshot VERSION=X.Y.Z`; the command refuses dirty
   or unverifiable sources, a checksum-registered snapshot, dev/prerelease
   versions, diverging module versions, mutable profile imports/discovery
   artifacts, missing contract files, and missing release metadata. Snapshot
   creation fails if checksum-ledger registration fails
   (`scripts/snapshot-ontology.test.mjs` covers these refusals).
6. Regenerate the persistent snapshot routes with
   `node scripts/sstim-w3id-snapshot-routes.mjs --write` and commit the updated
   `docs/ecosystem/w3id/sstim/.htaccess`, then submit it upstream. Without this
   the new version has no w3id routes; `make w3id-routes` (part of
   `make validate`) fails until the committed region matches the frozen
   snapshots on disk.
7. Audit the entire tagged repository state—not only
   `static/ontology/<version>/`—and confirm that it contains no private ledger
   and no real live-only ecosystem records.
8. Tag and publish the GitHub release so Zenodo archives the same commit.
9. Add the resulting version DOI without rewriting a published snapshot.

The current development manifest intentionally has no immutable release URLs.
Only Core has a positive fixture and an executable contract today; Kernel,
Core Plus, and Full still need profile-specific fixtures and competency
queries, and Core still needs its out-of-scope and adversarial fixture sets.
Consequently `0.13.0-dev` is noncitable even though its module and publication
mechanics are implemented.

Generated JSON-LD and RDF/XML are distributions; Turtle remains the editable
master. `context.jsonld` is a hand-maintained compaction context, not a generated
serialization.

## Extension Checklist

For a new controlled concept:

1. Reuse an existing scheme when its scope fits.
2. Add dual typing, one English preferred label, one notation, and a definition.
3. Add all applicable language labels and the appropriate top/broader link.
4. Materialize the inverse hierarchy link.
5. Add evidence and caution metadata separately from the concept definition.
6. Update `context.jsonld` if a new class or property was introduced.
7. Add or update SHACL and competency queries.
8. Run `make validate` and `make export`.
9. Record a non-obvious modeling decision in an ADR.

Do not add an `exactMatch` from label similarity alone, treat an intended effect
as an observed outcome, attach evidence globally to a technique family, put
private/user data in public instance files, or edit a frozen version directory.

## Citation

Use SSTIM `v0.12.0` for the current immutable citation:

```bibtex
@misc{fabbri_sstim_2026,
  author    = {Fabbri, Renato},
  title     = {BSC Lab - Sensory Stimulation Ontology (SSTIM) and open stimulation platform},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.21717988},
  url       = {https://doi.org/10.5281/zenodo.21717988}
}
```

For SSTIM across all releases, use the concept DOI
[10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
