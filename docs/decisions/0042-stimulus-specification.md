# ADR 0042 — `sstim:StimulusSpecification`: describing the stimulation, not the engine

**Status:** Proposed — 2026-07-31

Implements gap **A** from
[ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md) §3:
an engine-independent description of what actually reaches the subject. Lands in
a new module, `sstim-stimulus.ttl`, rather than in `sstim-core.ttl` — the core
split is deferred, and new work should not make it larger.

## Context

ADR 0041 established four layers and found the second one missing:

| Layer | | |
|---|---|---|
| 0 | the stimulation | `sstim:Stimulation` ⊑ `bfo:0000015` |
| **1** | **the stimulus description** | **absent** |
| 2 | the engine configuration | `sstim:Preset` |
| 3 | the execution | `sstim:SessionSpecification` |

Layer 2 is engine-dependent by nature: `gain: 0.5` means nothing without knowing
the engine. Two implementations producing acoustically identical stimulation have
unrelated presets, so a preset cannot be the unit of scientific comparison. That
is what layer 1 is for.

**The distinguishing move is stimulus properties instead of engine controls.**
`65 dB SPL at the ear` rather than `gain: 0.5`; `sinusoidal` rather than
`waveformL: 0`. The first is reproducible on an engine nobody has built yet.

## Decision

### 1. Three regimes, and only two are describable as stimuli

ADR 0041 §3 settled this and it governs the design:

**Determinate.** The stimulus is fixed in advance. A specification states it
completely.

**Stochastic.** Pink noise, permutation-derived sequences, randomised phase. Two
renderings differ sample by sample and are *the same stimulation*, so identity is
not at the waveform level: the specification describes the **generating process
and its parameters**, and a rendering is an instance of it.

**Adaptive / closed-loop.** Neurofeedback and biofeedback
([ADR 0035](0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)).
The stimulus depends on the subject's measured state, so **no static description
of it exists, in principle**. What is describable is the **control law** — its
inputs, mapping and bounds.

This is a limit, not a gap to close later. A `StimulusSpecification` therefore
declares its regime, and for the adaptive regime it describes a rule rather than
a stimulus. Pretending otherwise would make the class quietly false for a family
of techniques SSTIM already covers.

### 2. The class, and what it deliberately is not

```turtle
sstim:StimulusSpecification a owl:Class ;
    rdfs:subClassOf iao:0000030 .
```

An information content entity — a *description*, not the stimulation. It is
`sstim:describesStimulation` that connects it to `sstim:Stimulation`, the
`bfo:0000015` process.

Not a `prov:Plan`, unlike `SessionSpecification`: a plan is something to be
carried out, and a stimulus specification is a statement of what is (or would be)
the case. A session executes; a specification describes.

**It asserts nothing about effect.** A specification says what a stimulation *is*
— frequencies, levels, durations, channels — never that it does anything.
Evidence, intended outcome and safety metadata stay where they are, human-authored
through the gated bridge ([ADR 0026](0026-patch-studio-catalog-bridge.md)) and
never inferred from parameters.

### 3. Channels, because stimulation is not audio

A specification is composed of `sstim-ex:StimulusChannel` values — audio, visual,
haptic, respiratory, olfactory, gustatory, electromagnetic — which the exposure
module already defines. Reusing them rather than minting a parallel set is the
point: the audio-centrism that ADR 0041 found in `sstim:Preset`'s old definition
came precisely from a class inventing its own narrow structure.

Each channel carries its properties **in physical or perceptual units**:

| | Engine control (layer 2) | Stimulus property (layer 1) |
|---|---|---|
| audio | `gain: 0.5` | sound pressure level, dB SPL |
| audio | `waveformL: 0` | spectral content |
| visual | `opacity: 0.8` | luminance, cd/m²; flash rate, Hz |
| haptic | `intensity: 0.6` | acceleration, m/s²; frequency, Hz |

### 4. The property set is deliberately minimal at first

This ADR proposes the **class, the regime distinction, the channel composition
and the identity/versioning apparatus** — not a complete physical
parameterisation.

Choosing the right physical quantities for seven modalities is scientific
modelling that deserves review, and `CLAUDE.md` §3.4 and
[ADR 0004](0004-protected-ontology-files.md) exist because that judgement is not
an implementation detail. A stub with a precise definition is honest and useful;
forty invented unit-bearing properties would be neither.

The initial set, chosen because each is unambiguous and already grounded in the
repo's own safety work:

- `sstim:stimulusRegime` — determinate / stochastic / adaptive
- `sstim:describesStimulation` → `sstim:Stimulation`
- `sstim:hasStimulusChannel` → `sstim-ex:StimulusChannel`
- `sstim:channelFrequencyHz` — the rate a channel presents, in Hz
- `sstim:channelDurationSeconds`
- `sstim:soundPressureLevelDb` — dB SPL, the audio level a preset's gain is *not*
- `sstim:luminanceCdM2` — cd/m²
- `sstim:flashRateHz` — already safety-bearing
  ([ADR 0011](0011-sensory-field-and-flash-safety.md))

Everything else waits for review.

### 5. Its relationship to a preset is stated, not assumed

`sstim:specifiedBy` links a `sstim:Preset` to the `sstim:StimulusSpecification`
it realises. The direction matters: **many presets may realise one
specification** — that is the whole point, and it is what makes cross-engine
comparison possible.

The link is asserted by whoever measures or derives it, never inferred. A preset
does not entail its specification, because the mapping depends on the engine, the
transducer and the listening conditions. Claiming otherwise would reintroduce the
engine-dependence layer 1 exists to escape.

## Consequences

**Gained.** A place to say what a stimulation *is*, independent of who built the
engine. Two implementations become comparable. It is also the object a canonical
schema (gap B) would serialise: given layer 1, a shared preset format is largely
derivable; pursued without it, a shared format is another vendor format.

**Given up.** A new module to maintain, and a class that is deliberately
incomplete on arrival. The incompleteness is visible rather than hidden — the
regime enumeration and the property list say what is not yet modelled.

**Not done here.** The full physical parameterisation; the canonical schema
itself; measurement provenance (who measured the SPL, with what, where), which
belongs with the exposure module's device modelling.

**Unchanged.** RDF validity is not scientific warrant. Nothing in this module
asserts that any stimulation does anything.

## Alternatives considered

**Put it in `sstim-core.ttl`.** Rejected: the core split is deferred and core is
already too large ([ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md) §6).
Adding the flagship concept to it would make that split harder, not easier.

**Model the stimulus as a rendered waveform.** Engine-independent and
descriptively useless — not parametric, not queryable, and inapplicable to the
stochastic and adaptive regimes, which are not edge cases here.

**Extend `sstim:Preset` with physical-unit properties instead.** Rejected: it
conflates the two layers, and the conflation is exactly what made
`sstim:Preset`'s old definition audio-centric and engine-flavoured.

**Wait for an external standard.** ADR 0041 §4 found the cell unoccupied — HED
annotates what occurred rather than specifying what to produce. Waiting means
continuing to have no engine-independent description at all.
