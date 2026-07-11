# SSTIM Publication and External Interlinking Plan

Status: active publication plan

Current citable release: SSTIM `0.6.0`

Next development line: not yet opened

Created: 2026-06-30

Last reviewed: 2026-07-11

Maintainer: Renato Fabbri

This document owns outward-facing publication, discovery, citation, and
interlinking work. [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) owns internal
ontology maturity and the next semantic release gates.

External identifiers must be checked against an authoritative source before
they enter RDF. Label similarity is not sufficient evidence for an exact or
close mapping.

## Publication State

### Released and citable

- SSTIM `0.6.0` is frozen under `static/ontology/0.6.0/`, identified by
  `https://w3id.org/sstim/0.6.0`, and tagged `v0.6.0`.
- Version DOI: [`10.5281/zenodo.21302910`](https://doi.org/10.5281/zenodo.21302910).
- All-versions concept DOI:
  [`10.5281/zenodo.21286974`](https://doi.org/10.5281/zenodo.21286974).
- The GitHub-Zenodo integration is enabled for future GitHub releases.
- The stable namespace is `https://w3id.org/sstim`.

### Implemented in the repository

- Turtle is the editable source; `make export` generates JSON-LD and RDF/XML
  for all six modules.
- The Pages build validates RDF before publishing generated serializations.
- Core and module routing rules for Turtle, JSON-LD, and RDF/XML are staged in
  `docs/ecosystem/w3id/sstim/.htaccess`.
- Every module has machine-readable ontology metadata, licensing, dependency,
  and synchronized release-version information.
- `static/ontology/void.ttl` describes the module graph and public instance
  data with VoID/DCAT distributions, examples, vocabularies, and checked counts.
- The core ontology links back to the VoID dataset with `void:inDataset`.
- `static/ontology/context.jsonld` covers the public ontology and instance-data
  surface and is checked against the loader manifest and RDF terms.
- `make validate` integrates Turtle parsing, SHACL, HermiT reasoning,
  repository quality checks, SPARQL competency queries, and graph-isomorphic
  JSON-LD/RDF/XML round trips.
- The post-release canonical FOOPS assessment scores 87.5%. Minimum metadata
  and both version-IRI checks pass; the remaining failures depend on public
  prefix and ontology registry discovery.
- `make ontology-docs` generates WIDOCO reference documentation for the core
  module (WIDOCO 1.4.25 pinned in the flake; gap-filling metadata in
  `docs/ontology/widoco.properties`). `pages.yml` publishes it to
  `/ontology/docs/` in the deployed artifact only — never committed (ADR 0023).
  Verified live at `https://labiosyncare.github.io/ontology/docs/` on
  2026-07-11.
- The documentation and the knowledge browser cross-link per term: WIDOCO
  anchors are term local names, and the graph view resolves the same
  `#LocalName` fragments to nodes.

### Still external or deployment-dependent

1. Merge the perma-id/w3id.org routing update after all target files are live on
   GitHub Pages, then test content negotiation through `w3id.org`.
2. Submit the stable release URI to selected ontology registries.
3. Create conservative Wikidata links only after the ontology landing page and
   registry metadata are stable.

Browser requests for the ontology IRI keep resolving to the interactive
knowledge browser, whose hash handling gives every SSTIM term a live graph
view (ADR 0023). Revisit that routing only if a registry review requires
static documentation at the IRI itself; the change is one `.htaccess` rule.

The `0.6.0` term-space is released independently of WIDOCO and registry
submission. Zenodo creates its version DOI from the GitHub release; the DOI is
then added to live publication metadata without rewriting the frozen snapshot.

## Identifier and Version Policy

SSTIM keeps human-readable w3id IRIs such as
`https://w3id.org/sstim#FrequencyBand`. This supports Web and W3C-community
use and is the canonical identifier policy.

Releases are versioned as one ontology set:

- the core ontology carries the release `owl:versionIRI`;
- module files carry `owl:versionInfo` but no independent release identity;
- `static/ontology/<version>/` is the immutable, citable whole-set snapshot;
- generated JSON-LD/RDF/XML files are serializations, not independent sources;
- the Zenodo version DOI identifies the released archive and the concept DOI
  identifies the continuing project.

See [ADR 0020](../decisions/0020-whole-set-snapshot-versioning.md).

## Content Negotiation and Documentation

The intended stable behavior is:

| Request | Representation |
|---|---|
| `Accept: text/turtle` | Turtle source |
| `Accept: application/ld+json` | generated JSON-LD |
| `Accept: application/rdf+xml` | generated RDF/XML |
| browser / HTML | BSC Lab knowledge browser (interactive; term fragments select graph nodes) |

WIDOCO reference documentation is published at
`https://labiosyncare.github.io/ontology/docs/` and cross-linked with the
knowledge browser rather than being the redirect target (ADR 0023).

The generated RDF targets must be deployed before the external w3id rule is
merged. After deployment, verify the core IRI, every module IRI, the versioned
IRI, and `/sstim/void` with explicit `Accept` headers and redirect checks.

WIDOCO output must be reproducible in CI and must not be edited manually. The
documentation should expose:

- ontology metadata and citation;
- class and property documentation;
- SKOS schemes and concepts;
- imported/reused vocabularies;
- diagrams where they remain readable;
- license and provenance;
- links to SHACL, VoID, frozen versions, and source control.

## Registry Strategy

Registries should receive a released ontology URI, not a development branch.
Submissions follow successful WIDOCO and w3id verification.

| Channel | Decision | Purpose / constraint |
|---|---|---|
| DBpedia Archivo | Submit | External archiving and automated ontology-quality feedback. |
| LOV | Submit | Vocabulary discovery and term search; requires stable dereferencing and metadata. |
| prefix.cc | **Done** | Public prefix-to-namespace lookup (`sstim` registered). |
| BARTOC | Submit | Discovery for the SKOS terminology layer. |
| BioPortal | Submit | Biomedical browsing, APIs, and candidate mapping discovery. |
| OLS | Submit if accepted | OBO-adjacent browsing without changing SSTIM identifiers. |
| FAIRsharing | Submit | FAIR standard/resource registration linked to the DOI. |
| OpenAIRE | Submit after an accepted gateway record | Broader research-output discovery. |
| Wikidata | Incremental | One ontology item, then conservative term links. |
| Wikipedia | Defer | Requires independent secondary-source notability. |
| OBO Foundry membership | Decline for now | Current human-readable IRIs do not follow the OBO numeric identifier policy. |

Registry records must use the stable ontology URI, concept DOI, current release
DOI, CC BY 4.0 ontology license, creator ORCID, source repository, release date,
and the exact released version. These values, the per-registry intake notes, and
the submission-status records live in
[REGISTRY_SUBMISSIONS.md](REGISTRY_SUBMISSIONS.md).

## External Mapping Policy

### Wikidata

Create one item for SSTIM only after the HTML landing page is stable. Include
the official website, ontology type, license, DOI, repository, and namespace
using verified property/item identifiers.

Term-level mappings follow these rules:

- `skos:exactMatch` only when identity is defensible in both directions;
- `skos:closeMatch` when the concepts can be used similarly but differ in
  extension or modeling granularity;
- `skos:relatedMatch` for a useful thematic relationship without equivalence;
- no reverse Wikidata statement until the SSTIM term is released and stable;
- record the verification date and authoritative source in the alignment file.

Do not create Wikidata items for project-specific techniques merely to obtain a
mapping target. Independent published sources and notability must come first.

### Biomedical ontologies

SSTIM reuses BFO, IAO, OBI, and COB terms by stable PURL where their semantics
fit. This is interoperability, not OBO Foundry membership.

Future MeSH, SNOMED CT, NCIt, or other biomedical mappings must be individually
verified. The previous MeSH `D012910` candidate was rejected on 2026-07-10
because the official NLM record identifies it as *Snake Venoms*. SSTIM asserts
no general MeSH mapping for sensory stimulation until a valid target is found.

BioPortal mapping suggestions may identify candidates, but suggestions are a
review queue rather than evidence for an RDF assertion. Licensing constraints
must also be checked before adding mappings.

If OBO membership later becomes strategically important, evaluate a generated
bridge rather than replacing canonical SSTIM IRIs. Any equivalent-class bridge
requires an ADR, migration analysis, and external ontology review.

### DBpedia and Wikimedia

DBpedia core is derived from Wikimedia content; it is not the submission path
for a standalone ontology. DBpedia Archivo is the appropriate ontology archive
and quality channel.

Defer a Wikipedia article until independent reliable sources establish
notability. Reusable diagrams may be published to Wikimedia Commons under CC BY
4.0 after their terminology matches a released SSTIM version.

## Rollout

### Phase 1: release 0.6

- Complete the modeling, maintainer review, and automated validation recorded
  in `IMPROVEMENT_PLAN.md` and ADR 0022.
- Freeze `static/ontology/0.6.0/` from the validated live modules.
- Update version, citation, VoID, and documentation metadata together.
- Tag and publish the GitHub release; verify the new Zenodo version record.

### Phase 2: complete FAIR deployment

- Deploy generated RDF serializations and the checked VoID description.
- Publish reproducible WIDOCO HTML.
- Merge and verify the staged w3id routing changes.

### Phase 3: registries

- Submit prefix.cc, LOV, BARTOC, BioPortal, OLS, and FAIRsharing records.
- Submit to DBpedia Archivo and address actionable quality findings.
- Register with OpenAIRE when an eligible gateway record is accepted.
- Store submission URLs, dates, record identifiers, and status in the repo.

### Phase 4: knowledge-graph links

- Create the SSTIM ontology item in Wikidata.
- Add reciprocal mappings only for released terms with verified equivalence.
- Review candidate biomedical mappings with a domain/ontology expert.

## Publication Acceptance Criteria

SSTIM is first-class for public reuse when:

- the ontology and every module dereference through w3id to Turtle, JSON-LD,
  RDF/XML, and stable HTML as requested;
- generated serializations parse and represent the same source graphs;
- SHACL, OWL reasoning, quality, and competency audits run in CI;
- machine-readable metadata includes creator, license, namespace, version,
  DOI, provenance, distributions, and checked graph counts;
- every release has an immutable snapshot, Git tag, changelog entry, and Zenodo
  version DOI under the same concept DOI;
- WIDOCO documentation and citation instructions identify the current release;
- accepted registry records link to the stable ontology URI and current DOI;
- external mappings are conservative, source-verified, and review-dated;
- no public metadata implies clinical efficacy or exposes private participant or
  BioSynCare catalog data.

## Submission Record Template

For each external service, record:

```text
Service:
Submitted URL:
Submitted version:
Release DOI:
Date:
Account/maintainer:
External record ID or URL:
Status:
Required follow-up:
```

This makes publication state auditable and prevents repository documentation
from claiming an external registration before it is accepted and live.
