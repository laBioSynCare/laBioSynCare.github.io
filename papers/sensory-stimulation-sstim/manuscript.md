---
title: "Toward a Formal Science of Sensory Stimulation: An Operational Definition, an Interoperable Knowledge Model, and the SSTIM Ontology"
subtitle: "Working academic manuscript, not a submitted or peer-reviewed publication"
lang: en
date: 2026-11-19
bibliography: references.bib
---

# Toward a Formal Science of Sensory Stimulation

## Author and manuscript status

**Renato Fabbri** (working lead-author attribution; affiliation and contributions to be confirmed).

**Draft status:** substantive first draft with prospective evaluation, not a results paper. This manuscript is not a W3C Community Group recommendation, report, or endorsement. Names of researchers discussed in the accompanying research-connection plan do not imply participation in this manuscript.

## Abstract

Sensory stimulation research spans neuroscience, psychophysics, cognitive science, human-computer interaction, clinical investigation, engineering and the arts. Its experimental descriptions often conflate an intended stimulus with its physical delivery, a sensory response with conscious perception, and a time-locked neural signal with successful neural entrainment or a beneficial outcome. These distinctions hinder comparison of protocols, interpretation of evidence and reproducibility across laboratories and devices. We present the rationale and architecture of SSTIM, an open, modular ontology and knowledge-representation suite for structured stimulation. SSTIM defines sensory stimulation operationally as a process in which structured sensory input is delivered according to specified parameters for a declared purpose. Its model distinguishes stimulus specifications, techniques, implementations, delivery conditions, session plans, executed sessions, observations, evidence claims and provenance; it also represents the boundary with direct neural stimulation and neuromodulation. We describe the ontology profiles, linked-data and validation infrastructure and a prospective evaluation method using competency questions, published-protocol representation, semantic conformance, independent re-encoding and AI-assisted cross-system exchange. Finally, we identify research problems spanning parametric stimulation, multisensory integration, shared experiences and ergonomic context. The ontology and existing examples establish infrastructure for testable description, not clinical efficacy or validated neural effects. The proposed evaluation will determine SSTIM's added value relative to less structured representations and adjacent standards.

**Keywords:** sensory stimulation; ontology; knowledge representation; reproducibility; multimodal perception; scientific evidence; neural entrainment; AI interoperability; semantic web.

## 1. Introduction

Sensory stimulation is a domain without a single disciplinary boundary. Acoustic, visual, tactile, vestibular, olfactory and interoceptive inputs are studied as physical exposures, transduced signals, percepts, behavioral cues, and potential interventions. A periodic sound may elicit a time-locked auditory response without causing a sustained shift in endogenous oscillatory dynamics. A paced-breathing animation can invite a change in respiratory behavior without establishing that the participant followed its timing. An audiovisual display can increase perceptual salience in one task and introduce interference in another. These are separate empirical questions rather than mutually interchangeable consequences of a stimulus description.

The broader problem is representational. Published studies may identify a technique by name or label a rhythm by a familiar EEG band while leaving essential information about physical delivery, device capabilities, temporal structure, task context, intended outcomes or measured observations implicit. This obstructs both human comparison and machine-assisted retrieval. Established standards address neighboring layers: BIDS organizes research datasets [@Gorgolewski2016], while the FAIR principles motivate persistent, reusable metadata and provenance [@Wilkinson2016]. A domain-specific representation must complement, rather than reproduce, these standards.

This article develops the following question: **Can a shared, formally constrained description of sensory stimulation make experimental protocols and their evidence more comparable, independently inspectable and reusable?** SSTIM is proposed as an answer to the representation problem, not as a prescriptive theory of physiological responses.

## 2. Conceptual scope and operational definition

### 2.1. Sensory, perceptual, cognitive and neural dimensions

SSTIM defines *sensory stimulation* as a process in which structured sensory input is delivered according to specified parameters for a declared purpose ([canonical conceptual definition](../../docs/concept/SENSORY_STIMULATION.md)). The process is defined by planned and implemented sensory access, not by a guaranteed sensation or effect. Structure includes naturalistic, stochastic, complex and quasi-periodic inputs, not only periodic waveforms.

The distinctions used throughout this article are:

