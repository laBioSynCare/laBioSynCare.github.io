# Knowledge Browser — UX Enhancement Backlog

> Living notes on UX and UI improvements for the BSC Lab knowledge browser
> (RDF ontology graph viewer, annotation surface, SPARQL interface).
> Last updated: 2026-04-30. Update when ideas land or get superseded.

This is not a hard roadmap. Items are unranked except by category. Each
entry states the *user-visible value* and a one-line implementation hint.
The browser is implemented in `src/ui/graph/`, `src/ui/annotation/`, and
`src/ui/navigation/`, with the SPARQL interface in the `src/routes/sparql/`
page (a dedicated `src/ui/sparql/` component is planned).

---

## Currently Implemented

- **Single-row top bar** — scope selector, focus search, Center / Fit / Relayout
  actions, help (`?`) and global menu (`+`); aligned controls, ARIA-only labels.
- **Selection panel layout** — kind tag + close on the header row, selection
  title, annotation form on top, description below the Save button, framed
  metadata block (IRI / Notation / Scheme), Connections list, saved notes.
- **Copy IRI** — clipboard action with "Copied" feedback.
- **Connections list** — neighbors of the selected node, color-coded by edge
  kind, with a 3 px tinted left bar; ordered top→bottom in triple direction
  (subject → predicate → object) so an outgoing card reads `predicate →` /
  `neighbor` and an incoming card reads `neighbor` / `← predicate`.
- **Focus this neighborhood** — collapses the canvas to the selected node + its
  1-hop neighbors; updates as you walk to a neighbor; exit restores the full
  view. Respects scope and edge-layer filters. Entering and exiting focus
  animate the fit; walking inside focus preserves the current zoom and pans
  smoothly to the new node instead of re-fitting. Visibility transitions
  (focus toggle, scope/layer changes, neighborhood walk) cross-fade nodes and
  edges so nothing pops in or out.
- **Unified animation duration** — fade-in, fade-out, center-pan, and fit all
  share a single `transitionMs` setting with `ease-in-out-cubic` easing, so
  in/out feel symmetric and the camera + visibility changes finish together.
  A slider in the left rail lets the user pick anywhere from 0 (instant) to
  800 ms; the value persists to `localStorage`.
- **Keyboard shortcuts** — `/` focus search · `Enter` center · `Esc` clear /
  close · `c` center · `f` fit · `r` relayout · `h` / `?` help. Discoverable
  from the help dialog and tooltips.
- **Connections grouping & filter pills** — neighbors split into Outgoing /
  Incoming subsections; a row of color-coded pills above the list toggles
  visibility per edge kind, and the count in the header reflects the active
  filter ("3 of 5"). Filter state persists across selections.
- **CURIE display** — the IRI row shows the compact `sstim:X` /
  `sstim-v:X` form; `href`, hover tooltip, and the Copy button still use the
  full canonical IRI so the citable form never disappears. `toCurie()` lives in
  `src/rdf/namespaces.js` next to the prefix table.
- **Hash deep-linking** — `https://labiosyncare.github.io/#highTheta` lands on
  the graph with the matching node selected; bare local names resolve via
  lookup (preferring `sstim:` then `sstim-v:` on collision), CURIEs like
  `#sstim-v:highTheta` are accepted as a fallback. Selection writes back to the
  URL with `history.replaceState`, so the URL is bidirectionally shareable
  without polluting the back stack.
- **Public / private annotations** — notes default to private and fail closed
  (an unrecognised visibility value is treated as private); creators can mark
  a note public at write time, edit it in place afterwards, and toggle
  visibility on edit. Unauthenticated visitors see public notes (read-only);
  only the creator can edit or delete. Author display name is captured at
  write time and shown on each note. Public notes serialize into a shared RDF
  named graph; private notes stay in a per-user graph. RDF serialization uses
  `oa:bodyValue`, whitelisted OA motivations, and pseudonymous agent IRIs —
  the Firebase authentication ID never appears in exported RDF (audit KR-12).
- **Author display name + profile page** — display name on signup is optional
  and falls back to the email's local-part instead of "Anonymous". A new
  `/profile/` route lets signed-in users edit their display name, affiliation,
  and bio; saving syncs the new display name back into Firebase Auth so
  subsequent annotations attribute correctly. Profile data lives in
  `users/{uid}` with owner-only Firestore rules.

---

## Open follow-ups (user-flagged)

### Focus this neighborhood — refinements
- Add a "show other nodes, transparent" mode so the focus dims the rest of the
  graph instead of hiding it (different visual idiom from the current fade-out
  + collapse, useful when you want to keep the global layout in view).
- Variable hop depth (currently 1-hop only); allow 2 / 3 / 4 hops via a small
  control next to the focus toggle.

### Connections palette polish
- Make the per-edge-kind pill / card colors track the left-rail edge layer
  swatches more closely (verify under the dark theme).

## Connections Panel

- **Optional grouping by edge kind.** Currently grouped by direction. For hub
  classes with 20 subclasses an alternate "by kind" mode (or a small toggle)
  would avoid one giant flat list.
- **Hover preview on canvas.** Hovering a connection card flashes the matching
  node and edge in Cytoscape (e.g. yellow outline) without changing selection.
  `cy.getElementById(id).addClass('preview')` / `removeClass`.
- **Path between two nodes.** Pin a "from" node, pick a "to" node, run BFS on
  the cy graph and highlight the shortest path. Useful for "how is X related
  to Y?".
