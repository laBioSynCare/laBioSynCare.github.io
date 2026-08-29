# ADR 0055: The namespace IRI resolves to a release, and says what it is

**Status:** Accepted — 2026-08-29 · implemented 2026-08-29, except the upstream
`perma-id/w3id.org` pull request, which must follow the deploy that publishes
`/namespace/` and `latest/` because the rules point at both

## Context

Measured 2026-08-29 against the live production routes, after the `w3c-cg.github.io/sstim`
cutover. `https://w3id.org/sstim` answers two audiences from one identifier, and
each answer had a distinct defect.

**Machine.** `Accept: text/turtle` redirects (303) to
`/ontology/sstim-namespace.ttl` on the deployment, which is generated from the
working tree. It declares `owl:versionInfo "0.17.0-dev"`, `mod:status "under
development"`, and carries no `owl:versionIRI` at all; the frozen
`/sstim/0.16.0` does carry one. So the ontology IRI hands a consumer a graph it
cannot pin or cite, and which announces itself unfinished. LOV and Archivo
harvest the namespace IRI, so that is the state they would archive as SSTIM.
[ADR 0020](0020-whole-set-snapshot-versioning.md) ruled that a
non-dereferenceable `owl:versionIRI` is worse than none; this is the mirror
image, a dereferenceable ontology with no version identity.

**Human.** `Accept: text/html` redirects to the Workbench entrance, a four-door
product landing page. Nothing on it states that the visitor followed a linked
data namespace IRI, what the namespace is, or which IRI families belong to it.
WIDOCO (`/ontology/docs/`) and pyLODE (`/ontology/docs/vocab/`) both answer 200,
and neither is the destination.

Sending HTML to the application rather than to WIDOCO was deliberate and remains
right. A server never sees a fragment, so a single destination has to serve both
`/sstim` and `/sstim#Preset`. Measured 2026-08-23, WIDOCO anchors by full IRI and
pyLODE by label, so both left the reader at the top of an index with nothing
selected, while the knowledge browser reads the fragment client-side and selects
the term (`src/routes/+page.svelte` forwards any non-door hash to `/graph/`).
That mechanism works. What it does not do is tell the reader what happened:
building the graph is several seconds of uninterruptible force layout, so a
visitor who dereferenced a term IRI gets a spinner, then a highlighted node, and
at no point a statement that an RDF identifier resolved.

## Decision

Six parts of one decision: the namespace IRI serves a **released** graph to
machines, and tells **people** what they reached.

1. **RDF resolves to the latest release, not the working tree.** Every deploy
   copies the newest frozen snapshot to `latest/` in the build artifact, and the
   `^$` Turtle, JSON-LD and RDF/XML rules point there. A stable path rather than
   a versioned one, so cutting a release still costs no w3id pull request
   ([ADR 0053](0053-wildcard-snapshot-routes.md)).

   `latest/` is **derived on every build and never committed**. A committed copy
   could drift from the snapshot it claims to mirror, and the ontology IRI would
   then quietly serve the wrong release; deriving it removes that failure mode
   rather than adding a gate to catch it.

2. **Released serializations are generated, never committed.**
   `scripts/export-ontology.py` gains `--source-dir` and exports `latest/` from
   that snapshot's own frozen `manifest.json`. Turtle stays the only frozen
   master, as `static/ontology/README.md` requires. Two things are then checked,
   because both are silent when wrong: that the newest snapshot is the release
   the application declares, and that the Turtle came through the export byte
   for byte, since the export regenerates the namespace catalogues on its way
   past and its concatenation is a second implementation of `make snapshot`'s.

3. **Bare `/sstim` in a browser lands on a namespace page**, a new route at
   `/namespace/`, not the entrance. It states the namespace and current release,
   gives the content negotiation table with real URLs, lists the IRI families
   that belong to SSTIM, and links WIDOCO, pyLODE, the module manifest, SPARQL
   and the knowledge browser. If a fragment is present on arrival it forwards to
   `/graph/`, exactly as the entrance does today.

