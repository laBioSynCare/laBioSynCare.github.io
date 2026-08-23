# Sensory-Taxonomy Proposal — Critical Review and SSTIM Recommendations

**Status:** Analysis / recommendation (not applied). — 2026-07-07
**Feeds:** IMPROVEMENT_PLAN **P5.5** (modality nomenclature cleanup), **P4**
(external alignment), and touches P5.4 (evidence claims).
**Author note:** No ontology `.ttl` was modified. Per
[ADR 0004](../decisions/0004-protected-ontology-files.md) / CLAUDE.md §3.4, the
Turtle files change only on an explicit maintainer instruction. This document
records what *should* change and why.

---

## 0. TL;DR

An external write-up ("humans have more than five senses; SSTIM should hold a
controlled, extensible sensory taxonomy") was submitted for evaluation. It is a
competent **general** primer on sensory science, but it was written **without
knowledge of SSTIM's current state**, and that changes the conclusion sharply:

- **~70 % of its "add these classes" list already exists** in
  [`sstim-exposure.ttl`](../../static/ontology/sstim-exposure.ttl) under better,
  more precisely-scoped names (`PhysicalDeliveryMedium`, `PerceivedModality`,
  `DeviceCapability`, `KnowledgeStatus`, `StimulusPattern`, `EffectDimension`).
  Adopting its class names verbatim would create **duplicate parallel
  hierarchies** — the exact fragmentation [ADR 0010](../decisions/0010-exposure-delivery-modality.md)
  was written to prevent.
- Its core instinct — **~10 new OWL classes plus a `hasEvidenceStatus`
  property** — **contradicts the established design philosophy**
  ([ADR 0015](../decisions/0015-visual-and-cross-modal-techniques.md)): in SSTIM,
  *modality is a property over dual-typed SKOS concepts, not a class axis*, and
  status is already carried by `sstim:platformDeliverable` + the
  `KnowledgeStatus` scheme + evidence tiers.
- Its Turtle examples use the **wrong namespace and the wrong pattern**
  (`sstim:Auditory` instead of a dual-typed `sstim-v:modalityAuditory`).
- **Where it is genuinely useful:** it independently re-derives the open **P5.5**
  problem (two divergent modality lists), reaffirms SSTIM's "do not close the
  list" SKOS posture, and flags a handful of real coverage gaps
  (**chemesthesis**, **thermal-as-channel**, primary/secondary modality) worth a
  maintainer decision.
- **Reject outright:** ESP / telepathy / clairvoyance as first-class ontology
  terms; nociception/pruriception as *modeled stimulation targets*; a
  `ReceptorMechanism` class; building olfactory/gustatory sub-trees now.

The proposal's own best design principle — *"model a sense only when it
corresponds to a stimulus class, receptor pathway, perceptual domain, or
operational stimulation target"* — is correct, and SSTIM already follows it more
faithfully than the proposal's own class list does.

---

## 1. What SSTIM already models (the load-bearing correction)

The proposal proposes a "core class structure." Here is where each piece already
lives. This is the single most important table in this review.

| Proposal concept | SSTIM status | Existing term(s) |
|---|---|---|
| `SensoryModality` | **Exists (×2 — the problem)** | `sstim:SensoryModality` + `sstim-v:SensoryModalityScheme` (6 concepts) **and** `sstim-ex:PerceivedModality` + `PerceivedModalityScheme` (12). See §3. |
| `StimulusEnergyType` (physical energies) | **Exists, richer** | `sstim-ex:PhysicalDeliveryMedium` / `DeliveryMediumScheme` — 17 media (air-conducted sound, contact/mechanical vibration, visual light, EM field, olfactory/gustatory chemical, thermal contact, airflow, IR/UV, …). |
| `DeviceChannel` | **Exists, richer** | `sstim-ex:DeviceCapability` / `DeviceCapabilityScheme` — 30 capabilities (headphones, HRTF, display flicker, haptic actuator, scent/taste delivery, thermal/airflow actuation, …). |
| `StimulationTechnique` | **Exists** | `sstim:SensoryStimulationTechnique` + `TechniqueScheme` (29 concepts, incl. the ADR 0015 visual/tactile/cross-modal set). |
| `CandidateOrControversialSense` / `hasEvidenceStatus` | **Exists as mechanisms, not a class** | `sstim:platformDeliverable` (xsd:boolean per modality) + `sstim-ex:KnowledgeStatus` / `KnowledgeStatusScheme` (known / hypothesis / unknown / no-known-evidence / not-used / not-deliverable / outside-scope) + the 6-tier `EvidenceClaim` system. |
| `Submodality` / `PerceptualFeature` | **Partial — functionally covered, no dedicated class** | `sstim-ex:StimulusPattern`, `AudioNoiseColor`, `VisualNoiseType`, `EffectDimension`, and datatype props `hasFrequencyHz` / `hasFlickerRateHz` / `hasBeatFrequencyHz`. |
| `IntegratedPercept` (flavor, presence, agency) | **Partial — no class** | `EffectDimensionScheme` has `effectSpatialPresence`, `effectImmersion`, `effectSocialConnectedness`; `PerceptualGainScheme` has `gainSpatialPresence`. |
| `ReceptorMechanism` | **Absent** | Closest is `sstim:StimulationMechanism` (a *neurobiological pathway*, not a receptor/transduction class) — deliberately different. |
| `ColloquialSenseTerm` | **Absent** | — (see §6, recommend defer/reject). |

Corresponding property overlaps:

| Proposal property | SSTIM equivalent |
|---|---|
| `usesSensoryModality` | `sstim:techniqueModality` (coarse) + `sstim-ex:perceivedModality` |
| `usesStimulusEnergy` | `sstim-ex:deliveryMedium` |
| `usesDeviceChannel` | `sstim-ex:requiresDeviceCapability` |
| `evokesIntegratedPercept` | `sstim-ex:hasPerceptualGain` / `concernsEffectDimension` |
| `hasEvidenceStatus` | `sstim-ex:hasKnowledgeStatus` + the evidence-tier system — **do not add a third** |
| `hasSubmodality` / `hasPerceptualFeature` | no direct equivalent (needs justification, §5) |
| `targetsReceptorMechanism` | absent (see §6) |

**The proposal's flagship example round-trips onto existing terms today:**

```turtle
# Proposal (wrong namespace, undefined terms, not dual-typed):
sstim:BinauralBeatStimulation
  a sstim:StimulationTechnique ;
  sstim:usesSensoryModality sstim:Auditory ;
  sstim:usesStimulusEnergy  sstim:AcousticPressureWave ;
  sstim:hasPerceptualFeature sstim:BeatFrequency ;
  sstim:usesDeviceChannel   sstim:Headphones .

# The same statement in real SSTIM terms (all already defined). Note the
# medium / perceived modality / beat frequency sit on a StimulusChannel — their
# rdfs:domain — reached from the profile via usesStimulusChannel:
sstim-v:techBinauralBeats            # existing technique concept
  a sstim:EntrainmentBasedTechnique ;
  sstim:techniqueModality sstim-v:modalityAuditory ;
  sstim-ex:hasExposureProfile [
    sstim-ex:usesStimulusChannel [
      sstim-ex:deliveryMedium     sstim-ex:mediumAirConductedSound ;
      sstim-ex:perceivedModality  sstim-ex:modalityAuditory ;
      sstim-ex:hasBeatFrequencyHz "10.0"^^xsd:decimal ] ;
    sstim-ex:requiresDeviceCapability sstim-ex:capabilityHeadphones ] .
```

The example is not evidence that SSTIM needs new classes; it is evidence that the
author had not seen the exposure module.

---

## 2. Design-philosophy conflict (why the class list must be rejected)

The proposal's central move is to mint many OWL classes. SSTIM's recorded
decisions push the opposite way:

- [ADR 0015](../decisions/0015-visual-and-cross-modal-techniques.md): visual /
  tactile / cross-modal support was added with **"No new OWL classes or SHACL
  shapes."** Modality is a **property** (`techniqueModality`); **cross-modal =
  multiple modality values**, explicitly *not* a `CrossModal` class, because a
  class axis "would collide with the disjoint Entrainment/Non-Entrainment
  partition and duplicate information."
- [ADR 0002](../decisions/0002-dual-typing-owl-skos.md): vocabulary terms are
  **dual-typed SKOS concepts** (`owl:NamedIndividual, <OWL class>, skos:Concept`),
  populated in `sstim-vocab.ttl`, not bare OWL classes.
- [ADR 0010](../decisions/0010-exposure-delivery-modality.md): the *reason* the
  exposure module exists is that a single "modality" idea actually decomposes into
  medium / perceived channel / device capability / body placement / knowledge
  status — and each got a controlled vocabulary, **not** a class tree.

So the correct SSTIM shape for any new "sense" is: **a dual-typed SKOS concept in
an existing scheme, tagged with `platformDeliverable` and (where useful) a
`KnowledgeStatus`, aligned to Wikidata/OBO where an exact match is verified** —
never a new top-level OWL class per sense.

---

## 3. The real, already-tracked problem the proposal re-derives: P5.5

The proposal's strongest contribution is independent confirmation of
**IMPROVEMENT_PLAN P5.5**. SSTIM currently carries **three** `modality*` concept
families, two of which share a namespace stem and mean different things:

| Family | Scheme | Purpose | Members |
|---|---|---|---|
| `sstim-v:modalityAuditory …` | `SensoryModalityScheme` | perceptual **channel** for techniques | auditory, visual, somatosensory, interoceptive, vestibular, olfactory (6) |
| `sstim-v:modalityAUD …` | `EvidenceModalityScheme` | **evidence-provenance** tag | AUD, AV, BREATH, GENERAL, PRECLINICAL, REVIEW, VIS, TACTILE, MULTISENSORY (9) |
| `sstim-ex:modalityAuditory …` | `PerceivedModalityScheme` | **perceived** modality of an exposure | auditory, visual, **tactile**, somatosensory, interoceptive, vestibular, **proprioceptive**, olfactory, **gustatory**, **socialPerceptual**, **multimodal**, **notDirectlyPerceived** (12) |

Two concrete hazards, both worth fixing under P5.5:

1. **Namespace-stem overload.** `sstim-v:modality*` is used for *both* sensory
   channels *and* evidence-provenance tags. A reader (or a naive SPARQL `FILTER
   STRSTARTS(STR(?m), "…/vocab#modality")`) cannot tell `modalityAuditory` (a
   channel) from `modalityAUD` (an evidence tag) by local name. Recommend renaming
   the evidence tags to an unambiguous stem (e.g. `evTagAUD` / `evidenceModAUD`)
   at the next **major** version, or at minimum documenting the collision loudly.
   *(Rename is breaking — hold for a major bump; the doc note is cheap now.)*
2. **Channel-list divergence.** `SensoryModalityScheme` (6) and
   `PerceivedModalityScheme` (12) disagree on membership (`tactile`,
   `proprioceptive`, `gustatory`, `socialPerceptual`, `multimodal`,
   `notDirectlyPerceived` exist only in the exposure list; `somatosensory` vs
   `tactile` overlap ambiguously). P5.5 already prescribes the resolution:
   **haptic = device/actuator, tactile = percept, somatosensory = superordinate
   channel, vibrotactile = mechanism.** The two schemes should be reconciled to a
   single source of truth for channels (recommend: `SensoryModalityScheme` is the
   canonical channel list; `PerceivedModalityScheme` either `skos:exactMatch`es
   into it or is folded in), with the extra exposure entries reclassified:
   `multimodal` / `notDirectlyPerceived` are *not* channels and should not sit in
   the same flat list as `auditory`.

**Minor doc-drift found in passing:** `sstim-core.ttl:231` still defines
`EvidenceModalityTag` as *"Values: AUD, AV, BREATH, GENERAL, PRECLINICAL,
REVIEW"* — six — but P5.6 grew the scheme to nine (added VIS, TACTILE,
MULTISENSORY). The definition string should be updated to match, or reworded to
not enumerate.

