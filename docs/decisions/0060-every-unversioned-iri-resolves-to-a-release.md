# ADR 0060: Every unversioned SSTIM IRI resolves to a release

**Status:** Accepted · 2026-10-05 · live since
[perma-id/w3id.org#6822](https://github.com/perma-id/w3id.org/pull/6822) merged
the same day; verified 2026-10-06

## Context

[ADR 0055](0055-namespace-iri-resolves-to-a-release.md) made
`https://w3id.org/sstim` answer RDF clients from `latest/`, the newest frozen
release, and rejected serving the working tree as "the defect, not a baseline".
It changed the `^$` rules and nothing else.

Measured 2026-10-05 against production, every other unversioned route still
served the development line. `/sstim/vocab`, `/sstim/exposure`, `/sstim/shapes`,
`/sstim/ecosystem`, `/sstim/stimulus`, `/sstim/technique`, `/sstim/evidence` and
`/sstim/profile/full` all answered `owl:versionInfo "0.19.0-dev"` with no
`owl:versionIRI`. So `sstim:Preset` dereferenced to 0.18.0, while terms in four
of the five term namespaces (`sstim-v:`, `sstim-ex:`, `sstim-sh:`, `sstim-eco:`)
dereferenced to an unreleased graph. That graph already named the Community
Group as publisher (ADR 0059) although no release yet does.

In rule terms there were 71 distinct targets at the top of `/ontology/`: sixteen
modules, the Kernel, the two Exposure endpoints and four profiles, each in three
serializations, plus the manifest and its schema. No gate could see it.
`check-w3id-route-targets` asks whether a target is publishable, and a
development file is publishable. The quality audit pins the exact route matrix,
so it pinned the defect along with everything else.

The problem was known in part. Both clients route around the manifest half: the
Python client's notes say that "someone who fetches the first and believes they
pinned something has pinned nothing". [ADOPTION.md](../ecosystem/ADOPTION.md)
§C left whether the two routes "should disagree in kind at all" to be decided
separately. The only reason ever given for serving the working tree from module
routes is [ADR 0043](0043-sstim-core-profile-and-module-boundaries.md)'s: they
were the development profiles' physical import endpoints.

## Decision

1. **Every unversioned RDF or JSON route answers from `latest/`.** This covers
   the sixteen module routes, `/sstim/kernel`, `/sstim/exposure`,
   `/sstim/module/exposure`, the four profiles, `/sstim/manifest`,
   `/sstim/manifest-schema/1`, and the four retired BSC technique IRIs that
   resolve to the vocabulary. HTML targets and versioned routes do not change.
2. **The development line has no persistent identifier.** It stays reachable at
   its deployment URL, which the manifest records as each module's
   `distributionUrl`.
3. **A gate holds it.** `check-w3id-route-targets`, part of `make validate`,
   fails on any route to a top-level ontology artifact. VoID and the instance
   catalogues are records that no snapshot contains, so they keep their routes.
4. **No pull request per release.** `latest/` is already derived on every
   deploy ([ADR 0053](0053-wildcard-snapshot-routes.md), ADR 0055). Every file
   the new targets name answered 200 on both deployments before the rules
   changed.

## Alternatives considered

- **Fix only the hash namespaces.** Rejected: `vocab`, `shapes` and `ecosystem`
  are module IRIs too, and ADR 0055's argument applies to every unversioned IRI.
  A split rule set would need its own reason for each route.
- **A `/sstim/module/<id>` development route for every module**, as ADR 0043
  gave Exposure, with the development profiles importing them. Not now: twenty
  more public routes would preserve a network path into the development line
  that nothing uses. Measured: `make reason`, the exports and the BioPortal
  bundle concatenate manifest files, and both clients resolve a release through
  `owl:versionIRI`. It would also need edits to the four protected profile
  entry points and to release preparation's rewrite map. It stays available if
  a consumer turns up.
- **Keep the working tree behind module routes.** Rejected, for ADR 0055's
  reason.

## Consequences

- **A development profile loaded over the network imports released modules.**
  The development closure is assembled from the repository through the
  manifest, as every gate already does. Release preparation still rewrites
  imports to exact versioned siblings, so released closures are unchanged.
- **A change on the development line reaches no term IRI until it is
  released.** ADR 0055 accepted this for `/sstim`. It now holds for every term
  namespace, so 0.19.0 edits can land without going live early.
- **HTML reference documentation still describes the development line.** WIDOCO
  and pyLODE are generated from it, so between releases a browser and an RDF
  client can see different versions. That is not changed here.
- **`void.ttl` disagrees with itself until it is edited.** Each module's
  `dcat:accessURL` now yields a release, while its `dcat:downloadURL` and
  `void:dataDump` still name development files; both should name `latest/`.
  That is a protected-file edit (CLAUDE.md §3.4), recorded as a follow-up.
- **The clients keep their behaviour.** Resolving through `owl:versionIRI` names
  the exact release, whatever the routes serve.

## See also

- [ADR 0043](0043-sstim-core-profile-and-module-boundaries.md): module
  boundaries, and dependency kept separate from retrieval.
- [ADR 0055](0055-namespace-iri-resolves-to-a-release.md): the namespace IRI
  resolves to a release.
- [Improvement plan](../ontology/IMPROVEMENT_PLAN.md) §1.6, GB-12.
