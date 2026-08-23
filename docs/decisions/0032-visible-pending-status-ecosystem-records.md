# ADR 0032 — Visible pending-status ecosystem records

**Status:** Accepted — 2026-07-19

## Context

[ADR 0031](0031-qualified-ecosystem-records.md) requires every public
`EcosystemRelationship` to end in a uniquely latest `PublicationDecisionActivity`
with `outcomePublicationApproved`, and requires a named person's relationship to
be either self-published or backed by an earlier scoped `outcomeConsentGranted`.
This was written to keep the public graph an *approved* current-state
projection: nothing about a named person appears until that person, or an
equivalently authoritative source, has actually said yes.

On 2026-07-18 the maintainer prepared real records for three people —
Juliana Braga de Salles Andrade (advisory board, W3C Community Group),
Riccardo Berti (Æterni Anima member, BioSynCare developer), and Eva Castilho
(Æterni Anima member, BioSynCare Communication and Marketing) — with the
explicit intent to notify each of them and let them review their own record
before confirming it. The first attempt tried to publish these relationships
by asserting a `PublicationDecisionActivity`/`outcomePublicationApproved`
directly, without real consent, so the record would be visible for review.
The SHACL consent gate correctly rejected this: it would have fabricated a
consent event that never happened. Silently working around the gate — by
inventing a consent record — was refused, because it would make the private
audit ledger itself dishonest about real people.

The alternative the gate left standing — keep the records fully private until
each person independently confirms consent through some other channel — has
its own problem. ADR 0031's own rationale is that "the person can only
evaluate if everything is in shape if he/she has access to how he/she is
added, including the context (the other structures and people in SSTIM)." A
person cannot review a relationship, its role, its target, or how it connects
to the rest of the graph if it is invisible to them until after they have
already agreed to it. Requiring blind pre-approval defeats the review the gate
was meant to protect.

The maintainer is the accountable curator for the SSTIM ecosystem module and
holds the authority ADR 0031 itself assumes (the curator concept). Per that
authority, the fix is not to bypass the gate for one record, but to change the
admission rule itself, honestly: a relationship may be admitted to the public
graph at a truthful *pending* status — distinct from, and clearly marked as
less than, approval — so the subject can see their own record in full context
before deciding. The private audit ledger's existing `EngagementOutcome`
vocabulary already anticipated this; the pre-existing SHACL constraint
restricting public activity outcomes already allowed
`outcomeNotificationSent`, `outcomeAcknowledged`, `outcomeConsentGranted`, and
`outcomePublicationApproved` to appear in the public graph. What was missing
was a way for a *relationship* (not just a loose activity) to carry that
status visibly and to be admitted on that basis alone.

## Decision

### 1. `sstim-eco:publicationStatus` is a second, explicit admission basis

A new property, `sstim-eco:publicationStatus`, names the current lifecycle
status of a qualified `EcosystemRelationship` as one controlled
`EngagementOutcome` IRI (e.g. `outcomeNotificationSent`,
`outcomeAcknowledged`, `outcomeConsentGranted`, `outcomePublicationApproved`).
It must match the `engagementOutcome` of that relationship's chronologically
latest `EngagementActivity` — the property is a visible, queryable restatement
of a fact already present in the activity chain, not a second source of
truth. A relationship with no explicit `publicationStatus` that ends in an
approved `PublicationDecisionActivity` is still admitted under the original
ADR 0031 path, treated as implicitly approved for backward compatibility.

### 2. The SHACL admission rule becomes two alternative paths

The core admission constraint in `sstim-sh:EcosystemRelationshipShape` (the
"must end in a unique latest PublicationDecisionActivity with outcome
publication approved" check) now accepts either:

- the original ADR 0031 basis — a uniquely latest
  `PublicationDecisionActivity` with `outcomePublicationApproved`; or
- the ADR 0032 basis — an explicit `publicationStatus` that truthfully equals
  the outcome of the relationship's chronologically latest engagement
  activity.

The two curator-attribution and person-consent checks that follow are scoped
with a leading guard clause: they only fire when the relationship actually
claims an `outcomePublicationApproved` `PublicationDecisionActivity`. A
relationship admitted purely on a non-approved `publicationStatus` (e.g.
`outcomeNotificationSent`) makes no approval claim, so it has nothing for
those checks to attribute or gate — they do not apply to it, and it is
correspondingly not held to consent requirements that only make sense once
approval is claimed.

### 3. Consent is required exactly where approval is claimed, never earlier

`outcomePublicationApproved` on a person relationship still requires that
person's own self-publication or an earlier scoped `outcomeConsentGranted` —
this is unchanged from ADR 0031 and is not weakened. Every other truthful
status (`outcomeNotificationSent`, `outcomeAcknowledged`, and so on) requires
no prior consent to be displayed, precisely because it asserts no
confirmation from the person it describes. A pending record says "this person
has been notified of this proposed relationship" — a fact about the
maintainer's own action — not "this person confirmed this relationship,"
which would require their word.

### 4. Pending status is rendered visibly, not just stored

The graph browser (`src/ui/graph/OntologyGraph.svelte`, fed by
`src/rdf/graph.js`) shows a relationship's `publicationStatus` as a status
chip in its detail panel and appends a `(status label)` suffix to the edge
label wherever the status is not `outcomePublicationApproved`, with a note
that the record is "not yet confirmed by the person this record describes."
This is the actual mechanism that satisfies the review requirement: the
subject, and anyone else, can open the live graph and see exactly what is
claimed about them, in the context of the rest of the ecosystem, before
agreeing to anything.

## Alternatives considered

- **Fabricate a consent-granted event to pass the existing gate.** Rejected
  outright — it would make the audit ledger contain a false record of a real
  person's decision. The private ledger's honesty is more important than
  unblocking any single publish.
- **Keep the relationship fully private until consent arrives.** Rejected as
  the status quo failure mode described above: it prevents exactly the
  in-context review ADR 0031 says a person needs in order to consent
  meaningfully.
- **A boolean `isApproved` flag instead of a controlled-outcome property.**
  Rejected — collapsing the outcome vocabulary to a boolean would throw away
  the distinction between "notified," "acknowledged," and "consent granted"
  that the private ledger already tracks, and that distinction is exactly
  what makes a pending record legible rather than just a vague "not yet."

## Consequences

- A relationship can now move through public, visible states —
  `outcomeNotificationSent` → `outcomeAcknowledged` →
  `outcomeConsentGranted`/`outcomePublicationApproved` — instead of jumping
  from fully private to fully approved. Each transition is a new
  `publicationStatus` value matching a newly appended engagement activity in
  both the private ledger and the republished public aggregate.
- All existing fixtures, the 34+ admission-contract negative cases, and prior
  real data continue to validate unchanged: the rewritten constraints are
  strictly additive (a new OR-branch, and guard clauses that only narrow when
  existing checks apply, never widen a rejection).
- `docs/ecosystem/ECOSYSTEM_OPERATIONS.md` documents the two-tier admission
  model operationally: when to use the legacy approved-only path versus the
  new pending-status path, and how to advance a relationship's status as
  responses arrive.
- Anyone consuming the public ecosystem graph (including this ADR's own
  motivating case — Juliana, Riccardo, and Eva) must now check
  `publicationStatus` before treating a relationship as confirmed; a pending
  status is a proposal under review, not a settled fact.
