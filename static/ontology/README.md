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

- Latest immutable release: `v0.8.0`, version IRI
  `https://w3id.org/sstim/0.8.0`. The release-specific Zenodo DOI is added
  after automatic archival.
- All-version DOI:
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- Live sources: the validated `0.8.0` release sources; core claims the whole-set
  `owl:versionIRI` and every public module carries synchronized
  `owl:versionInfo`.
- Current term-graph counts are checked by `scripts/sstim-quality-audit.py` and
  published in `void.ttl` rather than duplicated here.
- Public instance and synthetic-fixture graph counts are published in
  `void.ttl` and verified by the quality audit rather than duplicated here.
- Persistent namespace: `https://w3id.org/sstim`.
- License: CC BY 4.0.

The frozen [`0.8.0/`](0.8.0) directory is immutable and is the current citable
whole-set release.

## Files

```text
static/ontology/
|-- sstim-core.ttl          OWL domain model and core constraints
|-- sstim-vocab.ttl         Multilingual SKOS controlled values
|-- sstim-shapes.ttl        SHACL Core and SHACL-SPARQL shapes
|-- sstim-ecosystem-private-shapes.ttl  Separate access-controlled audit profile (rules only)
|-- sstim-alignments.ttl    Verified Wikidata and OBO alignments
|-- sstim-patch-studio.ttl  Voice and authoring parameter properties
|-- sstim-exposure.ttl      Delivery, perception, device, safety, and experiment model
|-- sstim-ecosystem.ttl     Ecosystem agents, relationships, and consent lifecycle
|-- context.jsonld          Public JSON-LD compaction context
|-- void.ttl                VoID/DCAT publication metadata and checked counts
|-- 0.1.0/ ... 0.8.0/      Immutable whole-set snapshots
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

All seven term/public-shape modules plus the separate private-audit shape file
declare an `owl:Ontology` node with title,
description, creator, creation/modification dates, license, and version
metadata. Modules carry `owl:versionInfo` only. The core receives a version IRI
only when the whole set is frozen for release; see
[ADR 0020](../../docs/decisions/0020-whole-set-snapshot-versioning.md).

## Namespaces

| Prefix | IRI | Purpose |
|---|---|---|
| `sstim:` | `https://w3id.org/sstim#` | Core classes and properties |
| `sstim-v:` | `https://w3id.org/sstim/vocab#` | Controlled SKOS values |
| `sstim-sh:` | `https://w3id.org/sstim/shapes#` | SHACL shapes |
| `sstim-ex:` | `https://w3id.org/sstim/exposure#` | Exposure and experiment terms |
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

1. pySHACL over core, vocabulary, exposure, all seven merged modules, and all
   public instances;
2. the isolated ecosystem contract: JSON-LD graph isomorphism, 34 adversarial
   public SHACL overlays, six file-profile leakage overlays, six private-ledger
   adversarial cases, a self-publication positive scenario, complete-history
   mirroring and private-terminal deletion proofs, exact qualified
   bindings, and runtime named-graph isolation;
3. `scripts/sstim-quality-audit.py` for module/context/loader completeness,
   SKOS integrity, functional values, local IRI resolution, evidence provenance,
   ecosystem namespace ownership, VoID counts, and competency thresholds;
4. ROBOT with HermiT over the merged OWL module set;
5. named-graph SPARQL competency queries through Comunica;
6. graph-isomorphic JSON-LD and RDF/XML export round trips for every module.

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

The runtime loader assigns these graph families:

```text
https://w3id.org/sstim/graph/core
https://w3id.org/sstim/graph/vocab
https://w3id.org/sstim/graph/shapes
https://w3id.org/sstim/graph/alignments
https://w3id.org/sstim/graph/patch-studio
https://w3id.org/sstim/graph/exposure
https://w3id.org/sstim/graph/ecosystem
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

`src/rdf/loader.js` is an explicit browser manifest. Adding an instance file
without adding it to that manifest fails the quality audit.

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

SSTIM versions the seven modules as one citable set:

1. Develop in top-level modules with a `-dev` `owl:versionInfo`, no
   `owl:versionIRI`, and `mod:status "under development"` in the core. The
   quality audit enforces that all modules carry the same version and that a
   `-dev` line never claims released status.
2. Run the complete validation suite and review semantic diffs.
3. Set the release version in **every** module, and the `owl:versionIRI` and
   `mod:status "released"` in the core.
4. Commit, then run `make snapshot VERSION=X.Y.Z`; the command refuses dirty
   sources, an existing snapshot, dev/prerelease versions, diverging module
   versions, and missing release metadata
   (`scripts/snapshot-ontology.test.mjs` covers these refusals).
5. Audit the entire tagged repository state—not only
   `static/ontology/<version>/`—and confirm that it contains no private ledger
   and no real live-only ecosystem records.
6. Tag and publish the GitHub release so Zenodo archives the same commit.
7. Add the resulting version DOI without rewriting a published snapshot.

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

Use SSTIM `v0.8.0` for the current immutable citation. Until the automatic
Zenodo archive supplies its version DOI, the stable release identifier is
`https://w3id.org/sstim/0.8.0`:

```bibtex
@misc{fabbri_sstim_2026,
  author    = {Fabbri, Renato},
  title     = {BSC Lab - Sensory Stimulation Ontology (SSTIM) and open stimulation platform},
  year      = {2026},
  publisher = {Zenodo},
  url       = {https://w3id.org/sstim/0.8.0}
}
```

For SSTIM across all releases, use the concept DOI
[10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
