# ADR 0023 — WIDOCO docs: CI-generated Pages subpath; the app keeps the browser-facing IRI

**Status:** Accepted — 2026-07-11

## Context

The publication plan requires human-readable reference documentation for the
released ontology ([`PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md),
"Still external or deployment-dependent" items 2–3). WIDOCO has been the chosen
generator since Phase 0 (CLAUDE.md §2), but deployment was blocked on two open
decisions:

1. **Publication path** — where generated HTML lives, given the rule that it
   must be reproducible in CI and never manually edited or committed to `main`.
2. **Browser target** — what a browser hitting `https://w3id.org/sstim` should
   receive. The live w3id rules 303-redirect `Accept: text/html` requests to
   `https://labiosyncare.github.io/` — the knowledge-browser app. Because
   browsers reapply URL fragments across redirects and the graph view resolves
   `#LocalName` hashes to nodes (`OntologyGraph.svelte`), term IRIs such as
   `https://w3id.org/sstim#FrequencyBand` already dereference to an interactive
   graph view with the term selected. The post-release FOOPS assessment (87.5%,
   2026-07-10) passes its HTML-availability checks with this setup.

## Decision

**Publication path: generate WIDOCO in the Pages workflow, into the deployed
artifact only.**

- `make ontology-docs` (WIDOCO 1.4.25, pinned in `flake.nix` beside ROBOT) runs
  in `pages.yml` after `make export`, writing to `dist/ontology/docs/`.
- Output is never committed. `/ontology/docs/` is reserved for generated
  documentation; the app owns the site root and all existing routes. No
  separate docs branch, no second workflow.
- Gap-filling metadata (the abstract, which the core ontology does not declare)
  comes from `docs/ontology/widoco.properties`; everything else is extracted
  from the ontology itself (`-getOntologyMetadata`).

**Browser target: the knowledge-browser app remains the `text/html` redirect
target at w3id.** The interactive term-dereferencing behavior is a distinctive,
working feature and FOOPS already passes; replacing it with static docs is not
required by any current registry. The docs and the app cross-link instead:

- the WIDOCO abstract links to the app, noting that term fragments select graph
  nodes;
- the graph view's node panel links core terms to their `/ontology/docs/#LocalName`
  reference entry (WIDOCO anchors are term local names);
- `void.ttl` declares the docs as `foaf:page` while `dcat:landingPage` stays
  the app.

## Consequences

- Unblocks Phase 3 registry submissions (LOV, Archivo, BARTOC, BioPortal,
  FAIRsharing), which follow WIDOCO per the publication plan.
- The docs URL is stable (`https://labiosyncare.github.io/ontology/docs/`) and
  can be cited in registry records without any w3id change.
- Revisiting the browser target later is a one-rule `.htaccess` edit in a
  perma-id PR — reversible, and only warranted if a registry review requires
  static documentation at the ontology IRI itself.
- WIDOCO documents the core module only; the SKOS vocabulary module is served
  by a SKOS-aware generator. **Done 2026-07-12:** pyLODE 2.13.2 (`vocpub`
  profile, vendored in the flake) generates `/ontology/docs/vocab/` in CI
  alongside WIDOCO; the two cross-link (WIDOCO abstract → vocab page; graph node
  panel → vocab page for SKOS concepts). pyLODE 2.x was chosen over 3.x because
  3.x pulls in `kurra` → `shacl-rules`/`sparqlib` (a heavy vendoring cascade and
  a pyshacl version conflict); 2.13.2's deps are all in nixpkgs.

## Alternatives considered

- **Docs branch / separate workflow.** A second deploy pipeline and a second
  source of truth for Pages content, for no benefit over an artifact subpath.
- **Redirect browsers to WIDOCO (FAIR convention).** Conventional, but trades
  away the working interactive dereferencing for a static page nobody asked
  for yet; kept as the documented fallback.
- **Committing generated HTML to `main`.** Rejected long ago (TODO §3): noise
  in review, drift risk, and manual-edit temptation.
