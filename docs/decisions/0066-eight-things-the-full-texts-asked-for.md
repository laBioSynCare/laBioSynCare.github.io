# ADR 0066: Eight things the full texts asked for

**Status:** Accepted · 2026-10-16 · decided by the maintainer in session ("yes
for both decisions", on a proposal to state the first eight in one decision
record and leave a noise's spectrum as a note), under the standing permission to
edit the RDF sources; implemented on the 0.20.0 development line

## Context

[ADR 0064](0064-published-protocols-schedules-arms-and-control-laws.md)
encoded nine published protocols, four of them from their abstracts, and
predicted that completing those four would be data entry. It was not. Reading
the full texts on 2026-10-15 found nine things the papers state and SSTIM could
not:

| Paper | What it states | What SSTIM lacked |
|---|---|---|
| Ngo et al. 2013 | Two bursts per detection, the second 1.075 s after the first | `sstim:stimuliPerTrigger` counts the stimuli but cannot space them |
| Ngo et al. 2013 | A threshold recomputed every 2 s from the preceding 5 s of EEG | A detection threshold was one fixed value |
| Ngo et al. 2013 | The first burst after each subject's own trough-to-peak interval, measured in an adaptation night | `sstim:triggerDelaySeconds` takes one number for every subject |
| Ngo et al. 2013 | Stimulation only in stage 2 and slow-wave sleep | No sleep stages |
| Thaut et al. 1996 | Every tempo rises 5 to 10% after each week | A magnitude held one value for the whole course |
| Thaut et al. 1996 | The fastest tempo kept at or below 130 steps per minute | No tempo quantity and no beats-per-minute unit |
| Lane et al. 1998 | Carrier tones 15 dB above the pink noise | A level could be relative to the subject's own measure, not to another part of the same sound |
| Galambos et al. 1981 | Monaural, the ear not stated | Placements were both ears, the left or the right |
| Lane et al. 1998 | Noise flat from 40 to 320 Hz, falling 12 dB per octave above and below | No term for a noise's spectrum |

Each absence was checked against the committed `docs/ontology/TERM_INDEX.md`
before it was called one. Three near matches were found and do not serve.
`sstim:tempoBpm` is the Patch Studio's authoring tempo on a preset or session
specification: a property, which a `sstim:StimulusMagnitude` cannot name as its
quantity, and which carries no stage, basis or source words.
`sstim:hasOscillationStateContext` names a state such as slow-wave sleep, but as
free text describing where a rhythm is observed, not as a condition on delivery.
The noise colours (`sstim-ex:AudioNoiseColor`) name a spectral slope, not a band.

## Decision

**1. The stimuli of one trigger, and their spacing.**
`sstim:interStimulusIntervalSeconds` (Stimulus, on `sstim:ControlLaw`) is the
time from the onset of one stimulus to the onset of the next among those a
single detection triggers. A law that states one must deliver at least two
stimuli per trigger.

**2. An adaptive threshold.** `sstim:thresholdUpdateIntervalSeconds` says how
often the threshold is recomputed and `sstim:thresholdWindowSeconds` from how
much recent signal. A law that states them has an adaptive threshold, and its
`sstim:detectionThresholdValue` is the value it starts from. They travel
together, and an adaptive threshold must state its starting value. Ngo's
threshold also only ever moves to values more negative than its default; one
paper is not enough to design a bound on an adaptive threshold, so that stays
in the record's note.

**3. A delay calibrated for each subject.** `sstim:triggerDelayReference`
(Common) names the subject's own measure the delay equals, reusing
[ADR 0063](0063-stimulus-magnitudes-at-delivery-stages.md)'s participant
references rather than adding a second mechanism. `sstim-v:referenceTroughToPeakInterval`
joins them. A delay is stated in seconds or calibrated, never both. Ngo's
out-of-phase condition tuned its second burst to the hyperpolarisation the first
one evoked, a measure no reference names; that law states no interval, and its
note says why.

**4. Sleep stages.** `sstim:SleepStage` and a scheme of the five AASM stages:
wake, N1, N2, N3 and REM, with N3 carrying the alternative labels "slow-wave
sleep" and "stages 3 and 4", since the older Rechtschaffen and Kales rules split
it in two, and Ngo's paper scored sleep by them. `sstim:deliveryRestrictedToSleepStage`
puts the restriction on the control law, because it gates delivery the way the
threshold does: the population sleeps through every stage, and the schedule
runs the whole night.

**5. A level that changes over a course.** `sstim:MagnitudeProgression`,
attached to a magnitude by `sstim:hasProgression`, states one step or a range of
steps, the unit of a step (percent of the magnitude's value at that point, or a
unit the magnitude's quantity is stated in), how often a step is taken (a value
and a calendar unit: day, week or month), and a limit. The limit is a magnitude
of its own because it can be in another quantity: Thaut's tempi are
percentages of each patient's cadence, and the ceiling is 130 steps per minute.
The magnitude a progression qualifies states the value at the start. SHACL
requires the unit and the interval, one step or both bounds, an ordered range,
a calendar interval unit, and a step unit the magnitude can take.

**6. Tempo.** `sstim-v:quantityTempo`, stated in `sstim-v:unitBeatsPerMinute`,
whose alternative labels include "steps per minute".

**7. A level above another component of the same stimulus.**
`sstim-v:quantityLevelAboveComponent`, in decibels: a signal-to-noise ratio.
The participant references cannot carry it, since they are measures of the
subject and the noise is part of the stimulus. Because the number means nothing
without the two components, the magnitude's `rdfs:label` must name them, and
SHACL requires one. Lane's level holds at the configured stage: it was set on
the tape, and a playback passes it through unchanged.

**8. One ear.** `sstim-ex:placementOneEar`, narrower than the ears beside the
left and the right, for monaural delivery when the source does not say which
ear, or the side varies between recordings.

**Not added: a noise's spectrum.** A signal's `sstim:hzMin` and `sstim:hzMax`
can carry a flat band, and a colour names a slope, but neither states a band
with a roll-off outside it. The colours' own scope note asks for the slope or
the generation method to be documented, which today only free text can do. One
paper is not enough to design that term well, so Lane's spectrum stays in its
description and editorial note until a second source needs it.

## Consequences

- The four records use the new terms: both of Ngo's control laws, Thaut's
  three tempi and their ceiling, Lane's carrier tones on every tape, and
  Galambos's earphone. Each editorial note now lists only what is still
  unstated: Ngo's threshold bound, its halt during arousals and its
  per-subject out-of-phase interval, and Lane's noise spectrum.
- `make protocol-layer` checks the eight additions are declared and adds 17
  adversarial fixtures, 47 in all, each rejected on its own focus node by its
  own message, against one positive fixture that uses every term.
- The Workbench comparison page (`/protocols/`) shows the adaptive threshold,
  the calibrated delay, the spacing of a detection's stimuli, the sleep stages,
  a progression with its limit and the source's words for it, and the label of
  a level between components.
- Two classes, thirteen properties and ten concepts are added; the concepts
  carry labels in all four languages, 30 of them written by the maintainers and
  not natively reviewed, like the earlier ones. Nothing is removed or
  deprecated, and every new rule constrains only the new terms, so no existing
  record is affected.

## Alternatives considered

- **A magnitude per week for Thaut's tempi.** The paper gives a rule, not the
  values, and each subject's step was chosen within a range; a list would
  invent the numbers.
- **Ngo's mean delay, 508 ms, as the stated delay.** It is a mean over
  per-subject values, and stating it as the delay would describe a protocol
  nobody ran. The description keeps the mean.
- **The sleep-stage restriction on the schedule or the population.** Neither
  is restricted: subjects sleep through every stage and the schedule covers the
  night. Delivery is what halts.
- **Keeping "ears" with a note.** The ears concept is defined as both ears, so
  the record would have stated something false.
- **Lane's tone level as a participant reference.** References are the
  subject's own measures; making the noise one would blur the line ADR 0063
  drew.
