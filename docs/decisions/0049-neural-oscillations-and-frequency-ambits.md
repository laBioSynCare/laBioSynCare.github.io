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

**The band hierarchy is completed.** `lowAlpha`, `highAlpha`, `lowBeta`,
`midBeta`, `highBeta`, `lowDelta`, `highDelta`, `lowTheta` and `highTheta`
currently declare only `skos:inScheme`; none says which band it is part of. Each
gains `skos:broader` to its parent, with the inverse materialised, so the
sub-ambits are navigable rather than merely co-located. `alpha10` and `gamma40`
likewise become narrower than `alpha` and `gamma`.

### 2. A new controlled category for the rhythms

`sstim:NeuralOscillationType`, with instances
`sstim-v:deltaOscillation`, `thetaOscillation`, `alphaOscillation`,
`smrOscillation`, `betaOscillation`, `gammaOscillation`, each dual-typed
`skos:Concept` + the category class, as every other SSTIM controlled value is,
under a new `sstim-v:NeuralOscillationScheme` whose top concept collects them —
the same shape `allFrequencyBands` already gives the bands.

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
free. It carries the descriptive data (§3) without inventing a measurement
model. And SKOS mapping properties are defined between concepts, which is what
makes §5's Wikidata question answerable at all; `owl:equivalentClass` to a
Wikidata item would be a category error, since Wikidata items are not OWL
classes.

If measured neural data ever enters SSTIM, a process class can be added then and
linked to the concept. Nothing here forecloses it.

**Sub-rhythms are not minted.** `lowAlpha` and `highAlpha` are sub-*ambits*, and
whether "low alpha" names a distinct rhythm rather than a region of one is a
contested empirical question. Sub-bands already exist as bands; a
`lowAlphaOscillation` would assert a phenomenal distinction this ontology cannot
source. SMR is different — it is a named rhythm in the literature, not a slice of
beta — so `smrOscillation` is minted while `lowBetaOscillation` is not.

### 3. What the oscillation carries

- `sstim:hasTypicalFrequencyBand` (oscillation → band) — the conventional ambit
- `sstim:extendedHzMin` / `sstim:extendedHzMax` — the wider range the rhythm is
  reported to occupy. A rhythm modulates and its edges are conventional rather
  than sharp; recording only the typical ambit would reassert the precision this
  ADR exists to deny.
- `sstim:hasCorticalTopography` — where on the scalp or cortex the rhythm is
  characteristically recorded, where that is documented. Occipital alpha and
  central mu are not incidental details; topography is part of how a rhythm is
  identified, alongside frequency.
- `sstim:hasOscillationStateContext` — the behavioural or physiological state in
  which the rhythm is characteristically observed (eyes closed, quiet wakefulness,
  slow-wave sleep). This is an *observation condition*, not an outcome claim:
  "alpha is prominent with eyes closed" describes when you see it, not what it
  does for you. Outcome and function claims are §4's business and never appear
  here.
- `skos:altLabel` — "alpha rhythm", "alpha waves". **No separate rhythm concept**,
  because for these particular entities all three words denote the same thing.
  Wikidata itself mixes them: "alpha wave" but "theta rhythm".
- Associated states, functions and effects — only through §4.

**The three words are near-synonyms, not exact ones, and the concepts say so.**
Recording them as alternate labels without qualification would assert an
interchangeability that does not hold in general:

- **Oscillation** is the rhythmic fluctuation of neural activity itself — the
  process. It is the most general of the three and the least overloaded, which is
  why it is the head term here.
- **Wave** names how that process appears in a recorded signal, and EEG also uses
  it for deflections that are not oscillatory at all: a P300 wave, a sharp wave,
  a K-complex. "Wave" is therefore broader than "oscillation" in one direction
  and narrower in another, and the two are not substitutable outside the named
  band rhythms.
- **Rhythm** implies an oscillation regular and characteristic enough to be named
  and attributed to a state or a generator. A transient oscillatory burst is an
  oscillation but not a rhythm, so "rhythm" is the narrower term.

Each concept therefore carries the alternate labels *and* a `skos:scopeNote`
stating that the three are interchangeable for the named band rhythms while
naming the divergences above. That is the difference between recording usage and
asserting identity — and it is the same discipline §5 applies to `exactMatch`.

