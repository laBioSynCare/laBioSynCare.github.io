# BSC Ontology

> **For AI agents:** Read this document before writing any code that
> imports from `src/rdf/namespaces.js`, generates SPARQL queries, creates
> RDF instances, or modifies any `*.ttl` file. The design decisions here
> are fixed — they are not defaults open to re-interpretation.
> The four Turtle files in this directory are in `CLAUDE.md`'s protected
> list: modify them only with explicit human instruction.

---

## What this is

The BSC ontology is a formal knowledge representation of the Sensory
Stimulation domain: its techniques, protocols, evidence claims, frequency
band taxonomy, session specifications, and participants. It is the
knowledge layer of BSC Lab — the part that makes the preset catalog
machine-readable, queryable, citable, and interoperable with external
biomedical vocabularies.

The ontology is published at `https://w3id.org/sstim` under CC BY 4.0.
BSC product instances (presets, sessions, annotations) use the separate
product namespace `https://w3id.org/bsc/`.
It is designed to be used by:

- The BSC Lab RDF browser and SPARQL interface (knowledge navigation)
- The preset export pipeline (JSON generation from RDF source)
- Researchers who want to cite or extend the vocabulary
- The W3C Community Group (when formed) for standardization discussion
- External tools that want to consume BSC preset metadata as Linked Data

---

## File inventory

```
ontology/
├── sstim-core.ttl        OWL class hierarchy, properties, axioms
├── sstim-vocab.ttl       SKOS vocabulary (multilingual concepts)
├── sstim-shapes.ttl      SHACL validation shapes
├── sstim-alignments.ttl  External alignments (Wikidata, OBO Foundry)
└── instances/
    ├── presets/        One .ttl file per preset group
    └── references/     Bibliographic reference instances
```

### `sstim-core.ttl` — OWL class hierarchy and properties

Contains OWL class declarations, object properties, datatype
properties, domain/range axioms, and top-level individuals that
serve as controlled vocabulary anchors. Imports BFO and declares
`rdfs:subClassOf` alignments to OBI, IAO, and PATO.

### `sstim-vocab.ttl` — SKOS multilingual vocabulary

Contains all SKOS concept schemes and their members: frequency
bands, evidence tier values, preset groups, sensory modalities,
stimulation mechanisms, and permutation function types. Concepts
carry labels in English, Italian, Portuguese, and Spanish.
Uses dual-typing (see Section 4).

### `sstim-shapes.ttl` — SHACL validation shapes

Defines `sh:NodeShape` shapes for each key class. Used to validate
preset instances, evidence claims, and session instances before
export. Run via pySHACL or rdf-validate-shacl (browser).

### `sstim-alignments.ttl` — External vocabulary links

Contains `skos:exactMatch`, `skos:closeMatch`, `owl:equivalentClass`,
and `skos:relatedMatch` statements to:
- Wikidata entities (`wd:` prefix)
- OBO Foundry terms (NBO, OMIT, NCIT as applicable)
- DBpedia resources

---

## Namespace declarations

All code that references BSC ontology terms must import namespaces
from `src/rdf/namespaces.js`. Never hardcode IRI strings.

```turtle
# Canonical prefix declarations — mirror src/rdf/namespaces.js exactly

@prefix sstim:    <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix sstim-sh:   <https://w3id.org/sstim/shapes#> .
@prefix bsc-inst: <https://w3id.org/bsc/preset/> .

# Upper ontology
@prefix bfo:      <http://purl.obolibrary.org/obo/BFO_> .
@prefix obi:      <http://purl.obolibrary.org/obo/OBI_> .
@prefix iao:      <http://purl.obolibrary.org/obo/IAO_> .
@prefix pato:     <http://purl.obolibrary.org/obo/PATO_> .
@prefix eco:      <http://purl.obolibrary.org/obo/ECO_> .

# W3C vocabularies
@prefix owl:      <http://www.w3.org/2002/07/owl#> .
@prefix rdf:      <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .
@prefix skos:     <http://www.w3.org/2004/02/skos/core#> .
@prefix sh:       <http://www.w3.org/ns/shacl#> .
@prefix prov:     <http://www.w3.org/ns/prov#> .
@prefix dct:      <http://purl.org/dc/terms/> .

# External
@prefix wd:       <http://www.wikidata.org/entity/> .
@prefix wdt:      <http://www.wikidata.org/prop/direct/> .
```

