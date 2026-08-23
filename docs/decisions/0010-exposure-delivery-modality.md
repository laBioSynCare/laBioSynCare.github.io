# ADR 0010 — Exposure delivery, perceived modality, and evidence status

**Status:** Accepted — 2026-06-18

## Context

SSTIM 0.3.0 introduced `sstim:techniqueModality` as a practical way to connect
techniques to sensory modality vocabulary. That is useful for simple browsing,
but it compresses several different questions into one property:

1. What physical medium or energy reaches the person?
2. What modality is perceived or engaged?
3. What device capability is required?
4. Where on or near the body is the stimulus delivered?
5. Is this a known SSTIM pattern, an exploratory hypothesis, or outside current
   BSC Lab capability?

The ambiguity matters for cross-modal and exploratory cases: high-volume audio
can be body-perceived; haptics may be actuator-driven or acoustic; stereoscopy
can be free-view, phone-assisted, or headset-assisted; smell and taste are
valid sensory modalities but not current BSC Lab delivery capabilities; Wi-Fi
and other electromagnetic fields are physical exposures without an implied
stimulation or health claim.

## Decision

Add a reusable SSTIM exposure module at `https://w3id.org/sstim/exposure#`.
The source file remains flat Turtle and the runtime loader assigns it to the
named graph `https://w3id.org/sstim/graph/exposure`, following
[ADR 0003](0003-named-graphs-for-modules.md).

The model separates:

- physical delivery medium;
- perceived modality;
- device capability;
- body placement;
- comfort boundary;
- experiment context;
- exposure effect claim;
- knowledge or local capability status.

`sstim:techniqueModality` remains unchanged for compatibility, but is documented
as a coarse convenience relation. New modeling should use `sstim-ex:` exposure
profiles when physical delivery, perception, capability, placement, or evidence
status matters.

Physiological, wellness, comfort, and risk statements must be represented as
qualified claim resources with evidence or knowledge status. The ontology must
not introduce direct unqualified properties such as `usageForHealth`,
`usageForWellness`, or `healthImpact` that would assert a benefit without a
claim context.

## Alternatives considered

**Expand `sstim:techniqueModality`.** Rejected. Adding more modality values does
not distinguish energy source, perceived channel, device capability, body
placement, or scientific status.

**Add direct health-benefit properties.** Rejected. Terms such as
`usageForHealth` or `healthImpact` would invite unsupported assertions and
blur exploratory hypotheses, local observations, comfort boundaries, and
reviewed evidence.

**Put experiments in the ontology term namespace.** Rejected. Exploratory BSC
Lab examples are implementation data, so they belong under
`https://w3id.org/sstim/implementation/bsclab/experiment/`, not in the reusable
ontology term space.

**Use TriG named graphs in source files.** Rejected for the same reasons as
ADR 0003: individual Turtle files should remain independently citable and
validatable, with named graphs assigned at load time.

## Consequences

- BSC Lab can model Wi-Fi/EM exposure, visual noise, haptic audio, stereoscopy,
  smell/taste boundaries, temperature, airflow/fluid motion, and ideal tactile
  immersion without turning them into unqualified efficacy claims.
- Local status is explicit: known in SSTIM, hypothesized, unknown to SSTIM, no
  known SSTIM evidence, not currently used or deliverable by BSC Lab, or
  outside BSC Lab scope.
- Device and body-placement questions become queryable independently of the
  perceived modality.
- Existing consumers of `sstim:techniqueModality` continue to work.
- Future SHACL work can validate exposure profiles and experimental protocols
  without changing the core technique model.

## See also

- [`../ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — active
  ontology maturity backlog.
- [`../ontology/raw-notes/2026-06-18-exposure-maintainer-notes.md`](../ontology/raw-notes/2026-06-18-exposure-maintainer-notes.md) —
  raw maintainer notes that motivated this decision.
- [ADR 0003](0003-named-graphs-for-modules.md) — flat Turtle files with named
  graphs assigned at load time.
