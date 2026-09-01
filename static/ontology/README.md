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

Version facts are derived, never restated here — restating them is what made
three documents advertise a superseded release at once. Read them from source:

| Fact | Source |
|---|---|
| Live development version, module inventory, profile closures | [`manifest.json`](manifest.json) |
| Latest citable release and its version DOI | [`void.ttl`](void.ttl) (`dcat:version`, `dct:hasVersion`) |
| Citation metadata | [`CITATION.cff`](../../CITATION.cff) |
| Term-graph, instance, and fixture counts | `void.ttl`, checked by `scripts/sstim-quality-audit.py` |

`make truth-audit` fails if these disagree with each other or with prose.

- Persistent namespace: `https://w3id.org/sstim`. All-version concept DOI:
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974) — stable
  across every release. License: CC BY 4.0.
- Live sources are the mutable modular line accepted by ADR 0043: every module
  carries a synchronized `-dev` `owl:versionInfo`, and a development line is
  never an immutable release.
- Each frozen `<version>/` directory is immutable; the one named by
  `void.ttl`'s `dcat:version` is the current citable whole-set release.

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
|-- 0.1.0/ ... <version>/  Immutable whole-set snapshots, one per release
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

Releases through `0.12.0` were a flat eight-file whole-set distribution. From
`0.13.0` the suite is an acyclic Kernel/Core/Core Plus architecture with optional
concern and bridge modules and an explicit Full compatibility profile.
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
does not make the mutable development sources a citable release.

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

The source manifest, generators, and mirrored w3id rules encode this behavior.
A development line's catalogs, profile routes, and schema PID stay staged until
the generated Pages artifacts are deployed and the perma-id update is merged and
verified.

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

Every `EvidenceAssessmentClaim` requires a label and description, exactly one
subject, tier, direction, proposition and modification date, at least one
qualified basis, and an accountable IRI-valued agent. Each basis records its
sensory modality, modality applicability, study model, synthesis type,
intervention and observed result on separate axes. A bibliographic basis is
mirrored by `citesReference`; review state comes from immutable
`EvidenceReviewDecision` records rather than the deprecated mutable status and
modality-tag fields.

Public preset copy still uses the legacy C0-C5 claim-level scheme as a
provisional reject-only compatibility control. SHACL can reject an excessive or
medical/condition level, but passing that check does not authorize publication.
Exact-expression authorization and a BSC Lab surface policy remain proposed in
[ADR 0028](../../docs/decisions/0028-atomic-claim-propositions-and-public-expressions.md)
and [ADR 0029](../../docs/decisions/0029-bsc-lab-public-claim-publication-profile.md).

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
   runtime/publication mappings, source checksums, and the rule that no
   property carries a divided `rdfs:domain` or `rdfs:range` — several such
   statements intersect rather than union, and redistribution puts a property's
   declaration and its domain in different modules by design;
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
5. normalized Full-union equivalence against the frozen pre-modular baseline
   (`BASELINE` in `scripts/check-sstim-full-equivalence.py`), plus ROBOT with
   HermiT over the merged OWL module set;
6. named-graph SPARQL competency queries through Comunica; and
7. graph-isomorphic JSON-LD and RDF/XML export round trips for every
   manifest-owned Turtle source; and
8. the w3id route contract: the generated snapshot-route region matches the
   frozen directories on disk, and every `/ontology/` redirect target is an
   artifact this repository publishes — a committed file, a manifest-declared
   export serialization, or a namespace document.

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

0. Before any of this, run `make release-dryrun` — it is part of `make validate`,
   so it should already be green. It rehearses the next release against the
   current sources: prepares the manifest in memory, checks it against its own
   contract and its published JSON Schema, and generates the snapshot routes the
   release would need. Cutting `0.13.0` was blocked three times by gates that had
   been wrong for weeks and could only be found by pretending to release; this is
   what pretends, continuously.
1. Develop in top-level modules with a `-dev` `owl:versionInfo`, no
   `owl:versionIRI`, and `mod:status "under development"` in the core. The
   quality audit enforces that all modules carry the same version and that a
   `-dev` line never claims released status.
