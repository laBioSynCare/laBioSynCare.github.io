# ADR 0012 — Where Martigli voice parameters live in RDF

**Status:** Proposed — 2026-06-20

## Context

The four voice subtypes (`Binaural`, `Martigli`, `Martigli-Binaural`,
`Symmetry`) each need a SHACL shape that validates their parameters
(IMPROVEMENT_PLAN P1 item 2). Two of the four already have one:

- `BinauralVoiceShape` requires `sstim:carrierFreqLeft`,
  `sstim:carrierFreqRight`, `sstim:initialVolume`.
- `SymmetryVoiceShape` requires `sstim:baseFrequency`, `sstim:noteCount`,
  `sstim:octaveSpan`, `sstim:cycleDuration`, `sstim:permutationFunction`.

Those parameter properties are defined in `sstim-patch-studio.ttl` and reused by
the catalog voice instances. **The Martigli and Martigli-Binaural voices have no
equivalent RDF property home for their intrinsic parameters**, so their shapes
cannot be written. This blocks P1 item 2.

The JSON preset format (`docs/technical/PRESET_FORMAT.md`) defines these
per-voice parameters:

| JSON field | Meaning | Martigli | Martigli-Binaural |
|---|---|---|---|
| `mf0` | center frequency of oscillation (80–400 Hz) | required | — (uses `fl`/`fr`) |
| `fl` / `fr` | carrier pair (80–1000 Hz) | — | required |
| `ma` | oscillation amplitude (1–400 Hz) | required | required |
| `mp0` | initial breathing-cycle duration (0.1–120 s; ≥ 3 s if `isOn`) | required | required |
| `mp1` | final breathing-cycle duration (0.1–240 s) | required | required |
| `md` | transition time `mp0`→`mp1` (0.1–3600 s) | required | required |
| `isOn` | this voice is the breathing reference (≤ 1 per preset) | required | required |

The only breathing-related RDF properties that exist today are **not** these:

