# BSC Lab Public SSTIM Instance Data

This directory contains public RDF data that exercises the reusable SSTIM
ontology. It is implementation data, not ontology term space, and is therefore
not copied into immutable ontology snapshots.

That snapshot exclusion is not, by itself, a DOI-archive exclusion. The
GitHub–Zenodo release deposit contains the repository state at its release tag.
Accordingly, committed ecosystem records in this directory are synthetic only.
Future real records in the default live-only tier must be served from the
external mutable store required by ADRs 0024 and 0031; they must not be committed
here. The separately maintained exact w3id configuration may contain admitted
real-subject IRI paths so those external records can dereference; it contains no
real instance triples, but its historical identifier traces are not erasable.

Public BSC Lab resources use
`https://w3id.org/sstim/implementation/bsclab/...`. Reusable references use
`https://w3id.org/sstim/ref/...`; BSC framework resources use
`https://w3id.org/sstim/framework/...`; the programme that produces all of them
uses `https://w3id.org/sstim/ecosystem/...`. Ecosystem organizations use
`https://w3id.org/sstim/organization/...`, people use
`https://w3id.org/sstim/specialist/...`; qualified relationships use
`https://w3id.org/sstim/ecosystem-record/relationship/...`, and engagement
activities use `https://w3id.org/sstim/ecosystem-record/activity/...`. The private
BioSynCare catalog and real participant records are not present.

## Inventory

| Directory | Contents |
|---|---|
| `programmes/` | The BioSynCare Ecosystem programme identity and its `dct:hasPart` membership ([ADR 0047](../../../docs/decisions/0047-programme-identity-path.md)). Kept out of `ecosystem/`, whose subdirectories are a reserved contract path for agent records |
| `frameworks/` | BSC framework identity and the three techniques it originated (generic techniques it applies are incorporated from the vocabulary — [ADR 0033](../../../docs/decisions/0033-framework-scope-and-generic-technique-deduplication.md)) |
| `implementations/` | Public identity records for BSC Lab, the BioSynCare application, and the Patch Studio component |
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
ORG roles. Current fixture subjects retain the IRI grammar required by the
released SHACL contract while reserving a `synthetic-*` slug excluded by live
namespace routes. They have no fixture-specific w3id.org routes. `void.ttl`
publishes and the quality audit verifies these boundaries and counts.

Across the directory there are eight `EvidenceAssessmentClaim` nodes, three
`KnowledgeStatusAssertion` nodes, and seven `ExposureHypothesis` nodes. These
categories are deliberately distinct under ADR 0027. Assessments of measurable
ASSR, FFR, SSVEP, SSSEP, slow-breathing correlates, and multisensory integration
cite audited references. Exploratory exposure hypotheses stay speculative,
inconclusive, and provisional.

## BSC catalog identities

The BSC catalog is a typed relationship graph, not a containment tree:

| Resource | Kind | Catalog relationship |
|---|---|---|
| `https://w3id.org/sstim` | ontology/vocabulary | Describes BSC and other sensory-stimulation resources; it is not a component of BSC |
| `https://w3id.org/sstim/framework/bsc` | framework | Defines the BSC-originated techniques and guidance; incorporates generic ones from the vocabulary |
| `https://w3id.org/sstim/implementation/bsclab` | reference implementation | `sstim:implementsFramework` BSC |
| `https://w3id.org/sstim/implementation/biosyncare` | commercial application implementation | `sstim:implementsFramework` BSC; distinct from any BioSynCare organization agent |
| `https://w3id.org/sstim/implementation/bsclab/component/patch-studio` | BSC Lab software component | Part of BSC Lab and implements BSC |
| `https://w3id.org/sstim/patch-studio` | ontology module | Part of SSTIM and documents Patch Studio parameters; distinct from the running component |

People and organizations connect to these resources through qualified ecosystem
relationships in the external mutable graph. They are never merged with an
implementation by `schema:sameAs` or `owl:sameAs`.

## Data Rules

- A protocol names its framework and technique, or explicitly explains why it
  is a baseline or capability-boundary protocol.
- A preset names its implementation, protocol, public claim level, and caution
  metadata.
- Every evidence assessment has one subject, tier, direction and bounded
  proposition, at least one qualified evidence basis, a responsible agent, and
  a modification date. Basis-level modality, model, design and synthesis axes
  remain separate; review state comes from immutable review decisions.
- Every bibliographic evidence basis is mirrored by a `citesReference` link to
  the declared reference. Publication clearance is a separate policy concern.
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
explicit. The real ecosystem family points to the optional external live dump
at `https://biosyncare-lab.web.app/current.ttl`; it is loaded into the distinct
ecosystem-agent named graph and is never fetched by deterministic repository
audits. `scripts/sstim-quality-audit.py` fails if a committed Turtle file is
missing from the manifest, appears in the wrong real/fixture graph family, is
omitted from its VoID dump inventory, or the manifest points to a missing file.

Run `make validate` from the repository root after any change. See the
[ontology guide](../README.md) for modeling, evidence, versioning, and
publication rules. Changes to the ecosystem family must also pass
`make ecosystem-contract`; the canonical `make validate` target and CI both run
that contract. For real admission, supply both external work files as
`PUBLIC_ECOSYSTEM=/secure/path/public.ttl` and
`PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl`. The private-first publisher
and correction/removal sequence are documented in
[`docs/ecosystem/ECOSYSTEM_OPERATIONS.md`](../../../docs/ecosystem/ECOSYSTEM_OPERATIONS.md).
Neither artifact is committed here.
