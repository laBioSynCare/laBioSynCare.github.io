# ADR 0021 - Controlled values describe categories, not their real-world referents

**Status:** Accepted - 2026-07-10

## Context

SSTIM uses the dual-typing pattern from ADR 0002: a controlled value is both a
`skos:Concept` and an `owl:NamedIndividual` of a local value class. This makes
the same IRI usable in SKOS navigation and OWL/SHACL range checks.

Three value classes were nevertheless aligned directly to real-world BFO
categories:

- `SensoryModality` was a subclass of BFO role;
- `StimulationMechanism` was a subclass of BFO process;
- `IntendedEffect` was a subclass of BFO disposition.

Under dual typing, that makes a vocabulary entry such as "auditory" itself a
role, and a mechanism category such as "ASSR" itself a process. The concepts
classify or describe those referents; they are not material realizations of
them. The mismatch also made the value-class family internally inconsistent,
because the other controlled categories were information content entities.

## Decision

Model every SSTIM controlled-value class as an IAO information content entity.
In particular, `SensoryModality`, `StimulationMechanism`, and `IntendedEffect`
now subclass `iao:0000030`. Their definitions explicitly say that they are
controlled information categories and that mechanism/effect assignments do not
prove causation or outcome.

Keep real executions and plans separate:

- `SensoryStimulation` remains a BFO process;
- `SensoryStimulationIntervention` remains a planned process through active
  `cob:0000082`; the obsolete `obi:0000011` parent is removed;
- `SensoryStimulationTechnique` is an information-content category, while the
  more detailed `SensoryStimulationProtocol` remains aligned to OBI protocol;
- `SessionInstance` is both a PROV activity and a sensory stimulation
  intervention;
- `SessionSpecification` is both an information content entity and a
  `prov:Plan`;
- `SensoryStimulationImplementation` is a broad `prov:Entity`, because an
  implementation may be software, hardware, manual, or hybrid rather than only
  an information artifact.

No term IRI is renamed. The changed superclass axioms are published on the
`0.6.0-dev` line because they alter inference and must not be folded silently
into the frozen 0.5.0 release.

## Alternatives considered

- **Keep the BFO parents and stop dual typing.** Rejected: it would remove the
  established range-validation and knowledge-browser pattern from ADR 0002.
- **Create separate real-world classes for every controlled category now.**
  Rejected: SSTIM does not yet need a receptor/process ontology, and speculative
  physiological expansion would add more complexity than interoperability.
- **Use SKOS only, with no OWL value classes.** Rejected: SHACL class checks and
  existing object-property ranges rely on the value classes.

## Consequences

- Controlled concepts have one coherent upper-model interpretation.
- Technique categories no longer infer the stronger semantics of a detailed,
  independently reproducible OBI protocol.
- Query authors can distinguish a category assignment from an executed process
  or realized disposition.
- Consumers that inferred BFO role/process/disposition membership from the old
  superclass axioms must update for 0.6.0.
- Future real-world physiological modeling must introduce explicitly named
  realization classes and relations rather than reusing controlled concepts as
  material entities.

## See also

- [ADR 0002](0002-dual-typing-owl-skos.md) - dual typing.
- [ADR 0007](0007-framework-protocol-implementation.md) - framework and execution levels.
- [ADR 0020](0020-whole-set-snapshot-versioning.md) - release versioning.
