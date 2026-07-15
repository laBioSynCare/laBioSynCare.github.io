# ADR 0031 migration notes

**Applies to:** SSTIM `0.7.0` ecosystem data
**Decision:** [ADR 0031](../decisions/0031-qualified-ecosystem-records.md)
**Status:** F1/F2 contract migration and stable term release complete; external-store F3 deployment pending; no legacy instance conversion required

## Baseline

No real or synthetic `EcosystemAgent` instance data was committed under the
original flat ADR 0024 contract. The `0.7.0` change therefore migrates the
term and validation surface, but it does not rewrite any historical agent
record. The committed `synthetic-ecosystem.ttl` graph is new contract-test data,
not converted personal data.

The original flat properties remain declared with `owl:deprecated true` so an
external graph can still be interpreted during the 0.7 compatibility window.
New committed data must use named qualified records and will fail SHACL if a
flat property is asserted on an ecosystem agent.

## Identifier placement

- Person identities: `https://w3id.org/sstim/specialist/{id}`
- Organization identities: `https://w3id.org/sstim/organization/{id}`
- Public current-state relationships:
  `https://w3id.org/sstim/ecosystem-record/relationship/{id}`
- Public approved/positive lifecycle activities:
  `https://w3id.org/sstim/ecosystem-record/activity/{id}`
- Implementations retain their existing
  `https://w3id.org/sstim/implementation/{scope}/{id}` identity.

Identifiers are persistent, public, and role-specific. Never place an email,
account identifier, contact address, or mutable job title in an IRI. A person,
organization, and implementation always receive distinct IRIs.

## Flat-to-qualified disposition

| Legacy property | Qualified disposition |
|---|---|
| `relationshipType` + `relatesTo` | Mint one `EcosystemRelationship` for each unambiguous agent/target/type combination. |
| `recordSource` | Convert a verified public URL to IRI-valued `dct:source` on the relationship it supports. Free text requires manual review and is not published as an IRI. |
| `curatedBy` | Move to `prov:wasAttributedTo` on the agent and each relationship. |
| `addedOn` | Move to `dct:created`; add a separate current `reviewedOn` value. |
| `hasContributedTo` | Mint a relationship with `hasRelationshipType contributor`, after its target and public source are verified. |
| `expertiseArea` | Manual review only. It is not losslessly equivalent to contribution, endorsement, or implementation responsibility. |
| `couldContributeTo` | Do not migrate as a public fact. |
| `contributionStatus` | No automatic mapping; reconstruct factual relationships from sources or omit it. |

Automatic conversion is allowed only when the legacy values identify one
agent, one target, one type, one purpose, and the source that supports that
combination. Parallel multi-valued properties are ambiguous and must be split
manually; no Cartesian product may be generated.

## Lifecycle disposition

- `notificationStatus=notified` plus a valid notification timestamp may become
  a `NotificationActivity` with `outcomeNotificationSent` for one identified
  relationship and purpose. `failed` may become `outcomeNotificationFailed`.
  A failure is private and retryable; it is not positive notification, but does
  not by itself invalidate a separately sourced and approved organization fact.
  Absence or `not-notified` does not create an event.
- A dated acknowledgement may become a public `ResponseActivity` only when its
  preceding notification and scoped relationship are known. Objections and
  change requests remain only in the private operational audit.
- A scoped consent grant may become a public `ConsentDecisionActivity` when its
  exact relationship, purpose, and person actor are known. Decline and
  withdrawal remain private; a generic agent-level `consented` value is not
  broad consent for every relationship.
- A dated removal request or withdrawal becomes a private
  `WithdrawalActivity`. The affected relationship, its public activities and
  backlinks, and any orphaned agent are removed from the active public graph;
  no identifying public tombstone is retained.
- A requested correction retracts the old public chain. Record the private
  `AmendmentActivity` and revision lineage, mint a distinct replacement
  relationship IRI, and admit that replacement only after a new final approval.
  Routine source/review refreshes may retain the IRI only when agent, target,
  type, purpose, consent scope, and substantive claim remain unchanged.
- `archivalConsent=true` is not migrated into the public graph until the
  separate archival pipeline and private evidence gate exist. Current SHACL
  deliberately rejects an archival consent grant.
- `notificationChannel`, `responseNote`, contact details, raw messages,
  authentication identifiers, and consent evidence remain private operational
  data. They are never copied into public RDF.
- Public agent, relationship, and engagement profiles are closed. An
  unreviewed predicate is rejected even when it is not on the explicit private
  denylist; propose and review a public field before extending the profile.
- Every public relationship ends in a uniquely latest publication approval by
  its curator. Person relationships require self-publication or an earlier
  scoped consent grant. Negative/operational outcomes are never copied from the
  private ledger into a public artifact.

Do not invent missing timestamps, purposes, evidence, decisions, or historical
events. When the legacy record is insufficient, retain it outside the public
graph for manual review or omit the claim.

## Verification

Before accepting converted or newly authored public data:

1. Validate the artifact in isolation with the reusable term modules and full
   SHACL-SPARQL constraints.
2. Verify JSON-LD compaction/expansion is graph-isomorphic and preserves date
   and date-time datatypes.
3. Confirm every local object IRI resolves, synthetic fixtures and real records
   use distinct graphs/dumps, and the file-wide subject/predicate allowlist
   finds no untyped auxiliary or private field.
4. Review identity, source, purpose, admission basis, final approval actor,
   lifecycle ordering, external-store/third-party-copy disclosure, and
   live-only status manually.
   Every real curator/activity actor must be a verified agent in the aggregate;
   authenticate self-publication or scoped consent through a verified account,
   signed commit/review, or separate evidence retained in the private ledger.
5. Validate access-controlled operational events separately with
   `sstim-ecosystem-private-shapes.ttl`; the public `sstim-shapes.ttl` profile
   intentionally rejects amendment, invalidation, and withdrawal facts. Every
   admitted public activity must be present in that complete private history
   with the same core event fields.

The executable synthetic proof and adversarial cases are run by
`make ecosystem-contract`; once a real aggregate exists, run
`make ecosystem-contract PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl` so the
external complete-history mirror and terminal cleanup are also gated. The
repository-wide gate remains `make validate`.
