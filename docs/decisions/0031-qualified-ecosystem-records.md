# ADR 0031 — Qualified ecosystem relationships and public engagement records

**Status:** Accepted — 2026-07-15

> **Archive-boundary clarification, 2026-07-15.** A GitHub release archived by
> Zenodo contains the repository state at the release tag. The term-only output
> of `make snapshot` is not the boundary of that DOI deposit. Consequently,
> real records in the default live-only tier must be published from an external
> mutable store, not committed to this release repository. Repository fixtures
> remain synthetic. This corrects the placement assumption inherited from ADR
> 0024 without changing the qualified-record or consent model below.

## Context

[ADR 0024](0024-stakeholder-ecosystem-modeling.md) established a neutral
`EcosystemAgent` umbrella, public identity rules, organization
notify-and-honor, and stricter self-publication/scoped-consent admission for a
named person. Its first implementation placed relationship types,
targets, provenance, notification, response, and consent directly on an agent.

The 2026-07-13 RDF audit identified this as KR-13. Once an agent has two roles,
targets, or sources, parallel properties cannot say which values belong
together. Agent-level consent is also too broad: a decision applies to a
particular record and purpose, not to every possible statement about a person
or organization. Mutable status strings additionally erase lifecycle history.

The first intended real seed—organizations, Renato, organization memberships,
and responsibility for BSC Lab/BioSynCare implementations—requires those
distinctions before named data is published.

## Decision

### 1. Identity stays on the agent

`sstim-eco:EcosystemAgent` remains the neutral umbrella. Every public agent is
an IRI and is explicitly exactly one of `schema:Person` or
`schema:Organization`, with the corresponding FOAF/ORG typing required by the
public profile.
The agent record contains only minimal public identity, authoritative public
sources, creation/review dates, and exactly one accountable curator.

People, organizations, and implementations remain distinct resources. In
particular, a company is not identical to the software, hardware, platform, or
manual practice it develops or publishes.

### 2. Relationships are qualified records

Each public relationship is a named `sstim-eco:EcosystemRelationship` that
binds exactly one:

- `sstim-eco:relationshipAgent`;
- `sstim-eco:relationshipTarget`;
- controlled `sstim-eco:hasRelationshipType`;
- controlled `sstim-eco:relationshipPurpose`;
- creation and review date; and
- responsible curator.

It also carries one or more IRI-valued `dct:source` values and an optional
validity interval. `sstim-eco:hasEcosystemRelationship` is the inverse link from
the agent. A source is attached to the qualified record it supports, not to an
unscoped collection of assertions on the agent. A relationship target must be a
public-web IRI; schemes such as `mailto:`, `file:`, and private identifiers are
forbidden even though they are syntactically valid RDF IRIs.

Named relationships use
`https://w3id.org/sstim/ecosystem-record/relationship/{id}` and lifecycle
activities use `https://w3id.org/sstim/ecosystem-record/activity/{id}`. This keeps them out of both the
reusable `sstim-eco:` term namespace and the person/organization identity paths.
Every relationship admitted to the public graph ends in one uniquely latest
`PublicationDecisionActivity` with `outcomePublicationApproved`; its actor is
the relationship curator. A person relationship must either be self-published
(the person is curator and final approval actor) or have an earlier scoped
consent grant. This public profile deliberately does not admit a named person
on notification alone.

For the initial seed, Renato is the accountable curator. A real-data artifact
must identify curators and public activity actors as verified
`EcosystemAgent`s in the same reviewed aggregate. A curator approval is an
authorization decision, not merely an arbitrary IRI assertion. Renato's
self-publication is authenticated by a verified maintainer-account review, a
cryptographically signed commit, or a separately authenticated approval whose
evidence is retained in the private ledger. Other people's consent uses an
equivalently verified channel and is scoped to one relationship and purpose.

### 3. Membership and implementation responsibility specialize the pattern

`sstim-eco:OrganizationMembership` is both an ecosystem relationship and an
`org:Membership`. It uses `org:member`, `org:organization`, and `org:role`; the
member and organization must agree with the qualified relationship's agent and
target.

