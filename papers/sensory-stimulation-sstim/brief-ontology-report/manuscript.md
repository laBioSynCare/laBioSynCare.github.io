# SSTIM: An Open Ontology for Sensory-Stimulation Protocols, Exposures, and Evidence

**Article type:** Brief Ontology Report  
**Target journal:** *Applied Ontology*  
**Author:** Renato Fabbri  
**Affiliation:** Independent researcher, Modena, Italy  
**ORCID:** https://orcid.org/0000-0002-9699-629X  
**Correspondence:** Renato Fabbri (contact details to be supplied in the submission system)

## Abstract

**Background:** Sensory-stimulation research spans psychophysics, neuroscience, engineering, human-computer interaction, and applied interventions. Study descriptions can obscure distinctions among intended stimuli, delivered exposures, perceptual responses, physiological measurements, and evidence for outcomes.

**Objective:** We describe SSTIM, an open ontology intended to make these distinctions explicit and support interoperable representation of sensory-stimulation research.

**Methods:** SSTIM defines sensory stimulation as a specified process of delivering structured sensory input for a declared purpose. Its modular OWL and SKOS model represents stimulus specifications, techniques, protocols, implementations, exposure conditions, session plans and executions, hypotheses, observations, and qualified evidence assessments. SHACL constraints, competency questions, provenance, and versioned releases support inspection and validation.

**Results:** The public reference collection includes literature-derived protocols, exploratory exposure examples, and explicitly synthetic execution records. Worked examples demonstrate separations between delivery and perception, control conditions and active stimuli, and hypotheses and observations. These demonstrations concern representational capabilities, not intervention efficacy.

**Conclusion:** SSTIM provides a domain-specific semantic foundation for describing and scrutinizing sensory-stimulation research, while leaving physical calibration, causal inference, and experimental validation to appropriate methods.

**Keywords:** sensory stimulation; ontology; semantic interoperability; reproducibility; multimodal perception; scientific evidence.

## 1. Introduction

Sensory stimulation is studied through different disciplinary lenses. Physicists and engineers characterize signals and their delivery, psychophysicists examine relations between physical input and perception, neuroscientists measure responses in neural systems, and cognitive scientists investigate attention, action, and behavior. These levels are related but not interchangeable. An auditory stimulus containing a 10 Hz modulation is not itself evidence of an endogenous 10 Hz neural oscillation, and a neural response time-locked to stimulation is not necessarily a functional or therapeutic effect (Duecker et al., 2024).

A useful scientific description must therefore distinguish **what was designed**, **what was physically delivered**, **what was perceived or measured**, and **what can be concluded**. These distinctions become more consequential when research compares binaural and monaural beats, periodic visual stimulation, tactile vibration, paced-breathing cues, or combinations of sensory channels. A common technique label cannot replace the stimulus parameters, device characteristics, context, comparator, and outcome definition.

This report presents SSTIM, an open, machine-readable ontology and associated reference infrastructure for sensory stimulation (Fabbri, 2026). The contribution is not a universal account of sensory mechanisms or an efficacy claim. It is a formalized vocabulary for recording scientific and technical statements at the level supported by their evidence.

## 2. Definition and ontological commitments

SSTIM defines **sensory stimulation** as a process in which structured sensory input is delivered according to specified parameters for a declared purpose (SSTIM, 2026). This operational definition identifies an intervention process, not a stimulus file, a device, a conscious percept, or an assumed benefit. Structured input includes periodic, stochastic, and naturalistic signals. A nominally reproducible stimulus specification does not ensure that a given transducer or display delivers the intended exposure.

SSTIM distinguishes stimulation from neuromodulation by causal route and declared objective, rather than by treating electrical, acoustic, optical, or magnetic energy as mutually exclusive taxonomic classes. Sensory stimulation uses canonical sensory transduction and afferent processing; direct neural stimulation may instead target neural tissue through a different route. The concepts may overlap, but neither entails conscious perception, successful modulation, or benefit.

The model further distinguishes sensory, perceptual, and cognitive descriptions. A stimulus can be delivered without being consciously reported; a measured sensory response does not necessarily establish a cognitive effect. A cognitive task may incorporate sensory stimuli without being reducible to a stimulation technique. This separation is particularly important in research on entrainment, for which evoked or steady-state responses must not automatically be interpreted as synchronization of endogenous oscillators (Duecker et al., 2024).

