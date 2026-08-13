# ADR 0048 — Session events and qualified participant observations

**Status:** Accepted — 2026-08-13

## Context

The [2026-07-13 RDF audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
raised two findings that outlived every release since.

**KR-02** found three incompatible session contracts — the live ontology,
`SESSION_MODEL.md`'s prose, and a JSON-LD coercion that disagreed with the SHACL
shape — and no committed schema or recorder to say which was authoritative. The
prose example used three terms the ontology has never defined
(`sstim:headphoneMode`, `sstim-v:headphones`, `sstim-v:completed`), so it could
not have validated against anything, and nothing ran it to find out.

**KR-03** found that the self-report model could not represent the ordinary BSC
Lab history use case. Five scalars — affect, focus, sleepiness, quality, and a
goal-achieved boolean — cannot carry the participant's own stated goal, a direct
helpfulness magnitude, the instrument and prompt that produced an answer, or the
difference between an answer that was not given and one that was never asked
for. The class definition promised optional free text that no property supported.

The native half was built first (commit `5e1fa96`): one versioned JSON Schema,
a recorder that reads only the engine timing context, four golden cases, and an
RDF projection that reported every field it could not carry. That projection's
generated work order named **18 terms SSTIM did not have**, and until they
existed the projection withheld rather than minted — the KR-17 failure being a
serialiser inventing `sstim:` IRIs for things the ontology never defined,
producing graphs that look authoritative and validate against nothing.

This ADR adds those terms.

## Decision

### 1. The execution timeline is representable

`sstim:SessionEvent` (⊑ `prov:Activity`), linked from `sstim:SessionInstance` by
`sstim:hasSessionEvent`, typed by `sstim:hasEventType` against a ten-member
controlled scheme, and placed by `sstim:sessionClockOffsetSeconds`.

**Ordering lives in the offset, not in statement order.** An RDF graph is a set;
a consumer reading a timeline off statement order would get a different answer
each time. Every event therefore carries an offset, and SHACL requires it.

The offset is measured on the session's own timing context from
`sstim:clockOriginSeconds`, recorded on the instance, with
`sstim:hasTimingAuthority` saying which surface produced it — audio hardware, or
a monotonic substitute for a silent or visual-only session. The pair
reconstructs the exact timing-context reading of every occurrence without a wall
clock, which matters because wall clocks drift against audio hardware and a
timeline built from them cannot be aligned to the stimulus it describes
(`CLAUDE.md` §3.1).

This is the term set that unblocks the HED event profile. HED describes what
occurred and when; before this, SSTIM could not say that anything occurred.

### 2. Delivered time is distinct from elapsed time

`sstim:deliveredDurationSeconds` records time actually delivering stimulus.
A session paused for ten minutes and a session that ran ten minutes shorter have
the same elapsed time and different exposures, and only the second quantity
describes what reached the subject. A SHACL-SPARQL constraint holds delivered ≤
elapsed.

### 3. A specification states what it can promise

`sstim:hasReproducibilityLevel` against three levels — identical rendering,
equivalent signal, equivalent presentation — plus `sstim:configurationDigest`
and `sstim:digestAlgorithm`.

`sstim:SessionSpecification`'s own definition asserts fully determined output,
which is a stronger claim than a live browser audio pipeline can honour. Rather
than weaken a frozen definition, the record now states its own level, and the
honest default for a Web Audio session is *equivalent presentation*. Naming a
configuration establishes which one was intended; the digest establishes that it
still says what it said. A digest without its algorithm cannot be recomputed, so
SHACL-SPARQL requires the pair.

### 4. Observations are qualified, and absence carries its reason

`sstim:ParticipantObservation` is one addressable answer: a role, a **required**
response state, an optional value, and the prompt and scale that produced it.
`sstim:ObservationInstrument` carries id, version and language, because answers
are not comparable across instrument versions.

Six response states — supplied, none-reported, not-asked, declined, unknown,
not-applicable — because a missing triple says only that a triple is missing.
"Nothing to report", "we did not ask" and "the participant declined" are three
different facts about a session, and a safety history that cannot distinguish
them is worse than one that is absent, because a consumer would trust it. A
SHACL-SPARQL constraint enforces that a value is present if and only if the
state is `supplied`.

Perceived helpfulness becomes a first-class role with a declared scale — the
direct magnitude item KR-03 found missing. `goalAchieved` remains a yes/no
self-assessment against the participant's own stated goal, which is now itself
recordable as an observation with its own response state.

`sstim-v:reportDuringSession` closes the fourth phase. Until now a during-session
report had no phase and could not be represented at all.

A during-session report also carries `sstim:sessionClockOffsetSeconds`, which is
why that property has a union domain rather than being named for events: it is
the same measurement against the same clock, and without it on the report there
is no path in the graph from an answer to how far into the session it was given
— the report-collected event knows, but the link back to its report is event
detail, which is withheld.

### 5. Unwanted experiences, and what they are not

`sstim:UnwantedExperienceObservation` with a controlled category, participant-
reported severity, onset phase and offset, persistence, action taken,
resolution, and participant-perceived relatedness.

**It is deliberately not called a side effect or an adverse event.** Both assert
a causal or clinical conclusion that a participant report cannot establish, and
either name would make every record of ordinary discomfort read as a safety
finding. Nothing here applies a clinical grading scale or maps to a clinical
adverse-event terminology; severity is what the participant said, relatedness is
what the participant thought, and neither is promoted to an attribution by any
query, export, or aggregation.

The act of asking is itself an observation carrying its own response state,
linked to whatever was described. An empty list of experiences cannot express
"asked, none reported" as distinct from "never asked".

### 6. The five legacy scalars are kept, and are now additive

`primaryAffect`, `focusRating`, `sleepiness`, `subjectiveQuality` and
`goalAchieved` remain valid as documented simple projections of the qualified
model. The projection emits them **alongside** the observations rather than
instead of them, so an existing consumer keeps reading what it always read while
the qualified record beside it carries what the scalar cannot.
`sstim-sh:SelfReportShape` now accepts either form, so no existing report became
non-conformant.

## Consequences

**Terms.** 435 uniquely owned OWL terms (was 398), 519 concepts (was 461), 62
schemes (was 53). The Full profile gained a second competency question and its
positive fixture, covering the execution timeline: a term set with no executable
demonstration is a claim rather than a contract. All in `sstim-session.ttl` and `sstim-vocab.ttl` — no new
module, no new dependency edge, no new route. A later split into an
`observation` module stays open if the session module grows further; ADR 0043
already records finer packaging as deferred work.

**The withheld list shrank from 18 to a handful**, and it is still generated
from what the projection could not carry, so it cannot claim a gap that has
closed. What remains withheld is now withheld on purpose:

- **Free text** — `sstim:observedTextValue` exists; the projection withholds it
  unless the caller passes `includeFreeText`, because free text can carry
  identifiers no schema anticipates (improvement plan §2.2).
- **The privacy profile** — by design. It governs whether a projection may be
  published at all, so it travels beside the graph, and consent decisions belong
  in a separate access-controlled named graph (`CLAUDE.md` §5.5). Terms for it
  are deliberately **not** minted here: that is a governance decision entangled
  with [ADR 0031](0031-qualified-ecosystem-records.md)'s public/private split
  and deserves its own ADR.
- **Event detail** — which engine replaced which, which parameter a safety limit
  constrained and to what value. The event is recorded; its particulars are not.
- **The execution environment** — engine identity and build, declared output
  route, sample rate, latency. This is equipment, and equipment is the concern
  [`EQUIPMENT_CHECK.md`](../technical/EQUIPMENT_CHECK.md) is already designing.
  Minting a parallel output-route scheme here would duplicate
  `sstim-ex:capabilityHeadphones` badly, and reaching into the exposure module
  from the session module would add a dependency edge for a cross-reference.

**Validation, and a gap the first pass left.** Three of the new constraints
relate one value to another and need SHACL-SPARQL. `rdf-validate-shacl`, which
runs the projection conformance tests beside their producer, has no
SPARQLConstraintComponent validator and strips `sh:sparql`; `make
shacl-instances` covers committed files, and a projection is not one. So the
constraints that police cross-field contradictions were the only constraints
nothing ran against projected output.

Two real defects were hiding in exactly that blind spot, both found on review:

1. `sstim:actualDurationSeconds` is `xsd:integer` and
   `sstim:deliveredDurationSeconds` is decimal. Rounding elapsed time *to
   nearest* could put it below delivered time — a 602.4 s session that delivered
   all of it projected as 602 elapsed and 602.4 delivered, violating the
   delivered ≤ elapsed constraint on data that was entirely correct. Elapsed is
   now rounded up, which can only overstate by under a second and never breaks
   the invariant.
2. A *supplied* stated goal whose free text was withheld projected as an
   observation with `responseSupplied` and no value — an answer claiming the
   participant said nothing. Such a goal is now withheld whole; the states that
   carry no text anyway (declined, not-asked) still project, and those are the
   ones that record the question was put.

Both are closed, and so is the blind spot: `make shacl-session-projection` emits
every golden projection plus two edge cases and validates them under pySHACL
with SPARQL active. `make shacl-session-negative` asserts the other direction —
six contradictions, each rejected by its own constraint's message — because a
constraint that never fires passes every positive suite.

Three further guards came out of the same review, each verified by breaking it
first: the projection refuses to resolve a controlled value the vocabulary does
not declare rather than minting `sstim-v:undefined`; a test asserts the
projection's concept tables and the schema's enums cover each other exactly; and
another asserts every concept name those tables can emit exists in the
vocabulary, which a misspelling would otherwise reveal only on a recording that
happened to use that value.

## Alternatives considered

**A new `observation` module.** More principled under ADR 0043's concern
boundaries, and rejected as premature: it would add a manifest entry, graph IRI,
loader entry, VoID subset, profile membership and w3id routes for terms whose
concern — what happened in a session and what the participant said about it — is
exactly what the session module already declares itself to be for.

**Reusing `sstim:SelfReportPhase` for experience onset.** Rejected: when an
experience began and when it was reported are different facts, and experiences
are routinely described later than they started. `later-same-day` and `next-day`
have no report-phase counterpart.

**Leaving the five scalars deprecated.** Rejected: they are in released
snapshots and in the one committed session fixture. Deprecating them would
invalidate published data to make the model look tidier.

**English-only labels.** Rejected; all 57 new concepts carry the four-language
`skos:prefLabel` set the vocabulary uses throughout.

## Authorization

Modifying `static/ontology/*.ttl` requires an explicit human instruction naming
the files (`CLAUDE.md` §3.4). Renato gave that permission in session on
2026-08-13, in direct response to a listing of the three files this ADR
changes — `sstim-session.ttl`, `sstim-vocab.ttl`, `sstim-shapes.ttl` — together
with `context.jsonld` and `manifest.json` checksums, which are generated.

## References

- [Improvement plan](../ontology/IMPROVEMENT_PLAN.md) §0.2, §2.1–2.3
- [`SESSION_MODEL.md`](../technical/SESSION_MODEL.md) — the contract this projects
- [`static/schemas/session.schema.json`](../../static/schemas/session.schema.json)
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — why an
  observation is not an evidence claim
- [ADR 0031](0031-qualified-ecosystem-records.md) — the qualified-record pattern
  this follows for observations
