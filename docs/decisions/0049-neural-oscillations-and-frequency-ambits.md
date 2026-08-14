# ADR 0049 — Neural oscillations and frequency ambits

**Status:** Proposed — 2026-08-14

## Context

The [2026-07-13 audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
raised KR-08 as two complaints: frequency-band scope notes carry unqualified
outcome prose, and *"the same scheme is used both for observed neural
oscillation categories and for stimulus modulation/beat targets."*

The first complaint is correct. The second is not, and diagnosing it correctly
changes the repair.

`sstim:FrequencyBand` already defines itself as *"an information entity
describing a named Hz range."* That is a frequency ambit and nothing more. The
scheme holds `sstim-v:alpha10` and `sstim-v:gamma40` alongside `sstim-v:alpha` —
nobody would call 10 Hz an observed neural oscillation, which is the clearest
evidence that the scheme is ambits throughout. Two different relations point at
it: `sstim:targetsFrequencyBand` makes a band a stimulus target in a particular
configuration, and nothing makes a band an oscillation. A band does not change
identity by being aimed at.

So the scheme was never conflated. What is missing is the **neural oscillation
itself**. SSTIM has no term for the alpha rhythm as a phenomenon, so everything
true of the rhythm — the states it accompanies, the fact that it modulates and
does not sit at an exact frequency, its boundaries being conventional — was
parked on the band's scope note, which is the wrong subject. `sstim:NeuralPhenomenon`
exists but categorises *kinds* of phenomena (oscillatory dynamics, excitability),
not the named rhythms.

An oscillation is classified as alpha by characteristics that include, but are
not exhausted by, the frequencies composing it falling inside a conventional
ambit. The ambit is a measurement convention; the rhythm is a thing in a head.

## Decision

### 1. Frequency bands keep their IRIs, and their definition is already right

`sstim-v:alpha` and its sixteen siblings remain `sstim:FrequencyBand` — a named
Hz range with `hzMin`/`hzMax`. **No renaming.** They are referenced by both
committed seed presets, by `targetsFrequencyBand` and `primaryFrequencyBand`,
and are frozen in thirteen published snapshots; renaming them to something like
`alphaFrequencyAmbit` would break every consumer to gain a clearer label on a
class whose definition already says "named Hz range".

Their scope notes lose the outcome prose (§4). Sub-band scope notes ("Lower
portion of the delta band") are already pure ambit language and are untouched.

### 2. A new controlled category for the rhythms

`sstim:NeuralOscillationType`, with instances
`sstim-v:deltaOscillation`, `thetaOscillation`, `alphaOscillation`,
`smrOscillation`, `betaOscillation`, `gammaOscillation`, each dual-typed
`skos:Concept` + the category class, as every other SSTIM controlled value is.

**Not an OWL class of processes**, and this is the substantive modelling choice.
A `sstim:AlphaOscillation ⊑ bfo:0000015` class would let a future dataset assert
`ex:segment-14 a sstim:AlphaOscillation` about an actual measured event. SSTIM
has no measured neural data and no model for it: the session record captures
what a participant said, not what their cortex did. Minting process classes for
instances that cannot yet exist is the speculative term growth this plan exists
to resist.

The controlled category buys three things immediately. It is the pattern the
whole vocabulary already uses, so the quality audit's concept requirements —
scheme membership, notation, one English prefLabel, a definition — apply for
free. It carries the descriptive data (§3) as annotations without inventing a
measurement model. And SKOS mapping properties are defined between concepts,
which is what makes §5's Wikidata question answerable at all; `owl:equivalentClass`
to a Wikidata item would be a category error, since Wikidata items are not OWL
classes.

If measured neural data ever enters SSTIM, a process class can be added then and
linked to the concept. Nothing here forecloses it.

### 3. What the oscillation carries

- `sstim:hasTypicalFrequencyBand` (oscillation → band) — the conventional ambit
- `sstim:extendedHzMin` / `sstim:extendedHzMax` — the wider range the rhythm is
  reported to occupy, because a rhythm modulates and its edges are conventional
  rather than sharp. Recording only the typical ambit would reassert the
  precision this ADR exists to deny.
- `skos:altLabel` — "alpha rhythm", "alpha waves". **No separate rhythm concept.**
  "Rhythm", "wave" and "oscillation" are near-synonyms in the literature, and
  Wikidata itself mixes them ("alpha wave", "theta rhythm"). Minting
  `alphaNeuralRhythm` beside `alphaOscillation` would require a defensible
  difference in meaning that does not exist. As alternate labels they also begin
  closing the `skos:altLabel` gap, where the vocabulary currently has none.
- Associated states — only as §4 allows.

### 4. Associations become evidence claims or they leave

The six primary bands currently assert, unqualified and unsourced:

| Band | Scope-note prose |
|---|---|
| delta | "Deep sleep, heavy down-regulation" |
| theta | "Meditation, creativity, memory, sleep onset, chronic pain support" |
| alpha | "Relaxation, stress reduction, calm alertness" |
| smr | "Focused calm, sustained attention" |
| beta | "Active cognition, alertness" |
| gamma | "Higher-frequency cognitive activation" |

Each association is dispositioned individually as exactly one of:

- **an `sstim:EvidenceAssessmentClaim`** whose `evaluatesSubject` is the
  *oscillation*, carrying tier, direction, population, modality and a citation —
  the machinery already used for techniques; or
- **dropped from the ontology**, remaining in framework documentation as design
  rationale where it belongs.

Moving the prose from the band's scope note to the oscillation's scope note is
explicitly **not** an option. That would relocate an unqualified claim to a
better subject and leave KR-08's first complaint untouched.

"Chronic pain support" is called out as the item requiring the most care: it is
the closest to a clinical claim in the vocabulary, and `SCOPE.md`'s constraints
apply to it more strictly than to "relaxation".

### 5. Wikidata mappings move, and `exactMatch` is earned per item

The five band mappings move from the band to the oscillation, where the Wikidata
items actually point: Q2469782 is "alpha wave", a neurophysiological phenomenon,
not a Hz interval.

Whether each becomes `exactMatch` is decided per item by the extension/intension
test KR-09's disposition requires, not by label similarity. The items are not uniform — "alpha wave" and "theta
rhythm" are named differently and may scope differently — so some are expected
to stay `closeMatch`. The mapping-provenance annotations added for KR-09 record
the outcome either way, and five of them currently name this ADR as the
precondition for revisiting.

The band keeps no Wikidata mapping. A Hz interval has no Wikidata counterpart
worth asserting.

## Consequences

**Additive, plus two narrowings on published concepts.** The six primary bands
lose outcome prose from their scope notes, and five lose a `skos:closeMatch`.
Every band IRI, `hzMin`, `hzMax`, and both band-pointing properties are
unchanged, so presets, protocols and the frozen snapshots are unaffected.

**The scheme description is corrected** from "Controlled vocabulary of neural
oscillation frequency bands" to name ambits, and the `skos:editorialNote`
declaring the conflation deferred is replaced by a note recording this
resolution.

**KR-08 closes** on both complaints: the outcome prose is qualified or gone, and
the alleged scheme conflation is answered by showing it was a missing term
rather than a merged one.

## Alternatives considered

**Rename the bands to `*FrequencyAmbit`.** Clearer labels, but it breaks every
consumer and thirteen frozen snapshots to restate what the class definition
already says.

**Split each band into an observed-band concept and a stimulus-target concept**,
as the audit's disposition proposed. Rejected: it doubles the vocabulary and
encodes a distinction that lives in the *relation*, not the concept. `alpha10`
and `gamma40` show the scheme is ambits; a target is a band that something aims
at, not a different kind of band.

**A BFO process class for each rhythm.** Deferred, not refused — see §2.

## References

- [Improvement plan](../ontology/IMPROVEMENT_PLAN.md) §1.4
- [2026-07-13 audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md), KR-08 and KR-09
- [ADR 0021](0021-controlled-value-semantics.md) — controlled values describe categories, not their real-world referents
- [`SCOPE.md`](../concept/SCOPE.md) — the claim boundary the §4 dispositions answer to
