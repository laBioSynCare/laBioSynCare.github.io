# ADR 0001 — SSTIM-Scoped Instance Paths

**Status:** Accepted — 2026-04; amended — 2026-04-25

## Context

BSC Lab's RDF data combines two categorically different things:

- **Reusable scientific artifacts.** OWL classes, object and datatype
  properties, SKOS controlled vocabularies, SHACL shapes. These describe the
  domain of sensory stimulation and are intended to be usable by other
  projects (academic groups, third-party applications, W3C community work).

- **Product and implementation data.** Preset instances, session records, user
  annotations, evidence chain nodes, software implementations, hardware
  systems, organizations, and specialists using or extending the SSTIM model.

A flat namespace would conflate these. Anyone reusing the ontology would
inherit BSC's preset IRIs; anyone adding another software or hardware
implementation would have no clear path for their own instances. A second
top-level `w3id.org/bsc` namespace would solve the separation problem but
requires another w3id approval and fragments SSTIM-linked data.

## Decision

One persistent namespace, with scoped paths:

- `https://w3id.org/sstim` (`/sstim#`, `/sstim/vocab#`, `/sstim/shapes#`,
  future `/sstim/track#`, `/sstim/outcome#`, etc.) — the **ontology**: OWL
  classes and properties, SKOS vocabulary concepts, SHACL shapes. Citable
  scientific artifact. Every `.ttl` file in `static/ontology/` declares its
  prefixes here.

- `https://w3id.org/sstim/framework/bsc` — the **BSC framework**: the family of
  techniques, protocols, evidence rules, grouping logic, and design principles
  that BioSynCare and BSC Lab implement.

- `https://w3id.org/sstim/implementation/{id}/...` — **implementation-scoped
  data**: presets, session records, annotations, evidence chain nodes, and
  implementation metadata. BioSynCare and BSC Lab are separate
  implementations, not the same thing.

Reserve sibling paths for future contributors:

- `https://w3id.org/sstim/implementation/{id}/...`
- `https://w3id.org/sstim/technique/{id}`
- `https://w3id.org/sstim/protocol/{id}`
- `https://w3id.org/sstim/framework/{id}`
- `https://w3id.org/sstim/organization/{id}/...`
- `https://w3id.org/sstim/specialist/{id}/...`

Never publish a BSC preset or session directly under the reusable ontology
term space (`sstim#`, `sstim/vocab#`, `sstim/shapes#`). Never declare an OWL
class or SKOS concept under an implementation path.

## Alternatives considered

- **Single namespace.** Conflates reusable science with product catalog;
  makes the ontology unusable by other projects without inheriting BSC data.

- **Separate top-level `https://w3id.org/bsc` namespace.** Keeps BSC data
  separate, but requires a second w3id namespace and does not naturally group
  other SSTIM-related software, hardware, organizations, or specialists.

- **Per-module roots (`bsc/sstim/preset`).** Leaks the ontology/instance
  distinction into every module boundary; no clear cut between what is
  BSC-specific and what is reusable.

- **Reverse convention (`bsc` for ontology, `sstim` for instances).**
  Ontology term is more generic (`sstim` = sensory stimulation); product
  term is branded (`bsc`). Using the specific name for the specific thing
  is cleaner.

## Consequences

- `w3id.org/sstim` remains the only required w3id namespace for Phase 1.
- BSC framework IRIs, BioSynCare implementation IRIs, and BSC Lab
  implementation IRIs are distinct.
- Future SSTIM-aligned implementations, companies, specialists, techniques,
  protocols, and frameworks have obvious scoped paths without new top-level
  namespace PRs.
- New ontology modules use `sstim/<module>#` (see ADR 0003).
- New BioSynCare instance types use
  `sstim/implementation/biosyncare/<type>/` subpaths.
- New BSC Lab instance types use `sstim/implementation/bsclab/<type>/`
  subpaths.
- When uncertain whether something new belongs in the reusable ontology term
  space or a scoped data path, ask "would another project reasonably want to
  reuse this as a concept or property?" If yes, use the ontology term space. If
  no, use a scoped data path.

## See also

- [`CLAUDE.md` §5.1](../../CLAUDE.md) — namespace convention enforcement rule.
- [`README.md`](../../README.md) — namespace convention in project overview.
- [`static/ontology/README.md`](../../static/ontology/README.md) — ontology
  design rationale.
- [0007](0007-framework-protocol-implementation.md) — framework, technique,
  protocol, implementation, preset, and session distinctions.
