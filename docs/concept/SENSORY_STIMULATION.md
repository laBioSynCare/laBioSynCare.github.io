# Sensory Stimulation

> **Document role:** Conceptual foundation for SSTIM and BSC Lab. The canonical
> ontology class is [`sstim:SensoryStimulation`](../../static/ontology/sstim-core.ttl).
> Claims remain governed by the [Evidence Framework](EVIDENCE_FRAMEWORK.md),
> project boundaries by [Scope](SCOPE.md) and [Non-Scope](NON_SCOPE.md), and
> visual implementation safety by
> [Photosensitivity & Visual-Stimulation Safety](../technical/PHOTOSENSITIVITY_SAFETY.md).
>
> **Status:** Substantively reviewed 2026-07-13. This is a domain definition and
> modeling guide, not a clinical guideline or a claim that any particular
> technique is effective or safe for every person.

## Definition

In SSTIM, **Sensory Stimulation is a process in which structured sensory input
is delivered according to specified parameters for a declared purpose**.

The term identifies the **delivery process**. By itself, it does not assert that
the recipient consciously perceived the input, that a particular neural or
physiological response occurred, that the input caused an outcome, that the
outcome was beneficial, or that the exposure was safe in every context. Those
are represented separately: observations require a stated method and
provenance, while claims require appropriately matched evidence.

In plain language: sensory stimulation is the deliberate presentation of
sound, light, mechanical contact, movement, odor, or another receptor-relevant
input in a way that can be described and evaluated.

Each part of the definition matters:

- **Process:** stimulation is something that happens, not a file, device,
  technique name, or promised state.
- **Structured input:** the input has describable content or organization.
  Structured does not mean simple or periodic; music, speech, naturalistic
  scenes, and stochastic noise can all be structured.
- **Sensory:** the input is intended to be transduced by sensory receptors or to
  alter the sensory evidence available to the recipient. Sensory input may
  concern the external environment, body position and contact, or the internal
  condition of the body.
- **Specified parameters:** the properties material to the exposure are stated
  precisely enough for the intended use. Relevant properties may include
  intensity, spectrum, temporal pattern, duration, spatial arrangement,
  laterality, device, body placement, and control logic.
- **Declared purpose:** the designer states why the input is delivered. A
  purpose may be experimental, expressive, accessibility-oriented,
  informational, wellness-oriented, or clinical in another organization's
  regulated context. Purpose records intent; it does not establish success.

SSTIM uses this operational definition to focus on **designed** stimulation.
Incidental sensory experience is real sensory input, but it is not an instance
of the core `sstim:SensoryStimulation` class unless someone deliberately makes
it part of a specified process. A coffee-shop soundscape, for example, may be
incidental background in one context and a measured, reproducible stimulus in
another.

## Four scopes to keep separate

This document distinguishes the field, the vocabulary, the open reference
implementation, and the commercial product implementation:

| Scope | What inclusion means | What inclusion does not mean |
|---|---|---|
| **Sensory stimulation as a scientific and engineering domain** | a process fits the operational definition above | the process is effective, beneficial, or non-clinical |
| **SSTIM modeling scope** | the vocabulary can describe a technique, exposure, protocol, claim, or boundary case | SSTIM endorses the technique or certifies the claim |
| **BSC Lab implementation scope** | the open application or public reference data currently implement or exercise a concept | BioSynCare implements it, the private catalog contains it, or the research claim is established |
| **BioSynCare product scope** | the commercial implementation deliberately provides or publishes a feature | the feature is part of BSC Lab's public reference data or a community standard |

A technique can belong to the wider field and SSTIM vocabulary without being
delivered by BSC Lab. A clinical study can be relevant evidence while BSC Lab's
public claim remains non-clinical. An implemented renderer can establish that a
stimulus is technically deliverable without establishing a biological outcome.

## The conceptual chain

Sensory-stimulation discussions often collapse several different things into
one word. SSTIM keeps them separate:

```text
design / specification
        ↓ realized by
implementation and device
        ↓ produce
physical or chemical output
        ↓ becomes, at the person
delivered exposure
        ↓ may be transduced into
sensory neural activity
        ↓ may contribute to
perception, action, or physiological response
        ↓ may be captured as
an observation or measurement
        ↓ may support, contradict, or leave uncertain
an evidence-qualified claim
```

