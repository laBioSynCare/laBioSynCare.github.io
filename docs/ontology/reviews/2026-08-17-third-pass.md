# Third-pass review — 2026-08-17

**Status:** findings only, nothing fixed.
**Companions:** [first pass](2026-08-17-ontology-vocabulary-and-data-review.md)
(absence), [second pass](2026-08-17-second-pass.md) (incoherence). Neither is
repeated here.

This pass asks whether the model is *sound* — whether what it says is right, and
whether it says the same thing twice. Its sharpest findings are all in the ADR
0052 signal layer, which is four days old and which I designed and implemented.
That is not an accident of where I looked: it is the newest and least-settled
part of the ontology, and the first two passes had already covered the older
parts along the axes they used.

---

## 1. `hasRenderingPresence` is redundant, and three of its five cases are unconstrained

ADR 0052 decision 4 made every rendering declare whether the signal is physically
present or perceptually constructed, because evidence does not transfer freely
between the two. That reasoning stands. The modelling does not.

**Presence is a function of mechanism, for every mechanism defined:**

| Mechanism | Presence | Free to vary? |
|---|---|---|
| `mechanismDirectPresentation` | physical | no |
| `mechanismAmplitudeModulation` | physical | no |
| `mechanismFrequencyModulation` | physical | no |
| `mechanismMonauralBeat` | physical — the beat is in the summed waveform | no |
| `mechanismBinauralBeat` | **perceptual** — absent from each ear | no |

So `hasRenderingPresence` records a fact already determined by
`hasRenderingMechanism`. It is derivable data that a curator must assert by hand
and can therefore assert wrongly.

**And I constrained only one of the five combinations.** The shapes mention
`mechanismBinauralBeat` and `mechanismDirectPresentation` and no other. A
rendering declaring `mechanismMonauralBeat` with `presencePerceptual`, or
`mechanismAmplitudeModulation` with `presencePerceptual`, conforms today — and
those are exactly the errors that would let a finding about a physically present
modulation authorize a claim about a constructed one, which is the harm the
distinction exists to prevent.

**Disposition — one of three, and it is a real choice:**

1. Derive presence from mechanism and drop the property. Cleanest, but loses the
   ability to describe a mechanism SSTIM has not named.
2. Keep it and constrain all five combinations. Cheapest, but leaves redundant
   data that must be kept in step.
3. Move presence onto the *mechanism concept* — `mechanismBinauralBeat
   sstim:impliesPresence sstim-v:presencePerceptual` — so a rendering states its
   mechanism and presence follows by entailment, with a SHACL rule catching any
   rendering that contradicts it. This is the pattern `requiresEvidenceTierRank`
   already uses on claim levels, and I think it is right.

---

## 2. Two carrier properties, both mine, three days apart

```
sstim:renderingCarrierHz          domain sstim:SignalRendering       (ADR 0052, 14 Aug)
sstim-ex:hasCarrierFrequencyHz    domain sstim-ex:StimulusChannel    (ADR 0052, 17 Aug)
```

Two properties meaning "the carrier frequency", in two modules, with **no
relation asserted between them** — not `equivalentProperty`, not
`subPropertyOf`, not a scope note distinguishing them. A consumer asking for a
carrier must know to look in both places, and a producer must choose without
guidance.

I introduced the first with the signal layer and the second with the frequency
hierarchy, and did not notice the collision because they live in different
modules and the second was framed as splitting a *third* property.

There may be a defensible distinction — the channel-level one describes what the
channel emits, the rendering-level one what this particular binding uses — but
if so it is unwritten, and the two would still need to agree when both are
present. Nothing checks that they do.

---

## 3. The band-interval relations are unconstrained and can contradict the extent

`signalWithinBand`, `signalCoversBand` and `signalOverlapsBand` have **zero SHACL
constraints** — they appear in `check-signal-layer.py` only inside fixtures.

A signal with `hzMin 4.0` and `hzMax 8.0` may assert `signalWithinBand
sstim-v:alpha` (8–13 Hz) and conform. Every ingredient for the check exists: the
signal states its bounds, the band states `hzMin`/`hzMax`, and the three
relations have exact interval semantics. Nothing computes them.

This is the same check ADR 0049 already added for oscillations — `make
band-scope-notes` verifies that an oscillation's extended range contains its
typical ambit — so the precedent is six weeks old and in this repository, and I
did not apply it to the directly analogous relation I was adding.

Worse, the relation is *derivable*: given both extents, which of the three holds
is computable. As with §1, this is asserted data that duplicates a computation
and can disagree with it.

---

## 4. Sixty-nine property shapes carry no `sh:message`

Of 338 property shapes, **69 report the default SHACL message** rather than one
written for the constraint. Every negative-fixture harness in this repository
asserts on message text — `session-shapes-negative`, `public-claim-gate-negative`,
`preset-contract`, `check-signal-layer` all match a fragment to prove the *right*
constraint fired. A shape with no message cannot be pinned that way, so a
fixture testing one can only assert "something failed".

Twenty-five shapes also carry neither a cardinality nor a value constraint —
only a class or datatype. Some of those are legitimate (a bare type check on an
optional link), but the two sets together mark where validation is thinnest.

---

## 5. Naming inconsistency: `relationshipType` and `hasRelationshipType`

`sstim-eco:relationshipType` (domain `EcosystemAgent`) and
`sstim-eco:hasRelationshipType` (domain `EcosystemRelationship`) are the only
pair in 284 properties whose names differ solely by the `has` prefix. The
ontology is otherwise consistent about the convention. Minor, but it is the kind
of thing that makes a consumer guess.

---

## 6. What came back clean

- **All 13 frozen snapshots parse** — 118 Turtle files, zero failures. The
  immutable releases are intact.
- **No other parallel-property duplication** across 284 properties; §2 and §5 are
  the only two, and §2 is four days old.
- **Sibling classes carry their disjointness** where it matters; no large sibling
  set was found undeclared.

---

## 7. The pattern across three passes

Counting only defects introduced in `dc1edb27..HEAD` — four days, one ADR, all
of it passing 27 gates:

| Pass | Finding | Kind |
|---|---|---|
| 1 | three `skos:notation` collisions | collision with existing terms |
| 1 | `signalSourceAsset` has no range | incomplete term |
| 1 | twenty English-only concepts | convention not followed |
| 2 | two definitions that restate their label | quality |
| 3 | presence redundant, 3 of 5 cases unconstrained | **soundness** |
| 3 | two carrier properties, unrelated | **duplication** |
| 3 | band relations unconstrained and derivable | **soundness** |

The first four are the kind a gate catches. **The last three are not** — they are
design faults that no lint would find, and they were all invisible to a full
`make validate` because the gates check that data conforms to the model, never
that the model is coherent.

The honest reading is that the signal layer was designed and implemented in a
single session, at the end of a long one, with no interval between designing it
and shipping it. ADR 0052 was accepted and implemented the same day. Every other
substantial ADR in this repository — 0027, 0043, 0048, 0049 — sat as Proposed
across at least one session before implementation, and none of them has three
soundness findings against it four days later.

**The recommendation this pass most wants to make is not about a term.** It is
that a new term set should be exercised by real instance data before its ADR
moves from Proposed to Accepted. Every finding in §1–§3 would have surfaced the
first time someone tried to describe an actual monaural beat, or an actual
band-limited noise signal aimed at theta, because each is a contradiction the
data would have had to commit.
