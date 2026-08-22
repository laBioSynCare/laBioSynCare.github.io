# Sensory Stimulation: Sense Inventory and Lexical Scope Review

**Status: analysis and proposal. Nothing applied.** No `.ttl` was modified. Per
[ADR 0004](../decisions/0004-protected-ontology-files.md) and `CLAUDE.md` §3.4,
the vocabulary changes only on an explicit maintainer instruction, and this
document deliberately stops before that point: it defines the instrument, not
the edit.

**Feeds:** [IMPROVEMENT_PLAN](IMPROVEMENT_PLAN.md) P4 (external alignment),
[SENSORY_TAXONOMY_REVIEW](SENSORY_TAXONOMY_REVIEW.md) (the sibling problem, one
level down), and W3C CG charter deliverable 3 (SKOS concept scheme).

---

## The question

Not "what does SSTIM mean by sensory stimulation", which is answered well
already, but:

> What meanings has "sensory stimulation" acquired across science, medicine,
> therapy, technology and culture; which one does SSTIM model; how does SSTIM's
> concept relate formally to each of the others; and why was that scope chosen?

## Measured state, 2026-08-22

The **intensional** account is strong.
[`SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md) decomposes the
definition clause by clause, separates four scopes, and carries an explicit
"terminology that must not be conflated" section
([ADR 0019](../decisions/0019-modality-nomenclature-cleanup.md)).
`sstim:SensoryStimulation` sits under `sstim:Stimulation` under `BFO_0000015`,
with `SensoryStimulationIntervention` and `SensoryRouteNeuromodulation` beneath
it. The alignment module is audited rather than aspirational: a 2026-07-10 audit
found that MeSH D012910 is *Snake Venoms*, not sensory stimulation, and
deliberately asserted no mapping.

The **lexical** layer is not.

| Mechanism | Coverage over 551 SKOS concepts |
|---|---|
| `prefLabel`, `definition` | 551 |
| `scopeNote` | 90 |
| `altLabel` | 8 |
| `hiddenLabel` | 0 |
| `example` | 0 |

Across all 785 terms there are 25 external mapping assertions, essentially all
Wikidata. `sstim:SensoryStimulation` itself carries no `altLabel`, no
`hiddenLabel`, no `example`, and no external mapping. One live TODO in
`sstim-alignments.ttl` notes SNOMED CT 229070002, "sensory stimulation
(procedure)", as unverified and unasserted.

Reproduce with `python3 scripts/locate-iri.py sstim:SensoryStimulation` for
location, and the coverage snippet in
[`INTERVIEW_TARGETS.md`](../ecosystem/INTERVIEW_TARGETS.md) for the counts.

---

## The relation taxonomy

This section governs everything downstream, because the most likely way to get
this work wrong is to treat every alternative reading of the string as a
synonym. It is not. **A different disciplinary sense is a different concept, and
must never be recorded as a `skos:altLabel`.**

| Relation | What it means | Correct mechanism | Wrong mechanism |
|---|---|---|---|
| **Lexical variant** | Same concept, different string. Abbreviations, spellings, plurals | `skos:altLabel` | |
| **Synonym** | Same concept, established alternative expression, coextensional | `skos:altLabel` | |
| **Search variant** | Misspellings, deprecated forms, strings a searcher might type but we would not display | `skos:hiddenLabel` | `altLabel` |
| **Quasi-synonym** | Nearly the same concept, differing in a way that matters somewhere | `skos:closeMatch`, or a separate concept plus `skos:related` | `altLabel` |
| **Broader concept** | Subsumes SSTIM's sense | `skos:broadMatch` (external), `skos:broader` (internal), `rdfs:subClassOf` (ontological) | `altLabel` |
| **Narrower concept** | Subsumed by SSTIM's sense | `skos:narrowMatch`, `skos:narrower`, `rdfs:subClassOf` | `altLabel` |
| **Overlapping concept** | Neither subsumes the other, the intersection is non-empty and interesting | An explicit intersection class, plus `skos:relatedMatch` | `broadMatch` or `narrowMatch`, which would both be false |
| **Related concept** | Associatively connected, no subsumption | `skos:related`, `skos:relatedMatch` | `altLabel` |
| **Disjoint concept** | Same string, formally excluded | `owl:disjointWith` plus a `skos:scopeNote` saying why | any label property |
| **Homonym** | Same string, unrelated concept, no ontological relation at all | A `skos:scopeNote` documenting the collision. Nothing else | `hiddenLabel`, which would pollute search with genuine noise |
| **Part-whole** | Not a lexical relation | An object property with BFO-appropriate semantics | any SKOS relation |

SSTIM already has a worked precedent for the overlapping case, and it is a good
one: `SensoryRouteNeuromodulation` is defined as "the overlap of the two
families, not a subclass of either alone". Whatever the sense inventory turns
up, that pattern is available and does not need inventing.

## Two layers of hierarchy, kept distinct

`SensoryStimulation` → `Stimulation` → `BFO_0000015` is **ontological
taxonomy**: subclass, with the entailments a reasoner will draw.

Broader and narrower **terms** are lexical and conceptual organization. They
should agree with the taxonomy where both apply, and they must not be
mechanically mirrored: SSTIM's concepts are dual-typed
(`static/ontology/README.md`, Pattern 2), so a careless duplication would assert
a subclass axiom every time someone records a vocabulary relationship. Record
the lexical relation; derive nothing from it automatically.

## Meronymy needs more care than "SSTIM has composedOf"

An earlier assessment said meronymy is already covered because `composedOf`,
`composedOfTrack`, channels and tracks exist. That is a **structural part-whole
model**, and it is not the same as the conceptual meronyms of a sensory
stimulation process. Under BFO, which SSTIM is committed to, the candidates
divide:

| Term | What it actually is | Genuine part of the process? |
|---|---|---|
| Event, phase | Temporal part of the process | **Yes** |
| Session | The whole the stimulation occurs within | Yes, at the other end |
| Stimulus | The input that participates in the process | No, a participant |
| Channel | A delivery structure, participant or role | No |
| Cue | A role a stimulus plays | No, a role |
| Modality | A determinable quality of the perceptual route | No, a quality |
| Pattern | The temporal organization of the process | No, a process profile |
| Exposure | The same process viewed from the recipient side | No, a perspective |

Calling all of these meronyms would be too coarse, and would push SSTIM toward
a part-whole relation with no consistent semantics. Only the first two rows are
mereological.

---

## Sense inventory schema

One row per attested sense. The load-bearing field is **relation to the SSTIM
sense**, drawn from the taxonomy above rather than from synonym/hypernym alone,
because it is what exposes whether SSTIM models one established sense or a
deliberately broader umbrella.

```text
lexical form
domain or community
attested meaning              (quoted from a source, not paraphrased from memory)
ontological type              (process, intervention, programme, artifact, practice)
typical recipient             (adult human, infant, non-human animal, consumer)
intentionality                (deliberate, incidental)
typical purpose
relation to the SSTIM sense   exact | narrower | broader | overlapping |
                              related | disjoint | homonymous
in-community synonyms
authoritative sources         (papers, textbooks, controlled vocabularies)
informants
modelling decision            (pending until the review concludes)
confidence                    high | medium | low
```

## Seed inventory

**Every row below is an unattested draft at low confidence.** They record where
to look, not what was found, and the relation column is a hypothesis to be
tested rather than a finding. Nothing here may be cited as a result, and nothing
may enter the vocabulary until streams 1 and 2 have populated it.

| Sense | Community | Hypothesised relation | Why it is worth checking |
|---|---|---|---|
| Presentation of stimuli under experimental control | Basic sensory neuroscience, psychophysics | narrower, or exact | Highest-volume usage in the literature. If SSTIM does not cover it cleanly, nothing else matters |
| Structured multimodal stimulation programme | Disorders of consciousness, coma rehabilitation | narrower | An established clinical use of the exact phrase, with systematic reviews |
| Sensory input within sensory processing intervention | Occupational therapy, Ayres SI | overlapping | Densest terminology: stimulation, integration, modulation, processing, diet |
| Multisensory environment practice | Snoezelen, MSE, dementia care | overlapping | Also the open question in [ADR 0030](../decisions/0030-named-methods-and-schools.md) |
| Tactile and kinesthetic stimulation of preterm infants | Neonatal developmental care | narrower | Tests the recipient axis at the youngest edge |
| Sensory curriculum and sensory rooms | Special education, PMLD | narrower | Large deployed practice, absent from SSTIM |
| Sensory or environmental enrichment | Animal welfare | **unknown, and that is the point** | See stress tests |
| Deliberate shaping of consumer sensory experience | Sensory marketing, experience design | **unknown, and that is the point** | See stress tests |
| Interoceptive and respiratory signalling | Respiratory psychophysiology | overlapping | Probes what counts as "sensory" at all |

## Two stress tests, and how to read them

SSTIM's definition requires a process, structured input, a sensory route,
specified parameters and a declared purpose. It nowhere requires a human
recipient: there is no `Participant`, `Subject` or `Recipient` class in the
ontology, only `ParticipantObservation` and `ParticipantEngagementMode`. And it
admits any declared purpose, including "expressive" and "informational".

On a plain reading, therefore, **animal sensory enrichment and sensory marketing
both satisfy the definition**, and neither appears anywhere in the vocabulary.

This is a hypothesis to test, not a defect to repair. Three outcomes are
available and the review must pick one explicitly:

1. **The definition is correctly broad.** SSTIM is a universal standard
   ([SSTIM_DIRECTIONS](SSTIM_DIRECTIONS.md)), the vocabulary is merely
   incomplete, and these are coverage gaps like any other.
2. **The definition is accidentally broad.** A clause is missing, and it should
   be added deliberately rather than discovered later by someone else.
3. **The definition is correctly broad and the scope is narrower than the
   definition.** Then the narrowing is a scope decision that must be written
   down, not left to the fact that nobody encoded a zoo.

What is not available is relying on "we did not mean those". An operational
definition that admits cases the project would reject is either wrong or
incompletely scoped, and either way the answer belongs in an ADR.

---

## Method: three evidence streams, in this order

The failure mode for this work is asking eight specialists what the phrase means
and receiving eight personal definitions. Interviews come last for that reason.

**Stream 2 first, because it is cheap and it constrains the rest.**

1. **Terminological analysis.** MeSH, SNOMED CT, UMLS, Wikidata, OBI/EFO and the
   relevant professional vocabularies. Every candidate mapping is verified
   against the authoritative record before assertion, following the convention
   the 2026-07-10 MeSH audit already established in `sstim-alignments.ttl`: a
   recorded non-assertion with its reason is a result. The standing SNOMED CT
   229070002 TODO is the first item. This stream needs no interviews and can
   start immediately.
2. **Corpus and literature analysis.** How the phrase is used across
   disciplines, and how that has shifted over time. This produces attested
   meanings with citations, which is what the inventory's `attested meaning`
   field requires and what an interview cannot supply.
3. **Expert interviews.** Reserved for the distinctions that published
   definitions leave implicit, which is what interviews are actually good for.
   By this point the questions are specific.

For central senses, seek **two independent informants**: one embedded
practitioner or researcher, and one with review or terminology breadth. A single
idiosyncratic expert would otherwise define the vocabulary. Peripheral
stress-test senses can start with one. Because the corpus is the primary
evidence here and the interviews are confirmatory, most of these are expert
review type calls under
[`INTERVIEW_PROTOCOL.md`](../ecosystem/INTERVIEW_PROTOCOL.md), not full
contribution interviews.

## Decisions this review must produce

An ADR, and only then vocabulary changes:

1. Which attested sense, if any, `sstim:SensoryStimulation` is coextensional with.
2. The formal relation to each other attested sense.
3. Whether the definition is correctly broad, accidentally broad, or correctly
   broad with a narrower declared scope.
4. Whether SNOMED CT 229070002 is an `exactMatch`, a `closeMatch`, or neither.
5. Which lexical variants and synonyms are genuine `altLabel`s of the existing
   concept, and which apparent synonyms are separate concepts.
6. Whether any sense warrants its own concept in the scheme, and if so under
   which relation.

## Not proposed

- No `.ttl` edit, until 1 through 6 are decided.
- **No disciplinary sense added as an `altLabel`**, under any circumstance.
- No `hiddenLabel` used to park semantic alternatives. It is for search noise.
- No new OWL classes for senses before the relation is established, which would
  repeat the duplicate-hierarchy error
  [SENSORY_TAXONOMY_REVIEW](SENSORY_TAXONOMY_REVIEW.md) already documented.
