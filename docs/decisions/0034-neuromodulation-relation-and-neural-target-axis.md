# ADR 0034 — Stimulation and neuromodulation: overlap, delivery, route, and neural-target axes

**Status:** Accepted — 2026-07-22 · implemented in SSTIM 0.9.0

Introduces a neutral stimulation layer around SSTIM, formalizes the overlap
between sensory stimulation and interventional neuromodulation, and establishes
how non-sensory electrical, magnetic/electromagnetic, acoustic/mechanical, and
chemical stimulation techniques are represented without forcing them into a
false class tree.

This decision extends the boundary prose in
[`docs/concept/SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md)
§“Direct neural stimulation,” reuses the delivery/perception separation from
[ADR 0010](0010-exposure-delivery-modality.md), and removes the
`skos:editorialNote` validation escape hatch from the technique contract.

The implementation touches protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4). Maintainer
approval to edit them was given in session on 2026-07-22 ("You have my full
authorization to edit ttl files and whatever you need to accomplish this
task"), and the migration shipped in SSTIM 0.9.0.

---

## Context

SSTIM currently uses “neuromodulation” only for focused ultrasound:
`sstim-v:mechUltrasonic` and `sstim-v:techUltrasoundNeuromod`. The wider concept
is absent. The graph therefore cannot represent the context needed to answer:

1. How do stimulation, sensory stimulation, and neuromodulation relate?
2. Which neuromodulation techniques are outside sensory stimulation?
3. How can electrical, magnetic/electromagnetic, acoustic, optical, mechanical,
   thermal, and chemical inputs be compared without treating any input kind as
   automatically sensory, neural, or brain-targeted?
4. Is a sensory system the *entry route*, the *target*, or merely the source of
   an accompanying percept?
5. Which proposed mechanisms, observations, and evidence claims connect a
   sensory technique to a neural outcome?

### Concrete defects in the current model

**The focused-ultrasound type is wrong, but retyping alone is insufficient.**
`techUltrasoundNeuromod` is explicitly a `sstim:NonEntrainmentTechnique`, hence
a `sstim:SensoryStimulationTechnique`, even though its intended intervention
route is focused action at a neural target rather than auditory sensory
transduction. Removing that explicit type would not solve the problem:
`sstim:proposedMechanism` and `sstim:hasStimulusTemporalStructure` currently have
`rdfs:domain sstim:SensoryStimulationTechnique`, so their retained triples would
infer the sensory type again.

The correction must therefore introduce a neutral technique superclass and
widen the domains of properties shared by sensory and non-sensory techniques
*before* retyping focused ultrasound.

**The SHACL escape hatch is structural, not ultrasound-specific.**
`sstim-sh:TechniqueShape` currently allows any sensory technique with a
`skos:editorialNote` to bypass its mechanism, temporal-structure, and modality
requirements. Five technique concepts carry such a note; Solfeggio tuning and
subliminal audio rely on the branch to omit a proposed mechanism, while focused
ultrasound relies on it to omit sensory modality. Free text must not control
structural conformance.

**The evidence layer is sensory-only.** `sstim:evaluatesSubject`,
`sstim:propositionSubject`, `sstim:basisIntervention`, and
`sstim:scopeInterventionOrContext`, together with their SHACL constraints,
currently admit `SensoryStimulationTechnique` but not a neutral stimulation or
neuromodulation technique. Cataloguing TMS, DBS, or targeted chemical delivery
without widening those positions would create techniques about which SSTIM
cannot make a conformant evidence assessment.

### What the preliminary tree gets wrong

The predecessor diagram is useful as an inventory prompt, but not as a
taxonomy. It puts `BrainStimulation`, `ChemicalStimulation`,
`CognitiveModulation`, `SensoryStimulation`, and `TranscranialStimulation` under
`Neuromodulation`, then places electrical, audiovisual, tactile, context, and
language concepts below them. That mixes independent questions:

- **objective/classification** — sensory stimulation or neuromodulation;
- **applied energy or agent** — electrical current, magnetic field, acoustic
  energy, light, mechanical force, heat, or a chemical agent;
- **delivery approach** — environmental, transcutaneous, transcranial,
  percutaneous, implanted, intrathecal, or systemic;
- **biological access route** — canonical sensory-receptor afference, another
  physical neural interaction, biochemical engagement, or an indirect
  physiological route;
- **anatomical target** — brain, spinal cord, cranial/peripheral nerve, sensory
  organ, muscle, or another structure;
- **perception and outcome** — what was perceived or measured.

The resulting subclass claims are false. Electrical stimulation is not
necessarily brain stimulation (for example, muscle stimulation and cardiac
pacing); chemical stimulation is not necessarily neuromodulation (olfactory and
gustatory inputs are chemical and sensory); and a transcranial approach says
nothing by itself about the energy used. Context and language are protocol or
content features, not kinds of cognitive modulation. Audiovisual and tactile
combinations are already handled by properties rather than a combinatorial OWL
class hierarchy.

The physical categories are not a disjoint flat list either. Electric and
magnetic fields and optical radiation are electromagnetic phenomena, but the
operational delivery distinctions remain useful. TMS applies a magnetic field
and induces an electric field in tissue; tES applies current through electrodes.
The model must allow such related or multi-stage descriptions without asserting
that “electrical,” “magnetic,” and “electromagnetic” are mutually exclusive
siblings. Reviews of neuromodulation methods likewise span electrical, magnetic,
optical, thermal, acoustic/mechanical, and chemical approaches; that breadth is
an inventory of applied methods, not a reason to collapse their other facets.

### External terminology informs, but does not dictate, the model

The International Neuromodulation Society defines therapeutic neuromodulation
through targeted delivery of a stimulus and explicitly gives electrical
stimulation and chemical agents as examples. This supports including both in
SSTIM’s *interventional* scope. It does not imply that every electrical or
chemical stimulation is neuromodulation, nor that every neuromodulation is
sensory stimulation.

NLM MeSH defines “chemical stimulation” in effect-oriented terms as an increase
in a measurable physiological or metabolic parameter. SSTIM instead needs a
neutral delivery category for a chemical agent, because delivery must not assert
that a response increased—or occurred at all. Any future MeSH mapping is
therefore broader/related at most, not an automatic `skos:exactMatch`.

Finally, causal access is not always a cost-free physical fact. Experimental
work has shown that some reported tACS effects can arise through transcutaneous
peripheral-nerve stimulation, and human transcranial-ultrasound protocols can
have auditory confounds. SSTIM must distinguish a technique’s declared/intended
route from an experimentally established mechanism.

Sources:

- [International Neuromodulation Society — Neuromodulation Defined](https://www.neuromodulation.com/neuromodulation-defined)
- [NLM MeSH — Stimulation, Chemical](https://meshb.nlm.nih.gov/record/ui?ui=D013268)
- [Luan et al. — Neuromodulation: present and emerging methods](https://doi.org/10.3389/fneng.2014.00027)
- [Black and Rogers — Sensory Neuromodulation](https://doi.org/10.3389/fnsys.2020.00012)
- [Bikson et al. — Transcranial Electrical Stimulation Nomenclature](https://doi.org/10.1016/j.brs.2019.07.010)
- [Asamoah et al. — tACS effects through peripheral nerves](https://doi.org/10.1038/s41467-018-08183-w)
- [Braun et al. — auditory confounding in transcranial ultrasound](https://doi.org/10.1016/j.brs.2020.08.014)

---

## Decision

### 1. Add a neutral stimulation umbrella

SSTIM models deliberately applied interventions, not endogenous physiological
neuromodulation. Within that operational scope, neuromodulation is a kind of
stimulation, but it does not require *sensory* stimulation.

The shipped terms are authoritative and carry `rdfs:seeAlso` back to this ADR;
the abbreviated Turtle sketches that were here have been removed rather than left
to drift from them. `sstim:Stimulation` lives in `sstim-core.ttl`, the technique
and protocol parents in `sstim-technique.ttl`, `sstim:StimulationIntervention` in
`sstim-session.ttl`, and everything neuromodulation-specific in
`sstim-neuromodulation.ttl`.

**`sstim:Stimulation`** is the neutral umbrella: a deliberately parameterized
process applying structured energy, mechanical input, a chemical agent, or
another controlled input, with a declared design intent to elicit, perturb,
regulate, or probe an identified biological, sensory, or neural process. Mere
exposure or energy transfer without that intent is insufficient, and membership
asserts nothing about excitation, perception, response, benefit, or safety.
`SensoryStimulation` and `Neuromodulation` are both its children.

**`sstim:Neuromodulation`** is the intervention-side class: stimulation whose
declared objective is to alter activity or function at an identified neural
target. It excludes endogenous physiological neuromodulation and probe-only
stimulation, and it does not mean treatment or successful modulation.

**One overlap pattern, applied at four layers.** At each of process,
intervention, technique, and protocol, the sensory-route class is the
intersection of the sensory and neuromodulation siblings with
`neuralAccessRoute some CanonicalSensoryTransductionAccessRoute` — so
`SensoryRouteNeuromodulationTechnique ≡ SensoryStimulationTechnique ⊓
NeuromodulationTechnique ⊓ ∃neuralAccessRoute.CanonicalSensoryTransduction…`, and
likewise for the other three. Each also carries explicit `rdfs:subClassOf` axioms
to both parents. Those are redundant for a reasoner and deliberate: the graph
navigator renders named subclass edges and does not project `owl:intersectionOf`
expressions.

`SensoryStimulation`'s definition is revised in the same change so its defining
intervention route engages canonical sensory transduction and afferent processing
with structured input. Conscious perception is not required, and an incidental
sensation arising from some other primary route is insufficient.

`SensoryStimulation` and `Neuromodulation` overlap; neither subsumes the other,
and **no disjointness is asserted** between the sensory and neuromodulation
parents at any layer — hybrid and multi-channel plans and techniques are
legitimate. `EntrainmentBasedTechnique` and `NonEntrainmentTechnique` remain
sensory-specific and inherit the neutral parent indirectly.

The parent additions are additive. Existing direct upper-ontology axioms — notably
`SensoryStimulationTechnique → iao:0000030` and `SensoryStimulationProtocol →
obi:0000272` — stay materialized, because the repository quality contract tests
those direct triples rather than inferred closure.

### 2. Separate three meanings of “sensory”

The following statements are independent:

1. **Sensory-route neuromodulation:** canonical receptor transduction and
   afferent processing are an intended causal route. An auditory or visual
   rhythmic intervention with an explicit neural-modulation objective may fit.
2. **Neuromodulation of a sensory system:** a sensory organ, nerve, pathway, or
   function is the neural target. A cochlear or retinal neural interface may fit
   without using the canonical receptor route.
3. **Sensation associated with neuromodulation:** the participant perceives a
   click, phosphene, tingling, warmth, vibration, or other concomitant effect.
   Incidental perception does not turn the primary intervention route into
   sensory stimulation.

The route-qualified intersection classes represent the first meaning only. The
second is queried through the target axis; the third through
`sstim-ex:perceivedModality` and a channel role. No technique is classified as
sensory merely because a percept is possible, and lack of conscious perception
does not prove that a sensory route was absent.

Technique typing also must not promote a use-level intention into a universal
property. A broad technique such as flicker presentation can be used for an
aesthetic display, a diagnostic frequency-tagging probe, or a neuromodulatory
intervention. It is dual-typed only if neural-modulation intent is part of the
technique concept’s definition. Otherwise the generic technique remains
sensory-only. A protocol records the planned objective through
`NeuromodulationProtocol` plus its route/target facets, and the realized
intervention—not the protocol information artifact—is typed
`SensoryRouteNeuromodulationIntervention`.

A proposed neural mechanism or an immediate evoked response is not by itself a
neuromodulation objective. The current `mechSSVEP`, `mechSSSEP`, `mechASSR`,
`mechFFR`, and `mechStartle` placements are legacy category debt: these denote
evoked responses or a reflex, not causal mechanisms. The 0.9.0 migration mints
correctly named neural-phenomenon/evidence-outcome concepts and deprecates the
legacy `mech*` IRIs with `dct:isReplacedBy` history. It also removes their
`rdf:type sstim:StimulationMechanism`, `rdf:type skos:Concept`,
`skos:inScheme`, top-concept, and broader/narrower mechanism-scheme topology;
deprecation alone would preserve the false entailment. References from
techniques are migrated away from `proposedMechanism`. Every remaining entry in
`StimulationMechanismScheme` is audited under the same causal-mechanism
criterion rather than accepted merely because its local name starts with
`mech`. Thus broad `techPhoticDriving` can remain sensory-only, while the
revised, purpose-bounded `techGamma40Auditory` seed can occupy the overlap.

### 3. Use orthogonal facets, not a stimulation class tree

| Facet | Question | Representation | Epistemic role |
|---|---|---|---|
| **Process family** | What kind of stimulation process or method is this? | `Stimulation`, `SensoryStimulation`, `Neuromodulation` and technique counterparts | declared classification and objective |
| **Applied medium/agent** | What controlled physical or chemical input is applied? | `sstim-ex:characteristicDeliveryMedium` plus the detailed exposure-channel path | specified delivery, not a response |
| **Delivery approach** | How is the input introduced or the interface positioned? | `sstim:stimulationDeliveryApproach` | specified setup; values may be multiple/hierarchical |
| **Intended neural access** | Through which biological route is the target meant to be engaged? | `sstim:neuralAccessRoute` | design intention; actual route may remain disputed |
| **Anatomical target** | Which nervous-system site is intended? | `sstim:intendedNeuralTargetSite` | target intention, not delivered dose or effect |
| **Neural-system target** | Which distributed neural system is intended? | `sstim:intendedNeuralSystem` | sensory, motor, autonomic, or another system; independent of entry route |
| **Functional target** | Which neural phenomenon is intended? | `sstim:intendedNeuralPhenomenon` | target intention, not an observed result |
| **Perception** | Which modality is intended or concomitant, and what is known about it? | `techniqueModality`, exposure `perceivedModality`, channel role, and explicit knowledge status | sensory description, not classification by itself |
| **Mechanism** | How is a response proposed to arise? | `proposedMechanism`, optionally tagged by mechanism route, site/system, and phenomenon properties | hypothesis/evidence interpretation |
| **Observed effect** | What response, route, or target finding occurred, with what support? | observation records and ADR 0027 assessment/proposition/outcome chain, optionally tagged by outcome route, site/system, and phenomenon properties | evidence-qualified result |

No facet property introduced here is functional. A technique may have multiple
channels, approaches, plausible routes, or targets. Carrier, approach, route,
target, and effect must never be inferred from one another solely by naming.

Language, context, instruction, and cognitive tasks may be structured protocol
content or intervention components. They are not delivery media and are not
primitive children of `Neuromodulation`; a bounded “cognitive stimulation”
method is a `StimulationTechnique`, and it becomes a neuromodulation technique
only when neural-modulation objective and target are definitional.

### 4. Reuse and extend the exposure delivery-medium model

The exposure module already separates physical delivery medium, perceived
modality, device capability, and body placement. It remains authoritative for
detailed delivery:

```text
technique → hasExposureProfile → usesStimulusChannel
          → deliveryMedium / perceivedModality / device / placement / dose
```

Add a non-functional channel-role facet with initial values for intended
intervention input, concomitant/incidental exposure, control or sham, and
feedback.
Only an intended causal channel is eligible to participate in sensory-route
classification, and its asserted neural-access route still decides the question;
channel role alone never does. A TMS click or ultrasound-associated sound can
therefore be recorded without silently reclassifying the primary technique;
omission of a role is unknown, not “intended.”

`sstim:neuralAccessRoute` is also allowed on `sstim-ex:StimulusChannel`. In a
multi-channel profile this channel-level binding is authoritative, and route
consistency is two-way:

1. in a profile attached to a neuromodulation process, technique, protocol, or
   intervention, every `roleIntendedIntervention` channel declares at least one
   neural access route;
2. each coarse route asserted on the process, technique, protocol, or
   intervention is backed by an intended channel whose route equals or is
   narrower than that coarse route; and
3. each intended channel route is surfaced by an equal-or-broader coarse route.

Both checks use the exact path
`?channelRoute skos:broader* ?coarseRoute`, never mere shared ancestry. An
intended channel on the canonical sensory route (or a narrower route) also
requires the corresponding sensory class at that resource layer. If the
resource is neuromodulation too, the ordinary dual-parent and overlap
constraints apply. A protocol with intended direct and auditory channels cannot
therefore publish only its bypass route to evade the sensory overlap. If no
profile exists, the coarse route is the curated characteristic route.

```turtle
sstim-ex:StimulusChannelRole a owl:Class ;
    rdfs:subClassOf iao:0000030 .

sstim-ex:channelRole a owl:ObjectProperty ;
    rdfs:domain sstim-ex:StimulusChannel ;
    rdfs:range sstim-ex:StimulusChannelRole .
```

`sstim-ex:StimulusChannelRoleScheme` seeds
`sstim-ex:roleIntendedIntervention`,
`sstim-ex:roleConcomitant`, `sstim-ex:roleControlOrSham`, and
`sstim-ex:roleFeedback`. Role and perceived modality are
independent: an intended non-sensory channel may create a concomitant percept,
and an explicit `modalityNotDirectlyPerceived` value is distinct from an omitted
`perceivedModality` triple, which remains unknown or not assessed. Protocol- or
session-specific perception reports stay in their scoped observation/evidence
records.

Deliberate co-stimulation is not “concomitant” in this scheme: two or more causal
channels may each carry `roleIntendedIntervention`. `roleConcomitant` is reserved
for an associated channel/exposure not intended to mediate the intervention
objective.

Add a coarse technique-level characteristic for catalog navigation and querying,
analogous to the retained coarse `techniqueModality` relation:

```turtle
sstim-ex:characteristicDeliveryMedium a owl:ObjectProperty ;
    rdfs:domain sstim:StimulationTechnique ;
    rdfs:range sstim-ex:PhysicalDeliveryMedium ;
    skos:definition """Links a stimulation technique to a physical energy, material,
      or chemical agent characteristic of the method. It does not describe an
      executed dose or imply perception or effect; use an exposure profile for
      channel-level delivery."""@en .
```

The property definition and medium assertions for vocabulary-owned technique
subjects live in `sstim-exposure.ttl`, not `sstim-vocab.ttl`. The exposure module
already depends on the vocabulary; reversing that dependency would create a
module cycle. Technique identity and type remain in the vocabulary graph.
Assertions for instance-owned subjects remain beside those instances (for
example in `static/ontology/instances/frameworks/bsc.ttl`), which may depend on
both modules without leaking instance data into the snapshotted term space.

Extend `sstim-ex:DeliveryMediumScheme` with neutral, operational concepts:

All medium and channel-role local names in this section use the `sstim-ex:`
namespace.

- `mediumAppliedElectricCurrent` and `mediumAppliedElectricField` as distinct,
  related concepts;
- `mediumAppliedMagneticField`;
- `mediumElectromagneticRadiation`, with visible light, infrared, and ultraviolet
  as narrower concepts where appropriate;
- `mediumAcousticEnergy`, with air-conducted sound, contact acoustic vibration,
  and `mediumFocusedUltrasound` as narrower concepts;
- `mediumMechanicalForce`, with existing vibration media below it;
- `mediumThermalEnergy`;
- `mediumChemicalAgent` → `mediumPharmacologicalAgent`, with olfactory and
  gustatory chemical delivery as sensory specializations.

The existing `mediumElectromagneticField` remains for compatibility and generic
exposure records. It is not the only value for electromagnetic techniques. TMS
uses the applied-magnetic-field value; tDCS, tACS, DBS, and electrical nerve
stimulation use applied-electric-current. The electric field induced by TMS is
established physical transformation, so, when represented, it is a secondary
tissue-field interaction in the exposure/device description—not merely a
`proposedMechanism`. How that field produces a neural response remains a
mechanism/evidence question. Concepts are related by
`skos:broader`/`skos:narrower`; they are not declared disjoint.

Electrical, magnetic, acoustic, optical, thermal, and chemical stimulation are
therefore property-based views over `StimulationTechnique`, not primitive
children of `Neuromodulation`. A convenience OWL class may be added later as a
defined restriction if a demonstrated consumer needs one; it must not become a
second manually maintained taxonomy.

### 5. Keep route, approach, target, and neural phenomenon separate

The new facet classes are controlled information categories. Route, approach,
site, system, and intended-phenomenon properties are allowed on stimulation
processes, techniques, protocols, and planned/executed interventions through
SHACL; route is additionally allowed on stimulus channels. They intentionally
carry no OWL domain: one cross-layer property must not infer that a protocol
information artifact is a technique or process.

Seven facet classes are added under `iao:0000030` — `NeuralAccessRoute` with its
`CanonicalSensoryTransduction…` and `SensoryTransductionBypassing…` children,
plus `StimulationDeliveryApproach`, `NeuralTargetSite`, `NeuralSystem`, and
`NeuralPhenomenon` — and three parallel property families range over them:
`neuralAccessRoute` / `stimulationDeliveryApproach` / `intendedNeuralTargetSite`
/ `intendedNeuralSystem` / `intendedNeuralPhenomenon` for the design intent, a
`mechanism*` family domained on `StimulationMechanism` for the hypothesis, and an
`outcome*` family domained on `EvidenceOutcomeConcept` for the finding. Only the
last two take a domain; the intent properties deliberately take none. All live in
`sstim-neuromodulation.ttl`, except the `outcome*` family in
`sstim-neuromodulation-evidence.ttl`.

Keeping intent, mechanism, and outcome as three separate property families is
the point: it is what stops a proposed route from reading as an observed one.

`sstim-v:NeuralAccessRouteScheme` contains causal-route categories only. “Receptor” in
this axis means a canonical sensory receptor, not a molecular drug receptor. Its
initial hierarchy is:

```text
routeCanonicalSensoryTransductionAfferent
routeBypassesCanonicalSensoryTransduction
├── routePhysicalNeuralInteraction
├── routeBiochemicalPharmacologicalNeuralInteraction
└── routeIndirectNonSensoryPhysiologicalMediation
```

These controlled-value local names use the `sstim-v:` namespace.
`routeCanonicalSensoryTransductionAfferent` is typed
`CanonicalSensoryTransductionAccessRoute`; the bypass parent and its narrower
values are typed `SensoryTransductionBypassingAccessRoute`. This lets core OWL
restrictions refer to route classes without making the core module depend on
vocabulary individuals.

Mixed access is represented by multiple route values; it is not the same thing
as uncertainty. “Unresolved” is an epistemic status recorded by a scoped
knowledge-status assertion or evidence assessment, not a pseudo-route.

Route values describe the *declared intended route*. Competing or demonstrated
actual mechanisms remain evidence-qualified through a mechanism/outcome concept
tagged by its route and target-role properties. For example, both an intended
cortical tACS interaction and a peripheral-nerve explanation use the broad
physical-neural route; the intended target is `sstim-v:targetCortex` via
`sstim:intendedNeuralTargetSite`, while the evaluated outcome uses
`sstim-v:targetPeripheralNerve` via `sstim:outcomeNeuralTargetSite`.
Focused ultrasound can declare a physical neural route while an exposure profile
records an auditory concomitant channel.

`sstim-v:StimulationDeliveryApproachScheme` separately contains non-exclusive,
coarse operational tags: `approachExternal`,
`approachEnvironmentalReceptorFacing`, `approachTranscutaneous`,
`approachTranscranial`, `approachPercutaneous`, `approachImplanted`,
`approachIntracranial`, `approachEpidural`, `approachTargetedLocalInfusion`,
`approachIntrathecal`, and `approachSystemic` (all `sstim-v:`). These deliberately
summarize administration, invasiveness, and interface placement for
cross-technique navigation. Detailed device, body placement, administration,
and dose remain in the exposure profile; no one approach tag is inferred from
another facet. A method may, for example, be external, transcutaneous, and
transcranial.

`sstim-v:NeuralTargetSiteScheme` contains controlled information categories for broad
targets, not anatomical entities themselves. Its seed hierarchy covers:

- `targetCentralNervousSystem` → `targetBrain` → `targetCortex` /
  `targetDeepBrainStructure`;
- `targetCentralNervousSystem` → `targetSpinalCord`;
- `targetPeripheralNervousSystem` → `targetPeripheralNerve`;
- `targetCranialNerve` as a separate seed category rather than a blanket child
  of PNS, because cranial-nerve anatomy is not uniformly peripheral.

All target local names above use the `sstim-v:` namespace.

External anatomy alignment is a separate, evidence-checked pass. A local target
category may have more than one broader concept; no forced single-parent tree is
required.

`sstim-v:NeuralSystemScheme` separately covers distributed organizational systems. Its
initial `sstim-v:` concepts include `systemSensory`, `systemMotor`, and
`systemAutonomic`; sensory has `systemAuditory`, `systemVisual`,
`systemSomatosensory`, `systemOlfactory`, `systemGustatory`, `systemVestibular`,
`systemProprioceptive`, and `systemInteroceptive` narrower concepts aligned
to—but not identified with—the modality vocabulary. This is the axis for
“neuromodulation of a sensory system”; it does not imply that the intervention
entered through that sensory system.

`sstim-v:NeuralPhenomenonScheme` contains coherent functional neural phenomena, such as
`phenomenonExcitabilityOrFiring`, `phenomenonOscillatoryDynamics`,
`phenomenonTemporalCoordination`, `phenomenonSynapticTransmission`,
`phenomenonNeurochemicalSignaling`, `phenomenonConnectivityOrPlasticity`, and
`phenomenonAutonomicNeuralRegulation` (all `sstim-v:`). The three phenomenon
properties above reuse this value set while preserving proposed-mechanism,
intended-target, and observed-outcome roles.

This replaces the earlier proposed `TargetLevelScheme`. “Neural-direct” is a
route, “oscillatory” is a dynamic, “autonomic” is a system/phenomenon, and
“perceptual-cognitive” is an outcome domain; they are not values on one level
axis. Perceptual, cognitive, motor, autonomic, physiological, and behavioral
outcome domains may be modeled separately and non-exclusively. An autonomic
outcome can also be neural; a controlled vocabulary must not force false
partitions merely to simplify a query.

### 6. Route and temporal requirements are explicit

Every explicitly represented `Neuromodulation` process declares at least one
`neuralAccessRoute`, `stimulationDeliveryApproach`, and
`intendedNeuralTargetSite`, plus an exposure profile. The process-level SHACL
shape makes the route-bearing intersection in §1 usable on data, rather than
leaving process instances outside the allowed-subject contract.

Every `NeuromodulationTechnique`, including a sensory-route neuromodulation
technique, declares at least one:

- `neuralAccessRoute`;
- `stimulationDeliveryApproach`;
- `intendedNeuralTargetSite`;
- `characteristicDeliveryMedium`; and
- `hasStimulusTemporalStructure`.

The earlier proposal to omit route from sensory techniques created a
contradiction: dual-typed sensory neuromodulation techniques were simultaneously
said not to declare route and required by their neuromodulation shape to declare
it. Within the neuromodulation population, canonical sensory-transduction and
afferent access is not a redundant value—it is the fact that distinguishes the
sensory-route overlap from approaches that bypass canonical sensory
transduction. A technique in the named overlap must assert that route; an
arbitrary dual type plus only a bypass route is non-conformant.

Sensory-only techniques need not repeat `neuralAccessRoute` merely to restate
their class definition, although they may use it when comparison or a detailed
profile needs the explicit value. Every stimulation technique declares a
characteristic medium. Sensory and neuromodulation techniques also declare
temporal structure; a neutral umbrella technique that fixes no characteristic
timing is not forced to invent one.

The core `StimulusTemporalStructure` definition is widened from “sensory
stimulus” to “applied stimulus or agent.” Its scheme retains periodic,
quasi-periodic, aperiodic, and adaptive, and adds
`sstim-v:temporalContinuousTonic`, `sstim-v:temporalSingleEvent`,
`sstim-v:temporalPulseTrainOrBurst`, `sstim-v:temporalIntermittentScheduled`,
`sstim-v:temporalBolus`, and `sstim-v:temporalContinuousInfusion`. Values are
non-disjoint and may be combined: carrier periodicity, pulse pattern, and
administration schedule are different temporal features. Detailed executed
timing remains in the exposure profile.

An asserted route below
`sstim-v:routeBypassesCanonicalSensoryTransduction` positively identifies such
a route; it does **not** prove that the whole technique is
non-sensory, because a hybrid may also have an intended sensory route. Likewise,
absence of `rdf:type sstim:SensoryStimulationTechnique` is not OWL negation.
Queries therefore report “neuromodulation with a bypass route,” not a logical
complement class. Under the open-world assumption, `FILTER NOT EXISTS` is not
proof that something is non-sensory.

### 7. Generalize shared properties and the evidence model

The following domain/range changes are required as one coordinated migration:

- `proposedMechanism` and `hasStimulusTemporalStructure`: domain changes from
  `SensoryStimulationTechnique` to `StimulationTechnique`;
- `sstim-ex:hasExposureProfile`: its sensory technique and protocol arms change
  to `StimulationTechnique` and `StimulationProtocol`, and `Stimulation` is
  admitted for represented stimulation processes (including interventions);
- `sstim-ex:requiresDeviceCapability` and `sstim-ex:hasExperimentContext`:
  their sensory-protocol union arms change to `StimulationProtocol`, aligning
  the declared contract and SHACL allowed classes with non-sensory protocols;
- `sstim-ex:ExploratoryProtocol`: parent changes from
  `SensoryStimulationProtocol` to direct neutral `iao:0000030` and
  `obi:0000272` parents. Existing silence/darkness baselines and mere-exposure
  hypotheses therefore do not become stimulation by inheritance; actual
  stimulation/sensory exploratory protocols receive explicit types selectively;
- `evaluatesSubject`, deprecated `supportsRelation`, and `propositionSubject`:
  technique range changes to `StimulationTechnique`;
- `scopeInterventionOrContext` and `basisIntervention`: sensory technique,
  protocol, and intervention alternatives change to their neutral stimulation
  parents;
- `usesTechnique`: domain and range change to `StimulationProtocol` and
  `StimulationTechnique`, so a neuromodulation protocol remains an information
  artifact and can name its method without acquiring a sensory type;
- **`definedByFramework`: domain changes from `SensoryStimulationProtocol` to
  `obi:0000272`.** Found during implementation, and required for the
  `ExploratoryProtocol` reparenting above to have any effect: all ten current
  exploratory protocols assert `definedByFramework`, so its sensory domain
  re-infers under RDFS/OWL closure precisely the typing the reparenting removes,
  including on the silence/darkness baseline and the mere-exposure field
  hypothesis. Widening to `StimulationProtocol` would not fix it either — that
  still asserts stimulation. The general OBI protocol class is the honest
  domain: both `StimulationProtocol` and the reparented `ExploratoryProtocol`
  are `obi:0000272`, so a boundary or baseline protocol can be authored and
  constrained by a framework without becoming stimulation. The alternative,
  deleting the framework link from the three neutral files, was rejected as
  losing true provenance;
- matching evidence SHACL class/union constraints change in lockstep.

Definitions and shape messages change in the same migration. In particular,
remove sensory-only wording from `proposedMechanism`,
`hasStimulusTemporalStructure`, `EvidenceTierValue`, and `ExposureProfile`; a
widened range with a still-sensory definition would be internally inconsistent.

Widening the deprecated `supportsRelation` range is necessary despite its
deprecated status: its current union range does not choose or infer one member
class under OWL, but it still declares non-sensory techniques outside the
contract and conflicts with the matching SHACL `sh:or`. Its history note
continues to direct consumers to `evaluatesSubject`.

For evidence whose scoped intervention has no applicable sensory modality, the
existing triple
`?scope sstim:scopeSensoryModality sstim-v:scopeNotApplicable` satisfies the
proposition’s sensory-modality scope, while source-level
`sstim:basisModalityApplicability` uses
`sstim-v:applicabilityNotApplicable`. A fake sensory modality is never added
merely to satisfy the evidence shapes.

Sensory-framework properties `definesTechnique` and `incorporatesTechnique`
remain ranged to `SensoryStimulationTechnique`. Generalizing `usesTechnique`
does not add any link: cataloguing a non-sensory technique therefore does not
imply that BSC or any sensory framework or protocol implements or incorporates
it.

This migration weakens old implicit inferences from the properties that have a
*direct* sensory domain or range, notably `proposedMechanism`,
`hasStimulusTemporalStructure`, and `usesTechnique`. OWL union domains/ranges do
not infer a chosen union arm; their widening instead corrects the declared
contract and SHACL validation. Both changes are intentional semantic changes to
mutable latest. Frozen version snapshots retain their published entailments.

### 8. Compose SHACL obligations; never branch on editorial prose

Retain the published `sstim-sh:TechniqueShape` IRI, retarget it to
`sstim:StimulationTechnique`, and compose it with more specific shapes:

| Shape | Target | Required fields |
|---|---|---|
| `sstim-sh:NeuromodulationProcessShape` | `Neuromodulation` | exposure profile; neural access route; delivery approach; intended neural target site |
| `sstim-sh:SensoryRouteNeuromodulationProcessShape` | processes that are both sensory stimulation and neuromodulation | canonical sensory-transduction/afferent route |
| `sstim-sh:TechniqueShape` | `StimulationTechnique` | characteristic delivery medium |
| `sstim-sh:SensoryTechniqueShape` | `SensoryStimulationTechnique` | coarse sensory modality; temporal structure |
| `sstim-sh:NeuromodulationTechniqueShape` | `NeuromodulationTechnique` | temporal structure; neural access route; delivery approach; intended neural target site |
| `sstim-sh:SensoryRouteNeuromodulationTechniqueShape` | nodes that are both sensory and neuromodulation techniques | canonical sensory-transduction/afferent route |
| `sstim-sh:NeuromodulationProtocolShape` | `NeuromodulationProtocol` | used technique; neural access route; delivery approach; intended neural target site |
| `sstim-sh:NeuromodulationInterventionShape` | `NeuromodulationIntervention` | exposure profile; neural access route; delivery approach; intended neural target site |
| `sstim-sh:SensoryRouteNeuromodulationPlanShape` | protocols/interventions in both sensory and neuromodulation hierarchies | canonical sensory-transduction/afferent route |
| `sstim-sh:RouteChannelConsistencyShape` | stimulation processes/techniques/protocols/interventions that have an exposure profile | every intended channel in a neuromodulation profile has a route; every coarse route is backed by an intended channel; every intended-channel route is surfaced coarsely; and an intended canonical sensory route requires the layer’s sensory type; route matching uses `?channelRoute skos:broader* ?coarseRoute` |
| `sstim-sh:StimulationFacetSubjectShape` | `sh:targetSubjectsOf` each domainless route, approach, and intended-target property | all facets permit a stimulation process, technique, protocol, or intervention; route also permits a stimulus channel; each value has the declared value class |

Targets overlap by design. A dual-typed process, technique, protocol, or
intervention must satisfy all applicable shapes. The intersection-specific
shapes use ordinary `sh:targetClass` on the neutral
process/technique/protocol/intervention parent, then conditional `sh:sparql`
constraints test membership in both hierarchies and require the canonical route
or a narrower route by SKOS ancestry. They do not use `sh:SPARQLTarget`, which
pySHACL ignores unless advanced mode is enabled; the repository’s current gates
do not enable it.

`StimulationFacetSubjectShape` is the enforcement counterpart of the deliberate
no-domain design. Negative fixtures place each facet on an unrelated node and
must fail: omitting an OWL domain avoids unwanted inference, but does not grant
arbitrary subjects permission to use the property.

`proposedMechanism` is no longer a required violation-level field. If no
mechanism is asserted, SSTIM does not invent one merely to satisfy validation.
Optional completeness findings stay in the separate quality-audit report; they
are not `sh:Warning` results in the normative shape graph because the current
pySHACL gate does not allow warnings. `skos:editorialNote` never suppresses
structural constraints. The notes on color-field stimulation, reference-pitch
retuning, Solfeggio tuning, subliminal audio, and focused ultrasound remain
useful annotations; they cease to be validation switches.

This preserves the current temporal obligation for sensory techniques, extends
it to neuromodulation techniques with an adequate value set, and adds a medium
obligation to the neutral technique layer.

Because technique identity/type is vocabulary-owned while characteristic-medium
assertions are exposure-owned, standalone `make shacl-vocab` can no longer
validate `sstim-vocab.ttl` in isolation. That gate is changed to validate the
core + vocabulary + exposure dependency closure; `make shacl-modules` remains
the whole-set authority. Assertions are not duplicated merely to satisfy a
file-local validation command.

### 9. Retype focused ultrasound and add a representative contrast set

Relabel `sstim-v:TechniqueScheme` from “Sensory Stimulation Technique
Vocabulary” to **“SSTIM Stimulation Technique Vocabulary.”** Its IRI is unchanged.
Its definition states that the scheme is a bounded, non-exhaustive catalog of
sensory stimulation and interventional neuromodulation techniques used to place
SSTIM’s core domain in context.

Retype `techUltrasoundNeuromod` as `StimulationTechnique` and
`NeuromodulationTechnique`, not `NonEntrainmentTechnique`. Rewrite its definition
around the intended focused neural target rather than categorical absence of an
audible percept. Auditory or somatosensory co-stimulation and confounds are
protocol-dependent and belong in exposure profiles and evidence records; they
do not decide the technique’s primary class.

Revise `mechUltrasonic` in the same migration. It becomes an explicitly proposed,
evidence-qualified mechanism family covering candidate acoustic-radiation-force,
membrane, and mechanosensitive-channel pathways. Its definition no longer states
“without an audible percept,” treats no candidate pathway as universally
established, and does not use the mechanism term to decide sensory typing.

Revise `techGamma40Auditory` narrowly enough that neural-oscillation modulation
is part of the technique’s defining objective, then type it
`SensoryRouteNeuromodulationTechnique` and assert the canonical sensory route.

Use the following representative contrast table as classification guidance
rather than attempting an exhaustive medical taxonomy. A row does not by itself
require a new catalog IRI; the exact release seed follows the table.

| Technique/example | Type in SSTIM | Characteristic medium | Intended route | Delivery approach | Intended target/context |
|---|---|---|---|---|---|
| olfactory or gustatory stimulation | sensory stimulation technique | chemical agent | canonical sensory-transduction/afferent access | environmental/receptor-facing | sensory receptor and sensory system; not automatically neuromodulation |
| 40 Hz auditory gamma stimulation with a defining neural objective | sensory-route neuromodulation technique | air-conducted acoustic energy | canonical sensory-transduction/afferent access | external + environmental | cortex + auditory neural system; oscillatory dynamics |
| TENS or peripheral electrical nerve stimulation | stimulation; neuromodulation only for a suitably defined method | applied electric current | physical peripheral-neural interaction bypassing canonical sensory transduction | external + transcutaneous | peripheral nerve; not brain stimulation by definition |
| tDCS | neuromodulation technique | applied electric current | physical neural interaction bypassing canonical sensory transduction | external + transcutaneous + transcranial | brain/cortex |
| tACS | neuromodulation technique | applied electric current | intended physical neural interaction bypassing canonical sensory transduction; peripheral explanations remain evidence questions | external + transcutaneous + transcranial | brain/cortex; oscillatory dynamics |
| repetitive TMS with a defining modulation objective | neuromodulation technique; generic probe-only TMS remains stimulation-only in this classification | applied magnetic field | physical neural interaction bypassing canonical sensory transduction | external + transcranial | brain/cortex |
| DBS | neuromodulation technique | applied electric current | physical neural interaction bypassing canonical sensory transduction | implanted + intracranial | deep-brain structure |
| spinal cord stimulation | neuromodulation technique | applied electric current | physical neural interaction bypassing canonical sensory transduction | implanted + epidural | spinal cord |
| vagus nerve stimulation | neuromodulation technique | applied electric current | physical peripheral-neural interaction bypassing canonical sensory transduction | implanted or external + transcutaneous, depending variant | cranial nerve; autonomic neural system |
| focused-ultrasound neuromodulation | neuromodulation technique | focused acoustic energy | intended physical neural interaction bypassing canonical sensory transduction | external + transcranial | cortical or deep-brain target; auditory confounds modeled separately |
| targeted intrathecal delivery of a neuromodulatory agent | neuromodulation technique only when neural-modulation objective is definitional | chemical/pharmacological agent | biochemical/pharmacological neural interaction bypassing canonical sensory transduction | targeted local infusion + intrathecal | central nervous system / spinal target |
| neuromuscular electrical stimulation | stimulation technique | applied electric current | no neural-access value required for the neutral classification; a neural-targeting variant may assert physical peripheral-neural interaction | external + transcutaneous | muscle/motor unit; not automatically neuromodulation |

The minimum released contrast set is exact rather than aspirational:
`sstim-v:techRepetitiveTMS`, `sstim-v:techTDCS`, `sstim-v:techTACS`,
`sstim-v:techDBS`, `sstim-v:techUltrasoundNeuromod`,
`sstim-v:techVagusNerveStimulation`, and
`sstim-v:techIntrathecalNeuromodulatoryAgentDelivery`. Existing
`sstim-v:techGamma40Auditory` is revised as the required, definitionally
dual-typed sensory-route seed for CQ1. The populated chemical and overlap
examples are required; empty route categories would not demonstrate that the
model works.

Systemic remains a neutral delivery-approach value for representing a technique,
protocol, or intervention. Ordinary systemic neuroactive pharmacotherapy is
outside the initial neuromodulation technique catalog. It qualifies only if a
future, bounded method has an explicit neuromodulatory objective and identified
neural target; drug administration alone is insufficient.

No new catalog entry is referenced by a BSC preset, framework, protocol, or
implementation. Inclusion means “SSTIM can describe this boundary technique,”
not “BSC Lab can deliver it” or “the technique is effective.”

### 10. Evidence questions remain scoped

“Most studied,” “highest evidence,” and “most effective” are different claims:

- **Most represented in SSTIM’s current corpus** can be computed by counting
  distinct `basisSource` values per technique, outcome, and compatible scope.
- **Highest recorded evidence tier** is reported only for a bounded proposition
  and its explicit population/model, intervention, comparator, outcome, and
  as-of corpus. It is always shown with `hasClaimDirection`: a high-tier
  refutation is not strong support. Ordering uses `sstim:tierRank`, not lexical
  ordering of tier IRIs.
- **Most studied in the field** requires a reproducible, sufficiently
  comprehensive search record. Repository counts alone cannot establish it.
- **Most effective** is not derived from evidence tier and is not a query SSTIM
  answers.

A maximum tier across heterogeneous outcomes or scopes is not “best evidenced.”
Queries return the scoped tier/direction distribution or compare matched
propositions. Default result sets exclude an assessment that is explicitly
invalidated or is the object of a newer `prov:wasRevisionOf` link; historical
queries may opt in to superseded revisions and must label them.

### 11. Graph navigation follows the formalization

No `skos:Collection` is minted solely to make a UI filter work. The graph
navigator gains general facet support for:

- stimulation and neuromodulation class membership;
- characteristic delivery medium;
- neural access route;
- delivery approach;
- anatomical target;
- neural-system target;
- intended, mechanism, and outcome roles for route, target site, neural system,
  and neural phenomenon.

Add `stimulation` and `neuromodulation` graph scopes. The matcher must support
configured predicate paths and SKOS ancestry, not only whole concept schemes or
class local names. The explicit named-parent axioms on the intersection classes
ensure that both parents remain visible even before the renderer learns to
project arbitrary OWL class expressions.

---

## Competency queries

Prefixes are omitted below. Executable repository versions must use independent
`GRAPH` blocks because core, vocabulary, exposure, and evidence data are loaded
into separate named graphs.

```sparql
# CQ1 — techniques in the sensory-route neuromodulation overlap
SELECT DISTINCT ?tech WHERE {
  GRAPH ?gType {
    ?tech a ?sensoryClass, ?neuromodulationClass .
  }
  GRAPH ?gSchema {
    ?sensoryClass rdfs:subClassOf* sstim:SensoryStimulationTechnique .
    ?neuromodulationClass rdfs:subClassOf* sstim:NeuromodulationTechnique .
  }
  GRAPH ?gRouteAssertion {
    ?tech sstim:neuralAccessRoute ?route .
  }
  GRAPH ?gRouteScheme {
    ?route skos:broader* sstim-v:routeCanonicalSensoryTransductionAfferent .
  }
}

# CQ2 — neuromodulation with at least one intended route that bypasses
# canonical sensory transduction. Hybrid sensory + bypass techniques may appear.
SELECT DISTINCT ?tech ?route WHERE {
  GRAPH ?gType {
    ?tech a ?neuromodulationClass .
  }
  GRAPH ?gSchema {
    ?neuromodulationClass rdfs:subClassOf* sstim:NeuromodulationTechnique .
  }
  GRAPH ?gRouteAssertion {
    ?tech sstim:neuralAccessRoute ?route .
  }
  GRAPH ?gRouteScheme {
    ?route skos:broader* sstim-v:routeBypassesCanonicalSensoryTransduction .
  }
}

# CQ3 — stimulation techniques by physical/chemical medium, independent of
# sensory/neuromodulation classification
SELECT DISTINCT ?tech ?medium
       (EXISTS {
          GRAPH ?gSensoryType { ?tech a ?sensoryClass }
          GRAPH ?gSensorySchema {
            ?sensoryClass rdfs:subClassOf* sstim:SensoryStimulationTechnique
          }
        }
        AS ?isSensory)
       (EXISTS {
          GRAPH ?gNeuromodulationType { ?tech a ?neuromodulationClass }
          GRAPH ?gNeuromodulationSchema {
            ?neuromodulationClass
                rdfs:subClassOf* sstim:NeuromodulationTechnique
          }
        }
        AS ?isNeuromodulation)
WHERE {
  GRAPH ?gType {
    ?tech a ?techniqueClass .
  }
  GRAPH ?gSchema {
    ?techniqueClass rdfs:subClassOf* sstim:StimulationTechnique .
  }
  GRAPH ?gMedium {
    ?tech sstim-ex:characteristicDeliveryMedium ?medium .
  }
}
ORDER BY ?medium ?tech

# CQ4 — evidence about a neural phenomenon, with the correct ADR 0027 path
SELECT DISTINCT ?tech ?outcome ?phenomenon ?direction ?rank ?source WHERE {
  GRAPH ?gClaim {
    ?claim a sstim:EvidenceAssessmentClaim ;
           sstim:evaluatesSubject ?tech ;
           sstim:assessesProposition ?proposition ;
           sstim:hasEvidenceTier ?tier ;
           sstim:hasClaimDirection ?direction ;
           sstim:hasEvidenceBasis ?basis .
    ?proposition sstim:propositionOutcome ?outcome .
    ?basis sstim:basisSource ?source .
  }
  GRAPH ?gType {
    ?tech a ?techniqueClass .
  }
  GRAPH ?gSchema {
    ?techniqueClass rdfs:subClassOf* sstim:StimulationTechnique .
  }
  GRAPH ?gOutcome {
    ?outcome sstim:outcomeNeuralPhenomenon ?phenomenon .
  }
  GRAPH ?gTier {
    ?tier sstim:tierRank ?rank .
  }
  FILTER NOT EXISTS {
    GRAPH ?gNewer { ?newer prov:wasRevisionOf ?claim }
  }
  FILTER NOT EXISTS {
    GRAPH ?gInvalidation { ?claim prov:invalidatedAtTime ?invalidatedAt }
  }
}
ORDER BY ?tech ?outcome ?direction DESC(?rank)

# CQ5 — sources represented in SSTIM, grouped by outcome, direction, and
# normalized combinations of explicit scope-axis values rather than scope IRI
SELECT ?tech ?outcome ?direction ?modality ?populationOrModel
       ?interventionOrContext ?comparator
       (COUNT(DISTINCT ?source) AS ?sourceCount)
WHERE {
  GRAPH ?gClaim {
    ?claim a sstim:EvidenceAssessmentClaim ;
           sstim:evaluatesSubject ?tech ;
           sstim:assessesProposition ?proposition ;
           sstim:hasClaimDirection ?direction ;
           sstim:hasEvidenceBasis ?basis .
    ?proposition sstim:propositionOutcome ?outcome ;
                 sstim:hasAssessmentScope ?scope .
    ?scope sstim:scopeSensoryModality ?modality ;
           sstim:scopePopulationOrModel ?populationOrModel ;
           sstim:scopeInterventionOrContext ?interventionOrContext ;
           sstim:scopeComparator ?comparator .
    ?basis sstim:basisSource ?source .
  }
  GRAPH ?gType {
    ?tech a ?techniqueClass .
  }
  GRAPH ?gSchema {
    ?techniqueClass rdfs:subClassOf* sstim:StimulationTechnique .
  }
  FILTER NOT EXISTS {
    GRAPH ?gNewer { ?newer prov:wasRevisionOf ?claim }
  }
  FILTER NOT EXISTS {
    GRAPH ?gInvalidation { ?claim prov:invalidatedAtTime ?invalidatedAt }
  }
}
GROUP BY ?tech ?outcome ?direction ?modality ?populationOrModel
         ?interventionOrContext ?comparator
ORDER BY DESC(?sourceCount)
```

CQ5 treats each exact tuple of scope-axis values as a comparable cell. A
multi-valued scope contributes to each explicit tuple; it is never collapsed to
a wildcard. Production query code also returns the as-of corpus/search record
used for any field-wide coverage statement.

---

## Consequences and migration

Shipped in SSTIM 0.9.0. The per-module edit list that stood here has been removed:
it described work now verifiable in the ontology itself, and a checklist of
completed edits is not a record of a decision. In outline, Core gained the neutral
parents, the overlap classes, and the facet classes and properties; Exposure
gained the coarse characteristic-medium property, a deepened delivery-medium
hierarchy, channel roles for intended versus concomitant paths, and every
vocabulary-technique medium assertion; Vocabulary gained the route, approach,
target, system, and phenomenon concepts and lost the legacy `mech*`
response-as-mechanism placements; Shapes gained the process, overlap, facet-subject
and route-consistency constraints and lost the editorial-note branch.

Two consequences are worth keeping, because they record reasoning rather than
work:

- **`ExploratoryProtocol` reparenting is a ten-file instance migration, decided
  per file, not a single core edit.** Reparenting the class (§7) silently removes
  `SensoryStimulationProtocol` from every current instance, so each is retyped
  explicitly or deliberately left neutral. The subjects live in
  `static/ontology/instances/experiments/`: `colored-audio-noise`,
  `color-field-blink`, `free-view-stereo-headphones`, `ideal-tactile-immersion`,
  `multi-headphone-haptic`, `sensory-field-example`, `silence-darkness-baseline`,
  `smell-taste-device-boundary`, `social-graph-sensory-protocol`, and
  `wifi-em-field-hypothesis`. The criterion is the §1 route test — structured
  input intended to engage canonical sensory transduction. A baseline defined by
  the *absence* of stimulation (`silence-darkness-baseline`) and a
  mere-exposure/ambient-field hypothesis (`wifi-em-field-hypothesis`) are the
  cases the reparenting exists to stop mislabelling; each remaining file is
  judged on the same criterion rather than by category, and the decision is
  recorded in its file comment.

  Resolved during implementation: seven declare `sstim:usesTechnique` with real
  sensory techniques and are retyped `sstim:SensoryStimulationProtocol`
  explicitly. Three declare no technique at all and stay neutral — the two the
  ADR named, plus `smell-taste-device-boundary`, whose own `skos:editorialNote`
  records that it "intentionally does not map them to a currently supported BSC
  stimulation technique" and whose every channel is `notCurrentlyDeliverableByBSCLab`
  or `outsideBSCLabScope`. Consequently the quality audit's `protocols` competency
  floor drops from 12 to 9, with the reason recorded at the threshold: it marks
  an intended loss, and a further drop still fails.
- **Both standalone module gates shift, not only `shacl-vocab`.** Because
  technique identity is vocabulary-owned while characteristic-medium assertions
  are exposure-owned (§4), `make shacl-vocab` gains the core+vocabulary+exposure
  closure (§8) and `make shacl-exposure` continues to validate the exposure file
  alone — which stays meaningful precisely because the medium assertions it now
  carries name subjects whose `rdf:type` is absent from that file, so no
  technique shape targets them there. `make shacl-modules` remains the whole-set
  authority. Neither gate is satisfied by duplicating assertions across files.
The remaining consequences — concept-doc wording, executable queries and graph
facets, `context.jsonld` and `void.ttl` entries, module metadata and changelog —
all landed with the release. Two boundaries held and still hold: external
alignments for neuromodulation and named techniques are reviewed separately
against live authoritative identifiers and never inferred from a label, and
catalog inclusion asserts neither efficacy nor safety and changes no BSC preset,
framework, implementation, or public copy.

### Required regression tests

The SHACL side of this list is enforced by `sstim-shapes.ttl` (the route and
channel-consistency constraints of items 4–8) and runs under `make validate`.
The negative fixtures items 7 and 8 call for have **no counterpart** under
`test/fixtures/rdf/`, unlike the profile and ecosystem contracts — so treat the
list below as an open acceptance spec, not a description of existing coverage.

1. Focused ultrasound is not inferred to be a
   `SensoryStimulationTechnique` under RDFS closure despite retaining temporal
   structure and proposed-mechanism triples; neither its technique nor mechanism
   definition uses absence of an audible percept as a classifier.
2. A sensory technique missing modality fails even when it has an
   `skos:editorialNote`.
3. A generic stimulation technique missing characteristic delivery medium
   fails; a sensory or neuromodulation technique missing temporal structure
   fails.
4. A neuromodulation process, technique, protocol, or intervention missing its
   applicable route, approach, target, or delivery fields fails.
5. A dual sensory + neuromodulation resource at each modeled layer must satisfy
   every applicable shape and assert the canonical sensory-transduction/afferent
   route; a bypass route alone fails the overlap constraint.
6. Route and approach may be multi-valued.
7. When an exposure profile exists, every coarse route is backed by an
   `roleIntendedIntervention` channel on the exact equal-or-narrower route path;
   every intended-channel route is also surfaced by an equal-or-broader coarse
   route, and every intended channel in a neuromodulation profile must declare a
   route. Concomitant/control channels cannot satisfy either direction. Negative
   fixtures prove that a route-less intended channel fails, two sibling routes
   sharing only a broader ancestor do not match, and an intended canonical
   sensory co-channel cannot be hidden behind only a bypass coarse route or a
   non-sensory type.
8. Each domainless route, approach, and intended-target property rejects an
   unrelated subject; all accept a stimulation process, technique, protocol, or
   intervention, while route additionally accepts a stimulus channel.
9. A neuromodulation protocol can assert `requiresDeviceCapability` and
   `hasExperimentContext` without being inferred as a sensory protocol; migrated
   sensory exploratory protocols keep their intended sensory type.
10. A conformant evidence assessment can target a bypass-route neuromodulation
   technique without inferring sensory type, while a hybrid with both routes is
   retained in both applicable query results.
11. Competency queries use subclass closure in the non-entailing named-graph
   store, return `techGamma40Auditory` for CQ1, preserve claim direction, exclude
   explicitly superseded revisions by default, and group compatible scope-axis
   values rather than revision-local scope IRIs.
12. Graph tests cover route-qualified intersections and
   medium/route/approach/site/system/phenomenon facets.
13. Both dependency-closure SHACL validation and whole-module validation pass;
    file ownership tests reject a vocabulary-to-exposure dependency cycle.
14. Deprecated response-form `mech*` IRIs have no
    `StimulationMechanism`/`skos:Concept` typing or mechanism-scheme topology, no
    technique points to them through `proposedMechanism`, and every replacement
    is correctly typed and linked with `dct:isReplacedBy`; the fixture includes
    acoustic startle as well as SSVEP, SSSEP, ASSR, and FFR.

Implementation runs `make validate`, including SHACL, domain/range inference
checks, ontology quality audit, HermiT, named-graph SPARQL sanity queries, and
export round trips. It also runs `make test`, `make check`, `make build`, and the
final `make export`, because the migration changes graph code and Svelte UI as
well as ontology modules. New SHACL rules receive both positive and negative
fixtures.

### Implementation order

One ordering constraint is normative and outlived the 0.9.0 build: **widen the
shared property domains before retyping focused ultrasound.** Doing it the other
way recreates the sensory inference this ADR exists to remove.

---

## Alternatives considered

- **Adopt the predecessor tree as drawn.** Rejected: it confuses objective,
  applied medium, route, interface, target, perception, and outcome, producing
  independently false subclass axioms.
- **Model neuromodulation without a common `Stimulation` layer.** Rejected:
  leaves electrical, magnetic, acoustic, mechanical, optical, thermal, and
  chemical stimulation without a neutral home and obscures the user-facing
  context this ADR is meant to provide.
- **Make electrical, magnetic/electromagnetic, acoustic, or chemical stimulation
  primitive subclasses of `Neuromodulation`.** Rejected: each medium also has
  sensory or non-neural uses, and “electromagnetic” overlaps the others
  physically.
- **`SensoryStimulation ⊑ Neuromodulation`.** Rejected: accessibility,
  sonification, aesthetic, diagnostic, and other sensory deliveries need not
  have a neuromodulatory objective. It would also smuggle target/effect meaning
  into SSTIM’s delivery class.
- **`Neuromodulation ⊑ SensoryStimulation`.** Rejected: modulatory TMS variants,
  DBS, focused ultrasound, direct nerve interfaces, and targeted delivery of a
  neuromodulatory agent do not require canonical sensory transduction.
- **Classify by the presence or absence of a percept.** Rejected: conscious
  perception is not required for sensory transduction, and non-sensory
  stimulation can produce incidental sensations or confounds.
- **One mixed route or target-level scheme.** Rejected: “transcranial,”
  “implanted,” “acoustic,” “chemical,” “oscillatory,” “autonomic,” and
  “cognitive” answer different questions.
- **Declare route only for non-sensory neuromodulation.** Rejected: the
  canonical sensory-transduction/afferent value is needed to identify and
  compare the overlap, and omitting it contradicts a shape targeting all
  neuromodulation techniques.
- **Treat a missing sensory type as proof of non-sensory status.** Rejected by
  the open-world assumption. A positively asserted bypass route reports that
  route but still does not exclude a hybrid sensory route.
- **Split sensory and neuromodulation techniques into disjoint SKOS schemes.**
  Rejected: the populations overlap. One bounded technique catalog with explicit
  type/facet assignments avoids duplicate identifiers and arbitrary placement.
- **Add a `skos:Collection` for the graph navigator.** Rejected: a UI view is not
  a citable domain category. The navigator must project the formal facets.
- **Document the boundary only in prose.** Rejected: leaves the RDFS inference
  bug, SHACL escape hatch, evidence-range restriction, and competency-query gap
  in place.
