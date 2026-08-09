# Knowledge Browser — UX Enhancement Backlog

> Living notes on UX and UI improvements for the BSC Lab knowledge browser
> (RDF ontology graph viewer, annotation surface, SPARQL interface).
> Last updated: 2026-08-09. Update when ideas land or get superseded.

This is not a hard roadmap. Items are unranked except by category. Each
entry states the *user-visible value* and a one-line implementation hint.
The browser lives at `/graph` — behind the public entrance since 2026-07-18
([`PUBLIC_ENTRANCE.md`](PUBLIC_ENTRANCE.md)), which keeps Cytoscape and ontology
parsing off the site's first paint. It is implemented in `src/ui/graph/`,
`src/ui/annotation/`, `src/ui/navigation/`, and `src/ui/sparql/`.

---

## Currently implemented

The feature list is in [`CHANGELOG.md`](../../CHANGELOG.md) and the code in
`src/ui/graph/`. What is worth carrying forward is the reasoning, because these
are the choices a future change could quietly undo:

- **The scope picker has axes, not a list.** One flat list of 18 entries silently
  served three different questions, so "Core OWL classes", "Ecosystem focus" and
  "Frequency bands" read as mutually exclusive when they are not. It is now three
  multi-select axes — **Layer** (provenance), **Module** (ADR 0043 ownership),
  **Concern** (concept schemes) — plus node type on the legend. Selections union
  within an axis and intersect across axes. All 18 legacy `?view=` tokens still
  resolve, because w3id.org routes deep-link into this page.
- **The Module axis is generated from `manifest.json`**, never hand-listed —
  ADR 0043 §5 makes the manifest the one bill of materials, and this picker was
  the last inventory not derived from it. `src/rdf/navigator-contract.test.mjs`
  fails if they diverge. A term is attributed by the named graph of its
  *declaring* quad, and every SSTIM term is declared in exactly one module, so
  attribution is unambiguous.
- **Set-aside is session-only and always visible.** Hub nodes dominate a force
  layout, so nodes can be removed from the canvas without changing scope — but
  the count sits permanently beside Nodes/Edges, so a hand-pruned canvas can
  never be mistaken for the ontology itself. Deliberately never written to the
  URL.
- **Annotations fail closed.** Notes default to private, and an unrecognised
  visibility value is treated as private. Public notes serialize to a shared
  named graph, private ones to a per-user graph. RDF uses `oa:bodyValue`,
  whitelisted OA motivations, and pseudonymous agent IRIs — the Firebase auth ID
  never appears in exported RDF (audit KR-12).
- **CURIEs display, IRIs persist.** The IRI row shows `sstim:X`, but `href`,
  tooltip, and Copy all use the full canonical IRI, so the citable form never
  disappears. `toCurie()` lives beside the prefix table in
  `src/rdf/namespaces.js`.
- **Hash deep links are bidirectional.** `/graph#highTheta` selects the node;
  selection writes back with `history.replaceState`, so a URL is shareable
  without polluting the back stack. `/#term` still works via a forwarding shim
  on the entrance.
- **A deep link carries its framing, and says where it landed.** The hash names
  the node; `?zoom=` says how closely it is framed and `?focus=neighborhood`
  whether the graph is folded to its 1-hop neighborhood. On arrival the node is
  centred and blinks a halo four times, because in a canvas of hundreds a static
  selection ring reads as "something is selected", not "this one". Three
  constraints hold this together, in `src/ui/graph/deepLink.js`:
  **pan is deliberately not in the URL** — the cose layout is re-run unseeded on
  every load, so a captured pan coordinate would frame empty canvas on the
  recipient's screen; the node hash is the anchor and zoom is the only camera
  value that survives a relayout. The blink runs at 2.08 Hz, under the
  three-per-second ceiling `flashSafety.js` models from WCAG 2.3.1 — a flashing
  affordance in a sensory-stimulation app is a safety surface, so the rate is
  asserted against `FLASH_SAFE_MAX_HZ` in a test, and reduced motion or visual
  stimulation switched off holds one steady halo instead. And `?focus=` is
  dropped when its node does not resolve, so focus can never be armed with no
  selection and no button to turn it off.
- **The opening camera is decided in exactly one place.** Selection, focus and
  relayout all end in a fit, and Svelte gives no ordering guarantee between an
  effect flush and the mount continuation — a link's zoom was set and then
  silently overwritten a frame later. `restoreInitialCamera()` now runs last and
  cancels the in-flight fit, and the focus effect primes on its first run
  instead of fitting. Do not "simplify" that priming away.
- **Animation is one setting.** Fade, pan, and fit share a single
  `transitionMs` with `ease-in-out-cubic`, so in and out feel symmetric and the
  camera and visibility changes finish together.

Also present: single-row top bar, keyboard shortcuts (`/` `Enter` `Esc` `c` `x`
`f` `r` `h`/`?`), Copy IRI, direction-ordered Connections with per-edge-kind
filter pills, 1-hop neighborhood focus, and the `/profile/` page that supplies
annotation author names.

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
  menu. The Module axis already ships the published-profile case (Kernel /
  Core / Core Plus / Full); what is left is *user-defined* presets spanning all
  four axes plus the edge-layer toggles.

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

- **Reflect edge-layer toggles in the URL.** The selected node's IRI is in the
  hash, all four scope axes are in the query string (`?layer=`, `?module=`,
  `?view=`, `?hide=`, each omitted at its default), and the framing follows in
  `?zoom=` / `?focus=`. The edge-layer checkboxes are the remaining piece of
  filter state that a shared link does not carry.
- **Permalinks per node.** A "share" button next to "Copy IRI" that copies the
  full BSC Lab deep-link (`https://labiosyncare.github.io/#X`; `/graph#X` once
  the entrance ships) rather than the canonical IRI.
- **w3id HTML branches → `/graph`.** The redirect config is merged and live
  (2026-07-17, perma-id/w3id.org#6378); every HTML conneg branch currently
  303s to the bare root. Once the entrance ships, optionally retarget the
  HTML branches to `/graph` in a future bundled w3id PR. A per-route prefix
  hint (`/graph` vs a `/graph/vocab` alias deciding whether bare hashes
  resolve `sstim:` or `sstim-v:` first) remains possible then.
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
