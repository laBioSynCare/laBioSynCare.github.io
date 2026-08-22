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
`sstim-alignments.ttl` names a SNOMED CT identifier as unverified and unasserted.
See the next section: that identifier is wrong, and the correct one is known.

### The SNOMED CT identifier was wrong, and is now resolved

`sstim-alignments.ttl` carries the comment:

```text
# TODO: SNOMED CT alignment for clinical context descriptions
# SNOMED 229070002 = sensory stimulation (procedure) - verify current URI
```

**That identifier is incorrect.** Resolved 2026-08-22 against the HL7 FHIR
terminology server `tx.fhir.org`, using `CodeSystem/$lookup` on
`http://snomed.info/sct`:

| Code | Display | Fully specified name |
|---|---|---|
| `229070002` | Stretching exercises | Stretching exercises (procedure) |
| `226056003` | Sensory stimulation | Sensory stimulation (procedure); *inactive:* Sensory stimulation (regime/therapy) |

`229070002` is independently corroborated as "Stretching exercises" by the HL7
Europe Hospital Discharge Report encounter-type value set. The comment's own
"verify current URI" flag was correct to distrust it, and because it was never
promoted out of a comment, no wrong mapping was ever asserted in RDF.

Route matters here, and is recorded so nobody repeats the dead ends. Four
instruments were unreachable or useless: `browser.ihtsdotools.org` Snowstorm
(HTTP 403), BioPortal SNOMEDCT class pages (HTTP 403), `athena.ohdsi.org` API
(HTTP 403), and `snomedbrowser.com`, which is now a parked domain redirecting to
an unrelated site. General web search returned no authoritative FSN for either
code. `tx.fhir.org` answered both immediately.

**Two findings survive beyond the digits.**

First, the correction was itself a claim requiring an instrument. An external
review supplied the right answer with plausible sources, and adopting it on that
basis would have replaced an unverified identifier with an unverified identifier.
The digits happened to be right; the method would have been wrong, and the next
time it would not be.

Second, **the identifier is resolved but the mapping is not.** SNOMED's concept
is a *procedure*, and its inactive FSN shows it was retyped from
"(regime/therapy)". SSTIM's `sstim:SensoryStimulation` is a BFO process class
covering experimental, expressive and accessibility purposes with no clinical
commitment. Whether that is `skos:closeMatch`, `skos:broadMatch` from the SNOMED
side, or no assertion at all is a modelling decision for the sense review, not a
lookup. SNOMED's sense is one row in the inventory, and on present evidence it
looks narrower than SSTIM's.

**Applied 2026-08-22** to `static/ontology/sstim-alignments.ttl`, on an explicit
maintainer instruction naming the file
([ADR 0004](../decisions/0004-protected-ontology-files.md), `CLAUDE.md` §3.4).
The comment now records the audit beside the 2026-07-10 MeSH one, in the same
form: dated finding, named instrument, explicit non-assertion with its reason.
No mapping is asserted in either direction. The edit changed the module's
sha256, so `manifest.json` digests were resynchronized with
`node scripts/sstim-manifest.mjs sync-checksums`; the module digest and the Full
profile rollup both moved.

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
stimulation process.

A caution on the justification, because an earlier draft of this section
overclaimed it: **BFO mereology is not restricted to processes.** Continuants
stand in part-whole relations too, which is why a hand is part of an organism.
BFO does not by itself rule the candidates below in or out. What follows is a
statement about the **current SSTIM model**, in which these are the relevant
process-mereological entities and the others enter through participation,
characterization or role:

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
mereological **in this model**.

One row is a modelling position rather than a finding: treating exposure as the
same process viewed from the recipient side is a choice SSTIM has effectively
made, not something the upper ontology forces. It belongs in the decision list
below, not in the table as settled fact.

---

## The causal chain, used as an instrument

Most of what looks like disciplinary polysemy is disagreement about **where on
one chain** the word points:

```text
stimulus -> delivery/presentation -> sensory transduction -> afferent processing
         -> sensory-system activity -> percept/perception -> response/outcome
```

An experimenter saying "stimulation" often means delivery. A physiologist may
mean transduction or afferent activity. A practitioner may mean the percept. A
marketer may mean the response. These are different positions, not different
words, and the disagreement exists **before** disciplinary polysemy is added on
top.

