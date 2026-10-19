# ADR 0064: Published protocols, and the twelve things they needed

**Status:** Accepted · 2026-10-13 · decided under the maintainer's delegation
in session ("do it all, I trust your decisions"), with explicit permission to
edit the RDF sources; implemented on the 0.20.0 development line

## Context

SSTIM describes a field, and a description standard should be able to
describe that field's best-known protocols. Until now every protocol in its
public data was written by its own maintainer. To test the model against work
it did not shape, nine published protocols were encoded from their sources:

| Protocol | Source read |
|---|---|
| Galambos, Makeig and Talmachoff 1981, the 40 Hz auditory response | PubMed abstract |
| Iaccarino et al. 2016, 40 Hz visual flicker in mice | PMC author manuscript |
| Martorell et al. 2019, 40 Hz tone train in mice | PMC author manuscript |
| Martorell et al. 2019, concurrent 40 Hz light and tones in mice | PMC author manuscript |
| Chan et al. 2022, daily 40 Hz light and sound at home, randomized pilot | open full text |
| Wang, Chen, Gao and Gao 2017, the 40-target SSVEP benchmark | dataset readme and frequency table |
| Ngo, Martinetz, Born and Mölle 2013, closed-loop auditory stimulation in sleep | PubMed abstract |
| Lane, Kasian, Owens and Marsh 1998, binaural beats during vigilance | PubMed abstract |
| Thaut et al. 1996, rhythmic auditory stimulation for gait in Parkinson's disease | PubMed abstract |

They found thirteen things SSTIM could not say. [ADR 0063](0063-stimulus-magnitudes-at-delivery-stages.md)
takes the three about levels (a value without a measurement point, illuminance,
values set per participant). This ADR takes the rest. Every absence was checked
against `docs/ontology/TERM_INDEX.md` before it was called one, and one
supposed absence turned out not to be: a rectangular pulse train is already a
square signal, because `sstim-v:shapeSquare` is defined as two levels with any
duty cycle. It gains the alternative labels "rectangular wave" and "pulse
train" and nothing else.

## Decision

**1. A sensory stimulation protocol may be accountable to its paper.**
`sstim-sh:ProtocolShape` required every `sstim:SensoryStimulationProtocol` to
name a defining framework, and `FrameworkShape` requires a framework to define
a technique it originated. A published laboratory protocol mostly has neither:
there is no framework behind Galambos 1981, and declaring one per paper would
mint framework records in other people's names and force the
`definesTechnique` overclaim [ADR 0033](0033-framework-scope-and-generic-technique-deduplication.md)
removed. [ADR 0007](0007-framework-protocol-implementation.md) already said a
protocol *can* be defined by a framework, not that it must; the requirement
dated from 0.6.0, when every protocol in the repository was BSC's, and
[ADR 0034](0034-neuromodulation-relation-and-neural-target-axis.md) kept the
link because dropping it would lose "true provenance". It was a provenance rule.
For a published protocol the truest provenance is the paper, whose methods
section is the specification.

So the requirement moves to `sstim-sh:ProtocolProvenanceShape`: name a
framework, **or** cite with `dct:source` a `sstim:BibliographicReference`. The
framework block of ProtocolShape keeps its class check. A protocol can have
both. The quality audit applies the same rule. The full-equivalence gate records
the replaced block as a deliberate exception, and `make protocol-layer` re-proves
everything that exception stops it policing.

**2. Schedules.** `sstim:StimulationSchedule`, attached by `sstim:hasSchedule`
to a protocol or one of its arms: session duration, sessions per day, session
count, course duration as a value and a calendar unit (a month has no fixed
length to convert), trials per block, blocks per session, and ordered
`sstim:ScheduleSegment`s, each with a position, a duration, a role (cue,
stimulation, rest, baseline) and optionally the stimulus it presents. It is a
design stated in advance; one planned execution remains a
`sstim:SessionSpecification`, and what happened, session data.

**3. Study arms.** `sstim:StudyArm`, attached by `sstim:hasStudyArm`, with a
role (experimental, active comparator, sham, no stimulation) and, except for a
no-stimulation arm, the stimulus it presents. `sstim:armAllocation` says
whether each subject receives every arm in turn or one. Darkness, quiet and "no
training" are now arms rather than prose, and an arm with no stimulation may not
present one.

**4. Populations and designs reuse the evidence layer's vocabulary.**
`sstim:hasStudyPopulation` links a protocol or arm to the same
`sstim:PopulationDescriptor` evidence bases use, and `sstim:protocolStudyDesign`
to the same `sstim:StudyDesign` values. A population may name its taxon
(`sstim:populationTaxon`, an NCBI Taxonomy IRI) and a defining condition
(`sstim:populationCondition`, such as a MeSH descriptor). These live in the
Evidence module, which already requires Technique; Technique could not
reference Evidence without a cycle. They say who a protocol was for, never who
benefited.

