# Sensory Stimulation Vocabulary Community Group — Draft Charter

Status: Draft charter — Community Group launched; charter not yet ratified
Short name preference: `sstim`
Initial namespace: `https://w3id.org/sstim/`

## Mission

The mission of the Sensory Stimulation Vocabulary Community Group is to develop shared terminology, open vocabularies, ontology modules, semantic models, JSON-LD contexts, SHACL validation profiles, and implementation guidance for describing sensory stimulation sessions, stimuli, modalities, parameters, devices, safety metadata, evidence annotations, and related datasets on the Web.

The core intent is to make sensory stimulation easier to describe, compare, validate, communicate, and implement across research, software, hardware, public-interest, and institutional contexts.

The group is intended as an open, vendor-neutral forum for researchers, developers, semantic-web practitioners, device and application makers, accessibility specialists, open-science communities, public-interest organizations, and institutions interested in sensory stimulation terminology and interoperability.

## Background

Sensory stimulation technologies are increasingly used across software, audio, visual media, haptics, breathing guidance, research systems, wellness applications, assistive technologies, public-health-adjacent initiatives, and multimodal devices.

However, terminology remains fragmented. Similar techniques may be described with incompatible names, private schemas, informal claims, or inconsistent parameter metadata. This limits scientific comparison, reproducibility, device interoperability, institutional communication, and responsible public presentation.

A shared vocabulary can help:

- scientific research be better shared, compared, annotated, and made representative across studies;
- software and hardware systems communicate with each other and with external protocols;
- sensory stimulation techniques be described more clearly to authorities, institutions, researchers, developers, and the public;
- safety, evidence, claim strength, and intended-use metadata be represented explicitly;
- open implementations and datasets become easier to validate and reuse.

BSC Lab may contribute as an early implementation environment for `sstim`, providing both a navigation and annotation interface for the vocabulary and ontology, and a reference implementation of sensory stimulation techniques and protocols described through the vocabulary.

## Scope

The group may work on:

- standard terminology for sensory stimulation concepts;
- sensory stimulation session metadata;
- auditory, visual, haptic, respiratory, and multimodal stimulation descriptors;
- stimulus parameters and modality descriptors;
- evidence annotation metadata;
- safety and caution metadata;
- device and delivery-context metadata;
- vocabulary and ontology navigation workflows;
- annotation workflows for terms, use cases, evidence, datasets, and protocol descriptions;
- reference implementations that demonstrate how vocabulary terms map to real sensory stimulation sessions, software, hardware, and protocols;
- interoperability descriptions for software and hardware devices;
- terminology useful for communicating sensory stimulation concepts to authorities, institutions, public-interest organizations, and research communities;
- RDF, OWL, SKOS, SHACL, and JSON-LD artifacts;
- mappings to existing vocabularies where appropriate;
- use cases and requirements;
- implementation examples;
- validation profiles;
- guidance for persistent identifiers and linked data publication.

## Non-Scope

The group does not:

- define clinical practice guidelines;
- certify therapeutic efficacy;
- prescribe medical protocols;
- evaluate regulated-device claims;
- define disease treatment protocols;
- claim that any stimulation protocol treats, cures, prevents, or diagnoses medical conditions;
- act as a regulatory, clinical, public-health, or medical-device certification body.

The group may help describe public-health-relevant sensory stimulation concepts, evidence, safety metadata, and implementation patterns. However, it does not itself issue public-health recommendations, prescribe individual health habits, define clinical protocols, or certify interventions as effective.

## Initial Deliverables

The group may produce:

1. Use Cases and Requirements for Sensory Stimulation Metadata
2. Core Sensory Stimulation Vocabulary
3. SKOS Concept Scheme for Sensory Stimulation Terms
4. OWL Ontology Modules
5. SHACL Validation Profiles
6. JSON-LD Context
7. Implementation Examples
8. Mapping Notes to Existing Web and Semantic-Web Vocabularies

### Indicative Phase 1 (first 12 months)

- Core Sensory Stimulation Vocabulary draft (SKOS + OWL).
- Initial OWL ontology modules covering sessions, stimuli, modalities, parameters.
- SHACL validation profiles for session and parameter descriptors.
- JSON-LD context draft.
- Use cases and requirements document.

### Indicative Phase 2 (months 13–24)

- Mapping notes to WHO ICD and SNOMED CT terminology where relevant for institutional and research communication. These mappings are descriptive only and do not imply clinical endorsement of any protocol.
- Implementation guidance for session data recording and export.
- Interoperability report covering adjacent vocabularies and standards (for example, OBO Foundry ontologies, PROV-O for provenance, and self-report questionnaire structures where useful).

Timelines are indicative and may be adjusted by group consensus.

## Technologies

Relevant technologies may include:

- RDF
- OWL
- SKOS
- SHACL
- JSON-LD
- persistent identifiers
- linked data publication practices
- Web of Things metadata patterns where relevant
- provenance and citation vocabularies where relevant

