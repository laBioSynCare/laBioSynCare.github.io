# ADR 0068: Neurostimulation excludes self-directed neuromodulation

**Status:** Accepted · 2026-11-01 · decided by the maintainer in session on
2026-10-29 ("Neurostimulation vs self-directed", chosen over making
interventional and self-directed neuromodulation disjoint, with both files named
for modification), and implemented on the 0.21.0 development line. Amends
[ADR 0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)
§4 and closes GB-05 of
[`IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md).

## Context

GB-05 of the 2026-09-30 review asked which of the exclusions ADRs 0036 and 0037
describe in prose are true disjointness, and to assert those. None was asserted:
the Neuromodulation module held no disjointness axiom, and HermiT accepted a
process typed on both sides of either split. There were two candidates.

- **Interventional against self-directed neuromodulation.** ADR 0036 §4 made
  both subclasses of `sstim:Neuromodulation` and deliberately not disjoint,
  because some cases are both: paced-breathing guidance is guided-following,
  which ADR 0035 places on the interventional side, and the person's own
  deliberate self-regulation at once.
- **Neurostimulation against self-directed neuromodulation.**
  `sstim:Neurostimulation` is defined as the branch applied without the
  individual's active engagement, and `sstim:SensoryNeurostimulation`'s scope
  note already calls this "Neurostimulation's own exclusion of self-directed
  cases". Measured on 2026-10-29 over every module and committed instance: no
  process is typed both, and no neurostimulation technique carries the
  active-self-regulatory engagement mode. The three techniques that do,
  neurofeedback, biofeedback and sonification, are not neurostimulation
  techniques.

## Decision

1. `sstim:Neurostimulation owl:disjointWith sstim:SelfDirectedNeuromodulation`,
   in the Neuromodulation module. `sstim:SensoryNeurostimulation` inherits it as
   a subclass.
2. Interventional and self-directed neuromodulation stay overlapping, as ADR
   0036 §4 decided.
3. At the technique layer, where ADR 0036 carries the split on the
   participant-engagement facet, a SHACL rule rejects a
   `sstim:NeurostimulationTechnique` whose engagement mode is
   active-self-regulatory.

## Consequences

- HermiT rejects a process typed both neurostimulation and self-directed
  neuromodulation, and `make disjointness-check` proves it in both directions: it
  also requires a process typed interventional and self-directed to stay
  consistent, so the overlap ADR 0036 kept cannot be closed by accident. A
  rejection counts only when ROBOT reports an inconsistency, and the gate fails
  when the axiom is removed (checked).
- The technique rule has a Full-profile adversarial fixture that is a complete
  neurostimulation technique in every other respect and conforms once its
  engagement mode is removed.
- No committed record changes. Data typing one process both ways, or a
  neurostimulation technique as active-self-regulatory, is now rejected.

## Alternatives considered

- **Interventional disjoint with self-directed**, GB-05's literal "done when".
  Paced-breathing guidance could then not be typed as the self-regulation it
  is, and ADR 0036 §4 would be overturned with no new evidence.
- **An OWL axiom at the technique layer**, a class of techniques with that
  engagement value declared empty. Techniques are SKOS concepts dual-typed as
  individuals, so the reasoner would classify vocabulary entries rather than
  check them, and SHACL already validates the facet.