- `sstim:breathingPeriodInitial` / `breathingPeriodFinal` /
  `breathingTransitionDuration` — declared with `rdfs:domain
  sstim:SessionSpecification`. Their definitions describe a **session-time
  override** of the breathing-reference voice (`breathingPeriodInitial` is
  literally defined as *"User override for mp0… Absent means use preset
  default"*), not the voice's authored parameters.
- `sstim:breathingAmplitude` / `breathingPhaseRatio` (patch-studio) — generic
  breathing-shape controls, not the Martigli deceleration arc.

There are currently **zero Martigli or Martigli-Binaural instances** in the
repository, so nothing constrains the choice yet — but the existing
`SessionSpecification` domains create a real tension: reusing those properties on
a voice would contradict their declared domain and, under OWL domain semantics,
infer the voice to also be a `SessionSpecification`.

The question this ADR resolves: **where do the per-voice Martigli parameters
live, so that `MartigliVoiceShape` and `MartigliBinauralVoiceShape` can require
them?**

## Decision (proposed)

**Option A — dedicated voice-level Martigli properties, shared via a parameter
group.** Define new datatype properties for the Martigli oscillation arc and
attach them to the voice, keeping the session-level `breathingPeriod*` overrides
as a distinct concept.

Proposed terms (final placement — `sstim-patch-studio.ttl` alongside the other
voice params, or `sstim-core.ttl` — decided at implementation time):

| Property | Domain | Range | JSON field |
|---|---|---|---|
| `sstim:martigliCenterFreq` | `MartigliVoice` | xsd:decimal | `mf0` |
| `sstim:martigliAmplitude` | `MartigliVoice` ∪ `MartigliBinauralVoice` | xsd:decimal | `ma` |
| `sstim:martigliPeriodInitial` | `MartigliVoice` ∪ `MartigliBinauralVoice` | xsd:decimal | `mp0` |
| `sstim:martigliPeriodFinal` | `MartigliVoice` ∪ `MartigliBinauralVoice` | xsd:decimal | `mp1` |
| `sstim:martigliTransitionDuration` | `MartigliVoice` ∪ `MartigliBinauralVoice` | xsd:decimal | `md` |
| `sstim:isBreathReference` | `Voice` | xsd:boolean | `isOn` |

`Martigli-Binaural` reuses the existing `sstim:carrierFreqLeft` /
`sstim:carrierFreqRight` (per ADR 0005) for `fl`/`fr` and the shared
`martigli*` arc properties; it does **not** use `martigliCenterFreq`.

This matches the precedent set by `Binaural` and `Symmetry` (each voice owns its
parameters), keeps every domain correct, and leaves the session-level
`breathingPeriod*` properties intact as overrides — a different concept from a
voice's authored arc.

Once the terms exist, the shapes are mechanical:

- `MartigliVoiceShape`: require `martigliCenterFreq` (80–400), `martigliAmplitude`
  (1–400), `martigliPeriodInitial` (0.1–120), `martigliPeriodFinal` (0.1–240),
  `martigliTransitionDuration` (0.1–3600), `isBreathReference` (boolean);
  forbid `carrierFreqLeft`/`carrierFreqRight`.
- `MartigliBinauralVoiceShape`: require `carrierFreqLeft`, `carrierFreqRight`,
  `martigliAmplitude`, the period trio, `isBreathReference`; forbid
  `martigliCenterFreq`.
- The CLAUDE.md §4.5 breathing constraint (`mp0 ≥ 3` when `isOn`, ≤ 1 breathing
  reference per preset) becomes SHACL-checkable for the first time.

## Alternatives considered

- **Option B — widen `breathingPeriod*` to also apply to voices.** Generalize the
  domain of `breathingPeriodInitial`/`Final`/`TransitionDuration` from
  `SessionSpecification` to a union including the Martigli voices, and add only the
  non-overlapping params (`mf0`, `ma`, `isOn`). *Rejected:* it overloads one
  property for two semantically distinct roles — the voice's authored arc versus a
  session-time override — whose definitions already differ. Queries could no longer
  tell whether a `breathingPeriodInitial` value is an authored parameter or a user
  override, and widening the domain weakens the model. This is exactly the kind of
  conflation ADR 0005's "keep distinct concepts distinct" principle warns against.

- **Option C — do not model Martigli parameters in RDF.** Keep `MartigliVoice` /
  `MartigliBinauralVoice` as label-only classes (like the minimal framework
  shapes) and validate parameter ranges only in the planned
  `schemas/preset.schema.json`, not SHACL. *Rejected:* it leaves P1 item 2
  permanently unmet and is asymmetric with `Binaural`/`Symmetry`, which carry full
  RDF parameter shapes; catalog and reference instances could not express Martigli
  parameters at all. Defensible only if the project decides RDF is a label-level
  catalog and JSON-schema owns all parameter validation — which contradicts the
  existing binaural/symmetry shapes.

## Consequences

- **New ontology terms.** Option A adds six datatype properties. Placement
  (`sstim-patch-studio.ttl` vs `sstim-core.ttl`) and final names are an
  implementation detail to settle when the terms are added; `sstim-patch-studio.ttl`
  is consistent with where `carrierFreqLeft`/`baseFrequency`/etc. already live.
- **Protected-file change.** Adding properties touches a CLAUDE.md §3.4 protected
  file and requires explicit maintainer instruction plus scientific review. This
  ADR proposes the model; it does not enact it.
- **Unblocks P1 item 2.** With the terms in place, `MartigliVoiceShape` and
  `MartigliBinauralVoiceShape` are straightforward and the §4.5 breathing
  constraints become validatable.
- **No instances exist yet**, so the additive terms cannot retroactively break
  `make validate`; a seed Martigli/MB reference instance should be added in the
  same change so the new shapes are actually exercised (the lesson from the
  framework/implementation shapes, which only became meaningful once real
  instances existed).

## See also

- [ADR 0005](0005-binaural-carrier-pair-only.md) — carrier-pair parameterization
  reused for the Martigli-Binaural `fl`/`fr`.
- [ADR 0006](0006-one-class-per-technique.md) — voice classes named `*Voice`.
- [`docs/technical/PRESET_FORMAT.md`](../technical/PRESET_FORMAT.md) — the JSON
  Martigli / Martigli-Binaural field tables.
- [`docs/technical/BREATHING_MODEL.md`](../technical/BREATHING_MODEL.md) —
  the breathing arc specification (defensive publication).
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P1 item
  2, which this ADR unblocks.
