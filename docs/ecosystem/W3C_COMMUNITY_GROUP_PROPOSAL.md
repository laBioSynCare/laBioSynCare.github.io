# W3C Community Group Proposal

> **Historical record: this is the submission, and the group was accepted.** The
> Sensory Stimulation Vocabulary Community Group is **launched**; its charter is
> not yet ratified. [`../../CHARTER.md`](../../CHARTER.md) is the live instrument
> and the W3C group page is the authoritative roster. Keep this file as the text
> that was submitted — do not update it to describe the group as it is now.

Proposed group name:

```text
Sensory Stimulation Vocabulary Community Group
```

Preferred short name:

```text
sstim
```

Fallback short names:

```text
sensory-stimulation-vocab
sensory-stimulation
```

Initial namespace:

```text
https://w3id.org/sstim/
```

## Short Description

The Sensory Stimulation Vocabulary Community Group develops shared terminology, open vocabularies, ontology modules, semantic models, JSON-LD contexts, SHACL validation profiles, and implementation guidance for describing sensory stimulation sessions, stimuli, modalities, parameters, devices, safety metadata, evidence annotations, and related datasets on the Web.

The group's core intent is to make sensory stimulation more coherent and interoperable across scientific research, software systems, hardware devices, public-interest projects, and institutional communication.

The group welcomes researchers, sensory stimulation developers, audio/visual/haptic technology experts, semantic-web practitioners, accessibility specialists, device and application developers, open-science communities, public-interest organizations, and institutions interested in responsible sensory stimulation terminology.

The group may publish Specifications, reports, use cases, examples, validation profiles, and implementation guidance. Relevant technologies may include RDF, OWL, SKOS, SHACL, JSON-LD, persistent identifiers, and mappings to existing Web vocabularies.

The group does not define clinical practice guidelines, certify therapeutic efficacy, prescribe medical protocols, issue public-health recommendations, or evaluate regulated-device claims.

## Problem Statement

Sensory stimulation systems often describe their sessions, stimuli, protocols, modalities, evidence, risks, devices, and parameters using private, incompatible, ambiguous, or informal schemas.

This makes it difficult to:

- compare stimulation sessions across systems;
- document stimulus parameters clearly;
- publish research datasets with machine-readable metadata;
- make scientific research more shareable and representative;
- validate session descriptors;
- distinguish wellness claims, research hypotheses, and clinical claims;
- disclose safety and caution metadata consistently;
- support interoperability between software systems, hardware devices, and external protocols;
- communicate sensory stimulation concepts clearly to authorities, institutions, researchers, developers, and the public;
- map application-level data to linked-data and semantic-web infrastructure;
- build interoperable tools across apps, devices, laboratories, and public-interest projects.

## Proposed Work

The group should develop an open semantic vocabulary and related implementation artifacts for sensory stimulation interoperability.

Potential artifacts include:

- RDF/OWL ontology modules;
- SKOS concept schemes;
- SHACL shapes;
- JSON-LD contexts;
- use cases and requirements;
- implementation examples;
- mapping notes;
- namespace and term governance guidance.

## Initial Deliverables

1. Use Cases and Requirements for Sensory Stimulation Metadata
2. Core Sensory Stimulation Vocabulary
3. SKOS Concept Scheme for Sensory Stimulation Terms
4. OWL Ontology Modules
5. SHACL Validation Profiles
6. JSON-LD Context
7. Implementation Examples
8. Mapping Notes to Existing Vocabularies

## Candidate Vocabulary Areas

- Session
- Stimulus
- Modality
- Auditory stimulation
- Visual stimulation
- Haptic stimulation
- Respiratory guidance
- Multimodal stimulation
- Entrainment target
- Frequency band
- Temporal pattern
- Carrier signal
- Beat structure
- Pulse structure
- Parameter set
- Protocol
- Device context
- Device capability
- External protocol
- Safety caution
- Evidence annotation
- Evidence strength
- Intended use statement
- Claim strength
- Study metadata
- Research population
- Dataset
- Provenance
- Institutional communication context

## Strategic Intent

The proposed vocabulary work should support three strategic needs:

### 1. Scientific sharing and representativeness

Sensory stimulation research needs clearer terminology, parameter metadata, evidence annotations, and dataset descriptions so that findings can be compared, aggregated, reproduced, and represented across different techniques, devices, populations, and study designs.

### 2. Software and hardware interoperability

Apps, devices, protocols, datasets, and external systems need shared terminology and machine-readable structures so they can communicate stimulation parameters, modalities, session designs, safety metadata, and implementation constraints.

### 3. Institutional and public-interest communication

Authorities, institutions, public-interest organizations, researchers, and the public need clearer, more disciplined terminology for understanding sensory stimulation technologies, their intended uses, their evidence status, their safety constraints, and their possible role in individual and public health practices.

This strategic intent does not make the group a clinical, regulatory, public-health, or therapeutic-certification body.

## Scope Boundary

The group is about semantic description, shared terminology, interoperability, metadata, validation, and implementation guidance.

The group is not a clinical, regulatory, public-health, or therapeutic-certification body.

## Relationship to BioSynCare / BSC Lab

BioSynCare/BSC Lab may provide early implementation examples, terminology pressure tests, and linked-data artifacts.

BSC Lab has two intended roles in relation to `sstim`:

1. **Vocabulary navigation and annotation interface**
   BSC Lab should make the `sstim` vocabulary and ontology easier to browse, annotate, review, discuss, and evolve.

2. **Reference implementation**
   BSC Lab should provide an open implementation environment for sensory stimulation techniques and protocols described with `sstim`, including concrete mappings from vocabulary terms to session structures, stimulus parameters, protocol metadata, device contexts, safety metadata, evidence annotations, and user-facing workflows.

The Community Group proposal is not a BioSynCare product specification. The vocabulary should be developed in a vendor-neutral way and should remain useful to researchers, developers, hardware/device makers, public-interest organizations, institutions, and other sensory stimulation systems.

## Candidate Initial Supporters

Add names only after explicit consent.

Template:

```text
- Name — affiliation — relevant expertise — consent confirmed: yes/no
```

## Proposal Submission Checklist

- [ ] W3C account created by proposer
- [ ] Proposed group name finalized
- [ ] Short name preference finalized
- [ ] Description reviewed for status discipline
- [ ] Five initial supporters identified
- [ ] Supporters have or request W3C accounts
- [ ] Public repo link ready
- [ ] Charter draft ready
- [ ] Non-scope explicit
- [ ] No medical/therapeutic overclaiming
