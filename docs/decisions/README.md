# Architecture Decision Records

This directory captures the non-obvious architectural decisions that shape the
BSC Lab ontology and software. Each ADR explains one decision: what forced it,
what was chosen, what was rejected, and what the choice locks in or enables.

The format is **lightweight ADR** (Michael Nygard style): Context, Decision,
Alternatives, Consequences. Target length: one page.

## Why ADRs and not RDF

Design rationale is meta-discourse about the ontology — statements about *why*
the modeling chose a particular shape — not statements in the ontology's
domain. It exists to be read by humans, so it lives in prose. Where an ADR is
load-bearing for an RDF class or property, the `.ttl` file should link to it
via `rdfs:seeAlso`.

Facts about the ontology's own evolution (deprecation, versioning, history
notes) remain in RDF: `owl:deprecated`, `owl:versionInfo`,
`skos:historyNote`, `prov:wasRevisionOf`. The rationale behind those
annotations lives here.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-namespace-split.md) | Two-root namespace split (`sstim` vs `bsc`) | Accepted |
| [0002](0002-dual-typing-owl-skos.md) | Dual-typing of SKOS concepts and OWL classes (Pattern 2) | Accepted |
| [0003](0003-named-graphs-for-modules.md) | Named graphs for runtime module isolation | Accepted |
| [0004](0004-protected-ontology-files.md) | Protected ontology files policy | Accepted |
| [0005](0005-binaural-carrier-pair-only.md) | Binaural beat parameterized as carrier pair only | Accepted |
| [0006](0006-one-class-per-technique.md) | One class per technique; voice classes named `*Voice` | Accepted |

## Adding an ADR

1. Copy the structure of an existing file.
2. Give it the next sequential number and a short descriptive slug.
3. Status is one of: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
4. If an ADR supersedes a prior one, edit the prior one's status line and link
   to the new one — never delete or rewrite past decisions.
5. Add a row to the index above.
6. If the decision affects `.ttl` classes or properties, add
   `rdfs:seeAlso <…/docs/decisions/NNNN-slug.md>` to the relevant terms.