`sstim-eco:ImplementationResponsibility` is an ecosystem relationship whose
target is a `sstim:SensoryStimulationImplementation`. Initial controlled roles
cover developer, publisher, maintainer, provider, operator, institutional host,
and funder. This models responsibility without conflating an implementation
with a person or organization.

### 4. Private history is append-only; the public graph is current-state

Notification, response, publication decision, consent decision, amendment, and
withdrawal are named subclasses of `sstim-eco:EngagementActivity` and
`prov:Activity`. Each activity identifies exactly one relationship, purpose,
controlled outcome, UTC whole-second timestamp, and associated responsible
agent. The complete operational history is append-only only in an
access-controlled private ledger. Every activity in the approved public
projection is mirrored there with the same event IRI, types, label,
relationship, purpose, outcome, timestamp, actor, and predecessor set; the
private ledger may additionally retain non-public events and evidence. It also
retains a complete snapshot of every governed relationship—agent, public target,
type, purpose, public source, dates, curator, and activity backlinks—so a
withdrawal can be audited after the public chain is retracted. While a
relationship is public, those claim fields must exactly match its private
snapshot (private-only revision metadata and events may be additional). An amendment's
generated replacement must itself be a complete relationship snapshot linked to
the old IRI with `prov:wasRevisionOf`.

The public graph is a retractable, approved current-state projection. It may
contain only notification-sent, acknowledged, consent-granted, and
publication-approved outcomes. Failed notification, change request, objection,
decline, withholding, amendment, removal, and withdrawal stay private. After a
blocking event, remove the public relationship and linked activity chain; a
later correction uses a new approved relationship IRI. Email addresses,
authentication identifiers, contact channels, raw messages, verbatim responses,
and consent evidence likewise remain private and are never published here.

Private outcomes have these operational effects:

| Private outcome | Effect on public admission |
|---|---|
| notification failed | Retryable and private. Retry through a verified public/institutional channel; failure neither supplies a positive notification nor by itself invalidates a separately sourced and curator-approved organization fact. |
| consent declined or publication withheld | Do not admit that candidate relationship IRI. A materially new proposal uses a new IRI. |
| objected, removal requested, or consent withdrawn | Permanently blocks public admission for that relationship IRI: retract the relationship, activities, backlinks, and any orphaned agent immediately. A later private withdrawal closure may still be appended after an objection. |
| changes requested or record amended | Retract the old public chain, retain the amendment/revision lineage privately, and mint a newly approved relationship IRI. |

A blocking event never permits a later positive admission outcome on the same
relationship IRI. `changes requested` and `objected` may be followed only by a
private amendment/withdrawal closure; decline, withholding, amendment, removal,
and withdrawal events are chronologically final for that IRI.

Append-only means private events are never overwritten while retained. A
policy-mandated purge is an authorized whole-record lifecycle action governed
by the ledger's retention policy, not an edit to public history.

Routine verification refreshes that do not change agent, target, relationship
type, purpose, consent scope, or substantive claim may retain the relationship
IRI and update `reviewedOn`/sources. A subject-requested correction or any
change to those identity/scope fields requires retraction and a new approved
relationship IRI.

The public agent, relationship, and engagement shapes are closed. A file-wide
artifact profile also allowlists every predicate and described subject, so an
untyped or linked auxiliary node cannot smuggle unreviewed private evidence
around the node shapes. The explicit private-predicate denylist remains a
second graph-wide guard.

`sstim-shapes.ttl` is the public-projection profile and intentionally rejects
amendment, invalidation, withdrawal, and other private operational facts. The
separate `sstim-ecosystem-private-shapes.ttl` validates synthetic or externally
supplied access-controlled ledger events; it never makes a private ledger part
of the public loader, VoID dump, release snapshot, or repository.
That profile proves event structure and ordering, not the real-world identity
behind an actor IRI. Authentication of a self-publication/consent action and
the authorized-curator check remain explicit admission-procedure reviews, with
their evidence retained outside public RDF.

The live-only tier remains the default. Real live-only records belong in an
external mutable publication store that is neither committed to this
Zenodo-tracked repository nor automatically included in a DOI deposit. The
repository loader/dereferencing integration for that store is a separate F3
prerequisite. Archival consent and archival-deposit plumbing are not implemented
by this change; the synthetic fixture must not assert archival permission.

