# BSC Lab Public SSTIM Instance Data

This directory contains public RDF data that exercises the reusable SSTIM
ontology. It is implementation data, not ontology term space, and is therefore
not copied into immutable ontology snapshots.

Public BSC Lab resources use
`https://w3id.org/sstim/implementation/bsclab/...`. Reusable references use
`https://w3id.org/sstim/ref/...`; BSC framework resources use
`https://w3id.org/sstim/framework/...`. The private BioSynCare catalog and real
participant records are not present.

## Inventory

| Directory | Contents |
|---|---|
| `frameworks/` | BSC framework identity and seven framework techniques |
| `implementations/` | Public identity records for BSC Lab and BioSynCare |
| `protocols/` | Two narrow, non-clinical BSC Lab reference protocols |
| `presets/` | Two public reference preset fixtures |
| `evidence/` | Scoped technique-level evidence assessments |
| `references/` | Seven DOI-identified public-safe bibliographic records |
| `experiments/` | Ten exploratory protocols, exposure profiles, channels, and qualified claims |
| `sessions/` | One explicitly synthetic, non-personal session fixture with pre/post reports |

Across the directory there are 38 `EvidenceClaim` nodes. Claims about measurable
ASSR, FFR, SSVEP, SSSEP, slow-breathing correlates, and multisensory integration
cite audited references. Exploratory exposure claims stay speculative,
inconclusive, and provisional.

## Data Rules

- A protocol names its framework and technique, or explicitly explains why it
  is a baseline or capability-boundary protocol.
- A preset names its implementation, protocol, public claim level, and caution
  metadata.
- Every evidence claim has a tier, modality, direction, review state/date,
  responsible agent, and modification date.
- Claims at preliminary tier or stronger cite a declared public-safe reference.
- A session specification is an immutable plan; a session instance records one
  execution.
- Multiple phase-qualified self-reports are separate nodes. They are not
  overwritten and are not treated as efficacy evidence.
- The committed session and report values are clearly marked synthetic.

## Runtime Graphs

`src/rdf/loader.js` assigns each family to a named graph:

```text
frameworks/       https://w3id.org/sstim/graph/frameworks
implementations/  https://w3id.org/sstim/graph/implementations
protocols/        https://w3id.org/sstim/implementation/bsclab/protocol/
presets/          https://w3id.org/sstim/implementation/bsclab/preset/
evidence/         https://w3id.org/sstim/implementation/bsclab/evidence/
experiments/      https://w3id.org/sstim/implementation/bsclab/experiment/
references/       https://w3id.org/sstim/ref/
sessions/         https://w3id.org/sstim/implementation/bsclab/session/
```

The browser cannot enumerate static directories, so the loader manifest is
explicit. `scripts/sstim-quality-audit.py` fails if a committed Turtle file is
missing from the manifest or the manifest points to a missing file.

Run `make validate` from the repository root after any change. See the
[ontology guide](../README.md) for modeling, evidence, versioning, and
publication rules.