As a side effect this begins closing the `skos:altLabel` gap, where the
vocabulary currently has none at all, and it puts "brain waves" — the phrase
most people actually search for — within reach of a generic matcher for the
first time.

### 4. Every association is recorded, and its evidential standing with it

The six primary bands currently assert, unqualified and unsourced:

| Band | Scope-note prose |
|---|---|
| delta | "Deep sleep, heavy down-regulation" |
| theta | "Meditation, creativity, memory, sleep onset, chronic pain support" |
| alpha | "Relaxation, stress reduction, calm alertness" |
| smr | "Focused calm, sustained attention" |
| beta | "Active cognition, alertness" |
| gamma | "Higher-frequency cognitive activation" |

The problem was never that these were *recorded*. It is that they were recorded
as though they were properties of a Hz interval, with no source, no date, no
population and no indication of how well supported they are. **That a claim is
widely repeated and poorly evidenced is itself worth knowing**, and a model that
can only store well-supported claims silently launders the field's folklore into
absence.

So nothing is dropped. Each association moves to the *oscillation* and is
recorded as exactly one of:

- **`sstim:EvidenceAssessmentClaim`** with `sstim:hasEvidenceTier` — for
  associations with locatable literature. The tier scheme already spans
  `tierSpeculative`, `tierAnecdotal`, `tierPreliminary`, `tierModerate`,
  `tierStrong`, `tierEstablished`, so a weak claim is recorded *as weak* rather
  than omitted.
- **`sstim-ex:KnowledgeStatusAssertion`** with
  `sstim-ex:noKnownEvidenceInSSTIM` — for associations asserted in the field with
  no evidence located. This class exists precisely for this: *"an immutable,
  scoped, dated assertion... It states what a named corpus records as of a date —
  never a universal claim — and carries no evidence tier, direction, basis, or
  review metadata."* It says "this is claimed, we found nothing supporting it,
  as of this date" without asserting the claim.

**No new `supportingEvidenceStrength` property**, and this is a disagreement with
the shape of the original suggestion rather than its intent. Three reasons:

1. `hasEvidenceTier` already ranks strength across six tiers, bottom included.
2. `noKnownEvidenceInSSTIM` already expresses the null case, dated and scoped.
3. **Decisively: the public-claim gate keys off `hasEvidenceTier`.** The SHACL
   rule authorising a public claim reads the tier's `tierRank` and compares it to
   the level's requirement. A parallel strength property would be invisible to
   that gate, so anything recorded under it could authorise public copy without
   ever passing the check. Reusing the tier keeps the gate load-bearing, which is
   the whole reason it is safe to record weak claims at all.

Moving the prose to the oscillation's *scope note* remains not an option. A scope
note carries no tier, no source and no date, so it would relocate an unqualified
claim to a better subject and leave KR-08's first complaint untouched.

### 5. Wikidata mappings move, and `exactMatch` is earned per item

The five band mappings move from the band to the oscillation, where the Wikidata
items actually point: Q2469782 is "alpha wave", a neurophysiological phenomenon,
not a Hz interval. With the oscillation as subject, `exactMatch` becomes
defensible for the first time — that is the point of the split, and most of the
five are expected to reach it.

Each is still decided by the extension/intension test KR-09's disposition
requires, not by label similarity, because the items are not uniform: "alpha
wave" and "theta rhythm" are named differently and may scope differently. Any
that fails the test stays `closeMatch` with the reason recorded in the mapping
annotations added for KR-09 — five of which currently name this ADR as their
precondition for revisiting.

The band keeps no Wikidata mapping. A Hz interval has no Wikidata counterpart
worth asserting.

**Consumers following the old mapping are not left at a dead end.** Anyone who
resolved `sstim-v:alpha skos:closeMatch wd:Q2469782` will now find nothing on the
band, so each of the five bands gains a `skos:historyNote` recording that its
external mapping moved to the named oscillation and when. The band is reachable
from the oscillation through `hasTypicalFrequencyBand`, and the reverse traversal
is a query rather than a second property: an inverse would restate the same fact
in a form that can drift out of step with it.

### 6. Medical-domain associations are recorded, not avoided

Some of these associations touch sleep, pain, and mood, and more exist in the
literature that this vocabulary has never recorded. They are recorded, with
sources and tiers, for the same reason as everything else in §4: a model that
omits them does not make the claims disappear, it just makes SSTIM silent about
a part of the field it describes.