This makes the chain the better instrument for the inventory's `relation to the
SSTIM sense` field: ask which position a sense denotes, then derive the relation,
rather than assigning exact/narrower/overlapping by feel.

**Which chain positions exist as SSTIM terms:**

| Position | SSTIM term |
|---|---|
| Stimulus, and its specification | `sstim:StimulusSpecification` |
| Delivery, as a process | `sstim:Stimulation`, `sstim:SensoryStimulation` |
| Sensory transduction | **absent** |
| Afferent processing | **absent** |
| Mechanism, as an explanation | `sstim:StimulationMechanism` |
| Percept, perception | **absent** |
| Response, observation | `sstim:ParticipantObservation` |

**The clause that decides the plant question is not a term.** "Afferent
processing" appears only as prose inside the definition of
`sstim:SensoryStimulation`. It carries the scope decision, and it cannot be
reasoned over, mapped to an external vocabulary, or disputed precisely, because
it is not an inspectable entity.

That asymmetry is the point. It does **not** follow that every absent position
deserves a class. Adding seven would repeat the duplicate-hierarchy error
[SENSORY_TAXONOMY_REVIEW](SENSORY_TAXONOMY_REVIEW.md) already documented when it
rejected an external proposal's ten new OWL classes. Use the chain to decide
which distinctions SSTIM must represent, and add only those.

## Three intentionality variables, not one purpose

SSTIM's definition requires a "declared purpose". That single clause is doing the
work of three independent variables:

1. Was the sensory input **deliberately delivered**?
2. Was a particular **response intentionally elicited or measured**?
3. Was a **benefit to the recipient** intended?

| Case | Delivered | Response sought | Benefit intended |
|---|---|---|---|
| Ordinary cooking smells | no | no | no |
| Checkerboard during EEG | yes | yes | no |
| Perfume introduced into a shop | yes | yes | no (not to the recipient) |
| Calming sensory session | yes | yes | yes |

Separating them matters for two reasons.

**It keeps "intentional" from sliding into "therapeutic".** A researcher
presenting a checkerboard purely to measure a VEP is unambiguously performing
intentional sensory stimulation with no benefit intended, and any definition that
implies otherwise is wrong in a direction that also breaches `CLAUDE.md` §3.5.

**It explains the sensory marketing stress test.** Perfume in a shop scores
yes/yes/no. SSTIM's single "purpose" clause cannot see the difference between
variable 2 and variable 3, which is exactly why the case falls inside the
definition and still feels wrong. The stress test is not evidence that the
definition is too broad; it is evidence that one clause is carrying two
distinctions.

## Definition authority, and the drift that exposed it

The plant analysis surfaced a divergence that matters independently of plants:

| Text | Requirement | Plants |
|---|---|---|
| `sstim:SensoryStimulation` `skos:definition` | sensory transduction **and afferent processing** | excluded |
| [`SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md) | transduction by sensory receptors | ambiguous |

Two questions follow, and the first is decidable now without any research:

1. **Which text is normative** when the canonical RDF definition and the concept
   document disagree?
2. Was "afferent" an intentional scope decision, or a side effect of
   [ADR 0034](../decisions/0034-neuromodulation-relation-and-neural-target-axis.md),
   whose subject was sensory-route versus direct-neural rather than neural versus
   non-neural organisms?

**Proposed guard, not yet implemented.** A release check so the two cannot
silently diverge again. There is precedent and a place to put it: `make
truth-audit` already enforces cross-file agreement for version DOIs across
`void.ttl`, `CITATION.cff`, `releaseMetadata.js` and `CURRENT_STATE.md`, and
`scripts/sstim-definition-coverage.py` already checks definition quality. Neither
compares an RDF definition against its prose counterpart. Extending the latter is
a small change to an existing script rather than new machinery.

## Protocol, execution, event: the layer exists, one relation does not

Checked 2026-08-22, because an external review asked whether SSTIM lacks a
neutral realization concept. It does not:

- `sstim:SensoryStimulationIntervention` is `subClassOf COB_0000082`
  ("planned process"), chosen deliberately over the obsolete OBI_0000011 because
  "an intervention need not be completely executed", verified via OLS 2026-07-10.
  So "intervention" here carries planned-process semantics, not therapeutic ones.
- `sstim:SensoryStimulation` is itself `subClassOf BFO_0000015`, a process class,
  so particular occurrences instantiate it directly. A checkerboard presented
  only to elicit a VEP is an instance of `SensoryStimulation` and simply not an
  instance of `SensoryStimulationIntervention`.

