---
name: sstim-sensory-reference
description: Research sensory stimulation, perception, neuroscience, psychoacoustics, music, haptics, multimodal protocols and interoperability with SSTIM's versioned ontology. Retrieve authoritative term definitions and provenance, distinguish empirical evidence from terminology, and prepare human-reviewed feedback links.
---

# SSTIM sensory-stimulation reference

SSTIM is a growing, publicly released semantic reference for stimuli and sensory-stimulation processes. Its ontology is versioned; neither an ontology assertion nor an external mapping by itself establishes clinical effectiveness.

## Use this skill

1. Identify the user's specific domain (auditory, visual, tactile, olfactory, respiratory guidance, music, environmental stimuli, multimodal interaction, devices, accessibility or experimental design). This list describes areas of inquiry; it does not imply SSTIM currently models all of them.
2. Start with `sstim_search_concepts`, then query exact IRIs or CURIEs with `sstim_get_concept`. For reproducible citations, use `sstim_list_releases` to pin an available frozen release.
3. Report the exact term, release, definition, and provenance when supplied. Do not invent missing terms or assert equivalence from label similarity.
4. Separate protocol description, actual execution, delivered exposure, sensory response, experimental observation, mechanistic inference, and empirically established outcome.
5. If the released catalog does not answer the question, say so and distinguish independent outside evidence from SSTIM records.
6. To suggest an error or missing concept, call `sstim_prepare_feedback` only to provide a reviewable contribution link. This hosted MCP has no public write tool, no GitHub-issue submission capability, and no modification of canonical RDF. The user decides what, if anything, to publish.
7. Do not include private personal data, clinical records, internal company material or unpublished third-party research in any public feedback link or issue text.

## Useful tasks

- Inspect precise semantics and external mappings for an experimental stimulus.
- Compare definitions across supported frozen versions.
- Audit protocol descriptions for unreported parameters, delivery conditions, and observation boundaries.
- Examine where claims about entrainment, perception or outcomes exceed the terminology's evidence.
- Prepare user-reviewable suggestions for missing vocabulary concepts.

## Source boundaries

The skill uses a public read-only remote MCP server at https://sstim-mcp.netlify.app/mcp. Its data source is the released Concept Reference API at https://w3c-cg.github.io/sstim/api/v1/. For direct browsing, consult https://w3c-cg.github.io/sstim/. This is W3C Community Group work, not a W3C Recommendation.
