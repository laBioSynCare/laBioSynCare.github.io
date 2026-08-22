# Interview Protocol

> **Status: governance instrument. Binding on every Track A interview in**
> [`INTERVIEW_TARGETS.md`](INTERVIEW_TARGETS.md). It implements
> [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md) and
> [ADR 0031](../decisions/0031-qualified-ecosystem-records.md) for the specific
> case of an interview, and it uses the controlled values SSTIM already defines
> rather than inventing a parallel vocabulary. Operational running of the
> publication pipeline is in [`ECOSYSTEM_OPERATIONS.md`](ECOSYSTEM_OPERATIONS.md).

## Why this exists

The pipeline ran once before it was written down. The 2026-07-22 interview with
Theo Marins produced [ADR 0035](../decisions/0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](../decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md),
new neuromodulation terms and release 0.10.0. Every one of those artifacts
carries a single `dct:creator`, and it is not his.

That is a provenance failure of exactly the kind SSTIM exists to prevent. The
ontology can express qualified, sourced, consent-gated attribution better than
most projects, and it was not applied to the one case where someone else's
expertise entered the graph. Fixing that case is the first application of this
document, and no further substantive external interview happens until it is
fixed.

## The five consents

Consent is not one decision. Ask for these separately, name them separately, and
record them separately. A yes to one is never a yes to another.

| # | Consent | Controlled purpose | Default if unasked |
|---|---|---|---|
| 1 | **Notes and recording.** May we take notes? Record audio? | (private, no RDF) | Notes yes, recording no |
| 2 | **Quotation and paraphrase.** May we quote you in an ADR, a scope note, or a public document? Verbatim, or paraphrase only? | (private, governs drafting) | Paraphrase only, unattributed |
| 3 | **Public attribution.** May we name you as the source of the contribution? | `purposePublicAttribution` | No |
| 4 | **RDF representation.** May we record you as a named agent in the public ecosystem graph, with a stated relationship type? | `purposePublicDiscovery`, `purposeLivePublication` | No |
| 5 | **CG membership.** Would you like to join the W3C Community Group? | (external, self-asserted at W3C) | Not applicable |

Consent 5 is an invitation, never a condition. Declining it has no effect on
1 to 4, on the interview's value, or on whether we ask this person again.

Consents 3 and 4 are distinct and are commonly answered differently. Someone may
be glad to be thanked in an ADR and unwilling to appear as a node in a published
graph. Honor the narrower answer.

## Relationship types

When consent 4 is granted, record the relationship using the controlled type that
is actually true. The values live in `sstim-ecosystem.ttl`:

| Situation | Type |
|---|---|
| Their expertise produced terms, an ADR, or an encoded protocol | `contributor` |
| They reviewed and challenged existing modelling | `contributor`, scoped to the review artifact |
| Ongoing joint work | `researchCollaborator` |
| Standing advisory relationship | `scientificAdvisor` |
| Their published work is cited as a source | `citedAuthor` |
| Interested party, no contribution yet | `stakeholder` |

Pick the narrowest type the facts support. `scientificAdvisor` in particular
implies a standing relationship and needs its own explicit agreement: it is not
an upgrade you award someone for a good interview.

## Lifecycle

The engagement activities and outcomes are already modeled. Use them.

```text
schedule
   |
   v
interview  ......................  consents 1 and 2 asked at the top of the call
   |
   v
draft artifacts (ADR, terms, instance TTL)
   |
   v
send draft for review  ..........  outcomeAcknowledged / outcomeChangesRequested
   |
   v
ask consents 3, 4, 5  ...........  outcomeConsentGranted / outcomeConsentDeclined
   |
   v
publish artifacts  ..............  outcomePublicationApproved / outcomePublicationWithheld
   |
   v
notify on release  ..............  outcomeNotificationSent / outcomeNotificationFailed
```

**Review before publication is not optional.** Send the derived artifacts, not a
summary of them: the actual ADR text, the actual Turtle, the actual scope notes.
An interviewee who has not seen the terms cannot meaningfully consent to being
named as their source, and misattributed modelling is worse for them than no
attribution at all.

**Withdrawal and correction.** `outcomeConsentWithdrawn`, `outcomeRemovalRequested`,
`outcomeObjected` and `outcomeRecordAmended` exist and are honored promptly.
Removal takes the record out of the public graph; the private ledger retains the
event, because a withdrawal that leaves no trace cannot be audited. Corrections
amend through the PROV revision chain rather than silently overwriting.

Note the asymmetry that follows from released snapshots being immutable: an ADR
and a `static/ontology/<version>/` release cannot be rewritten after the fact. So
a withdrawal removes the person from the live graph and from current documents,
and the frozen release keeps whatever it already said. Say this out loud when
asking consent 3, before it is given, not after it is withdrawn.

## Checklists

### Before the call

- [ ] Interview type recorded (contribution, expert review, exploratory).
- [ ] The slot it closes or tests is named, or the discovery objective is
      written down for an exploratory call.
- [ ] Their published work read well enough to not waste their time.
- [ ] Relevant current SSTIM state to hand: the terms, the scope notes, the ADR.
- [ ] No-claims discipline refreshed (`CLAUDE.md` §3.5,
      [`SCOPE.md`](../concept/SCOPE.md)). The ask is to encode, reproduce or
      review a protocol. It is never to endorse BSC or to validate a health
      benefit.

### During

- [ ] Consents 1 and 2 asked explicitly, at the start.
- [ ] The framing stated: this feeds a vendor-neutral vocabulary in a W3C
      Community Group, and BSC Lab is one implementation of it, not its owner.
- [ ] Ask what we have modeled wrongly, not only what we are missing. An
      interview that only adds is an interview that found nothing.
- [ ] Ask for one concrete protocol we could encode.

### After

- [ ] Draft the ADR and terms.
- [ ] Send the actual drafts for review.
- [ ] Ask consents 3, 4 and 5, separately and by name.
- [ ] Record the qualified relationship if consent 4 granted, with curator,
      source set and purpose, per ADR 0031.
- [ ] Add `dct:contributor` on the artifacts if consent 3 granted. Ontology
      files are protected: this needs an explicit maintainer instruction naming
      the file (`CLAUDE.md` §3.4, [ADR 0004](../decisions/0004-protected-ontology-files.md)).
- [ ] Update the interview log in [`INTERVIEW_TARGETS.md`](INTERVIEW_TARGETS.md).
- [ ] Invite to the CG, if consent 5 was positive.
- [ ] Notify on the release that carries their contribution.

## Open remediation

**Theo Marins, interviewed 2026-07-22.** Live-published at notified status;
consent for approved status pending. Outstanding:

1. Send ADR 0035 and ADR 0036 and the neuromodulation module terms for review.
2. Ask consents 3, 4 and 5 explicitly and separately.
3. If consent 3 is granted, add `dct:contributor` to the artifacts his interview
   produced. This touches protected files and needs a maintainer instruction.
4. If consent 4 is granted, move the ecosystem record from notified to approved
   with relationship type `contributor`.
5. Record the outcome in the interview log.

Until step 2 has an answer, no further substantive external interview is
scheduled. One unresolved attribution is an oversight. A pipeline that scales
before resolving it is a policy.
