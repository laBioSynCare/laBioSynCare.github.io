# ADR 0053 — Snapshot routes are patterns, not an enumeration

**Status:** Accepted — 2026-08-17 · implemented 2026-08-17

## Context

Every SSTIM release froze an immutable snapshot and then added four rewrite
rules to `docs/ecosystem/w3id/sstim/.htaccess`: one alternation of every Turtle
file in the snapshot, one for `manifest`, one for `manifest.schema.json`, and one
for the bare version IRI. Those rules are a mirror of a file in
`perma-id/w3id.org`, so each release also meant a pull request against a
repository we do not own, reviewed by someone whose time it costs.

By 0.15.0 the region was 35 lines covering 14 snapshots, growing by four lines
every few days, and the alternation for a modular snapshot names all 24 modules
on one line.

The w3id maintainer asked us to stop. On
[perma-id/w3id.org#6548](https://github.com/perma-id/w3id.org/pull/6548),
merging the 0.14.0 routes, davidlehn wrote:

> - 14 comes after 13. but you probably knew that.
> - If you have an ongoing pattern, you might want to consider using wildcard
>   replacement patterns to avoid continuous updates here.

The first line is the point made gently: we had been back for 13 and were back
again for 14, and the pattern was obvious from outside before we acted on it
ourselves.

The enumeration was not accidental. It was chosen to be **fail-closed** — a
syntactically plausible version or filename must not acquire a persistent
redirect until that exact artifact exists — and
`scripts/sstim-w3id-snapshot-routes.mjs` enforced it, refusing to emit a route
for a file that was not in a frozen directory.

## Decision

**Route immutable snapshots by pattern.** Four rules cover every release,
including releases not yet cut:

```apache
RewriteRule ^(\d+\.\d+\.\d+)/(sstim-[a-z0-9-]+\.ttl)$  …/ontology/$1/$2
RewriteRule ^(\d+\.\d+\.\d+)/manifest$                 …/ontology/$1/manifest.json
RewriteRule ^(\d+\.\d+\.\d+)/manifest\.schema\.json$   …/ontology/$1/manifest.schema.json
RewriteRule ^(\d+\.\d+\.\d+)/?$                        …/ontology/$1/sstim-namespace.ttl
```

One rule stays an enumeration, and it is a **closed set**: the pre-modular
snapshots `0.1.0`–`0.12.0`, whose version IRI must resolve to `sstim-core.ttl`
because that file *was* the whole ontology before [ADR 0043](0043-sstim-core-profile-and-module-boundaries.md)
split it into modules. That list cannot grow — `make snapshot` refuses a module
set without a manifest — so it is generated from the inventory for single
sourcing, not because it is expected to change.

**A new release now requires no change to this file and no pull request against
`perma-id/w3id.org`.**

## Consequences

**What is given up.** The region is no longer fail-closed.
`w3id.org/sstim/9.9.9/sstim-vocab.ttl` now answers `302` toward a GitHub Pages
URL that answers `404`, where before w3id answered `404` itself. A reader gets a
404 either way and one extra hop; what is genuinely lost is that a w3id redirect
no longer constitutes evidence that the artifact exists.

**Where that proof moved.** Into this repository, and it got stronger rather than
weaker. The old `--check` regenerated the region's text and diffed it, which
proved only that the generator agreed with itself. The new one **executes the
committed rules** against every file in every frozen snapshot — 176 paths across
14 snapshots at the time of writing, including both spellings of each version
IRI — and fails if any resolves to the wrong URL. The invariants the enumeration
enforced by construction are now explicit assertions: every snapshot has
`sstim-core.ttl`, and every modular snapshot has `sstim-namespace.ttl`, because
answering a version IRI with the two-class Kernel would hand a registry client a
fraction of the release, which is the failure
[ADR 0020](0020-whole-set-snapshot-versioning.md) exists to prevent.

The mutation tests are the part that matters: dropping the legacy rule, or
narrowing the filename character class so hyphenated modules stop matching, both
fail the suite. A check that cannot fail is not a check.

**`check-w3id-route-targets.mjs` skips these four rules** and says why, matching
the version-wildcard token exactly. A hand-written rule with some other loose
pattern is still required to name a publishable target — verified by adding one
and watching it fail.

**Release step 8 loses its second half.** Regenerating the region and submitting
it upstream is no longer part of cutting a release. The generator remains, since
the legacy alternation and the two invariants are still derived from the
inventory, and `make validate` still runs it.

## Alternatives considered

**Keep enumerating.** Honest and fail-closed, and the maintainer had just asked
us not to. The cost falls on someone else's review queue, which makes it not
ours to keep paying.

**Wildcard the version but enumerate the filenames.** Would keep a fail-closed
filename check while removing the per-release edit — except the module set
changes between releases (5 files at 0.1.0, 24 at 0.13.0), so a single filename
list is either wrong for old snapshots or has to grow anyway. It also would not
have prevented the 0.13.0 edit, which added modules.

**Serve the snapshots from w3id directly.** Out of scope: w3id is a redirect
service and its PR template says so explicitly — "Commits only include redirects
and basic information. Serving content and full documentation is not supported
on this service."
