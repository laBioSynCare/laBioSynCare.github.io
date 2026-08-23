# ADR 0047 — Programme identity: `/sstim/ecosystem/{id}`

**Status:** Accepted — 2026-08-10

## Context

[ADR 0007](0007-framework-protocol-implementation.md) fixed six modelling layers
— technique, protocol, framework, implementation, preset, session — and a
canonical path for each. Nothing in that list names the *effort that produces
them*. In practice one does exist and is now published: the ecosystem brief at
`https://labiosyncare.github.io/docs/BioSynCare_Ecosystem_Brief_EN.pdf`
describes "The BioSynCare Ecosystem" as a connected pathway from SSTIM (open
formalized knowledge) through BSC Lab and Patch Studio (open technology) to the
BioSynCare application (everyday delivery), with the W3C Sensory Stimulation
Vocabulary Community Group alongside it.

Two forcing functions made the missing node concrete. Junto Innovation Hub's
relationship record targeted `implementation/biosyncare` — the commercial app —
which understated a hub relationship that the brief scopes to the whole
programme. And the live ledger carried four `aeterni-develops-*` records with no
counterpart for SSTIM itself, because there was no node that made "the effort
behind SSTIM" expressible without saying "BSC Lab owns SSTIM".

Renaming the BSC framework to "BSC Ecosystem" was considered and rejected:
`framework/bsc` is a `sstim:SensoryStimulationFramework` that `definesTechnique`
three originated techniques, is the object of `implementsFramework` from three
implementations and `definedByFramework` from ten experiments and both reference
protocols, and is frozen under that label in every `0.x.x` snapshot.

## Decision

Add one canonical path to ADR 0007's list:

- `https://w3id.org/sstim/ecosystem/{id}` — a **programme**: the coordinated
  effort under which frameworks, ontologies, and implementations are produced.

The first and currently only member is
`https://w3id.org/sstim/ecosystem/biosyncare`, typed `schema:Project` and
`prov:Collection`. No new SSTIM class is minted; a programme is an
organizational fact, not a sensory-stimulation modelling layer, and inventing
`sstim:Programme` would put project structure into a vocabulary that other
implementers import.

Three commitments constrain what the node may say.

**`dct:hasPart` means production membership, not term scope.** SSTIM's
vocabulary stays broader than BSC, and BSC stays one framework inside SSTIM
([ADR 0033](0033-framework-scope-and-generic-technique-deduplication.md)).
Membership is asserted in one direction only — from the programme outward. No
component carries a `dct:isPartOf` back-link, so no ontology header states that
SSTIM belongs to a commercially named programme.

**The W3C Community Group is never a part.** It is an independent forum with its
own participants and IPR terms. Its relationship to SSTIM stays in the live
projection as a `standardsBody` record that already disclaims W3C endorsement.

**The programme is not the application.** `ecosystem/biosyncare` and
`implementation/biosyncare` are different resources with the same brand name,
and both descriptions must say so. A third BioSynCare-named node — the
startup-identity organization — was retired from the live projection on
2026-07-20 for the same overloading reason.

## Alternatives considered

- **`/sstim/programme/{id}` or `/sstim/initiative/{id}`.** Zero collisions,
  rejected because the published name of the thing is "ecosystem", and the
  registry already reads `/sstim/ecosystem-record/{kind}/{id}` for the
  relationship records about this same subject matter. Three `ecosystem` senses
  now coexist and are disambiguated in `src/rdf/namespaces.js`, the prefix table
  in `src/rdf/README.md`, and the `.htaccess` block comment: the OWL module is
  the hash namespace `…/ecosystem#` matched exactly as `^ecosystem$`, programme
  instances are `…/ecosystem/{id}`, and live records are
  `…/ecosystem-record/{kind}/{id}`. This mirrors the standing Patch Studio
  precedent, where the `/sstim/patch-studio` ontology module and the
  `implementation/bsclab/component/patch-studio` software component deliberately
  share a name.
- **Mint the node outside w3id, on `biosyncare.com`.** Rejected: identifier
  persistence would depend on a commercial domain, and the graph browser's
  routes and prefix table are built around `w3id.org/sstim`. Path segments carry
  no mereology anyway — `implementation/biosyncare` already sits under `/sstim`
  without being part of SSTIM.
- **Keep the node in the mutable live projection.** Rejected: relationship
  records belong there, but the programme is the *target* those records point
  at, and the established pattern is that targets are defined in the citable
  catalog while relationships live in the ledger.

## Consequences

- The catalog route audit is fail-closed and exact, so the node required
  matching entries in `scripts/sstim-quality-audit.py`, the w3id `.htaccess`
  content-negotiation block, and `scripts/w3id-negotiation.test.mjs`, which now
  pins that `/sstim/ecosystem` and `/sstim/ecosystem/biosyncare` resolve to
  different documents.
- The w3id rules are staged locally until the upstream PR merges; until then the
  IRI does not dereference and must not be promoted in human-facing discovery.
- The BSC Lab about page previously described SSTIM and Patch Studio as living
  *inside* BSC Lab. That contradicted the brief, which makes SSTIM a peer
  component, and was reconciled in favour of the brief in the same change: an
  ontology presented as a component of one implementation undercuts the
  neutrality the Community Group work depends on.
- Adding a second programme is now cheap. Adding a programme that claims an
  independent organization as a part is not permitted by the first section
  above.
