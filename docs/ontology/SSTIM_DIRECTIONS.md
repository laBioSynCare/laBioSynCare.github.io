# SSTIM directions

**Status:** standing design directions, set 2026-08-15 by Renato Fabbri. Not
decisions — an ADR turns one of these into a decision when it is taken. The
[improvement plan](IMPROVEMENT_PLAN.md) owns the audit-driven work sequence;
this document owns where the model is *going* and why.

The through-line: **SSTIM is a public, universal standard for sensory
stimulation. BioSynCare is one proprietary, audio-focused application.** SSTIM
takes inspiration from what that application learned — above all its hard-won
parameter ranges — and takes nothing else. Its structure records which technical
obstacles were overcome in which order, which is history rather than design.
See [ADR 0051](../decisions/0051-sstim-preset-contract.md), where this was
established after a first attempt got the direction of authority backwards.

---

## 1. Waveforms

**Direction.** Model waveforms as a controlled vocabulary: the four basic
periodic shapes (sine, square, sawtooth, triangle) plus other named waveforms,
including **sampled**, which then carries *what it was sampled from* — violin,
voice, rain, a specific instrument or recording.

**Why this is not a transcription.** The catalog has four fields
(`waveformL`, `waveformR`, `waveformM`, `waveform`) that are always the integer
`0`. That is one concept encoded four times, permanently at its only value —
the shape of a system that never needed a second waveform. A standard needs the
concept, not the four slots.

**What it implies.** A `sstim:Waveform` category with concepts, and a
distinction between a *synthesised* waveform (fully specified by its name) and a
*sampled* one (which needs a source: an identifier for the recorded material,
and ideally its licence and provenance). The sampled case is the interesting
one, because it makes a waveform a pointer to an asset, which touches
reproducibility: a session that used a sample is only reproducible if the sample
is identified. `sstim:configurationDigest` and the reproducibility levels from
[ADR 0048](../decisions/0048-session-events-and-qualified-observations.md)
already exist to carry that.

**Not yet designed.** Whether the four basic shapes are SKOS concepts under a
`WaveformScheme`, and how a sampled source is identified, are open.

---

## 2. Panning

**Direction.** Model **spatialization** properly, with **panning** as one
technique under it and **localization** kept on the perceptual side. Do not
transcribe.

**What the catalog does, and why it cannot be copied.** `panOsc` is an integer
0–3 selecting: static centre, hold-and-crossfade, sinusoidal, and
*Martigli-synced*. The fourth is not a panning mode at all — it is a statement
that this parameter is modulated by another component. Encoding "modulated by
the breathing oscillator" as a fourth value of a position enum collapses two
different things: *where the stimulus is in space* and *what drives that
position over time*.

### The terminology, checked

The maintainer's sketch was *spatialization includes localization, with panning
related to localization or a special case of it*. The literature supports the
first half and inverts the second, and the distinction matters here more than it
usually does.

| Term | What it is | Which side of SSTIM's boundary |
|---|---|---|
| **Spatialization** | The rendering practice: placing a stimulus at an apparent position in space, by whatever means | Stimulus / delivery |
| **Panning** | One spatialization *technique* — distributing a source across channels by amplitude, and its generalisations (VBAP, ambisonics, HRTF-based binaural rendering, wave field synthesis) | Stimulus / delivery |
| **Localization** | The listener's perceptual determination of a source's direction and distance — psychophysics, not rendering | Response / observation |

So panning is a special case of **spatialization**, not of localization; and
localization is not contained in spatialization at all — it is its perceptual
counterpart, what the subject does with what was delivered. Jens Blauert's
standard reference is titled *Spatial Hearing: The Psychophysics of Human Sound
Localization*, which places localization squarely on the perceptual side.

Industry usage genuinely conflates them — spatial-audio writing routinely
glosses spatialization as "localisation or placement of sounds in a virtual
space" — which is precisely why a standard should not.

**This maps onto a boundary SSTIM already draws.** `sstim:StimulusSpecification`
states what reaches the subject; `sstim:ParticipantObservation` records what the
subject reports. Spatialization belongs to the first, localization to the
second — and localization is a genuinely interesting *observation* to be able to
record ("where did you perceive it?"), which SSTIM cannot express today.