| Layer | Scientific question | Example observation or artifact |
| --- | --- | --- |
| Stimulus specification | What physical or chemical input is intended? | Left/right acoustic frequency, envelope, duration |
| Implementation | How is that specification generated? | Named renderer, transducer, device capabilities |
| Delivered exposure | What reaches the relevant bodily site? | Calibrated ear-level sound under specified conditions |
| Transduction and neural response | What biological response is measured? | Auditory steady-state response or other recorded activity |
| Perception | What is consciously experienced? | Pitch, beat percept, depth, salience, comfort |
| Cognition and behavior | What action or performance changes? | Attention task, coordinated breathing, report |
| Interpretation | What evidence supports a bounded conclusion? | Comparator-specific estimate and uncertainty |

“Perceptual stimulation” and “cognitive stimulation” are useful descriptions of intended engagement or target processes but are not synonyms for receptor-mediated stimulation. Sensory input may support cognitive tasks, and a cognitive task may alter sensory attention; neither equivalence follows by definition.

### 2.2. Boundary with neuromodulation and direct neural stimulation

Physical energy type, access route, neural target, intervention goal and observed outcome are orthogonal descriptors. Electrical and magnetic stimulation are not, simply by being electrical or magnetic, sensory stimulation or brain stimulation. Conversely, perception and cognition can be investigated under electrical or magnetic neural interventions. SSTIM models the overlap of sensory stimulation with neuromodulation through an explicit sensory route, while allowing direct-neural methods to be represented without falsely asserting receptor-mediated access ([ADR 0034](../../docs/decisions/0034-neuromodulation-relation-and-neural-target-axis.md)). The domain model also distinguishes neurostimulation from self-directed neuromodulation ([ADR 0068](../../docs/decisions/0068-neurostimulation-excludes-self-directed-neuromodulation.md)).

This separation is essential when apparent transcranial effects may involve peripheral sensation or when perceptual reports are ancillary to a neural-target intervention.

### 2.3. Oscillatory responses and the entrainment problem

Periodic sensory stimulation may evoke auditory, visual or somatosensory responses at stimulus frequencies or their harmonics. Such a response does not automatically establish dynamical entrainment of an endogenous neural oscillator [@Duecker2024]. For auditory stimulation, carrier frequency, modulation frequency, signal envelope, laterality, intensity, time course and delivery conditions must be considered independently.

Consequently, a parameter nominally described as “10 Hz” does not by itself establish an alpha-band change, a perceptual state or a functional benefit. These claims require distinct observations, comparators and evidence assessments.

## 3. Materials and methods: the SSTIM representation approach

### 3.1. Design requirements

The current SSTIM design is driven by separations necessary for scientific description: specification versus execution; stimulus medium versus perceived modality; declared purpose versus observed outcome; hypothesis versus evidence assessment; and reusable ontology terms versus implementation-specific records. Requirements are documented through ontology decisions, public use cases and executable competency questions. The use-case catalogue is a Community Group working draft and should not be described as an adopted standard.

We treat interoperability as the ability of an independent consumer to retrieve, interpret and validate a description while preserving its explicitly represented meaning and identifying information loss. This is narrower than physical signal reproduction and does not establish physiological equivalence.

### 3.2. Architecture

The repository implements a modular RDF/OWL/SKOS knowledge model and SHACL validation profiles with stable IRIs. The **Kernel**, **Core**, **Core Plus** and **Full** profiles support different descriptive needs. The smaller profiles deliberately avoid requiring the full ecosystem of techniques, evidence records and implementation data. The Full suite covers processes, stimulus descriptions, techniques, configurations, session plans and instances, evidence assessments, exposure conditions and other optional concerns.

The authoritative, versioned module inventory lives in the repository manifest, not in this manuscript. A fixed scientific citation must identify the frozen release rather than mutable development sources. At the start of this draft, the identified release is SSTIM v0.21.0 (2026-11-01; DOI 10.5281/zenodo.23868027). Exact profile closures and term counts should be regenerated and checked against the pinned snapshot when this article is submitted.

### 3.3. From protocol to event and observation

The principal distinction is a progression:

**Technique and protocol → stimulus specification → planned session → actual session → ordered events and observations → evidence-qualified interpretation.**

