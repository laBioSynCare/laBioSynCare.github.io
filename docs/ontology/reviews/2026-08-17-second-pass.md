# Second-pass review — 2026-08-17

**Status:** findings only, nothing fixed.
**Companion to:** [the first pass](2026-08-17-ontology-vocabulary-and-data-review.md),
whose findings are not repeated here.
**Scope:** the same — 18 modules, 21 instance files, `dc1edb27..HEAD` — asked
different questions.

The first pass looked for *absence*: missing definitions, missing domains, terms
no data uses. This one looks for *incoherence*: validation that does not reach
the data it should, definitions that exist but do not define, structure that
disagrees with itself.

**Accepted from the first pass and recorded here so it is not lost:** the
maintainer has directed that the missing-`skos:definition` check be added to the
verification scripts. It is not implemented in this pass, which is notes-only,
and it should catch concepts as well as OWL terms — the 26 gaps were all SKOS
concepts, which is exactly the class of term the existing gates ignore.

---

## 1. Fifteen classes have data and no shape

Data of these types exists in the instance files, and **no SHACL shape targets
them**, so it conforms trivially — validation passes by not looking.

```
ComparatorDescriptor          ExposureDesignObjective
EntrainmentBasedTechnique     ExposureHypothesis
EvidenceAssessmentActivity    ExposureMeasurementRequirement
EvidenceOutcomeConcept        KnowledgeStatusActivity
NonEntrainmentTechnique       PlannedOutcomeSpecification
PopulationDescriptor          ProtocolRequirement
SensoryStimulationIntervention ResearchQuestion
ExploratoryProtocol
```

This is sharper than the first pass's coverage finding and in some ways worse.
There, terms had no data. Here there *is* data, and the gate reports conformance
on it without having checked anything.

Four of the fifteen are evidence-model classes from ADR 0027 —
`EvidenceAssessmentActivity`, `EvidenceOutcomeConcept`, `ResearchQuestion`,
`ExposureHypothesis`. That ADR built a careful provenance model and the parts of
it that carry committed data are the parts nothing validates.
`EvidenceAssessmentActivity` in particular is what ADR 0050's gate reaches
through `prov:wasGeneratedBy`.

**Disposition.** A gate listing instantiated-but-unshaped classes would be cheap
and would have caught this at the moment each type first appeared in data. That
is the same shape of check as the definition gate above, and could share it.

---

## 2. Whole schemes are untranslated, not scattered concepts

The first pass reported 276 English-only concepts. The structure behind that
number is worse than the number: **34 of the 63 concept schemes have zero
non-English labels** — not partial coverage, none.

```
DeliveryMediumScheme (27)   DeviceCapabilityScheme (30)  EffectDimensionScheme (21)
EcosystemRelationScheme (17) BodyPlacementScheme (15)     PerceivedModalityScheme (12)
StimulusPatternScheme (12)  EngagementOutcomeScheme (12) ComfortBoundaryScheme (9)
…and 25 more
```

No scheme is *partially* translated. So the vocabulary is cleanly divided into
schemes translated into four languages and schemes translated into none, which
means translation has been an all-or-nothing act per scheme and simply stopped
being performed. `PerceivedModalityScheme` is the sharpest case: the twelve
perceived modalities are English-only while the six sensory modalities they
bridge to are translated into four languages.

**Disposition.** The all-or-nothing pattern is actually good news — it means a
per-scheme coverage report is meaningful and a scheme can be closed out in one
pass. KR-16 currently has no metric; a count of fully-translated schemes over
total would make it trackable.

---

## 3. Duration datatypes disagree, and the split is not recorded

Nine duration properties range over `xsd:decimal`; **two range over
`xsd:integer`**: `sstim:actualDurationSeconds` and `sstim:durationSeconds`.

Both integers are session-level. `sstim:actualDurationSeconds` is the elapsed
time of a session instance, and it is compared against
`sstim:deliveredDurationSeconds` (decimal) by a SHACL-SPARQL constraint from
ADR 0048 — a constraint that already had a rounding bug when
`Math.round` could place elapsed below delivered. Comparing an integer against a
decimal is exactly the ground that bug grew in, and nothing records why one side
is coarser than the other.

Every Hz property, by contrast, is `xsd:decimal` without exception, including the
five added this week. So the inconsistency is specific to durations rather than
systemic.

**Disposition.** Decide whether a session duration is genuinely whole-seconds. If
it is, say so in the definition, because a reader comparing it to a decimal
sibling cannot currently tell whether the difference is meaningful. If it is not,
it is a datatype bug in a property a safety-adjacent constraint depends on.

---

## 4. Nineteen definitions are too thin to define

Not a style complaint — these are terms whose definition does not distinguish
them from a neighbour:

- `modalityOlfactory: "Perceived smell."` and `modalityGustatory: "Perceived
  taste."` — in a sensory stimulation standard, the sensory modalities deserve
  more than a two-word gloss. Compare `sstim:SensoryModality`'s own definition,
  which is careful.
- `paramLuminance: "The brightness of a visual stimulus."` and
  `paramVibrationIntensity: "The strength of a haptic stimulus."` — **mine, this
  week.** Both restate the label with an article.
- `approachEpidural: "Delivered into the epidural space."` — clinically real but
  says nothing a reader could not infer, in a scheme where the distinction from
  `approachIntrathecal` is the whole point.

**Disposition.** Low priority individually, but they cluster in the newest
schemes, which suggests the definition standard is drifting downward as the
vocabulary grows. Worth a bar — "a definition must distinguish the term from its
siblings" — more than worth a length check.

---

## 5. What came back clean, and it matters

Several checks I expected to find something found nothing. Recording them so the
two passes together read as a bounded audit rather than an open-ended one:

- **SKOS hierarchy is sound.** No `skos:broader` crosses a concept scheme, every
  `broader` has its reciprocal `narrower`, no concept is its own broader, and no
  scheme is empty. For a 525-concept vocabulary built over five months this is a
  genuinely good result.
- **No SHACL shape targets an undeclared class**, and **no `rdfs:domain` or
  `rdfs:range` references an undeclared term.** The 78 domain-less properties
  from the first pass are absences, not dangling pointers.
- **No two terms share a definition** — no copy-paste duplication anywhere in
  157 classes, 284 properties and 525 concepts.
- **No definition merely restates its label** by exact match. The nineteen in §4
  are thin by judgement, not by that test.
- **No instance data carries a future date**, and every `xsd:date` parses.
- **Every module header carries** `dct:title`, `dct:license`, `dct:description`
  and `owl:versionInfo`.
- **Every Hz property is `xsd:decimal`.**

---

## 6. Standing observation across both passes

Four of the findings across the two reviews are defects I introduced in the last
four days, in work that passed 27 gates: three notation collisions, a property
with no range, two thin definitions, twenty untranslated concepts.

The gates are good at what they were built to check and blind to what nobody has
thought to check yet — which is the argument for the definition gate the
maintainer has directed, and for the instantiated-but-unshaped gate in §1. Both
are cheap, both would have fired on my own work, and neither existed because
every previous defect of that kind was found by reading rather than by running.

The deeper pattern is that **each new gate in this repository was added after the
failure it prevents**. That is not avoidable in general, but the two proposed
here are the rare case where the failure has already happened and the gate has
not yet been written.
