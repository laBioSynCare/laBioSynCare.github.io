# ADR 0039 — How data is shared, and why there is no shared backend

**Status:** Proposed — 2026-07-31

Records one decision seen from two sides: what "self-hosted storage" should and
should not include (gap G5 in
[`../technical/PORTABLE_DEPLOYMENT.md`](../technical/PORTABLE_DEPLOYMENT.md)),
and how people share presets, patches and annotations given that answer. They
cannot be decided separately — declining a multi-user backend is only defensible
if sharing works some other way.

## Context

The storage seam ([ADR 0038](0038-identity-providers-and-the-two-seam-adapter.md))
gave patches, annotations and profile local and Firestore implementations behind
one contract. Ten operations in total: `list`/`save`/`remove` for patches,
`add`/`update`/`remove`/`subscribeForTarget`/`listAll` for annotations,
`load`/`save` for profile. A conformance suite already defines what a new
implementation must satisfy.

That left G5 reading "no self-hosted alternative to Firebase". The phrase hides
that it is two unrelated jobs:

**(a) My own data across my devices.** Identity plus storage. No moderation, no
multi-user reads, no abuse surface.

**(b) Content other people can read.** Identity *plus* authorization, moderation
and abuse handling, because it is user-generated content published to strangers.

Firestore does both, which is why the gap looked like one item. It is not: (a) is
bounded work, (b) is a permanent obligation.

## Decision

### 1. Build (a). Decline (b).

BSC Lab will not operate a multi-user backend that hosts one person's content for
others to read. That is the same class of commitment
[ADR 0008](0008-activitypub.md) declined for federation — inboxes, moderation
queues, abuse handling, legal exposure — and the reasoning transfers unchanged.

(a) remains open as future work: a small service beside the static site, SQLite,
the ten existing operations, a bearer token from whatever the identity seam
settles on. `subscribeForTarget` takes a callback and returns an unsubscribe, so
**polling satisfies the contract** and real-time is a refinement rather than a
blocker. Acceptance is already written: it passes the conformance suite unchanged.

**Note the ordering constraint:** (a) cannot be finished before the identity
seam, because "my data" is meaningless without knowing whose. That is an argument
for doing identity next.

### 2. Sharing is publication, not a service

BSC Lab already shares: the ontology, reference presets, protocols and evidence
are static, content-negotiated, versioned, DOI-bearing files at
`w3id.org/sstim`, and nobody runs a service for them. User content travels the
same road. Four tiers, none requiring a backend:

**Tier 1 — Link.** A patch export is roughly 2.7 kB; compressed and base64'd into
a **URL fragment** it is under a thousand characters. Fragments are never sent to
a server, so `…/creator/#patch=<blob>` shares a working patch with no
infrastructure and no storage whatsoever. Paste into chat; the recipient opens it.

**Tier 2 — File.** Already shipped: Patch Studio download/import, and the whole
instance export. Email, repository, USB stick. No discovery, but functional today.

**Tier 3 — Publication.** A stable URL somewhere the author controls, fetched by
"open from URL", exactly how ontology Turtle already loads. With the
patch → SSTIM RDF bridge ([ADR 0026](0026-patch-studio-catalog-bridge.md), gap
G10) a patch becomes a SHACL-validated, citable scientific object rather than an
opaque blob. Discovery via a build-time feed — a generated file, not a service.

**Tier 4 — Contribution.** Into the curated public graph, through the
consent-gated human review that already exists for ecosystem records
([ADR 0031](0031-qualified-ecosystem-records.md),
[ADR 0032](0032-visible-pending-status-ecosystem-records.md)).

**Tier 4 is where the moderation problem dissolves.** Reviewing a proposed
contribution is work already being done; operating a moderation queue is a
24/7 obligation with legal exposure. Same outcome, entirely different commitment.

### 3. One-click publication targets

🔶 Verified 2026-07-31 by documentation search; confirm scopes and quotas before
implementing.

| Target | Gives | Mechanism |
|---|---|---|
| **Zenodo** | A **DOI**, permanent archival, CERN-backed | REST API creates a deposition, uploads files and publishes; personal access token with write scope. Already used for SSTIM releases |
| **Mastodon** | A federated, boostable post with a real URL | `POST /api/v1/statuses` under `write:statuses`, with media attached by id |
| OSF ⚠️ | DOIs, research-artifact oriented | Unverified |
| GitHub Gist / Codeberg ⚠️ | Raw URLs, revision history | Unverified |