An exposure profile describes relevant delivery and perception conditions rather than itself being the physical exposure event. A session specification is a plan; a session instance records what actually happened. Reports have a participant, collection phase and provenance. An evidence assessment states a proposition and its evidential basis, not merely that a report exists.

The SSTIM Workbench provides a non-normative reference implementation. Its ability to generate or inspect a digital signal is not proof of delivered dose, entrainment or efficacy. The commercial application BioSynCare is a separate implementation and must not be treated as the ontology's normative reference or as a source of efficacy evidence.

### 3.4. Relation to adjacent standards

SSTIM is designed as a domain layer rather than a replacement for general provenance, ontology or data standards. Its comparisons should explicitly cover upper ontologies and experimental ontologies (including BFO and OBI), W3C PROV and SKOS, HED event semantics, BIDS research datasets, and relevant observation/sensor models. For each system, the comparison will identify which SSTIM question is already handled, which mapping is demonstrated, and which capability remains proposed.

**[SUBMISSION GAP: add a source-verified comparative matrix and at least one executable mapping/round-trip example. Avoid vague claims of novelty based only on term-name comparisons.]**

## 4. Demonstrations and evaluation design

### 4.1. Public artifacts available for inspection

The repository includes reference protocols encoded from published literature, exploratory exposure examples, reference configurations, qualified evidence assessments and an expressly synthetic session record. The synthetic record illustrates pre/post reports and provenance; it is not human-participant evidence. Exploratory protocol records encode research questions and knowledge status, not outcomes of completed experiments. The repository's maintained current-state document identifies nine literature-derived protocols and ten exploratory exposure examples at the verified drafting baseline.

The 2021 voluntary web-based work that preceded SSTIM reportedly involved approximately 2,500 participants and more than 6,200 sessions. It is context for feasibility and research motivation only: without randomization, controls and standardized measures it cannot support causal clinical claims. Any detailed account of that program requires a separately inspectable provenance and limitations statement.

### 4.2. Evaluation questions and required evidence

The manuscript will assess four independent claims:

1. **Representational coverage.** Can published protocols and difficult boundary cases be represented without asserting effects or fabricated quantities?
2. **Semantic consistency.** Are profile closure, domain/range, SHACL rules, controlled values and competency queries internally consistent?
3. **Interoperability.** Can an independent adopter encode and retrieve an example without undocumented loss, with loss cases identified?
4. **Incremental utility.** Does SSTIM improve a measurable task compared with unstructured text, generic metadata, or another appropriately selected baseline?

Evidence for the first two will include pinned data and validation commands. The third requires at least one external or independently prepared implementation and a predefined round-trip semantic comparison. The fourth requires task design, baselines, outcome metrics, and failure analysis; an assertion that structured data is useful is insufficient.

**[RESULTS SLOT: insert reproducible tables, scripts, commit/DOI, environment, observed outputs and independent verification. Do not manufacture pass counts or user-study numbers.]**

### 4.3. Candidate AI-assisted exchange benchmark

A practical demonstration is the translation of a natural-language experiment request into an engine-independent SSTIM description that is validated and interpreted by an independent consumer. Compare **unconstrained generation**, **retrieval-assisted generation**, and **SSTIM-grounded generation with deterministic validation**. Measure conformance, parameter preservation, semantic agreement, omissions, unsupported claims and reproducibility of the validation result.

AI may draft artifacts or propose hypotheses; it does not make a physiological assertion true. Generated descriptions do not equal executed sessions. See the repository's [AI evaluation proposal](../../docs/ecosystem/AI_INTEROPERABILITY_AND_EVALUATION_PROPOSAL.md) for an earlier, non-adopted plan.

**[INTEGRATION SLOT: add a fully specified human/AI study, baseline selection, sealed tasks and independent grading; coordinate with the AI, sensing and cognitive-science research bridges in RESEARCH_CONNECTIONS.md.]**

## 5. Scientific research agenda enabled by this model

The following are **proposed studies, not SSTIM evaluation results**.

**Parametric auditory stimulation.** For each method, characterize the dependence of perceptual and physiological endpoints on carrier, modulation, waveform, level, duration, device and task. “Best frequency” is meaningful only for a specified endpoint and population. Factorial or response-surface designs should predefine primary outcomes, randomization, dose checks and multiplicity control.