2. Run the complete validation suite and review semantic diffs.
3. Add the release's own `skos:historyNote` to the Kernel — `"vX.Y.Z (date): …"@en`
   — saying what changed and why. It is frozen with the snapshot, so it cannot be
   added afterwards; `release-prepare` refuses to run without it, because the two
   releases before this rule both shipped without one and nothing else noticed.
   Then run `node scripts/release-prepare.mjs X.Y.Z --date YYYY-MM-DD`, which does
   the rest of this step, step 4, and step 5: the release version in **every
   manifest-owned module and profile entry point**, the `owl:versionIRI` and
   `mod:status "released"` in the root Kernel, the frozen import and artifact
   IRIs on every profile, the manifest's immutable release URLs, and the four
   documents that describe the release — the changelog section, `CITATION.cff`,
   the entrance metadata, and `void.ttl`'s version and counts. Those four were
   hand edits for 0.14.0 and each was caught by a gate failing afterwards rather
   than by being done. Pass the same date to `make snapshot` below: it defaults
   to today and refuses a module set dated otherwise. What it deliberately does
   not touch is prose — `truth-audit` still catches a `TODO.md` line naming the
   previous release as current, and a script should not guess at wording. Populate every profile's
   positive, out-of-scope, and adversarial fixture sets and at least one
   competency query. Every listed contract path must already name an existing
   repository file. Bump **`dct:issued`** and `dct:modified` to the release
   date; leave `dct:created` alone. `dct:issued` is the RDF statement of the
   version's formal release date. BioPortal's current implementation instead
   populates its **Released** field by checking `dct:created` before
   `dct:issued`, so SSTIM keeps the
   truthful 2026-04-12 creation date in the graph and, prospectively, corrects
   BioPortal's per-submission field after a stable release is ingested. See the
   measured behavior and numbered post-deploy procedure in
   [`REGISTRY_SUBMISSIONS.md`](../../docs/ontology/REGISTRY_SUBMISSIONS.md#bioportal--ready-now-account-created-rfabbri).
   After release preparation and checksum synchronization, run
   `make validate-release-source`. Do **not** substitute `make validate` here:
   `void.ttl` now selects a snapshot that deliberately does not exist until step
   6, so snapshot-dependent gates cannot run yet. Commit the validated prepared
   sources before creating that snapshot.
4. Give every snapshotted module and profile its exact immutable
   `publication.versionedUrl`; add the manifest's immutable base, manifest, and
   schema URLs; point the released `$schema` at the frozen schema sibling; and
   change every profile `owl:imports` list to the exact versioned sibling files
   in its declared closure. Change each profile's specification, constraints,
   and manifest `prof:hasArtifact` values to those immutable artifacts too.
   Release preparation must do this before hashing; the snapshot command does
   not rewrite imports or discovery metadata.
5. Update `void.ttl` to describe the release being cut. Bumping `dcat:version`
   is what makes the quality audit demand the rest: it counts `void:triples`,
   `void:classes`, and `void:properties` against the frozen directory that
   version names, and requires a `void:subset` per frozen module whose
   distribution actually names that module's file. Moving from a flat
   distribution to a modular one therefore fails the audit until every new module
   has a subset. Also move each module distribution's `dcat:accessURL`
   onto that module's own retrieval endpoint — the Kernel is `/sstim/kernel`
   and Exposure is `/sstim/module/exposure`, because `/sstim` and
   `/sstim/exposure` return multi-module namespace catalogues; the audit cannot
   check this for you while `dcat:version` still names a pre-modular release.
6. Commit, then run `make snapshot VERSION=X.Y.Z`; the command refuses dirty
   or unverifiable sources, a checksum-registered snapshot, dev/prerelease
   versions, diverging module versions, mutable profile imports/discovery
   artifacts, missing contract files, and missing release metadata. Snapshot
   creation fails if checksum-ledger registration fails
   (`scripts/snapshot-ontology.test.mjs` covers these refusals).
7. `make snapshot` also freezes one namespace catalogue per manifest namespace
   document, built by concatenating the modules it was just given. This is what
   `https://w3id.org/sstim/X.Y.Z` — the declared `owl:versionIRI` — resolves to,
   because `sstim-core.ttl` is the Kernel rather than the release. Nothing to do
   by hand, but do not delete these files: the route generator refuses to emit
   the bare-version route for a snapshot that lacks `sstim-namespace.ttl`.
8. Freeze the generated BioPortal distribution too. Run the explicit
   `make bioportal-bundle-candidate` target against the new snapshot. It verifies
   the ordered source-closure digest and an OWL-aware source/bundle delta before
   printing the candidate artifact SHA-256, canonical graph SHA-256, byte count,
   and triple count. Append that new record to
   `scripts/bioportal-release-integrity.json`, then run
   `make bioportal-ledger-check`, `make bioportal-reproducible`, and the final
   `make validate`. Existing
   release entries are immutable:
   changing one would authorize different bytes under the same released version.
   Commit the new entry with the snapshot before tagging. The exact commands and
   review rules are in
   [`scripts/BIOPORTAL_RELEASE_INTEGRITY.md`](../../scripts/BIOPORTAL_RELEASE_INTEGRITY.md).
   This generated-distribution ledger is separate from
   `static/ontology/snapshot-checksums.json`, which protects the frozen source
   files themselves.
9. **Nothing to do for w3id routes.** Since
   [ADR 0053](../../docs/decisions/0053-wildcard-snapshot-routes.md) the
   snapshot region is four patterns covering every version, so a new release
   acquires its persistent routes without an edit here or a pull request against
   `perma-id/w3id.org`. `make w3id-routes` (part of `make validate`) still runs,
   and now proves the claim by executing the committed rules against every file
   in every frozen snapshot rather than by regenerating their text. If it fails
   after a release, the snapshot is missing an artifact the routes promise —
   most likely `sstim-namespace.ttl`, which the version IRI resolves to.
10. Audit the entire tagged repository state—not only
   `static/ontology/<version>/`—and confirm that it contains no private ledger
   and no real live-only ecosystem records.
11. Tag and publish the GitHub release. **This no longer archives anything by
    itself.** Zenodo's GitHub integration is disconnected from both repositories
    on purpose: the webhook binds deposits to one repository, the repository
    moved to `w3c-cg/sstim`, and two connected repositories would mint two DOI
    series for one artifact. Deposit over the API instead:

    ```bash
    make zenodo-deposit VERSION=X.Y.Z                      # dry run, always first
    ZENODO_TOKEN=... make zenodo-deposit VERSION=X.Y.Z PUBLISH=1
    ```

    The script deposits a new version into the existing record, so the concept
    DOI keeps naming one continuous series whatever repository the tag came
    from. Its preflight refuses a missing tag, a dirty tree, or a version the
    record already publishes; the archive is built from the tag rather than the
    working tree. Do not re-enable the webhook on either repository.
12. Carry the resulting version DOI into the three files that name it —
    `void.ttl`, `CITATION.cff` and `src/ui/entrance/releaseMetadata.js` — and run
    `make truth-audit`, which fails until all three agree. Never rewrite a
    published snapshot to add it.
13. **Reopen the mutable line the same day:**
    `node scripts/release-open-dev.mjs X.Y+1.0-dev`, then sync checksums and
    validate. Until this runs, the live sources claim `mod:status "released"` at
    the version just frozen, so the next ontology edit silently makes a released
    line differ from the snapshot carrying its name — the 0.8.0–0.10.0 defect the
    2026-07-24 audit found. Every gate passes in that state, because the line is
    internally consistent and merely mislabelled. `void.ttl`, `CITATION.cff` and
    the entrance metadata stay on the released version by design: they describe
    the latest immutable release, not the development line.

A development manifest intentionally carries no immutable release URLs, which is
what makes a `-dev` line noncitable even when its module and publication
mechanics are complete. All four profiles carry a conformance contract executed
against their own closures by `make core-profile-contract`: a positive fixture
and a SPARQL competency query each, plus out-of-scope and adversarial fixtures
for the three profiles that select a shape package. Kernel selects none, so it
declares neither negative category
([ADR 0045](../../docs/decisions/0045-shapeless-profiles-are-discovery-entry-points.md)).

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

To cite a specific release, use [`CITATION.cff`](../../CITATION.cff) — it names
the current immutable version and its version DOI, GitHub renders it as *Cite
this repository*, and `make truth-audit` keeps it agreeing with `void.ttl`.

To cite SSTIM across all releases, use the concept DOI
[10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
