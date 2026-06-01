# ADR 0008 — ActivityPub federation

**Status:** Accepted — 2026-06-01

## Context

BSC Lab needs a strategy for making its public artifacts discoverable and for
building community around open sensory-stimulation science. ActivityPub — the
W3C-standardized federated social protocol used by Mastodon, GoToSocial,
Pixelfed, and others — was evaluated as a candidate mechanism.

The evaluation question was: *what problem does ActivityPub solve for BSC Lab
that a simpler alternative does not?*

BSC Lab's actual needs in this area are:

1. **Artifact discoverability** — presets, Turtle files, and protocols findable
   by researchers and developers.
2. **Community building** — reaching RDF, semantic-web, neuroscience, and
   wellness communities.
3. **Scientific credibility** — citable, dereferenceable, stable artifact URLs.
4. **Open science signaling** — transparency and reproducibility.

ActivityPub addresses #2 partially. It barely touches #1, #3, or #4, all of
which BSC Lab already handles well via w3id.org redirects, GitHub Pages
hosting, and Turtle content negotiation.

Full ActivityPub federation would require:

- Public HTTP endpoints operated permanently.
- Per-actor RSA keypairs; HTTP Signature signing and verification for every
  request.
- An inbox that accepts POST from arbitrary remote servers, making BSC Lab
  a social server, not a client-only tool.
- Delivery workers, retry queues, and exponential backoff across a diverse and
  unreliable Fediverse.
- Ongoing moderation: instance blocklists, actor-level blocks, report handling,
  spam filtering, abuse triage. This burden is permanent and requires human
  judgment; it cannot be automated away.
- Privacy controls for any health-adjacent content; federated copies of objects
  are not retractable from remote caches.

BSC Lab's architecture is deliberately client-first and static-hosted. Full
federation cuts against that simplicity and introduces a permanent social-server
surface.

## Decision

**No full ActivityPub federation now.**

The phased strategy is:

### Phase 0 — External account (current default)

Maintain official BSC accounts on existing Mastodon instances
(`scholar.social`, `w3c.social`, or `fosstodon.org`). Post preset releases,
ontology updates, and research notes manually. This reaches the communities
that matter — semantic web, RDF, open neuroscience — with zero infrastructure.
This is the correct starting point and may remain sufficient indefinitely.

### Phase 1 — Followable actor without a self-hosted server (conditional)

Only enter this phase if Phase 0 produces sustained, concrete demand for
follower-based **push** delivery — on the order of dozens of engaged followers
explicitly asking to receive updates, sustained across two to three release
cycles — not merely the wish to "be on the Fediverse." A static actor served
from GitHub Pages does not satisfy this: Mastodon and its peers push `Create`
activities to follower inboxes and do not poll a remote outbox, so a backend
that can answer `Follow` with a signed `Accept` and deliver to inboxes is
required before anyone actually receives anything.

The preferred mechanism is a **website-to-Fediverse bridge** (e.g. Bridgy Fed),
which exposes a followable `@handle` and performs WebFinger, HTTP Signature
signing/verification, inbox handling, `Accept(Follow)`, and delivery on
infrastructure BSC Lab does not operate. This keeps the static, client-first
hosting model intact while still producing a real, followable actor. Evaluate
this before writing any server-side ActivityPub code.

A self-hosted **Firebase-backed project actor** is the fallback, built only if
the bridge is found insufficient. Strict constraints if it is ever built:

- Project actors only (`@lab`, `@presets`, `@ontology`) on a **BSC-Lab-controlled
  domain distinct from the commercial `biosyncare.org`** — BSC Lab is not
  BioSynCare (see [0007](0007-framework-protocol-implementation.md)). The handle
  domain must also serve WebFinger, so the domain choice must be settled first.
  No user actors.
- Outbound publishing only: preset releases, ontology updates, protocol notes,
  release announcements.
- No inbox social UI in BSC Lab. Received activities are logged, not rendered.
- No federated session logs. Health-adjacent personal data is never federated.
- No media uploads from remote actors.
- Replies disabled or hidden by default; moderation must be resourced before
  enabling them.
