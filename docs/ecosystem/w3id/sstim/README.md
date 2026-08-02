# sstim — Sensory Stimulation Ontology

Persistent identifiers for **SSTIM**, an OWL ontology with a companion
SKOS vocabulary and SHACL validation shapes describing sensory
stimulation protocols (auditory, visual, haptic), their parameters, and
evidence chains. Developed in the open-source
[BSC Lab](https://github.com/laBioSynCare/laBioSynCare.github.io) project.

- **Base PID:** <https://w3id.org/sstim>
- **Target:** <https://labiosyncare.github.io/ontology/>

## Maintainer

**Renato Fabbri** — GitHub [@ttm](https://github.com/ttm) —
renato.fabbri@gmail.com —
ORCID [0000-0002-9699-629X](https://orcid.org/0000-0002-9699-629X)

Future PRs touching `sstim/` will be authored or approved by
[@ttm](https://github.com/ttm).

## Routes

As of 2026-08-02, every GitHub Pages target named by this `.htaccess` is
deployed and returns `200` — the namespace catalogues, the four profile entry
points, all newly extracted modules, `manifest.json`, and
`manifest.schema.json`, in Turtle, JSON-LD, and RDF/XML. The registry itself
still carries the pre-modular rules: the root and `exposure` routes resolve to
single files rather than generated catalogues, and the snapshot rules are
regex wildcards. [perma-id/w3id.org#6480](https://github.com/perma-id/w3id.org/pull/6480)
submits this file; until it merges, the two differ in the registry's
direction, not in missing targets.

`0.12.0` remains the latest immutable release. Top-level sources are the mutable
`0.13.0-dev` line and must not be confused with a released snapshot.

**Copy `.htaccess` to the registry verbatim; do not copy this README.** The
registry's `sstim/README.md` is a trimmed version of this file. perma-id asks
that submissions carry "redirects and basic information" only, so the registry
copy keeps the maintainer block, route table, and negotiation rules, and drops
this file's `make` commands, script paths, and registry-state tracking, which
describe how BSC Lab produces the targets rather than how the redirects behave.

| PID | Content | Registry state |
|---|---|---|
| `/sstim` | RDF: generated Full namespace catalogue `sstim-namespace.{ttl,jsonld,rdf}` for dereferencing `sstim:` hash terms; HTML: human documentation | Route live with the pre-modular RDF target; catalogue deployed, perma-id update open |
| `/sstim/kernel` | Exact small Kernel distribution `sstim-core.{ttl,jsonld,rdf}` | Target deployed; perma-id update open |
| `/sstim/exposure` | Generated Stimulus + Exposure catalogue `sstim-exposure-namespace.{ttl,jsonld,rdf}`, preserving dereference of the moved `exposure#StimulusChannel` term | Route live with the pre-modular target; catalogue deployed, perma-id update open |
| `/sstim/module/exposure` | Exact Exposure semantic module and development-profile import distribution `sstim-exposure.{ttl,jsonld,rdf}` | Target deployed; perma-id update open |
| `/sstim/{vocab,shapes,alignments,patch-studio,ecosystem}` | Previously published module distributions | Live |
| `/sstim/{stimulus,core-shapes,common,technique,configuration,session,evidence,neuromodulation,neuromodulation-evidence,evidence-exposure,technique-exposure}` | Manifest-owned `0.13.0-dev` modules | Target deployed; perma-id update open |
| `/sstim/manifest` | Authoritative JSON bill of materials | Target deployed; perma-id update open |
| `/sstim/manifest-schema/1` | Version 1 JSON Schema, with identity `https://w3id.org/sstim/manifest-schema/1` | Target deployed; perma-id update open |
| `/sstim/profile/{kernel,core,core-plus,full}` | OWL entry points with W3C PROF metadata for manifest and applicable-shape discovery | Target deployed; perma-id update open |
| `/sstim/framework/bsc` | BSC framework catalog record | Staged locally |
| `/sstim/implementation/{bsclab,biosyncare}` | Application catalog records | Staged locally |
| `/sstim/implementation/bsclab/component/patch-studio` | Patch Studio software-component catalog record | Staged locally |
| `/sstim/specialist/{id}` and `/sstim/organization/{id}` namespaces (`synthetic-*` excluded) | Mutable live-only ecosystem projection | Staged locally |
| `/sstim/ecosystem-record/{relationship,activity,role}/{id}` namespaces (`synthetic-*` excluded) | Mutable live-only ecosystem projection | Staged locally |
| `/sstim/void` | VoID + DCAT dataset description (Turtle only) | Live |
| `/sstim/{major.minor.patch}` and `/sstim/{major.minor.patch}/{file.ttl}` | Versioned immutable snapshot root and Turtle files | Live |
| `/sstim/{major.minor.patch}/manifest` | The manifest frozen with a modular release | Generated only for snapshots containing `manifest.json`; absent from `0.12.0` and earlier |
| `/sstim/{major.minor.patch}/manifest.schema.json` | The schema frozen beside a modular release manifest | Generated only for snapshots containing `manifest.schema.json`; absent from `0.12.0` and earlier |

The namespace, Kernel, module, and profile routes negotiate JSON-LD
(`application/ld+json`), RDF/XML (`application/rdf+xml`), HTML, and Turtle
(`text/turtle`, `application/x-turtle`, `*/*`, or no `Accept`) in that explicit
precedence. Matching is case-insensitive, `q=0` ranges are not acceptable, and
requests with no acceptable supported range receive `406 Not Acceptable`. The
precedence is deterministic server ordering, not full ranking by positive `q`
magnitude; clients that require one representation should request that media
type alone. The manifest and schema are JSON; VoID and frozen Turtle files are
not multi-format. `Header always set Vary "Accept"` makes every negotiated 303
response emit `Vary: Accept`, preventing a cache from serving an HTML
representation to an RDF client or vice versa. HTML requests go to human-facing
documentation or the application.

`make export` generates both namespace catalogues from the manifest:
`sstim-namespace.{ttl,jsonld,rdf}` is the Full semantic union, while
`sstim-exposure-namespace.{ttl,jsonld,rdf}` is the Stimulus + Exposure union.
They exist for namespace discovery and must not be used as exact import
closures. Fragment IRIs such as `/sstim#Preset` resolve to the Full catalogue
even when another manifest-owned module owns their statements. The exact
two-class Kernel is `/sstim/kernel`. Likewise, `/sstim/exposure` is the Exposure
namespace catalogue, while `/sstim/module/exposure` retrieves only the exact
Exposure semantic module and is the endpoint used by mutable development
profile imports. Consumer closures are selected through
`/sstim/profile/{kernel,core,core-plus,full}`.

Each profile entry point is both an OWL ontology and a W3C Profiles Vocabulary
(`prof:`) profile. Its resource descriptors make the authoritative manifest
and, where applicable, the Core or Full SHACL graph discoverable without
silently importing validation policy into the OWL closure.

For modular releases, release preparation gives every profile exact versioned
sibling `owl:imports` and makes `manifest.json` advertise immutable artifact
URLs. `make snapshot` verifies those conditions and copies the prepared
modules, profiles, manifest, and schema byte-for-byte. Thus a frozen profile
cannot acquire later module changes. This applies to future modular snapshots;
the already-published `0.12.0` snapshot remains unchanged and has no frozen
manifest route. The checked snapshot-route region is generated only from files
that actually exist under `static/ontology/<version>/`, including exact
`manifest` and `manifest.schema.json` routes for future modular releases;
unknown versions and artifact names remain 404.

All staged Pages targets—including both namespace catalogues, Kernel formats,
the exact Exposure module formats, other modules, profiles, manifest, and
schema—must be generated, deployed, and tested before the corresponding
`.htaccess` update is submitted to perma-id. Verify the complete route ×
`Accept` matrix and the `Vary: Accept` response header.

This gate was satisfied on 2026-08-02: every target named above was confirmed
to return `200` from `https://labiosyncare.github.io/ontology/` in Turtle,
JSON-LD, and RDF/XML before the perma-id update was opened. The negotiation
matrix and `Vary: Accept` can only be checked once the registry rules are
merged, since w3id.org performs the negotiation; that verification belongs to
the merge, not to this repository.

Audited static catalog routes send RDF clients to the owning Turtle instance
file. General live ecosystem namespace rules send RDF clients to the mutable,
live-only `current.ttl` projection. Current synthetic contract subjects reserve
a `synthetic-*` slug rejected by those rules and are available only through the
direct fixture artifact; there are no fixture-specific routes. HTML requests
reach the project landing page for static catalog and live ecosystem
identifiers. The frozen SSTIM `0.12.0` snapshot remains unchanged.

Dataset membership belongs to the live RDF projection, not the registry
configuration. Adding, correcting, or retracting a record therefore does not
require a person-specific w3id.org rule change. A syntactically valid but
unknown path may reach the aggregate, but it describes no resource unless the
requested IRI occurs as a subject in the current projection. Retraction removes
that subject and its approved public statements; it cannot erase third-party
caches or previously downloaded copies. The mutable projection is not part of
a Zenodo ontology snapshot and carries no archival-consent implication.

Redirect issues: open an issue at
<https://github.com/laBioSynCare/laBioSynCare.github.io/issues>.
