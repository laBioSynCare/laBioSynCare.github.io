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

- Latest immutable release: `v0.5.0`, DOI
  [10.5281/zenodo.21286975](https://doi.org/10.5281/zenodo.21286975).
- All-version DOI:
  [10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974).
- Live sources: `0.6.0-dev`; no development module claims an immutable
  `owl:versionIRI`.
- Current term graph: 5,820 unique triples, 56 named OWL classes, six anonymous
  union-class expressions, 124 properties, 295 SKOS concepts, and 30 concept
  schemes.
- Public instance graph: 1,394 unique triples in 18 files.
- Persistent namespace: `https://w3id.org/sstim`.
- License: CC BY 4.0.

The frozen [`0.5.0/`](0.5.0) directory is immutable. It remains the citable
release while the top-level modules evolve toward the next release.

## Files

```text
static/ontology/
|-- sstim-core.ttl          OWL domain model and core constraints
|-- sstim-vocab.ttl         Multilingual SKOS controlled values
|-- sstim-shapes.ttl        SHACL Core and SHACL-SPARQL shapes
|-- sstim-alignments.ttl    Verified Wikidata and OBO alignments
|-- sstim-patch-studio.ttl  Voice and authoring parameter properties
|-- sstim-exposure.ttl      Delivery, perception, device, safety, and experiment model
|-- context.jsonld          Public JSON-LD compaction context
|-- void.ttl                VoID/DCAT publication metadata and checked counts
|-- 0.1.0/ ... 0.5.0/      Immutable whole-set snapshots
`-- instances/
    |-- frameworks/         BSC framework and framework techniques
    |-- implementations/    BSC Lab and public-safe BioSynCare identities
    |-- protocols/          Public BSC Lab reference protocols
    |-- presets/            Public reference preset fixtures
    |-- evidence/           Technique and preset evidence claims
    |-- references/         DOI-identified public-safe references
    |-- experiments/        Exploratory exposure protocols and profiles
    `-- sessions/           Explicitly synthetic session fixture only
```

All six `sstim-*.ttl` files declare an `owl:Ontology` node with title,
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
| `bsc-fw-tech:` | `https://w3id.org/sstim/framework/bsc/technique/` | BSC framework techniques |
| `bsclab-protocol:` | `https://w3id.org/sstim/implementation/bsclab/protocol/` | Public BSC Lab protocols |
| `bsclab-preset:` | `https://w3id.org/sstim/implementation/bsclab/preset/` | Public BSC Lab presets |
| `bsclab-evidence:` | `https://w3id.org/sstim/implementation/bsclab/evidence/` | BSC Lab editorial claims |
| `bsclab-session:` | `https://w3id.org/sstim/implementation/bsclab/session/` | Session data |
| `sstim-ref:` | `https://w3id.org/sstim/ref/` | Reusable public references |

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
| controlled-value classes | IAO information content entity |

SSTIM references selected OBO IRIs instead of importing entire external
ontologies. Alignments are conservative. The 0.6 audit removed obsolete
`obi:0000011` from live axioms and rejected OBI protocol as an over-specific
parent for a technique category. In addition, no MeSH mapping is asserted for
a supposed `D012910` Sensory Stimulation term: that identifier is Snake Venoms.
See the [external review disposition](../../docs/ontology/reviews/2026-07-10-external-automated-review.md).

## Evidence Governance

Evidence attaches to a scoped claim, never globally to "sensory stimulation":

```turtle
bsclab-evidence:ssvep-photic-response a sstim:EvidenceClaim ;
    sstim:supportsRelation sstim-v:techPhoticDriving ;
    sstim:hasEvidenceTier sstim-v:tierStrong ;
    sstim:hasModalityTag sstim-v:modalityVIS, sstim-v:modalityREVIEW ;
    sstim:hasClaimDirection sstim-v:claimSupports ;
    sstim:citesReference sstim-ref:VIALATTE_2010 ;
    sstim:hasReviewStatus sstim-v:reviewReviewed ;
    sstim:evidenceDate "2026-07-10"^^xsd:date ;
    dct:modified "2026-07-10"^^xsd:date ;
    prov:wasAttributedTo <https://orcid.org/0000-0002-9699-629X> .
```

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

1. pySHACL over core, vocabulary, exposure, all six merged modules, and all
   public instances;
2. `scripts/sstim-quality-audit.py` for module/context/loader completeness,
   SKOS integrity, functional values, local IRI resolution, evidence provenance,
   VoID counts, and competency thresholds;
3. ROBOT with HermiT over the merged OWL module set;
4. named-graph SPARQL competency queries through Comunica;
5. graph-isomorphic JSON-LD and RDF/XML export round trips for every module.

Useful narrower targets:

```bash
make shacl
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
https://w3id.org/sstim/graph/frameworks
https://w3id.org/sstim/graph/implementations
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
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

# Presets targeting alpha or a narrower alpha band.
SELECT DISTINCT ?preset ?band WHERE {
  ?band skos:broader* sstim-v:alpha .
  ?preset a sstim:Preset ; sstim:targetsFrequencyBand ?band .
}

# Fully attributable cited evidence trails.
SELECT ?claim ?subject ?tier ?reference ?agent WHERE {
  ?claim a sstim:EvidenceClaim ;
    sstim:supportsRelation ?subject ;
    sstim:hasEvidenceTier ?tier ;
    sstim:citesReference ?reference ;
    <http://www.w3.org/ns/prov#wasAttributedTo> ?agent .
}

# Framework -> protocol -> preset chain.
SELECT ?framework ?protocol ?preset WHERE {
  ?protocol sstim:definedByFramework ?framework .
  ?preset sstim:followsProtocol ?protocol .
}
```

## Versioning And Publication

SSTIM versions the six modules as one citable set:

1. Develop in top-level modules with a `-dev` `owl:versionInfo` and no
   `owl:versionIRI`.
2. Run the complete validation suite and review semantic diffs.
3. Set the release version and core `owl:versionIRI`.
4. Commit, then run `make snapshot VERSION=X.Y.Z`; the command refuses dirty
   sources and refuses to overwrite an existing snapshot.
5. Tag and publish the GitHub release so Zenodo archives the same commit.
6. Add the resulting version DOI without rewriting a published snapshot.

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

Use SSTIM `v0.5.0` for the current immutable citation:

```bibtex
@misc{fabbri_sstim_2026,
  author    = {Fabbri, Renato},
  title     = {BSC Lab - Sensory Stimulation Ontology (SSTIM) and open stimulation platform},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.21286975},
  url       = {https://doi.org/10.5281/zenodo.21286975}
}
```

For SSTIM across all releases, use the concept DOI
[10.5281/zenodo.21286974](https://doi.org/10.5281/zenodo.21286974). Do not cite
`0.6.0-dev` as immutable.
