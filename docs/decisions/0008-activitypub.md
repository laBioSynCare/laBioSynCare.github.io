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

### Phase 1 — Stable dereferenceable JSON-LD (deferred)

Add HTTP content negotiation so that requests to `w3id.org/sstim` terms with
`Accept: application/ld+json` return proper JSON-LD. This is the semantic web
federation story; ActivityPub is not the right protocol for linked data
federation. SPARQL federation and the Linked Data Platform (LDP) are.

### Phase 2 — Minimal Firebase-backed project actor (conditional)

If Phase 0 generates genuine community engagement that warrants follower-based
delivery, implement a single `@lab@biosyncare.org` project actor backed by
Firebase Functions. Strict constraints if this phase is ever entered:

- Project actors only (`@lab`, `@presets`, `@ontology`). No user actors.
- Outbound publishing only: preset releases, ontology updates, protocol notes,
  release announcements.
- No inbox social UI in BSC Lab. Received activities are logged, not rendered.
- No federated session logs. Health-adjacent personal data is never federated.
- No media uploads from remote actors.
- Replies disabled or hidden by default; moderation must be resourced before
  enabling them.
- Limited/allowlist federation at launch; open federation only after moderation
  capacity is confirmed.

Phase 2 is not a roadmap commitment. It requires an explicit decision triggered
by evidence from Phase 0.

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
as misleading.

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
- No server-side ActivityPub code is added to the codebase unless Phase 2 is
  explicitly approved.
- If Phase 2 is entered, the `src/federation/` module is created under
  Firebase Functions; it does not touch the static SvelteKit app.
- Any federated object that represents a BSC artifact must pass the same
  claim-discipline rules as UI copy (see `docs/concept/SCOPE.md` and CLAUDE.md
  §3.5): no health or treatment claims.

## See also

- `docs/concept/SCOPE.md` — claim discipline for all public BSC copy.
- `docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md` — standards positioning.
- [0007](0007-framework-protocol-implementation.md) — BSC Lab as open
  implementation, not social network.