### 4. The Fediverse connection is publication from *your* account

The natural Fediverse answer is not that BSC Lab federates. It is that **you
publish from your own identity, on your own instance, under your instance's
moderation** — and the network distributes it. BSC Lab hosts nothing.

This composes with ADR 0038: the same Mastodon OAuth that identifies you can
carry the token that posts. Sign in with your Fediverse account, publish a patch
to your own timeline, and it is an ActivityPub object with a stable URL that
others can boost, reply to and archive — with zero BSC Lab infrastructure.

**This does not reopen ADR 0008.** Posting to your account makes BSC Lab a
Fediverse *client*. ADR 0008 declined to be a Fediverse *server* — inboxes,
delivery queues, signatures, moderation. That distinction is exactly the one
ADR 0038 drew for login, applied to publication.

It does need a wider OAuth scope than identity alone (`write:statuses` plus media
upload), which is a consent question to surface honestly in the UI rather than
bundle into sign-in.

### 5. WebRTC is a synchronous transfer channel, for any two people

An earlier version of this reasoning claimed WebRTC suited moving data between
*your own* devices but not sharing with someone else. **That distinction was
wrong and is recorded here so it is not reinvented.** WebRTC neither knows nor
cares whether two endpoints belong to one person; a QR code that connects a
laptop to its owner's phone connects it to a colleague's phone identically.

The real axis is **synchronous versus asynchronous**:

- **WebRTC** transfers between two parties present at the same moment.
- **Publication** reaches someone who acts next week.

Neither substitutes for the other.

**What WebRTC actually costs**, against the "no server" headline: *signalling* is
unspecified by the protocol and needs an out-of-band channel; *STUN* is a
third-party dependency; *TURN* relays real traffic when NAT traversal fails, and
is the most server-like component in the design.

**QR signalling removes all three** for co-located use: the camera is the
signalling channel, and on a shared network no STUN or TURN is involved. That
makes a genuinely good scenario possible — a workshop where everyone scans one
code and leaves with the patch, a lab group sharing a configuration, a training
session where practitioners take home the settings they just experienced. It
works with **no internet at all**.

**The unresolved part is scope, not transport.** Moving your own data means the
whole instance export, private notes included. Sharing with another person means
a *selection* — this patch, not your logbook. Getting that wrong hands someone
your personal reflections by accident, so selection and consent need designing
before this is built.

## Consequences

**What is gained.** Sharing that needs no server, survives the project outliving
its maintainers, produces citable artifacts, and carries no moderation
obligation. Publication targets that already exist and are free.

**What is given up**, stated plainly:

- **No real-time collaboration.** Two people cannot annotate the same node and
  watch each other work.
- **No in-app discovery** of other people's work until a feed exists, and even
  then it is a published index rather than a live database.
- **No comment threads.** Public annotation becomes an act of publication, not a
  reply button.

Those are exactly the features a hosted backend buys, and exactly the features
that turn a workbench into a social platform with the obligations attached.

**The resulting claim** is stronger than a backend would have produced: *user
content is shared the way the ontology is — as versioned, addressable, citable
artifacts, not as rows in our database.*

## Alternatives considered

**A multi-user hosted backend.** Declined above. Revisit only if a community
takes on operating and moderating it, which is a governance question before it is
a technical one.

**Solid pods.** Identity via Solid-OIDC, storage in the user's own pod. Annotations
are already RDF in named graphs with pseudonymised agent IRIs, which is close to
Solid's model exactly, and it would supply both seams at once while BSC Lab stores
nothing. Attractive and still deferred: pod availability is thin, and it would
couple usability to a smaller ecosystem than either Mastodon's or plain
local-first. Revisit once the storage seam has a second real implementation.

**IPFS / content-addressed storage.** Durability depends on pinning, which is
either paid or unreliable. Publication targets above give permanence for free.

**WebRTC as the sharing mechanism.** Rejected as a *replacement* for publication —
it cannot reach someone who is not present, offers no discovery, and leaves no
citable artifact. Retained as a candidate for co-located synchronous transfer,
and separately as the right technology for live shared sessions, which is a
distinct feature rather than a storage backend.
