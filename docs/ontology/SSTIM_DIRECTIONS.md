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
instance of.

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

### 4a. The modality scheme is short, and known to be

`sstim-v:SensoryModalityScheme` declares **six** concepts: auditory, visual,
somatosensory, interoceptive, vestibular, olfactory. Meanwhile
`sstim-ex:StimulusChannel` recognises audio, visual, haptic, respiratory,
olfactory, gustatory and electromagnetic paths. **The two lists disagree**, which
is its own defect independent of length: gustatory is a delivery path with no
modality concept behind it.

`static/schemas/preset.schema.json` briefly listed nine modalities, three of
which SSTIM does not declare. That was caught by adding an enum-versus-vocabulary
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

## Sequencing

Nothing here blocks the current audit work. In dependency order:

1. **Waveforms** (§1) — self-contained, no migration, unblocks the sampled-asset
   reproducibility story.
2. **Modality scheme reconciliation** (§4a) — self-contained, and the
   channel/modality disagreement is a defect today rather than a future want.
3. **Modulation and spatial position** (§2) — needs §1 only loosely; the
   modulation relation is the generalisable half and is worth designing first.
4. **Protocol namespacing** (§3) — a migration, so it wants the term set to have
   stopped moving.
5. **The specification layer** (§4b items 2 and 3) — the largest, and it should
   subsume ADR 0040's open questions rather than run beside them.