**5. Control laws.** [ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
held that an adaptive stimulus is described by its control law, not a waveform;
SSTIM could declare the regime but not state the law. `sstim:ControlLaw` (in
Stimulus, so Core can describe an adaptive stimulus) states the signal it reads
(`sstim:MeasuredSignalKind`: EEG, ECG, EMG, respiration, movement), the phase it
aims at (`sstim:OscillationPhaseTarget`: up state, down state, peak, trough), a
detection threshold with its unit, the trigger delay, stimuli per trigger, the
refractory period and the channel it drives. The rhythm it follows,
`sstim:trackedOscillation`, is declared in Common, where the named rhythms are.
A control law on a determinate or stochastic specification is rejected.

**6. The sleep oscillations.** `sstim-v:slowOscillation` and
`sstim-v:sleepSpindle` join the neural oscillation scheme. The slow oscillation
is conventionally below 1 Hz (Steriade, Nunez and Amzica 1993) and often
analysed as 0.5 to 1 Hz, while some scalp-EEG work detects it in 0.5 to 2 Hz.
SSTIM has no ambit below 1 Hz, and adding one would extend the band list that
`PRESET_FORMAT.md` and `CLAUDE.md` §4.3 document for a catalog shared with
another application. So its typical band is low delta (0.5 to 2 Hz), the
narrowest that contains it, its extended range is 0.1 to 2 Hz, and its scope
note says why. Spindles take the sensorimotor rhythm's ambit, 12 to 15 Hz, with
an extended range of 11 to 16 Hz, and are distinguished from it by state and
generator (De Gennaro and Ferrara 2003).

**7. Channel timing and geometry.** In Exposure, beside duty cycle and phase
offset:

- `sstim-ex:hasInitialPhase`, a channel's phase at onset as a fraction of a
  cycle. Joint frequency and phase coding gives each SSVEP target its own, and
  `hasPhaseOffset`, defined relative to other channels, drifts between
  channels at different rates. The session module's `sstim:hasOnsetPhase`
  names something else (when an experience began), so this one is "initial".
- `sstim-ex:hasOnsetIntervalDistribution` (uniform, exponential, normal) with
  mean, minimum and maximum intervals, for randomly timed pulses: the comparison
  condition of the GENUS studies. Interval statistics require a named
  distribution and must be ordered.
- `sstim-ex:displayRefreshRateHz`, `viewingDistanceMetres`,
  `sourceWidthMetres`, `sourceHeightMetres` and `visualAngleDegrees`. A visual
  angle is stated when a source gives one, not derived.

**8. The nine protocols are public data.** They live in
`static/ontology/instances/protocols/` (one combined file when this was
decided, one file per protocol since [ADR 0065](0065-committed-records-resolve-by-family-pattern.md)), in the protocol
graph under `https://w3id.org/sstim/implementation/bsclab/protocol/`, and their
eight source papers (Martorell 2019 supplies two protocols) in `references.ttl` as `sstim:BibliographicReference`, not
`PublicSafeReference`: they are sources a description was read from, not
references cleared for product copy. Each protocol describes the method as its
source reports it and asserts no effect. Each says in `skos:editorialNote` what
was read; nothing was filled in from memory, and a parameter the source read
does not state is absent. The three GENUS mouse protocols are typed
`sstim:SensoryRouteNeuromodulationProtocol` as well, because their planned
objective is 40 Hz activity at a named cortical target.

## Consequences

- Five protocols are complete as far as their sources go; four (Galambos, Ngo,
  Lane, Thaut) are abstract-level and wait for their full texts. The terms each
  needs now exist, so completing them is data entry, not modelling.
  *2026-10-15: completed from the full texts, and the prediction was wrong.
  The terms covered most of what the papers say, but the full texts named nine
  more things SSTIM cannot yet state, among them the interval between the two
  stimuli of one closed-loop detection, an adaptive detection threshold, a
  stimulus that progresses week by week, and a level relative to another part
  of the same sound. Each record's editorial note lists its own.*
  *2026-10-16: [ADR 0066](0066-eight-things-the-full-texts-asked-for.md)
  states eight of the nine; a noise's spectrum stays in Lane 1998's note.*
- `make protocol-layer` holds the layer: every promised term is declared, all
  nine protocols cite their paper and none a framework, and 30 fixtures each
  break one rule and must be rejected on their own focus node by their own
  message, against one positive fixture that uses every new term.
- The Technique module now requires Stimulus directly, since schedules and arms
  reference stimulus specifications and units.
- A bibliographic record now has a shape of its own, because a protocol's
  provenance is only as good as the record it cites: a title, and a resolvable
  `dct:source` or an identifier. Until now only public-safe references were
  checked, and an evidence fixture citing a record with nothing but a label
  passed.
- The protocol IRIs, like the two existing reference protocols', do not yet
  dereference at w3id.org; a route under `implementation/bsclab/protocol/` is an
  upstream request, recorded in `TODO.md`.
- 79 new concepts carry labels in all four languages, written by the
  maintainers and not yet natively reviewed, like the earlier ones.

## Alternatives considered

- **Declare a framework per research lineage** (GENUS, Neurologic Music
  Therapy). Works for two of nine, and invents the rest.
- **Type published protocols as the neutral `sstim:StimulationProtocol`.**
  True but less specific, and it hides sensory protocols from every query that
  asks for them; it was the draft's interim choice and is superseded by 1.
- **Add a sub-1 Hz frequency band.** Correct in isolation, but it changes a band
  list documented as a shared catalog contract. Revisit with that contract.
- **Model comparators as extra channels with a control role.** Channels are
  delivered together; arms are alternatives. The two needed different
  structures, and `sstim-ex:roleControlOrSham` keeps its channel-level meaning.