## Participation

The group welcomes participation from:

- sensory stimulation researchers;
- auditory, visual, haptic, and multimodal stimulation developers;
- semantic-web and ontology engineers;
- open-science and linked-data practitioners;
- accessibility specialists;
- app and device developers;
- public-interest organizations;
- institutions interested in sensory stimulation terminology and interoperability;
- standards practitioners;
- researchers working on evidence, safety, reproducibility, and metadata.

Participation is open to W3C Members and non-Members. Non-Members must sign the W3C Community Contributor License Agreement (CLA) before contributing. The CLA grants the community a royalty-free license to any essential patent claims covering the group's deliverables.

Organization affiliation is not required. Individual researchers, developers, and practitioners are welcome.

## Communication

- Mailing list: to be requested from W3C once the group is approved.
- Public repository: to be created in a community-neutral GitHub organization once the group is approved; this BSC Lab repository serves as the pre-submission anchor.
- Meeting cadence: indicative monthly video call, with asynchronous discussion via GitHub issues and the mailing list.
- Working language: English for written deliverables and meeting minutes; spoken discussion may take place in any language participants share.

## Decision Process

Decisions are reached by consensus. In the absence of consensus, the Chair (or rotating facilitator) may call a vote; a simple majority of active participants — those who have participated in at least one meeting or comment in the previous 60 days — prevails.

Vocabulary term additions and removals require a two-week public comment period and consensus.

Term IRIs are never deleted after publication. Deprecated terms receive `owl:deprecated true` and a `skos:historyNote` explaining the deprecation, so existing data and citations remain dereferenceable.

## Governance Principle

The vocabulary work should remain vendor-neutral. BioSynCare/BSC Lab may provide early examples and implementation feedback, but the group should not be governed as a BioSynCare product effort.

BSC Lab may serve as a reference implementation environment and as a vocabulary navigation and annotation interface, but the vocabulary itself should be developed for the broader sensory stimulation ecosystem.

## Status Discipline

Community Group work must not be represented as a W3C Standard unless and until it separately enters and completes an appropriate W3C standards-track process.

Preferred wording:

- "W3C Community Group proposal"
- "Community Group report"
- "community-led vocabulary"
- "open interoperability work"
- "shared terminology"

Avoided wording:

- "W3C standard"
- "official W3C standard"
- "certified by W3C"
- "therapeutic standard"
- "medical standard"

## Relationship to Adjacent Groups

The group intends to maintain awareness of, and where useful coordinate with, adjacent communities and standards efforts:

- **W3C Accessibility Guidelines Working Group (AG WG).** Visual safety constraints for sensory stimulation (for example, avoiding high-contrast flicker that can trigger photosensitive seizures, and WCAG 2.3.1 alignment) intersect with WCAG. The group will track WCAG developments relevant to sensory stimulation software.
- **OBO Foundry.** The vocabulary may align with BFO, OBI, IAO, and ECO where appropriate. The group will coordinate vocabulary additions with the relevant OBO Foundry editorial boards when alignments are proposed.
- **HL7 FHIR.** Self-report data from sensory stimulation sessions may be representable as FHIR Questionnaire resources. The group may assess alignment as a Phase 2 task.
- **Music therapy and rhythmic-stimulation research communities.** Rhythmic Auditory Stimulation (RAS) and Neurologic Music Therapy (NMT) overlap with sensory stimulation at the motor-entrainment end. The group may maintain liaison with bodies such as the World Federation of Music Therapy.
- **Research and implementation partners.** The group welcomes liaison with research labs, open-science communities, accessibility organizations, and software/hardware implementation partners interested in shared sensory stimulation terminology.

## Chairs and Participants

The Community Group is **launched**; its charter is not yet ratified. Chairs,
participants, and the current roster are listed on the group's W3C page, which is
the authoritative record. Until the charter is ratified, Renato Fabbri retains
editorial control of the SSTIM namespace (ORCID: 0000-0002-9699-629X, contact:
renato.fabbri@gmail.com); on ratification, editorial control transfers to the CG.

The group continues to welcome participants from distinct institutions across
sensory stimulation research, semantic-web engineering, accessibility, and
software/hardware implementation. Named participants are added only after explicit
consent.

## Next Steps (post-launch)

The Community Group is launched; the charter is not yet ratified. Remaining steps:

- [x] Submit the group to W3C — **done; the group is launched.**
- [ ] Ratify this charter with the participants.
- [ ] Grow participation across distinct institutions (W3C-growth KPI 4 → ≥12; see
      [`docs/ecosystem/ECOSYSTEM_INTEGRATION.md`](docs/ecosystem/ECOSYSTEM_INTEGRATION.md)).
- [ ] Confirm `https://w3id.org/sstim` redirects are registered and resolving.
- [ ] Hold the first working session (encode one real study — Workstream 2).