- **Multi-hop expand.** A small `+` on the focus button (or a separate `2-hop`
  / `3-hop` chip) to widen the neighborhood depth.

## Selection & Navigation

- **Pin selection.** Lock the panel so a background tap doesn't deselect —
  useful when comparing notes against the canvas.
- **Side-by-side comparison.** Pin two nodes, render two stacked detail
  panels. Useful for diffing classes or vocabularies.
- **Breadcrumb / back stack.** A small back-arrow at the top of the panel that
  steps back through the selection history; explore-then-retreat without
  losing your place.
- **Recent / pinned nodes.** Quick-access list of recently visited or starred
  nodes, persisted to `localStorage`.
- **Keyboard navigation in connections list.** `j`/`k` (or arrows) to move
  through the list, `Enter` to follow.

## Search & Filtering

- **Regex / by-kind / by-scheme search.** Power-user toggles in the search
  popover.
- **Find by IRI.** Paste an IRI to jump straight to the node.
- **Layer presets.** Save the current edge/node-toggle combination + scope as a
  named preset (e.g. "Vocabulary only", "Frequency hierarchy"); restore from a
  menu.

## Annotation

- **Edge-aware annotations.** Tap an edge → panel populates with edge metadata
  (property IRI, domain, range, label) and lets you annotate the *relationship*,
  not just the endpoints. Cytoscape edge-tap handler not yet wired.
- **Multilingual labels surfaced.** `sstim-vocab.ttl` carries `skos:prefLabel`
  in en/it/pt/es. Show a small chip row under the title and let the description
  block follow the user's preferred language. `buildGraphElements` would need
  to retain the full label map.
- **Annotation export.** Download all annotations as Turtle (in a named
  graph) so they round-trip with the rest of the ontology.
- **Annotation tags.** Free-form or controlled-vocab tags on each note,
  filterable from the annotation list.
- **Reply / threaded notes.** For collaborative scenarios.

## Visualization

- **Density slider.** Live control over `nodeRepulsion` / `idealEdgeLength` so
  the user can spread out a clumped layout without re-running every time.
- **Edge labels on hover.** Most edge kinds suppress labels for legibility;
  show the label on the edge only while the cursor is on it.
- **Color-blind friendly palette toggle.** Alternate palette for SKOS schemes
  and edge kinds.
- **Collapse subtrees.** Click a small fold affordance on a class to hide its
  subclasses; restore on click.
- **WebGL renderer for very large graphs.** Cytoscape's canvas renderer can
  stutter past a few thousand nodes; consider Sigma.js or a PixiJS-backed
  Cytoscape extension when scale demands it.

## Stats & Context

- **Stats persist alongside selection.** Currently the right pane swaps stats
  for selection. Keep a 1-line summary ("95 nodes · 93 edges visible") at the
  bottom of the panel during selection.
- **Per-kind counts in the legend.** Mirror the stats card on the legend
  swatches in the left rail.
- **SHACL validation indicator per node.** A small badge (✓ / ⚠) showing
  whether the selected node passes SHACL validation; inspect violations on
  click. SHACL is already in the stack via `rdf-validate-shacl`.

## URL & Sharing

- **Reflect scope and edge-layer toggles in the URL.** The selected node's IRI
  is already in the hash; extending the URL state to include scope and visible
  edge layers would make filter views shareable too.
- **Permalinks per node.** A "share" button next to "Copy IRI" that copies the
  full BSC Lab deep-link (`https://labiosyncare.github.io/#X`) rather than the
  canonical IRI.
- **w3id redirect routes.** Once the redirect config lives in the w3id repo,
  point `https://w3id.org/sstim` and `https://w3id.org/sstim/vocab` at distinct
  paths under `labiosyncare.github.io` (e.g. `/` and `/vocab/`) so the namespace
  isn't lost across the fragment boundary. Both routes can render the same
  graph page; the route distinguishes which prefix bare hashes resolve to first.
- **Export as image.** PNG / SVG export of the current canvas viewport. PNG is
  built in to Cytoscape; SVG via `cytoscape-svg`.

## Accessibility & Responsiveness

- **Focus rings on interactive elements.** Audit all custom buttons (close,
  copy, focus, neighbor cards) for visible `:focus-visible` outlines.
- **Tablet / narrow viewport.** The three-column layout breaks under ~900 px;
  side panels should collapse to drawers.
- **Light theme toggle.** The current dark theme is hard-coded. A
  `prefers-color-scheme` audit would tell us how much would need to change.
- **Reduced motion.** Honor `prefers-reduced-motion` for the cy.animate
  centering transitions.

## Performance & Scale

- **Lazy Comunica import.** Per CLAUDE.md, both Cytoscape and Comunica are
  heavy. Cytoscape is already lazy-loaded; do the same for Comunica when the
  SPARQL panel opens.
- **Position cache.** Avoid re-running the cose layout on every toggle. Cache
  positions and only relayout when topology genuinely changes.
- **Off-main-thread RDF parsing.** Move N3.js parsing into a Web Worker for
  the initial load so the UI doesn't block on multi-MB ontologies.
- **Incremental ontology load.** Stream concepts and SHACL shapes as they
  parse, so the canvas paints early.

---

## Notes for future revisions

- When an item lands, move it from its category up to **Currently Implemented**
  with a short description of what shipped.
- When an item is rejected or superseded, remove it rather than keep it as a
  graveyard — the README is for what we *might* still do.
- Cross-link to ADRs in `docs/decisions/` if a backlog item turns into an
  architectural choice (e.g. swapping Cytoscape for Sigma).
