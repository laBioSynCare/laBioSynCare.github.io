# Ontology Planning and Review

This directory contains design reviews and forward plans for the Sensory
Stimulation Ontology (SSTIM). The ontology sources and their technical guide
live under [`static/ontology/`](../../static/ontology/README.md).

## Current State

- Stable namespace: `https://w3id.org/sstim`
- Prefix: `sstim`
- Current citable release: `0.12.0`
- Live development line: `0.13.0-dev` modular preview; mutable and not citable
- Ontology license: CC BY 4.0
- Current release DOI: `10.5281/zenodo.21717988`
- All-versions concept DOI: `10.5281/zenodo.21286974`

SSTIM is an OWL/SKOS model for sensory-stimulation techniques, delivery and
perception, protocols, presets, evidence assessments, cautions, sessions,
consent-dependent self-reports, and qualified ecosystem relationships. Its scope is research, education,
interoperability, and conservative non-clinical use. Describing a protocol or
claim does not establish efficacy.

## Live Architecture

The `0.13.0-dev` source set is defined by the machine-readable
[`manifest.json`](../../static/ontology/manifest.json), not by the former
eight-file list. It records the exact module dependency DAG, runtime graph and
publication mappings, checksums, and profile closures.

| Profile | Semantic closure | Shapes |
|---|---|---|
| [Kernel](../../static/ontology/sstim-kernel-profile.ttl) | Root process anchor only | None published |
| [Core](../../static/ontology/sstim-core-profile.ttl) | Kernel + stimulus description | [Core shapes](../../static/ontology/sstim-core-shapes.ttl) |
| [Core Plus](../../static/ontology/sstim-core-plus-profile.ttl) | Core + reusable Common descriptors | Core shapes; Common-specific shapes deferred |
| [Full](../../static/ontology/sstim-full-profile.ttl) | Every concern, bridge, vocabulary, alignment, ecosystem, and Patch Studio module | [Full shapes](../../static/ontology/sstim-shapes.ttl) |

The exact module table, direct and transitive dependencies, adoption examples,
shape-selection rules, named-graph behavior, and compatibility contract are in
the [module architecture guide](MODULE_ARCHITECTURE.md). The immutable
[`0.12.0`](../../static/ontology/0.12.0/) directory remains the latest released
eight-file distribution.

Public BSC Lab implementation data is under
[`static/ontology/instances/`](../../static/ontology/instances/README.md). It
contains framework, implementation, protocol, preset, evidence, reference,
experiment, and synthetic session examples. Private BioSynCare catalog data and
real participant records are excluded.

## Planning Documents

- [SSTIM core and module boundary audit — 2026-08-01](reviews/2026-08-01-sstim-core-and-module-boundary-audit.md):
  quantitative growth, actual cross-module dependencies, reuse assessment,
  candidate Core Profile, and staged extraction gates. Its architecture is
  accepted in [ADR 0043](../decisions/0043-sstim-core-profile-and-module-boundaries.md).
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

`make validate` runs profile-aware SHACL plus all public instances, HermiT
consistency reasoning, manifest and repository-wide quality checks, SPARQL
competency queries, normalized `0.12.0`-to-Full redistribution equivalence, and
graph-isomorphic JSON-LD/RDF/XML round trips.
`make export` writes those verified serializations from the Turtle masters.
Concern-specific SHACL packages beyond Core remain deferred; a green Full
validation must not be described as independent conformance for those concerns.

### Release gate (`make snapshot`)

`scripts/snapshot-ontology.mjs` refuses to freeze a snapshot unless the whole
manifest-owned module set is coherent. Cutting a release therefore means
updating every manifest-owned module and profile entry point, synchronizing
manifest checksums, and then running `make snapshot`:

| Property | Rule |
|---|---|
| `owl:versionInfo` | the new version, identical across all manifest-owned modules and profile entry points |
| `owl:versionIRI` | `https://w3id.org/sstim/<version>` (core only, ADR 0020) |
| `mod:status` | `"released"` (core only) |
| **`dct:issued`** | **the release date — bump it every release** |
| **`dct:modified`** | the release date (the whole set is re-issued together) |
| `dct:created` | unchanged; the module's original creation date |

The date rules exist because `dct:issued` is what registries read as the
version's release date — it is BioPortal's **Released** column, and Archivo and
OLS use it the same way. Leaving it at the ontology's first issue date makes
every published version look like it shipped that day, which is what happened to
SSTIM submissions 1–8 on BioPortal (all showed `2026-04-12`; corrected by hand
2026-07-27). `dct:created` is the property that legitimately stays fixed.

The gate dates a release **today** by default; pass
`make snapshot RELEASE_DATE=YYYY-MM-DD` when the headers were prepared on an
earlier day. Unit coverage: `scripts/snapshot-ontology.test.mjs`.

## Change Rules

- Turtle is the editable source of truth.
- Existing public IRIs remain stable; semantic replacements use deprecation and
  migration metadata.
- Frozen directories under `static/ontology/<version>/` are immutable.
- Semantic changes require an ADR when they affect inference,
  interoperability, evidence legality, or migration.
- External mappings require authoritative identifier and scope verification.
- Evidence and safety language remains qualified and non-clinical.
