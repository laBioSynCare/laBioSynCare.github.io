# ADR 0002 — Dual-typing of SKOS concepts and OWL classes (Pattern 2)

**Status:** Accepted — 2026-04

## Context

Every term in the BSC controlled vocabulary (frequency bands, preset groups,
evidence tiers, sensory modalities, stimulation mechanisms, voice/track types,
caution tags) needs to serve two roles at once:

1. **Be a node in a navigable taxonomy.** Users browse `skos:narrower`/
   `skos:broader` trees; UI components render SKOS schemes as hierarchies.

2. **Be a typed, validatable individual.** A frequency band like
   `sstim-v:alpha` must carry `hzMin=8`, `hzMax=13`; SHACL must be able to
   validate these datatype properties per individual.

Three standard patterns for SKOS–OWL integration exist:

- **Pattern 1.** SKOS-only, untyped concepts. Concepts carry `skos:notation`
  and labels but are not OWL individuals; SHACL cannot validate them beyond
  SKOS's own schema.
- **Pattern 2.** Dual-typing: each concept is simultaneously a `skos:Concept`
  and an `owl:NamedIndividual` typed by its OWL class.
- **Pattern 3.** Two IRIs per concept (one as SKOS concept, one as OWL
  individual), linked by `owl:sameAs`.

## Decision

Use Pattern 2. Each vocabulary term in `sstim-vocab.ttl` declares three types:

```turtle
sstim-v:alpha a owl:NamedIndividual, sstim:FrequencyBand, skos:Concept ;
    skos:prefLabel "Alpha"@en ;
    skos:notation "alpha" ;
    skos:broader sstim-v:allFrequencyBands ;
    sstim:hzMin "8"^^xsd:decimal ;
    sstim:hzMax "13"^^xsd:decimal .
```

`sstim-v:alpha` is simultaneously:
- A `skos:Concept` in `sstim-v:FrequencyBandScheme`, with siblings and
  children via `skos:broader`/`skos:narrower`.
- An instance of `sstim:FrequencyBand` (an OWL class defined in
  `sstim-core.ttl`), with required datatype properties validated by
  `sstim-sh:FrequencyBandShape`.
- An `owl:NamedIndividual`, making the OWL class assertion explicit and
  DL-compatible.

## Alternatives considered

- **Pattern 1 (SKOS-only).** Rejected. Loses SHACL validation on vocabulary
  terms. `sstim:hzMin` cannot have a meaningful `rdfs:domain` if the subject
  carries no OWL class.

- **Pattern 3 (`owl:sameAs`).** Rejected. Doubles storage per concept,
  splits queries (some subjects use the SKOS IRI, some the OWL individual
  IRI), and `owl:sameAs` in the browser via Comunica introduces inference
  overhead. The only gain is formal cleanliness — OWL DL purists prefer it
  — and that gain does not justify the cost.

## Consequences

- SHACL shapes in `sstim-shapes.ttl` target OWL classes and validate the
  SKOS concepts directly (see `sstim-sh:FrequencyBandShape`).
- SPARQL queries navigate either view without distinction: `skos:narrower*`
  for taxonomy, `rdf:type` for class membership.
- The ontology browser's OWL↔SKOS "bridge" edges (`instanceOf` in
  `src/rdf/graph.js`) are a direct rendering of this pattern: each SKOS
  concept node has an `rdf:type` edge to its OWL class node.
- **Constraint for contributors and AI agents:** do not "simplify" a
  vocabulary term by removing either type. Removing `skos:Concept` breaks
  taxonomy navigation; removing the OWL class breaks SHACL validation.
  Enforced in `CLAUDE.md` §5.2.
- **Not all OWL classes are dual-typed.** Classes with many instances and
  no taxonomic role (`sstim:Preset`, `sstim:SessionInstance`,
  `sstim:EvidenceClaim`) remain pure OWL classes; their instances live in
  implementation-scoped SSTIM paths and are not SKOS concepts.

## See also

- [`static/ontology/README.md`](../../static/ontology/README.md) — original
  design discussion.
- [`CLAUDE.md` §5.2](../../CLAUDE.md) — dual-typing enforcement rule.
