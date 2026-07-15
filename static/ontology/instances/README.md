# BSC Lab Public SSTIM Instance Data

This directory contains public RDF data that exercises the reusable SSTIM
ontology. It is implementation data, not ontology term space, and is therefore
not copied into immutable ontology snapshots.

That snapshot exclusion is not, by itself, a DOI-archive exclusion. The
GitHub–Zenodo release deposit contains the repository state at its release tag.
Accordingly, committed ecosystem records in this directory are synthetic only.
Future real records in the default live-only tier must be served from the
external mutable store required by ADRs 0024 and 0031; they must not be committed
here.

Public BSC Lab resources use
`https://w3id.org/sstim/implementation/bsclab/...`. Reusable references use
`https://w3id.org/sstim/ref/...`; BSC framework resources use
`https://w3id.org/sstim/framework/...`. Ecosystem organizations use
`https://w3id.org/sstim/organization/...`, people use
`https://w3id.org/sstim/specialist/...`; qualified relationships use
`https://w3id.org/sstim/ecosystem-record/relationship/...`, and engagement
activities use `https://w3id.org/sstim/ecosystem-record/activity/...`. The private
BioSynCare catalog and real participant records are not present.

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
| `ecosystem/fixtures/` | Synthetic people, organizations, qualified memberships, implementation responsibility, and admission-state tests |
| `ecosystem/agents/` | Reserved contract path; must remain empty of real records while this repository is Zenodo-tracked |

The ecosystem fixture currently contains three agents (one person and two
organizations), six qualified relationships (including two memberships and two
implementation-responsibility records), fourteen engagement activities, and two
ORG roles. `void.ttl` publishes and the quality audit verifies these counts.

Across the directory there are eight `EvidenceAssessmentClaim` nodes, three
`KnowledgeStatusAssertion` nodes, and seven `ExposureHypothesis` nodes. These
categories are deliberately distinct under ADR 0027. Assessments of measurable
ASSR, FFR, SSVEP, SSSEP, slow-breathing correlates, and multisensory integration
cite audited references. Exploratory exposure hypotheses stay speculative,
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
- An ecosystem agent is explicitly and exclusively a Schema.org person or
  organization; an implementation remains a distinct resource.
- Every public ecosystem relationship is a named record binding one agent,
  target, role/type, purpose, source set, curator, and review date. Organization
  memberships reuse `org:Membership`; implementation responsibility uses a
  separate qualified relationship. Targets are public-web IRIs, never contact,
  file, or private identifier schemes.
- Every public relationship ends in a final approval by its curator. A person
  self-publishes or has an earlier scoped consent grant. Negative, amendment,
  removal, and withdrawal activities belong only to the append-only private
  audit; contact channels, correspondence, and raw consent evidence stay there.
  That complete private history also mirrors every public activity's core event
  fields and each admitted relationship claim, retains a complete relationship
  snapshot after retraction, and is
  supplied from outside the repository to the real admission gate.
- The committed ecosystem data is synthetic contract-test data. Real named
  records are added only after ADR 0031 plus Workstream 5's stable-release and
  live-dereferencing gates.

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
ecosystem/fixtures/ https://w3id.org/sstim/graph/ecosystem-fixture
ecosystem/agents/   https://w3id.org/sstim/graph/ecosystem-agents (reserved contract graph; no committed real data)
```

The browser cannot enumerate static directories, so the loader manifest is
explicit. `scripts/sstim-quality-audit.py` fails if a committed Turtle file is
missing from the manifest, appears in the wrong real/fixture graph family, is
omitted from its VoID dump inventory, or the manifest points to a missing file.

Run `make validate` from the repository root after any change. See the
[ontology guide](../README.md) for modeling, evidence, versioning, and
publication rules. Changes to the ecosystem family must also pass
`make ecosystem-contract`; the canonical `make validate` target and CI both run
that contract. The current command validates the committed synthetic profile
and proves that a private ledger must be supplied from outside the repository.
Before F4, the publication plumbing must be extended so an access-limited job
can validate a real candidate from the external mutable store together with
`PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl`, without committing either
artifact here.