None of the arrows guarantees the next step. A renderer can generate a nominal
10 Hz visual pattern without delivering it accurately on a particular display.
An accurately delivered pattern can evoke a measurable response without being
consciously noticed. A measurable response at the stimulus frequency does not,
by itself, establish a useful psychological outcome.

The main entities are therefore distinct:

| Entity | Meaning | Illustrative partial example |
|---|---|---|
| **Stimulus specification** | Information describing the intended input | two dichotic tones at 220 and 230 Hz for 15 minutes |
| **Technique** | A reusable, parameterizable method | binaural-beat stimulation |
| **Implementation** | Software, hardware, mechanical, manual, or hybrid realization | a Web Audio engine and headphones |
| **Delivered exposure / exposure conditions** | The real-world input that reaches the person; represented in SSTIM by an `sstim-ex:ExposureProfile` information artifact | left/right ear-level audio from a named headphone model |
| **Session specification** | The complete `prov:Plan` for one intended run | one configured 15-minute run |
| **Session instance** | The actual `prov:Activity` and `sstim:SensoryStimulationIntervention` recording the execution | one completed 15-minute run |
| **Observation or self-report** | A recorded response, measurement, or report | EEG phase consistency, respiratory rate, task accuracy, or self-reported pleasantness |
| **Evidence claim** | A qualified interpretation of observations and literature | the specified exposure was associated with an endpoint in a stated population and comparison |

This separation is the foundation of the SSTIM core and its
[`sstim-ex:` exposure module](../../static/ontology/sstim-exposure.ttl).
The current ontology has a consent-governed `sstim:SelfReport` class but no single
generic observation class; a broader device-measurement model remains future
work. The table describes the conceptual distinction, not an assertion that
every row maps one-to-one to a current OWL class.

An `sstim-ex:ExposureProfile` describes conditions; it is not the physical
exposure event. The current `sstim-ex:hasExposureProfile` relation attaches a
profile to a technique, protocol, or preset—not directly to a session instance.

## Sensory modalities and delivery paths

