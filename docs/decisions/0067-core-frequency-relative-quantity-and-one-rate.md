# ADR 0067: Frequency in Core, the quantity of a relative value, one stated rate, and definitions that stand alone

**Status:** Accepted · 2026-10-30 · decided by the maintainer in session
("Modify all listed files", on a proposal that named each protected file and
the five fixes); implemented on the 0.21.0 development line. The same proposal's
GB-05 disjointness was chosen and deferred as a task, recorded under GB-05 in
[`IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md).

## Context

A review of the repository on 2026-10-22 found four defects in the model, each
measured before it was called one:

1. **Core could state a carrier but not a rate.** `sstim:renderingCarrierHz` is
   in the Stimulus module, so a Core description could say a tone is 200 Hz,
   while `sstim:hzMin` and `sstim:hzMax` were in Common, the Core Plus profile.
   The 10 Hz the tone carries, usually the number that matters, could appear only
   in a label, although `sstim:StimulationSignal` is defined as having a
   frequency extent. `examples/README.md` recorded this as a rough edge.
2. **A relative value did not say what it was a value of.** Thaut et al. 1996
   set each tempo as a percentage of the patient's own cadence. ADRs 0063 and
   0066 can state that (a ratio to reference, at the subject-relative stage,
   against `sstim-v:referenceBaselineCadence`), but nothing in the record said
   the value is a tempo. The Workbench listed the three tempi as levels, and its
   rate column could say anything only by matching the label "Baseline cadence".
3. **One frequency was stated three ways, two of them unchecked.** Iaccarino et
   al. 2016 states its 40 Hz as the channel's flicker rate, as the signal's
   extent and as the bands the signal lies within. ADR 0052 checks the signal
   against its bands; nothing checked the channel's rate against its signal.
   Measured over every committed record and example: all 49 flicker, modulation
   and beat rates on channels that render a signal agree with it.
4. **64 of 1,278 definitions cited an ADR or an audit finding**: 62 an ADR
   and three an internal finding, such as "(RDF-08, 2026-07-24 audit)" in the
   public definition of `sstim:targetsFrequencyBand`. A reader of the reference
   documentation can follow neither.

## Decision

1. **`sstim:hzMin` and `sstim:hzMax` are declared in Stimulus.** Their IRIs and
   meaning are unchanged. Their domain, a union of `sstim:FrequencyBand` and
   `sstim:StimulationSignal`, stays in Common with the band class, as one intact
   axiom, as `sstim:hasStimulationTarget`'s domain lives in Session. The Core
   shapes check an extent when one is stated (one bound each, non-negative, the
   lower not above the upper, in SHACL Core); Full still requires one.
2. **`sstim:relativeQuantity`** (Common, on `sstim:StimulusMagnitude`) names the
   quantity a subject-relative magnitude sets, which is also the quantity of the
   measure it is stated against. It is required exactly when the stage is
   subject-relative, and it may not be the ratio or the level above reference
   itself, which say only how the value relates. Thaut's tempi are tempos;
   Lane's and Galambos's levels are sound pressure levels.
3. **The signal is where SSTIM states a frequency.** A channel's flicker,
   modulation and beat rates stay, because the photosensitivity rules key on
   them, and a SHACL rule requires each to lie within the extent of a signal the
   channel renders. A carrier or tone frequency is a different fact and is not
   compared; a channel rendering several signals agrees when one contains it.
4. **A definition stands alone.** No `skos:definition` cites an ADR or an audit
   finding. The provenance moved to `rdfs:seeAlso` (50 links added, pinned to
   `v0.20.0` like the rest) and, for audit findings, which have no document of
   their own, to `skos:historyNote`. `make definition-coverage` fails on a
   citation.

## Consequences

- Core data can state its signal's frequency. Example 01 now does, and example
  02's step up to Core Plus is the calibrated levels Core cannot state. Core
  gains a positive fixture with a frequency and an adversarial one with an
  extent that runs backwards.
- Validation is stricter in one place: a subject-relative magnitude without
  `sstim:relativeQuantity` is rejected. The three committed records that have
  one are updated; data written against 0.20.0 needs the one triple.
- The Workbench's protocol comparison reads the tempo from the record: "tempo
  as a ratio to reference", and in the rate column "tempo set from each
  subject's own baseline cadence".
- One property is added and two move module. Nothing is renamed, deprecated or
  removed. `make protocol-layer` gains three adversarial cases and
  `make signal-layer` two.

## Alternatives considered

- **Moving `sstim:FrequencyBand` into Stimulus, or Common into Core.** Either
  would carry the band vocabulary's structure, or the whole shared-descriptor
  layer, into the smallest profile to gain two properties.
- **Signal-only frequency properties in Stimulus.** Two names for one quantity,
  which is the defect item 3 is about.
- **Stating Thaut's tempo as a tempo in percent.** Every quantity would have to
  accept percent at the subject-relative stage, and "percent of what" would rest
  on the stage alone.
- **The quantity on the participant reference rather than on the magnitude.** A
  pain threshold or a comfortable level has no single quantity: it is a current
  for electrical stimulation and a sound level for sound.
- **Deprecating the channel rates.** The photosensitivity rules and records
  without a signal layer use them.

A signal whose own frequency is set relative to the subject, such as
stimulation at each person's individual alpha frequency, is not decided here.
`sstim-v:referenceIndividualAlphaFrequency` names the measure, but a signal's
extent is absolute; that needs a protocol that uses it before it needs a term.
