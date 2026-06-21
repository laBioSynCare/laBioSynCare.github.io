# ADR 0013 — Evidence `supportsRelation` range

**Status:** Accepted — 2026-06-21

## Context

`sstim:supportsRelation` links an `sstim:EvidenceClaim` to the thing the evidence
is about. It has `rdfs:domain sstim:EvidenceClaim` but **no range**; the
definition says it "links an evidence claim to the preset or technique it
supports," but that target set was not machine-constrained (IMPROVEMENT_PLAN,
"Evidence Modeling" gap; P0 item 1).

The plan offered two directions: a constrained union range, or split properties
such as `supportsPreset` / `supportsTechnique`.

## Decision

Give `supportsRelation` a **constrained union range** of
`sstim:Preset ∪ sstim:SensoryStimulationTechnique`, and keep it as a single
property. Because `make validate` runs pyshacl without OWL inference, the range is
**also** enforced at the data level by a SHACL constraint on `EvidenceClaimShape`:
when `supportsRelation` is present, every value must be a `Preset` or a
`SensoryStimulationTechnique` (`sh:or` over the two `sh:class` checks; subclass
techniques match via `rdfs:subClassOf` closure when core is in scope).

The constraint enforces the **range only**, not presence: `sstim-ex:ExposureEffectClaim`
(ADR 0010) is dual-typed as `sstim:EvidenceClaim` but links to its subject via
`sstim-ex:hasEffectClaim`, not `supportsRelation`, so an `sh:minCount 1` on
`supportsRelation` would wrongly invalidate every exposure effect claim.

## Alternatives considered

- **Split into `supportsPreset` / `supportsTechnique`.** Rejected: it doubles the
  vocabulary for one relation, breaks the single-property query pattern already
  documented in `CLAUDE.md` (the preset/evidence example query selects on
  `supportsRelation`), and would require migrating the committed evidence
  instance. ADR 0005's principle — prefer one canonical form over alternatives
  that fragment the data — applies: this is one relation with a typed range, not
  two genuinely different relations.
- **Leave the range open.** Rejected: it is the gap this ADR closes; an
  unconstrained range lets an evidence claim "support" anything.

## Consequences

- The committed evidence instance
  (`perform-alpha-10-seed-auditory-review`, `supportsRelation → …preset…`)
  conforms unchanged.
- Existing SPARQL over `supportsRelation` is unaffected.
- The range is intentionally limited to `Preset` and `SensoryStimulationTechnique`
  per the term's definition. If evidence later needs to be attached to a
  `SensoryStimulationProtocol` or `…Framework`, extend the union (and the `sh:or`)
  in one place — a follow-up, not a breaking change.

## See also

- [ADR 0005](0005-binaural-carrier-pair-only.md) — prefer one canonical form.
- [ADR 0007](0007-framework-protocol-implementation.md) — the
  framework/technique/protocol/implementation/preset model the range draws on.
- [`docs/concept/EVIDENCE_FRAMEWORK.md`](../concept/EVIDENCE_FRAMEWORK.md).
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P0 item 1.
