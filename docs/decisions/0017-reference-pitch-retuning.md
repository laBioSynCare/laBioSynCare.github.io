# ADR 0017 — Reference-pitch retuning (432 Hz) modeling

**Status:** Accepted — 2026-06-30

## Context

432 Hz (and "Solfeggio" tunings) are a recurring request and a pseudoscience
magnet ("cosmic frequency", Verdi-tuning conspiracy, sound-healing marketing). The
`0.3.0` vocabulary could only file them under the mystical `techSolfeggioTuning`.
IMPROVEMENT_PLAN P5.3 originally proposed a bare `tuningReferenceHz` datatype
property. External review (2026-06) sharpened the problem:

- **432 Hz is a *carrier* (absolute-pitch) claim**, while SSTIM's entire evidence
  model — `FrequencyBand`, beat targeting, `EntrainmentBasedTechnique` — is about
  the *modulation/beat* frequency. These are orthogonal parameters. A
  carrier-tuning claim must not be allowed to touch the beat-frequency evidence.
- The evidence is weak but non-empty: a few small double-blind crossover pilots
  (e.g. ~4.79 bpm heart-rate reduction for 432 vs 440 Hz, n=33). Crucially, every
  one tested *full transposed music* (confounding tuning with overall
  pitch-lowering and tempo) and **none** tested a 432 Hz carrier under a
  binaural/isochronic beat — a modality/population mismatch under SSTIM's own
  tier-discount rules. At least one 2025 athlete study found 440 Hz more effective.

## Decision

Model 432/440 as **reference-pitch retuning**, disjoint from entrainment evidence.

- Add `sstim-v:techReferencePitchRetuning` (dual-typed `NonEntrainmentTechnique`,
  modality auditory, mechanism `mechAttentional`), with a `skos:scopeNote` stating
  the carrier-vs-modulation firewall and a `skos:editorialNote` making the explicit
  negative assertion. The honest evidence ceiling (tier 2–3, mixed/inconclusive,
  music-not-carrier confound) is recorded in `sstim:evidenceNotes`.
- Make `sstim-v:techSolfeggioTuning skos:broader sstim-v:techReferencePitchRetuning`
  — solfeggio is a specific folk-claim case of reference-pitch retuning. (It loses
  its `skos:hasTopConcept` status to the new broader concept.)
- Add carrier-pitch datatype properties on the exposure `StimulusChannel` (beside
  `hasFrequencyHz`/`hasBeatFrequencyHz`): `sstim-ex:referencePitchNote`,
  `referencePitchHz`, `retunedFromReferenceHz`, `pitchShiftCents`.

**The firewall (the point of this ADR):** reference-pitch lives on the carrier
channel and `NonEntrainmentTechnique`; any 432 Hz `EvidenceClaim` is kept disjoint
from `EntrainmentBasedTechnique`/`FrequencyBand` evidence. Public wording is capped
at "a warmer alternate tuning option" — never a healing/benefit claim. Musical-
interval / consonance terms are explicitly scoped out for now.

## Alternatives considered

- **A bare `tuningReferenceHz` datatype property** (original P5.3). Rejected: it
  invites attaching the value to a beat-targeting voice, collapsing the carrier/
  modulation distinction the firewall exists to protect.
- **Leave it only under `techSolfeggioTuning`.** Rejected: conflates a neutral
  tuning choice with a mystical claim, and gives no place to record the honest
  (weak) evidence separately.
- **An entrainment-style `EvidenceClaim` at the beat layer.** Rejected outright —
  that is exactly the cross-contamination the firewall prevents.
- **Carrier-pitch properties in `sstim-core`.** Put them in the exposure module
  instead, beside the other quantitative stimulus-channel properties, where carrier
  parameters already live.

## Consequences

- `TechniqueScheme` 29 → 30 concepts; solfeggio becomes narrower (top-concept list
  updated). `sstim-exposure` gains four carrier-pitch properties. `make validate`
  green; `TechniqueShape`/`ConceptIntegrityShape` satisfied by construction.
- The honest evidence posture is now machine-readable and quarantined; a future
  432 Hz `EvidenceClaim` (P5.4) must cite a venue-audited reference and stay on the
  carrier channel, never the beat layer.
- Versioning deferred to release (P5 → `0.5.0`).

## See also

- [ADR 0015](0015-visual-and-cross-modal-techniques.md) — the `editorialNote`
  negative-assertion pattern this reuses.
- [ADR 0010](0010-exposure-delivery-modality.md) — the exposure module the
  carrier-pitch properties extend.
- [`docs/ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P5.3;
  P7/ADR 0018 adds the citation requirement a future 432 Hz claim must satisfy.