Two persistent namespaces are registered at
[perma-id/w3id.org](https://github.com/perma-id/w3id.org):

- `https://w3id.org/sstim` — the ontology (classes, properties, SKOS
  vocabulary, SHACL shapes). Content-negotiated to Turtle or WIDOCO HTML.
- `https://w3id.org/bsc/{preset,session,annotation,evidence}/...` —
  BSC product instance data.

Content negotiation rules live in the respective `sstim/` and `bsc/` folders
of that repository (see Section 10).

---

## Design decision: OWL + SKOS dual-typing (Pattern 2)

**Decision:** SKOS concepts are dual-typed as OWL named individuals.
No OWL punning. No Linked Data Platform trick of making an IRI serve
as both an OWL class and a SKOS concept.

This is the most important design decision in the ontology and the
one most likely to be misread. The full rationale follows.

### The problem: three incompatible approaches

**Pattern 1 — Pure OWL with no SKOS.** Frequency bands are OWL
classes; `sstim:alpha rdfs:subClassOf sstim:FrequencyBand`. Hierarchy
is expressed through subclass relationships. SPARQL traversal requires
recursion (`rdfs:subClassOf*`) which is not supported in all SPARQL
1.1 implementations without property paths.

**Problem with Pattern 1:** SPARQL property paths over
`rdfs:subClassOf*` are slow on large ontologies. More importantly,
the resulting individuals would be class instances, making them
harder to attach SKOS labels and scope notes without importing SKOS
and using annotation properties in a non-standard way.

**Pattern 2 (CHOSEN) — Dual-typed individuals.** OWL defines a class
(`sstim:FrequencyBand`). SKOS defines concepts in a scheme. Each concept
is both: it is a `skos:Concept` AND an instance (`owl:NamedIndividual`)
of the OWL class. Hierarchy is expressed through `skos:narrower` /
`skos:broader`. SPARQL traversal uses property paths:
`skos:narrower*` or `skos:broader*`.

**Pattern 3 — SKOS only, no OWL.** Pure SKOS ConceptScheme.
Loses OWL reasoning, domain/range constraints, and integration
with BFO alignment.

### Why Pattern 2

Pattern 2 provides:

- **SPARQL traversal via property paths.** `skos:narrower*` is
  standard SPARQL 1.1 property path syntax. Finding all sub-bands
  of alpha is:
  ```sparql
  sstim-v:alpha skos:narrower+ ?subBand
  ```

- **OWL domain/range validation.** The property `sstim:targetsFrequencyBand`
  with `rdfs:range sstim:FrequencyBand` validates correctly because
  each concept individual is an instance of `sstim:FrequencyBand`.
  An OWL reasoner will flag triples that link a preset to a
  non-`FrequencyBand` individual.

- **SKOS multilingual labels.** `skos:prefLabel` with language tags
  provides clean multilingual support without custom annotation
  properties. Tools that understand SKOS work immediately.

- **No OWL punning.** OWL punning (declaring an IRI as both an OWL
  class and an individual of another class simultaneously) is
  permitted in OWL 2 Full but not in OWL 2 DL. Avoiding it keeps
  the ontology within OWL 2 DL and compatible with DL reasoners
  (HermiT, ELK, FaCT++).

### What dual-typing looks like in practice

```turtle
# sstim-core.ttl — OWL class declaration
sstim:FrequencyBand a owl:Class ;
    rdfs:subClassOf bfo:0000019 ;      # BFO: quality
    rdfs:label "Frequency Band"@en .

# sstim-vocab.ttl — SKOS concept, dual-typed as OWL individual
sstim-v:alpha a skos:Concept, sstim:FrequencyBand ;
    skos:inScheme sstim-v:FrequencyBandScheme ;
    skos:prefLabel "Alpha"@en, "Alfa"@it, "Alfa"@pt, "Alfa"@es ;
    skos:definition
        "Neural oscillation band spanning 8–13 Hz. BSC use: relaxation,
         stress reduction, calm alertness, acute pain support."@en ;
    skos:narrower sstim-v:low-alpha,
                  sstim-v:high-alpha,
                  sstim-v:alpha-10 ;
    sstim:minHz 8.0 ;
    sstim:maxHz 13.0 ;
    sstim:platformDeliverable true .
```

**The class `sstim:FrequencyBand` is NOT punned.** There is no statement
making `sstim:FrequencyBand` also a `skos:Concept`. It is a pure OWL
class. The punning-free rule holds.

### SPARQL consequence

Sub-band traversal via property path:

```sparql
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>

# All bands that are sub-bands of 'alpha' (excluding alpha itself)
SELECT ?band WHERE {
  sstim-v:alpha skos:narrower+ ?band .
}

# Alpha and all its sub-bands (including alpha itself)
SELECT ?band WHERE {
  sstim-v:alpha skos:narrower* ?band .
}
```

**Important:** `skos:narrower` is NOT transitive in OWL / in
the standard SKOS specification. Only `skos:narrowerTransitive`
is declared transitive. The property path `skos:narrower+`
is the correct SPARQL idiom for hierarchical traversal — it
explicitly traverses links at any depth rather than relying
on OWL transitivity inference.

---

## Upper ontology alignment: BFO 2020

The BSC ontology aligns to **Basic Formal Ontology 2020**
(ISO/IEC 21838-2:2021, `http://purl.obolibrary.org/obo/bfo.owl`).
BFO provides a domain-neutral upper ontology used by over 650
biomedical ontologies in the OBO Foundry ecosystem.

### BSC class placements in BFO

| BSC class | BFO parent | Rationale |
|---|---|---|
| `sstim:SensoryStimulation` | `bfo:0000015` (process) | A Sensory Stimulation session is a process unfolding in time |
| `sstim:SensoryStimulationIntervention` | `obi:0000070` (planned process) | An intervention is a planned, goal-directed process |
| `sstim:SensoryStimulationTechnique` | `obi:0000272` (protocol) | A reusable method specification |
| `sstim:SensoryStimulus` | `bfo:0000015` (process) | The stimulus is a physical process (sound wave, light pattern) |
| `sstim:SessionInstance` | `bfo:0000015` (process) | A particular session execution |
| `sstim:SessionSpecification` | `iao:0000104` (plan specification) | An information artifact specifying an intended process |
| `sstim:Preset` | `iao:0000104` (plan specification) | A reusable session design specification |
| `sstim:FrequencyBand` | `bfo:0000019` (quality) | A quality of neural activity, not a material entity |
| `sstim:EvidenceClaim` | `iao:0000030` (information content entity) | A claim is an information entity |
| `sstim:EvidenceTierValue` | `bfo:0000019` (quality) | A quality of the evidence relationship |
| `sstim:SensoryModality` | `bfo:0000031` (generically dependent continuant) | A modality is a kind of process, not a quality |
| `sstim:StimulationMechanism` | `bfo:0000015` (process) | A mechanism is a type of causal process |

### OBO Foundry imports

The BSC ontology does not fully import OBO Foundry ontologies
(which would cause import of tens of thousands of terms). Instead,
it uses selected terms by their stable OBO IRIs with explicit
`rdfs:subClassOf` declarations:

```turtle
# sstim-core.ttl excerpt — OBI alignment
sstim:SensoryStimulationIntervention rdfs:subClassOf obi:0000070 .
# obi:0000070 = 'planned process' in OBI

# IAO alignment
sstim:Preset rdfs:subClassOf iao:0000104 .
# iao:0000104 = 'plan specification' in IAO

# PATO alignment (for quality subclasses)
sstim:FrequencyBand rdfs:subClassOf pato:0000001 .
# pato:0000001 = 'quality' in PATO

# ECO alignment (for evidence classification)
sstim:EvidenceClaim rdfs:subClassOf iao:0000030 .
# iao:0000030 = 'information content entity' in IAO
```

This approach provides semantic alignment and OBO interoperability
without bloating the ontology with unused terms.

---

## SKOS concept scheme structure

### `sstim-v:FrequencyBandScheme`

The primary controlled vocabulary. All values valid in
`header.targetBand` in preset JSON correspond to SKOS concepts
in this scheme. The mapping between JSON string values (e.g., `"alpha"`)
and ontology IRIs (e.g., `sstim-v:alpha`) is maintained in
`src/rdf/namespaces.js`.

Hierarchy (top-level concepts with narrower shown as indented):

```
sstim-v:delta (0.5–4 Hz)
  sstim-v:low-delta  (0.5–2 Hz)
  sstim-v:high-delta (2–4 Hz)
sstim-v:theta (4–8 Hz)
  sstim-v:low-theta  (4–6 Hz)
  sstim-v:high-theta (6–8 Hz)
sstim-v:alpha (8–13 Hz)
  sstim-v:low-alpha  (8–10 Hz)
  sstim-v:high-alpha (10–13 Hz)
  sstim-v:alpha-10   (10 Hz)    ← single-frequency target
sstim-v:smr (12–15 Hz)
sstim-v:beta (15–30 Hz)
  sstim-v:low-beta   (15–20 Hz)
  sstim-v:mid-beta   (20–25 Hz)
  sstim-v:high-beta  (25–30 Hz)
sstim-v:gamma (30–42 Hz)
  sstim-v:gamma-40   (40 Hz)    ← single-frequency target
```

Note: `smr` (12–15 Hz) is a BSC operational category and overlaps
the alpha/beta boundary. It does not have `skos:broader alpha` or
`skos:broader beta` because it is not cleanly a sub-band of either.
It is a top-level concept in the BSC scheme. This is an intentional
representation of the BSC operational taxonomy, not an error.

### Other concept schemes in `sstim-vocab.ttl`

- `sstim-v:EvidenceTierScheme` — the six evidence tiers
  (from `docs/concept/EVIDENCE_FRAMEWORK.md`)
- `sstim-v:PresetGroupScheme` — Heal, Support, Perform, Indulge, Transcend
- `sstim-v:SensoryModalityScheme` — auditory, visual, somatosensory,
  interoceptive, vestibular, olfactory
- `sstim-v:StimulationMechanismScheme` — the six proposed mechanisms
- `sstim-v:PermutationFunctionScheme` — identity, rotateForward,
  rotateBackward, reversal, shuffle
- `sstim-v:EvidenceModalityScheme` — AUD, AV, BREATH, GENERAL,
  PRECLINICAL, REVIEW tags

---

## Key properties

### Object properties (sstim-core.ttl)

| Property | Domain | Range | Description |
|---|---|---|---|
| `sstim:targetsFrequencyBand` | Preset | FrequencyBand | Links a preset to its target frequency band(s) |
| `sstim:evidenceTier` | EvidenceClaim | EvidenceTierValue | Evidence strength grade |
| `sstim:hasModalityTag` | EvidenceClaim | EvidenceModalityTag | Type of supporting evidence |
| `sstim:inGroup` | Preset | PresetGroup | Preset's group classification |
| `sstim:hasCautionTag` | Preset | CautionTag | Safety and usage flags |
| `sstim:hasVoice` | Preset | Voice | Links preset to its voice components |
| `sstim:usesStimulationMechanism` | SensoryStimulationTechnique | StimulationMechanism | Proposed mechanism |
| `sstim:supportsEffect` | StimulationMechanism | IntendedEffect | Effect a mechanism may produce |
| `sstim:executedPreset` | SessionInstance | Preset | Which preset was run |
| `sstim:usesSpecification` | SessionInstance | SessionSpecification | The full execution spec |
| `sstim:referencesPreset` | SessionSpecification | Preset | Preset referenced by spec |

### Datatype properties (sstim-core.ttl)

| Property | Domain | Range | Description |
|---|---|---|---|
| `sstim:minHz` | FrequencyBand | xsd:decimal | Lower bound of band (Hz) |
| `sstim:maxHz` | FrequencyBand | xsd:decimal | Upper bound of band (Hz) |
| `sstim:platformDeliverable` | SensoryModality | xsd:boolean | Deliverable via standard digital platforms |
| `sstim:tierRank` | EvidenceTierValue | xsd:integer | Ordinal rank (1=speculative, 6=established) |
| `sstim:targetHz` | Voice | xsd:decimal | The Hz value being driven (if isochronic) |
| `sstim:beatHz` | Voice | xsd:decimal | Binaural beat frequency |
| `sstim:durationSeconds` | SessionSpecification | xsd:decimal | Intended session length |

---

## SHACL validation

`sstim-shapes.ttl` contains validation constraints that enforce:

- Every `sstim:Preset` individual has exactly one `sstim:inGroup` link
  pointing to a valid PresetGroup concept
- Every `sstim:Preset` individual has at least one `sstim:targetsFrequencyBand`
  link pointing to a concept in `sstim-v:FrequencyBandScheme`
- Every `sstim:Voice` individual has exactly one `rdf:type` from the
  permitted voice type class hierarchy
- Every `sstim:EvidenceClaim` individual has exactly one `sstim:evidenceTier`
  link pointing to a concept in `sstim-v:EvidenceTierScheme`
- `sstim:tierRank` values are integers in the range 1–6
- Multilingual labels: every concept in the frequency band scheme
  has exactly one `skos:prefLabel` in each of en, it, pt, es
- `sstim:minHz` ≤ `sstim:maxHz` for frequency band individuals

**Running validation locally:**

```bash
# Validate core ontology
python -m pyshacl \
  -s ontology/sstim-shapes.ttl \
  -d ontology/sstim-core.ttl \
  --inference rdfs \
  --format turtle

# Validate vocabulary
python -m pyshacl \
  -s ontology/sstim-shapes.ttl \
  -d ontology/sstim-vocab.ttl

# Validate all preset instances
python -m pyshacl \
  -s ontology/sstim-shapes.ttl \
  -d ontology/instances/presets/ \
  --format turtle
```

The CI pipeline (`github/workflows/validate-rdf.yml`) runs these on
every PR that touches any `.ttl` file. PRs that fail SHACL validation
are not merged.

**Running validation in the browser (BSC Lab):**

```javascript
import { validate } from '../src/rdf/validate.js'
// validate() uses rdf-validate-shacl
const report = await validate(dataStore, shapesStore)
console.log(report.conforms)           // true if valid
console.log(report.results)            // array of violations
```

---

## Named graphs architecture

The default graph contains only authoritative ontology data from
the four core TTL files. User-contributed annotations and session
data live in named graphs:

```turtle
# Default graph: authoritative ontology (bsc-core + bsc-vocab + instances)
# Never write user data here

# Named graph for user annotations on ontology node X:
<https://w3id.org/bsc/annotations/{userId}>
# Contains: skos:note, prov:wasAttributedTo, schema:comment triples

# Named graph for session instances:
<https://w3id.org/bsc/sessions/{userId}>
# Contains: sstim:SessionInstance individuals

# Named graph for research evidence annotations:
<https://w3id.org/bsc/evidence/annotations>
# Contains: disputed tier assignments, proposed corrections
```

This separation is enforced in `src/rdf/annotations/AnnotationStore.js`.
The `rdf-validate-shacl` library operates only on the default graph;
annotation graphs are excluded from validation.

---

## RDF format and serialization

**Master format:** Turtle (`.ttl`). All ontology files are written
in Turtle. Turtle is human-readable, diff-friendly, and is the format
in which all editing and review occurs.

**Export format:** JSON-LD (`.jsonld`). Generated from Turtle for
API consumers and for inclusion in HTML pages as `<script type="application/ld+json">`.
JSON-LD is never the master — never edit exported JSON-LD and
import it back.

**Loading strategy (BSC Lab):** Option B — runtime HTTP fetch of TTL
files. The application fetches and parses the TTL files at runtime
using N3.js. This allows the ontology to be updated without
redeploying the application, and allows researchers to point the
browser at any version of the ontology.

---

## Versioning

The ontology uses `owl:versionIRI` for immutable version snapshots:

```turtle
# In sstim-core.ttl header
<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionIRI <https://w3id.org/sstim/0.1.0> ;
    owl:versionInfo "0.1.0" ;
    dct:modified "2026-04-12"^^xsd:date .
```

Version IRIs point to immutable snapshots hosted on GitHub Pages:
`https://w3id.org/sstim/0.1.0/sstim-core.ttl`

**Versioning policy:**
- **Patch (0.1.x):** Adds new instances, corrects labels, adds
  SKOS scope notes. Does not add or remove classes or properties.
- **Minor (0.x.0):** Adds new classes, properties, or concept
  scheme entries. Does not change existing IRIs or remove terms.
  Backward-compatible.
- **Major (x.0.0):** Breaking changes — IRI changes, class
  hierarchy restructuring, removal of terms. Requires migration
  guide and a deprecation period.

Terms are never deleted from the ontology — only deprecated
using `owl:deprecated true` with a forwarding `rdfs:seeAlso`
pointing to the replacement.

---

## Content negotiation

The persistent URI `https://w3id.org/sstim` delivers different
representations based on the HTTP `Accept` header. This is configured
in the `.htaccess` file at
[perma-id/w3id.org/sstim/.htaccess](https://github.com/perma-id/w3id.org):

```
# Accept: text/turtle → raw TTL (GitHub raw)
RewriteCond %{HTTP_ACCEPT} text/turtle
RewriteRule ^$ https://raw.githubusercontent.com/.../sstim-core.ttl [R=303,L]

# Accept: application/rdf+xml → GitHub raw (RDF/XML export)
RewriteCond %{HTTP_ACCEPT} application/rdf+xml
RewriteRule ^$ https://raw.githubusercontent.com/.../sstim-core.rdf [R=303,L]

# Accept: application/ld+json → JSON-LD (CDN or GitHub raw)
RewriteCond %{HTTP_ACCEPT} application/ld+json
RewriteRule ^$ https://raw.githubusercontent.com/.../sstim-core.jsonld [R=303,L]

# Default (browsers, curl without Accept) → WIDOCO HTML docs
RewriteRule ^$ https://bsc-lab.github.io/bsc-lab/ontology/ [R=303,L]
```

A parallel `.htaccess` at `perma-id/w3id.org/bsc/` routes the product
instance namespace (`https://w3id.org/bsc/preset/...`, `/session/...`,
`/annotation/...`, `/evidence/...`).

Full content negotiation includes sub-paths:
- `https://w3id.org/sstim#alpha` → term documentation
- `https://w3id.org/sstim/vocab#alpha` → SKOS concept documentation

---

## How to extend the ontology

**To add a new frequency band sub-concept:**

1. Add the concept to `sstim-vocab.ttl` following the dual-typing pattern:

```turtle
sstim-v:mid-alpha a skos:Concept, sstim:FrequencyBand ;
    skos:inScheme sstim-v:FrequencyBandScheme ;
    skos:prefLabel "Mid-Alpha"@en, "Alfa Medio"@it,
                   "Alfa Médio"@pt, "Alfa Medio"@es ;
    skos:broader sstim-v:alpha ;
    skos:definition
        "Alpha sub-band 9–11 Hz, sometimes used for targeted
         alpha-10 designs with slightly broader tolerances."@en ;
    sstim:minHz 9.0 ;
    sstim:maxHz 11.0 ;
    sstim:platformDeliverable true .
```

2. Add the inverse `skos:narrower` link to `sstim-v:alpha`:

```turtle
sstim-v:alpha skos:narrower sstim-v:mid-alpha .
```

3. Add the new value to `src/rdf/namespaces.js` in the
   `FREQUENCY_BAND_VALUES` map.

4. Run SHACL validation. Commit only if it passes.

5. Update `docs/concept/SENSORY_HARNESSING.md` and the BSC
   Reference Agent document to reference the new band.

**To add a new OWL class:**

1. Place it in `sstim-core.ttl` with a BFO parent.
2. Add SHACL shape to `sstim-shapes.ttl`.
3. Add SPARQL query template to `src/rdf/query.js`.
4. Open a GitHub Issue to track the addition and its rationale.

**Do not:**
- Add class `rdfs:subClassOf` relationships to OBO Foundry classes
  not already used in `sstim-core.ttl` without opening an issue
  for discussion — new imports affect reasoning complexity.
- Add `skos:exactMatch` to external vocabularies without verifying
  the definition alignment — inexact matches should use
  `skos:closeMatch` or `skos:relatedMatch`.
- Rename existing IRIs — this is a breaking change requiring
  a major version bump and deprecation process.

---

## Querying the ontology

The BSC Lab SPARQL interface uses Comunica over the N3.js in-memory
store. All queries should use the prefix declarations from
`src/rdf/namespaces.js`. Representative query patterns:

```sparql
# All presets targeting the alpha band or any of its sub-bands
PREFIX bsc:      <https://w3id.org/sstim#>
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?preset ?label WHERE {
  ?band skos:broader* sstim-v:alpha .
  ?preset sstim:targetsFrequencyBand ?band ;
          rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}

# All presets with evidence tier 'moderate' or better
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>

SELECT ?preset ?tier WHERE {
  ?preset sstim:evidenceTier ?tier .
  ?tier sstim:tierRank ?rank .
  FILTER(?rank >= 4)
}
ORDER BY DESC(?rank)

# Presets with breathing guide in the Heal group
SELECT ?preset WHERE {
  ?preset sstim:inGroup sstim-v:Heal ;
          sstim:hasBreathGuide true .
}
```

---

## Citation

If you use the BSC ontology in a research paper or software system,
please cite:

```bibtex
@misc{bsc_ontology_2026,
  author    = {Fabbri, Renato},
  title     = {{BSC} Ontology: A Knowledge Representation for Sensory Stimulation},
  year      = {2026},
  url       = {https://w3id.org/sstim},
  note      = {CC BY 4.0}
}
```

---

## Contact and contribution

- GitHub Issues for bug reports, correction proposals, and scope discussions
- GitHub Discussions for broader design and vocabulary questions
- BSC Lab annotation interface for inline comments on specific ontology nodes
- Email: renato.fabbri@gmail.com

Ontology changes that affect the controlled vocabulary used in BioSynCare
preset descriptions require coordination with the BioSynCare repository
(see `CONTRIBUTING.md`).

---

*Version: 0.1.0 (April 2026)*  
*Maintained by: Renato Fabbri*  
*License: CC BY 4.0*  
*Namespace (ontology): `https://w3id.org/sstim`*  
*Namespace (BSC instances): `https://w3id.org/bsc/`*
