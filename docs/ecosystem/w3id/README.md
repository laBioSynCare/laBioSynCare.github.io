# Publishing SSTIM at `w3id.org/sstim`

This folder mirrors the content-negotiation configuration for the persistent
namespace `https://w3id.org/sstim`. It is **not** served by this repository —
the live copy is maintained in the
[`perma-id/w3id.org`](https://github.com/perma-id/w3id.org) registry.

Current live state: root RDF, module, Patch Studio, and versioned `0.1.0/`
routes resolve through `w3id.org` to the GitHub Pages artifacts. Browser
branches still point at the app root until WIDOCO HTML output is generated and
published.

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
| `https://w3id.org/sstim/0.1.0` | `/ontology/0.1.0/sstim-core.ttl` (frozen) |
| `https://w3id.org/sstim/0.1.0/sstim-core.ttl` | `/ontology/0.1.0/sstim-core.ttl` (frozen) |

The immutable `0.1.0/` snapshot is produced by `make snapshot`
(see [`scripts/snapshot-ontology.mjs`](../../../scripts/snapshot-ontology.mjs)).
Existing snapshot directories are protected; use `make snapshot FORCE=1` only
to correct an unpublished snapshot. The version root
`https://w3id.org/sstim/0.1.0` is the ontology's `owl:versionIRI` and redirects
to the frozen `sstim-core.ttl` document.

## Updating the registry rules

1. Fork [`perma-id/w3id.org`](https://github.com/perma-id/w3id.org).
2. Create or update the directory `sstim/` at the repository root.
3. Copy [`sstim/.htaccess`](sstim/.htaccess) from this folder into it, keeping
   any already-live rules that are still valid.
4. Open a PR. Keep the change scoped strictly to the new `sstim/` directory —
   the maintainers reject PRs that touch other namespaces.
5. In the PR description, state the redirect targets and that the namespace is
   for an OWL/SKOS ontology with a public CC BY 4.0 license.

After the PR merges, keep this staging copy and the live `.htaccess` in sync.
Any change to the Pages layout, new module file, or new ontology version means
updating both copies.

## Verifying after merge

```bash
# RDF clients get Turtle (303 → .ttl)
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim | grep -iE 'location|content-type'

# Browsers get HTML (303 → knowledge browser, later WIDOCO)
curl -sIL -H 'Accept: text/html'  https://w3id.org/sstim | grep -i location

# Module, Patch Studio, and versioned snapshot resolve
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/vocab        | grep -i location
curl -sIL -H 'Accept: text/turtle' https://w3id.org/sstim/patch-studio | grep -i location
curl -sIL https://w3id.org/sstim/0.1.0/sstim-core.ttl                  | grep -i location

# Round-trip parse check (n3 / rapper / riot)
curl -sL -H 'Accept: text/turtle' https://w3id.org/sstim | rapper -i turtle -c -
```

## Open follow-up

- **WIDOCO HTML docs.** The browser branch currently points at the app root.
  Once WIDOCO output is deployed (planned: generated in CI, published outside
  the `main` source tree per ROADMAP), change the `^$` browser rule in
  `sstim/.htaccess` to that URL.
- **Instance dereferencing.** Implementation/framework/reference IRIs
  (`/implementation/bsclab/...`, `/framework/bsc`, `/ref/...`) are not yet
  individually dereferenceable — they live inside bundled instance files. Add
  per-resource rules (or a data-dump convention) when those instances stabilize.