## 3. Ontology architecture and implementation

SSTIM uses persistent Web identifiers and a modular RDF/OWL vocabulary, with controlled SKOS concepts, SHACL constraints, and SPARQL competency questions. It distinguishes a minimal process **Kernel**, a **Core** capable of describing engine-independent stimulus specifications, **Core Plus** descriptors and quantities, and a **Full** profile encompassing optional concerns including techniques, configurations, session records, exposure, neuromodulation, and evidence. The profiles and their dependencies are enumerated in a machine-readable release manifest.

Five complementary records are central:

1. **Stimulus and protocol specification:** intended channels, parameters, duration, timing, and control logic.
2. **Implementation and exposure description:** rendering system, delivery medium, device capabilities, body placement, and relevant calibration conditions.
3. **Session plan and execution:** what was intended and what actually occurred, on a stated clock.
4. **Observation:** measured or self-reported response, with method, time, and provenance.
5. **Evidence assessment:** a separately qualified proposition, with its sources, comparison conditions, scope, and review status.

These are linked but not logically collapsed into one another. A proposal about a perceptual outcome is not an observed effect; a session log is not an electrophysiological measurement; an ontology constraint is not a safety or efficacy certificate.

The citable baseline for this report is **SSTIM v0.21.0**, released on 1 November 2026 (https://doi.org/10.5281/zenodo.23868027). The repository includes source modules, ontology validation, documented tests and a non-normative open reference environment, SSTIM Workbench. The related commercial application BioSynCare is a separate implementation, not part of the SSTIM standard. The W3C Sensory Stimulation Vocabulary Community Group provides a forum for this vocabulary; its activity does not make SSTIM a W3C Recommendation.

## 4. Illustrative representation and descriptive evaluation

The release's public reference data contain published protocols re-expressed in SSTIM, exploratory exposure protocols, and one **synthetic** session with phased reports. These are representation artifacts, not a dataset demonstrating clinical or cognitive outcomes. Table 1 shows four concrete modeling questions represented by the published examples.

| Example in the reference collection | Distinction that the ontology must preserve |
| --- | --- |
| Colored auditory noise | A color label is insufficient without its spectral definition and a specified delivery context; reported pleasantness remains a hypothesis until observed. |
| Free-view stereoscopy with headphones | Acoustic and visual delivery media, perceptual modalities, immersion hypotheses, and potential losses of environmental awareness are distinct facets. |
| Silence and darkness baseline | Absence of an active stimulus can be recorded as an explicit comparison condition rather than treated as missing data. |
| Synthetic session with pre/post reports | An immutable session plan and a completed execution can be linked to phase-specific observations without inferring causation or efficacy. |

**Table 1.** Examples and their representation requirements. These are described in the publicly committed SSTIM reference data and are not new experimental results.

For instance, the exploratory *colored-audio-noise* example identifies an auditory channel and candidate spectral categories; it records an explicit hypothesis about pleasantness and a separate open research question about calm or stress. This avoids converting a designer's expectation into evidence. The *free-view-stereo-headphones* example models physical delivery, required hardware capabilities, intended perceptual effects and comfort boundaries on separate entities.

SSTIM's release pipeline includes parsing, ontology consistency checking, shape validation, competency queries and serialization checks. These establish properties of the formal representation and its published fixtures, not physical fidelity or biological effectiveness. The public code and frozen artifacts allow independent rerunning; the present descriptive evaluation does **not** report newly executed validation trials or an independent user study. Independent encoding and cross-system exchange remain necessary tests of practical advantage.

## 5. Relationship to existing standards

SSTIM does not replace general ontologies or research-data conventions. The **Ontology for Biomedical Investigations (OBI)** supports formal descriptions of investigation processes, roles, specimens, assays and data (Bandrowski et al., 2016). **BIDS** structures research datasets and metadata (Gorgolewski et al., 2016). **Hierarchical Event Descriptors (HED)** supports portable annotation of events, while **PROV-O** and the FAIR principles offer general provenance and data-reuse foundations (Moreau & Missier, 2013; Wilkinson et al., 2016).

SSTIM's intended complementarity is more specific: it supplies reusable, parameterized concepts for *sensory stimuli, sensory-access routes, perceptual conditions, planned versus actual exposures, and evidence-qualified sensory claims*. One can describe an experiment in OBI, distribute a behavioral dataset through BIDS and annotate its events in HED while using SSTIM for stimulus- and exposure-specific meaning. This is an architectural proposal for semantic integration, not a claim that complete mappings to every standard have already been implemented.

The domain-specific vocabulary is justified to the extent that it reduces ambiguities that would otherwise persist in generic metadata, and that independent consumers can preserve the specified meanings. A comparative representation study against OBI and generic metadata, including adverse and under-specified cases, remains an important evaluation.

## 6. Applications, limitations, and outlook

A reusable stimulation description can support study planning and comparison, software implementation, evidence audits, and AI-assisted access to scientific knowledge. For AI systems, SSTIM offers stable identifiers and deterministic validation against which generated candidate descriptions can be checked. It does not make an AI-generated hypothesis true or validate a machine-generated intervention as safe.

Further work should test whether independent researchers can use SSTIM to preserve more relevant information and produce fewer unsupported inferences than with simpler alternatives. Candidate experimental settings include carrier/modulation frequency studies, audio-visual-tactile integration, shared sensory experiences, and ergonomic use during work or rest. Such studies must separately define the delivered stimulus, behavioral or physiological endpoints, controls, and participant characteristics.

There are significant limits. Formal consistency cannot substitute for device calibration; an EEG peak cannot establish a beneficial mental state; and a reported experience cannot alone establish causal efficacy. The public reference artifacts are mostly literature-derived or synthetic and do not establish widespread independent adoption. The value of SSTIM should consequently be judged by further independent encodings, mappings and reproducible research uses, including reported failures.

## 7. Conclusion

SSTIM makes the distinction between sensory input, delivery conditions, perception, physiological response, and evidence explicit in a machine-readable ontology. Its current release supplies an inspectable implementation and a set of examples for scientific description. The next decisive evidence is not a claim about therapeutic outcomes, but independent demonstration that researchers and software systems can describe, compare, and reproduce sensory-stimulation protocols more reliably.

## Acknowledgments

None declared in this version. Any acknowledgment of an individual will be added only with their agreement.

## Author Contributions

Renato Fabbri: conceptualization, ontology architecture and development, methodology, manuscript preparation and review. Contributions to the underlying software project may also be documented in its public commit history.

## Statements and Declarations

**Ethical considerations:** Not applicable. This report presents an ontology, published protocol representations, and synthetic reference records; it does not report newly collected human-participant data.

**Consent for publication:** Not applicable; no individual participant material is included.

**Declaration of competing interests:** Renato Fabbri is the founder of BioSynCare, a related commercial sensory-stimulation application. The SSTIM ontology and SSTIM Workbench are independently published open resources.

**Funding:** No project-specific external funding is declared for this manuscript.

**Data and software availability:** The SSTIM source, documentation, formal validation materials and public examples are at https://github.com/w3c-cg/sstim. The frozen release described here is archived at https://doi.org/10.5281/zenodo.23868027.

**Use of generative AI:** OpenAI GPT-6 assisted in preparing the English manuscript draft and organizing publicly inspectable source material. Responsibility for source verification, scientific statements, revision and final submission remains with the human author.

## References

Bandrowski, A., et al. (2016). The Ontology for Biomedical Investigations. *PLOS ONE, 11*(4), e0154556. https://doi.org/10.1371/journal.pone.0154556

Duecker, K., et al. (2024). Challenges and approaches in the study of neural entrainment. *The Journal of Neuroscience, 44*(40). https://doi.org/10.1523/JNEUROSCI.1234-24.2024

Fabbri, R. (2026). *SSTIM Workbench: Open Sensory Stimulation Platform and SSTIM Ontology* (Version 0.21.0) [Software and ontology]. Zenodo. https://doi.org/10.5281/zenodo.23868027

Gorgolewski, K. J., et al. (2016). The brain imaging data structure, a format for organizing and describing outputs of neuroimaging experiments. *Scientific Data, 3*, 160044. https://doi.org/10.1038/sdata.2016.44

Moreau, L., & Missier, P. (Eds.). (2013). *PROV-DM: The PROV data model*. W3C Recommendation. https://www.w3.org/TR/prov-dm/

SSTIM. (2026). *Sensory stimulation: Conceptual foundation* [Project documentation]. https://github.com/w3c-cg/sstim/blob/main/docs/concept/SENSORY_STIMULATION.md

Wilkinson, M. D., et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data, 3*, 160018. https://doi.org/10.1038/sdata.2016.18
