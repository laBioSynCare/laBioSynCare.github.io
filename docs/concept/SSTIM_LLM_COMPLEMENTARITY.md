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

---

## How to say this externally

Describe SSTIM as **symbolic** AI infrastructure — ontology, knowledge graph,
validation — that can *ground* LLMs and agents. Never as an LLM, as machine
learning, or as an autonomous AI in itself.

| Term | Use | Notes |
|---|---|---|
| Symbolic AI | Recommended | Accurately describes ontologies, knowledge graphs, rules, and formal reasoning. |
| Expert symbolic reasoning | Recommended | Emphasises that the knowledge is expert-authored and machine-actionable. |
| Automated reasoning | Recommended | For OWL/RDFS inference, SPARQL query expansion, SHACL validation, and rule-like checks. |
| Expert automated reasoning | Acceptable | Less standard, but defensible for automated reasoning over an expert-authored model. |
| Expert AI agents | Conditional | Only when an actual agentic system uses SSTIM to retrieve, reason, validate, and act. |
| Expert LLM agents | Conditional | Only when the agent contains an LLM and uses SSTIM as a grounding/validation layer. |
| Expert automated agents | Avoid | Less idiomatic and less precise than "AI agents" or "LLM-grounded agent workflows". |

**General:** SSTIM is a semantic ontology and knowledge graph that enables expert
symbolic reasoning, automated validation, and LLM-grounded AI workflows for
sensory stimulation data.

**Technical audience:** SSTIM provides the symbolic knowledge layer for hybrid AI
systems — OWL/SKOS semantics, SHACL constraints, SPARQL-queryable relations,
evidence tiers, and provenance metadata that can ground LLMs and AI agents.

**Non-technical audience:** SSTIM turns expert knowledge about sensory
stimulation into a structured, machine-readable form that AI systems can search,
check, explain, and use more reliably.

Keep all health and wellness phrasing inside [`SCOPE.md`](SCOPE.md)
(`CLAUDE.md` §3.5).
