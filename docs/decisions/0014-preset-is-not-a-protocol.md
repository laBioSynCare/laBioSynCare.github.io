# ADR 0014 — A Preset is an information content entity, not a protocol

**Status:** Accepted — 2026-06-21

## Context

`sstim:Preset` was declared `rdfs:subClassOf obi:0000272` (OBI **protocol**) **and**
`rdfs:subClassOf iao:0000030` (information content entity). But the preset's own
definition says: *"A preset follows a protocol or framework but is not itself the
protocol."* The OBI protocol superclass directly contradicts that, and external
consumers reasoning over the upper-ontology alignment would wrongly infer every
preset to be a protocol (IMPROVEMENT_PLAN, "Preset and Protocol Semantics"; P0
item 2).

At the same time, `sstim:SensoryStimulationProtocol` — the class that actually
denotes a protocol — was aligned only to `iao:0000030`, **not** to OBI protocol.
So the protocol alignment was on the wrong classes.

## Decision

- `sstim:Preset` is an **information content entity** (`iao:0000030`) only; remove
  `rdfs:subClassOf obi:0000272`. A preset is a reusable, versioned parameter
  configuration — an information artifact, not an executable plan.
- Move the OBI protocol alignment to its rightful home:
  `sstim:SensoryStimulationProtocol rdfs:subClassOf obi:0000272`.
- The preset → protocol relation is carried by `sstim:followsProtocol`
  (`domain Preset`, `range SensoryStimulationProtocol`), which already exists — no
  information is lost by dropping the subclass axiom.
- `sstim-alignments.ttl` is updated to match (the `Preset → OBI protocol` line
  becomes `SensoryStimulationProtocol → OBI protocol`).

## Alternatives considered

- **Keep the dual typing.** Rejected: it is the contradiction this ADR resolves.
- **Re-type `Preset` as a plan specification (`iao:0000104`).** Rejected: a
  parameter configuration is a generic information content entity that *is read
  by* an engine; it is not itself the plan that is executed. `iao:0000030` is the
  honest, minimal alignment; `followsProtocol` expresses the plan link.

## Follow-up - Technique alignment (resolved 2026-07-10)

The 0.6 external audit resolved the question deliberately left open by this ADR.
OBI defines `obi:0000272` as a plan specification detailed enough for different
investigation agents to reproduce a process independently. SSTIM defines a
technique as a reusable, parameterizable method category that is less specific
than a protocol. The prior technique-to-OBI-protocol subclass axiom was therefore
too strong.

`sstim:SensoryStimulationTechnique` now subclasses `iao:0000030` (information
content entity), while `sstim:SensoryStimulationProtocol` remains the only SSTIM
class aligned to `obi:0000272`. This is an inference change on the `0.6.0-dev`
line; no SSTIM IRI was renamed or removed.

## Consequences

- No preset instance relies on protocol typing, so no data breaks; `make validate`
  stays green.
- `SensoryStimulationProtocol` is the single SSTIM class inferred as an OBI
  protocol.
- Consumers must use `followsProtocol` — not class inference — to find the
  protocol a preset follows.

## See also

- [ADR 0007](0007-framework-protocol-implementation.md) — framework / technique /
  protocol / implementation / preset / session distinctions.
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P0 item 2.