**The gap is the relation, not a class.** `describesStimulation`
(`StimulusSpecification` to `Stimulation`) is the **only** property in the whole
ontology whose range is `Stimulation` or any subclass of it. `followsProtocol`
links a `Preset` to a `SensoryStimulationProtocol`; `implementsProtocol` links
software to a protocol. Nothing links a **protocol to the process that realizes
it**. The three-layer chain is therefore complete at the specification end and
broken at the protocol end.

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
| Environmental sensing and stimulus response | Plant sensory biology | **probably disjoint from `SensoryStimulation`, narrower than `Stimulation`** | The "afferent processing" clause appears to settle it; verify whether that was deliberate |

## Three stress tests, and how to read them

SSTIM's definition requires a process, structured input, a sensory route,
specified parameters and a declared purpose. It nowhere requires a human
recipient: there is no `Participant`, `Subject` or `Recipient` class in the
ontology, only `ParticipantObservation` and `ParticipantEngagementMode`. And it
admits any declared purpose, including "expressive" and "informational".

### 1. Non-human animals

Animal sensory enrichment satisfies every clause on a plain reading, and appears
nowhere in the vocabulary.

### 2. Sensory marketing

Deliberate shaping of consumer sensory experience also satisfies every clause:
designed, parameterized, declared purpose. Also absent.

### 3. Plants, and this one may already be answered

Plants test something the other two do not. Animals have nervous systems and
familiar sensory organs; the animal case only asks whether a non-human recipient
is in scope. Plants ask the harder question:

> **Does "sensory" mean neural sensation, or the broader biological detection and
> transduction of environmental information?**

**The two SSTIM definitions appear to answer this already, and they answer it
differently from each other.** Compare the parent and the child:

- `sstim:Stimulation` elicits, perturbs, regulates or probes "an identified
  **biological**, sensory, or neural process". Plant photomorphogenesis is a
  biological process, so plant stimulation qualifies.
- `sstim:SensoryStimulation` requires a route that "engages canonical sensory
  transduction **and afferent processing**". *Afferent* denotes conduction toward
  a central nervous system. Plants have none.

So on the current OWL text, **plant stimulation is `Stimulation` but not
`SensoryStimulation`**, and the clause doing the work is "afferent processing".
The same clause admits animals cleanly (they have afferent processing) and does
nothing about marketing (humans do too). One clause resolves two of the three
stress tests.

Two things must be checked before this is treated as the answer:

1. **Is the clause load-bearing by design or by accident?** The definition cites
   [ADR 0034](../decisions/0034-neuromodulation-relation-and-neural-target-axis.md),
   whose subject is the sensory-route versus direct-neural distinction. "Afferent
   processing" may have been written to separate SSTIM's two families, with the
   exclusion of non-neural organisms an unintended side effect.