---

## 4. Naming / convention corrections the proposal needs

If any of its terms are adopted, they must be rewritten to SSTIM conventions:

| Proposal writes | Correct SSTIM form | Why |
|---|---|---|
| `sstim:Auditory` | `sstim-v:modalityAuditory` (`owl:NamedIndividual, sstim:SensoryModality, skos:Concept`; `skos:notation "auditory"`; `skos:inScheme sstim-v:SensoryModalityScheme`) | Wrong namespace (concepts live in `sstim-v:`), wrong casing/stem, and missing dual-typing (ADR 0001/0002). |
| `sstim:AcousticPressureWave` | `sstim-ex:mediumAirConductedSound` | Already defined; don't mint a synonym. |
| `sstim:Headphones` | `sstim-ex:capabilityHeadphones` | Already defined. |
| `sstim:BeatFrequency` (a "PerceptualFeature") | `sstim-ex:hasBeatFrequencyHz` (datatype value) | A quantity, not a concept — SSTIM already models it as a typed literal. |
| `sstim:hasEvidenceStatus` | `sstim-ex:hasKnowledgeStatus` (+ evidence tiers) | Adding a third status axis fragments the model (ADR 0010 forbade parallel status/health properties). |

---

## 5. Genuine gaps — ranked, with verdicts

