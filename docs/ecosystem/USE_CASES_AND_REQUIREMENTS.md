# Use Cases and Requirements v0.1

> **Status: draft for W3C Community Group review.** First deliverable of the
> Sensory Stimulation Vocabulary Community Group
> ([`CHARTER.md`](../../CHARTER.md), initial deliverable 1). This is a working
> draft contributed for discussion, not a ratified group output, and it does not
> constrain the group's decisions.

## How this document was produced

Every use case below is **derived from a description that already exists in
Turtle**, not invented for the document. Each one names the file that encodes it
and, where a profile contract covers it, the competency query that must answer
it. This matters for two reasons: a use case that has already survived encoding
is a use case whose difficulties are known, and a reader who disagrees with one
can open the file and point at the triple they object to.

The source material is the ten exploratory protocols in
[`static/ontology/instances/experiments/`](../../static/ontology/instances/experiments/),
the two reference protocols, the synthetic reference session, and the two preset
seeds. All of it was authored by one person, which is a limitation of this draft
and the main thing the group should fix.

Competency queries referenced below live in
[`test/competency/`](../../test/competency/) and run under `make validate`.

---

## Actors

Taken from the group's own use case template and used consistently below:
researcher, application developer, device maker, data publisher, accessibility
specialist, standards implementer, public-interest organization, institution.

---

## Use cases

### UC-01. Describe a stimulus so someone else can reproduce it

*Actor: researcher, application developer.* State what is delivered, through
which channel, for how long, under which regime, and at what target, using the
smallest possible vocabulary.

Encoded: [`heal-theta-breathing-seed.ttl`](../../static/ontology/instances/presets/heal-theta-breathing-seed.ttl),
[`perform-alpha-10-seed.ttl`](../../static/ontology/instances/presets/perform-alpha-10-seed.ttl).
Query: [`core.rq`](../../test/competency/core.rq).

### UC-02. State calibrated magnitudes, not just names

*Actor: researcher, data publisher.* "Pink noise at a comfortable level" is not
reproducible. Record the frequency in Hz, the level, and which named band the
number falls in.

Encoded: [`colored-audio-noise.ttl`](../../static/ontology/instances/experiments/colored-audio-noise.ttl),
which distinguishes white, pink, brown, blue, violet, grey and silence as defined
stimulus patterns rather than adjectives.
Query: [`core-plus.rq`](../../test/competency/core-plus.rq).

### UC-03. Say how the stimulus physically reaches the body, separately from how it is perceived

*Actor: device maker, researcher.* Delivery medium and perceived modality are
different axes and routinely diverge. The clearest case: audio drivers placed
against the hands, feet and scalp deliver `mediumContactAcousticVibration` and
are perceived as `modalityTactile` and `modalitySomatosensory`, not as sound.

Encoded: [`multi-headphone-haptic.ttl`](../../static/ontology/instances/experiments/multi-headphone-haptic.ttl).
Query: [`full.rq`](../../test/competency/full.rq).

**Requirement this generates:** a vocabulary that collapses medium into modality
cannot express this use case at all. Keep them independent.

### UC-04. Record what happened during a session, in order, on a stated clock

*Actor: researcher, data publisher, standards implementer.* A session record
that says only "it ran for 20 minutes" cannot be projected onto any event
semantics. Record the ordered event timeline, the clock it is expressed against,
and whether execution completed or stopped early.

Encoded: [`synthetic-reference-session.ttl`](../../static/ontology/instances/sessions/synthetic-reference-session.ttl)
([ADR 0048](../decisions/0048-session-events-and-qualified-observations.md)).
Query: [`full-session-timeline.rq`](../../test/competency/full-session-timeline.rq).

### UC-05. Declare safety boundaries and exposure limits as machine-readable data

*Actor: accessibility specialist, device maker, institution.* A caution that
lives in prose in a README protects nobody. Photosensitivity, eye strain,
hearing risk, optical radiation, balance risk, isolation and environmental
awareness need to be attached to the profile or channel they apply to, as a
reasoned applicability statement rather than a blanket warning.

Encoded: [`color-field-blink.ttl`](../../static/ontology/instances/experiments/color-field-blink.ttl)
(photosensitivity, eye strain),
[`ideal-tactile-immersion.ttl`](../../static/ontology/instances/experiments/ideal-tactile-immersion.ttl)
(balance, optical radiation, body contact, isolation).

### UC-06. Represent a baseline in which the stimulus is the absence of stimulus