Spatialization also generalises across senses in a way panning does not: a
visual stimulus has a position in the visual field, a haptic one a body site
(`sstim:hasBodyPlacement` already exists in the exposure module), an olfactory
one a direction of airflow. Naming the general concept *spatialization* and
panning as one auditory technique under it keeps the standard modality-neutral
where the catalog's `panOsc` integer could not.

**What a real model separates.**

- **Spatial position** — where the stimulus is, per the table above; a
  spatialization facet on a component, with panning as one auditory technique
  for achieving it.
- **Modulation** — that some parameter varies over time, driven by a source
  which may be a fixed function or another component. This is what the
  Martigli-synced mode really is, and SSTIM already has the shape of it:
  `sstim:ControlTrack` is defined as "a track that produces no sensory output of
  its own and instead supplies a time-varying control signal modulating
  parameters of other tracks".

So panning is probably two additions, not one: a spatial-position facet on a
component, and an explicit *modulation* relation from a control source to a
target parameter. The second is the more valuable, because it generalises: any
parameter can be modulated by any control source, which is what a modular
synthesis model looks like and what "Martigli-synced panning" is a single
instance of. That half is developed in [§5](#5-abstract-signals-and-their-sensory-renderings),
which is where it belongs — spatial position is one of the parameters a signal
can be rendered onto.

---

## 3. Specific protocols belong in their own namespace

**Direction.** SSTIM should have a way to represent specific protocols, each
contained in its own graph and namespace. **Martigli** and **Symmetry** belong
there — they are named, specific techniques, not universal primitives.
Possibly not to be tackled now.

**Why this matters more than it looks.** Right now `sstim:martigliCenterFreq`,
`sstim:martigliAmplitude`, `sstim:martigliPeriodInitial`,
`sstim:martigliPeriodFinal`, `sstim:martigliTransitionDuration`,
`sstim:permutationFunction` and `sstim:noteCount` sit in the core SSTIM
namespace. A universal standard for sensory stimulation should not have one
practitioner's breathing-oscillation parameters in its core term space, any more
than it should have another vendor's. The generic concepts underneath are
*frequency oscillation with a changing period* and *a sequence permuted between
repetitions*; Martigli and Symmetry are named parameterisations of those.

**The mechanism already exists.** `sstim-patch-studio.ttl` is an optional
profile module, and ADR 0007 established the
framework/protocol/implementation split with namespaces to match
(`/sstim/framework/bsc/`, `/sstim/implementation/bsclab/`). A protocol namespace
— `/sstim/protocol/martigli`, `/sstim/protocol/symmetry` — would follow the
same pattern, with the manifest owning the modules as it already does for the
other seventeen.

**Cost of doing it.** Moving terms between namespaces is an ontology migration:
deprecation with `dct:isReplacedBy`, an exception recorded in the
full-equivalence baseline, and a version bump. The machinery for all three is
built and has been exercised (ADRs 0043, 0049). This is tractable, not cheap.

---

## 4. All known senses, and the shape of a stimulation event

**Direction.** Reach a representation of sensory stimulation that captures all
known senses — proprioception, chemoreception and others the current scheme does
not name — and that is not limited to a "session" or a "preset".

### 4a. There are two modality vocabularies, not one short one

The first draft of this section said the modality scheme was six concepts long
and needed extending toward proprioception and chemoreception. That was written
without reading the exposure module, and it is wrong in an instructive way.

SSTIM carries **two** modality vocabularies:

| Vocabulary | Count | Contents |
|---|---|---|
| `sstim:SensoryModality` (core vocab) | 6 | auditory, visual, somatosensory, interoceptive, vestibular, olfactory |
| `sstim-ex:PerceivedModality` (exposure) | 12 | the six above, plus **proprioceptive**, gustatory, tactile, multimodal, social-perceptual, and not-directly-perceived |

The first is a strict subset of the second. So proprioception — named in the
direction as a missing sense — **already exists**, in the module that models
delivery. Alongside it sits `sstim-ex:PhysicalDeliveryMedium` with 27 concepts
(acoustic energy, airflow, thermal contact, focused ultrasound, chemical agent,
electromagnetic radiation…), and `sstim-ex:perceivedModality` /
`sstim-ex:deliveryMedium` hold apart *which sense is engaged* from *what
physically arrives* — a distinction the core vocabulary does not make at all.

**And the two are already related.** All six shared concepts carry a
`skos:closeMatch` from the exposure side — close rather than exact, deliberately,
because the intensions differ: `PerceivedModality` is *the channel an exposure
engages* and includes multimodal and not-directly-perceived, which are not
senses, while `SensoryModality` is *a sense*. An earlier draft of this section
called the duplication "real and unreconciled". It is real and reconciled, and
saying otherwise was the fourth time in two days that a gap was asserted without
checking — the reason [`TERM_INDEX.md`](TERM_INDEX.md) now exists.

**So the direction here is small: state the choosing rule.** A consumer meeting
both should be told which to use for what — a channel engages a perceived
modality; a technique or an assessment scope is about a sensory modality — rather
than left to infer it. That is a documentation and scope-note job, not a
modelling one.

The chemoreception question survives the correction: olfactory and gustatory are
both chemoreception, and whether to introduce the parent is a scientific
modelling choice rather than a gap.

A consequence for work already shipped: `static/schemas/preset.schema.json` draws
its `modality` enum from the six-concept core scheme, so it offers fewer senses
than SSTIM can already express. That is correct as long as the schema follows the
core vocabulary — but it is the wrong vocabulary to be following, and the choice
should be revisited when the two are reconciled.

`static/schemas/preset.schema.json` briefly listed nine modalities, three of
which the core scheme does not declare. That was caught by adding an enum-versus-vocabulary
check to `make preset-contract`, which now fails if a schema mints a controlled
value — the KR-17 failure pattern. The lesson is worth keeping: **the vocabulary
leads, the schema follows**, and the check is what makes that true rather than
merely intended.

Candidates the literature names and SSTIM does not: proprioception,
thermoception, nociception, chemoreception (which subsumes olfaction and
gustation and would restructure rather than extend the scheme), equilibrioception
(already present as vestibular), and time perception. Choosing among these is a
scientific decision, not a modelling one — and
`docs/ontology/reviews/` already holds a review of one external taxonomy proposal
that was rejected for adding OWL classes where concepts were wanted.

### 4b. The composition question

> *"I am not sure if the best model is for such 'event' to be 'composed of' many
> stimulation 'sub-events' (or stimulation components), and I'll leave the
> question with you to help me solve it."*

**Recommendation: keep composition, but do not make the composed thing an
"event". There are two distinct composition axes and collapsing them would
repeat the defect the audit already found twice.**

The reasoning:

**SSTIM already distinguishes four layers, and they are not interchangeable.**

| Layer | Class | What it is |
|---|---|---|
| Configuration | `sstim:Preset` | Engine-dependent settings. An information entity (`iao:0000030`) |
| Description | `sstim:StimulusSpecification` | Engine-independent statement of what reaches the subject. Also an information entity |
| Occurrence | `sstim:SessionInstance` | An execution that actually happened |
| Occurrence part | `sstim:SessionEvent` | Something that occurred during one, on the engine clock (`prov:Activity`) |

An information entity has **parts that are information entities**. A process has
**temporal parts that are processes**. These are different mereologies over
different BFO categories. One `composedOf` relation spanning both would have a
domain covering an information entity and an activity at once — which is exactly
the KR-05 pattern (*"an OWL domain is an inference rule rather than an
input-validation hint"*) that the audit raised against five properties, and
exactly the KR-06 pattern (one class family doing four jobs).

**So the answer to "should an event be composed of sub-events" is: yes for
occurrences, but that is not the relation you want for specifying stimulation.**
What a preset or specification is composed of are *components* — parts of a
description, atemporal, each with a modality and parameters. What a session is
composed of are *events* — temporal, ordered on a clock, already modelled by
ADR 0048.

**The generic term already exists and is probably the answer.**
`sstim:composedOfTrack` has domain `sstim:Preset` and range `sstim:Track`, with
`AudioTrack`/`VisualTrack`/`HapticTrack`/`ControlTrack` subclasses and
`sstim:Voice rdfs:subClassOf sstim:AudioTrack`. The audio-only `sstim:composedOf`
is the BSC catalog *profile's* relation, not the generic one. So the multi-modal
composition the direction asks for is already expressible — a fact this
repository's own ADR 0051 initially got wrong, and which is corrected there.

**What genuinely remains open, then, is narrower than it appeared:**

1. **Nothing marks which profile a preset follows.** `composedOf` and
   `composedOfTrack` share the domain `sstim:Preset`, so a document could mix
   them. A profile marker, or a `CatalogPreset` subclass, would fix it.
2. **`Track` is a rendering-oriented word.** "Track" comes from multitrack
   audio. For a standard that includes olfactory and proprioceptive stimulation,
   *component* or *stimulation layer* carries the meaning without the studio
   metaphor. This is a naming decision with a migration cost, and ADR 0041
   already renamed in this area once.
3. **Whether `Preset` should be the top of the specification layer at all.**
   "Preset" is a product word. `sstim:StimulusSpecification` is the
   engine-independent description and is arguably the thing a standard should
   centre on, with presets as engine-specific realisations of it. ADR 0041
   introduced the split; ADR 0040's open questions
   ([memory](../../CLAUDE.md), `adr_0040_open_questions`) challenge the
   Patch-versus-Preset boundary from the other side. These are the same question
   approached from two directions and should be resolved together.

**What not to do:** introduce a new generic `sstim:StimulationEvent` class above
everything. It would sit across the information/occurrence boundary, and the
model would lose the distinction that currently makes a specification comparable
across engines while a session stays a record of one execution.

---

## 5. Abstract signals and their sensory renderings

**The question.** *A breathing cue can be audio, visual, audiovisual, tactile,
or use other senses. Can we have an abstract signal that then gets mapped into a
sensory cue as needed? The same for a 10 Hz alpha signal — auditory, visual or
tactile. Is this covered? Should it be modelled as modulating and carrier
signals?*

**Yes to the premise, partly to the coverage, and carefully to the carrier.**

### What SSTIM already has, in three disconnected pieces

1. **`sstim:StimulusSpecification`** — "an engine-independent description of a
   sensory stimulation, stating what reaches the subject in physical or
   perceptual units rather than the settings that make a particular engine
   produce it. Two implementations whose output matches realise the same stimulus
   specification, which is what makes them comparable." That is the abstract
   layer, and it already carries `stimulusRegime` (determinate / stochastic /
   adaptive).
2. **`sstim:hasStimulusChannel` → `sstim-ex:StimulusChannel`** — one
   specification may have several channels, "such as an audio, visual, haptic,
   respiratory, olfactory, gustatory, or electromagnetic exposure path". So one
   description reaching the subject through several senses is already the
   intended shape.
3. **`sstim:ControlTrack`** — "a track that produces no sensory output of its own
   and instead supplies a time-varying control signal modulating parameters of
   other tracks. Breathing-guidance (Martigli) and symmetry-derived control
   signals are the current kinds." That is the abstract signal, named.

4. **A rendering layer, already surprisingly complete.**
   `sstim-ex:StimulusChannel` carries `sstim-ex:deliveryMedium` (27 physical
   media) and `sstim-ex:perceivedModality` (12 modalities) held apart, plus
   per-rendering rates: `hasFrequencyHz` ("carrier or tone frequency"),
   `hasFlickerRateHz` ("blink, pulse, or flicker rate… subject to
   photosensitivity exposure limits"), `hasBeatFrequencyHz` ("monaural or
   binaural beat frequency (the difference frequency)"), plus duty cycle, gain
   and phase offset.

   This is the rendering half of the answer, and it already knows that a carrier
   is not the delivered rate.

### What is missing, and it is the connections

- **The shared signal has no identity.** A specification targeting 10 Hz through
  an audio channel and a visual one states `hasBeatFrequencyHz 10` on one and
  `hasFlickerRateHz 10` on the other. Nothing asserts these are *the same* 10 Hz.
  A consumer must infer it by comparing decimals — so the comparability
  `StimulusSpecification` exists to provide is precisely what goes unstated. This
  is the abstract-signal object, and it is the single biggest missing piece.
- **No modulation relation.** `ControlTrack`'s definition says it modulates
  parameters of other tracks. Nothing in the graph can say *which* track or
  *which* parameter. The statement lives in prose only. (Verified: no property
  in any module expresses it.)
- **The abstract signal is not separable from a configuration.** `ControlTrack`
  is a `Track`, so it belongs to one preset. Even once a modulation relation
  exists, there is no signal object two studies could share and be compared by.
- **`hasFrequencyHz` carries two roles.** Its definition is "carrier or tone
  frequency", so a 200 Hz audio carrier and a 10 Hz tactile vibration — a
  carrier and a delivered rate — use one property for different things. The
  carrier/rate distinction the other two properties make is not made here.
- **Nothing joins the configuration layer to the specification layer.** Tracks
  are engine settings; channels are what reaches the subject. No relation
  connects them.

So the idea is present four times and is not yet expressible once — and the gap
is narrower and more specific than it first appeared. What is needed is chiefly
*one* thing: a signal with an identity that several channels can point at.

### Should it be carrier and modulator?

**Within audio, yes. As the top-level model, no — and the reason is
instructive.**

A carrier exists because of a limitation of *hearing*, not because of anything
about the signal:

| Modality | 10 Hz presented how | Carrier needed? |
|---|---|---|
| Auditory | Amplitude-modulating an audible tone (isochronic); two carriers a few Hz apart (binaural beat); two carriers summed acoustically (monaural beat) | **Yes** — 10 Hz is below the audible range, so it cannot be presented directly |
| Visual | A light flickering at 10 Hz | No |
| Tactile | A vibration at 10 Hz, well inside mechanoreceptor range | No |

Make carrier/modulator the universal structure and every visual or tactile
stimulus has to invent a fictitious carrier. That is the audio assumption
returning by a different door — the same error as `voices`, as four `waveform`
fields, and as `panOsc`.

**The universal structure is two layers, with carrier/modulator living in the
lower one:**

1. **An abstract signal** — a time-varying function with a frequency, period or
   envelope and *no modality*. "10 Hz square." "A sinusoid whose period ramps
   from 4 s to 8 s over 10 minutes." This is what a breathing cue and an alpha
   target both are.
2. **A rendering** — binds that signal to a renderable parameter of a channel in
   some modality. *Which* parameter is modality-specific: audio amplitude, audio
   frequency, luminance, size, spatial position, vibration intensity.

Carrier and modulator then fall out as a *description of one audio rendering*.
"Rendered onto a 250 Hz sine carrier by amplitude modulation" and "rendered as a
binaural beat between 200 and 210 Hz carriers" are two renderings of the same
abstract 10 Hz signal — which is exactly the comparability
`StimulusSpecification` exists to provide, and which SSTIM cannot currently
state.

### One distinction worth keeping at the rendering layer

Some renderings present the signal **physically**; others produce it
**perceptually**. A visual flicker and an isochronic tone put a real 10 Hz
modulation into the world. A binaural beat does not — no 10 Hz exists in either
ear's signal; the beat is constructed by the auditory system from two carriers.
A monaural beat sits between them: the 10 Hz exists acoustically in the summed
waveform.

That is not a detail. It changes what evidence transfers between renderings,
which is precisely what SSTIM's evidence model
([ADR 0027](../decisions/0027-evidence-claim-family-and-public-claim-gate.md),
[ADR 0050](../decisions/0050-public-claim-applicability-contract.md)) is built
to keep honest — a finding about visual flicker at 10 Hz should not silently
authorize a claim about binaural beats at 10 Hz. The public-claim gate's modality
clause already refuses the cross-modality case; the physical-versus-perceptual
distinction is the finer one underneath it.

### Why this is the keystone direction

It explains the other three. §1's sampled waveform is a signal with an asset
behind it. §2's modulation half is this relation. And the KR-07 finding that
`breathing-oscillation` could not be moved to another modality has exactly this
cause: its periods are the abstract signal, its `centerHz` and `amplitudeHz` are
the audio rendering, and the two were defined as one parameter set. Separate the
layers and the kind becomes portable; leave them glued and every new modality
needs a new kind.

---

## Sequencing

Nothing here blocks the current audit work. In dependency order:

1. **Waveforms** (§1) — self-contained, no migration, unblocks the sampled-asset
   reproducibility story.
2. **State the modality choosing rule** (§4a) — a scope note, not a model change;
   the two schemes are already bridged.
3. **Abstract signals and renderings** (§5) — the keystone. It supplies the
   modulation relation §2 needs, explains why §4's kinds are stuck in audio, and
   is what makes one description comparable across senses. Design this before
   the pieces that depend on it.
4. **Spatial position** (§2) — a rendering target once §5 exists, rather than a
   facet invented on its own.
5. **Protocol namespacing** (§3) — a migration, so it wants the term set to have
   stopped moving.
6. **The specification layer** (§4b items 2 and 3) — the largest, and it should
   subsume ADR 0040's open questions rather than run beside them.
