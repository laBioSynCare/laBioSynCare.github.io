# SSTIM: a living reference for sensory stimulation

**Status:** project-level vision adopted by the SSTIM maintainer, 2026-10-10. This is public strategic direction, **not** a ratified W3C Community Group charter, a W3C Recommendation, a new ontology release, or a change to the published semantic contracts. The Community Group's draft charter, contribution procedures, existing scope decisions and released artifacts retain their respective authority.

## Our purpose

**SSTIM aims to be an open, continuously improving reference for stimuli and sensory stimulation, useful to humans, AI systems, scientific research and technology.**

The goal is not to maximize vocabulary size or require everyone to learn RDF. The goal is to make knowledge easier to understand, check, compare, question, reuse and improve, while keeping sources and past meanings interpretable.

SSTIM works toward a shared point of reference, not exclusive authority over science. Adoption and trust must be earned through correct, useful work and independent review.

## What this requires

1. **Truthfulness over coherence.** Separate a stimulus specification from actual delivery, perception, response, measurement, hypothesis and evidence. A valid description does not establish biological effects.
2. **Provenance over anonymous assertion.** Make sources, provenance, uncertainty, limitations and review status discoverable. Preserve legitimate disagreement and competing interpretations without silently merging them into a single canonical claim.
3. **Evolution with continuity.** Accept revisions, criticisms and candidate explanations while keeping published identifiers, prior meanings, deprecations and version-pinned releases intelligible. Do not silently change the meaning of an existing IRI.
4. **Human and AI participation.** Allow people and intelligent software to read and analyze published knowledge, propose improvements and trace their support. Neither AI generation nor a submitted proposal automatically changes the canonical reference. Changes follow review and publication governance.
5. **Useful interoperability.** Serve researchers, applications, devices, data systems and agents with reusable meanings and descriptions, not only with files conforming to a particular serialization.
6. **Federated expertise.** Reuse relevant, maintained external scientific and technical vocabularies. A shared reference must connect expert domains, not recreate all their knowledge or treat every physical interaction as a sense.
7. **Technology independence in the long term.** RDF, OWL, SKOS, SHACL, JSON-LD and current interfaces are the implemented foundation, not an eternal commitment. Any change in representation would require demonstrated benefits and preservation of referential meaning.

## What is available today

- A published, modular OWL/SKOS reference with stable identifiers, immutable citable releases, conservative external mappings, provenance-aware descriptions and SHACL/profile checks.
- SSTIM Workbench for concept navigation, SPARQL queries, audiovisual reference patches and documented examples.
- Published Python and JavaScript clients for version-qualified reference access, session building and validation; the JavaScript client's Full-profile SHACL-SPARQL limitation remains explicitly reported.
- A published read-only MCP server for AI assistants, using released concept references and providing a user-controlled feedback link rather than autonomous submissions.
- Open proposals and contribution channels under the W3C Sensory Stimulation Vocabulary Community Group.

These are real capabilities, but they do **not** constitute universal coverage, independent scientific validation of all claims, demonstrated cross-device reproduction, or widespread external adoption.

## What remains a direction, not an implemented capability

Potential next capabilities include accessible comparisons of published experimental protocols, source-linked knowledge navigation for humans and AI, independently validated protocol descriptions, richer review of competing claims, and more interoperable research and device integrations.

Their value must be demonstrated against available alternatives. Do not claim that a future feature already exists, or that standardized descriptions prove efficacy, safety or experimental fidelity.

The most important external milestone is not another registry entry: it is an independently useful workflow or independently owned, published, valid SSTIM artifact maintained outside the original project.

## Open invitation to challenge and improve

The [AI and human contribution guide](https://w3c-cg.github.io/sstim/agents/)
invites agents and researchers to report precise, reproducible shortcomings,
conflicting evidence, missing concepts, failed mappings and technical needs.
Published SSTIM references are not self-updating: submissions require
appropriate review and never automatically become canonical.

An explicit future proposal to embed this invitation in ontology RDF and
annotation metadata is [tracked separately](../technical/AI_CONTRIBUTION_IN_RDF_PLAN.md).
That deferred work must not alter immutable releases, impersonate contributors,
or create a misleading assertion of autonomous write authority.

## Governance, scope and reference documents

The reference describes sensory stimulation and appropriate links to sensing, perception and response. It is not an ontology of all physical interactions, an engine of stimulation execution, or a clinical certification authority. A physical target need not perceive or benefit from stimulation.

SSTIM is developed through an independent W3C Community Group. Its work is not a W3C Recommendation or formally endorsed W3C standard. SSTIM Workbench is non-normative reference software. BioSynCare is a separate commercial application and supporter, not the authority behind the SSTIM standard.

The [evolving-reference proposal](EVOLVING_REFERENCE_DIRECTION_PROPOSAL.md) and [AI interoperability and evaluation proposal](../ecosystem/AI_INTEROPERABILITY_AND_EVALUATION_PROPOSAL.md) are the source of this vision. Their *architectural proposals and research plans* remain candidates requiring normal review; adopting this public vision does not automatically approve their proposed changes.

For operative contracts consult [Scope](SCOPE.md), [Non-Scope](NON_SCOPE.md), [current state](../ontology/CURRENT_STATE.md), [adoption](../ecosystem/ADOPTION.md), [contributions](../../CONTRIBUTING.md), [Community Group charter](../../CHARTER.md) and the [decision index](../decisions/README.md).
