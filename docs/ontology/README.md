# Ontology Planning and Review

This directory contains design reviews and forward plans for the Sensory
Stimulation Ontology (SSTIM). The ontology sources and their technical guide
live under [`static/ontology/`](../../static/ontology/README.md).

## Current State

- Stable namespace: `https://w3id.org/sstim`
- Prefix: `sstim`
- Current citable release: `0.10.0`
- Next development line: not yet opened
- Ontology license: CC BY 4.0
- Current release DOI: `10.5281/zenodo.21528717`
- All-versions concept DOI: `10.5281/zenodo.21286974`

SSTIM is an OWL/SKOS model for sensory-stimulation techniques, delivery and
perception, protocols, presets, evidence assessments, cautions, sessions,
consent-dependent self-reports, and qualified ecosystem relationships. Its scope is research, education,
interoperability, and conservative non-clinical use. Describing a protocol or
claim does not establish efficacy.

## Live Modules

| Module | Role |
|---|---|
| [`sstim-core.ttl`](../../static/ontology/sstim-core.ttl) | Core classes, properties, evidence, safety, protocol, and session semantics |
| [`sstim-vocab.ttl`](../../static/ontology/sstim-vocab.ttl) | Multilingual SKOS controlled vocabularies |
| [`sstim-exposure.ttl`](../../static/ontology/sstim-exposure.ttl) | Physical delivery, perceived modality, device capability, placement, limits, and experiment context |
| [`sstim-patch-studio.ttl`](../../static/ontology/sstim-patch-studio.ttl) | Voice and session-authoring parameters |
| [`sstim-ecosystem.ttl`](../../static/ontology/sstim-ecosystem.ttl) | Ecosystem agents, relationships, and engagement/consent lifecycle terms |
| [`sstim-shapes.ttl`](../../static/ontology/sstim-shapes.ttl) | SHACL integrity and publication contracts |
| [`sstim-alignments.ttl`](../../static/ontology/sstim-alignments.ttl) | Verified, conservatively scoped external mappings |

Public BSC Lab implementation data is under
[`static/ontology/instances/`](../../static/ontology/instances/README.md). It
contains framework, implementation, protocol, preset, evidence, reference,
experiment, and synthetic session examples. Private BioSynCare catalog data and
real participant records are excluded.

## Planning Documents

- [Ontology Improvement Plan](IMPROVEMENT_PLAN.md): current maturity
  assessment, ordered 0.7 change sets, session/observation work, interoperability
  dependencies, release gates, and deliberate boundaries.
- [RDF knowledge-representation audit — 2026-07-13](reviews/2026-07-13-rdf-knowledge-representation-audit.md):
  OWL, SKOS, SHACL, context, instance-data, runtime-serializer, provenance, and
  privacy findings that drive the improvement plan.
- [Publication and External Interlinking Plan](PUBLICATION_AND_INTERLINKING_PLAN.md):
  WIDOCO, w3id negotiation, DOI/version policy, registry submissions, and
  conservative Wikidata/biomedical mapping policy.
- [Sensory Taxonomy Review](SENSORY_TAXONOMY_REVIEW.md): assessment of a proposed
  expanded-senses taxonomy against SSTIM's modeling boundaries.
- [External automated review - 2026-07-10](reviews/2026-07-10-external-automated-review.md):
  OOPS/FOOPS results, authoritative identifier and safety-source checks, and
  accepted/rejected finding dispositions. The maintainer accepted `0.6.0`;
  `0.7.0`, `0.9.0`, and `0.10.0` subsequently passed the expanded automated OWL, SHACL,
  quality, round-trip, runtime, and build gates. Independent human review
  remains desirable and is not claimed. The post-0.6 canonical FOOPS rerun
  scores 87.5%.
- [Raw maintainer notes](raw-notes/): provenance for design questions; these are
  inputs to review, not normative ontology definitions.

Architecture decisions are recorded separately in
[`docs/decisions/`](../decisions/README.md). ADR 0021 documents the current
controlled-value semantics; ADR 0020 defines whole-set release versioning.

## Quality Gates

From the repository root:

```bash
nix develop
make validate
make test
make check
make build
make export
```

`make validate` runs SHACL against individual and merged modules plus all public
instances, HermiT consistency reasoning, repository-wide quality checks,
SPARQL competency queries, and graph-isomorphic JSON-LD/RDF/XML round trips.
`make export` writes those verified serializations from the Turtle masters.
The 2026-07-13 audit additionally requires per-runtime-artifact validation;
that gate is planned and must not be implied by the current static suite.

## Change Rules

- Turtle is the editable source of truth.
- Existing public IRIs remain stable; semantic replacements use deprecation and
  migration metadata.
- Frozen directories under `static/ontology/<version>/` are immutable.
- Semantic changes require an ADR when they affect inference,
  interoperability, evidence legality, or migration.
- External mappings require authoritative identifier and scope verification.
- Evidence and safety language remains qualified and non-clinical.
