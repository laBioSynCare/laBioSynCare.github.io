# SSTIM and LLM Complementarity

SSTIM is a semantic ontology and knowledge graph for sensory-stimulation data:
OWL classes, SKOS vocabulary, SHACL constraints, SPARQL-queryable relations,
evidence tiers, and provenance. It is **symbolic** infrastructure — expert
knowledge encoded so machines can inspect, query, and validate it. It is **not**
an LLM and not machine learning: it does not learn from examples, train weights,
or predict statistically.

This note explains how SSTIM and large language models (LLMs) complement each
other. The two play different roles: SSTIM supplies a precise, checkable domain
model; an LLM supplies a natural-language interface and flexible reasoning over
that model. Used together, the LLM proposes and explains while SSTIM and human
review decide what is correct and canonical.

> For guidance on how to *describe* this externally (recommended terms and
> wording), see [`ecosystem/SSTIM_LLM_MESSAGING.md`](../ecosystem/SSTIM_LLM_MESSAGING.md).

---

## How they complement each other

| Direction | What it adds |
|---|---|
| LLM → human using SSTIM | Natural-language access to a formal ontology: ask questions, get SPARQL drafts, explanations of terms/evidence tiers, and summaries of graph paths. |
| SSTIM → human using LLM | Grounded, reviewable use of generative AI: stable identifiers, a controlled vocabulary, explicit claim/evidence boundaries, and SHACL validation before anything is accepted. |
| LLM → AI system using SSTIM | Flexible interpretation: map informal intent to SSTIM terms, draft candidate RDF, plan multi-step retrieve→validate→summarize workflows. |
| SSTIM → AI system using LLM | Control and verification: ground answers in graph relations, check claims against the evidence/scope rules, validate generated RDF, and preserve provenance — reducing hallucination. |

In every direction the LLM is the language and orchestration layer; SSTIM is the
source of domain structure, constraints, and validation. The LLM may draft;
SSTIM and human review decide.

---

## Example workflow

A human asks:

> Which alpha-oriented BSC Lab presets have at least moderate evidence and no
> photosensitivity caution?

The LLM parses the question into a query plan. SSTIM supplies the exact terms for
alpha bands, presets, evidence tiers, and caution tags; a SPARQL query retrieves
the matching data; SHACL validates any generated metadata. The LLM then explains
the results in plain language while preserving the evidence and scope boundaries.
The LLM makes the workflow usable; SSTIM makes it precise.

---

## Boundary statement

SSTIM by itself is a semantic ontology, a knowledge graph, and a grounding and
validation layer — not an autonomous AI. When it is combined with an LLM,
retrieval, validation, and tool execution, the combined system can support
grounded "expert agent" workflows. The agentic behaviour belongs to that combined
system, never to the ontology file alone. Human review remains the authority for
scientific, regulatory, and governance decisions.
