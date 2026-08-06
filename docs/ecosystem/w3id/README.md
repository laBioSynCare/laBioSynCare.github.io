# Publishing SSTIM at `w3id.org/sstim`

This folder mirrors the content-negotiation configuration for the persistent
namespace `https://w3id.org/sstim`. It is **not** served by this repository —
the live copy is maintained in the
[`perma-id/w3id.org`](https://github.com/perma-id/w3id.org) registry.

**The route contract lives in [`sstim/README.md`](sstim/README.md)** — every PID,
what it resolves to, its registry state, and the negotiation rules. That file is
also what gets trimmed and submitted upstream. This file covers the
repository-side workflow that produces and guards those targets, and is not
copied to the registry.

## Generating the targets

`make export` (`scripts/export-ontology.py`, rdflib) writes `.jsonld` and `.rdf`
beside each manifest-owned Turtle source and profile entry point, plus the two
generated namespace catalogues: the root Full catalogue
(`sstim-namespace.*`) and the Stimulus + Exposure catalogue
(`sstim-exposure-namespace.*`). Turtle stays the editable master; the exports
exist only so the namespace can content-negotiate other formats.

Namespace catalogues are **publication artifacts, not profile imports**. That is
the distinction the two Exposure routes encode: `/sstim/exposure` serves the
catalogue so `exposure#StimulusChannel` still dereferences after its declaration
moved to Stimulus, while `/sstim/module/exposure` serves only `sstim-exposure`
and is what development profile imports actually retrieve.

Immutable snapshots come from `make snapshot`
([`scripts/snapshot-ontology.mjs`](../../../scripts/snapshot-ontology.mjs));
existing snapshot directories are protected, and `FORCE=1` is only for
correcting an unpublished one. After cutting a snapshot, run
`node scripts/sstim-w3id-snapshot-routes.mjs --write`, then commit and review the
changed exact-route region. Snapshot redirects are generated from the files
actually present under `static/ontology/<version>/`, so unknown versions and
filenames stay 404.

## Guarding them

`make w3id-routes` (part of `make validate`) checks two independent things:

1. the generated snapshot region matches the frozen directories on disk — a new
   snapshot must update it before publication; and
2. every `/ontology/` redirect target is an artifact this repository actually
   publishes: a committed file, a manifest-declared export serialization, or a
   namespace document.

The second check exists because Apache never validates these rules against the
build, so a renamed module or a dropped `release.export` flag would otherwise
turn a persistent identifier into a 404.

`scripts/w3id-negotiation.mjs` goes further and resolves requests against the
committed `.htaccess` the way Apache would — ordered rules, `RewriteCond` chains,
`[OR]`/`[NC]`, `$1` backreferences, `q=0` handling. It catches the mistakes a
target check cannot see: an `Accept` regex that misreads `q=0`, a rule shadowed
by an earlier one, a module inheriting the wrong documentation page.

## Updating the registry rules

1. Fork [`perma-id/w3id.org`](https://github.com/perma-id/w3id.org).
2. Create or update the directory `sstim/` at the repository root.
3. Copy [`sstim/.htaccess`](sstim/.htaccess) from this folder into it, keeping
   any already-live rules that are still valid. Copy the trimmed README, not
   this file.
4. Run `make w3id-routes`.
5. Open a PR scoped strictly to the `sstim/` directory — the maintainers reject
   PRs that touch other namespaces.
6. Write the description on top of the upstream template
   (`.github/PULL_REQUEST_TEMPLATE.md`); the maintainers expect its structure
   (requested by @dgarijo on
   [PR #6378](https://github.com/perma-id/w3id.org/pull/6378)). Keep its
   sections and tick the applicable checklists: **Brief Description**, the
   **General Checklist** (tested, minimal/squashed commits, redirects only), and
   the **New**/**Update ID Directory Checklist** (maintainer GitHub usernames
   present in `.htaccess` or `README.md`; the submitting account is one of them).
7. In the Brief Description, state the redirect targets and that the namespace
   is for an OWL/SKOS ontology under CC BY 4.0.

**Prerequisite for every route: GitHub Pages must serve the redirect target
before the matching rule is merged.** After a merge, keep this staging copy and
the live `.htaccess` in sync — any Pages layout change, new module, or new
version means updating both.

## Open follow-ups

- **Automate post-deploy route verification.** `w3id-negotiation.mjs` models the
  rules locally; nothing yet asserts the *deployed* behaviour over HTTP. A gate
  should check each redirect status and exact `Location`, the final status and
  media type, RDF parsing and checksum, and representative `406` cases. Until
  then the verification commands in [`sstim/README.md`](sstim/README.md) are a
  manual rollout checklist. (`Vary: Accept` is out of scope — see that file for
  why it is unobtainable rather than outstanding.)
- **Instance dereferencing.** Live ecosystem namespace routes send RDF clients to
  the mutable aggregate, where RDF subject membership — not registry
  configuration — decides which real records are current. Synthetic fixtures use
  the same identifier grammar with a reserved `synthetic-*` slug the live rules
  reject, and get no routes of their own. Exact static routes are staged for the
  BSC framework, BSC Lab, the BioSynCare application, and the Patch Studio
  component; submit them only after the owning files deploy, and verify before
  enabling discovery UI. Deeper protocol, preset, session, evidence, and
  reference IRIs remain in bundled instance files and need routes once their
  public identity grammars stabilize.