Each item: **Verdict** (Adopt / Consider / Defer / Reject), the reason, and how it
maps onto existing mechanisms. "Adopt" here still means *propose to the
maintainer* — nothing is applied.

### 5.1 Chemesthesis / trigeminal chemical sense — **Consider (low delivery priority)**
Genuinely absent from every modality list, and genuinely distinct from
olfaction/gustation (menthol cooling, capsaicin burn, CO₂ pungency). If SSTIM
aims to be a scientifically credible *reusable* channel vocabulary, registering
`chemesthetic` as a channel concept is cheap and correct. **But** BSC Lab cannot
deliver it, so it must carry `sstim:platformDeliverable "false"` +
`sstim-ex:hasKnowledgeStatus sstim-ex:outsideBSCLabScope` and align to Wikidata
(chemesthesis) rather than seed a sub-tree. Do **not** build submodalities
(spicy/cooling/astringent) now — dead vocabulary until a delivery path exists.

### 5.2 Thermal as a first-class *channel* — **Consider / decide explicitly**
Temperature currently appears as a **medium** (`mediumThermalContact`), an
**effect dimension** (`effectTemperaturePerception`), and a **device capability**
(`capabilityThermalActuation`) — but there is no perceived-modality concept for
it; it is implicitly under `somatosensory`. P5.5 is the moment to decide: keep
thermal as a somatosensory submodality (recommended, matching clinical
"general senses"), or promote it to a channel (only if a heat actuator ships).
Recommend **submodality**, documented, not a new top channel.

