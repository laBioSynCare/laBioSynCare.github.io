---
name: sstim-sensory-reference
description: Use the public SSTIM reference to investigate senses, stimuli, perception and experimental protocols. Retrieve release-qualified definitions, mappings and provenance, distinguishing research claims from ontology terminology.
---

# SSTIM sensory science reference

SSTIM provides versioned terminology and public semantic records for sensory-stimulation research and technology. The reference is not a complete encyclopedia of perception and is not evidence of clinical effectiveness.

## Workflow

1. Use `sstim_search_concepts` to identify precise terms, then `sstim_get_concept` to retrieve their exact IRI/CURIE and provenance. Use `sstim_list_releases` to pin a frozen reference version for comparisons.
2. Distinguish a stimulation protocol, its execution, a recorded exposure, sensory response, observation, and claim about outcome.
3. When source coverage is limited, explicitly separate the returned SSTIM assertions from your own inference and, when needed, other cited evidence.
4. When the user wants to suggest a correction or missing concept, use `sstim_prepare_feedback` to generate a link. The user decides what to publish. This public plugin cannot submit GitHub issues or change RDF.
5. Never insert private user messages, medical records or unpublished third-party data into a proposed public issue. Do not represent a GitHub proposal as accepted scientific knowledge.

## Typical tasks

- Explain sensory stimulus modalities, parameters and techniques with provenance.
- Compare versioned ontology terms and exact external mappings without confusing equivalence with relatedness.
- Examine experimental descriptions for missing stimulus, channel, delivery and observation parameters.
- Prepare a user-reviewable feedback link for a gap in a published reference.
