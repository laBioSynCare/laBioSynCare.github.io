# ADR 0052 — Abstract signals and their sensory renderings

**Status:** Accepted — 2026-08-16 · implemented 2026-08-16

## Context

A breathing cue can be auditory, visual, audiovisual or tactile. A 10 Hz alpha
target can be delivered as an amplitude-modulated tone, a binaural beat, a light
flickering, or a vibration. In each case one thing is being delivered several
ways — and SSTIM cannot say so.

It has the pieces. Four of them, verified against
[`TERM_INDEX.md`](../ontology/TERM_INDEX.md) rather than assumed:

1. **`sstim:StimulusSpecification`** — *"an engine-independent description of a
   sensory stimulation, stating what reaches the subject in physical or
   perceptual units rather than the settings that make a particular engine
   produce it. Two implementations whose output matches realise the same stimulus
   specification, which is what makes them comparable."*
2. **`sstim:hasStimulusChannel` → `sstim-ex:StimulusChannel`** — one
   specification may reach the subject through several channels.
3. **A rendering layer already on the channel** — `sstim-ex:deliveryMedium` (27
   physical media) and `sstim-ex:perceivedModality` (12 modalities) held apart,
   plus `hasFrequencyHz` ("carrier or tone frequency"), `hasFlickerRateHz`,
   `hasBeatFrequencyHz` ("the difference frequency"), duty cycle, gain and phase.
   The exposure module already knows a carrier is not the delivered rate.
4. **`sstim:ControlTrack`** — *"a track that produces no sensory output of its own
   and instead supplies a time-varying control signal modulating parameters of
   other tracks."*

What is missing is what joins them.

**The signal has no identity.** A specification targeting 10 Hz through an audio
channel and a visual one states `hasBeatFrequencyHz 10` on one and
`hasFlickerRateHz 10` on the other. Nothing asserts these are *the same* 10 Hz. A
consumer must infer it by comparing decimals — so the comparability the
specification class exists to provide is exactly what goes unstated. Two
renderings of one design and two unrelated channels that happen to share a number
are indistinguishable in the graph.

**The modulation relation does not exist.** `ControlTrack`'s definition says it
modulates parameters of other tracks. No property says which track or which
parameter; the statement is prose the graph cannot make. Grepping the term index
for modulation properties returns only *neuro*modulation — the biological
sense — and technique concepts.

**`hasFrequencyHz` carries two roles**, being defined as "carrier or tone
frequency", so a 200 Hz audio carrier and a 10 Hz tactile vibration — a carrier
and a delivered rate — use one property for different things.

## Decision

### 1. Introduce the abstract signal as a first-class entity with an identity

`sstim:StimulationSignal`: a time-varying function with a frequency, period or
envelope and **no modality** — "10 Hz square", "a sinusoid whose period ramps
from 4 s to 8 s over ten minutes". An information content entity, like the
specification that references it.

A specification relates to its signals, and each channel declares which signal it
renders. That single indirection is the whole point: two channels pointing at one
signal *are* two renderings of one design, asserted rather than inferred from
matching decimals.

### 2. Renderings bind a signal to a channel's parameters

The channel keeps its existing rate properties; what is added is the statement
that a given rate *realises* a given signal, and by which mechanism. The rendering
is where modality-specific machinery lives, and where carrier and modulator
belong.

### 3. Carrier and modulator are a rendering, not the universal structure

A carrier exists because of a limitation of **hearing**, not because of anything
about the signal:

| Modality | 10 Hz presented how | Carrier needed? |
|---|---|---|
| Auditory | Amplitude-modulating an audible tone; two carriers a few Hz apart; two carriers summed acoustically | **Yes** — 10 Hz is below the audible range |
| Visual | A light flickering at 10 Hz | No |
| Tactile | A 10 Hz vibration, inside mechanoreceptor range | No |

Make carrier/modulator the top-level structure and every visual or tactile
stimulus must invent a fictitious carrier. That is the audio assumption returning
by a different door — the same error as `voices`, as four `waveform` fields, and
as `panOsc`, and the one [ADR 0051](0051-sstim-preset-contract.md) exists to
stop.

### 4. Renderings are marked physical or perceptual

Some renderings put a real modulation into the world: an isochronic tone, a
visual flicker. A **binaural beat does not** — no 10 Hz exists in either ear's
signal; the auditory system constructs it from two carriers. A monaural beat sits
between: the 10 Hz is present acoustically in the summed waveform.

This is not a detail. It governs what evidence transfers between renderings,
which is what the evidence model exists to keep honest — a finding about 10 Hz
visual flicker must not silently authorize a claim about 10 Hz binaural beats.
[ADR 0050](0050-public-claim-applicability-contract.md)'s modality clause already
refuses the coarse cross-modality case; this is the finer distinction underneath
it, and without it the gate cannot see the difference between two auditory
renderings that are not evidentially interchangeable.

### 5. An explicit modulation relation

A control source modulates a named parameter of a named target. This makes
`ControlTrack`'s definition something the graph can state, and it generalises:
any parameter may be modulated by any control source. The catalog's
"Martigli-synced" panning mode — a *fourth value of a position enum* meaning
"driven by the breathing oscillator" — is one instance of it, which is why
spatialization does not need a mechanism of its own.