### 5.3 Primary vs secondary modality — **Consider**
The proposal's `hasPrimaryModality` / `hasSecondaryModality` split is a real
refinement `techniqueModality` lacks (today all values are equal). ADR 0015
deliberately kept cross-modal as an unordered multi-value set. Only add ordered
sub-properties if a query need appears (e.g. "audio-led vs vision-led AVE");
otherwise the flat multi-value set is simpler and sufficient. **Defer until a
consumer needs the ordering.**

### 5.4 Kinesthesia / proprioceptive submodality — **Defer**
`proprioceptive` exists in the exposure list. `kinesthetic` as `skos:narrower`
is defensible but adds nothing until BSC models movement stimulation. Low value.

### 5.5 IntegratedPercept (flavor / body-ownership / agency / presence) — **Defer**
Presence, immersion, and social connectedness already exist as effect
dimensions/gains. A dedicated `IntegratedPercept` class is over-engineering until
a genuine multisensory-delivery use case exists; `flavor` is irrelevant to BSC
delivery. Keep these as effect dimensions.

---

## 6. Explicit rejections

- **~10 new OWL classes** (`Submodality`, `PerceptualFeature`, `StimulusEnergyType`,
  `ReceptorMechanism`, `DeviceChannel`, `IntegratedPercept`,
  `ColloquialSenseTerm`, `CandidateOrControversialSense`). Rejected: duplicates
  existing exposure classes and violates the ADR 0015 "property, not class axis"
  philosophy.
- **`ReceptorMechanism` class.** Rejected as out of scope: SSTIM models
  stimulation parameters and a *neurobiological* `StimulationMechanism`, not
  receptor/transduction physiology. Receptor detail belongs in an aligned upstream
  ontology (Uberon/NIFSTD/OBO), reachable via `skos:relatedMatch`, not re-modeled.
- **`hasEvidenceStatus` property.** Rejected: a third status axis on top of
  `KnowledgeStatus` + evidence tiers. ADR 0010 explicitly refused parallel
  status/benefit properties.
- **ESP / clairvoyance / telepathy / "sixth sense" as ontology terms.**
  Rejected for a scientific artifact heading toward LOV/BioPortal/Archivo
  registration ([ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md)):
  minting IRIs for parapsychology reads as endorsement, invites reversion/ridicule
  in registries, and clashes with the conservative wellness posture
  ([SCOPE](../concept/SCOPE.md), CLAUDE.md §3.5). A *cultural-term register*
  (intuition, gut feeling as metaphor) is at most a tiny, clearly-fenced,
  non-physiological set kept off the modality axis — and it is **optional and low
  priority**; recommend not building it until there's a concrete need
  (e.g. public-facing disambiguation).
