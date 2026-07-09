# ADR 0020 — Whole-set snapshot is the citable versioning unit

**Status:** Accepted — 2026-07-09

## Context

SSTIM ships as several Turtle modules (core, vocabulary, shapes, alignments,
exposure, patch-studio). Releases are cut with `make snapshot`
(`scripts/snapshot-ontology.mjs`), which freezes all term-space files verbatim
into `static/ontology/<version>/`, identified by the **core**
`owl:versionIRI <https://w3id.org/sstim/<version>>`.

The exposure module additionally declared its **own**
`owl:versionIRI <https://w3id.org/sstim/exposure/0.x>` (an independent version
line, bumped 0.4.0 → 0.4.1 during the 0.5.0 cut). But the snapshot mechanism only
produces **whole-set** `sstim/<version>/` directories — there is no per-module
snapshot — so `sstim/exposure/0.x` has never dereferenced to a frozen copy (true
since 0.4.0). A non-resolving `owl:versionIRI` undercuts FAIR/Archivo credibility;
it was flagged during the 0.5.0 cut and tracked in
[`PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md) B2.

## Decision

Version SSTIM as **one whole set**.

- The frozen whole-set snapshot `static/ontology/<version>/`, identified by the
  **core** `owl:versionIRI <https://w3id.org/sstim/<version>>`, is the single
  citable, dereferenceable unit.
- Modules carry `owl:versionInfo` **only** — a module-level change counter — and
  **no** `owl:versionIRI` or `owl:priorVersion`. Module change history lives in
  `owl:versionInfo` + `skos:historyNote`; `dct:isPartOf <https://w3id.org/sstim>`
  anchors each module to the umbrella whose version IRI is the citable anchor.
- **Applied:** removed `owl:versionIRI` and `owl:priorVersion` from the exposure
  ontology node (kept `owl:versionInfo "0.4.1"`). Core keeps its whole-set
  `owl:versionIRI` / `owl:priorVersion` — those resolve to real snapshot
  directories (`static/ontology/0.5.0/`, `0.3.0/`).

## Alternatives considered

- **(b) Per-module snapshot lineage.** Extend `snapshot-ontology.mjs` to also
  freeze each independently-versioned module into
  `static/ontology/<module>/<module-version>/` with matching w3id routes, so
  `sstim/exposure/0.4.1` resolves. Rejected now: a second snapshot axis and
  routing surface for no current need — no consumer cites the exposure module
  independently of the umbrella. Revisit if standalone module publication becomes
  a goal.
- **Keep the dangling `owl:versionIRI`.** Rejected: a non-dereferenceable version
  IRI is worse than none for LOV/Archivo review.

## Consequences

- One versioning axis; every `owl:versionIRI` remaining in the ontology
  dereferences (to a whole-set snapshot directory).
- The exposure module is cited as part of `sstim/<version>` (e.g. SSTIM 0.5.0),
  with its own `owl:versionInfo` distinguishing module-level revisions within.
- Metadata-only; `make validate` stays green. The change landed **after** the
  0.5.0 snapshot/tag were cut, so it is an `[Unreleased]` forward change — the
  frozen 0.5.0 snapshot retains the old exposure metadata (snapshots are
  immutable) and the cleanup is captured in the next snapshot (or folded in if
  0.5.0 is re-cut before it merges to `main`).
- Future modules follow this pattern: `owl:versionInfo` only, no per-module
  `owl:versionIRI`.

## See also

- [ADR 0010](0010-exposure-delivery-modality.md) — the exposure module.
- [ADR 0016](0016-publication-obo-posture-and-registries.md) — publication / FAIR posture.
- [`../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md) — B2 dereferenceability.
