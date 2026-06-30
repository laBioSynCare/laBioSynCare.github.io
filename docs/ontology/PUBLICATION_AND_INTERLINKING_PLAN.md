# SSTIM First-Class Publication & External Interlinking Plan

Status: active planning document
Baseline reviewed: SSTIM `0.3.0` (+ exposure `0.4.0`)
Created: 2026-06-30
Maintainer: Renato Fabbri

This document is the repo-truth strategy for making the SSTIM ontology a
**first-class, publicly usable, well-linked semantic-web artifact**. It answers
three questions the maintainer raised:

1. How do we close the remaining *domain-content* gaps so the vocabulary is
   complete enough to publish without embarrassment?
2. How do we make the published artifact technically first-class (FAIR:
   findable, accessible, interoperable, reusable)?
3. Should we — and how would we — link into **Wikidata, DBpedia, Wikimedia,
   and OBO**, and register the URIs in public namespaces?

It is a companion to [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md), which remains
the canonical backlog for *internal* modeling/validation maturity (P0–P4). This
file owns the *outward-facing* concerns. Where the two overlap, the split is:

- **IMPROVEMENT_PLAN.md** — what the ontology says and how it is validated
  (classes, properties, SHACL, content coverage **P5**).
- **this file** — how the ontology is *packaged, published, discovered, cited,
  and cross-linked*.

> **Scope guard.** This is a plan, not an ADR and not a change to any `.ttl`.
> Every semantics-changing item below must land through an ADR + a validated PR,
> and must respect the protected-file policy (CLAUDE.md §3.4). Every external
> identifier (QID, PURL, MeSH/SNOMED code) must be **verified live before it is
> written into RDF** — never fabricated — mirroring the discipline already set
> in IMPROVEMENT_PLAN P4.1.

---

## TL;DR — the recommendations