## Consequences

- **`StimulusSpecification` starts doing its job.** Its definition already claims
  that two implementations whose output matches realise the same specification.
  Today nothing can express the match. This is the term that makes the claim
  true.
- **A preset kind becomes portable across senses.** ADR 0051 had to restrict
  `breathing-oscillation` and `symmetry-sequence` to auditory because their
  parameters describe both the oscillation and what it modulates. Separating the
  layers is what lets one kind be rendered visually without a parallel structure.
- **`hasFrequencyHz` needs splitting** into a carrier frequency and a delivered
  rate, or narrowing to one of them with the other named separately. Its current
  two-role definition cannot survive a model that distinguishes them. This is a
  change to a live property and wants a deprecation, not an edit.
- **Spatialization (directions §2) is subsumed.** Position becomes a parameter a
  signal can be rendered onto, and "Martigli-synced" becomes a modulation
  statement. No separate mechanism.
- **Sampled waveforms (directions §1) get a home.** A sampled waveform is a
  signal whose definition is an asset rather than a function, which is why it
  needs provenance and a checksum where a sine does not.
- Nothing here changes an existing triple's meaning; the additions sit beside the
  channel properties, which keeps the frozen-snapshot compatibility contract
  intact.
- The Patch Studio and catalog profiles are unaffected until they choose to
  reference a signal.

## Alternatives considered

**Carrier and modulator as the top-level model.** Rejected above: it makes the
standard audio-shaped by construction, and it is the specific error this
repository has corrected three times in other guises.

**Leave identity to matching numbers.** A consumer could compare
`hasBeatFrequencyHz` against `hasFlickerRateHz` and infer sameness. Rejected: it
is inference from a coincidence, it cannot distinguish "the same design rendered
twice" from "two channels that happen to share a rate", and it fails entirely
once a signal is an envelope rather than a single number.

**Model the signal only on the configuration side**, extending `ControlTrack`
rather than introducing a specification-level term. Rejected: a `ControlTrack`
belongs to one preset, so two studies could never share or compare a signal —
and comparability across implementations is the point.

**Defer until the Patch/Preset question (ADR 0040/0041) resolves.** Rejected: the
signal layer sits above both and is what the specification layer was always for.
If anything it clarifies that question rather than waiting on it.

## Questions resolved 2026-08-15

**Signal shape and the waveform vocabulary are one vocabulary.** A signal's shape
— sine, square, sawtooth, triangle, envelope, **noise**, sampled — is the same
controlled vocabulary the waveform work in [directions §1](../ontology/SSTIM_DIRECTIONS.md)
needs, seen from the other side. One vocabulary, used by a signal to say what
shape it has and by a rendering to say what shape reaches the subject. The
sampled case is what makes it more than an enum: a sampled signal's shape *is* an
asset, so it needs a source, a licence and a checksum where a sine needs none.

**A rendering is a class, `sstim:SignalRendering`.** Not a bare relation. SSTIM
already reifies a qualified relation whenever it has attributes of its own —
`sstim:EvidenceBasis`, `sstim:AssessmentScope`, `sstim:EvidenceReviewDecision`,
`sstim:EvidenceSearchRecord`, `sstim-eco:EcosystemRelationship`,
`sstim-eco:OrganizationMembership`, `sstim-eco:ImplementationResponsibility`,
`sstim-ex:BoundaryApplicabilityStatement`, `sstim-ex:KnowledgeStatusAssertion`.
A rendering carries at least three attributes — the mechanism, the
physical-versus-perceptual marker, and which channel parameter it drives — so a
relation would be the outlier here, and could not carry the marker that decision
4 makes load-bearing for evidence transfer.

**A signal declares its own frequency extent, and relates to a band by interval,
not by membership.** The first draft said "falls within". That is right for a
10 Hz tone and wrong for noise, which can span or wholly cover a band — and
band-limited noise is a real stimulus, not an edge case.

So a signal carries a lower and an upper bound, and its relation to a named band
is one of *within*, *covers*, or *overlaps*. A point signal is the degenerate
case where the two bounds are equal — exactly how `sstim-v:alpha10` and
`sstim-v:gamma40` are already modelled, each with `hzMin` equal to `hzMax`. The
ontology has been treating a point as a zero-width interval since before this
ADR; signals just make the pattern explicit.

This resolution and the first reinforce each other: **noise is a shape whose
extent is wide**. White noise is shape *noise* across the full audible range;
theta-band noise is the same shape bounded to 4–8 Hz. Neither needs a special
case, and neither can be described by a single frequency number.

## Open questions

- Whether `sstim:hzMin` / `sstim:hzMax` are widened by a union domain to cover
  signals as well as bands, or a signal gets its own pair. The bounds mean the
  same thing in both — the lower and upper edge of a frequency extent — which
  argues for the union domain, and matches how KR-05 resolved comparable
  mismatches. It is a domain widening on a live property, so it is additive but
  wants recording.
