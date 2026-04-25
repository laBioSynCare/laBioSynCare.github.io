# ADR 0003 — Named graphs for runtime module isolation

**Status:** Accepted — 2026-04

## Context

The BSC ontology is growing into modules: frequency bands, voice/track types,
presets, sessions, sensory modalities, evidences, stimulation mechanisms,
outcomes, temporal structures. Separately, the runtime store will hold
non-ontology data of very different provenance and lifetime:

- Preset instances (stable, curated, from the repo).
- Session records (per-execution, per-user, stored in Firestore).
- User annotations on ontology nodes (per-user, private or shared,
  collaborative).

A single flat merged store — the current approach for the ontology browser —
works for read-only ontology viewing but does not scale to any of the above.
Three questions need to be answerable at query time:

1. Which module does a triple come from? (For module-level UI toggles.)
2. Who asserted this triple, when, with what authority? (For provenance.)
3. Can we isolate a user's annotations from the authoritative ontology?
   (For security and for rendering choices.)

## Decision

**Option C** from the options discussed: keep the `.ttl` files flat and
standalone in the repo (so they remain independently citable and validatable
by `pyshacl`), and assign canonical **named graph IRIs** at load time inside
the JS loader.

Canonical graph IRIs mirror the namespace structure where modules align:

| Source | Graph IRI |
|---|---|
| `sstim-core.ttl` | `https://w3id.org/sstim/graph/core` |
| `sstim-vocab.ttl` | `https://w3id.org/sstim/graph/vocab` |
| `sstim-shapes.ttl` | `https://w3id.org/sstim/graph/shapes` |
| `sstim-alignments.ttl` | `https://w3id.org/sstim/graph/alignments` |
| Future `sstim-track.ttl` | `https://w3id.org/sstim/graph/track` |
| Future `sstim-outcome.ttl` | `https://w3id.org/sstim/graph/outcome` |
| User annotations | `https://w3id.org/sstim/implementation/bsclab/annotation/{userId}` |
| Session records | `https://w3id.org/sstim/implementation/bsclab/session/{sessionId}` |

For ontology modules, namespace / file / graph IRI align. For user data,
scoped path and graph IRI come apart — a user can annotate a term in any
namespace, but the annotation triple belongs in the user's graph.

## Alternatives considered

- **Option A: TriG/N-Quads files.** Each module declares `GRAPH <iri> { … }`
  in the source file itself. Rejected because it changes the file format of
  protected ontology files, complicates WIDOCO/GitHub Pages hosting of
  individually citable modules, and loses the ability to validate each
  module with `pyshacl` as a standalone Turtle document.

- **Option B: `owl:imports`.** Each file `.ttl` imports its dependencies.
  Rejected because `owl:imports` gives no runtime provenance per triple —
  once merged, all triples are in the default graph with no way to ask
  "which file / user / session did this come from?" Adequate for ontology
  reuse by other tools; inadequate for a store that also holds user data.

- **Namespace-as-module only, without named graphs.** Namespace answers
  "what does this IRI mean?"; it is a semantic identity question, not a
  provenance question. A user annotation on `sstim-v:alpha` uses the
  `sstim-v:` namespace for the subject but the triple about that subject
  does not live in the `sstim` module. Namespaces alone cannot express
  provenance of the assertion.

## Consequences

- Protected `.ttl` files are unchanged; `pyshacl` continues to work
  file-by-file.
- The loader (`src/rdf/loader.js`) maintains the graph-IRI map. Adding a
  module means adding one row to the map and creating the `.ttl` file.
- Module toggles in the ontology graph UI filter by graph IRI.
- SPARQL queries can scope to a module with `FROM NAMED` / `GRAPH ?g`.
- User annotations land in `sstim/implementation/bsclab/annotation/{userId}`
  graphs and are isolated from authoritative ontology data by construction
  (extends `CLAUDE.md` §5.5 from annotations-only to all user data).
- When Firestore writes are added, each session record becomes a named
  graph on hydration into the in-memory store; the default graph remains
  authoritative ontology only.

## See also

- [`CLAUDE.md` §5.5](../../CLAUDE.md) — named graphs for annotations
  (specific case, now generalized).
- [ADR 0001](0001-namespace-split.md) — namespace split; complements this
  decision but does not substitute for it.
