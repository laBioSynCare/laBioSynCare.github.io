# SSTIM Publication and External Interlinking Plan

Status: active publication plan. Created 2026-06-30, last reviewed 2026-08-01.
Maintainer: Renato Fabbri. Version facts are derived from
[`void.ttl`](../../static/ontology/void.ttl) and
[`manifest.json`](../../static/ontology/manifest.json), never restated here.

This document owns outward-facing publication, discovery, citation, and
interlinking work. [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) owns internal
ontology maturity and the next semantic release gates.

External identifiers must be checked against an authoritative source before
they enter RDF. Label similarity is not sufficient evidence for an exact or
close mapping.

## Publication State

### Released and citable

- Each release is frozen under `static/ontology/<version>/`, identified by
  `https://w3id.org/sstim/<version>`, and tagged `v<version>`. `void.ttl` names
  the current one and its version DOI.
- All-versions concept DOI:
  [`10.5281/zenodo.21286974`](https://doi.org/10.5281/zenodo.21286974).
- The GitHub-Zenodo integration is enabled for future GitHub releases.
- The stable namespace is `https://w3id.org/sstim`.

### Implemented in the repository

- Turtle is the editable source; `make export` generates JSON-LD and RDF/XML
  for manifest-owned modules and profile entry points and generates the
  manifest-declared namespace catalogs.
- The Pages build validates RDF before publishing generated serializations.
- Module, profile, manifest, schema, and namespace-catalog routing rules are
  maintained in `docs/ecosystem/w3id/sstim/.htaccess`, regenerated per release
  by `scripts/sstim-w3id-snapshot-routes.mjs`.
- `static/ontology/manifest.json` is the authoritative module and profile bill
  of materials. It declares the persistent schema identifier
  `https://w3id.org/sstim/manifest-schema/1`, dependency and profile closures,
  checksums, runtime graphs, and publication artifacts.
- Every module has machine-readable ontology metadata, licensing, dependency,
  ownership, and synchronized release-version information. Every profile entry
  point also uses the W3C Profiles Vocabulary (`prof:Profile`) to advertise its
  specification, constraints where available, and manifest resources.
- `static/ontology/void.ttl` describes the module graph and public instance
  data with VoID/DCAT distributions, examples, vocabularies, and checked counts.
- The core ontology links back to the VoID dataset with `void:inDataset`.
- `static/ontology/context.jsonld` covers the public ontology and instance-data
  surface and is checked against the loader manifest and RDF terms.
- `make validate` integrates Turtle parsing, SHACL, HermiT reasoning,
  repository quality checks, SPARQL competency queries, and graph-isomorphic
  JSON-LD/RDF/XML round trips. The weak Core SHACL contract keeps channel and
  target links optional but requires an asserted channel to be typed
  `sstim-ex:StimulusChannel` and an asserted target to be an IRI or blank node.
- The post-release canonical FOOPS assessment scores 87.5%. Minimum metadata
  and both version-IRI checks pass; the remaining failures depend on public
  prefix and ontology registry discovery.
- `make ontology-docs` generates WIDOCO reference documentation for the
  manifest-defined Full semantic profile (WIDOCO 1.4.25 pinned in the flake;
  the RDF closure is unioned before OWL translation; gap-filling metadata in
  `docs/ontology/widoco.properties`). `pages.yml` publishes it to
  `/ontology/docs/` in the deployed artifact only — never committed (ADR 0023).
  Verified live at `https://labiosyncare.github.io/ontology/docs/` on
  2026-07-11.
- The documentation and the knowledge browser cross-link per term: WIDOCO
  anchors are term local names, and the graph view resolves the same
  `#LocalName` fragments to nodes.

### Still external or deployment-dependent

1. Deploy each release's generated catalogs and profile/schema artifacts, then
   merge and verify the corresponding perma-id rules. The pre-modular route
   matrix was deployed and verified on 2026-07-11 (PR #6337) and the modular one
   on 2026-08-04 (PR #6480). In the finalized contract,
   machine RDF at `/sstim` is the generated Full namespace catalog,
   `/sstim/kernel` is the exact Kernel endpoint, and `/sstim/exposure` is the
   generated Stimulus + Exposure namespace catalog. `/sstim/module/exposure`
   is the separate exact Exposure semantic module distribution and live import
   endpoint. The profile routes, `/sstim/manifest`, and
   `/sstim/manifest-schema/1` must also dereference in their declared
   representations.
2. Submit the stable release URI to selected ontology registries
   ([REGISTRY_SUBMISSIONS.md](REGISTRY_SUBMISSIONS.md)). DBpedia Archivo already
   validates SSTIM ("accessible in 2 formats"); indexing is blocked only by a
   DBpedia-side Databus outage — retry when their infrastructure recovers.
3. Create conservative Wikidata links only after the ontology landing page and
   registry metadata are stable.

Browser requests for the ontology IRI keep resolving to the interactive
knowledge browser, whose hash handling gives every SSTIM term a live graph
view (ADR 0023). Revisit that routing only if a registry review requires
static documentation at the IRI itself; the change is one `.htaccess` rule.

A frozen term-space remains the citable release independently of mutable
development work. Zenodo creates a version DOI from a published GitHub release;
that process must never require rewriting an already published snapshot.

### Ontology snapshot versus release archive

These are two different boundaries:

- `make snapshot VERSION=X.Y.Z` copies the release-prepared, manifest-selected
  modules, shape graphs, profile entry points, manifest, and schema into
  `static/ontology/<version>/` as one byte-identical artifact set;
- publishing the tag as a GitHub release lets the enabled Zenodo integration
  archive the repository state associated with that release and mint its DOI.

Excluding a file from `make snapshot` therefore does **not** prove that it is
absent from the Zenodo release deposit. GitHub describes release source archives
as snapshots of a repository at a tag, while Zenodo ingests enabled GitHub
releases. See the official [GitHub release-archive documentation](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives)
and [Zenodo GitHub integration documentation](https://help.zenodo.org/docs/github/archive-software/github-upload/).

Release rule: this repository may contain reusable terms, public non-personal
implementation data, and explicitly synthetic contract fixtures. Real
ecosystem records in the default mutable/live-only tier must be published from
an external store that is not part of this Zenodo-tracked repository. A real
record may enter an immutable deposit only through the separately implemented
archival-consent pipeline. The release checklist must verify this boundary
before creating a tag.

## Identifier and Version Policy

SSTIM keeps human-readable w3id IRIs such as
`https://w3id.org/sstim#FrequencyBand`. This supports Web and W3C-community
use and is the canonical identifier policy.

Releases are versioned as one ontology set:

- the root Kernel ontology carries the whole-set release `owl:versionIRI`;
- module files carry `owl:versionInfo` but no independent release identity;
- a released manifest carries `immutableRelease` URLs and an exact immutable
  `publication.versionedUrl` for every snapshotted module and profile;
- its `$schema` and `immutableRelease.schemaUrl` identify the frozen versioned
  `manifest.schema.json`, rather than the mutable schema PID;
- released profile entry points import the exact versioned sibling Turtle files
  in their declared semantic closure, never mutable latest-module IRIs;
- their PROF resource descriptors identify the immutable profile entrypoint,
  selected shape artifact, and frozen manifest rather than mutable discovery
  endpoints;
- before release preparation, the live Full profile imports the exact Exposure
  module at `/sstim/module/exposure`, never the aggregate `/sstim/exposure`
  namespace document; its `dct:requires` may still name `/sstim/exposure` as
  the logical ontology identifier;
- `static/ontology/<version>/` is the immutable, citable whole-set snapshot;
- generated JSON-LD/RDF/XML files are serializations, not independent sources;
- the Zenodo version DOI identifies the complete deposited GitHub release
  archive, within which `static/ontology/<version>/` is the authoritative
  term-set snapshot; and
- the concept DOI identifies the continuing project.

See [ADR 0020](../decisions/0020-whole-set-snapshot-versioning.md).

## Content Negotiation and Documentation

The finalized modular behavior is below. A development line's routes stay staged
until its generated Pages artifacts and matching perma-id rules are deployed and
verified.

| Request | Machine-readable representation | HTML representation |
|---|---|---|
| `/sstim` | Generated Full semantic namespace catalog in negotiated Turtle, JSON-LD, or RDF/XML | BSC Lab knowledge browser; term fragments select graph nodes |
| `/sstim/kernel` | Exact Kernel (`sstim-core`) in the negotiated RDF syntax | WIDOCO documentation |
| `/sstim/exposure` | Generated Stimulus + Exposure namespace catalog in the negotiated RDF syntax | WIDOCO documentation |
| `/sstim/module/exposure` | Exact Exposure semantic module (`sstim-exposure`) in the negotiated RDF syntax; mutable distribution/import endpoint | WIDOCO documentation |
| `/sstim/profile/{kernel,core,core-plus,full}` | PROF-enabled profile entry point in the negotiated RDF syntax | WIDOCO documentation |
| `/sstim/manifest` | JSON suite manifest | Not a separate HTML contract |
| `/sstim/manifest-schema/1` | JSON Schema for the manifest | Not a separate HTML contract |
| Other `/sstim/<module-slug>` routes | Exact concern, bridge, vocabulary, alignment, or shape module in the negotiated RDF syntax | WIDOCO documentation |

`/sstim/exposure` is a namespace document and must not appear as the Exposure
module's `owl:imports` target. The live Full profile uses
`/sstim/module/exposure`; a released Full profile uses the corresponding
immutable versioned sibling Turtle file. A `dct:requires` reference to the
logical `/sstim/exposure` ontology identifier is not a retrieval import.

WIDOCO reference documentation is published at
`https://labiosyncare.github.io/ontology/docs/` and cross-linked with the
knowledge browser rather than being the redirect target (ADR 0023).

The generated RDF targets must be deployed before the external w3id rule is
merged. After deployment, verify the namespace catalogs, exact Kernel, every
exact module distribution endpoint (including `/sstim/module/exposure`), every
profile IRI, manifest and schema PID, versioned IRI, and `/sstim/void` with
explicit `Accept` headers and redirect checks.

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

### Phases 1–3: modular mechanics, release, and routes — done

The modular publication mechanics, the first modular release, and the deployed
route matrix all landed by 2026-08-04. `make release-dryrun` (part of
`make validate`) keeps rehearsing the sequence continuously, which is what
prevents these steps from silently rotting between releases. The recurring
per-release procedure is in
[`static/ontology/README.md`](../../static/ontology/README.md#versioning-and-publication);
it is not duplicated here.

### Phase 4: registries and knowledge-graph links

- Submit prefix.cc, LOV, BARTOC, BioPortal, OLS, and FAIRsharing records.
- Submit to DBpedia Archivo and address actionable quality findings.
- Register with OpenAIRE when an eligible gateway record is accepted.
- Store submission URLs, dates, record identifiers, and status in the repo.
- Create the SSTIM ontology item in Wikidata.
- Add reciprocal mappings only for released terms with verified equivalence.
- Review candidate biomedical mappings with a domain/ontology expert.

## Publication Acceptance Criteria

SSTIM is first-class for public reuse when:

- the namespace documents, exact module distribution endpoints, and profiles
  dereference through w3id to Turtle, JSON-LD, RDF/XML, and stable HTML as
  requested;
- `/sstim` serves the generated Full namespace catalog, `/sstim/kernel` serves
  the exact Kernel, and `/sstim/exposure` serves the generated two-module
  namespace catalog in machine-readable negotiations, while
  `/sstim/module/exposure` serves only the exact Exposure semantic module;
- generated serializations parse and represent the same source graphs;
- SHACL, OWL reasoning, quality, and competency audits run in CI;
- every released profile has a nonempty positive fixture and at least one
  executable competency query; each profile with a nonempty SHACL closure also
  has nonempty out-of-scope and adversarial fixtures;
- machine-readable metadata includes creator, license, namespace, version,
  DOI, provenance, distributions, and checked graph counts;
- every release has an immutable snapshot, Git tag, changelog entry, and Zenodo
  version DOI under the same concept DOI;
- every released manifest advertises immutable versioned artifact URLs, and
  each released profile imports only its exact versioned sibling closure;
- every release audits the complete tagged repository state and contains no
  private ledger or real ecosystem record from the mutable/live-only tier;
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