This does not conflict with `CLAUDE.md` §3.5, and the distinction is worth
stating because it will be questioned. §3.5 governs **user-facing copy** — UI
strings, preset descriptions, marketing text — where "treat", "cure" and "proven
to" are prohibited. An `EvidenceAssessmentClaim` is not user-facing copy. It is a
dated, sourced, population-scoped record with an explicit strength rating, and
the public-claim gate stands between it and anything a user reads. The `C4`
medical public-claim level is a sentinel ranked above the maximum attainable
tier, so asserting a medical claim publicly *always* fails validation, by
construction.

Recording that a claim exists and is weakly supported is the opposite of making
it. The constraint on the work is therefore not silence but discipline: every
such record carries a real citation or an explicit `noKnownEvidenceInSSTIM`, and
no citation is invented to fill a gap.

## Acceptance

This ADR is implemented when all five hold, and each is checkable rather than
asserted:

1. **No `sstim:FrequencyBand` scope note carries outcome vocabulary.** A lint over
   the vocabulary fails on outcome and state language in a band's scope note —
   sleep, relaxation, stress, pain, attention, mood, cognition and their obvious
   relatives. It is deliberately blunt: a false positive costs one rewording, and
   the failure it prevents is the one that produced KR-08.
2. **Every association in the §4 table is reachable** from its oscillation as
   either an `EvidenceAssessmentClaim` with a tier or a `KnowledgeStatusAssertion`
   at `noKnownEvidenceInSSTIM`. None is merely deleted, and a competency query
   returns the full set with its evidential standing.
3. **Every band with a sub-band declares the hierarchy**, with `skos:broader` and
   its inverse materialised, as the quality audit already requires elsewhere.
4. **`make validate` passes unchanged**, including HermiT consistency, the
   entailment gate added for KR-05, and the full-union compatibility check: every
   0.12 baseline triple must still survive, since this ADR narrows two things but
   removes no term.
5. **No citation in the resulting claims is unverifiable.** Every
   `EvidenceAssessmentClaim` names a real reference with a resolvable DOI, or the
   association is recorded as unevidenced instead. This one is checked by a human,
   because it is the one an automated gate cannot judge.

## Consequences

**Additive, plus two narrowings on published concepts.** The six primary bands
lose outcome prose from their scope notes, and five lose a `skos:closeMatch`.
Every band IRI, `hzMin`, `hzMax`, and both band-pointing properties are
unchanged, so presets, protocols and the frozen snapshots are unaffected.

**The scheme description is corrected** from "Controlled vocabulary of neural
oscillation frequency bands" to name ambits, and the `skos:editorialNote`
declaring the conflation deferred is replaced by a note recording this
resolution.

**The band hierarchy becomes navigable**, which it was not: nine sub-bands
currently declare no parent.

**KR-08 closes** on both complaints: the outcome prose is qualified, sourced and
strength-rated or explicitly marked unevidenced, and the alleged scheme
conflation is answered by showing it was a missing term rather than a merged one.

**A known cost:** §4 requires literature work per association, and some will end
at `noKnownEvidenceInSSTIM` because no source is found. That outcome is a result,
not a failure — it is the record that a widely repeated association is not
evidenced, which is precisely the knowledge the old scope notes concealed.

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

**A dedicated `supportingEvidenceStrength` property.** Rejected in favour of the
existing tier and knowledge-status machinery — see §4.

**Recording rhythm, wave and oscillation as plain synonyms.** Rejected: "wave"
also names non-oscillatory EEG deflections and "rhythm" implies a regularity an
oscillatory burst need not have, so unqualified alternate labels would assert an
interchangeability that fails outside the named band rhythms — see §3.

**An inverse of `hasTypicalFrequencyBand`.** Rejected: it restates one fact in
two places, which is how the two places come to disagree. Reverse traversal is a
query.

**Drop the unevidenced associations.** Rejected: their weakness is information.

## References

- [Improvement plan](../ontology/IMPROVEMENT_PLAN.md) §1.4
- [2026-07-13 audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md), KR-08 and KR-09
- [ADR 0021](0021-controlled-value-semantics.md) — controlled values describe categories, not their real-world referents
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — the claim family §4 draws on
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — the public-claim gate §4 and §6 rely on
- [`SCOPE.md`](../concept/SCOPE.md) — the claim boundary §6 answers to