### 5. Flat properties are deprecated, not reinterpreted

The original agent-level relationship and lifecycle properties are marked
`owl:deprecated true`. Their domains and historical meanings are retained for
compatibility; new data is forbidden from using them.

Migration is automatic only when a legacy record has one unambiguous
type/target/source combination. Multi-valued records require manual splitting.
`hasContributedTo` becomes a qualified contributor relationship.
`couldContributeTo` is not migrated as a public fact. `archivalConsent true`
becomes an archival consent event only when the private evidence supports that
interpretation; false or absent does not mean refusal.

## Validation and publication gate

Before real named data is admitted and presented as stable public SSTIM data:

1. OWL, SHACL, JSON-LD context, JavaScript namespaces, and migration notes must
   express this contract together.
2. An isolated synthetic fixture must prove two memberships and two ecosystem
   relationships for one person without cross-association.
3. Negative fixtures must reject wrong agent kind, missing sources/purposes,
   shared decisions, invalid implementation targets, role/subtype bypasses,
   ambiguous or out-of-order state, withheld/declined/terminal outcomes,
   agent/implementation conflation, flat legacy assertions, and direct or
   nested public/private leakage.
4. Ecosystem instances must load into a named graph distinct from the reusable
   ecosystem term graph and pass per-artifact validation and JSON-LD round-trip
   checks. Synthetic fixtures may load from this repository; real live-only
   records must load from the designated external mutable store.
5. Synthetic fixtures and real public records must use distinct graphs/dumps;
   a synthetic private-terminal test must prove the terminal relationship is
   absent from the public graph.
6. Before public F4 admission, an access-controlled private ledger must have a
   named access owner and retention policy, and its append/retract procedure
   must pass the synthetic terminal-event drill. The current admission command
   accepts an external ledger (`make ecosystem-contract
   PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl`) and rejects a ledger stored
   inside the public repository, a missing public-event mirror, and a leaked or
   orphaned terminal record. Before F4, extend the access-limited publication
   job to materialize the candidate public aggregate from the external mutable
   store and validate it together with that ledger, without committing either
   artifact here. That publication job must fail closed. Public logs receive
   only redacted failures, never raw private SHACL reports or identifiers.
   The repository's private-fixture directories are exact-inventoried synthetic
   test surfaces; any additional entry fails the contract so they cannot become
   an accidental place to commit a real ledger.
7. The term contract must enter a stable citable release before F4. Before
   authoring real data, designate a mutable publication store outside this
   release repository, document its retention/removal controls, and make the
   loader and per-resource dereferencing path consume that store. Author real
   data locally or in an access-limited draft, validate it with the same
   contract, and publish it only to that store. Submit and verify the reviewed
   w3id rules after their targets are live; do not announce or expose the
   discovery view until the persistent IRIs resolve.

## Consequences

- Real records require more nodes, but every claim, source, purpose, and public
  decision remains auditable.
- A person's relationship to several companies or SSTIM resources is no longer
  ambiguous.
- Removal and amendment remain auditable privately while the identifying old
  chain is removed from the active public projection. Third-party copies of
  facts already served publicly cannot be recalled, which is one reason the
  profile requires self-publication or scoped consent for people.
- Existing flat data, if any appears externally, remains interpretable during
  the 0.7 compatibility window but is not accepted as new conforming data.
- Sessions, participant observations, HED, and BIDS remain independent work and
  are not prerequisites for ecosystem records.

## See also

- [ADR 0024](0024-stakeholder-ecosystem-modeling.md) — initial agent identity
  and governance posture, amended by this decision.
- [ADR 0007](0007-framework-protocol-implementation.md) — distinction between
  agents and implementations.
- [RDF audit KR-13](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md#kr-13--ecosystem-relationships-and-consent-are-flattened-onto-the-agent).
- [ADR 0031 migration notes](../ontology/ADR_0031_MIGRATION_NOTES.md).
- [Ecosystem Integration, Workstream 5](../ecosystem/ECOSYSTEM_INTEGRATION.md#workstream-5--stakeholder-ecosystem-rdf-module-adr-0024-implementation).
