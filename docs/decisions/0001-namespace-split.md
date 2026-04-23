# ADR 0001 — Two-root namespace split (`sstim` vs `bsc`)

**Status:** Accepted — 2026-04

## Context

BSC Lab's RDF data combines two categorically different things:

- **Reusable scientific artifacts.** OWL classes, object and datatype
  properties, SKOS controlled vocabularies, SHACL shapes. These describe the
  domain of sensory stimulation and are intended to be usable by other
  projects (academic groups, third-party applications, W3C community work).

- **BSC product data.** Preset instances, session records, user annotations,
  evidence chain nodes — specific to the BSC/BioSynCare catalog.

A single namespace would conflate these. Anyone reusing the ontology would
inherit BSC's preset IRIs; anyone extending BSC's catalog would have no place
to declare new ontology terms that belong to BSC specifically.

## Decision

Two persistent IRI roots, one rule each:

- `https://w3id.org/sstim` (`/sstim#`, `/sstim/vocab#`, `/sstim/shapes#`,
  future `/sstim/track#`, `/sstim/outcome#`, etc.) — the **ontology**: OWL
  classes and properties, SKOS vocabulary concepts, SHACL shapes. Citable
  scientific artifact. Every `.ttl` file in `static/ontology/` declares its
  prefixes here.

- `https://w3id.org/bsc/{preset,session,annotation,evidence}/...` — **BSC
  product instances**: preset IRIs, session records, user annotations,
  evidence chain nodes. Scoped under a product namespace so the ontology
  stays reusable.

Never publish a BSC preset or session under `sstim`; never declare an OWL
class or SKOS concept under `bsc/`.

## Alternatives considered

- **Single namespace.** Conflates reusable science with product catalog;
  makes the ontology unusable by other projects without inheriting BSC data.

- **Per-module roots (`bsc/sstim/preset`).** Leaks the ontology/instance
  distinction into every module boundary; no clear cut between what is
  BSC-specific and what is reusable.

- **Reverse convention (`bsc` for ontology, `sstim` for instances).**
  Ontology term is more generic (`sstim` = sensory stimulation); product
  term is branded (`bsc`). Using the specific name for the specific thing
  is cleaner.

## Consequences

- `w3id.org/sstim` can be registered and cited independently of BSC Lab. If
  the commercial side of BioSynCare changes hands, the ontology does not.
- BSC preset IRIs are contained; third parties using `sstim` do not inherit
  them.
- New ontology modules use `sstim/<module>#` (see ADR 0003).
- New BSC instance types use `bsc/<type>/` subpaths.
- When uncertain whether something new belongs under `sstim` or `bsc`: ask
  "would another project reasonably want to reuse this?" If yes, `sstim`.
  If no, `bsc`.

## See also

- [`CLAUDE.md` §5.1](../../CLAUDE.md) — namespace convention enforcement rule.
- [`README.md`](../../README.md) — namespace convention in project overview.
- [`static/ontology/README.md`](../../static/ontology/README.md) — ontology
  design rationale.