- Limited/allowlist federation at launch; open federation only after moderation
  capacity is confirmed.

Phase 1 is not a roadmap commitment. It requires an explicit decision triggered
by evidence from Phase 0, and the bridge route is preferred over self-hosting.

### Out of scope: linked-data content negotiation

Serving JSON-LD via HTTP content negotiation on `w3id.org/sstim` terms — so that
`Accept: application/ld+json` returns proper JSON-LD — is a **linked-data**
concern, not an ActivityPub one. ActivityPub is a social-messaging protocol and
is the wrong tool for linked-data federation; SPARQL federation and the Linked
Data Platform (LDP) are the right ones. This is the higher-value discoverability
lever, and it is tracked as a separate decision, not a phase of this ADR.

## What is never built

- User actors (every BSC user gets a Fediverse identity).
- Home timeline or social feed inside BSC Lab.
- Direct messages via ActivityPub (not private; wrong for health-adjacent logs).
- Federation of private or personal session logs.
- ActivityPub for Rooms synchronization (wrong protocol; Rooms needs low-latency
  sync, not async federation).
- Open inbox with no moderation capacity.

## Alternatives considered

**Full ActivityPub federation.** Technically feasible with Firebase Functions,
Firestore, and Cloud Tasks. Rejected because it requires permanent moderation
operations and turns BSC Lab into a social server. Strategic cost exceeds
benefit given BSC Lab's client-first architecture.

**Static ActivityPub (read-only actor on GitHub Pages).** Actor and outbox
documents served as static JSON; no inbox. Mastodon users can discover the
actor but cannot follow it (delivery requires a live backend), so no one
actually receives updates. Cosmetically federated; practically inert. Rejected
as misleading. (A website-to-Fediverse bridge — see below and Phase 1 — fixes
this inertness without a self-hosted backend.)

**Website-to-Fediverse bridge (Bridgy Fed or equivalent).** A third-party
service exposes a BSC-Lab domain as a followable actor and performs WebFinger,
HTTP Signature signing/verification, inbox handling, `Accept(Follow)`, and
delivery — none of it on BSC Lab infrastructure. Publishing happens through the
bridge's supported path (e.g. webmentions / microformats2 emitted by the static
site). This resolves the "static actor is inert" problem without BSC Lab
becoming a social server, at the cost of a third-party dependency. Selected as
the **preferred mechanism for Phase 1** above, ahead of a self-hosted actor.

**Separate Fediverse bot posting via user credential.** A GitHub Action or
Firebase Function that posts to an externally-hosted Mastodon account using the
Mastodon API. Effectively Phase 0 automated. Valid option but not necessary
until manual posting proves insufficient.

**SPARQL federation / Linked Data Platform.** More appropriate than ActivityPub
for the semantic-web artifact use case. Not in scope for this ADR but should be
evaluated before investing in ActivityPub infrastructure.

## Consequences

- BSC Lab remains a client-first, static-hosted tool.
- Public community engagement happens through an external Mastodon account.
- No server-side ActivityPub code is added to the codebase. If the Phase 1
  bridge route is taken, it adds none either — only feed/webmention output from
  the static site.
- A self-hosted actor is built only if Phase 1's bridge route is approved and
  then found insufficient; it would live in a `src/federation/` module under
  Firebase Functions and would not touch the static SvelteKit app.
- Any federated object that represents a BSC artifact must pass the same
  claim-discipline rules as UI copy (see `docs/concept/SCOPE.md` and CLAUDE.md
  §3.5): no health or treatment claims.

## See also

- `docs/concept/SCOPE.md` — claim discipline for all public BSC copy.
- `docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md` — standards positioning.
- [0007](0007-framework-protocol-implementation.md) — BSC Lab as open
  implementation, not social network.
- Bridgy Fed — <https://fed.brid.gy/docs> — website-to-Fediverse bridge,
  the preferred Phase 1 mechanism.
