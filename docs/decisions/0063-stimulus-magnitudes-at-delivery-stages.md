# ADR 0063: A level says where in the delivery chain it holds

**Status:** Accepted · 2026-10-13 · decided under the maintainer's delegation
in session ("do it all, I trust your decisions"), with explicit permission to
edit the RDF sources; implemented on the 0.20.0 development line

## Context

Encoding nine published protocols ([ADR 0064](0064-published-protocols-schedules-arms-and-control-laws.md))
needed levels for sound and light, and SSTIM could not state them honestly.

It had two kinds of level and nothing between them. `sstim:masterVolume`,
`sstim:masterBrightness` and `sstim-ex:hasGainLevel` are engine settings, 0 to
1, meaningful only on the hardware that defines 1.
`sstim:soundPressureLevelDb` and `sstim:luminanceCdM2` are calibrated
quantities at the subject. [ADR 0042](0042-stimulus-specification.md) chose the
second for stimulus specifications, rightly: "65 dB SPL at the ear" is
reproducible on an engine nobody has built, "gain 0.5" is not.

The papers fit neither. Martorell et al. (2019) deliver tones "at 60 dB" to mice
moving freely under a speaker; Chan et al. (2022) report 68 dB without saying
where it was measured. Writing either as `soundPressureLevelDb 60` asserts a
level at the ear the paper never states. Chan also reports 390 to 400 lux "at the
participant's eyes", and SSTIM had no illuminance at all. Iaccarino et al.
(2016) give "60 W" for an LED bulb, which could be electrical draw or an
incandescent-equivalent rating. Beyond these papers, the field doses most of
what SSTIM already names in quantities it cannot write: transcranial current in
milliamperes, magnetic stimulation as a percentage of the subject's own motor
threshold, vibration as displacement at the skin, thermal stimulation in
degrees.

The maintainer's framing of the problem was the right one: a level may be one
inside the system, one emitted by the source, or one received by the subject,
and anything else. A single number with a fixed meaning per property cannot say
which.

## Decision

**1. One qualified node per stated magnitude.** `sstim:StimulusMagnitude` (in
Common, so Core Plus carries it) is attached to a channel with
`sstim:hasMagnitude`, and states:

- `sstim:magnitudeQuantity`: what it measures, a `sstim:QuantityKind`;
- `sstim:magnitudeValue`, or `sstim:magnitudeMinimum` and `sstim:magnitudeMaximum`
  for a stated range;
- `sstim:magnitudeUnit`, a `sstim:MeasurementUnit`;
- `sstim:deliveryStage`, where in the chain it holds;
- `sstim:valueBasis`, how it is known;
- optionally `sstim:relativeToParticipantMeasure`, `sstim:measurementDistanceMetres`
  and `sstim:reportedAs`.

A channel has as many as it needs, so one tone can carry its configured gain,
its output at 1 m and its level at the ear side by side.

**2. Seven delivery stages.** Configured in the system; emitted at the source;
at the subject (the receptor surface: ear, eye, skin); at a target inside the
body (usually modelled); relative to the subject's own measure; as perceived;
and **not stated**. The last is a value, not a gap: a record says either where a
value holds or that its source did not say. Assigning a stage the source did not
give is the error this design exists to prevent.

**3. Four bases.** Specified (a design value), measured, reported by a source,
modelled. A reported value must keep the source's words verbatim in
`sstim:reportedAs`, so the structured reading can always be checked against
what was said.

**4. Subject-relative values name their reference.** A level in decibels above
the subject's hearing threshold, or a stimulator output as a percentage of their
resting motor threshold, is stated with the stage `subject-relative` and a
`sstim:ParticipantReference`: hearing threshold, detection threshold, pain
threshold, resting motor threshold, most comfortable level, baseline cadence,
individual alpha frequency. A SHACL constraint requires the reference exactly
when the stage is subject-relative. This is what "a value set per participant"
means in a design, and it now has a form.

**5. SSTIM's own small unit and quantity vocabularies, each quantity listing
its units.** Eighteen quantity kinds across modalities and stages (sound
pressure, hearing and loudness level; illuminance, luminance, irradiance,
luminous flux, melanopic EDI; power; vibration acceleration and displacement;
current, current density, electric field; temperature; relative output; level
and ratio to a reference) and nineteen units, among them the calendar units the
schedules of ADR 0064 need. `sstim:quantityUnit` lists the units a quantity may
be stated in, and a SHACL constraint rejects any other, so sound pressure cannot
be stated in lux.

**6. The existing properties keep their meanings.** `soundPressureLevelDb` is a
sound pressure level at the subject and `luminanceCdM2` the source's luminance
as seen from the subject; `masterVolume`, `masterBrightness` and `hasGainLevel`
are configured values. Each is a shortcut for one fixed reading of the new
model and stays valid. No triple of theirs changed.

## Consequences

- The four reported levels of the published protocols are encodable without
  overstatement: three at the unstated stage with the paper's words, and Chan's
  illuminance as a range at the subject.
- The neuromodulation techniques SSTIM names can now be dosed in their own
  units, which was the larger gap.
- SHACL rules cover the layer, and `make protocol-layer` breaks each one with
  its own fixture: value or range, range order, unit membership, the
  subject-relative pairing, reported wording, and a quantity that lists no unit.
- **Deferred: QUDT.** The quantity and unit concepts are natural `closeMatch`
  targets for QUDT. ADR 0057 forbids a mapping the alignment gate cannot
  dereference at its minting authority, and `make alignment-verify` does not
  resolve QUDT yet. The mappings wait for that, rather than being asserted
  unchecked.
- **Deferred: frequency weighting and averaging.** A-, C- and Z-weighting, peak
  against RMS against equivalent continuous level, and dose over time
  (Leq, lux-hours) are real qualifiers that none of the nine protocols states.
  They are the next additions if a protocol needs them, not before.
- **Not done: converting.** A course in months is not turned into days, and a
  quantity in an unstated stage is not promoted to at-subject because that is
  the likely reading. Exact unit conversions (feet to metres) are made and said.

## Alternatives considered

- **More single-purpose properties** (`illuminanceLux`, `currentMilliampere`,
  `percentMotorThreshold`, each per stage). Rejected: quantity times stage times
  basis is a product, and properties multiply where a qualified node does not.
- **Import QUDT, or SOSA/SSN observations.** SOSA is the right home for an actual
  measurement act and remains open for session data; for a design or a reported
  value it would add an observation that never happened. QUDT is deferred for
  the verification reason above, not rejected.
- **Record unstated levels as at-subject.** Rejected as the overstatement this
  ADR exists to stop.
