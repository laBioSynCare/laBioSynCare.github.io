# ADR 0029 — BSC Lab public-claim publication and authorization profile

**Status:** Proposed — 2026-07-13

Instantiates the claim model proposed in
[ADR 0028](0028-atomic-claim-propositions-and-public-expressions.md) using
evidence assessments from
[ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md). On acceptance
and implementation, replaces the deployed ADR 0018 P7.2 enforcement for the
BSC Lab release surfaces enumerated by this profile. It does not govern private
BioSynCare catalog/copy without a separate integration contract.

## Context

SSTIM can represent claims and evidence without asserting one universal legal
or marketing policy. BSC Lab nevertheless needs a fail-closed release rule for
the public surfaces controlled by this repository.

That rule cannot live only in RDF semantics. SHACL cannot discover omitted
website copy, and an RDF graph cannot establish its own trustworthiness.
Likewise, a repository-local hash detects drift but does not protect against a
malicious committer who can change both data and hash.

## Decision

### 1. Use a versioned BSC policy profile

Publish the concrete rules as BSC implementation data and a BSC-specific
SHACL/application profile, not intrinsic SSTIM class or SKOS semantics. Each
policy revision records owner, effective/as-of dates, jurisdictional scope,
audiences, languages, controlled surfaces, and supersession history.

Unknown policy, subject, audience, surface, or classification fails closed.
The profile is a conservative governance control, not legal advice.

Once ADR 0028's claim model is active, no legacy C0–C5 value or preset ceiling
can authorize publication. Until this profile or another applicable profile is
accepted and implemented for a named surface, the old P7.2 check may reject
copy but passing it has no authorizing effect; publication fails closed.

### 2. Compose obligations across every claim facet

All applicable rules accumulate, and prohibition overrides permission. The
initial policy candidate is:

| Trigger | Candidate BSC obligation |
|---|---|
| Descriptive configuration fact | verify against the versioned implementation/configuration source; no literature assessment required |
| Individual-attributed experience | require explicit publication consent, provenance, and withdrawal handling; do not generalize |
| Generalized wellness/function | require at least preliminary applicable evidence and hedged wording |
| Structure/function | require at least moderate applicable evidence |
| Condition/symptom proposition asserting prevention, diagnosis, monitoring, treatment, cure, relief, or benefit | prohibit on BSC Lab public surfaces; non-waivable under this profile |
| Quantified outcome, comparative, or superiority form | require at least strong applicable evidence and a policy-based independence determination |
| Absolute/guaranteed outcome | prohibit unless a later explicit policy revision defines a narrower allowed case |

An expression such as “this cured my migraine in three sessions” triggers
testimonial, condition-benefit, causal, and quantified rules; prohibition
wins. A condition warning, crisis-routing instruction, or explicit
non-assertion is not reclassified as a benefit claim merely because it names a
condition, but its communicative role must be explicit and reviewed. “Uses 10
Hz modulation” remains a verified descriptive fact, not a quantified outcome
claim. “Many users find…” is generalized and evidence-requiring.

Public testimonial support is disabled until the observation/privacy model
records release consent, withdrawal/revocation, deidentification, and the
effect of revocation on otherwise immutable authorization history. Private
session-history feedback remains private by default and is never evidence by
itself.

### 3. Authorize the exact release revision

A current authorization must target one exact public-expression revision and
every atomic proposition it states. It records:

- the applicable BSC policy revision and release as-of date;
- every evidence assessment and bounded evidence corpus considered;
- explicit fit for outcome, modality, population, protocol/context, subject,
  audience, language, and surface;
- relevant supporting, mixed, inconclusive, and refuting assessments in that
  governed corpus;
- reviewer identity/role, affiliations, conflict declaration, rationale,
  decision, and validity/invalidation state; and
- consent and source-use decisions required by the triggered rules.

“All relevant evidence” means all relevant records in an identified,
versioned corpus under a documented search scope as of a date; it is not a
claim of global completeness under the open-world assumption.

External affiliation does not prove independence. Any independence decision
must name its policy criteria and recorded conflicts. Lack of such review may
block high-risk BSC copy, but it does not block SSTIM ontology release under
ADR 0022.

Scientific source admissibility is separate from permission to reproduce or
display source content. The profile requests only the clearance needed for the
actual use.

### 4. Enforce a release boundary outside and inside RDF

The release pipeline first constructs a trusted input dataset from an
application-controlled allowlist/promotion process rooted outside submitted
RDF. It then validates the dataset and exact claim inventory under the selected
policy revision and explicit as-of date.

Every in-scope rendered expression is bound to its artifact revision and a
documented canonical content/span digest. The publisher check fails when copy
is absent from RDF, RDF points to absent copy, a proposition is omitted, or a
revision/digest differs. User/imported graphs cannot authorize copy merely by
asserting tiers, reviews, policies, or approvals.

Condition-benefit prohibition and the trusted-input boundary are non-waivable
under this profile. Other waivers, if any are later allowed, require an
explicit policy rule, authorized agent, scope, reason, and expiry.

## Scope required before acceptance

The final policy must inventory the exact BSC Lab repository surfaces and copy
fields it governs. It cannot claim coverage of private BioSynCare product
surfaces, third-party deployments, or unenumerated content. Digest
canonicalization, policy ownership, privacy ownership, and release authority
must also be named before acceptance.

## Required fixtures

Positive fixtures cover a verified descriptive fact and appropriately backed
generalized wellness/structure-function expressions. Adversarial fixtures
must reject:

- a condition-benefit testimonial, including one that is quantified;
- generalized wording mislabeled as an individual report;
- a quantified outcome confused with a technical numeric parameter;
- an omitted proposition or changed translation/content digest;
- evidence with wrong outcome, modality, population, protocol, or subject;
- an unresolved equal-or-stronger refuting assessment in the governed corpus;
- expired, invalidated, conflicted, or policy-mismatched authorization;
- withdrawn testimonial consent;
- an injected rank, policy, review, or approval from an untrusted graph; and
- copy from an unenumerated surface treated as covered.

## Alternatives considered

- **Put the rules in generic SSTIM SHACL.** Rejected because concrete product,
  jurisdiction, privacy, and review policy is implementation-specific.
- **Use the old scalar preset ceiling.** Rejected because independent facets
  compose and exact copy—not a preset category—is released.
- **Trust graph assertions about their own origin.** Rejected because trust
  roots and input promotion are application-security decisions.
- **Enable testimonials before privacy/consent withdrawal exists.** Rejected
  because publication consent must remain revocable.

## Consequences

- BSC public-copy governance becomes explicit, versioned, and testable without
  being presented as universal SSTIM truth.
- Publication work expands beyond SHACL to content inventory, trusted input
  construction, privacy, and release ownership.
- High-risk copy fails closed until the required evidence/review workflow
  exists; the ontology itself remains releasable without an external reviewer.
- Private BioSynCare integration requires its own contract/profile.

## Acceptance questions

Keep Proposed until the maintainer and relevant privacy/product-policy owners
approve the rule matrix, surface inventory, testimonial posture, independence
criteria, trusted-input process, digest canonicalization, and release
authority.

## See also

- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — provisional legacy gate.
- [ADR 0022](0022-0.6-release-review-posture.md) — ontology-release review posture.
- [ADR 0025](0025-hed-bids-interoperability-crosswalk.md) — private observation/export posture.
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — evidence-role separation.
- [ADR 0028](0028-atomic-claim-propositions-and-public-expressions.md) — policy-neutral claim model.
