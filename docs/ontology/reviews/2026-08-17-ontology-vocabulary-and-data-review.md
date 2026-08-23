# Ontology, vocabulary and data review — 2026-08-17

**Status:** findings only. Nothing here is fixed; the point is an honest list.
**Scope:** the whole term space and every instance file, plus the work in
`dc1edb27..963dbf5` (the ADR 0052 signal layer, its frequency hierarchy, and the
documentation-consolidation commits before it).

**Method.** A one-off analysis over the 18 manifest-owned modules and all 21
instance files, asking questions the 27 gates in `make validate` do not: which
terms lack definitions, which lack domains or ranges, which controlled values
collide, which declared terms no data ever uses, and which referenced IRIs
nothing defines. Counts below are machine-derived; judgements about whether a
count is a *flaw* are mine and flagged where uncertain.

---

## 1. The largest finding: most of SSTIM is unexercised

**65% of properties (184 of 284) and 75% of classes (117 of 157) appear in no
instance data at all.** The 21 instance files hold 2,079 triples and exercise 46
classes and 112 properties.

This is not a lint. It is the difference between an ontology that has been used
and one that has been written. Every gate in `make validate` can pass while a
term is meaningless in practice, because conformance is only ever checked
against data that exists. The evidence for this being a real risk is in this
repository's own history: the public-claim gate was vacuous for months because
no preset reached the tier that would fire it, and nobody could tell.

Unexercised areas worth naming specifically:

- **The entire ADR 0052 signal layer.** `StimulationSignal`, `SignalRendering`
  and all twelve properties I added days ago have zero instances. Their
  constraints are exercised only by the adversarial fixtures in
  `make signal-layer`, which are synthetic and inline. A seed preset that
  actually declares a signal rendered two ways would prove the layer earns its
  place; nothing currently does.
- **`ControlTrack`, `AudioTrack`, `HapticTrack`** — never instantiated, so the
  multi-modal track story has no worked example either.
- **`EvidenceReviewDecision`, `EvidenceSearchRecord`, `IndependenceDetermination`,
  `EvidenceReviewActivity`** — the whole ADR 0027 review apparatus. Already
  known (ADR 0050 records that no review has been run), but worth seeing in the
  same list: it means the public-claim gate's review clause has never been
  satisfied by anything, not even a fixture in committed data.
- **`FrequencyBand` and `CautionTag` appear as "never instantiated"** only
  because their members are declared in the vocabulary module rather than as
  instance data — a false positive of the method, noted so nobody re-derives it.

**Disposition.** Not "write data for everything". Rather: decide which terms are
meant to be exercised, and treat an unexercised term in that set as incomplete.
A `make coverage` reporting the ratio, with an allow-list for terms that are
deliberately schema-only, would make the number visible instead of discoverable.

---

## 2. Frequency bands have no definitions

All 17 `sstim:FrequencyBand` concepts — `alpha`, `beta`, `delta`, `gamma`,
`theta`, `smr`, the nine sub-bands, `alpha10`, `gamma40` — carry
`skos:scopeNote` and **no `skos:definition`**.

These are the most-referenced concepts in SSTIM. ADR 0049 rewrote every one of
their scope notes six weeks ago and did not notice that the definition was
absent, because nothing checks for it. `pyLODE` and WIDOCO render definitions
preferentially, so the published documentation shows the most important
vocabulary in the ontology as undefined.

Also undefined: `modalityInteroceptive`, `modalityOlfactory`,
`modalityVestibular` (three of six sensory modalities), and the six audio noise
colours. **26 concepts total.**

**Disposition.** A definition is not a scope note. For a band, the definition is
the Hz interval and its status as a convention; the scope note is everything
else. Add a gate requiring `skos:definition` on every concept, which would also
have caught this in July.

---

## 3. Notation collisions, three of them introduced by me

`skos:notation` is used as the key by which a JSON Schema references a concept —
`preset-contract.py` resolves 45 controlled values that way. **17 notations are
shared by two or more concepts.** Three kinds:

**Introduced in the reviewed range (my defect):**

| Notation | Concepts |
|---|---|
| `noise` | `shapeNoise` (new) and `patternNoise` (existing) |
| `amplitude-modulation` | `mechanismAmplitudeModulation` (new) and `techAmplitudeModulation` (existing) |
| `frequency-modulation` | `mechanismFrequencyModulation` (new) and `techFrequencyModulation` (existing) |

I added twenty concepts and checked none of their notations against the existing
525. A consumer resolving `"amplitude-modulation"` cannot tell a rendering
mechanism from a stimulation technique.

**Expected, from the two modality schemes:** six pairs where
`sstim-v:modalityX` and `sstim-ex:modalityX` share a notation. These are the
deliberately bridged duplicates, but a notation-keyed lookup still cannot
disambiguate them.

**Pre-existing cross-category collisions:** `eye-strain` across three categories
(boundary, effect, experience), `moderate` across three (caution severity,
severity, evidence tier), and five more.

**Disposition.** Decide whether notation is unique globally or per scheme. If per
scheme — which the cross-category cases suggest is the intent — then every
notation-keyed lookup must carry the scheme, and `preset-contract.py`'s check
should be tightened to match on `(scheme, notation)` rather than notation alone,
because today it would accept a value that resolves to the wrong concept.

---

## 4. `citesReference` is load-bearing and entirely unconstrained

