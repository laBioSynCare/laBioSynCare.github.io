# ADR 0034 — Neuromodulation: overlap relation, neural-target axis, and route scoping

**Status:** Proposed — 2026-07-22

Introduces `sstim:Neuromodulation` and formalizes its relation to
`sstim:SensoryStimulation`. Supersedes nothing; extends the boundary prose in
[`docs/concept/SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md)
§"Direct neural stimulation" into RDF, and retires the `skos:editorialNote`
escape hatch in `sstim-sh:TechniqueShape`.

Touches the protected term files ([ADR 0004](0004-protected-ontology-files.md);
`CLAUDE.md` §3.4). **This ADR does not authorize those edits** — per
[`IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md), each change set needs
its own explicit approval. Implementation approval is recorded on acceptance.

---

## Context

SSTIM says "neuromodulation" exactly twice in the released term space, both times
about focused ultrasound: `sstim-v:mechUltrasonic` and
`sstim-v:techUltrasoundNeuromod`. The concept the field is organized around is
otherwise absent, and the ontology cannot answer four questions a domain
consumer will ask immediately:

1. How does sensory stimulation relate to neuromodulation?
2. Does neuromodulation require stimulation?
3. Which sensory techniques and modalities are most studied / best evidenced for
   neural-level effects?
4. Which claims and evidence link the two?

Three concrete symptoms of the gap:

**The SHACL escape hatch.** `sstim-sh:TechniqueShape`
([`sstim-shapes.ttl:1023-1043`](../../static/ontology/sstim-shapes.ttl)) requires
every technique to declare `sstim:techniqueModality`, then adds an `sh:or` branch
exempting anything carrying a `skos:editorialNote`. That branch exists for one
individual: `techUltrasoundNeuromod`, which has no perceived modality. An
exemption keyed on the *presence of a free-text annotation* is not a constraint;
it is an exception list that grows every time a boundary technique is cataloged.

**A mis-typed released individual.** `techUltrasoundNeuromod` is typed
`sstim:NonEntrainmentTechnique` ⊑ `sstim:SensoryStimulationTechnique`, while its
own `skos:definition` says it produces "no audible percept" and its
`skos:editorialNote` says it has "no perceived sensory modality." A technique
that reaches neural tissue without traversing a sensory receptor is not a sensory
stimulation technique. The escape hatch is downstream of this type error.

**The boundary is stated only in prose.**
[`SENSORY_STIMULATION.md:370-373`](../concept/SENSORY_STIMULATION.md) already
names the discriminating axis — *"the practical boundary is the intended causal
route: sensory stimulation acts through sensory receptors and afferent
processing, while direct neurostimulation targets neural tissue through another
energy-transfer mechanism"* — but nothing in the graph encodes it.

### The preliminary model

A predecessor ontology (pre-SSTIM naming) placed `Neuromodulation` as a direct
`owl:Thing` child with subclasses `BrainStimulation` (→ `ElectricalStimulation`),
`ChemicalStimulation`, `CognitiveModulation` (→ `Context`, `Language`),
`SensoryStimulation` (→ `AudiovisualStimulation`, `GuidingStimulation`,
`TactileStimulation`), and `TranscranialStimulation` (→
`TranscranialMagneticStimulation`).

It is not adoptable as drawn, for reasons that are specific rather than
structural:

- **`SensoryStimulation ⊑ Neuromodulation` is false and, worse, off-design.**
  False because sensory substitution for accessibility, a sonification readout,
  and an aesthetic soundscape are sensory stimulation without being
  neuromodulation. Off-design because SSTIM defines `SensoryStimulation` as the
  *delivery process only* — [`sstim-core.ttl:100`](../../static/ontology/sstim-core.ttl):
  "The class identifies the delivery process; any mechanism, response, or outcome
  is represented separately and requires its own evidence." Subsumption would
  assert, for every instance, that neural activity is modulated — smuggling a
  mechanism claim into the delivery class and bypassing the entire evidence layer
  that [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) exists to
  enforce.
- **Specific over-strong subsumptions.** `ElectricalStimulation ⊑
  BrainStimulation` is false (TENS is electrical and peripheral).
  `ChemicalStimulation ⊑ Neuromodulation` is false (gustatory and olfactory
  stimulation are chemical and sensory).
