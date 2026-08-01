# Publishing SSTIM at `w3id.org/sstim`

This folder mirrors the content-negotiation configuration for the persistent
namespace `https://w3id.org/sstim`. It is **not** served by this repository —
the live copy is maintained in the
[`perma-id/w3id.org`](https://github.com/perma-id/w3id.org) registry.

As of 2026-08-01, the live registry serves the root, `vocab`, `shapes`,
`alignments`, `patch-studio`, `exposure`, `ecosystem`, `void`, and versioned
snapshot Turtle routes. The earlier
[perma-id/w3id.org#6337](https://github.com/perma-id/w3id.org/pull/6337) update is
merged; it is no longer pending. `0.12.0` is the latest immutable release.

The audited `0.13.0-dev` block in [`sstim/.htaccess`](sstim/.htaccess) is
**staged locally, not live in the registry**. It adds the manifest, manifest
schema, four profile entry points, Stimulus, every newly extracted concern and
bridge module, Core shapes, and a manifest inside future versioned snapshots.
It also changes RDF negotiation at `/sstim` from the old monolithic
distribution to the generated Full namespace catalogue and adds `/sstim/kernel`
as the exact, small Kernel distribution. It changes `/sstim/exposure` to the
generated Exposure namespace catalogue and adds `/sstim/module/exposure` as the
exact Exposure module distribution and development import endpoint. Direct
checks currently return 404 for `/sstim/manifest`, `/sstim/profile/core`, and
`/sstim/common`; their GitHub Pages targets also return 404. Deploy and verify
all targets first, then submit a new perma-id update. Top-level ontology files
are mutable `0.13.0-dev` sources and are not a replacement citation for frozen
`0.12.0`.

The same staging copy carries audited exact routes for stable BSC catalog
identities plus live-ecosystem namespace rules for the mutable real-agent
aggregate. Those also still require a registry update. Synthetic contract
subjects reserve a `synthetic-*` slug and remain available only through their
direct test artifact; they intentionally have no fixture-specific routes.

> Prerequisite for future routes: GitHub Pages must serve each redirect target
> before the matching w3id rule is merged.

## What gets published where

| Persistent IRI | Resolves to (GitHub Pages) | Registry state |
|---|---|---|
| `https://w3id.org/sstim` (RDF `Accept`) | `/ontology/sstim-namespace.{ttl,jsonld,rdf}`, a generated catalogue of the Full semantic profile for `sstim:` hash-term discovery | Root route live with the pre-modular target; catalogue target staged |
| `https://w3id.org/sstim` (browser) | `/` knowledge browser | Live |
| `/sstim/kernel` | `/ontology/sstim-core.{ttl,jsonld,rdf}`, the exact dependency-free Kernel distribution | Staged; target deployment and registry update required |
| `/sstim/exposure` | `/ontology/sstim-exposure-namespace.{ttl,jsonld,rdf}`, the generated Stimulus + Exposure catalogue needed to dereference `exposure#StimulusChannel` after its declaration moved to Stimulus | Route live with the pre-modular target; catalogue target staged |
| `/sstim/module/exposure` | `/ontology/sstim-exposure.{ttl,jsonld,rdf}`, the exact Exposure semantic module, distribution, and development-profile import endpoint | Staged; target deployment and registry update required |
| `/sstim/{vocab,shapes,alignments,patch-studio,ecosystem}` | `/ontology/sstim-{id}.{ttl,jsonld,rdf}` by `Accept` | Live |
| `/sstim/{stimulus,core-shapes,common,technique,configuration,session,evidence,neuromodulation,neuromodulation-evidence,evidence-exposure,technique-exposure}` | `/ontology/sstim-{id}.{ttl,jsonld,rdf}` by `Accept` | Staged; target deployment and registry update required |
| `/sstim/profile/{kernel,core,core-plus,full}` | `/ontology/sstim-{profile}-profile.{ttl,jsonld,rdf}` by `Accept`; W3C PROF metadata identifies the profile and discovers its manifest and applicable shape graph | Staged; target deployment and registry update required |
| `/sstim/manifest` | `/ontology/manifest.json` | Staged; target deployment and registry update required |
| `/sstim/manifest-schema/1` | `/ontology/manifest.schema.json`, whose JSON Schema identity is `https://w3id.org/sstim/manifest-schema/1` | Staged; target deployment and registry update required |
| `https://w3id.org/sstim/framework/bsc` | `/ontology/instances/frameworks/bsc.ttl` | Staged locally |
| `https://w3id.org/sstim/implementation/bsclab` | `/ontology/instances/implementations/implementations.ttl` | Staged locally |
| `https://w3id.org/sstim/implementation/biosyncare` | `/ontology/instances/implementations/implementations.ttl` | Staged locally |
| `https://w3id.org/sstim/implementation/bsclab/component/patch-studio` | `/ontology/instances/implementations/implementations.ttl` | Staged locally |
| `/specialist/{id}`, `/organization/{id}`, and `/ecosystem-record/{relationship,activity,role}/{id}` live namespaces (`synthetic-*` excluded) | `https://biosyncare-lab.web.app/current.ttl` | Staged locally |
| `https://w3id.org/sstim/void` | `/ontology/void.ttl` (VoID + DCAT dataset description) | Live |
| `https://w3id.org/sstim/0.12.0` | `/ontology/0.12.0/sstim-core.ttl` (frozen) | Live |
| `https://w3id.org/sstim/0.12.0/sstim-core.ttl` | `/ontology/0.12.0/sstim-core.ttl` (frozen) | Live |
| `/sstim/{version}/manifest` | `/ontology/{version}/manifest.json` | Added exactly when that frozen modular snapshot contains `manifest.json`; absent from `0.12.0` and earlier |
| `/sstim/{version}/manifest.schema.json` | `/ontology/{version}/manifest.schema.json` | Added exactly when that frozen modular snapshot contains the schema sibling; absent from `0.12.0` and earlier |

Immutable version snapshots are produced by `make snapshot`
(see [`scripts/snapshot-ontology.mjs`](../../../scripts/snapshot-ontology.mjs)).
Existing snapshot directories are protected; use `make snapshot FORCE=1` only
to correct an unpublished snapshot. The version root
`https://w3id.org/sstim/<version>` is the ontology's `owl:versionIRI` and
redirects to the frozen `sstim-core.ttl` document for that version. Beginning
with the modular release line, the snapshot inventory comes from
`static/ontology/manifest.json`, and the manifest and its schema are frozen
beside the Turtle files. The staged `/sstim/<version>/manifest` rule exposes
that version-specific bill of materials, while
`/sstim/<version>/manifest.schema.json` exposes the schema frozen beside it.
Neither route retroactively exists for `0.12.0`. Release preparation must first
replace every profile import with its exact versioned sibling URL and make the
manifest advertise immutable artifact URLs. The snapshotter verifies those
conditions, then copies the prepared modules, profiles, manifest, and schema
byte-for-byte; it does not rewrite imports after hashing. Snapshot redirects are
generated from the files actually present under `static/ontology/<version>/`;
unknown versions and filenames remain 404. Run
`node scripts/sstim-w3id-snapshot-routes.mjs --write` after cutting a snapshot,
then commit and review the changed exact-route region.

Namespace catalogues are generated publication artifacts, not profile imports.
`make export` forms `sstim-namespace.{ttl,jsonld,rdf}` from the Full semantic
closure and `sstim-exposure-namespace.{ttl,jsonld,rdf}` from Stimulus +
Exposure. `/sstim/exposure` serves that namespace catalogue;
`/sstim/module/exposure` serves only `sstim-exposure` and is the exact
distribution used by mutable development profile imports. Profile entry points
use W3C Profiles Vocabulary (`prof:`) metadata to expose their specification,
authoritative manifest, and applicable SHACL constraints where a shape graph
exists.

## Updating the registry rules

1. Fork [`perma-id/w3id.org`](https://github.com/perma-id/w3id.org).
2. Create or update the directory `sstim/` at the repository root.
3. Copy [`sstim/.htaccess`](sstim/.htaccess) from this folder into it, keeping
   any already-live rules that are still valid.
4. Run `node scripts/sstim-w3id-snapshot-routes.mjs --check`; a new frozen
   snapshot must update the exact generated route region before publication.
5. Open a PR. Keep the change scoped strictly to the new `sstim/` directory —
   the maintainers reject PRs that touch other namespaces.
6. Write the PR description on top of the upstream template
   (`.github/PULL_REQUEST_TEMPLATE.md` in `perma-id/w3id.org`); the
   maintainers expect its structure (requested by @dgarijo on
   [PR #6378](https://github.com/perma-id/w3id.org/pull/6378)). Keep the
   template's sections and tick the checklists that apply: **Brief
   Description**, the **General Checklist** (changes tested, minimal/squashed
   commits, redirects-only content), and the **New** or **Update ID
   Directory Checklist** (maintainer GitHub usernames listed in `.htaccess`
   or `README.md`; the submitting account is one of those maintainers).
7. In the Brief Description, state the redirect targets and that the
   namespace is for an OWL/SKOS ontology with a public CC BY 4.0 license.

After the PR merges, keep this staging copy and the live `.htaccess` in sync.
Any change to the Pages layout, new module file, or new ontology version means
updating both copies.

## Verifying after merge

```bash
# The live 0.12-era root route resolves; after the modular registry update its
# RDF target must be sstim-namespace.ttl, not sstim-core.ttl
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim | grep -iE 'location|content-type|vary'

# The live root browser branch goes to the knowledge browser
curl -sIL -H 'Accept: text/html' https://w3id.org/sstim | grep -iE 'location|vary'

# Currently live module and versioned snapshot routes resolve
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/vocab        | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/patch-studio | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/exposure     | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/ecosystem    | grep -i location
curl -sIL https://w3id.org/sstim/0.12.0/sstim-core.ttl                 | grep -i location

# Run these only after the Pages targets deploy and the new perma-id PR merges
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim              | grep -i 'sstim-namespace.ttl'
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/kernel       | grep -i 'sstim-core.ttl'
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/exposure     | grep -i 'sstim-exposure-namespace.ttl'
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/module/exposure | grep -i '/sstim-exposure.ttl'
curl -sIL https://w3id.org/sstim/manifest                              | grep -iE 'location|content-type'
curl -sIL https://w3id.org/sstim/manifest-schema/1                     | grep -iE 'location|content-type'
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/profile/core | grep -iE 'location|vary'
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/common       | grep -iE 'location|vary'
curl -sIL https://w3id.org/sstim/0.13.0/manifest                       | grep -iE 'location|content-type'

# Round-trip parse check (n3 / rapper / riot)
curl -sL -H 'Accept: text/turtle' https://w3id.org/sstim | rapper -i turtle -c -
```

## Multi-format content negotiation (JSON-LD + RDF/XML)

The Pages build generates `*.jsonld` and `*.rdf` (RDF/XML) beside each
manifest-owned Turtle source and profile entry point via `make export`
(`scripts/export-ontology.py`, rdflib). Turtle stays the editable master; the
exports exist only so the namespace can content-negotiate other formats. The
same command generates the root Full namespace catalogue and the Stimulus +
Exposure namespace catalogue in all three RDF formats. The staging
[`sstim/.htaccess`](sstim/.htaccess) includes `Accept` branches for the root,
Kernel, the Exposure namespace catalogue, the exact Exposure module, every
other manifest module, and all four profiles
(`application/ld+json` → `.jsonld`, `application/rdf+xml` → `.rdf`, HTML →
documentation, and `text/turtle`, `application/x-turtle`, `*/*`, or no
`Accept` → Turtle). Matching is case-insensitive; an explicitly unacceptable
`q=0` range is skipped, and a request with no acceptable supported range gets
`406 Not Acceptable`. When several supported ranges are present, the explicit
staged precedence is JSON-LD, RDF/XML, HTML, then Turtle/wildcard. This is
deterministic server precedence, not full ranking by positive `q` magnitude;
clients that require one representation should request that media type alone:

```apache
# Apply to 303 responses as well as successful content responses.
Header always set Vary "Accept"

# Accept: application/ld+json → JSON-LD export
RewriteCond %{HTTP_ACCEPT} application/ld\+json
RewriteRule ^$ https://labiosyncare.github.io/ontology/sstim-namespace.jsonld [R=303,L]

# Accept: application/rdf+xml → RDF/XML export
RewriteCond %{HTTP_ACCEPT} application/rdf\+xml
RewriteRule ^$ https://labiosyncare.github.io/ontology/sstim-namespace.rdf [R=303,L]
```

The manifest and manifest schema are JSON resources and do not use RDF content
negotiation. The schema's stable identity is
`https://w3id.org/sstim/manifest-schema/1`. VoID and immutable snapshot Turtle
files also retain their simpler routes. Every negotiated route emits
`Vary: Accept` through `Header always set Vary "Accept"`, so 303 responses carry
the header and caches do not reuse an HTML response for an RDF request (or vice
versa). See
[`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md)
B2. The `dist/ontology/*.jsonld`/`.rdf` targets are generated by the Pages build
(`make export`) and must be live before these rules are merged into perma-id
(same prerequisite as every other route).

## Open follow-up

- **Deploy before registry update.** Deploy `manifest.json`,
  `manifest.schema.json`, every new Turtle source and export, both generated
  namespace catalogues, the Kernel and exact Exposure module distribution
  formats, and all four profile entry points. Verify the staged HTML
  documentation target, `Vary: Accept`, and the complete route × representation
  matrix before opening the perma-id PR. Until that PR merges, the new
  manifest/profile/module URLs correctly remain 404 and the live root/exposure
  routes retain their pre-modular targets.
- **Automate post-deploy route verification.** The checked local route matrix
  does not yet replace a deployed HTTP gate. Add one that asserts each redirect
  status and exact `Location`, final status and media type, `Vary: Accept`, RDF
  parsing/checksum, and representative `406` cases. The current README commands
  remain a manual rollout checklist.
- **Instance dereferencing.** General live ecosystem namespace routes send RDF
  clients to the mutable aggregate, where RDF subject membership—not registry
  configuration—determines which real records are current. Current synthetic
  fixture subjects use the same identifier grammar with a reserved
  `synthetic-*` slug that the live rules reject; there are no fixture-specific
  registry routes. Exact static routes are staged for the BSC framework, BSC
  Lab, the BioSynCare application, and the Patch Studio component. Because the
  registry requires live targets, submit these rules only after the owning
  files are deployed and verify them before enabling discovery UI. Deeper
  protocol, preset, session, evidence, and reference IRIs still live in bundled
  instance files and need routes when their public identity grammars stabilize.
