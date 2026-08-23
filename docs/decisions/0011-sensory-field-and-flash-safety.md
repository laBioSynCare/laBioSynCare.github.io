# ADR 0011 — Sensory Field interface, runtime flash-rate safety, and exposure ontology 0.4.0

**Status:** Accepted — 2026-06-18 · the separate-interface/runtime choice is
superseded by [ADR 0046](0046-one-studio-two-authoring-modes.md); the safety and
exposure decisions remain accepted

## Context

After [ADR 0010](0010-exposure-delivery-modality.md) the exposure module
(`sstim-ex:`) was *ahead* of the implementation: it defined media, modalities,
capabilities, body placements, and comfort boundaries with no deliverable behind
them. Three concrete gaps:

1. There was no minimal "instrument" letting a user directly experience a
   sensory stimulus and have it described as a real `sstim-ex:ExposureProfile`.
   The Patch Studio is a rich multi-track authoring tool, not a first rung.
2. Visual safety was a single global boolean (`visualStimulationOn`); the
   per-track flash-rate cap was documented as planned but unbuilt
   ([PHOTOSENSITIVITY_SAFETY.md](../technical/PHOTOSENSITIVITY_SAFETY.md) §4).
3. The exposure vocabulary could not express per-ear / per-eye laterality, any
   quantitative stimulus value (frequency, flicker rate, beat, duty, gain), or a
   quantified safety limit. The `mediumUltravioletRadiation` definition even
   promised "explicit optical-safety boundaries" that did not exist.

## Decision

**A new Sensory Field interface** at route `/field/`
([src/ui/field/](../../src/ui/field/)) — a small instrument that delivers a
full-screen colour field plus an independent per-ear tone/noise, optionally
blinking (visual) and beating (monaural/binaural). It builds vertically in two
steps: Step 1 is the static (0 Hz) case, Step 2 adds the time axis. Every
configuration serialises to an `sstim-ex:ExposureProfile`
([exposureProfile.js](../../src/ui/field/exposureProfile.js)). Spec:
[SENSORY_FIELD.md](../technical/SENSORY_FIELD.md).

**A runtime flash-rate safety gate** ([flashSafety.js](../../src/ui/safety/flashSafety.js)):
the general-safe ceiling is 3 Hz (WCAG 2.3.1; Harding / ITU-R BT.1702), with the
highest-risk band ≈ 15–25 Hz. Flashing is capped at 3 Hz unless the user makes an
explicit, **per-session** acknowledgement. This complements — does not replace —
the global on/off policy in [visualSafety.js](../../src/ui/safety/visualSafety.js).

**Exposure ontology module 0.4.0** adds:
- left/right laterality placements (`placementEarLeft/Right`,
  `placementEyeLeft/Right`) as `skos:broader` children of the bilateral parents;
- quantitative datatype properties (`hasFrequencyHz`, `hasFlickerRateHz`,
  `hasBeatFrequencyHz`, `hasDutyCycle`, `hasGainLevel`, `hasPhaseOffset`);
- a `sstim-ex:ExposureLimit` class with quantified optical/flicker/hearing limits
  citing external standards (WCAG, ITU-R, NIOSH, IEC 62471 / ICNIRP), linked from
  comfort boundaries via `hasExposureLimit`;
- `affordsDeliveryMedium` (capability → medium), fixing the IR/UV lexical-only
  pairing; and missing IR/UV capability definitions.
- The `mediumUltravioletRadiation` definition is corrected to reference the new
  `boundaryOpticalRadiation` rather than promise an absent boundary.

The runtime flicker threshold (3 Hz) is modelled as
`sstim-ex:limitFlickerWcag`, so the UI gate and the ontology agree.

## Alternatives considered

- **Extend the Patch Studio instead of a new route.** Rejected. The Patch Studio
  is a high-altitude authoring tool with its own model (`patch-studio-model-1`);
  the Sensory Field is a deliberately minimal instrument with a different audience
  and a clean per-channel→`ExposureProfile` mapping.
- **Keep the global on/off boolean as the only visual safety.** Rejected. A
  user-chosen flash rate is exactly the photosensitive-epilepsy risk; it needs a
  rate-aware gate.
- **Enforce "UV/IR channel must declare an optical boundary" at SHACL
  `sh:Violation`.** Rejected for now. `make validate` concatenates *all* committed
  instances, and pre-0.4.0 instances (e.g. `ideal-tactile-immersion.ttl`) use
  UV/IR without the new boundary; a Violation-level shape would retroactively fail
  validation, and editing those committed instances was out of scope. The new
  SHACL shapes are therefore scoped narrowly to the new terms; the conditional
  cross-cutting check is tracked as future work in
  [IMPROVEMENT_PLAN.md](../ontology/IMPROVEMENT_PLAN.md). Runtime enforcement
  (flashSafety.js) is the hard gate.
- **Persist a "always allow flashing above 3 Hz" default in Settings.** Rejected.
  A saved bypass undermines the point of re-confirmation; the acknowledgement is
  intentionally per-session and never persisted.

## Consequences

- BSC Lab has a first deliverable sensory instrument, and the exposure ontology's
  safety and laterality vocabulary is now exercised by real, validated data
  (`static/ontology/instances/experiments/sensory-field-example.ttl`).
- The flicker limit is enforced in one place (flashSafety.js) and cited in one
  place in the ontology (`limitFlickerWcag`); they cannot silently diverge.
- Visual eye-laterality (true dichoptic per-eye delivery) is modelled but not yet
  delivered — it needs the Step 3 stereoscopic rendering path. The laterality
  placements added here are what Step 3 will use.
- Future SHACL work can add the conditional UV/IR → optical-boundary check once
  pre-0.4.0 instances are reconciled or SHACL-SPARQL is adopted.

## See also

- [SENSORY_FIELD.md](../technical/SENSORY_FIELD.md) — interface spec and the
  Step 3 stereoscopy outline.
- [PHOTOSENSITIVITY_SAFETY.md](../technical/PHOTOSENSITIVITY_SAFETY.md) — the
  visual-safety layer this extends.
- [ADR 0010](0010-exposure-delivery-modality.md) — the exposure model this builds on.
- [ADR 0009](0009-pwa.md) — prior visual/session safety constraints.