| Target | Recommendation | Why |
|---|---|---|
| **DBpedia** | **Yes — via [DBpedia Archivo](https://archivo.dbpedia.org), not "DBpedia" directly** | DBpedia core is extracted from Wikipedia; you don't submit a vocabulary to it. Archivo is the right channel: it crawls, versions, and *star-rates* dereferenceable OWL ontologies. Cheap, automated, gives an external quality signal. |
| **Wikidata** | **Yes, incrementally** | Create one item for the ontology; complete the two-way `exact match` links for already-aligned concepts; defer a dedicated "SSTIM ID" property until there is adoption. Be conservative about minting brand-new concept items (notability). |
| **Wikimedia / Wikipedia** | **Defer** | A Wikipedia article needs general notability (significant independent secondary coverage). Premature and risks looking promotional. Revisit after peer-reviewed publication / W3C CG traction. Commons can host CC BY diagrams now if useful. |
| **OBO Foundry** | **Already linked by reference — keep interoperating; do NOT seek full membership in the current IRI form** | SSTIM is already BFO-2020/IAO/OBI/COB aligned. Full OBO *membership* requires numeric `obo/SSTIM_NNNNNNN` PURLs, which conflicts with SSTIM's deliberate human-readable w3id IRIs. Stay interoperable; reserve membership as a future, ADR-gated, dual-publication option. |
| **Public registries** | **Yes — the real first-class levers** | LOV, prefix.cc, BARTOC, FAIRsharing, BioPortal, OLS, and Zenodo DOIs are where "first-class public usage" actually happens for a w3id-based OWL+SKOS vocabulary. |

The single highest-leverage move is **B2 + B3 + B5**: make the artifact fully
dereferenceable in multiple formats with machine-readable metadata and a DOI.
Everything else (Archivo stars, LOV acceptance, Wikidata links) depends on it.

---

## Part A — Close the domain-content gaps (tracked as P5 in IMPROVEMENT_PLAN)

The structural/validation work (P0–P4) is largely done. The remaining
*coverage* gaps are what stop SSTIM from being a credible general sensory-
stimulation vocabulary rather than an auditory-first one. These are added to
[`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md) as **P5: Domain Content Coverage**;
summarized here because publication should not precede them.

1. **Visual-entrainment technique vocabulary.** Today `TechniqueScheme` is
   explicitly "auditory and cross-modal"; visual entrainment exists only as
   example strings (`photic driving`) and the `mechGamma40` note. Add visual
   techniques as first-class concepts: photic/flicker driving, SSVEP-evoking
   stimulation, audiovisual entrainment (AVE), and a *neutral* color/chromatic
   stimulation concept (with an explicit negative-assertion `editorialNote`
   where "chromotherapy" claims appear, mirroring the solfeggio pattern).
2. **Tactile / haptic & cross-modal techniques.** Promote tactile rhythmic
   entrainment beyond the single `techVibroacoustic` cross-modal entry, and add
   genuinely cross-modal technique concepts (audiovisual, audio-tactile) rather
   than tagging a single modality.
3. **Neutral tuning / harmonic vocabulary.** Add a `tuningReferenceHz`
   datatype property (e.g. A=432 vs A=440) so tuning can be modeled as a neutral
   aesthetic parameter, *distinct* from `techSolfeggioTuning`'s mystical claim.
   Decide (ADR) whether to add a minimal musical-interval / consonance vocabulary
   or to explicitly scope it out.
4. **Populate `EvidenceClaim` instances.** Move the evidence knowledge that
   currently lives in prose (`skos:definition` / `scopeNote`) into queryable
   `EvidenceClaim` individuals citing `PublicSafeReference`s — starting with the
   best-supported auditory claims (FFR/ASSR) and the explicit negative
   assertions. This is what turns the new P3 claim-dimension machinery from
   scaffolding into data.
5. **Nomenclature cleanup.** Resolve the `modalitySomatosensory` label
   "Somatosensory / Haptic" conflation and reduce drift between the two parallel
   modality vocabularies (`sstim-v:modality*` vs `sstim-ex:modality*`) by adopting
   the convention **haptic = device/actuator, tactile = percept, somatosensory =
   superordinate channel, vibrotactile = mechanism** consistently.

**Gate:** publication to external registries (Part C) should target the **0.5.0**
release that lands P5 items 1–3 and at least a starter set for item 4. Linking a
visibly auditory-only "sensory stimulation" vocabulary into Wikidata/OBO-adjacent
catalogs would misrepresent scope.

---

## Part B — Make SSTIM technically first-class (FAIR packaging)

These are prerequisites for *every* external catalog. None changes domain
semantics, so they are low-risk and can proceed in parallel with Part A.

### B1 — Namespace & identifier policy (decision: keep human-readable w3id IRIs)

Keep `https://w3id.org/sstim#`-family IRIs with human-readable local names. This
is a deliberate design value for the W3C-CG audience and is incompatible with OBO
numeric PURLs (see C5). Document this as the canonical policy and the reason OBO
membership is declined for now. *Proposed ADR 0016.*

### B2 — Content-negotiation hardening (multi-format dereferenceability)

Current state ([`docs/ecosystem/w3id`](../ecosystem/w3id/README.md)): w3id routes
resolve each module to its **Turtle** file; JSON-LD and RDF/XML are "when
generated" and **do not yet exist** in `static/ontology/`. Archivo, LOV, and many
consumers expect the ontology IRI to dereference to RDF in the requested format.

Actions:
- Generate `*.jsonld` and `*.rdf` (RDF/XML) exports from the Turtle masters in CI
  (N3.js or `rapper`/`riot`), written to `dist/ontology/`. Turtle remains the
  editable master; exports are never hand-edited (consistent with README).
- Confirm the `perma-id/w3id.org/sstim/.htaccess` `Accept`-routing for
  `application/ld+json` and `application/rdf+xml` points at the generated files.
- Unblock **WIDOCO** HTML docs (currently intentionally not on `main`): generate
  in GitHub Actions, publish as a Pages artifact or docs branch, and switch the
  w3id "browser" branch from the app root to the WIDOCO landing page.

### B3 — Machine-readable ontology metadata

Only `voaf:Vocabulary` is currently declared. To pass LOV review and earn Archivo
stars, add to the `owl:Ontology` node (in `sstim-core.ttl`, via ADR + PR):
- `vann:preferredNamespacePrefix "sstim"` and `vann:preferredNamespaceUri`.
- `dct:license` (present ✓), `dct:title`/`description`/`creator`/`created`/
  `modified` (present ✓) — verify completeness across modules.
- A **VoID/DCAT dataset description** for the published graph set (distributions,
  formats, example resources, SPARQL endpoint if any).
- `cc:license` / `cc:attributionName` for CreativeCommons-aware tools.
- Ensure the ontology is **logically consistent** under a DL reasoner (HermiT/ELK)
  — Archivo's 4th star and OWL-DL credibility depend on it.

### B4 — JSON-LD context (IMPROVEMENT_PLAN P4.3)

Ship `static/ontology/context.jsonld` mapping the SKOS notations and key terms to
their IRIs, so downstream JSON consumers (and the `dist/presets.json` pipeline)
can round-trip to Linked Data. This is also the bridge for embedding
`<script type="application/ld+json">` blocks in app pages.

### B5 — Versioned DOIs (citability)

Enable the GitHub↔Zenodo integration so every tagged release mints a versioned
DOI plus a concept DOI. Update the `@misc` citation in README/`sstim-core.ttl` to
carry the DOI. This is the single biggest "is this a real research artifact?"
signal for FAIRsharing and academic reuse.

---

## Part C — External interlinking strategy (the core question)

### C1 — Decision matrix

| Channel | Do now | Defer | Decline |
|---|---|---|---|
| DBpedia Archivo | ✅ submit URI after B2/B3 | | |
| Wikidata — ontology item | ✅ | | |
| Wikidata — concept `exact match` (P2888) | ✅ for notable, already-aligned concepts | | |
| Wikidata — "SSTIM ID" property | | ⏳ until adoption/notability | |
| Wikidata — new items (Martigli, Symmetry) | | ⏳ until published sources exist | |
| Wikipedia article | | ⏳ until notability | |
| Wikimedia Commons diagrams | optional (CC BY) | | |
| OBO interoperability (BFO/IAO/OBI/RO) | ✅ deepen | | |
| OBO Foundry membership | | | ❌ in current IRI form (ADR-gated future) |
| LOV / prefix.cc / BARTOC | ✅ after B2/B3 | | |
| BioPortal / OLS / OntoBee | ✅ | | |
| FAIRsharing / Zenodo | ✅ | | |

### C2 — Wikidata

**Can we / should we?** Yes, incrementally. Wikidata is CC0, so anything we *add
there* is CC0 — compatible with our CC BY ontology (attribution lives on our side).

- **Ontology item.** Create one Wikidata item for SSTIM: `instance of` (P31)
  *ontology* (verify QID, ~Q324254) and/or *controlled vocabulary*; with
  `official website`, `copyright license` (P275 → CC BY 4.0, verify QID),
  `described at URL`, and namespace. This gives SSTIM a node others can link to.
- **Concept-level `exact match` (P2888).** `sstim-alignments.ttl` already asserts
  `skos:exactMatch`/`closeMatch` *from* SSTIM *to* Wikidata (alpha/theta/etc.,
  binaural beats). The reverse direction — a `P2888` statement *on* the Wikidata
  item pointing back to the sstim IRI — is allowed today (P2888 takes a URL) and
  needs no property proposal. Add these only for clearly-equivalent, notable
  concepts, and only after verifying each QID live.
- **"SSTIM ID" external-identifier property.** A formatter-URL property
  (`https://w3id.org/sstim/vocab#$1`) would make sstim a first-class Wikidata
  identifier, but it requires the property-proposal process and demonstrated
  stable use. **Defer** until SSTIM has external adoption to cite.
- **New concept items** (Martigli oscillation, Symmetry permutation, the ontology
  techniques pending in `alignments.ttl` TODO): **defer** until there are
  independent/published sources — Wikidata notability and the no-original-research
  norm make premature creation risky. Tie this to the eventual paper.

### C3 — DBpedia

DBpedia's core knowledge graph is *extracted from Wikipedia*; there is no
"submit my ontology to DBpedia" path that bypasses Wikipedia. The correct channel
is **DBpedia Archivo** (`archivo.dbpedia.org`): an automated archive that, given a
dereferenceable ontology URI, fetches it, stores every version, runs checks, and
assigns a **4-star rating** (dereferenceable+parses → machine-readable license →
logically consistent → no warnings / good metadata).

Action: once B2 (multi-format dereference) and B3 (license + metadata +
consistency) are done, **submit `https://w3id.org/sstim` to Archivo** and iterate
until 4 stars. Archivo membership is itself a credibility signal and gives SSTIM
permanent versioned snapshots independent of our hosting.

### C4 — Wikimedia (Wikipedia / Commons)

- **Wikipedia article: defer.** Notability requires significant coverage in
  independent reliable secondary sources; a self-authored article on a new
  ontology would likely be challenged as promotional. Revisit after a
  peer-reviewed publication and/or W3C Community Group formation.
- **Wikimedia Commons: optional now.** Class-hierarchy and exposure-model
  diagrams can be uploaded under CC BY 4.0 for reuse in WIDOCO docs and papers.
  Low priority, low risk.

### C5 — OBO Foundry

**Are we linked to OBO? Already, yes — and at the right level.** SSTIM aligns to
**BFO 2020** (the OBO upper ontology) and reuses **IAO/OBI/COB** terms by stable
PURL with `rdfs:subClassOf` (see `sstim-core.ttl` Part 1–6 and `alignments.ttl`).
That *is* OBO interoperability.

**Should we seek full OBO Foundry membership? Not in the current form.** OBO
membership requires conforming to the OBO **identifier policy**: terms must live
at `http://purl.obolibrary.org/obo/SSTIM_NNNNNNN` with a registered IDSPACE and
opaque numeric local IDs. That directly conflicts with SSTIM's deliberate
human-readable w3id IRIs (`sstim:FrequencyBand`), which are a usability value for
the W3C-CG/web audience. Migrating would be a breaking, identity-level change for
marginal benefit at this stage.

Recommended posture:
- **Deepen interoperability now:** use **RO** (Relation Ontology) properties where
  our object properties have RO equivalents; keep IAO/OBI/COB alignments verified;
  add `owl:equivalentClass`/`skos:exactMatch` to OBO terms where genuinely exact.
- **Get OBO-adjacent discoverability** by registering in **OLS** and **OntoBee**
  and **BioPortal** (C6) — you appear next to OBO ontologies without adopting the
  PURL policy.
- **Reserve membership as a future ADR-gated option:** if a biomedical-grade home
  becomes strategically necessary, publish a *dual edition* — keep w3id IRIs as
  canonical and generate an OBO-ID bridge layer
  (`sstim:FrequencyBand owl:equivalentClass obo:SSTIM_0000001`). This preserves
  both audiences. *Proposed ADR 0016 captures the decline-for-now + bridge option.*

### C6 — Public registries (submit after B2/B3 + P5 0.5.0)

| Registry | What it gives | Notes |
|---|---|---|
| **LOV** (Linked Open Vocabularies) | The canonical home for RDF vocabularies; discoverability + term search | Needs `vann:` namespace metadata (B3), dereferenceability (B2), and reuse of known vocabs (we use SKOS/PROV ✓). Submit via their GitHub issue. |
| **prefix.cc** | Registers `sstim` → namespace; tooling auto-resolves the prefix | Quick win; do early. |
| **BARTOC** | Registry of thesauri/ontologies/classifications; good for the SKOS layer | Web form. |
| **BioPortal** (NCBO) | Browsing, REST API, Annotator, **automatic mapping suggestions to MeSH/SNOMED/NCIT** | Bonus: surfaces candidate alignments for IMPROVEMENT_PLAN P4.1. |
| **OLS** (EBI) | OBO-adjacent browser/API | Accepts non-OBO via config; pairs with C5. |
| **OntoBee** | Linked-data server for ontology terms | OBO-adjacent. |
| **FAIRsharing** | Registers SSTIM as a standard; citable record | Pairs with Zenodo DOI (B5). |
| **Zenodo** | Versioned DOIs per release | GitHub integration (B5). |

---

## Part D — Licensing & provenance considerations

- **Ontology license:** CC BY 4.0 (current). Acceptable to OBO and LOV; attribution
  stays with us. Keep it.
- **Wikidata contributions are CC0.** Statements we add to Wikidata (items, P2888
  links) are released CC0 — fine, since the authoritative artifact and attribution
  remain on the SSTIM side. Do not paste CC BY *text* (definitions) wholesale into
  CC0 Wikidata fields; link instead.
- **Provenance discipline:** every external identifier verified live before commit
  (the `0.2.0` erratum exists precisely because unverified QIDs slipped in). Record
  verification date in a comment, as `alignments.ttl` already does.

---

## Part E — Phased rollout

Each phase ships as its own validated PR; semantics-changing phases carry an ADR.

- **Phase 0 — FAIR packaging (no semantics):** B2 (JSON-LD/RDF-XML exports +
  htaccess), B3 (vann/VoID metadata + reasoner consistency check in CI), B4
  (JSON-LD context), B5 (Zenodo DOI). *Unblocks everything; safe to start now.*

  > **Partially delivered — 2026-06-30** (ADR 0016): `scripts/export-ontology.py`
  > + `make export` generate JSON-LD + RDF/XML for all six modules into
  > `dist/ontology/`, wired into the Pages build (non-fatal); `vann:`
  > namespace metadata + `cc:license` added to the ontology node;
  > `static/ontology/context.jsonld` added; `.zenodo.json` added; the Nix
  > devShell now exposes rdflib. **Still open in Phase 0:** the external
  > `.htaccess` `Accept`-routing for the new formats (per
  > [`../ecosystem/w3id`](../ecosystem/w3id/README.md)), a VoID/DCAT dataset
  > description, the WIDOCO HTML branch, a CI DL-consistency (reasoner) check,
  > enabling the GitHub↔Zenodo webhook, and removing `continue-on-error` from
  > the Pages export step after a green CI run.
- **Phase 1 — content coverage:** IMPROVEMENT_PLAN **P5** items 1–3 (visual,
  tactile/cross-modal, neutral tuning) → release **0.5.0**. ADRs for the new
  schemes and the tuning property.
- **Phase 2 — evidence as data:** P5 item 4 (populate `EvidenceClaim` instances +
  cleared references), leveraging the P3 claim-dimension machinery.
- **Phase 3 — registries:** submit to prefix.cc, LOV, BARTOC, BioPortal, OLS,
  OntoBee, FAIRsharing; submit to **DBpedia Archivo**; iterate to 4 stars.
- **Phase 4 — Wikidata:** ontology item + conservative P2888 links; *(later)*
  SSTIM-ID property proposal once there is adoption to cite.
- **Phase 5 — deep biomedical alignment:** P4.1 MeSH/SNOMED (aided by BioPortal
  mapping suggestions), RO relations, OBO-bridge decision (ADR 0016).
- **Deferred:** Wikipedia article; OBO Foundry membership (revisit only via ADR).

Dependency order: **Phase 0 → Phase 1 → (Phase 2 ∥ Phase 3) → Phase 4 → Phase 5.**

---

## Part F — Definition of "first-class" (acceptance criteria)

SSTIM is publicly first-class when:

- the ontology IRI dereferences to **Turtle, RDF/XML, JSON-LD, and HTML** by
  content negotiation, and resolves the same way through w3id;
- it carries complete machine-readable metadata (license, namespace prefix/URI,
  VoID/DCAT) and is **logically consistent** under a DL reasoner in CI;
- each tagged release has a **Zenodo DOI** and a frozen snapshot;
- it is listed in **LOV, prefix.cc, BARTOC, BioPortal, OLS, FAIRsharing**, and
  archived with a **4-star DBpedia Archivo** rating;
- a **Wikidata item** exists and a verified, conservative set of concept
  `exact match` links is in place both directions;
- the domain content gaps (P5 1–3) are released and a starter set of
  `EvidenceClaim` instances (P5.4) is queryable;
- OBO interoperability is documented (BFO/IAO/OBI/RO), with the
  membership/bridge decision recorded in an ADR.

---

## Proposed ADRs (to be created as decisions are taken)

- **ADR 0015 — Visual & cross-modal technique vocabulary** (P5.1–2): scope of the
  visual-entrainment scheme and cross-modal technique typing.
- **ADR 0016 — External publication, OBO posture, and registry strategy:**
  keep human-readable w3id IRIs; decline OBO membership for now; document the
  OBO-ID bridge option; commit to LOV/Archivo/Wikidata channels.
- **ADR 0017 — Neutral tuning vocabulary** (P5.3): `tuningReferenceHz` and the
  scope decision on musical-interval/consonance terms.

(Numbering continues from ADR 0014; confirm the next free number in
[`docs/decisions/README.md`](../decisions/README.md) before creating.)