- **`CognitiveModulation → Context, Language`** is a category error: context and
  language are not kinds of cognitive modulation.
- **Modality-as-subclass** (`AudiovisualStimulation`, `TactileStimulation`)
  reintroduces the combinatorial class explosion SSTIM avoids by putting modality
  on a property (`sstim:techniqueModality`) against a modality vocabulary.

**Not a defect:** `BrainStimulation` and `TranscranialStimulation` being
non-disjoint siblings with TMS under both. OWL siblings need not partition, and
multiple inheritance is legitimate; a partition, where wanted, is asserted with
`owl:disjointWith` / `owl:AllDisjointClasses` plus a covering axiom. The tree
*rendering* forced TMS to appear under one parent only, which is a UI artifact,
not an ontology error. This ADR takes the constructive form of that observation:
where a class is genuinely determined by facet values, **define** it with a
restriction rather than asserting a primitive subclass.

---

## Decision

### 1. Overlap, not subsumption

```turtle
sstim:Neuromodulation a owl:Class ;
    rdfs:subClassOf bfo:0000015 ;          # process
    skos:definition "A process whose intended proximal target is the modulation
      of neural activity, by any causal route. The class identifies the intended
      target of the process; whether the modulation occurred is an evidence
      question represented separately."@en .

sstim:SensoryNeuromodulation a owl:Class ;
    owl:equivalentClass [ a owl:Class ; owl:intersectionOf
        ( sstim:SensoryStimulation sstim:Neuromodulation ) ] .
```

`SensoryStimulation` and `Neuromodulation` **overlap**; neither subsumes the
other. `SensoryNeuromodulation` is a *defined* class (the intersection), so it
asserts nothing beyond the two memberships. A `skos:scopeNote` on both parents
records why subsumption was rejected, so the question is not re-litigated.

Answers **CQ1**: sensory stimulation is not a kind of neuromodulation, and only
*some* sensory stimulation is neuromodulation — namely the part whose intended
proximal target is neural activity.

### 2. Three axes, kept separate

The preliminary model tangled three things that SSTIM must keep apart, because
each has a different epistemic cost and a different authority:

| Axis | Question | Cost | Where it lives |
|---|---|---|---|
| **Route** | *How* is neural tissue reached? | Free — physical fact | `sstim:neuralAccessRoute` |
| **Target** | *What* is the process aimed at? | Cheap — declarable design intent | class membership in `sstim:Neuromodulation`; `sstim:mechanismTargetLevel` |
| **Effect** | *Did* it modulate neural activity? | Expensive — tiered evidence | `sstim:EvidenceAssessmentClaim` |

Conflating target with effect is the standard over-claim failure in this
literature and is exactly what ADR 0018/0027 guard against. Conflating route with
target is what makes the preliminary tree unusable.

### 3. `neuralAccessRoute` is scoped to where it varies

Raised in review 2026-07-22: *every* sensory process reaches the nervous system
through receptor-mediated afferent pathways, so a route property asserted across
all sensory techniques is entailed rather than informative — it would be a
constant column.

This is correct, and it settles the property's scope: **route is declared only by
non-sensory neuromodulation techniques, where it actually varies.**

```turtle
sstim:NeuromodulationTechnique a owl:Class ;
    rdfs:subClassOf iao:0000030 .

sstim:neuralAccessRoute a owl:ObjectProperty ;
    rdfs:domain sstim:NeuromodulationTechnique ;
    rdfs:range  sstim:NeuralAccessRoute .

sstim-v:NeuralAccessRouteScheme a skos:ConceptScheme ;
    skos:hasTopConcept
        sstim-v:routeReceptorMediatedAfferent,   # sensory — definitional
        sstim-v:routeTranscranialField,          # TMS, tES
        sstim-v:routeImplantedElectrode,         # DBS, VNS
        sstim-v:routeFocusedAcoustic,            # FUS
        sstim-v:routeChemicalPharmacological .
```

For sensory techniques the route is definitional and left unstated; asserting it
per-individual would be redundant annotation. The route vocabulary still lists
`routeReceptorMediatedAfferent` because it is the value that *characterizes* the
sensory branch in queries and in the `SensoryNeuromodulation` scopeNote.