2. **The prose definition does not agree with the OWL definition.**
   [`SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md) says the input is
   "intended to be transduced by sensory receptors or to alter the sensory
   evidence available to the recipient", with no afferent requirement. The formal
   definition excludes plants; the plain-language one is ambiguous about them.
   That divergence is a finding in its own right, independent of how the plant
   question is settled.

#### Terminology for the plant sense

The dominant umbrella in plant science is not "plant sensory stimulation". For
corpus and terminological search, prefer:

| Term | Status | Note |
|---|---|---|
| **plant sensory biology** | Field label | Broad study of sensing and perception in plants |
| **plant sensory perception** | Related term | Detection and interpretation of environmental cues |
| **environmental sensing in plants** | Neutral umbrella | Avoids anthropomorphic implication |
| **plant stimulus perception and response** | Safest technical umbrella | Follows the stimulus, transduction, response chain |
| **plant sensory stimulation** | Usable working phrase | Understandable, but not the established field term |
| plant stimulation | Too broad | Includes hormonal, nutritional and chemical growth stimulation |
| plant neurobiology | Contested, and instructive | See below |
| plant cognition, plant intelligence | Related, controversial | A separate debate SSTIM does not need to enter |
| phytosensory stimulation | Avoid | No established usage found; a coinage if used |
| **phytostimulation** | **False friend. Do not reuse** | Already denotes rhizosphere-mediated processes in phytoremediation, and hormetic plant stimulation in another literature |

Candidate hyponyms and neighbours, for the inventory's in-community synonyms
field: mechanostimulation, mechanosensing and mechanoperception,
thigmomorphogenesis, thigmotropism, thigmonasty; photoperception,
photomorphogenesis, phototropism, photoperiodism; thermosensing and
thermomorphogenesis; gravisensing and gravitropism; hydrotropism and
osmosensing; chemosensing, nutrient sensing, hormone perception and VOC
signalling; acoustic and sound-vibration stimulation, phytoacoustics; and plant
electrophysiology.

Two boundaries will need deciding. Where does sensory stimulation end and generic
abiotic stress or environmental exposure begin (wounding, wind, rain, salinity)?
And is a grower's repeated mechanical stimulation of seedlings a stimulation
process under SSTIM or an agricultural practice outside it?

#### The precedent worth reading first

"Plant neurobiology" attracted a signed objection from roughly three dozen plant
biologists: Alpi et al., *Trends in Plant Science* 12(4):135-136, 2007
([PMID 17368081](https://pubmed.ncbi.nlm.nih.gov/17368081/)), arguing there is no
evidence for neurons, synapses or a brain in plants and that the framing rested
on "superficial analogies and questionable extrapolations". A published response
defended the term, so the debate is live rather than settled.

SSTIM stands in the mirror image of that dispute. Plant neurobiology extended
neural vocabulary to non-neural organisms. Extending "sensory stimulation" to
plants would do the same thing with the same vocabulary, and would attract the
same objection from the same community. That is not a reason to decide either
way. It is a reason to decide **explicitly**, and to record the reasoning where
a plant scientist can find it.

---

## How to read all three tests

These are hypotheses to test, not defects to repair. Four outcomes are available
and the review must pick one explicitly:

1. **The definition is correctly broad.** SSTIM is a universal standard
   ([SSTIM_DIRECTIONS](SSTIM_DIRECTIONS.md)), the vocabulary is merely
   incomplete, and these are coverage gaps like any other.
2. **The definition is accidentally broad.** A clause is missing, and it should
   be added deliberately rather than discovered later by someone else.
3. **The definition is correctly broad and the declared project scope is
   narrower.** Then the narrowing is a scope decision that must be written down,
   not left to the fact that nobody encoded a zoo.
4. **The definition is broad at the generic level, and specialized recipient or
   domain subclasses restrict operational applicability.** SSTIM is already
   shaped this way: `Stimulation` is the neutral umbrella and
   `SensoryStimulation` the specialized child, so outcome 4 is partly
   implemented. It would let SSTIM recognize a generic stimulus-perception
   process without implying that human neurotechnology, plant mechanostimulation
   and sensory marketing share one operational profile.

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
   recorded non-assertion with its reason is a result. The SNOMED CT identifier
   above is resolved; what remains is the modelling decision about which mapping
   relation, if any, to assert. `tx.fhir.org` is the working instrument for
   SNOMED lookups. This stream needs no interviews and can start immediately.
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

Recorded here as repo truth pending a decision. No ADR is opened yet; item 7 is
decidable now and the rest are not.

1. Which attested sense, if any, `sstim:SensoryStimulation` is coextensional with.
2. The formal relation to each other attested sense.
3. Whether the definition is correctly broad, accidentally broad, or correctly
   broad with a narrower declared scope.
4. Whether `226056003` "Sensory stimulation (procedure)", now verified, warrants
   `skos:closeMatch`, a `broadMatch` from the SNOMED side, or no assertion, given
   that SNOMED types it as a clinical procedure and SSTIM as a process class.
5. Whether treating exposure as the same process from the recipient side is
   SSTIM's settled position, since the meronymy analysis currently assumes it.
6. Whether `SensoryStimulation` requires a nervous-system-bearing recipient, and
   whether the "afferent processing" clause was written to do that work.
7. **Which text is normative** when the RDF definition and the concept document
   disagree, and whether a drift check enforces it.
8. Whether "declared purpose" should split into deliberate delivery, intended
   response, and intended recipient benefit.
9. Which chain positions warrant SSTIM terms, given that `AfferentProcessing`
   currently carries a scope decision without being inspectable.
10. Whether a protocol-to-execution realization relation should exist.
11. Which lexical variants and synonyms are genuine `altLabel`s of the existing
    concept, and which apparent synonyms are separate concepts.
12. Whether any sense warrants its own concept in the scheme, and if so under
    which relation.

## Not proposed

- No `.ttl` edit, until 1 through 6 are decided.
- **No disciplinary sense added as an `altLabel`**, under any circumstance.
- No `hiddenLabel` used to park semantic alternatives. It is for search noise.
- No new OWL classes for senses before the relation is established, which would
  repeat the duplicate-hierarchy error
  [SENSORY_TAXONOMY_REVIEW](SENSORY_TAXONOMY_REVIEW.md) already documented.
