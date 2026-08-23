# ADR 0038 — Identity providers: Fediverse-first, behind a two-seam adapter

**Status:** Accepted — 2026-07-30 · **both seams implemented; neither Fediverse
identity provider is.** `src/storage/` and `src/identity/` exist with conformance
suites, and the anonymous and Firebase identity providers ship. Mastodon OAuth
and IndieAuth — the part of §3 that demonstrates the seam is an interface rather
than a swap — remain outstanding. Tracked in
[`../technical/PORTABLE_DEPLOYMENT.md`](../technical/PORTABLE_DEPLOYMENT.md) §3.2
and in `ROADMAP.md` under "Software: portable deployment and migration".

Records an architectural direction for replacing the single hardcoded identity
and storage backend, and the ordering between candidate identity providers.

## Context

BSC Lab is client-side-first and Firebase is already optional: configuration comes
from build-time `VITE_FIREBASE_*` variables, and a build without them runs with no
embedded credentials, losing only the cloud-backed features. The coupling surface
is nine import sites across seven files.

"Firebase optional" is nonetheless weaker than it sounds, because Firebase does
**two separable jobs**: it establishes **identity**, and it **stores** annotations,
patches, logbook entries and profile. Turning it off removes both. A user who wants
an account but not Google's infrastructure has no path.

[ADR 0008](0008-activitypub.md) declined full ActivityPub federation: inboxes,
signatures, delivery queues, moderation and abuse handling constitute a
social-server programme this project is not equipped to run. That decision stands
and this one does not disturb it.

## Decision

### 1. Two seams, not one

Split the backend adapter into an **identity provider** and a **storage provider**.

Collapsing them would reproduce the coupling the adapter exists to remove, because
**most decentralized identity providers store nothing at all.** Mastodon and
IndieAuth each establish who someone is and then have no opinion about their data.
An identity seam that assumes its provider also persists records can only ever be
implemented by another Firebase.

### 2. Local-first storage is the default, not a fallback

Because identity providers store nothing, data must have somewhere to live that
does not depend on an account. Local-first storage plus the versioned export
package makes identity **optional attribution** rather than a gate on a user's own
records.

Build order follows: **storage first, identity second.** Shipping a new identity
provider onto a Firestore-only storage layer would add a second way to sign in to
the same proprietary backend, which is not the point.

### 3. Mastodon OAuth is the first identity provider; IndieAuth is the second

An earlier draft of this reasoning put IndieAuth first on grounds of technical
cleanliness. That was wrong, for two reasons.

**It optimised for the wrong criterion.** IndieAuth's advantages — no registration
step, no client secret — are engineering virtues. The binding constraint on this
work is demonstrating Fediverse relevance, and IndieAuth is IndieWeb: a philosophically
allied but institutionally separate movement. Mastodon is the reference Fediverse
implementation, and "sign in with your Fediverse account" needs no explanation.

**And the semantic argument for IndieAuth was overstated.** It was claimed that
identity-as-a-URL matches a project whose data model is dereferenceable
identifiers. True — but a **Mastodon actor URI is equally dereferenceable**, and is
additionally an **ActivityPub actor**. `https://mastodon.social/users/name` works as
an agent IRI in a named graph exactly as well as an IndieAuth URL, while carrying
more interoperability, not less. IndieAuth wins on client mechanics; it does not
win on semantics.

**Implement both anyway.** One provider is a swap; two providers are an interface.
Shipping Mastodon *and* IndieAuth is what demonstrates the identity seam is real
and that further providers cost little.

## Consequences

**Mastodon OAuth from a static app is feasible, with a known compromise.** Mastodon
supports PKCE from 4.3.0 (S256 only) and dynamic app registration via
`POST /api/v1/apps`, so no pre-registration and no server are required — the pattern
already used by client-side Mastodon clients such as Pinafore, Semaphore and Elk.
However, **Mastodon provisions confidential clients only and always returns a
`client_secret`**, which a browser cannot keep secret. PKCE mitigates interception;
the secret's presence remains a wart, one the ecosystem is addressing through
Client ID Metadata Documents and related IETF work. Accepting it is a deliberate
choice, not an oversight.

**IndieAuth avoids that entirely.** Identity is a URL the user controls, the client
is identified by its own URL, and DNS replaces client registration — no
registration, no secret, no per-instance state. Mastodon does not implement
IndieAuth ([mastodon#24066](https://github.com/mastodon/mastodon/issues/24066)), so
the two are complementary rather than alternatives.

**This does not reopen ADR 0008.** Consuming a Mastodon instance as an OAuth
identity provider requires no ActivityPub server, no inbox, no delivery queue and
no moderation capacity. It is Fediverse integration at the point where it costs
nothing and returns real value, which is precisely the line ADR 0008 drew.

**Agent identifiers improve.** Annotation exports already exclude Firebase
authentication IDs in favour of pseudonymous agent identifiers. A Mastodon actor URI
or an IndieAuth URL is a *dereferenceable* agent identifier, which is strictly
better for a linked-data project than an opaque UID.

**Cost.** Two identity implementations plus a local-first storage implementation,
against a nine-site refactor. Conformance tests must run against every
implementation of each seam, so "works with Firebase" and "works self-hosted"
become the same assertion twice.

## Alternatives considered

**Keep Firebase as the only backend.** Cheapest, and the status quo. Rejected
because it makes institutional self-hosting impossible in practice and leaves the
"Firebase optional" claim technically true but practically hollow.

**Solid pods for identity *and* storage.** Solid-OIDC plus a pod would supply both
seams in one, and its RDF-native model is an unusually good match for SSTIM.
Attractive and not ruled out — but pod availability is thin, and it would couple the
project's usability to an ecosystem smaller than either Mastodon's or the plain
local-first path. Revisit once the storage seam exists, at which point Solid is one
more implementation rather than a bet.

**Full ActivityPub federation.** Out of scope per ADR 0008, unchanged.