Answers **CQ2**: no, neuromodulation does not require stimulation, and the
non-sensory routes enumerate exactly why — transcranial field, implanted
electrode, focused acoustic, and pharmacological routes are neuromodulation
without being sensory stimulation.

**The requirement is enforced in SHACL, not OWL.** An `owl:hasValue` restriction
on `SensoryStimulationTechnique` was considered and rejected — see Alternatives.

The single `sstim-sh:TechniqueShape` with its `sh:or` is replaced by **two
shapes with disjoint targets**, each stating one obligation:

| Shape | Targets | Requires |
|---|---|---|
| `sstim-sh:SensoryTechniqueShape` | `sstim:SensoryStimulationTechnique` | `sstim:techniqueModality` `minCount 1` |
| `sstim-sh:NeuromodulationTechniqueShape` | `sstim:NeuromodulationTechnique` | `sstim:neuralAccessRoute` `minCount 1` |

This is strictly better than an `sh:or` over one shape. Each obligation attaches
to the class that actually bears it; a technique that is *both* (sensory
neuromodulation — `techGamma40Auditory`, `techPhoticDriving`) must satisfy both,
which is correct and was not expressible before. The `skos:editorialNote` branch
disappears entirely rather than being restated: there is no longer a condition to
exempt, because the two populations are now distinguished by type instead of by
the presence of free text.

Matches house style — [`sstim-core.ttl:975`](../../static/ontology/sstim-core.ttl):
"classes are enforced in SHACL, not by type inference."

### 4. One target-level axis, reused for mechanisms and outcomes

`sstim-v:StimulationMechanismScheme` already partitions along neural-target lines
without any new data; nothing labels the partition:

- **neural-oscillatory** — `mechFFR`, `mechASSR`, `mechSSVEP`, `mechSSSEP`,
  `mechThalamocortical`, `mechGamma40`, `mechClosedLoopPhase`
- **autonomic** — `mechAutonomic`
- **perceptual-cognitive** — `mechAttentional`, `mechMasking`, `mechMultisensory`
- **receptor-peripheral** — `mechMechanoreceptive`, `mechStochastic`,
  `mechStartle`, `mechAuditoryMotor`
- **neural-direct** — `mechUltrasonic`

A single controlled axis serves two subjects:

```turtle
sstim-v:TargetLevelScheme a skos:ConceptScheme ;
    skos:hasTopConcept sstim-v:levelNeuralOscillatory, sstim-v:levelNeuralDirect,
        sstim-v:levelAutonomic, sstim-v:levelPerceptualCognitive,
        sstim-v:levelReceptorPeripheral .

sstim:mechanismTargetLevel a owl:ObjectProperty ;
    rdfs:domain sstim:StimulationMechanism ;   rdfs:range sstim:TargetLevel .

sstim:outcomeTargetLevel a owl:ObjectProperty ;
    rdfs:domain sstim:EvidenceOutcomeConcept ; rdfs:range sstim:TargetLevel .
```

Tagging mechanisms makes **CQ3** answerable today, from data already released.
Tagging outcome concepts makes **CQ4** answerable as the evidence corpus grows —
`EvidenceAssessmentClaim → AssessmentProposition → EvidenceOutcomeConcept`
already exists per [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md)
/ [ADR 0028](0028-atomic-claim-propositions-and-public-expressions.md); only the
neural-level marker is missing.

### 5. "Most studied" and "best evidenced" stay distinct

Two different queries against two different structures, and the ontology asserts
neither as a class-level fact:

- **most studied** — count distinct `sstim:EvidenceBasis` / `BibliographicReference`
  per technique. A bibliometric fact.
- **best evidenced** — max `sstim:hasEvidenceTier` over claims whose proposition's
  outcome is neural-level. An assessment fact.

Neither is "most effective." Efficacy ranking is not a query SSTIM answers, and
no property will be added that invites the reading. A `skos:scopeNote` on
`TargetLevelScheme` states this.

### 6. Graph navigator: facet scoping in software

Per maintainer 2026-07-22: *change the BSC Lab software to allow correct
navigation rather than distorting the RDF formalization.* A `skos:Collection`
minted so a UI filter can match it would be a navigator artifact inside a citable
released vocabulary. **Rejected on that basis.**

