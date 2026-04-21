# W3C Sensory Stimulation Community Group — Draft Charter

> **Status:** Draft for review. Not yet submitted to W3C. Pending Renato
> Fabbri's decision on group name and initial participant recruitment.
> Last updated: April 2026.

---

## Name

W3C Sensory Stimulation Community Group

---

## Mission

The W3C Sensory Stimulation Community Group develops open, interoperable
specifications and vocabularies for the description, delivery, and evidence
annotation of designed sensory stimulation interventions — the parameter-specified
delivery of structured sensory input toward defined physiological, psychological,
or cognitive outcomes.

The group's primary deliverables are:

1. **The SSTIM Vocabulary** — a SKOS/OWL vocabulary for sensory stimulation
   techniques, mechanisms, evidence tiers, frequency bands, modalities, and
   protocol components, published at `https://w3id.org/sstim`.

2. **The SSTIM Ontology** — an OWL 2 DL formal ontology aligning the vocabulary
   to BFO 2020, OBI, IAO, and PROV-O, enabling interoperability with the OBO
   Foundry biomedical ontology ecosystem.

3. **Preset Protocol Format Specification** — a community standard for the
   exchange and publication of sensory stimulation protocol specifications,
   building on the BSC preset JSON format.

4. **Evidence Framework Guidelines** — a community standard for grading and
   communicating evidence quality for sensory stimulation claims, including
   modality-matching principles and tier assignment criteria.

---

## Scope

The group's work is within scope when it concerns:

- Formal vocabularies and ontologies for describing sensory stimulation techniques
  and protocols
- Interoperability formats for sensory stimulation protocol exchange between
  research groups, clinical partners, and software implementations
- Evidence annotation standards for linking protocol descriptions to scientific
  literature
- Session data models enabling reproducibility and meta-analysis across
  sensory stimulation research

The group's work is out of scope when it concerns:

- Clinical diagnosis, treatment recommendations, or medical device specifications
- Neurofeedback closed-loop systems (a related but distinct domain)
- Consumer product marketing or commercial endorsement

---

## Deliverables

### Phase 1 (first 12 months)

- SSTIM Vocabulary v1.0 (stabilizing the vocabulary seeded by BSC Lab)
- SSTIM Ontology v1.0 (OWL 2 DL, validated against OBO Foundry alignment)
- Preset Protocol Format Specification v1.0 (JSON Schema + SHACL)
- Evidence Framework Guidelines v1.0

### Phase 2 (months 13–24)

- Alignment to WHO ICD and SNOMED CT for clinical context descriptions
- Reference implementation guidance for session data recording and export
- Interoperability report covering adjacent standards (OBI protocols, HL7 FHIR
  questionnaire for self-report, PROV-O for provenance)

---

## Chair

Renato Fabbri (BSC Lab / BioSynCare, Modena, Italy)
Email: renato@biosyncare.com
ORCID: 0000-0001-8602-7064

---

## Communication

- Mailing list: sensory-stimulation@w3.org (to be requested from W3C)
- GitHub repository: https://github.com/w3c/sensory-stimulation (to be created)
- Meeting cadence: monthly video call; async discussion via GitHub Issues
- Working language: English (presentations in English; discussion in any language)

---

## Decision process

Decisions are reached by consensus. In the absence of consensus, the Chair
may call a vote; a simple majority of active participants (those who have
participated in at least one meeting or comment in the last 60 days) prevails.

Vocabulary term additions and removals require a two-week comment period and
consensus. No term IRI is ever deleted after publication; deprecated terms
receive `owl:deprecated true` and a `skos:historyNote` explaining the deprecation.

---

## Participation

Participation is open to W3C Members and non-Members. Non-Members must sign
the W3C Community Contributor License Agreement (CLA) before contributing.
The CLA grants the community a royalty-free license to any essential patent
claims covering the group's normative specifications.

Organization affiliation is not required. Individual researchers, clinical
practitioners, and software developers are welcome.

---

## Relationship to adjacent groups

**W3C Accessibility Guidelines Working Group:** BSC Lab's visual safety
constraints (no high-contrast flash above 3 Hz, WCAG 2.3.1 compliance) align
with WCAG. The CG will maintain awareness of WCAG developments relevant to
sensory stimulation software.

**OBO Foundry:** The SSTIM ontology aligns to BFO 2020, OBI, IAO, and ECO.
The CG will coordinate vocabulary additions with the relevant OBO Foundry
editorial boards.

**HL7 FHIR:** Self-report data from sensory stimulation sessions could be
represented as FHIR Questionnaire resources. The CG will assess alignment
in Phase 2.

**Music Therapy research communities:** Rhythmic Auditory Stimulation (RAS)
and Neurologic Music Therapy (NMT) overlap with the sensory stimulation domain
at the motor entrainment end. The CG will maintain liaison with the World
Federation of Music Therapy.

---

## Initial participants (to be confirmed)

- Renato Fabbri (BSC Lab / BioSynCare) — chair, SSTIM ontology founding editor
- Juliana Braga de Salles Andrade (UERJ, PhD neuroscience) — scientific advisor,
  evidence framework co-author [*pending confirmation of public role*]

*Additional participants to be recruited before charter submission. Target:
3–5 founding participants from distinct institutions across neuroscience,
rehabilitation, and software development.*

---

## Next steps before W3C submission

- [ ] Confirm group name with Renato Fabbri
- [ ] Identify 2–3 additional founding participants willing to be named
- [ ] Confirm Juliana Braga de Salles Andrade's public participation
- [ ] Register `https://w3id.org/sstim` at w3id.org
- [ ] Submit charter at https://www.w3.org/community/groups/proposed/