4. **A resolved IRI says so, beginning during the loader.** The banner does not
   wait for the graph. Expanding a fragment to an IRI is a pure lookup in the
   browser's `PREFIXES` table and is available immediately, whereas
   `resolveHashToNodeId` returns null until `allElements` is populated. So the
   banner renders in two stages: on arrival, beside the loading panel, naming the
   IRI it recognised; once the graph is built, gaining the term label and the
   reference-entry link. If the fragment turns out not to resolve, it says so
   rather than disappearing.

5. **The node panel names its reference documents and offers the Turtle.** The
   existing Docs row links WIDOCO and pyLODE under the label "Reference entry",
   and there is no link to the machine-readable module that defines the term. An
   RDF browser that hands out HTML documentation but not RDF is an odd gap.

6. **The graph's `?` help explains that this is RDF.** It is currently eight
   keyboard shortcuts and nothing else. It gains a short section: what the graph
   is, that node IRIs are dereferenceable persistent identifiers, the namespace,
   how to fetch Turtle or JSON-LD, and links to WIDOCO, pyLODE and SPARQL.

## Alternatives considered

- **Keep serving the working tree at `/sstim`.** Rejected: it is the defect, not
  a baseline. The dev build stays reachable at its own deployment URL, so nothing
  is lost by not making it the answer to the citable identifier.
- **Point the `^$` rules at `/ontology/0.16.0/` directly.** Rejected: it
  reintroduces a w3id pull request per release, which ADR 0053 removed at the
  maintainer's explicit request.
- **Commit JSON-LD and RDF/XML into every snapshot.** Rejected: 26 files become
  78 per release, immutably and forever, for bytes that `make export-check`
  already proves isomorphic to the frozen Turtle.
- **Export every snapshot at deploy time.** Rejected: sixteen releases of rdflib
  parse, serialize and isomorphism check on every build, for fifteen directories
  no negotiated route points at. The pre-modular 0.1.0 to 0.12.0 snapshots have
  no manifest to drive it in any case.
- **Send HTML to WIDOCO or pyLODE.** Rejected on the 2026-08-23 measurement
  above. Post-processing WIDOCO's anchors to add local-name aliases would make it
  viable and is not ruled out, but the knowledge browser remains the better
  destination because it also resolves the catalog and ecosystem IRIs that
  neither generated document covers.
- **Put the namespace page at `/ontology/`.** Rejected: `dist/ontology/` is the
  static Turtle directory and `/ontology/docs/` belongs to WIDOCO. A SvelteKit
  route there is a collision waiting to be debugged.

## Consequences

- A term minted mid-cycle does not dereference at `/sstim#NewTerm` until the next
  release. This is free today: 0.17.0-dev and 0.16.0 have identical class sets,
  and the entire diff is version strings plus `skos:narrowMatch` and a `snomed:`
  prefix. It becomes a real constraint the first time public instance data uses a
  term before the release that ships it. That is a thing to watch for, not a
  thing to design against, and releases here are frequent.
- `/sstim` stops advertising "under development" and starts carrying a resolvable
  `owl:versionIRI`, which is what registry review asks for
  ([ADR 0016](0016-publication-obo-posture-and-registries.md)).
- The deploy gains a step (`make publish-latest`) and the release process gains
  none: `latest/` is derived, so there is no second place to remember to update.
  What the release must keep true is that `releaseMetadata.js` and the newest
  snapshot name the same version, which the publish step refuses to proceed
  without.
- One w3id pull request, once, touching the `^$` rules. Not one per release.
- The knowledge browser acquires a job it did not have: it is now an advertised
  dereferencing destination, not only an exploration tool. That is a standing UI
  commitment, not merely a routing target.

## See also

- [ADR 0016](0016-publication-obo-posture-and-registries.md): publication and registry posture.
- [ADR 0020](0020-whole-set-snapshot-versioning.md): the whole-set snapshot is the citable unit.
- [ADR 0023](0023-ontology-docs-publication-path.md): generated documentation is an artifact, never committed.
- [ADR 0053](0053-wildcard-snapshot-routes.md): snapshot routes are patterns.
- [`../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md): B2 dereferenceability.