A neuromodulation perspective is cross-cutting: the new OWL classes, the route
scheme, and the *subset* of mechanisms whose `mechanismTargetLevel` is neural.
`graphScopeNodeVisible`
([`OntologyGraph.svelte:335-352`](../../src/ui/graph/OntologyGraph.svelte))
currently matches only whole `skos:ConceptScheme` membership or class local name,
so it cannot express "concepts with predicate P = value V". Three additive
software changes, no RDF accommodation:

1. **`src/rdf/graph.js`** — the SKOS concept pass
   ([`graph.js:231-253`](../../src/rdf/graph.js)) gains an optional facet
   collection: for a configured predicate list, attach `data.facets` as
   predicate→values. Additive to existing node data (`kind`, `layer`, `scheme`,
   `notation`, `iri`); no existing consumer changes.
2. **`OntologyGraph.svelte`** — a `SCOPE_FACETS` map beside `SCOPE_SCHEMES` /
   `SCOPE_CLASSES`, and one matcher branch in `graphScopeNodeVisible`.
3. **`GRAPH_SCOPES`** — a `{ value: 'neuromodulation', label: 'Neuromodulation' }`
   entry, which inherits shareable `?view=neuromodulation` links from 2cee5ab at
   no extra cost.

The facet matcher is general, not neuromodulation-specific: it is the mechanism
any future value-based perspective needs.

---

## Competency queries

```sparql
# CQ1 — sensory stimulation that is also neuromodulation
SELECT ?p WHERE { ?p a sstim:SensoryStimulation, sstim:Neuromodulation }

# CQ2 — neuromodulation techniques that are NOT sensory stimulation.
# Post-§9 this returns five rows across three routes: TMS/tDCS/tACS
# (transcranial field), DBS (implanted electrode), FUS (focused acoustic).
SELECT ?t ?route WHERE {
  ?t a sstim:NeuromodulationTechnique ; sstim:neuralAccessRoute ?route .
  FILTER NOT EXISTS { ?t a sstim:SensoryStimulationTechnique }
}

# CQ3a — sensory techniques proposing neural-level mechanisms ("most studied"
#        needs the EvidenceBasis count; this is the mechanism-hypothesis view)
SELECT ?tech (COUNT(DISTINCT ?mech) AS ?n) WHERE {
  ?tech a sstim:SensoryStimulationTechnique ; sstim:proposedMechanism ?mech .
  ?mech sstim:mechanismTargetLevel ?level .
  FILTER(?level IN (sstim-v:levelNeuralOscillatory, sstim-v:levelNeuralDirect))
} GROUP BY ?tech ORDER BY DESC(?n)

# CQ4 — evidence linking a sensory technique to a neural-level outcome
SELECT ?tech ?tier ?outcome WHERE {
  ?claim a sstim:EvidenceAssessmentClaim ;
         sstim:evaluatesSubject ?tech ;
         sstim:hasEvidenceTier ?tier ;
         sstim:assessesProposition ?prop .
  ?prop  sstim:hasOutcomeConcept ?outcome .
  ?outcome sstim:outcomeTargetLevel sstim-v:levelNeuralOscillatory .
  ?tech  a sstim:SensoryStimulationTechnique .
} ORDER BY DESC(?tier)
```

CQ4 returns sparsely against the current corpus. That is the honest answer, not a
defect: it reports how much neural-level evidence SSTIM actually holds.

---

## Consequences

- **`techUltrasoundNeuromod` is retyped** (§7) — the one genuinely breaking
  element. It has shipped as a `NonEntrainmentTechnique` in snapshots 0.3.0
  through 0.8.0; those remain immutable and resolvable.
- **`sstim-v:TechniqueScheme` is relabelled** (§8). IRI unchanged, so no link rot
  and no altered entailment; display consumers see a new string.
- **Four new technique individuals** (§9), which grow
  `skos:hasTopConcept` on the renamed scheme and appear in the `technique` graph
  perspective. They are non-sensory, so they will render without a modality edge —
  expected, not a data gap.
- **`sstim-sh:TechniqueShape` is replaced by two targeted shapes**, so this
  touches validation semantics. `make validate` must pass before and after, and
  negative fixtures should assert both new failure modes: a
  `SensoryStimulationTechnique` without `techniqueModality` fails (today it
  passes by attaching any editorial note), and a `NeuromodulationTechnique`
  without `neuralAccessRoute` fails.