- **Nociception / pruriception as modeled stimulation targets.** Rejected: SSTIM
  must never present pain or itch as things it *stimulates* — that collides
  head-on with the no-medical-claims invariant, and there is no delivery path.
  Pain/discomfort belongs only as **risk / comfort** metadata, which already
  exists (`effectDiscomfort`, `ComfortBoundaryScheme`, `ExposureLimit`). If ever
  needed, extend those, not the modality list.
- **Building out olfactory / gustatory submodality trees now.** Rejected as
  premature: not deliverable, adds dead vocabulary. Register the top channels
  (already present) with `platformDeliverable false`; defer sub-trees.

---

## 7. External-alignment posture (P4 / ADR 0016)

Any modality concept added or reconciled should carry a **verified** external
mapping, following the 0.2.0 erratum discipline (**verify every QID/PURL live;
never fabricate**):

- `skos:closeMatch`/`exactMatch` to Wikidata for chemesthesis, thermoception,
  proprioception, interoception, vestibular sense, etc.
- `skos:relatedMatch` to OBO/Uberon/NIFSTD where the upstream term is a receptor
  or anatomical structure (this is where "receptor mechanism" detail should point,
  per §6).
- Stay OBO-*interoperable*, not OBO-*member* (ADR 0016 decision 2): keep
  human-readable `sstim-v:` IRIs; do not mint opaque numeric IDs.

---

## 8. Concrete proposal set for the maintainer (nothing applied)

Ordered by value. Each is an additive, minor-version change unless noted.

1. **P5.5 channel harmonization** *(already planned; this review adds urgency and
   the namespace-overload finding).* Pick `SensoryModalityScheme` as the single
   canonical channel list; reconcile `PerceivedModalityScheme` into it via
   `skos:exactMatch` or folding; reclassify `multimodal` / `notDirectlyPerceived`
   out of the channel list; apply the haptic/tactile/somatosensory/vibrotactile
   convention.
2. **Fix the `EvidenceModalityTag` definition drift** at `sstim-core.ttl:231`
   (6 → 9 values, or reword to not enumerate). Trivial, do with the next TTL edit.
3. **Document the `sstim-v:modality*` stem overload** (channels vs evidence tags);
   schedule a rename to a distinct evidence-tag stem for the next **major** bump.
4. **Decide thermal** (submodality vs channel) and **chemesthesis** (register as a
   non-deliverable channel with Wikidata alignment, or record as a deliberate
   known-omission). Either way, write the decision down.
5. **Record the rejections** (ESP, nociception-as-target, receptor class, new OWL
   class list) as a short ADR or a note appended to P5.5, so the "why not" is
   durable and the next contributor doesn't re-propose them.

Items 1–2 are safe additive/editorial changes. Item 3 is breaking (defer). Items
4–5 are decisions, not code — they belong to the maintainer.

---

## 9. Bottom line

The proposal is worth reading as a sanity check, and it usefully re-confirms P5.5
and surfaces chemesthesis/thermal as honest gaps. But its concrete
recommendation — a new multi-class taxonomy with its own status property — is the
wrong shape for this ontology and would undo the deliberate work in ADRs
0010/0015. SSTIM already implements the *good* version of the proposal's idea:
one dual-typed SKOS channel vocabulary, physical delivery / device capability /
knowledge status separated into the exposure module, breadth registered cheaply
via `platformDeliverable` + `KnowledgeStatus` rather than closed off. The work to
do is **harmonization and two or three honest additions**, not a rebuild.

## See also

- [ADR 0010](../decisions/0010-exposure-delivery-modality.md) — delivery vs
  perceived modality vs device capability vs status (the module this review leans on).
- [ADR 0015](../decisions/0015-visual-and-cross-modal-techniques.md) — modality as
  property, cross-modal as multi-value, no new classes.
- [ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md) — OBO
  posture and verified-alignment discipline.
- [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md) — P4, **P5.5**, P5.4.
- [`../concept/SCOPE.md`](../concept/SCOPE.md) / CLAUDE.md §3.5 — wellness framing
  the ESP/nociception rejections rest on.