The ADR 0050 public-claim gate requires the authorizing assessment to
`sstim:citesReference` a `PublicSafeReference` that is also one of its evidence
bases. That property has **no `rdfs:domain`, no `rdfs:range`, and no SHACL
property shape** — zero occurrences as an `sh:path` anywhere.

> **Correction and status, 2026-08-17.** It had a range,
> `sstim:BibliographicReference`; only the domain and the shape were missing, and
> both were added in `1596fa8`. The overcount was found by adding a duplicate
> union range and having `make module-boundaries` reject it — which is the right
> way round: the gate knew, and the review had not asked it. The broader finding
> below (78 domainless properties, never separated into deliberate and
> overlooked) stands and is unaddressed.

So nothing outside the gate constrains what may be cited or by what. The gate
compensates by checking the reference's type itself, which means the safety
property holds — but it holds by one SPARQL constraint rather than by the model,
and a second consumer reading `citesReference` gets no guarantees at all.

More broadly: **78 of 284 properties declare no `rdfs:domain`, and 9 declare no
`rdfs:range`.** Many of the missing domains are deliberate — KR-05's disposition
explicitly lists "no OWL domain plus SHACL target rules" as a valid outcome —
but that disposition assumed the SHACL half exists, and for `citesReference` it
does not. The 78 have never been separated into "deliberate" and "overlooked".

**Also mine:** `sstim:signalSourceAsset` (ADR 0052) has no range, so nothing says
what a sampled signal's source *is*. I wrote a SHACL constraint requiring it to
be present and none saying what it may be.

---

## 5. English-only labels: 276 of 525 concepts

`skos:prefLabel` exists in `en` only for **53% of the vocabulary**. The
multilingual commitment (en/it/pt/es) is honoured in the older schemes and
almost entirely absent from the newer ones — the ecosystem, evidence-dimension,
observation and (as of this week) signal vocabularies are English-only.

This is KR-16, open and correctly tracked in improvement plan 1.4. It is listed
here because the *trend* matters: every scheme added since roughly July has
skipped translation, so the gap is widening rather than closing, and nothing
reports the ratio.

**Note:** the 20 concepts I added in the reviewed range are English-only, which I
did not flag at the time.

---

## 6. A dangling IRI in published data

`https://w3id.org/sstim/organization/aeterni-anima` is asserted as
`dct:contributor` in two committed instance files —
`programmes/biosyncare-ecosystem.ttl` and `implementations/implementations.ttl` —
and **is defined nowhere**. It is under the SSTIM namespace, so it is a promise
the project makes about its own IRI space and does not keep. It is also the only
such dangling reference in all 2,079 instance triples, which is otherwise a good
result.

---

## 7. Two deprecated terms referenced by a live shape

`sstim-eco:notificationChannel` and `sstim-eco:responseNote` are deprecated and
both are referenced by `PublicEcosystemPrivateDataShape`. This is *probably*
deliberate — a shape whose job is to assert that private fields never appear in
the public graph must name those fields — but nothing records that it is
deliberate, and a reader encountering it cannot distinguish intent from
oversight.

---

## 8. Notes on the reviewed commit range specifically

What holds up:

- The frequency hierarchy is better than the deprecation it replaced, and
  catching the `owl:FunctionalProperty` conflict before committing was the
  difference between a working hierarchy and one that would have gone
  inconsistent on its first real use.
- The full-equivalence repair — skipping RDF list cells and anonymous
  disjointness axioms structurally rather than adding a fifth hand-written
  exclusion — removed a per-release maintenance cost and is justified in the
  file.
- `make signal-layer` checks adds, changes and removes, and its two positive
  controls are real scenarios rather than minimal ones.

What does not:

- The three notation collisions (§3).
- `signalSourceAsset` without a range (§4).
- Twenty English-only concepts (§5).
- Zero instance data for the whole layer (§1).
- **Three module-boundary corrections were needed during implementation**, all
  because I placed terms without checking the dependency direction first. The
  manifest caught every one, which is the system working — but the pattern
  (place, fail, move) recurred three times in one commit and suggests checking
  `requires` before writing a term rather than after.

---

## What was checked and found clean

Stated so the list above is read as a *complete* finding set rather than a
sample:

- No instance file fails its applicable SHACL profile.
- No orphan concepts: every one of the 525 is in a `skos:ConceptScheme`.
- Every concept carries a `skos:notation` (the collisions in §3 are about
  uniqueness, not absence).
- Every class carries `rdfs:isDefinedBy` and an `rdfs:subClassOf` root.
- Every class and property carries a `skos:definition` — the 26 gaps in §2 are
  all SKOS concepts, not OWL terms.
- Only one dangling IRI across 2,079 instance triples (§6).
- HermiT is consistent across the 16 semantic modules; the frequency hierarchy
  did not disturb it.

---

## Suggested order, if these are taken up

1. **§3 notation collisions** — smallest, and three of them are days old. Decide
   the uniqueness rule, then tighten the schema check that depends on it.
2. **§2 band definitions** — 26 concepts, mechanical, and it fixes the published
   documentation of SSTIM's most-used vocabulary.
3. **§6 dangling IRI** — one term, either define it or stop asserting it.
4. **§4 domain/range audit** — separate the 78 deliberate from the overlooked,
   starting with `citesReference` because a safety gate depends on it.
5. **§1 coverage** — the largest and the most valuable, and the one that most
   deserves a decision rather than a script: which terms are meant to be
   exercised at all.
6. **§5 translations** — known, tracked, and widening; at minimum add the ratio
   to `make quality-audit` so it stops being invisible.
