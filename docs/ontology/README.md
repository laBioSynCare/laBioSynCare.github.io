# Ontology and Vocabulary Notes

This directory documents the semantic-web artifacts associated with the proposed Sensory Stimulation Vocabulary Community Group.

## Initial Namespace

```text
https://w3id.org/sstim/
```

## Initial Prefix

```text
sstim
```

## Intended Artifact Types

The vocabulary effort may include:

- RDF vocabularies;
- OWL ontology modules;
- SKOS concept schemes;
- SHACL validation profiles;
- JSON-LD contexts;
- examples in Turtle, RDF/XML, JSON-LD, and compact JSON where useful;
- mappings to existing vocabularies.

## BSC Lab Role

BSC Lab should act as both:

1. **Navigation and annotation interface**
   A public interface for browsing, annotating, reviewing, and discussing the `sstim` vocabulary and ontology.

2. **Reference implementation**
   A working implementation environment for sensory stimulation techniques and protocols described through `sstim`.

The reference implementation should help test whether vocabulary terms are usable in real software and hardware contexts, including session generation, stimulus parameters, device constraints, safety metadata, evidence annotations, and user-facing workflows.

## Candidate Modules

Candidate modules include:

```text
sstim-core
sstim-vocab
sstim-shapes
sstim-alignments
sstim-examples
```

## Candidate Top-Level Concepts

Candidate top-level concepts include:

- Sensory stimulation session
- Stimulus
- Modality
- Auditory stimulus
- Visual stimulus
- Haptic stimulus
- Respiratory guidance
- Multimodal stimulus
- Temporal pattern
- Frequency band
- Entrainment target
- Parameter set
- Protocol
- Device context
- Device capability
- External protocol
- Safety caution
- Evidence annotation
- Evidence strength
- Claim strength
- Intended use
- Study metadata
- Research population
- Dataset
- Provenance
- Institutional communication context

## Validation

SHACL profiles should be used to validate concrete data structures such as session descriptors, dataset annotations, safety metadata, and implementation examples.

## Maturity and Improvement Plan

[`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md) is the canonical backlog for
ontology maturity work after SSTIM `0.3.0`. It records known gaps, the priority
order for validation/modeling work, and the next major design improvement:
separating physical delivery from perceived sensory modality. Internal
modeling/validation maturity (P0–P4) plus domain content coverage (P5) live here.

## Sensory-Taxonomy Review

[`SENSORY_TAXONOMY_REVIEW.md`](SENSORY_TAXONOMY_REVIEW.md) is a critical
evaluation of an external "more than five senses" taxonomy proposal against
SSTIM's actual state. It maps the proposal onto the existing exposure module,
rejects its new-OWL-class approach (per ADR 0015), and distils the genuine gaps
(chemesthesis, thermal-as-channel, the P5.5 modality-list divergence) into a
maintainer decision set. Analysis only — no `.ttl` was changed.

## Publication and External Interlinking Plan

[`PUBLICATION_AND_INTERLINKING_PLAN.md`](PUBLICATION_AND_INTERLINKING_PLAN.md) is
the canonical strategy for making SSTIM a first-class, publicly usable, well-linked
artifact: FAIR packaging (multi-format dereferenceability, metadata, DOIs), and the
external-linkage decisions for **DBpedia (via Archivo), Wikidata, Wikimedia, OBO**,
and the public registries (LOV, prefix.cc, BARTOC, BioPortal, OLS, FAIRsharing). It
is tracked as **P6** in the improvement plan.

## Evidence and Safety Metadata

The vocabulary may describe evidence annotations and safety/caution metadata. It must not imply that a specific stimulation protocol is clinically effective merely because it can be described with the vocabulary.

## BioSynCare/BSC Lab Relationship

BioSynCare/BSC Lab may provide early implementation examples and pressure-test cases. The ontology and vocabulary should remain vendor-neutral.
