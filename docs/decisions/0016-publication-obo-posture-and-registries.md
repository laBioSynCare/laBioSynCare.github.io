# ADR 0016 — External publication, OBO posture, and registry strategy

**Status:** Accepted — 2026-06-30

## Context

SSTIM `0.3.0` is internally mature (versioning, frozen snapshots, w3id
publication, SHACL) but is not yet *first-class for public reuse*: the ontology
IRI dereferences only to Turtle, machine-readable namespace metadata is thin,
there are no DOIs, and it is not listed in any vocabulary/ontology registry. The
maintainer asked specifically whether and how to link SSTIM into **Wikidata,
DBpedia, Wikimedia, and OBO**, and whether to register the URIs in public
namespaces. These choices interact with a load-bearing identity question — the
shape of the SSTIM IRIs — so they need a recorded decision rather than ad-hoc
submissions. The full strategy lives in
[`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md)
(tracked as IMPROVEMENT_PLAN **P6**); this ADR records the decisions that are
hard to reverse.

## Decision

1. **Keep human-readable w3id IRIs as canonical.** SSTIM terms stay at
   `https://w3id.org/sstim#`-family IRIs with descriptive local names
   (`sstim:FrequencyBand`), not opaque numeric identifiers. This is a usability
   value for the intended W3C-Community-Group / web audience.
2. **Stay OBO-*interoperable*, do not seek OBO Foundry *membership* in the
   current form.** SSTIM already aligns to BFO 2020 and reuses IAO/OBI/COB by
   stable PURL — that is the right level. Full OBO membership requires the OBO
   identifier policy (`purl.obolibrary.org/obo/SSTIM_NNNNNNN`, opaque numeric
   IDs), which is incompatible with decision 1. Deepen interoperability (add RO
   relations where exact; keep IAO/OBI/COB verified) instead.
3. **Reserve an OBO-ID bridge as a future, ADR-gated option.** If a
   biomedical-grade home later becomes strategically necessary, publish a *dual
   edition*: keep w3id IRIs canonical and generate an OBO-ID layer
   (`sstim:FrequencyBand owl:equivalentClass obo:SSTIM_0000001`). Not done now.
4. **DBpedia: via DBpedia Archivo, not directly.** DBpedia core is extracted
   from Wikipedia. Submit the dereferenceable ontology URI to Archivo
   (`archivo.dbpedia.org`) and iterate to a 4-star rating.
5. **Wikidata: incremental and conservative.** Create one Wikidata item for the
   ontology; add `exact match` (P2888) links for already-aligned, notable
   concepts in both directions; **defer** a dedicated "SSTIM ID" external-
   identifier property and the minting of new concept items (Martigli, Symmetry)
   until there is external adoption / publishable sources.
6. **Wikimedia/Wikipedia: defer** on notability grounds; Commons diagrams under
   CC BY are optional.
7. **Register in the vocabulary registries** once FAIR packaging lands: prefix.cc,
   LOV, BARTOC, BioPortal, OLS, OntoBee, FAIRsharing, and Zenodo DOIs per release.
8. **Make the artifact FAIR first (prerequisite for 4–7):** multi-format
   content negotiation (Turtle/RDF-XML/JSON-LD, HTML via WIDOCO), `vann:`/VoID
   metadata, a JSON-LD context, and DL-consistency in CI.

## Alternatives considered

- **Migrate to OBO numeric PURLs and seek OBO Foundry membership.** Rejected
  now: breaks decision 1 (identity-level change), heavy process cost, marginal
  benefit for the current web/CG audience. Preserved as the decision-3 bridge.
- **Author a Wikipedia article / mint Wikidata concept items immediately.**
  Rejected: fails notability / no-original-research norms while SSTIM is
  pre-publication; risks looking promotional and being reverted.
- **Submit to DBpedia directly.** Not possible — there is no path that bypasses
  Wikipedia extraction; Archivo is the correct channel.
- **Commit generated JSON-LD/RDF-XML artifacts to the repo** (snapshot/wasm
  pattern). Rejected for the derivatives: they churn on every ontology edit.
  Generated at build time into `dist/ontology/` instead (`make export`).

## Consequences

- The published namespace must serve Turtle, RDF/XML, and JSON-LD; `make export`
  + a non-fatal Pages build step produce the latter two into `dist/ontology/`.
- A small amount of additive metadata appears on the ontology node
  (`vann:preferredNamespacePrefix`/`Uri`, `cc:license`); no domain semantics
  change, `make validate` stays green.
- Anything contributed to Wikidata is CC0; the authoritative CC BY artifact and
  attribution remain on the SSTIM side. CC BY definition text is linked, not
  pasted into CC0 fields.
- Every external identifier (QID, PURL, MeSH/SNOMED code) is verified live
  before being written into RDF — never fabricated (continuing the `0.2.0`
  erratum discipline).
- OBO Foundry membership is explicitly out of scope until a future ADR revisits
  decision 3.

## See also

- [`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md) — the full plan (P6).
- [ADR 0001](0001-namespace-split.md) — SSTIM-scoped namespace design.
- [ADR 0004](0004-protected-ontology-files.md) — protected-file policy these edits respect.
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P4 (alignments) and P6 (publication).