**Multisensory integration.** Compare single-channel stimulation, temporally aligned combinations and controlled misalignment. Hypotheses of enhancement, suppression or interference must be tested rather than assuming that combining senses always helps [@SteinStanford2008; @ErnstBulthoff2004].

**Shared experience.** Separate identical stimulus delivery, participant awareness of co-presence, direct interaction, and subsequent narration. Measure social/subjective outcomes independently of neural or physiological synchrony; a synchronized application clock is not an interpersonal biological result.

**Ergonomics and context.** Investigate work, rest, contemplative experience, art and well-being as different tasks and environments. Relevant endpoints include subjective comfort, interference with primary activity, accessibility, habituation, sustained engagement and measured outcomes where suitable. A session designed for immersive, eyes-closed listening is not automatically appropriate while driving or working.

**Low-cost and augmented measurement.** Computers and smartphones can deliver some stimuli and obtain reports and behavioral responses, subject to platform timing and output limitations. Calibrated acoustics, EEG, eye tracking, ECG, respiration sensors and dedicated tactile devices extend the available measurements but cannot be inferred from app parameters alone.

**[INTEGRATION SLOT: write formal, preregisterable examples showing the SSTIM entities required at protocol, execution, event, exposure, report and evidence layers.]**

## 6. Discussion

An interoperable vocabulary can expose ambiguities that prose often hides: intended versus actual frequencies, measured versus presumed physiological responses, subjective reports versus causal evidence, and a result tied to one modality versus an unjustified cross-modal generalization. These are worthwhile improvements even when no new stimulation technique is introduced.

SSTIM's scope is not restricted to a particular audiovisual engine, business, research school or neural theory. This neutrality should be demonstrated by independent protocols and users rather than asserted from ontology design alone.

Its limitations are significant. Structured conformance does not guarantee physical fidelity or safety. An OWL inference is not an experimental observation. A claim's provenance cannot independently establish that its source was correct. Some mechanisms remain contested, some sensory modalities lack equally mature implementation paths, and third-party adoption cannot be presumed. Without external replication, the strongest claim remains that a documented representation and validation approach exists, not that it improves research outcomes in practice.

A broader bridge between sensory science, scientific AI, multimodal sensing, social cognition and the legal conditions of deployment may help define new research questions and evaluation settings. These contributions should enter the main argument through tested methods and reviewed literature, rather than as honorary names or disconnected application paragraphs.

**[INTEGRATION SLOT: synthesize the four disciplinary bridges from RESEARCH_CONNECTIONS.md only after their source review and, if applicable, feedback from the named researchers.]**

## 7. Conclusion

SSTIM proposes a machine-readable account of structured sensory stimulation that separates delivery, response, perception, cognition and evidence. Its immediate value is a falsifiable research-infrastructure proposition: more precise descriptions may improve comparison, validation and reuse. The present manuscript supplies the conceptual foundation and prospective evaluation protocol. The next step is independently reproducible evaluation, including failure cases and explicit comparison with existing standards. Claims about neural entrainment, cognition, health or interpersonal synchrony remain experiment-specific and cannot be inferred from ontology conformance.

## Data, code, ethics, conflicts and contributions

**Software and vocabulary:** https://github.com/w3c-cg/sstim ; release baseline https://doi.org/10.5281/zenodo.23868027 . Submission must identify the exact frozen artifact evaluated.

**Data availability:** The existing public ontology, synthetic fixtures and reference representations are in the linked repository. **No new human-participant dataset is claimed for this draft.**

**Ethics:** This ontology/methodology manuscript does not report newly collected participant data. Human-subject studies described in the research agenda require their own oversight, consent and data-handling decisions.

**Competing interests:** [TO COMPLETE: author interests and relation to the commercial BioSynCare product.]

**Funding:** [TO COMPLETE, or state none if verified.]

**Author contributions and acknowledgments:** [TO COMPLETE with contributions and agreement. Do not include named prospective collaborators as coauthors or endorsers.]

## References

References are stored in [references.bib](references.bib). Before submission, complete a journal-compliant bibliography and resolve all narrative and bracketed citations to verified sources.