Sensory systems transduce physical or chemical changes into neural signals
through specialized receptor mechanisms
([Torre et al., 1995](https://doi.org/10.1523/JNEUROSCI.15-12-07757.1995)).
The mapping from a device output to a perceived modality is not always
one-to-one: low-frequency sound may be heard and felt; screen motion can
produce visually induced self-motion or visual–vestibular conflict without
physically accelerating the head; and a breathing cue can be heard while its
downstream effects are respiratory and interoceptive.

The current SSTIM coarse core modality vocabulary uses six broad channel values
for technique and intervention annotation:

| Broad channel | Typical receptor-relevant input | Important description fields |
|---|---|---|
| **Auditory** | acoustic pressure patterns reaching the auditory system | sound-pressure level or calibrated level, spectrum, waveform, channel separation, spatialization, duration |
| **Visual** | visible light varying in luminance, color, space, or time | luminance and contrast, color, field size, flicker or motion pattern, viewing distance, display timing |
| **Somatosensory** | touch, pressure, vibration, stretch, temperature, and body-position-related input | actuator and contact type, amplitude, frequency, body site, contact area, duty cycle, posture |
| **Interoceptive** | physiological variables arising within the body, including visceral stretch or pressure, respiratory and cardiovascular changes, and chemical milieu | physiological source, pathway, time course, whether it is directly sensed or externally measured, and any behavior mediating the change |
| **Vestibular** | angular or linear acceleration, tilt, and gravity-related input | motion axis, acceleration, duration, posture, support, and balance context |
| **Olfactory** | airborne chemical stimuli reaching olfactory receptors | substance identity, concentration, delivery and clearance, duration, environment, and sensitivity controls |

The exposure vocabulary is deliberately extensible and also represents
perceived modalities such as tactile, proprioceptive, and gustatory where more
specific modeling is needed.

These controlled values—and the mechanism and effect vocabularies used later—
are information-content categories, implemented as dual-typed OWL individuals
and SKOS concepts. They classify descriptions; they are not themselves sensory
processes, physiological structures, or observed effects.

### Terminology that must not be conflated

- **Haptic** describes touch-mediated interaction or technology, often spanning
  tactile and kinesthetic components. In SSTIM it identifies a device or
  actuator delivery path, not a receptor system or a single perceptual modality.
- **Tactile** describes a touch-related percept.
- **Somatosensory** is the broader body-sense channel.
- **Vibrotactile** describes a mechanical stimulation mechanism.
- **Multisensory or cross-modal** means that more than one sensory modality is
  involved; it is not a seventh receptor system.
- **Respiratory guidance** is not itself a sensory modality. An auditory,
  visual, or tactile cue may guide voluntary breathing; changed respiration
  then produces physiological and interoceptive signals.

This convention is formalized in
[ADR 0019](../decisions/0019-modality-nomenclature-cleanup.md). When physical
medium, perceived channel, device capability, or placement matters, use an
exposure profile rather than the coarse `sstim:techniqueModality` relation; see
[ADR 0010](../decisions/0010-exposure-delivery-modality.md).

## What must be specified

A frequency label alone is not an adequate stimulation description. A useful
description covers the dimensions that could materially affect delivery,
interpretation, reproduction, or safety:

| Dimension | Questions to answer |
|---|---|
| **Stimulus form** | What waveform, spectrum, image, pattern, material, motion, or chemical composition is intended? |
| **Intensity and dose** | What calibrated intensity reaches the relevant site, for how long, with what duty cycle and cumulative exposure? |
| **Time** | What are the onset, offset, repetition rate, modulation, phase, transitions, randomness, and total duration? |
| **Space and placement** | Where is the input delivered, over what field or contact area, and with what laterality or spatial relation? |
| **Delivery** | Which device and transducer are used, how are they calibrated, and what limitations or latency do they introduce? |
| **Control regime** | Is delivery fixed, time-varying by a predetermined schedule, user-responsive, adaptive, or measurement-driven closed-loop? |
| **Context** | What is the person's task, posture, environment, prior exposure, and ability to pause or stop? |
| **Population** | For whom was the protocol designed or studied, and what inclusion, exclusion, or accessibility factors apply? |
| **Purpose and endpoints** | What is intended, what is actually measured, when is it measured, and by which instrument or scale? |
| **Evidence and safety** | Which claims are supported, mixed, inconclusive, or speculative, and which exposure boundaries apply? |

Digital parameter values do not necessarily describe physical exposure. For
example, an application gain of `0.30` is not a sound-pressure level at the ear;
the resulting level varies with the generated signal, operating system, audio
interface, amplifier, transducer, fit, and environment. Reproducibility must be
stated at the right level: a deterministic session specification and conforming
engine may reproduce the same digital signal while producing different
exposures on different devices. Exact replay of a stochastic generator also
requires a recorded random algorithm and seed or a complete event history.

## Principal mechanism families

A mechanism is an explanation proposed for a response, not a synonym for the
response and not proof of an outcome. SSTIM records mechanisms with the
`sstim:proposedMechanism` relation so that they can be revised as evidence
changes.

### Evoked and steady-state sensory responses

Repeated or periodic input can produce neural activity that is time-locked to
the input. Auditory, visual, and somatosensory research respectively measures
auditory steady-state responses (ASSRs), steady-state visual evoked potentials
(SSVEPs), and steady-state somatosensory evoked potentials (SSSEPs). Responses
may appear at the stimulation frequency and harmonics. With multiple tagged
inputs and nonlinear interaction, intermodulation components may also occur.

The auditory **frequency-following response** (FFR) is a specific
electrophysiological measure of periodic sound encoding; it should not be used
as a generic label for every auditory rhythm or every claimed downstream
effect.

After stimulus and recording artifacts have been excluded, an evoked or
steady-state response supports the conclusion that the nervous system tracked
some feature of the stimulus under the measurement conditions. It does not by
itself establish a change in a resting EEG band, a mental state, performance,
wellness, or clinical status.

### Neural entrainment

“Entrainment” is used at several levels that require different evidence:

1. the stimulus contains a rhythm;
2. recorded neural activity contains energy at that rhythm;
3. neural responses are phase-locked to repeated input; or
4. an endogenous neural oscillator changes its phase or frequency through
   interaction with the external rhythm.

Only the fourth is neural entrainment in the strict dynamical-systems sense.
The second and third can also arise from a succession of evoked responses.
Contemporary reviews therefore caution against treating a spectral peak or
phase-locked response as sufficient proof that an endogenous oscillator was
entrained
([Duecker et al., 2024](https://doi.org/10.1523/JNEUROSCI.1234-24.2024)).
“Brainwave entrainment” is useful as a historical or search term, but it is too
claim-laden to substitute for a measured mechanism.

### Sensory-guided behavior and autonomic pathways

A sensory cue can invite a timed action such as breathing, walking, tapping, or
shifting attention. The pathway is then a chain: cue delivery, cue perception,
behavioral coordination, physiological consequence, and measured endpoint.

Paced breathing illustrates the distinction. A slowly changing sound or visual
animation does not directly impose a respiratory rate. It provides a cue; the
person may follow it, partly follow it, or ignore it. Only a respiratory
measurement can establish the breathing pattern actually performed. Slow
voluntary breathing has a substantial literature on heart rate and heart-rate
variability
([Laborde et al., 2022](https://doi.org/10.1016/j.neubiorev.2022.104711)),
but the effect of a particular cue design or combined audio session must still
be evaluated separately. Approximately six breaths per minute is common in
preset-pace research, while an individual's measured cardiovascular resonance
frequency can differ
([Lalanza et al., 2023](https://doi.org/10.1007/s10484-023-09582-6)).

A fixed breathing cue is **open-loop**. It is **biofeedback** when a measured
participant signal is returned to the participant as feedback; it is
**measurement-driven closed-loop** when that signal changes subsequent cues
according to a declared control rule. A protocol may be both.

### Attention, salience, adaptation, and affect

Sensory input can orient attention, provide a task-relevant timing signal, mask
other input, become less salient through adaptation or habituation, or change
subjective qualities such as pleasantness and arousal. These are legitimate
mechanism or outcome candidates, but they are context- and task-dependent.

Terms such as “attentional anchoring” are best treated as design rationales
until a defined attentional measure supports them. A pleasant or absorbing
experience does not prove reduced mind-wandering, altered default-mode-network
activity, or engagement of a particular neuromodulatory system.

### Multisensory integration

Inputs delivered through multiple modalities can interact rather than merely
add. Their temporal and spatial correspondence and the effectiveness of each
component can affect the combined response
([Stein & Stanford, 2008](https://doi.org/10.1038/nrn2331)). In human
perception, cue reliability, semantic correspondence, attention, and task
demands can also matter
([Ernst & Bülthoff, 2004](https://doi.org/10.1016/j.tics.2004.02.002);
[Talsma et al., 2010](https://doi.org/10.1016/j.tics.2010.06.008)).
Synchronized channels may improve salience or timing in some conditions,
interfere in others, or produce no measurable advantage.

Evidence from a multisensory protocol therefore does not automatically transfer
to any one component. An audiovisual result is evidence about the tested
audiovisual configuration, not direct evidence for an auditory-only session.

### Stochastic resonance and stochastic facilitation

In some nonlinear or thresholded systems, an appropriate amount of noise can
improve detection or transmission of a weak signal. The effect depends on the
signal, noise distribution and intensity, threshold, participant, and measured
performance; too much noise degrades the signal
([McDonnell & Ward, 2011](https://doi.org/10.1038/nrn3061)). Generic noise,
masking audio, or an aesthetically textured soundscape should not be called
stochastic resonance unless this threshold-dependent facilitation is part of
the design and is actually tested.

## How common techniques fit the definition

| Technique or design | What is delivered | Defensible first statement | What is not implied |
|---|---|---|---|
| **Binaural beats** | two tones of slightly different frequency delivered separately to the ears | a binaural beat is a percept associated with the frequency difference under suitable dichotic presentation | reliable cortical entrainment, “hemispheric synchronization,” or a wellness outcome |
| **Monaural beats / isochronous tones** | an acoustic amplitude envelope or discrete pulses physically present in the signal | the auditory system receives periodic energy that may evoke a frequency-tagged response | that the whole brain enters the named EEG band or a matching mental state |
| **Periodic visual (photic) stimulation** | periodic luminance or contrast modulation | periodic visual input can evoke an SSVEP under suitable conditions | benefit, clinical efficacy, or individual safety; flicker requires specific safeguards |
| **Vibrotactile stimulation** | mechanical pulses or vibration at a body site | periodic tactile input can evoke somatosensory responses, including SSSEPs in suitable paradigms | equivalence to audio, whole-body effects, or benefit independent of placement and intensity |
| **Audiovisual or audio-tactile stimulation** | coordinated input through two or more channels | the configuration is multisensory and its cross-channel timing can be specified | that it outperforms either component or that its evidence transfers to a unisensory version |
| **Martigli breathing guidance** | frequency-modulated audio, optionally synchronized with visual or haptic cues | the design provides a reproducible pacing cue whose period can change over time | that a user followed the cue, reached a resonance frequency, or experienced a specific autonomic outcome |
| **Sonic Symmetry / ambient sequences** | parameterized pitch and timing sequences | the method produces parameterized structured auditory content across periodic, quasi-periodic, or sparse regimes | reduced default-mode processing, improved attention, or neural entrainment without matching evidence; exact replay of a stochastic shuffle also requires a recorded random seed or permutation history |
| **Noise-assisted detection** | a defined signal plus calibrated stochastic input | the design can test whether a particular noise level changes near-threshold detection | that any pink or white noise exposure implements stochastic resonance |

The binaural-beat literature is a good example of why these boundaries matter.
The perceptual phenomenon is established, but a
[systematic review of EEG studies](https://doi.org/10.1371/journal.pone.0286023)
found heterogeneous methods and inconsistent oscillatory findings.
Psychological outcomes, when studied, form additional claim sets with their own
populations, comparators, masking conditions, exposure times, and risk of bias.

## Boundaries and adjacent fields

### Music and naturalistic content

Music is not excluded merely because it is complex or enjoyable. A specified
musical excerpt, soundscape, or generative process deliberately delivered in a
protocol can be sensory stimulation. Ordinary listening is outside SSTIM's
core process class when it is only incidental experience and no stimulation
process is being specified. “Parameter-defined” should not be mistaken for
“musically simple.”

### Neurofeedback and adaptive systems

Neurofeedback measures a feature of a participant's neural activity and
presents information derived from it in near real time to facilitate learned
self-regulation. Feedback from respiration, heart rate, or HRV is biofeedback,
but not neurofeedback. A separate adaptive controller may change a cue from a
measured state without constituting neurofeedback. The feedback display is
sensory stimulation, but the complete intervention also includes sensing,
signal processing, feedback mapping, and a learning or control loop
([Sitaram et al., 2017](https://doi.org/10.1038/nrn.2016.164)).

An open-loop prerecorded session is not neurofeedback. SSTIM already represents
closed-loop auditory techniques and sensor/adaptive capabilities at a coarse
level, but it does not yet model a complete EEG/BCI acquisition, processing,
feedback, and learning stack.

### Direct neural stimulation

Transcranial magnetic or electrical stimulation, deep-brain stimulation, and
other techniques whose primary route is direct action on neural tissue usually
sit adjacent to the core sensory-stimulation process category; they do not
become sensory stimulation merely because they may produce a sensation. The
practical boundary is the intended causal route: sensory stimulation acts
through sensory receptors and afferent processing, while direct
neurostimulation targets neural tissue through another energy-transfer
mechanism.

Neuroprostheses that electrically stimulate retinal, auditory, or other neural
structures sit near this receptor/direct-neural boundary. Sensory-substitution
systems that remap information into an intact receptor-mediated channel remain
sensory stimulation at the output stage, even when the information originated
in another modality.

For domain completeness, SSTIM currently catalogs focused-ultrasound
neuromodulation as an explicit boundary entry with no perceived modality. That
catalog entry does not make direct neuromodulation a core sensory-delivery
example or a BSC Lab capability.

### Clinical and wellness uses

“Sensory stimulation” does not itself mean wellness, therapy, or medical
treatment. Sensory techniques are used in basic research, accessibility,
entertainment, education, rehabilitation, and regulated clinical contexts. The
scientific process category is independent of intended use and regulatory
status.

The **SSTIM vocabulary** can represent claims, evidence, cautions, and intended
contexts without certifying them. The **Sensory Stimulation Vocabulary
Community Group** does not issue clinical guidelines or approve efficacy. **BSC
Lab is a non-clinical research/reference and development platform; BioSynCare
is a separate non-clinical commercial wellness implementation.** Neither
diagnoses, treats, cures, or prevents conditions. The full boundary is defined
in [Scope](SCOPE.md) and [Non-Scope](NON_SCOPE.md).

### Environmental exposure

Sound, light, temperature, motion, and electromagnetic energy can be described
as exposures without being claimed as stimulation techniques or health
interventions. SSTIM's exposure module intentionally supports exploratory and
boundary cases. Recording an exposure is not an assertion that it is perceived,
beneficial, harmful, or currently deliverable by BSC Lab.

## Evidence discipline

Three propositions must remain independent:

1. **Delivery:** a specified input reached the person under stated conditions.
2. **Response:** a defined perceptual, neural, physiological, behavioral, or
   subjective endpoint was observed.
3. **Interpretation:** the input caused, supported, or is useful for a broader
   outcome.

Evidence for one does not automatically establish the next. A responsible
claim states the applicable technique and parameters, physical delivery and
perceived-modality configuration, population, context, endpoint, time window,
result direction, uncertainty, source, and—where applicable—comparator.
Evidence is therefore attached to a specific relation, not to “sensory
stimulation” as a whole.

Practical rules:

- Separate **design intent**, **proposed mechanism**, **observed response**, and
  **claimed outcome** in both prose and data.
- Match evidence to the delivered modality and configuration. Auditory,
  visual, tactile, and multisensory results are not interchangeable.
- Match the population, task, exposure duration, comparator, and endpoint.
- Report null, mixed, and adverse findings as well as supportive findings.
- Treat a self-report as a phase-qualified observation of that person's
  reported experience. It may inform a narrowly scoped claim, but is not by
  itself population-level efficacy or mechanism evidence.
- Do not use a named EEG band as a shortcut from stimulus frequency to mental
  state. “10 Hz,” “alpha,” and “relaxation” are three different descriptions,
  not a causal chain.
- Do not describe a mechanism as established merely because it is plausible.
- Revise claims when better evidence appears; provenance and review date are
  part of the claim.

SSTIM implements these rules through claim-level evidence records, modality
tags, provenance, citations, direction and review status, plus machine-checked
public-claim ceilings. See the [Evidence Framework](EVIDENCE_FRAMEWORK.md) and
[ADR 0018](../decisions/0018-evidence-integrity-and-public-claim-governance.md).

## Safety and accessibility principles

Safety belongs to the specific exposure, person, device, and context—not to a
technique name alone. A complete design considers both acute discomfort and
cumulative dose, provides meaningful control, and states what the
implementation can and cannot measure.

- **User control:** preview the nature of the stimulus; allow independent
  channel controls, intensity adjustment, pause, and immediate stop. Never
  rely on a user being able to disable a hazardous stimulus after it starts.
- **Sound:** manage level and duration together. Follow the
  [WHO–ITU safe-listening guidance](https://www.who.int/publications/i/item/9789241515276)
  and device exposure warnings. A normalized software gain is not calibrated
  dB at the ear, so it cannot support a hearing-safety guarantee.
- **Flashing light:** for Web-delivered visual content,
  [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)
  requires that nothing flash more than three times in any one-second period
  **unless** the flash remains below the defined general/red-flash thresholds.
  Use this as a baseline elsewhere while applying the standards appropriate to
  the delivery medium. It is an accessibility threshold, not a declaration
  that every pattern at or below 3 Hz is safe for every viewer. Field size,
  luminance, contrast, color, device, and viewing conditions also matter.
- **Motion and visual animation:** provide a reduced-motion or static option and
  honor platform motion preferences
  ([WCAG 2.2 guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)).
  Non-flashing animation can still provoke nausea, dizziness, headache, or
  distraction in susceptible users.
- **Mechanical, thermal, and body-contact input:** respect actuator and device
  limits; specify placement and contact; avoid painful, numbing, irritating, or
  destabilizing output; and stop on discomfort. Use conservative limits and
  extra safeguards where sensation or circulation is impaired; pain is not a
  reliable warning for every person.
- **Vestibular and movement-related input:** distinguish actual acceleration
  from visually induced motion; provide stationary or static options; account
  for posture, support, balance, nearby obstacles, immediate stop, and recovery
  after the exposure. Stop on nausea, dizziness, or disorientation.
- **Olfactory and chemical input:** identify the substance and concentration;
  consider allergens, irritation, ventilation, clearance, and exposure to
  bystanders; and provide an immediate stop or exit. “Natural” does not mean
  safe.
- **Breathing guidance:** favor a comfortable voluntary pace and natural depth;
  avoid forced deep breathing, over-breathing, or coercive breath holds; allow
  the user to ignore or stop the cue; and do not infer adherence without
  measurement. Stop on dizziness, lightheadedness, tingling, chest discomfort,
  or unusual breathlessness.
- **Context:** do not use drowsiness-oriented, immersive, or attention-demanding
  stimulation while driving, operating machinery, or where reduced awareness
  could create danger.
- **Research:** participant-facing studies require protocol-specific ethics,
  consent, screening, adverse-event handling, privacy, and data-governance
  procedures beyond this document.

BSC Lab's implemented visual controls and current limitations are documented in
[Photosensitivity & Visual-Stimulation Safety](../technical/PHOTOSENSITIVITY_SAFETY.md).
That technical document governs the application; the principles here do not
replace it.

## SSTIM and BSC Lab model

SSTIM separates the domain into layers so that techniques are not confused with
products or executions:

| Layer | Role in the model | BSC example |
|---|---|---|
| **Framework** | broad principles, techniques, protocol rules, evidence and design constraints | BSC framework |
| **Technique** | reusable parameterizable method, not enough alone to reproduce a session | binaural beat, Martigli oscillation, rhythmic vibrotactile stimulation |
| **Protocol** | structured method specification using one or more techniques, with timing, ranges, constraints and cautions | a public BSC Lab protocol |
| **Implementation** | concrete software, hardware, manual, or hybrid realization | BSC Lab or BioSynCare |
| **Preset** | reusable, versioned parameter configuration for an implementation | a BSC Lab reference preset |
| **Session specification** | complete intended execution, including user overrides | one 30-minute configured run |
| **Session instance** | a `sstim:SensoryStimulationIntervention` and `prov:Activity` recording what was actually executed | the completed or interrupted session record |
| **Exposure profile** | information artifact describing physical medium, perceived modality, device, placement and boundaries | headphones at the ears plus a visual display |
| **Evidence claim** | evidence-qualified assertion about a specific relation | a reviewed claim linked to a technique and cited source |

The full distinction is normative in
[ADR 0007](../decisions/0007-framework-protocol-implementation.md),
[ADR 0014](../decisions/0014-preset-is-not-a-protocol.md), and the
[Session Model](../technical/SESSION_MODEL.md).

### Namespaces and organizational boundary

- `https://w3id.org/sstim` — ontology identifier and persistent entry point;
  distinct from the hash namespace for core terms.
- `sstim:` — `https://w3id.org/sstim#` — reusable core ontology terms.
- `sstim-v:` — `https://w3id.org/sstim/vocab#` — controlled vocabulary values.
- `sstim-sh:` — `https://w3id.org/sstim/shapes#` — SHACL validation terms.
- `sstim-ex:` — `https://w3id.org/sstim/exposure#` — exposure and experiment
  terms.
- `sstim-eco:` — `https://w3id.org/sstim/ecosystem#` — stakeholder and
  ecosystem terms.
- `https://w3id.org/sstim/framework/bsc` — the BSC framework resource.
- `https://w3id.org/sstim/framework/bsc/technique/` — BSC framework technique
  identities.
- `https://w3id.org/sstim/implementation/bsclab` — the open BSC Lab reference
  implementation.
- `https://w3id.org/sstim/implementation/bsclab/{protocol,preset,evidence,session}/`
  — public BSC Lab implementation data by resource type.
- `https://w3id.org/sstim/implementation/biosyncare` — the BioSynCare
  implementation identity and any public-safe metadata deliberately published.
- `https://w3id.org/sstim/ref/` — reusable public reference resources.

Namespace IRIs identify resources; named-graph IRIs record module or provenance
boundaries. They are not interchangeable.

SSTIM is public and designed for reuse beyond BSC, with implementation-specific
resources and data kept in their own paths. BSC Lab is an open reference
implementation and knowledge platform built around it. BioSynCare is a separate
commercial implementation of the BSC framework. The implementations may share
formats and design principles, but the private BioSynCare/BSC catalog is not a
BSC Lab data source and is not converted into or loaded as SSTIM instance data.

## Minimum completeness checklist

A new stimulation description is not ready for publication or comparison until
its authors can answer:

1. What exactly is the intended stimulus?
2. Through which physical medium, device, and body placement is it delivered?
3. Which modality or modalities are expected to be engaged?
4. Which temporal, spatial, spectral, intensity, and duration parameters matter?
5. Is the process open-loop, adaptive, user-responsive, or measurement-driven
   closed-loop?
6. What is its declared purpose, and which endpoints are actually measured?
7. What population, task, and environment does each claim concern, and what
   comparator applies where the claim is comparative?
8. Which mechanism is proposed, and what evidence supports or challenges it?
9. Which safety, comfort, accessibility, and consent controls apply?
10. Which technique, protocol, implementation, preset, session, and exposure
    resources carry the information?
11. Can another team reconstruct the intended stimulus or procedure and, where
    digital, its output, while understanding the remaining device- and
    participant-dependent uncertainty? For stochastic generation, are the
    random algorithm and seed or event history recorded when exact replay is
    required?
12. Is every public statement no stronger than the evidence and scope allow?

If a field is unknown, record it as unknown rather than silently treating it as
irrelevant.

## Scientific and standards references

The references below ground the distinctions in this document. They do not
validate any BSC preset or product claim.

- U.S. National Library of Medicine. [Sensory Receptor Cells (MeSH)](https://www.ncbi.nlm.nih.gov/mesh/68011984) — sensory receptors and transduction of external, internal, and proprioceptive input.
- Torre V, Ashmore JF, Lamb TD, Menini A. [Transduction and adaptation in sensory receptor cells](https://doi.org/10.1523/JNEUROSCI.15-12-07757.1995) (1995) — receptor transduction and adaptation across sensory systems.
- Chen WG, Schloesser D, Arensdorf AM, et al. [The emerging science of interoception: sensing, integrating, interpreting, and regulating signals within the self](https://doi.org/10.1016/j.tins.2020.10.007) (2021).
- Duecker K, Doelling KB, Breska A, Coffey EBJ, Sivarao DV, Zoefel B. [Challenges and Approaches in the Study of Neural Entrainment](https://doi.org/10.1523/JNEUROSCI.1234-24.2024) (2024) — distinctions among rhythmic input, evoked responses, and endogenous oscillatory entrainment.
- Coffey EBJ, Nicol T, White-Schwoch T, et al. [Evolving perspectives on the sources of the frequency-following response](https://doi.org/10.1038/s41467-019-13003-w) (2019) — evidence for multiple cortical and subcortical FFR sources.
- Norcia AM, Appelbaum LG, Ales JM, Cottereau BR, Rossion B. [The steady-state visual evoked potential in vision research: A review](https://doi.org/10.1167/15.6.4) (2015).
- Petit J, Rouillard J, Cabestaing F. [EEG-based brain-computer interfaces exploiting steady-state somatosensory-evoked potentials: a literature review](https://doi.org/10.1088/1741-2552/ac2fc4) (2021).
- Stein BE, Stanford TR. [Multisensory integration: current issues from the perspective of the single neuron](https://doi.org/10.1038/nrn2331) (2008).
- Ernst MO, Bülthoff HH. [Merging the senses into a robust percept](https://doi.org/10.1016/j.tics.2004.02.002) (2004) — reliability-weighted multisensory integration.
- Talsma D, Senkowski D, Soto-Faraco S, Woldorff MG. [The multifaceted interplay between attention and multisensory integration](https://doi.org/10.1016/j.tics.2010.06.008) (2010).
- McDonnell MD, Ward LM. [The benefits of noise in neural systems: bridging theory and experiment](https://doi.org/10.1038/nrn3061) (2011).
- Ingendoh RM, Posny ES, Heine A. [Binaural beats to entrain the brain? A systematic review of effects on brain oscillatory activity](https://doi.org/10.1371/journal.pone.0286023) (2023).
- Orozco Perez HD, Dumas G, Lehmann A. [Binaural Beats through the Auditory Pathway: From Brainstem to Connectivity Patterns](https://doi.org/10.1523/ENEURO.0232-19.2020) (2020) — separately measures carrier-frequency FFRs and beat-frequency ASSRs and reports weaker cortical entrainment for binaural than monaural beats.
- Laborde S, Allen MS, Borges U, et al. [Effects of voluntary slow breathing on heart rate and heart rate variability: A systematic review and meta-analysis](https://doi.org/10.1016/j.neubiorev.2022.104711) (2022).
- Lalanza JF, Lorente S, Bullich R, et al. [Methods for Heart Rate Variability Biofeedback: A Systematic Review and Guidelines](https://doi.org/10.1007/s10484-023-09582-6) (2023).
- Sitaram R, Ros T, Stoeckel L, et al. [Closed-loop brain training: the science of neurofeedback](https://doi.org/10.1038/nrn.2016.164) (2017).
- World Health Organization and International Telecommunication Union. [Safe listening devices and systems: a WHO–ITU standard](https://www.who.int/publications/i/item/9789241515276) (2019).
- W3C Web Accessibility Initiative. [WCAG 2.2: Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) and [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) (updated 2025).

---

*Early project notes used the coined term “Sensory Harnessing.” It was replaced
with the established umbrella “Sensory Stimulation” in April 2026, before the
first public ontology release.*

*Maintained by: Renato Fabbri · Substantive review: 2026-07-13*