- **Version bump and snapshot.** Core, vocab, and shapes all gain terms →
  0.9.0 + `static/ontology/0.9.0/`, per the release mechanism.
- **WIDOCO / pyLODE regeneration** is automatic in `pages.yml` (artifact only,
  ADR 0023) — no committed output.
- **w3id routes.** New terms are fragments on the existing `sstim#` and
  `sstim/vocab#` roots; no new route needed. The bare-root catalog coupling flagged
  in 008ebc7 is unaffected.
- **`sstim-alignments.ttl`** gains candidates — Wikidata has verified items for
  neuromodulation, TMS, tDCS, and DBS. Alignment is deferred to its own pass,
  consistent with the file's "verified against live Wikidata" discipline.
- **No user-facing copy changes.** This ADR adds descriptive vocabulary about a
  scientific domain; it authorizes no claim about BSC presets. `CLAUDE.md` §3.5
  is untouched and unrelaxed — modeling neuromodulation is not claiming to
  perform it, and the separation in §2 above is what keeps that true structurally
  rather than by convention.

---

## Alternatives considered

- **Adopt the preliminary tree as drawn.** Rejected: `SensoryStimulation ⊑
  Neuromodulation` bypasses the evidence layer, and `ElectricalStimulation ⊑
  BrainStimulation` / `ChemicalStimulation ⊑ Neuromodulation` /
  `CognitiveModulation → Context, Language` are independently false.
- **`Neuromodulation ⊑ SensoryStimulation`.** Rejected trivially: TMS, DBS, and
  pharmacological neuromodulation traverse no sensory receptor.