*Actor: researcher.* A black visual field and silence is a condition that must be
describable with the same vocabulary as an active one, or no controlled
comparison can be published in it.

Encoded: [`silence-darkness-baseline.ttl`](../../static/ontology/instances/experiments/silence-darkness-baseline.ttl).

### UC-07. Represent an exposure that is present but not perceived

*Actor: researcher, public-interest organization.* Ambient electromagnetic fields
from Wi-Fi, screens and nearby devices are a real physical exposure. Describing
one must not imply that it stimulates anything: `modalityNotDirectlyPerceived`
plus an explicit knowledge status keeps the description honest.

Encoded: [`wifi-em-field-hypothesis.ttl`](../../static/ontology/instances/experiments/wifi-em-field-hypothesis.ttl).

### UC-08. Mark where the scope of "sensory stimulation" ends

*Actor: standards implementer, institution.* The smell of a warm phone and the
taste of a device casing are olfactory and gustatory exposures that are not
sensory stimulation in any useful sense. A vocabulary needs a way to say
"modeled, and deliberately out of scope" rather than leaving the boundary to
folklore.

Encoded: [`smell-taste-device-boundary.ttl`](../../static/ontology/instances/experiments/smell-taste-device-boundary.ttl).

### UC-09. Keep hypothesis, observation and evidence separable

*Actor: researcher, public-interest organization, institution.* A design
objective is not a hypothesis, a participant report is not evidence, and
temporal association is not causation. Each needs its own representation, and
promotion between them needs to be an explicit, governed act.

Encoded: the `hasKnowledgeStatus` and hypothesis structures across every
experiment file; the evidence side in
[`technique-evidence.ttl`](../../static/ontology/instances/evidence/technique-evidence.ttl)
([ADR 0027](../decisions/0027-evidence-claim-family-and-public-claim-gate.md),
[ADR 0028](../decisions/0028-atomic-claim-propositions-and-public-expressions.md)).

### UC-10. Describe a capability no device delivers yet

*Actor: device maker, researcher.* Full-body tactile and volumetric immersion
through clothing, gel, liquid, rigid surfaces, texture, temperature and airflow
is not currently deliverable. Describing the target coherently is how the
capability vocabulary gets designed before the hardware exists, and the knowledge
status keeps it from reading as a product claim.

Encoded: [`ideal-tactile-immersion.ttl`](../../static/ontology/instances/experiments/ideal-tactile-immersion.ttl),
which spans seven perceived modalities and eleven delivery media.

### UC-11. Describe multimodal and cross-modal arrangements

*Actor: researcher, application developer.* Free-view stereoscopy with
headphones, or a social graph visualization combined with conversation and
sound, are single protocols whose channels differ in medium, modality, device
requirement and body placement.

Encoded: [`free-view-stereo-headphones.ttl`](../../static/ontology/instances/experiments/free-view-stereo-headphones.ttl),
[`social-graph-sensory-protocol.ttl`](../../static/ontology/instances/experiments/social-graph-sensory-protocol.ttl),
[`sensory-field-example.ttl`](../../static/ontology/instances/experiments/sensory-field-example.ttl).

### UC-12. State what hardware a protocol requires

*Actor: device maker, application developer.* A protocol that needs per-ear
separation, free-view stereoscopy, display flicker, a haptic actuator or scent
delivery must be able to say so, so that a system can refuse to run it rather
than silently degrading it.

Encoded: the `requiresDeviceCapability` assertions across the experiment files.

### UC-13. Cite a version of the vocabulary that will not change under you

*Actor: researcher, data publisher, institution.* A dataset annotated against a
moving vocabulary is not reproducible. Immutable versioned snapshots, persistent
identifiers and a citable DOI per release are a requirement, not a nicety.

Encoded: `static/ontology/<version>/`, the w3id routes, `void.ttl`,
[`CITATION.cff`](../../CITATION.cff).

### UC-14. Validate a third-party document before trusting it

*Actor: standards implementer, application developer.* A consumer needs to check
an incoming description against a stated contract and get a conformance answer,
without adopting the whole ontology.

Encoded: the Kernel, Core, Core Plus and Full profiles with their separately
selected shape packages
([ADR 0043](../decisions/0043-sstim-core-profile-and-module-boundaries.md),
[ADR 0045](../decisions/0045-shapeless-profiles-are-discovery-entry-points.md)).

---

## Requirements

Each requirement is what the use cases jointly demand. Status is measured
against the current draft vocabulary, and is offered as a starting point for the
group to disagree with.

