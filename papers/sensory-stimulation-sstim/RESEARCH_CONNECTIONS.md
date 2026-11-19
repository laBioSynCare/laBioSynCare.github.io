# Research connections: SSTIM, AI and interdisciplinary investigators

**Working integration document, not a list of participants, endorsements or coauthors.** These are independently motivated areas for literature review, experimental design, and possible expert feedback. No named individual is asserted to have accepted this project or to endorse its claims. Verify names, positions, publications and any proposed contribution again before external use.

## The unifying scientific question

What would it take to move from merely delivering a parameterized sensory input to a **scientifically reusable, AI-interpretable account of the stimulus, experience and observed response**, with reliable limits on what can be inferred?

A single experimental record could connect: physical and temporal specification → real delivered exposure → perceptual and behavioral measurement → neural/physiological observations where measured → evidence assessment → machine-readable provenance → reproducibility and governance.

This is the **glue**: each discipline studies a different part of the chain, and SSTIM provides the candidate linking representation. It is not a claim that the ontology solves each discipline's research problems.

## 1. AI: from language to verifiable scientific interaction

### Why this belongs in the paper

AI systems can assist with authoring, querying and comparing sensory-stimulation descriptions, but fluent language generation is not semantic consistency, safe delivery or mechanistic inference. We can test whether SSTIM constrains these failures and improves portability between independent AI systems and software implementations.

### Candidate study

Use a fixed, independently designed corpus of sensory-study tasks. Compare:
- Free-text descriptions and unconstrained model output.
- Generic structured JSON with an explicit schema.
- Retrieval of relevant scientific sources without SSTIM.
- Pinned SSTIM terms, exact module closures and deterministic SHACL / competence checks.

Primary outcomes: preservation of frequency, magnitude, medium, modality, timing, phase, laterality, control regime and uncertainty; correctly bounded evidence claims; machine conformance; independently assessed meaning preservation; time and corrections required. Include adversarial ambiguous tasks and out-of-scope requests. Record models, versions, prompts, seeds if applicable and runtime costs.

### Integration space in manuscript

- Section 3.4: SSTIM versus generic knowledge and research-data models.
- Section 4.3: reproducible, blinded AI-to-SSTIM benchmark and ablation.
- Section 6: scientific utility and failure limits.
- **[WRITE: identify current SSTIM MCP/SDK interfaces from the current repository; do not reuse obsolete 2026-10 assumptions. Specify which operations are read-only and which require human approval.]**

Relevant repo sources: [AI complementarity](../../docs/concept/SSTIM_LLM_COMPLEMENTARITY.md), [AI interoperability proposal](../../docs/ecosystem/AI_INTEROPERABILITY_AND_EVALUATION_PROPOSAL.md), [agent automation boundary](../../docs/technical/AGENT_AUTOMATION_BOUNDARY.md).

## 2. Osvaldo Novais de Oliveira Jr.: sensing, data science and physical measurement

### Verified intellectual intersection

Oliveira's published research includes physical sensors and biosensors, information visualization and the interface between sensing systems and AI. These are **adjacent, complementary methods**, not evidence that Oliveira has participated in SSTIM.