- **`owl:hasValue` restriction fixing the route on `SensoryStimulationTechnique`.**
  Rejected, though note the reason changed once §7 was settled. Against the
  *current* vocabulary the restriction is an entailment landmine: with
  `neuralAccessRoute` functional and the route individuals mutually distinct, the
  mis-typed `techUltrasoundNeuromod` would render the ontology *inconsistent*
  under HermiT rather than merely non-conformant. §7 removes that individual from
  the class, so the restriction would become consistent — but it stays rejected
  on three grounds that do not depend on the type error: it asserts at schema
  level exactly the constant column §3 declined to assert at instance level; it
  buys no query power, since the class membership is already the answer; and it
  would force `neuralAccessRoute`'s domain to widen into a union, which the
  domain/range lint in [`IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md)
  flags. Reasoner cost for zero information.
- **Route property on every technique, sensory included.** Rejected per review:
  constant across the sensory branch, therefore uninformative annotation cost on
  ~28 individuals.
- **Two target-level axes (one for mechanisms, one for outcomes).** Rejected: the
  value set is identical, and a shared scheme is what lets CQ3 and CQ4 join.
- **`skos:Collection` in `sstim-vocab.ttl` for the graph perspective.** Rejected
  by maintainer 2026-07-22: the navigator must adapt to the formalization, not
  the reverse.
- **Document-only treatment** (extend `SENSORY_STIMULATION.md`, add no terms).
  Rejected: leaves the SHACL escape hatch and the type error in place, and
  answers none of CQ1–CQ4.

---

## Resolved on review, 2026-07-22

The three questions left open in the first draft are decided below. Two of them
turned out to be forced by the design rather than open to preference.

### 7. `techUltrasoundNeuromod` is retyped, not dual-typed

`sstim:NonEntrainmentTechnique` is **removed**; `sstim:NeuromodulationTechnique`
replaces it.

Dual-typing is not a safe compatibility option here, because §3's two-shape
formulation makes it *fail validation*. Retaining `NonEntrainmentTechnique` keeps
the individual a `SensoryStimulationTechnique`, which puts it in the target of
`sstim-sh:SensoryTechniqueShape` and therefore obliges it to declare a
`sstim:techniqueModality`. It has none, and by its own `skos:definition` — "no
audible percept" — it can never acquire one. The conservative-looking option
produces a vocabulary that does not conform to its own shapes.

So the choice is not "correct but breaking" versus "incorrect but safe." It is
"correct" versus "non-conformant." That settles it.

The breaking surface is also narrower than it first appears. Snapshots
`0.3.0`–`0.8.0` are immutable and remain resolvable, so any consumer pinned to a
released version is unaffected. Only a consumer tracking mutable latest observes
the change, and what they observe is the withdrawal of a false statement — that
focused ultrasound is a sensory stimulation technique — which is the kind of
correction a versioned vocabulary is supposed to be able to make. The prior
typing is recorded as a comment block in `sstim-vocab.ttl` rather than deleted
silently, per the [ADR 0033](0033-framework-scope-and-generic-technique-deduplication.md)
precedent.

### 8. `TechniqueScheme` is relabelled "SSTIM Technique Vocabulary"

Maintainer decision on review: rename rather than mint a sibling scheme or accept
the mismatch. The argument for *which* name is that the identifier already made
this decision.

The scheme's IRI is `sstim-v:TechniqueScheme` — not `SensoryTechniqueScheme`.
Only the `skos:prefLabel` ever said "Sensory Stimulation Technique Vocabulary."
The label has therefore been narrower than its own identifier since 0.3.0, and
this ADR does not widen the scheme so much as bring the label into line with the
IRI that was chosen for it. Renaming to **"SSTIM Technique Vocabulary"** (with
`it`/`pt`/`es` translations reduced correspondingly) also keeps the label stable
against future widening: pharmacological neuromodulation, if ever cataloged,
needs no third rename.

Precision moves to a `skos:definition` on the scheme, which is where an extension
that grows belongs — stating that the scheme covers sensory stimulation
techniques and neuromodulation techniques, including non-sensory routes.

A sibling `NeuromodulationTechniqueScheme` was rejected because the two
populations **overlap** (§1): `techGamma40Auditory` and `techPhoticDriving` are
both. Splitting the scheme would force either duplicate `skos:inScheme`
membership or an arbitrary assignment of the overlap, and would break
`skos:hasTopConcept` as a complete technique enumeration — which the graph
navigator and the technique-scope perspective both rely on.

This is the mildest class of change at the RDF level: the IRI is unchanged, so no
link rot and no altered entailment. Display consumers see a different string;
a `skos:historyNote` and a CHANGELOG entry record it.

### 9. TMS, tDCS, tACS, and DBS are cataloged

Four non-sensory neuromodulation techniques are added — `techTMS`, `techTDCS`,
`techTACS`, `techDBS` — typed `sstim:NeuromodulationTechnique` and **not**
`sstim:SensoryStimulationTechnique`.

Three reasons, in ascending order of force:

1. **Consistency.** The "domain completeness" rationale is already invoked, in
   the released vocabulary, for focused ultrasound. Applying it to one technique
   while excluding its four most obvious siblings is arbitrary — and reads to an
   external consumer as an oversight rather than as a boundary.
2. **The route axis is otherwise untestable.** With FUS alone, the new
   `NeuralAccessRouteScheme` has exactly one populated value and CQ2 returns one
   row. Nothing would demonstrate that the axis discriminates. These four
   populate three distinct routes — transcranial field (TMS, tDCS, tACS),
   implanted electrode (DBS), focused acoustic (FUS) — which is enough to
   exercise the model. Pharmacological stays deliberately unpopulated; an empty
   route value is honest, an untested axis is not.
3. **tACS earns its entry specifically.** It is the direct non-sensory analogue
   of sensory entrainment: periodic, and targeting neural oscillations. Without
   it, `mechanismTargetLevel = levelNeuralOscillatory` is a sensory-only tag and
   CQ3 cannot contrast *entrainment via receptor-mediated route* against
   *entrainment via transcranial field*. That contrast is a substantial part of
   why modeling neuromodulation is worth doing at all — it is what turns the
   target-level axis from a label into a comparison.

This is why §8 and §9 interlock: the rename is what makes room for these four,
and these four are what make the renamed scheme's breadth real rather than
notional.

Scope risk is handled structurally, not by convention. Cataloging them as
`NeuromodulationTechnique` and never `SensoryStimulationTechnique` is precisely
what [`SENSORY_STIMULATION.md:364-384`](../concept/SENSORY_STIMULATION.md)
already says of them — *adjacent to* the core sensory-stimulation category,
named, not core. No BSC preset, framework, or implementation references them, and
`sstim:incorporatesTechnique` ([ADR 0033](0033-framework-scope-and-generic-technique-deduplication.md))
is the property that would have to be asserted for any capability implication to
arise. It is not.
