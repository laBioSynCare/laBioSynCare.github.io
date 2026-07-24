# ADR 0037 — Self-regulation genus, the sensory-neurostimulation branch, and the primary-band property

**Status:** Accepted — 2026-07-24 · targets SSTIM 0.11.0

Resolves RDF-04, RDF-05, and the concrete sub-bug of RDF-08 from the
[2026-07-24 RDF structure and publication audit](../ontology/reviews/2026-07-24-rdf-structure-and-publication-audit.md).
It repairs a real intensional contradiction introduced by ADR 0036 and
completes two things ADR 0034/0036 described in prose but never asserted in
the class hierarchy.

The implementation touches protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4). Maintainer
authorization to edit `sstim-core.ttl`, `sstim-shapes.ttl`, `sstim-vocab.ttl`,
and `sstim-alignments.ttl` was given in session on 2026-07-24, alongside
instructions to work through Gate B of the audit.

---

## Context

### RDF-04 — `SelfDirectedNeuromodulation` contradicted its own genus

`sstim:Stimulation` requires a controlled input to be applied — that is its
defining boundary against mere exposure. `sstim:Neuromodulation` subclasses
it, and ADR 0036's `sstim:SelfDirectedNeuromodulation` subclassed
`Neuromodulation` in turn, but its own `skos:definition` explicitly included
"pure practices with no applied stimulus, such as unguided meditation and
volitional breathwork." A class cannot truthfully inherit from a genus whose
defining condition its own membership criteria deny. HermiT does not see this
— the applied-input requirement lives in prose, not an OWL restriction — but
it is a real defect: a reader or a future SHACL/HermiT tightening would find
the class lying about what it is.

### RDF-05 — the sensory branch of neurostimulation was never asserted

ADR 0036 named `sstim:SensoryRouteNeuromodulation` (the ADR 0034 overlap of
`SensoryStimulation` and `Neuromodulation`) as "the sensory kind" of
`sstim:Neurostimulation`, in prose only. `SensoryRouteNeuromodulation` was
never asserted as a subclass of `Neurostimulation`, so a query over the
neurostimulation hierarchy silently excluded every sensory example — notably
`sstim-v:techGamma40Auditory`, the one populated
`SensoryRouteNeuromodulationTechnique` member. A blanket subclass axiom on
`SensoryRouteNeuromodulation`/`SensoryRouteNeuromodulationTechnique` would
have been wrong: some sensory-route cases are self-directed (sonification
biofeedback routes through audition but the individual self-regulates), and
`Neurostimulation` is specifically the non-self-directed branch.

### RDF-08 (partial) — `targetsFrequencyBand`'s ordering claim

`sstim:targetsFrequencyBand`'s definition said "first entry is the primary
band," but RDF property values are unordered — no conformant consumer can
recover which of two values came "first." This ADR fixes only this concrete,
unambiguous sub-bug. The larger RDF-08 finding — that `FrequencyBandScheme`
conflates an observed EEG-oscillation sense, a stimulus-target sense, and
informal outcome language in one scheme — is a separate, larger modeling
project (a new scheme or class split, plus migrating outcome prose into
qualified `EvidenceAssessmentClaim` records) and is explicitly deferred; see
the `skos:editorialNote` added to `FrequencyBandScheme` pointing back here.

## Decision

### 1. `sstim:DeliberateSelfRegulation` — the neutral genus

A new class, not a subclass of `Stimulation`: "A deliberate process in which
an individual attempts to regulate their own neural, physiological, or
affective state, whether or not an external stimulus, cue, or delivery
mechanism is part of the process." It carries the deliberateness without the
applied-input commitment.

`sstim:SelfDirectedNeuromodulation` becomes a subclass of both
`sstim:Neuromodulation` and `sstim:DeliberateSelfRegulation`, and its
definition is narrowed to the stimulus-mediated cases only — neurofeedback,
biofeedback, paced-breathing guidance — which do satisfy `Stimulation`'s
applied-input requirement. Pure practices with no applied stimulus (unguided
meditation, volitional breathwork) are now `DeliberateSelfRegulation` only:
SSTIM does not represent them as a stimulation, a neuromodulation, or a
stimulation technique, however deliberate or goal-directed. No individual in
the current graph was typed `SelfDirectedNeuromodulation` directly, so this
narrowing has zero instance-level blast radius.