Research starting points:
- [Oliveira and collaborators, Information Visualization to Enhance Sensitivity and Selectivity in Biosensing (2012)](https://doi.org/10.1007/s13758-012-0053-7).
- [Oliveira, Sensing and Biosensing in the World of Autonomous Machines and Intelligent Systems (2021)](https://doi.org/10.3389/fsens.2021.752754).

### Possible scientific bridge

Treat the sensory-stimulation study as a *controlled-input, multivariate-observation* problem. SSTIM describes the input and context, while a calibrated sensing pipeline characterizes real-world output and participant responses. Explore:
- Information visualization for large carrier/modulator × modality × task × participant data.
- Provenance-aware data fusion across sensors and subjective reports.
- Physical calibration, artifacts and uncertainty propagation between digital instructions and delivered exposure.
- Interoperability between stimulus metadata and the metadata of measurement devices.

Avoid implying an **electronic tongue** or related biosensor literature directly demonstrates effects of audio/visual stimulation. The connection is methodological: designing, measuring and analyzing complex signals.

**[WRITE: one paragraph integrating sensor-array/data-fusion methods into Section 4 evaluation, with sources and a specific synthetic or real case study.]**  
**[ASK/VERIFY LATER: which sensing methods, materials or quantitative tools does Oliveira consider directly relevant, if a scientific discussion occurs?]**

## 3. Roberto Vezzani: computer vision, multimodal AI and human-centered measurement

### Verified intellectual intersection

Roberto Vezzani's UNIMORE/AImageLab work concerns computer vision, pattern recognition and machine learning, including human-centered and multisensory applications.

Research starting points:
- [UNIMORE profile](https://unimore.unifind.cineca.it/resource/person/65388?language=en_US)
- [AImageLab faculty and research](https://aimagelab.unimore.it/people/)

### Possible scientific bridge

Computer vision and multimodal inference could provide **additional observed variables** in a controlled sensory-stimulation experiment:
- Measure task-relevant behavior or movement noninvasively using validated video-analysis methods.
- Evaluate multimodal synchrony and discrepancy in an explicitly specified audio-visual protocol.
- Use ML to compare candidate participant-state estimators to simple baselines, with participant-level splits and out-of-distribution tests.
- Map model inputs, device/camera geometry, latency, privacy boundaries and uncertainty to SSTIM or adjacent observation provenance.

Video-based estimates are not direct measures of subjective attention, emotional state or neural entrainment. Any such inference requires independent construct validation, ethics and evidence.

**[WRITE: a measurable audiovisual HCI/AI use case, protocol-to-event mapping, metrics and ablation for Section 4.]**  
**[ASK/VERIFY LATER: a concrete vision/behavior dataset or validated measurement procedure suitable for external reproduction.]**

## 4. Cristina Iani: perception, attention, action and joint experience

### Verified intellectual intersection

Cristina Iani's academic research covers attention, perception, action and the social context of cognitive functioning, including joint action.

Research starting points:
- [UNIMORE profile](https://unimore.unifind.cineca.it/resource/person/67897?language=en-US)
- [UNIRSM academic profile](https://www.unirsm.sm/persona/cristina-iani/)

### Possible scientific bridge

Move beyond “a sensory session was synchronized” to ask **what participation and co-presence change cognitively and socially**.

Candidate factorial study (illustrative):
- Factor A: individual versus socially co-present/shared condition.
- Factor B: synchronous versus temporally independent stimulation.
- Optional separate manipulation: post-session conversation/report exchange versus no discussion.

Define co-presence operationally (same room, remote awareness, interactive exchange). Record attention-task interference, response timing, joint action outcomes, reported social connection and pleasantness. Avoid using mutual reports as automatic evidence of brain-to-brain synchrony; EEG hyperscanning, if proposed, adds its own signal-processing and confound requirements.

**[WRITE: pre-registered hypotheses, task details, outcome measures, sample-size rationale and counterbalancing for Section 5.]**  
**[ASK/VERIFY LATER: which theories of joint action, attention/action coupling and social cognition best constrain the design, supported by Iani's publications.]**

## 5. Alberto Levi: labor law, AI deployment and ethical governance in workplaces

### Verified intellectual intersection

Alberto Levi's research and academic role concern labor law and the legal treatment of employment and emerging technologies. A normative and institutional perspective is pertinent when sensory interventions are introduced during work, study or institutional activities.

Research starting points:
- [UNIMORE profile](https://unimore.unifind.cineca.it/resource/person/62645?language=en-US)
- [Privacy, AI and New Technologies research context](https://fmb.unimore.it/en/observatories/privacy-ai-new-technologies/)

### Possible scientific bridge

A controlled intervention that is voluntary in a laboratory may acquire a different meaning when presented through an employer. Research questions include:
- Can workplace participation be genuinely voluntary when participants perceive employer expectations?
- How should a research protocol distinguish individual well-being from organizational monitoring and performance measurement?
- Which records must be private, aggregated, consent-governed or purpose-limited?
- How should an AI-supported recommendation system explain its inference and allow refusal, accessibility alternatives and reversibility?
- Which boundaries are research ethics, privacy engineering, employment law, platform governance or public claims?

These are **questions** for qualified legal research, not assertions about current compliance or jurisdiction-specific legal conclusions. Obtain source-verified current legal analysis before writing normative claims.

**[WRITE: a tightly scoped socio-technical subsection in Section 6, with legal research question, data-flow example and verified legal sources.]**  
**[ASK/VERIFY LATER: specific scholarship from Levi that applies and whether a comparative Italy/EU workplace design is appropriate.]**

## How the connections fit into a single contribution

The integrated example should be **one testable use case**, not five appended biographies.

**Proposed exemplar:** a short, opt-in audiovisual attention/rest experiment with exact stimulus specifications, a verified delivery record, optional behavioral/video and physiological measures, a blinded AI-assisted annotation benchmark, and an individualized or shared-session arm, under a documented consent and privacy regime.

- *Physics and sensing:* actual stimulus parameters and measurement uncertainties.
- *Computer vision and AI:* validated behavioral observables and multimodal data interpretation.
- *Psychology and cognition:* perception, action, attention and social context with proper experimental controls.
- *Law and governance:* valid participation, privacy and deployment boundaries.
- *SSTIM:* machine-readable protocol, control conditions, executions, event chronology, evidence and provenance.

The same data should allow multiple questions **without treating them as the same question**: perceptual detection, behavioral change, mechanistic neural response, user experience and organizational suitability.

### Proposed claim to test

SSTIM improves **cross-disciplinary communication and reproducibility of the experiment's representation** relative to generic study descriptions. Whether the sensory intervention improves attention, comfort, performance or interpersonal outcomes is a separate empirical question.

## Before any person is named in the actual manuscript

- [ ] Verify their name, current affiliation, relevant peer-reviewed papers and direct contribution.
- [ ] Determine whether they are consulted, thanked, cited, or invited to coauthor; these are distinct.
- [ ] Seek explicit consent for acknowledgments and author agreement for coauthorship.
- [ ] Avoid identifying real people in SSTIM's public RDF ecosystem records without the separate applicable publication/consent process.
- [ ] Update the manuscript only after substantive integration supported by papers, data or a methodological contribution.

**Prioritization:** the AI interoperability benchmark plus one independent protocol encoding is central to the first article; sensing, multimodal cognition and workplace governance enrich it where they yield falsifiable, non-peripheral contributions. A detailed human experiment can form a follow-up article.