| # | Requirement | From | Status |
|---|---|---|---|
| R-01 | Delivery medium and perceived modality are independent axes | UC-03, UC-07 | Satisfied |
| R-02 | Magnitudes are recorded as calibrated numbers with units | UC-02 | Satisfied |
| R-03 | A session carries an ordered event timeline against a stated clock | UC-04 | Satisfied |
| R-04 | Safety boundaries attach to the profile or channel they apply to, with a reasoned applicability statement | UC-05 | Satisfied |
| R-05 | The absence of a stimulus is describable in the same vocabulary | UC-06 | Satisfied |
| R-06 | An exposure can be described without asserting that it stimulates | UC-07 | Satisfied |
| R-07 | Scope exclusion is expressible, not implied by omission | UC-08 | Satisfied |
| R-08 | Hypothesis, design objective, observation and evidence are distinct, and promotion between them is governed | UC-09 | Satisfied |
| R-09 | Device capability requirements are machine-readable | UC-12 | Satisfied |
| R-10 | Versions are immutable and citable | UC-13 | Satisfied |
| R-11 | Conformance is checkable against a stated profile without adopting everything | UC-14 | Satisfied |
| R-12 | One coherent modality list | UC-03, UC-08, UC-11 | **Open.** Two divergent lists exist: `sstim:SensoryModality` (6) and `sstim-ex:PerceivedModality` (12). Known problem P5.5 |
| R-13 | Recognized named methods and schools are representable | (absent from every encoded example) | **Open.** [ADR 0030](../decisions/0030-named-methods-and-schools.md) is Proposed and undecided |
| R-14 | A session description can be projected onto external event semantics | UC-04 | **Partial.** The native timeline exists; the HED mapping does not ([ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md)) |
| R-15 | Techniques exist for every modality the vocabulary declares | UC-11 | **Open.** Three of six declared modalities have no technique: vestibular, olfactory, interoceptive |
| R-16 | Descriptions come from more than one author | all | **Open, and the most important one.** Every encoded example above has a single `dct:creator` |

---

## Questions for the group

These are genuine forks where an outside answer would change the vocabulary.
Each has an encoded example attached, so the discussion can be concrete.

1. **Two modality lists.** Should the coarse technique-level list and the finer
   exposure-level list be reconciled, layered, or kept deliberately separate?
   See R-12.
2. **Named methods.** Is Snoezelen a framework, a protocol family, or a new
   class? ADR 0030 frames the question and does not answer it.
3. **Medium and modality divergence.** UC-03 keeps them independent. Is there a
   case where a consumer legitimately needs them joined?
4. **Absence as stimulus.** UC-06 encodes silence and darkness as an exposure
   profile. Is that the right modelling, or should a baseline be a different
   kind of thing?
5. **Not-directly-perceived exposures.** UC-07 keeps them in scope with an
   explicit knowledge status. Should a sensory stimulation vocabulary describe
   them at all?
6. **Evidence tiers.** Who is competent to assign one, and should a vocabulary
   carry tiers or only carry the claim and its source?
7. **Profile granularity.** Are four profiles the right number, and are the
   boundaries in the right places?

## The proposed first substantive topic for the group

The core concept of this vocabulary is not settled, and that is an asset rather
than an embarrassment.

[`SENSORY_STIMULATION_SENSE_REVIEW.md`](../ontology/SENSORY_STIMULATION_SENSE_REVIEW.md)
records what is open: the formal and prose definitions of
`sstim:SensoryStimulation` disagree about whether a recipient needs afferent
processing; "declared purpose" is carrying three separable variables; the clause
that decides the scope is not an inspectable term; and several established
disciplinary senses have never been mapped against ours.

Presenting a finished definition invites acquiescence. Presenting a provisional
model and asking a room of specialists to break it is a real standards problem,
needs no consent machinery to discuss in public, and is the one question where an
outsider's answer genuinely changes the vocabulary rather than decorating it.

> **We make the best provisional model we can, then ask specialists to break it.**

The discriminating-cases instrument in
[`INTERVIEW_PROTOCOL.md`](INTERVIEW_PROTOCOL.md) works as a group exercise as
well as an interview one, and it produces a boundary the group can then argue
about with something concrete on the table.

## Non-scope

Restating the charter, because a use cases document is where scope creep starts:
this work does not define clinical practice guidelines, certify therapeutic
efficacy, prescribe medical protocols, issue public-health recommendations, or
evaluate regulated-device claims. Several use cases above touch safety. None of
them assert that any protocol treats, cures, prevents or diagnoses anything.