Two stale examples that had drifted into inconsistency with this narrowing —
`Neuromodulation`'s `skos:note` and `Neurostimulation`'s `skos:note`, both of
which listed "neurofeedback, meditation" as `SelfDirectedNeuromodulation`
examples — are corrected to "neurofeedback, biofeedback" (both
stimulus-mediated), with unguided meditation called out explicitly as
`DeliberateSelfRegulation` only.

### 2. `sstim:SensoryNeurostimulation` / `SensoryNeurostimulationTechnique`

Defined as the **intersection** of `Neurostimulation` and
`SensoryRouteNeuromodulation` (and, at the technique layer,
`NeurostimulationTechnique` and `SensoryRouteNeuromodulationTechnique`) —
not a blanket subclass axiom on the broader sensory-route class. This works
because `Neurostimulation`/`NeurostimulationTechnique` already exclude
self-directed cases by their own established definitions (ADR 0036): a
sensory-route case that is instead self-directed (sonification biofeedback)
correctly fails to satisfy the intersection, exactly the risk the audit
flagged. `sstim-v:techGamma40Auditory` — passively received, no
self-regulation loop — is explicitly retyped
`sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique,
sstim:SensoryNeurostimulationTechnique`, following this graph's established
convention of explicit per-instance multi-typing (SHACL's `sh:targetClass`
here runs without subclass inference, per the pre-existing code comment on
`NeurostimulationTechnique`).

### 3. Generic biofeedback stays neutral

`sstim-v:techBiofeedback` keeps its broad `NeuromodulationTechnique` typing.
Its neural-modulation objective is not equally definitional across its
autonomic (HRV, clearest), muscular (EMG, closer to motor self-regulation),
and electrodermal forms, so a narrower neuromodulation-only split would
misrepresent the peripheral cases. `sstim-v:techNeurofeedback` already exists
as the separate, narrower technique for which the neural-modulation objective
*is* definitional. A `skos:editorialNote` records this as a deliberate
decision, not an oversight, so a future reader does not "fix" it by splitting
biofeedback without re-deriving this reasoning.

### 4. `sstim:primaryFrequencyBand`

A new functional sub-property of `sstim:targetsFrequencyBand`, domain
`Preset`, range `FrequencyBand`. `targetsFrequencyBand`'s definition drops the
false ordering claim. A SHACL-SPARQL constraint on `PresetShape` requires
`primaryFrequencyBand`, when asserted, to be one of the preset's own
`targetsFrequencyBand` values. Both existing seed presets (each with a single
target band) are migrated to also assert it, demonstrating the pattern for
the two-band case.

## Alternatives considered

- **Broaden `Stimulation`** to admit no-applied-input cases (RDF-04's
  alternative). Rejected: this was already flagged in the audit as weakening
  the applied-input boundary throughout the ontology — every other subclass
  of `Stimulation` relies on that boundary meaning something.
- **Blanket `SensoryRouteNeuromodulation` ⊑ `Neurostimulation`** (RDF-05).
  Rejected: would wrongly place self-directed sensory-route cases (sonification
  biofeedback) under the non-self-directed `Neurostimulation` branch.
- **Split generic biofeedback into narrower neural/peripheral techniques now.**
  Rejected per the audit's own preference for keeping it neutral; the
  neural-modulation objective is not uniformly definitional across its forms.
- **Fully resolve RDF-08** (split oscillation-band and stimulus-target senses;
  migrate outcome language to evidence records) in this same pass. Rejected as
  too large to do well alongside RDF-04/05/09/13/15/17 in one session; doing it
  hastily risks half-migrated data, which is worse than a clearly documented
  deferral.

## Consequences

- Additive: three new classes (`DeliberateSelfRegulation`,
  `SensoryNeurostimulation`, `SensoryNeurostimulationTechnique`) and one new
  property (`primaryFrequencyBand`); no term removed. One narrowing
  (`SelfDirectedNeuromodulation`'s definition) with zero instance-level blast
  radius, and one re-typing (`techGamma40Auditory`).
  `make validate` and the full Vitest suite stay green.
- `SelfDirectedNeuromodulation` no longer contradicts its own inherited genus.
- Neurostimulation-hierarchy queries now find `techGamma40Auditory` and any
  future passively-delivered sensory-route neurostimulation technique.
- `targetsFrequencyBand`'s primary/secondary distinction is now representable
  without relying on RDF's undefined property-value order.
- RDF-08's larger conflation (oscillation band vs. stimulus target vs. outcome
  hypothesis) remains open, now with a durable pointer
  (`FrequencyBandScheme`'s `skos:editorialNote`) back to this ADR and the
  audit finding, so it is not silently forgotten.
