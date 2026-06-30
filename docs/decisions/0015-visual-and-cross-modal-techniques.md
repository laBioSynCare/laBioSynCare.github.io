# ADR 0015 — Visual and cross-modal technique vocabulary

**Status:** Accepted — 2026-06-30

## Context

The `0.3.0` `TechniqueScheme` is explicitly "auditory and cross-modal", with 24
concepts that are overwhelmingly auditory. BSC Lab's platform is audiovisual +
haptic, and the exposure module (ADR 0010/0011) already models visual flicker and
tactile delivery, yet the *technique* vocabulary has no first-class visual or
tactile entrainment concepts — visual driving appears only as the example string
"photic driving" and the `mechGamma40` note. This is the modality asymmetry named
in IMPROVEMENT_PLAN **P5 items 1–2**: a "sensory stimulation" vocabulary that is
really an auditory one misrepresents scope, and it blocks honest description of
the platform's own visual/haptic features.

The mechanism vocabulary has the same gap: it carries `mechASSR` (the auditory
steady-state response) but no visual or somatosensory counterpart, so visual and
tactile entrainment had no mechanism to cite — which `TechniqueShape` requires.

## Decision

Add visual, tactile, and genuinely cross-modal techniques as **dual-typed SKOS
concepts** in the existing `TechniqueScheme`, and complete the steady-state
evoked-potential mechanism family. **No new OWL classes or SHACL shapes** — the
additions reuse the existing `EntrainmentBasedTechnique` / `NonEntrainmentTechnique`
partition, the `SensoryModality` concepts (`visual`, `somatosensory`), and the
`techniqueModality` property. Minor, backward-compatible, additive release.

**Cross-modal = multiple `techniqueModality` values**, not a new "CrossModal"
class. This reuses the `techVibroacoustic` precedent (auditory + somatosensory)
and keeps the modality axis a property, orthogonal to the entrainment/non-
entrainment class partition.

New mechanism concepts (`StimulationMechanismScheme`):

- `mechSSVEP` — Steady-State Visual Evoked Potential (visual counterpart of ASSR;
  the correlate of photic driving).
- `mechSSSEP` — Steady-State Somatosensory Evoked Potential (tactile counterpart).
- `mechMultisensory` — Multisensory Integration (cross-modal enhancement; the
  basis the GENUS multisensory-over-unisensory finding rests on).

New technique concepts (`TechniqueScheme`):

- `techPhoticDriving` — periodic visual flicker / SSVEP driving (Entrainment).
- `techAudiovisualEntrainment` — light + sound pulsed together / AVE (Entrainment,
  auditory + visual).
- `techColorFieldStimulation` — steady/slow colour field (Non-Entrainment, visual)
  carrying an explicit **negative assertion** about "chromotherapy" via
  `skos:editorialNote`, mirroring `techSolfeggioTuning`.
- `techVibrotactileEntrainment` — rhythmic vibrotactile pulses / SSSEP driving
  (Entrainment, somatosensory), distinct from vibroacoustic.
- `techAudioTactile` — auditory + vibrotactile pulses in phase (Entrainment,
  auditory + somatosensory); the natural pairing for the BSC breathing/haptic pulse.

**Safety stays in the exposure layer.** Photic/flicker photosensitivity is not a
new caution tag on techniques; it is modeled with `sstim-ex:hasFlickerRateHz` +
`sstim-ex:boundaryPhotosensitivity` (ADR 0011) and flagged in `skos:scopeNote`.

**Wellness framing.** Each definition states the steady-state response as a
*measurable response*, not a guaranteed outcome; downstream effects are framed
conservatively (SCOPE.md). The 40 Hz visual / GENUS case is marked contested.

## Alternatives considered

- **New `VisualTechnique` / `CrossModalTechnique` OWL subclasses.** Rejected:
  modality is already a property (`techniqueModality`); a class axis would
  collide with the disjoint Entrainment/Non-Entrainment partition (a technique
  cannot be cleanly in two disjoint class trees) and duplicate information.
- **Separate `techSSVEP` and `techPhoticDriving`.** Merged: photic driving *is*
  the stimulus that evokes the SSVEP; one technique, mechanism cited separately.
- **Reuse `mechGamma40` for all visual driving.** Rejected: gamma-40 carries the
  specific neuroimmune hypothesis; general photic driving cites `mechSSVEP`, with
  `mechGamma40` added only where 40 Hz is the point.
- **A single "tactile" technique.** Split into entrainment (`techVibrotactile-
  Entrainment`, pulse-rate driver) vs the existing `techVibroacoustic`
  (low-frequency audio energy felt on the body) — different drivers and percepts.

## Consequences

- `StimulationMechanismScheme` grows 13 → 16 concepts; `TechniqueScheme` 24 → 29.
  Both schemes' `skos:hasTopConcept` lists are extended (navigability preserved).
- `TechniqueShape`, `ConceptIntegrityShape`, `ConceptSchemeShape` are satisfied by
  construction (every new concept has mechanism + temporal + modality + `inScheme`
  + `@en` prefLabel + `notation`); `make validate` stays green. No shape edits.
- The knowledge browser surfaces these from RDF dynamically (no `namespaces.js`
  change); the visual/tactile gap that made SSTIM look auditory-only is closed.
- Version bump deferred to the maintainer at release time (P5 targets `0.5.0`).
- P5 item 3 (neutral tuning vocabulary) and item 4 (populated evidence claims)
  remain open and are not addressed here.

## See also

- [ADR 0006](0006-one-class-per-technique.md) — one class per technique.
- [ADR 0010](0010-exposure-delivery-modality.md) / [ADR 0011](0011-sensory-field-and-flash-safety.md) — exposure, modality, and flicker safety.
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P5 items 1–2.
- [`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](../ontology/PUBLICATION_AND_INTERLINKING_PLAN.md) — Part A.
