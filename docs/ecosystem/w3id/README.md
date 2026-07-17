# Publishing SSTIM at `w3id.org/sstim`

This folder mirrors the content-negotiation configuration for the persistent
namespace `https://w3id.org/sstim`. It is **not** served by this repository —
the live copy is maintained in the
[`perma-id/w3id.org`](https://github.com/perma-id/w3id.org) registry.

Current live state: root RDF, module, Patch Studio, exposure, and semver
versioned snapshot routes resolve through `w3id.org` to the GitHub Pages
artifacts. Browser branches still point at the app root until WIDOCO HTML output
is generated and published.

**Staged, submitted as [perma-id/w3id.org#6337](https://github.com/perma-id/w3id.org/pull/6337)
(awaiting merge):** the `/sstim/void` route and the `application/ld+json` /
`application/rdf+xml` content-negotiation branches for core and every module.
Their Pages targets (`void.ttl`, `*.jsonld`, `*.rdf`) are **live** at
`labiosyncare.github.io` (deployed with 0.5.0); the w3id rules resolve once that
PR merges. The [`sstim/.htaccess`](sstim/.htaccess) staging copy now also carries
audited exact routes for the stable BSC catalog identities plus general live
ecosystem namespace routes for the mutable real-agent aggregate; those rules
still need a registry update after their targets are deployed and verified.
Current synthetic contract subjects reserve a `synthetic-*` slug and remain
available only through their direct test artifact. They intentionally have no
fixture-specific w3id.org routes; the frozen SSTIM 0.7.0 snapshot is unchanged.

> Prerequisite for future routes: GitHub Pages must serve each redirect target
> before the matching w3id rule is merged.

## What gets published where

| Persistent IRI | Resolves to (GitHub Pages) |
|---|---|
| `https://w3id.org/sstim` (RDF `Accept`) | `/ontology/sstim-core.ttl` |
| `https://w3id.org/sstim` (browser) | `/` (knowledge browser; → WIDOCO when live) |
| `https://w3id.org/sstim/vocab` | `/ontology/sstim-vocab.ttl` |
| `https://w3id.org/sstim/shapes` | `/ontology/sstim-shapes.ttl` |
| `https://w3id.org/sstim/alignments` | `/ontology/sstim-alignments.ttl` |
| `https://w3id.org/sstim/patch-studio` | `/ontology/sstim-patch-studio.ttl` |
| `https://w3id.org/sstim/exposure` | `/ontology/sstim-exposure.ttl` |
| `https://w3id.org/sstim/ecosystem` | `/ontology/sstim-ecosystem.ttl` |
| `https://w3id.org/sstim/framework/bsc` | `/ontology/instances/frameworks/bsc.ttl` |
| `https://w3id.org/sstim/implementation/bsclab` | `/ontology/instances/implementations/implementations.ttl` |
| `https://w3id.org/sstim/implementation/biosyncare` | `/ontology/instances/implementations/implementations.ttl` |
| `https://w3id.org/sstim/implementation/bsclab/component/patch-studio` | `/ontology/instances/implementations/implementations.ttl` |
| `/specialist/{id}`, `/organization/{id}`, and `/ecosystem-record/{relationship,activity,role}/{id}` live namespaces (`synthetic-*` excluded) | `https://biosyncare-lab.web.app/current.ttl` |
| `https://w3id.org/sstim/void` | `/ontology/void.ttl` (VoID + DCAT dataset description) |
| `https://w3id.org/sstim/0.5.0` | `/ontology/0.5.0/sstim-core.ttl` (frozen) |
| `https://w3id.org/sstim/0.5.0/sstim-core.ttl` | `/ontology/0.5.0/sstim-core.ttl` (frozen) |

Immutable version snapshots are produced by `make snapshot`
(see [`scripts/snapshot-ontology.mjs`](../../../scripts/snapshot-ontology.mjs)).
Existing snapshot directories are protected; use `make snapshot FORCE=1` only
to correct an unpublished snapshot. The version root
`https://w3id.org/sstim/<version>` is the ontology's `owl:versionIRI` and
redirects to the frozen `sstim-core.ttl` document for that version.

## Updating the registry rules

1. Fork [`perma-id/w3id.org`](https://github.com/perma-id/w3id.org).
2. Create or update the directory `sstim/` at the repository root.
3. Copy [`sstim/.htaccess`](sstim/.htaccess) from this folder into it, keeping
   any already-live rules that are still valid.
4. Open a PR. Keep the change scoped strictly to the new `sstim/` directory —
   the maintainers reject PRs that touch other namespaces.
5. Write the PR description on top of the upstream template
   (`.github/PULL_REQUEST_TEMPLATE.md` in `perma-id/w3id.org`); the
   maintainers expect its structure (requested by @dgarijo on
   [PR #6378](https://github.com/perma-id/w3id.org/pull/6378)). Keep the
   template's sections and tick the checklists that apply: **Brief
   Description**, the **General Checklist** (changes tested, minimal/squashed
   commits, redirects-only content), and the **New** or **Update ID
   Directory Checklist** (maintainer GitHub usernames listed in `.htaccess`
   or `README.md`; the submitting account is one of those maintainers).
6. In the Brief Description, state the redirect targets and that the
   namespace is for an OWL/SKOS ontology with a public CC BY 4.0 license.

After the PR merges, keep this staging copy and the live `.htaccess` in sync.
Any change to the Pages layout, new module file, or new ontology version means
updating both copies.

## Verifying after merge

```bash
# RDF clients get Turtle (303 → .ttl)
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim | grep -iE 'location|content-type'

# Browsers get HTML (303 → knowledge browser, later WIDOCO)
curl -sIL -H 'Accept: text/html'  https://w3id.org/sstim | grep -i location

# Module, Patch Studio, exposure, and versioned snapshot resolve
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/vocab        | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/patch-studio | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/exposure     | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/ecosystem    | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/framework/bsc | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/implementation/bsclab/component/patch-studio | grep -i location
curl -sIL https://w3id.org/sstim/0.3.0/sstim-core.ttl                  | grep -i location

# Round-trip parse check (n3 / rapper / riot)
curl -sL -H 'Accept: text/turtle' https://w3id.org/sstim | rapper -i turtle -c -
```

## Multi-format content negotiation (JSON-LD + RDF/XML)

The Pages build now generates `*.jsonld` and `*.rdf` (RDF/XML) beside each
`*.ttl` in `dist/ontology/` via `make export` (`scripts/export-ontology.py`,
rdflib). Turtle stays the editable master; the exports exist only so the
namespace can content-negotiate other formats. The staging
[`sstim/.htaccess`](sstim/.htaccess) **now includes** these `Accept` branches for
core and every module (`application/ld+json` → `.jsonld`, `application/rdf+xml` →
`.rdf`, anything else → Turtle):

```apache
# Accept: application/ld+json → JSON-LD export
RewriteCond %{HTTP_ACCEPT} application/ld\+json
RewriteRule ^$ https://labiosyncare.github.io/ontology/sstim-core.jsonld [R=303,L]

# Accept: application/rdf+xml → RDF/XML export
RewriteCond %{HTTP_ACCEPT} application/rdf\+xml
RewriteRule ^$ https://labiosyncare.github.io/ontology/sstim-core.rdf [R=303,L]
```

The same per-module pattern is applied for `vocab`, `shapes`, `alignments`,
`patch-studio`, and `exposure`. See
[`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md)
B2. The `dist/ontology/*.jsonld`/`.rdf` targets are generated by the Pages build
(`make export`) and must be live before these rules are merged into perma-id
(same prerequisite as every other route).

## Open follow-up

- **WIDOCO HTML docs.** The browser branch currently points at the app root.
  Once WIDOCO output is deployed (planned: generated in CI, published outside
  the `main` source tree per ROADMAP), change the `^$` browser rule in
  `sstim/.htaccess` to that URL.
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
