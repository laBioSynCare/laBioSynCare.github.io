# ADR 0019 — Modality nomenclature cleanup (somatosensory / haptic / tactile / vibrotactile)

**Status:** Accepted — 2026-07-07

## Context

SSTIM carries three families of `modality*` concepts that had drifted apart, the
gap tracked as IMPROVEMENT_PLAN **P5.5** and independently re-derived by
[`SENSORY_TAXONOMY_REVIEW.md`](../ontology/SENSORY_TAXONOMY_REVIEW.md):

1. `sstim-v:modality*` in `SensoryModalityScheme` — the perceptual **channel**
   vocabulary techniques cite via `sstim:techniqueModality` (6 concepts).
2. `sstim-v:modality*` in `EvidenceModalityScheme` — **evidence-provenance** tags
   (`AUD`, `VIS`, `TACTILE`, `MULTISENSORY`, `BREATH`, …) (9 concepts).
3. `sstim-ex:modality*` in `PerceivedModalityScheme` — the **perceived** modality
   of an exposure profile (12 concepts).

Two concrete problems:

- **`modalitySomatosensory` conflated two ideas.** Its `skos:prefLabel` was
  "Somatosensory / Haptic" and its only note described the *Web Vibration API*
  (an actuator) — mixing the perceived body-sense **channel** with the **device**
  path. "Haptic" is a delivery mechanism/actuator, not a percept, so it did not
  belong in a perceived-channel label.
- **The two channel schemes had only a partial bridge.** The exposure module
  already declared `skos:closeMatch` from `sstim-ex:modalityAuditory`/`Visual` to
  their `sstim-v:` counterparts, but the other four shared channels
  (somatosensory, interoceptive, vestibular, olfactory) had no cross-link, so a
  consumer could not reliably traverse between the perceived-modality and
  sensory-channel vocabularies.

Two further problems are **real but breaking**, so they are recorded here and
deferred rather than fixed (see "Deferred"):

- the `sstim-v:modality*` local-name stem is overloaded across the channel and
  evidence-tag schemes;
- "auditory" (and each shared channel) exists as two individuals of two different
  OWL classes (`sstim:SensoryModality` vs `sstim-ex:PerceivedModality`).

## Decision

Adopt one naming convention across the ontology and apply it additively (no term
IRI, `skos:notation`, class membership, or `skos:topConcept` was renamed or
removed — this is a minor-version, backward-compatible change):

> **haptic = device / actuator · tactile = percept · somatosensory =
> superordinate body-sense channel · vibrotactile = mechanism.**

Concretely:

1. **`sstim-v:modalitySomatosensory`** — `skos:prefLabel` narrowed from
   "Somatosensory / Haptic" to "Somatosensory" (all four languages); added a
   `skos:definition` stating the superordinate-channel role and the
   percept/device/mechanism split; rewrote the `skos:scopeNote` so the Web
   Vibration API is named as the *haptic actuator path*, deferring device /
   perceived-modality / mechanism separation to the exposure module (ADR 0010).
   `rdfs:seeAlso` this ADR.
2. **Complete the cross-scheme bridge.** Added the four missing
   `skos:closeMatch` links (`sstim-ex:modalitySomatosensory`/`Interoceptive`/
   `Vestibular`/`Olfactory` → their `sstim-v:` counterparts), matching the
   existing auditory/visual precedent. `closeMatch` (not `exactMatch`) because the
   two are related-but-distinct: one is a delivery **channel**, the other a
   **perceived** modality.
3. **Document tactile ⊂ somatosensory in prose, not hierarchy.** Added scope notes
   to `sstim-ex:modalityTactile` and `sstim-ex:modalitySomatosensory` recording
   that the tactile percept is a sub-modality of the somatosensory channel. A
   `skos:broader` edge was **not** added, because that would require removing
   `tactile`'s `skos:topConceptOf` status — a non-additive change reserved for a
   major bump.
4. **Erratum:** `sstim:EvidenceModalityTag`'s definition string enumerated six
   values; the scheme has carried nine since P5.6 (VIS, TACTILE, MULTISENSORY
   added). Updated the string to list all nine.

## Alternatives considered

- **Merge the two channel vocabularies into one** (`sstim:SensoryModality`).
  Rejected now: deprecating one class's individuals in favour of the other's is a
  breaking, DL-affecting change. Reserved for a major bump; the `closeMatch`
  bridge is the additive interim.
- **Rename the evidence-tag stem** (`modalityAUD` → `evTagAUD`) to end the
  `sstim-v:modality*` overload. Rejected now: renaming a term IRI breaks external
  consumers. Reserved for a major bump.
- **Add `tactile`, `proprioceptive`, `gustatory` to `SensoryModalityScheme`** so
  the two schemes match member-for-member. Deferred: whether the canonical channel
  list should be comprehensive (including non-deliverable channels) is a separate
  vocabulary decision — see the review doc §5/§8 — not required to fix the
  nomenclature conflation.
- **Encode the hierarchy with `skos:broader`.** Deferred (see Decision 3):
  non-additive under the P5 minor-version constraint.

## Consequences

- `make validate PYSHACL='python3 -m pyshacl'` stays green (SHACL conforms on
  core/vocab/exposure/instances; all exposure SPARQL sanity checks pass).
- The perceived-modality ↔ sensory-channel bridge is complete for all six shared
  channels; consumers can traverse it uniformly.
- The somatosensory/haptic/tactile/vibrotactile terms now read consistently across
  `sstim-v:` and `sstim-ex:`, closing the P5.5 label conflation.
- No version number was bumped (deferred to the maintainer at release time, per
  the ADR 0015 precedent); P5's `0.5.0` target is unaffected.
- Two breaking harmonizations (stem rename, channel-class unification) remain
  open and are now explicitly scoped to a future major-version ADR.

## See also

- [`../ontology/SENSORY_TAXONOMY_REVIEW.md`](../ontology/SENSORY_TAXONOMY_REVIEW.md) — the analysis that motivated this cleanup.
- [ADR 0010](0010-exposure-delivery-modality.md) — delivery vs perceived modality vs device capability, the separation this convention rests on.
- [ADR 0015](0015-visual-and-cross-modal-techniques.md) — modality as a property; the `vibroacoustic`/`vibrotactile` distinction.
- [ADR 0002](0002-dual-typing-owl-skos.md) — dual-typed SKOS concepts (the pattern these terms follow).
- [`../ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — P5.5.
