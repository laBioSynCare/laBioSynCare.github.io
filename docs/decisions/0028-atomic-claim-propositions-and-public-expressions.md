# ADR 0028 — Atomic claim propositions and public expressions

**Status:** Proposed — 2026-07-13

Depends on [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md).
On acceptance, supersedes ADR 0018 P7.2's use of one functional C0–C5 value
and a scalar preset ceiling as the semantic model for public claims. Concrete
BSC Lab publication rules remain in
[ADR 0029](0029-bsc-lab-public-claim-publication-profile.md); the deployed
legacy check remains a provisional reject-only compatibility control until a
replacement profile is accepted and implemented for a named surface. Passing
that check never authorizes publication. Once this ADR is active, legacy C
values are migration hints only; without an implemented applicable profile,
publication fails closed.

## Context

A rendered sentence and the proposition it communicates are different things.
One sentence may contain several independently assessable claims, and a
translation may change their meaning. Authorizing a preset category cannot
identify the exact text, proposition, language, or revision being published.

The C0–C5 scheme is also not a total order. C4 condition-benefit content and C5
quantified/comparative form are independent. Likewise, classifying content as
C1 experiential does not erase condition-benefit, causal, or quantified
content. For example, “this cured my migraine in three sessions” is simultaneously
individual-attributed, condition-benefit, causal, and quantified. Exactly one
level would discard safety-relevant information.

## Decision

### 1. Separate proposition from expression

Model two immutable revision classes:

- `sstim:ClaimProposition` — one atomic, independently assessable semantic
  assertion; and
- `sstim:PublicClaimExpression` — exact rendered text or non-text content on a
  named language, audience, surface, and artifact revision.

An expression states one or more propositions. A compound sentence is
decomposed until each proposition can be classified and assessed independently.
An expression records exact text or a canonical content/span digest, creator,
creation time, surface/artifact revision, and revision/supersession provenance.

Translations are separate expression revisions. They may point to the same
propositions only after semantic-equivalence review; otherwise the translation
receives distinct propositions. Editing content or scope creates a new revision
and invalidates decisions that target the old revision.

A proposition identifies its subject through a neutral claim-subject relation.
The generic ontology does not force every claim to concern a preset: a policy
profile may permit or constrain presets, techniques, protocols,
implementations, applications, or other identified subjects.

### 2. Classify with non-exclusive facets

Every proposition/expression receives all applicable controlled facets. The
minimum independent dimensions are:

| Dimension | Example values |
|---|---|
| Subject-matter domain | configuration/descriptive, wellness/function, structure/function, condition/symptom |
| Attribution/generalization | individual-attributed, subgroup/aggregate, generalized |
| Epistemic force | reported experience, association, causal |
| Expression form | qualitative, quantified outcome, comparative, superiority, absolute/guaranteed |
| Communicative role/polarity | benefit/effect assertion, limitation/non-assertion, caution/warning |

Values may co-occur within and across dimensions where their meanings permit.
There is no `claimRank`, maximum facet, or scalar ceiling. A policy evaluates
every triggered rule; no label masks another.

Technical numeric configuration facts remain distinct from quantified outcome
claims. “Uses 10 Hz amplitude modulation” is descriptive parameter data;
“improves focus by 20%” is a quantified outcome proposition. The proposition's
predicate and object, not the mere presence of a number, determine the facet.

### 3. Treat C0–C5 as legacy migration hints

Deprecate `hasPublicClaimLevel` and the C0–C5 ladder as authorization
mechanisms. The values may remain during migration as convenience bundles:

- C0 suggests descriptive/configuration content;
- C1 suggests reported experience, but attribution/generalization and content
  still require independent classification;
- C2 suggests wellness/function content;
- C3 suggests structure/function content;
- C4 suggests a condition/symptom benefit or intended-use assertion; and
- C5 suggests quantified/comparative/superiority form.

These mappings are incomplete and never generate a complete facet set
automatically. Existing instances require review. No claim may be authorized
from a legacy C value or a preset ceiling.

### 4. Represent authorization decisions without defining policy

A policy-neutral `sstim:ClaimAuthorizationDecision` targets one exact
`PublicClaimExpression` revision and every proposition it states. It records
the deciding agent and role, policy IRI/version, decision, date, rationale,
scope, and any validity or invalidation information.

The decision may identify evidence assessments and other inputs, but this ADR
does not define which inputs are sufficient. Approval under one policy,
jurisdiction, audience, language, or surface does not imply approval under
another. An omitted proposition is a validation failure, not an implicit
approval.

## Deferred to policy profiles

This ADR defines representation, not permission. It sets no evidence-tier
threshold, prohibited content, consent rule, reviewer-independence rule,
reference-clearance rule, trusted-dataset boundary, publisher inventory,
jurisdictional conclusion, or legal advice. ADR 0029 defines the BSC Lab
profile; other implementations may define different profiles over the same
claim model.

## Required fixtures

The implementation must demonstrate:

- one compound expression decomposed into multiple propositions;
- a translation revision whose meaning is separately reviewed;
- the migraine example retaining individual, condition, causal, and quantified
  facets simultaneously;
- a generalized experiential statement that cannot hide behind testimonial
  attribution;
- a descriptive 10 Hz configuration fact distinct from a quantified outcome;
- a condition warning or explicit non-assertion distinguished from a
  condition-benefit claim; and
- failure when an expression, proposition, facet, or targeted revision is
  omitted from an authorization decision.

## Alternatives considered

- **Retain one ordinal level.** Rejected because intended use, attribution,
  causal force, and quantified/comparative form are independent.
- **Authorize rendered sentences without propositions.** Rejected because a
  compound sentence can contain claims with different evidence and policy
  outcomes.
- **Authorize propositions without exact expressions.** Rejected because
  wording, translation, audience, and revision alter meaning and risk.
- **Embed BSC thresholds in SSTIM vocabulary concepts.** Rejected because
  product policy is versioned implementation data, not universal ontology
  truth.

## Consequences

- Claim representation becomes more explicit but cannot lose a condition-benefit,
  causal, or quantitative facet through single-label classification.
- Translations and copy edits receive auditable revision-specific decisions.
- Existing C0–C5 data needs reviewed migration and ceases to be an
  authorization mechanism.
- Publication remains fail-closed until an applicable policy profile such as
  ADR 0029 is accepted and implemented.

## Acceptance questions

Accept only after the maintainer confirms the proposition/expression split,
non-exclusive facet dimensions, legacy C0–C5 disposition, permitted generic
subject scope, and policy-neutral authorization record.

## See also

- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — legacy scalar public-claim model.
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — evidence-role separation.
- [ADR 0029](0029-bsc-lab-public-claim-publication-profile.md) — BSC Lab policy profile.
